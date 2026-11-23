// The HTTP side of POST /api/ask: the checks server.py's Handler makes before a question is answered,
// and the status codes and JSON bodies the page script (public/js/ask.js) depends on.
// Port of Handler.do_POST, _same_origin, _get, _other, _json and _send in server.py.
//
// Nothing here imports from "next": app/api/ask/route.ts hands in the headers, the body and the
// environment, and turns the Reply into a Response.
import { EMAIL, KNOWLEDGE_MD, MAX_BODY_BYTES } from "./generated";
import { Knowledge } from "./knowledge";
import type { HistoryItem } from "./knowledge";
import { Limits } from "./limits";
import { Assistant, parseModels } from "./model";
import type { Answer } from "./model";
import { cpSlice, pyJson, pyLower, pyStrip } from "./pytext";
import { BadRequest, parseAsk } from "./request";

export interface Reply {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface AskRequest {
  /** A request header by name (any case), or null when it was not sent. */
  header(name: string): string | null;
  /** The whole request body. */
  body(): Promise<Uint8Array>;
}

export interface AskEnv {
  /** process.env.GEMINI_API_KEY, read when the request arrives. Never logged, never returned. */
  key: string | undefined;
  /** process.env.GEMINI_MODELS: an optional "name[:thinking],..." list, cheapest first. */
  models: string | undefined;
  /** process.env.ASK_LOG_QUESTIONS === "1": also log the question text (off by default). */
  logQuestions: boolean;
  /** One line per request. The key and the request body are never part of it. */
  log: (line: string) => void;
}

/** The state one server instance keeps between questions: rate limits, model cooldowns, the parsed knowledge. */
export interface Service {
  kb: Knowledge;
  limits: Limits;
  assistant: Assistant;
}

let shared: Service | undefined;

export function sharedService(): Service {
  if (!shared) {
    const kb = new Knowledge(KNOWLEDGE_MD);
    const limits = new Limits();
    shared = { kb, limits, assistant: new Assistant(kb, limits) };
  }
  return shared;
}

function send(status: number, body: string, contentType: string, headers: Record<string, string> = {}): Reply {
  return { status, body, headers: { "Content-Type": contentType, "X-Content-Type-Options": "nosniff", ...headers } };
}

function json(status: number, obj: Record<string, string | number | null>, headers: Record<string, string> = {}): Reply {
  return send(status, pyJson(obj), "application/json; charset=utf-8", { "Cache-Control": "no-store", ...headers });
}

/** GET and HEAD on /api/ask. */
export function replyToGet(): Reply {
  return json(405, { error: "Use POST /api/ask." }, { Allow: "POST" });
}

/** PUT, DELETE, PATCH and OPTIONS. */
export function replyToOtherMethod(): Reply {
  return send(405, "Method not allowed\n", "text/plain; charset=utf-8", { Allow: "GET, HEAD, POST" });
}

/**
 * The address the rate limit counts by. On Vercel the platform sets X-Forwarded-For to the visitor's
 * address, so the first entry is used. Without a usable header every caller shares one bucket, which
 * errs on the strict side.
 */
export function clientIp(forwardedFor: string | null): string {
  const first = pyStrip((forwardedFor ?? "").split(",")[0]);
  return first && first.length <= 64 ? first : "unknown";
}

/** The scheme and netloc Python's urlsplit() finds; null where it raises ValueError. */
function splitOrigin(value: string): { scheme: string; netloc: string } | null {
  let url = value.replace(/^[\x00-\x20]+/, "").replace(/[\t\r\n]/g, "");
  let scheme = "";
  const colon = url.indexOf(":");
  if (colon > 0 && /^[a-zA-Z][a-zA-Z0-9+.\-]*$/.test(url.slice(0, colon))) {
    scheme = url.slice(0, colon).toLowerCase();
    url = url.slice(colon + 1);
  }
  let netloc = "";
  if (url.startsWith("//")) {
    const end = url.slice(2).search(/[/?#]/);
    netloc = end < 0 ? url.slice(2) : url.slice(2, 2 + end);
    if (netloc.includes("[") !== netloc.includes("]")) return null;           // "Invalid IPv6 URL"
    if (/[^\x00-\x7f]/.test(netloc)) {                                        // urllib's _checknetloc
      const bare = netloc.replace(/[@:#?]/g, "");
      const folded = bare.normalize("NFKC");
      if (folded !== bare && /[/?#@:]/.test(folded)) return null;
    }
  }
  return { scheme, netloc };
}

/** True unless a browser says the request comes from another site. */
function sameOrigin(req: AskRequest): boolean {
  const host = pyLower(pyStrip(req.header("host") ?? ""));
  // server.py also refuses any Host that is not a loopback name while it is bound to loopback (its
  // guard against DNS rebinding on a developer's machine). A public deployment is not bound to
  // loopback, and server.py skips that check in the same situation.
  const site = pyLower(pyStrip(req.header("sec-fetch-site") ?? ""));
  if (site && site !== "same-origin" && site !== "none") return false;
  const origin = req.header("origin");
  if (origin === null) return true;                               // not a browser cross-origin request
  const o = splitOrigin(pyLower(pyStrip(origin)));
  return o !== null && (o.scheme === "http" || o.scheme === "https") && o.netloc !== "" && o.netloc === host;
}

/** json.dumps(text, ensure_ascii=True) */
function asciiJson(text: string): string {
  return JSON.stringify(text).replace(/[^\x20-\x7e]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
}

function stamp(d: Date): string {
  const two = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
}

/** POST /api/ask. `ip` is the address the rate limit counts by (see clientIp). */
export async function replyToPost(req: AskRequest, ip: string, env: AskEnv, service: Service = sharedService()): Promise<Reply> {
  const t0 = Date.now();
  const logLine = (status: number, source = "api", model: string | null = null, extra = ""): void => {
    env.log(`${stamp(new Date())} ${status} ${source} ${model ?? "-"} ${Date.now() - t0}ms POST /api/ask${extra}`);
  };
  const fail = (status: number, message: string, extra: Record<string, number> = {}, headers: Record<string, string> = {}): Reply => {
    logLine(status);
    return json(status, { error: message, ...extra }, headers);
  };

  if (!sameOrigin(req)) return fail(403, "Questions are only accepted from this site's own pages.");
  const contentType = pyLower(pyStrip((req.header("content-type") ?? "").split(";")[0]));
  if (contentType !== "application/json") return fail(400, "Send the question as JSON (Content-Type: application/json).");
  const rawLength = pyStrip(req.header("content-length") ?? "");
  const length = /^[0-9]+$/.test(rawLength) ? Number(rawLength) : -1;
  if (length < 0 || req.header("transfer-encoding")) return fail(400, "Send a Content-Length header with the question.");
  if (length > MAX_BODY_BYTES) return fail(400, `The request is larger than ${Math.floor(MAX_BODY_BYTES / 1024)} KB.`);
  let body: Uint8Array;
  try {
    body = await req.body();
  } catch {
    return fail(400, "The request body was cut short.");
  }
  if (body.length !== length) return fail(400, "The request body was cut short.");

  let question: string;
  let history: HistoryItem[];
  try {
    ({ question, history } = parseAsk(body));
  } catch (e) {
    if (e instanceof BadRequest) return fail(400, e.message);
    throw e;
  }

  const check = service.limits.checkClient(ip);
  if (!check.allowed) {
    return fail(429, check.sentence, { retry_after: check.retryAfter }, { "Retry-After": String(check.retryAfter) });
  }

  let result: Answer;
  try {
    result = await service.assistant.ask(question, history, pyStrip(env.key ?? ""), parseModels(env.models));
  } catch (e) {                                                   // never leak a stack trace to the client
    env.log(`error: ask failed with ${e instanceof Error ? e.name : "Error"}`);
    return fail(500, `The assistant hit an internal error. Try again, or email ${EMAIL}.`);
  }
  logLine(200, result.source, result.model, env.logQuestions ? ` q=${asciiJson(cpSlice(question, 200))}` : "");
  return json(200, { answer: result.answer, source: result.source, model: result.model });
}
