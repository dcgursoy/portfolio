// POST /api/ask: the "Ask me anything" assistant the pages in public/ call (public/js/ask.js).
// A thin adapter: everything it does is in lib/ask/, which is a port of the site's local Python server.
import { clientIp, replyToGet, replyToOtherMethod, replyToPost } from "../../../lib/ask/handler";
import type { Reply } from "../../../lib/ask/handler";

export const runtime = "nodejs";            // the limits and model cooldowns live in this process's memory
export const dynamic = "force-dynamic";     // never prerendered, never cached
export const maxDuration = 30;              // seconds: the model chain may use 18, and the page waits 30

function respond(reply: Reply, withBody = true): Response {
  const bytes = new TextEncoder().encode(reply.body);
  return new Response(withBody ? bytes : null, {
    status: reply.status,
    headers: { ...reply.headers, "Content-Length": String(bytes.length) },
  });
}

export async function POST(request: Request): Promise<Response> {
  const headers = request.headers;
  let contentLength = headers.get("content-length");
  let body: Uint8Array | undefined;
  // The handler refuses a request without a Content-Length header, as the Python server does. Over plain
  // HTTP a request with neither Content-Length nor Transfer-Encoding has no body, so the next lines change
  // nothing there. They only matter if a host hands this function a body after dropping both headers:
  // the length the handler checks is then the length of what arrived.
  if (contentLength === null && headers.get("transfer-encoding") === null) {
    body = new Uint8Array(await request.arrayBuffer());
    if (body.length > 0) contentLength = String(body.length);
  }
  const reply = await replyToPost(
    {
      header: (name) => (name.toLowerCase() === "content-length" ? contentLength : headers.get(name)),
      body: async () => body ?? new Uint8Array(await request.arrayBuffer()),
    },
    clientIp(headers.get("x-forwarded-for")),
    {
      // Read from the environment for each request, here and nowhere else. Never logged, never returned.
      key: process.env.GEMINI_API_KEY,
      models: process.env.GEMINI_MODELS,
      logQuestions: process.env.ASK_LOG_QUESTIONS === "1",
      log: (line) => console.log(line),
    },
  );
  return respond(reply);
}

export function GET(): Response {
  return respond(replyToGet());
}

export function HEAD(): Response {
  return respond(replyToGet(), false);
}

function other(): Response {
  return respond(replyToOtherMethod());
}

export { other as PUT, other as DELETE, other as PATCH, other as OPTIONS };
