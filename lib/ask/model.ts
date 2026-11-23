// The model: one upstream call, and the chain of models with cooldowns and a time budget.
// Port of parse_models(), _strip_tags(), build_contents() and the Assistant class in server.py.
//
// The API key is passed in per question by the caller. It is sent only in the x-goog-api-key header
// of requests to GEMINI_HOST. It is never logged and never returned, and neither is anything the
// upstream service says in an error.
import { cleanAnswer } from "./clean";
import { fallbackAnswer } from "./fallback";
import {
  COOLDOWN_S, GEMINI_HOST, GEMINI_PATH, MAX_OUTPUT_TOKENS, MAX_OUTPUT_TOKENS_WHEN_THINKING, MODELS,
  MODEL_TIMEOUT_S, SYSTEM_INSTRUCTION, TEMPERATURE, THINKING_FORMS, TOTAL_MODEL_BUDGET_S,
} from "./generated";
import type { ModelSpec, ThinkingConfig } from "./generated";
import type { HistoryItem, Knowledge } from "./knowledge";
import { sentenceEnds } from "./knowledge";
import type { Limits } from "./limits";
import { S, ci, cpLen, dictGet, isDict, pyJsonLoads, pyLower, pyStrip, pyTruthy } from "./pytext";

export type Source = "gemini" | "fallback";
export interface Answer {
  answer: string;
  source: Source;
  model: string | null;
}

export interface Turn {
  role: "user" | "model";
  parts: [{ text: string }];
}

type Failure = "quota" | "auth" | "bad_request" | "gone" | "server" | "blocked" | "empty";
type PostResult = { kind: "ok"; text: string } | { kind: Failure; retry: number | null };

/** What the assistant needs from the outside world. Tests replace these. */
export interface Deps {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  /** The time in seconds, like Python's time.time(). */
  now: () => number;
  /** The local date as YYYY-MM-DD, like datetime.date.today().isoformat(). */
  today: () => string;
}

