// The scripted fallback: a plain lookup in the knowledge text, used when no model can answer.
// Port of first_sentences() and fallback_answer() in server.py.
import { allowedTarget, LIST_MARK, MD_LINK } from "./clean";
import {
  ABBREVIATIONS, FALLBACK_ALIASES, FALLBACK_NOTHING, FALLBACK_PREFIX, FALLBACK_PRIVATE,
} from "./generated";
import { Knowledge, Section, sentenceEnds, tokens } from "./knowledge";
import { S, W, ci, cpLen, cpSlice, pyLower, pySplit, pyStrip, pySum } from "./pytext";

// PRIVATE_WORDS = \b(phone|cell ?phone|mobile number|gpa|grades?|salary|home address|birthday|date of birth|how old)\b  re.I
// Every alternative starts and ends with a letter, so each \b is "no word character on that side".
const PRIVATE_WORDS = new RegExp(
  `(?<![${W}])(?:` + [
    ci("phone"), ci("cell") + " ?" + ci("phone"), ci("mobile number"), ci("gpa"), ci("grade") + ci("s") + "?",
    ci("salary"), ci("home address"), ci("birthday"), ci("date of birth"), ci("how old"),
  ].join("|") + `)(?![${W}])`, "u");
// LABEL_LINE = ^[A-Z][A-Za-z ]{0,24}:\s
const LABEL_LINE = new RegExp(String.raw`^[A-Z][A-Za-z ]{0,24}:[${S}]`, "u");
// SKIP_LINE = ^(project page|page|link|links|code|demo|slug|sort)\s*:   re.I
const SKIP_LINE = new RegExp(
  "^(?:" + ["project page", "page", "link", "links", "code", "demo", "slug", "sort"].map(ci).join("|") + `)[${S}]*:`, "u");

const ABBREVIATION_SET = new Set(ABBREVIATIONS);
const ALIASES = new Map(Object.entries(FALLBACK_ALIASES));

export function firstSentences(body: string, limit = 3, maxChars = 420): string {
  const rows: Array<{ isItem: boolean; line: string }> = [];
  for (const raw of body.split("\n")) {
    const line = pyStrip(raw.replace(LIST_MARK, "")).replace(new RegExp(MD_LINK, "gu"), "$1");
    if (line && line !== "(continues)" && !SKIP_LINE.test(line)) rows.push({ isItem: LIST_MARK.test(raw), line });
  }
  if (!rows.length) return "";
  let prose = rows.filter((r) => !r.isItem && pySplit(r.line).length >= 12).map((r) => r.line);      // paragraphs
  if (!prose.length) {
    const plain = rows.filter((r) => !LABEL_LINE.test(r.line)).map((r) => r.line);                     // bullet sentences
    prose = plain.length * 2 >= rows.length ? plain : rows.map((r) => r.line);                         // else "Label: value" lines
  }
  const text = prose.map((x) => (".?!:".includes(x[x.length - 1]) ? x : x + ".")).join(" ");
  let sentences: string[] = [];
  let start = 0;
  for (const end of sentenceEnds(text)) {
    const piece = pyStrip(text.slice(start, end));
    const lastWord = piece.replace(/[.?!"')\]]+$/u, "").split(" ").pop() as string;
    if (ABBREVIATION_SET.has(pyLower(lastWord))) continue;
    sentences.push(piece);
    start = end;
    if (sentences.length >= limit) break;
  }
  if (!sentences.length) sentences = [cpSlice(text, maxChars)];
  let out = "";
  for (let i = 0; i < sentences.length; i++) {
    if (i >= 2 && cpLen(out) + cpLen(sentences[i]) > maxChars) break;
    out = pyStrip(out + " " + sentences[i]);
  }
  return out;
}

export function fallbackAnswer(question: string, kb: Knowledge): string {
  if (PRIVATE_WORDS.test(question)) return FALLBACK_PRIVATE;
  // server.py keeps these words in a Python set, whose order changes from one start of the server to the
  // next. The order can change the last bit of a section's score, and with it which of two sections with
  // equal scores is picked, so server.py itself does not always give the same answer to such a question.
  // The port fixes one order: rarest word first, then alphabetical. Words that are equally rare are then
  // added side by side, two sections that match equally score the same to the last bit, and the first of
  // them in the text wins, which is what server.py does on most of its starts.
  const q = [...new Set(tokens(question).map((t) => ALIASES.get(t) ?? t))];
  q.sort((a, b) => kb.idf(b) - kb.idf(a) || (a < b ? -1 : a > b ? 1 : 0));
  const full = pySum(q.map((t) => kb.idf(t)));
  const weights = new Map<string, number>();
  for (const t of q) weights.set(t, 1.0);
  let best: Section | null = null;
  let bestScore = 0.0;
  for (const s of kb.sections) {
    if (!(s.title && s.body)) continue;
    const score = kb.score(s, weights);
    if (score > bestScore) {
      best = s;
      bestScore = score;
    }
  }
  if (best === null || bestScore < 1.2) return FALLBACK_NOTHING;
  const section = best;
  const matched = pySum(q.filter((t) => section.headTokens.has(t) || section.bodyTokens.has(t)).map((t) => kb.idf(t)));
  if (matched < 0.5 * full) return FALLBACK_NOTHING;   // most of the question is about something the site does not mention
  let out = `${FALLBACK_PREFIX} Under "${best.title}" it says: ${firstSentences(best.body)}`;
  if (best.page && allowedTarget(best.page, kb.pages)) out += ` [Open the project page](${best.page})`;
  return out;
}
