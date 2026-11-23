// Request validation. Port of BadRequest, _clean_text() and parse_ask() in server.py.
import { HISTORY_ITEM_MAX_CHARS, HISTORY_MAX_ITEMS, QUESTION_MAX_CHARS } from "./generated";
import type { HistoryItem } from "./knowledge";
import { S, cpLen, cpSlice, dictGet, isDict, pyJsonLoads, pyNfc, pyStrip } from "./pytext";

export class BadRequest extends Error {}

const CONTROL = /[\x00-\x1f\x7f]/g;
const SPACE_RUN = new RegExp(`[${S}]+`, "gu");

export function cleanText(s: string): string {
  return pyStrip(pyNfc(s).replace(CONTROL, " ").replace(SPACE_RUN, " "));
}

export function parseAsk(body: Uint8Array): { question: string; history: HistoryItem[] } {
  let data: unknown;
  try {
    // fatal: bytes that are not UTF-8 are an error. ignoreBOM: a byte order mark stays in the text and
    // fails the JSON parse, as it does in Python's json.loads(body.decode("utf-8")).
    data = pyJsonLoads(new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body));
  } catch {
    throw new BadRequest("The request body is not valid JSON.");
  }
  if (!isDict(data)) throw new BadRequest("The request body must be a JSON object.");
  const rawQuestion = dictGet(data, "question");
  if (typeof rawQuestion !== "string") throw new BadRequest("Send a question as text.");
  const question = cleanText(rawQuestion);
  if (!question) throw new BadRequest("The question is empty.");
  if (cpLen(question) > QUESTION_MAX_CHARS) {
    throw new BadRequest(`The question is longer than ${QUESTION_MAX_CHARS} characters.`);
  }
  const history: HistoryItem[] = [];
  const raw = dictGet(data, "history");
  if (Array.isArray(raw)) {
    for (const item of raw.slice(-HISTORY_MAX_ITEMS)) {
      if (!isDict(item)) continue;
      const role = dictGet(item, "role");
      const rawText = dictGet(item, "text");
      if ((role !== "user" && role !== "assistant") || typeof rawText !== "string") continue;
      const text = cpSlice(cleanText(rawText), HISTORY_ITEM_MAX_CHARS);
      if (text) history.push({ role, text });
    }
  }
  return { question, history };
}