export function defaultDeps(): Deps {
  return {
    fetch: (url, init) => fetch(url, init),
    now: () => Date.now() / 1000,
    today: () => {
      const d = new Date();
      const two = (n: number): string => String(n).padStart(2, "0");
      return `${String(d.getFullYear()).padStart(4, "0")}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
    },
  };
}

// [A-Za-z0-9][A-Za-z0-9._-]{0,80}                                 re.fullmatch
const MODEL_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/u;

/** GEMINI_MODELS="name[:thinking],..." -> [[name, thinkingConfig or null]]. */
export function parseModels(spec: string | null | undefined): ModelSpec[] {
  if (!spec || !pyStrip(spec)) return [...MODELS];
  const known = new Map<string, ThinkingConfig | null>([...Object.entries(THINKING_FORMS), ...MODELS]);
  const out: ModelSpec[] = [];
  for (const item of spec.split(",")) {
    const stripped = pyStrip(item);
    const colon = stripped.indexOf(":");                         // str.partition(":")
    const name = pyStrip(colon < 0 ? stripped : stripped.slice(0, colon));
    const mode = pyLower(pyStrip(colon < 0 ? "" : stripped.slice(colon + 1)));
    if (!MODEL_NAME.test(name)) continue;
    let cfg: ThinkingConfig | null;
    if (mode === "minimal" || mode === "low" || mode === "medium" || mode === "high") cfg = { thinkingLevel: mode };
    else if (mode === "off") cfg = { thinkingBudget: 0 };
    else if (mode === "default") cfg = null;
    else cfg = known.get(name) ?? null;
    out.push([name, cfg]);
  }
  return out.length ? out : [...MODELS];
}

// </?\s*(?:visitor_question|knowledge|site_excerpts)\s*>          re.I
const WRAPPER_TAG = new RegExp(
  `</?[${S}]*(?:${ci("visitor_question")}|${ci("knowledge")}|${ci("site_excerpts")})[${S}]*>`, "gu");

function stripTags(s: string): string {
  return s.replace(WRAPPER_TAG, " ");
}

export function buildContents(question: string, history: readonly HistoryItem[], excerpts = ""): Turn[] {
  const turns: Turn[] = [];
  for (const item of history) {
    const role = item.role === "assistant" ? "model" : "user";
    let text = pyStrip(stripTags(item.text));
    if (!text || (!turns.length && role === "model")) continue;
    if (role === "user") text = `<visitor_question>\n${text}\n</visitor_question>`;
    if (turns.length && turns[turns.length - 1].role === role) turns[turns.length - 1].parts[0].text += "\n" + text;
    else turns.push({ role, parts: [{ text }] });
  }
  let final = `<visitor_question>\n${pyStrip(stripTags(question))}\n</visitor_question>`;
  if (excerpts) final = `<site_excerpts>\n${excerpts}\n</site_excerpts>\n${final}`;
  if (turns.length && turns[turns.length - 1].role === "user") turns[turns.length - 1].parts[0].text += "\n" + final;
  else turns.push({ role: "user", parts: [{ text: final }] });
  return turns;
}

/** Up to `limit` bytes of a response body as text; bytes that are not UTF-8 become U+FFFD, as in Python's "replace". */
async function readText(res: Response, limit: number): Promise<string> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = res.body?.getReader();
  if (reader) {
    try {
      while (size < limit) {
        const { done, value } = await reader.read();
        if (done || !value) break;
        chunks.push(value);
        size += value.length;
      }
    } finally {
      reader.cancel().catch(() => undefined);
    }
  }
  const bytes = new Uint8Array(Math.min(size, limit));
  let at = 0;
  for (const c of chunks) {
    const part = c.subarray(0, Math.min(c.length, bytes.length - at));
    bytes.set(part, at);
    at += part.length;
  }
  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
}

/**
 * float(text) for what an HTTP header can hold (ASCII digits, with Python's "_" between digits);
 * null where Python raises ValueError.
 */
function pyFloat(text: string | null): number | null {
  const t = pyStrip(text ?? "");
  const digits = "[0-9]+(?:_[0-9]+)*";
  if (new RegExp(`^[+-]?(?:${digits}\\.?(?:${digits})?|\\.${digits})(?:[eE][+-]?${digits})?$`).test(t)) {
    return Number(t.replaceAll("_", ""));
  }
  const m = /^([+-]?)(inf|infinity|nan)$/i.exec(t);
  if (!m) return null;
  if (m[2].toLowerCase() === "nan") return NaN;
  return m[1] === "-" ? -Infinity : Infinity;
}

// "retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"     (digits are ASCII here: the text is Google's JSON)
const RETRY_DELAY = new RegExp(String.raw`"retryDelay"[${S}]*:[${S}]*"([0-9]+(?:\.[0-9]+)?)s"`, "u");

/**
 * Read a 2xx reply the way server.py does. Where the Python code would raise on an unexpected shape
 * (and so answer the visitor with a 500), this throws too.
 */
function readReply(data: unknown): PostResult {
  const need = (v: unknown, what: string): Record<string, unknown> => {
    if (!isDict(v)) throw new TypeError(`unexpected ${what} in the model's reply`);
    return v;
  };
  const orEmpty = (v: unknown): unknown => (pyTruthy(v) ? v : {});

  if (!isDict(data)) return { kind: "blocked", retry: null };
  if (pyTruthy(dictGet(need(orEmpty(dictGet(data, "promptFeedback")), "promptFeedback"), "blockReason"))) {
    return { kind: "blocked", retry: null };
  }
  const candidates = dictGet(data, "candidates");
  let first: unknown = {};
  if (pyTruthy(candidates)) {
    if (!Array.isArray(candidates)) throw new TypeError("unexpected candidates in the model's reply");
    first = candidates[0];
  }
  const cand = need(orEmpty(first), "candidate");
  const content = need(orEmpty(dictGet(cand, "content")), "content");
  const rawParts = dictGet(content, "parts");
  let parts: unknown[] = [];
  if (pyTruthy(rawParts)) {
    if (Array.isArray(rawParts)) parts = rawParts;
    else if (typeof rawParts !== "string" && !isDict(rawParts)) throw new TypeError("unexpected parts in the model's reply");
    // a string or an object: Python iterates its characters or keys, none of which is a part
  }
  let text = "";
  for (const p of parts) {
    if (!isDict(p) || pyTruthy(dictGet(p, "thought"))) continue;
    const piece = Object.prototype.hasOwnProperty.call(p, "text") ? p.text : "";
    if (typeof piece !== "string") throw new TypeError("unexpected text in the model's reply");
    text += piece;
  }
  text = pyStrip(text);
  const rawFinish = dictGet(cand, "finishReason");
  const finish = pyTruthy(rawFinish) ? rawFinish : "STOP";
  if (finish === "MAX_TOKENS" && text) {
    const ends = sentenceEnds(text);
    text = ends.length ? text.slice(0, ends[ends.length - 1]) : "";
  } else if (finish !== "STOP" && finish !== "MAX_TOKENS") {
    return { kind: "blocked", retry: null };
  }
  if (cpLen(text) < 2) return { kind: "empty", retry: null };
  return { kind: "ok", text };
}

// The cooldowns below live in memory, like the rate limits: on a serverless host each warm instance
// keeps its own, and a new instance starts with none.
export class Assistant {
  private readonly cooldown = new Map<string, number>();
  private keyRefusedUntil = 0.0;
  private readonly noThinkingConfig = new Set<string>();

  constructor(
    private readonly kb: Knowledge,
    private readonly limits: Limits,
    private readonly deps: Deps = defaultDeps(),
  ) {}

  private cool(model: string, kind: string, seconds: number | null): void {
    this.cooldown.set(model, this.deps.now() + (seconds !== null ? seconds : COOLDOWN_S[kind]));
  }

  private isCooling(model: string): boolean {
    return (this.cooldown.get(model) ?? 0) > this.deps.now();
  }

  /** One upstream attempt. */
  private async post(
    key: string, model: string, thinking: ThinkingConfig | null, systemText: string, contents: Turn[], timeoutS: number,
  ): Promise<PostResult> {
    const gen: Record<string, unknown> = { temperature: TEMPERATURE, maxOutputTokens: MAX_OUTPUT_TOKENS };
    if (thinking && Object.keys(thinking).length) gen.thinkingConfig = thinking;
    else if (!model.includes("lite")) gen.maxOutputTokens = MAX_OUTPUT_TOKENS_WHEN_THINKING;
    const payload = { system_instruction: { parts: [{ text: systemText }] }, contents, generationConfig: gen };

    // One deadline for the whole attempt: connecting, the reply's headers and its body.
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutS * 1000);
    let data: unknown;
    try {
      const res = await this.deps.fetch(GEMINI_HOST + GEMINI_PATH.replace("{model}", () => model), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(payload),
        redirect: "manual",            // never follow a redirect: the key header must not travel to another host
        cache: "no-store",
        signal: abort.signal,
      });
      if (res.status < 200 || res.status >= 300) {
        const code = res.status;
        let retry = pyFloat(res.headers.get("retry-after"));
        let detail = "";
        try {
          detail = await readText(res, 8192);
        } catch {
          // the status code alone decides
        }
        const m = RETRY_DELAY.exec(detail);
        if (m) retry = Number(m[1]);
        if (retry !== null) retry = Math.min(Math.max(retry, 5.0), 3600.0);
        if (code === 429) return { kind: "quota", retry };
        if (code === 401 || code === 403 || detail.includes("API_KEY_INVALID") || detail.includes("API key not valid")) {
          return { kind: "auth", retry: null };   // the key itself is refused (Google answers 400 for an invalid key)
        }
        if (code === 400) return { kind: "bad_request", retry: null };
        if (code === 404) return { kind: "gone", retry: null };
        return { kind: "server", retry: null };
      }
      data = pyJsonLoads(await readText(res, 2_000_000));
    } catch {                          // timeout, DNS, TLS, reset, bad JSON
      return { kind: "server", retry: null };
    } finally {
      clearTimeout(timer);
    }
    return readReply(data);
  }

  /** `key` and `models` are read from the environment by the caller for each question. */
  async ask(
    question: string, history: readonly HistoryItem[], key: string | null | undefined, models: readonly ModelSpec[],
  ): Promise<Answer> {
    const kb = this.kb;
    const now = this.deps.now;
    const fallback = (): Answer => ({ answer: cleanAnswer(fallbackAnswer(question, kb), kb.pages), source: "fallback", model: null });

    if (!(key && kb.text) || this.keyRefusedUntil > now()) return fallback();
    const systemText = `${SYSTEM_INSTRUCTION}\nToday's date: ${this.deps.today()}.\n\n<knowledge>\n${kb.overview}\n</knowledge>\n`;
    const contents = buildContents(question, history, kb.excerpts(question, history));
    const deadline = now() + TOTAL_MODEL_BUDGET_S;
    for (const [model, configured] of models) {
      if (this.isCooling(model)) continue;
      let thinking = this.noThinkingConfig.has(model) ? null : configured;
      let droppedConfig = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        const remaining = deadline - now();
        if (remaining < 1.5 || !this.limits.takeModelCall()) return fallback();
        const result = await this.post(key, model, thinking, systemText, contents, Math.min(MODEL_TIMEOUT_S, remaining));
        if (result.kind === "ok") {
          if (droppedConfig) this.noThinkingConfig.add(model);   // remember that this model refuses our thinkingConfig form
          const answer = cleanAnswer(result.text, kb.pages);
          if (cpLen(answer) >= 2) return { answer, source: "gemini", model };
          break;
        }
        if (result.kind === "bad_request" && thinking !== null) {
          // perhaps this model family does not take that thinkingConfig form: retry once without it
          thinking = null;
          droppedConfig = true;
          continue;
        }
        if (result.kind === "auth") {              // no model will take this key: stop asking for a while
          this.keyRefusedUntil = now() + COOLDOWN_S.auth;
          return fallback();
        }
        if (result.kind === "quota" || result.kind === "server" || result.kind === "gone") {
          // Python: detail if kind == "quota" and detail else None  (0 is false there, NaN is not)
          const seconds = result.kind === "quota" && result.retry !== null && result.retry !== 0 ? result.retry : null;
          this.cool(model, result.kind, seconds);
        }
        break;
      }
    }
    return fallback();
  }
}
