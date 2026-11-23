// The knowledge text: sections, the shortened overview the model is given, and the keyword search
// that picks full sections for a question. Port of tokens(), Section, split_sections(), head_of()
// and the Knowledge class in server.py.
//
// One difference from server.py: the text does not come from a file that is re-read when it changes.
// It is the KNOWLEDGE_MD string the export script wrote, parsed once per server instance.
import {
  EXCERPT_MAX_CHARS, EXCERPT_SECTIONS, IDF_BY_COUNT, IDF_SECTIONS, KNOWLEDGE_MAX_CHARS, OVERVIEW_SECTION_CHARS,
  STOP_WORDS,
} from "./generated";
import { S, W, cpLen, cpSlice, pyLower, pyRStrip, pySplitLines, pyStrip } from "./pytext";

export interface HistoryItem {
  role: "user" | "assistant";
  text: string;
}

// SENTENCE_END = [.?!][\"')\]]?(?=\s|$)   ($ is the end of the text: no caller passes a trailing newline)
const SENTENCE_END = String.raw`[.?!]["')\]]?(?=[${S}]|$)`;
// PAGE_PATH = /projects/[a-z0-9][a-z0-9-]*\.html
export const PAGE_PATH = String.raw`/projects/[a-z0-9][a-z0-9-]*\.html`;

/** The offset just past each sentence end in `text` (the m.end() of SENTENCE_END.finditer). */
export function sentenceEnds(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(new RegExp(SENTENCE_END, "gu"))) out.push((m.index ?? 0) + m[0].length);
  return out;
}

// \bCAN\b and \bcan[\s-]+(?=bus|network|frame|node|message|fd): \b beside a letter is "no word character on that side"
const CAN_UPPER = new RegExp(String.raw`(?<![${W}])CAN(?![${W}])`, "gu");
const CAN_LOWER = new RegExp(String.raw`(?<![${W}])can[${S}\-]+(?=bus|network|frame|node|message|fd)`, "gu");

export function tokens(text: string): string[] {
  text = text.replace(CAN_UPPER, " canbus ");                    // the bus, not the verb
  text = pyLower(text).replaceAll("c++", " cpp ");
  text = text.replace(CAN_LOWER, " canbus ");
  const out: string[] = [];
  for (let w of text.match(/[a-z0-9]+/g) ?? []) {
    if (STOP_WORDS.has(w)) continue;
    if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);   // tests -> test
    if (w.length > 1 && !STOP_WORDS.has(w)) out.push(w);
  }
  return out;
}

export class Section {
  readonly page: string | null;
  readonly headTokens: Set<string>;
  readonly bodyTokens: Set<string>;
  cut = false;

  constructor(readonly level: number, readonly title: string, readonly body: string) {
    const m = new RegExp(PAGE_PATH, "u").exec(body);
    this.page = m ? m[0] : null;
    this.headTokens = new Set(tokens(title));
    this.bodyTokens = new Set(tokens(body));
  }
}

// ^(#{1,3})\s+(.*?)\s*#*\s*$ on one line of str.splitlines()
const HEADING = new RegExp(String.raw`^(#{1,3})[${S}]+([^\n]*?)[${S}]*#*[${S}]*$`, "u");

/** Every heading in order (levels 1 to 3), each with the text up to the next heading. */
export function splitSections(md: string): Section[] {
  const sections: Section[] = [];
  let level = 0;
  let title = "";
  let body: string[] = [];

  const flush = (): void => {
    const text = pyStrip(body.join("\n"));
    if (title || text) sections.push(new Section(level, title, text));
  };

  for (const line of pySplitLines(md)) {
    const m = HEADING.exec(line);
    if (m && m[2]) {
      flush();
      level = m[1].length;
      title = pyStrip(m[2]);
      body = [];
    } else {
      body.push(line);
    }
  }
  flush();
  return sections;
}

/** The first `limit` characters of a section, ending on a line or sentence boundary. */
export function headOf(body: string, limit: number): string {
  const out: string[] = [];
  let used = 0;
  for (const line of body.split("\n")) {
    const n = cpLen(line);
    if (used + n <= limit) {
      out.push(line);
      used += n + 1;
      continue;
    }
    const room = limit - used;
    if (room > 200) {
      const start = cpSlice(line, room);
      const ends = sentenceEnds(start);
      if (ends.length) out.push(start.slice(0, ends[ends.length - 1]));
    }
    break;
  }
  return pyRStrip(out.join("\n"));
}

export class Knowledge {
  readonly text: string;
  readonly overview: string;
  readonly sections: Section[];
  readonly pages: Set<string>;
  /** True when the text was longer than KNOWLEDGE_MAX_CHARS and was cut (server.py logs a warning). */
  readonly wasCut: boolean;
  private readonly df = new Map<string, number>();

  constructor(raw: string) {
    let text = pyStrip(raw.replaceAll("\r\n", "\n").replaceAll("\r", "\n"));
    this.wasCut = cpLen(text) > KNOWLEDGE_MAX_CHARS;
    if (this.wasCut) text = cpSlice(text, KNOWLEDGE_MAX_CHARS);
    const sections = splitSections(text);
    const parts: string[] = [];
    for (const s of sections) {
      if (s.title) parts.push("#".repeat(Math.max(s.level, 1)) + " " + s.title);
      let body = s.body;
      if (s.level === 3 && cpLen(body) > OVERVIEW_SECTION_CHARS) {
        body = headOf(body, OVERVIEW_SECTION_CHARS) + "\n(continues)";
        s.cut = true;
      }
      if (body) parts.push(body);
      parts.push("");
      for (const t of new Set([...s.headTokens, ...s.bodyTokens])) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
    this.text = text;
    this.sections = sections;
    this.overview = pyStrip(parts.join("\n"));
    this.pages = new Set(text.match(new RegExp(PAGE_PATH, "gu")) ?? []);
  }

  idf(token: string): number {
    const count = this.df.get(token) ?? 0;
    // Math.log and Python's math.log can differ in the last bit. For a text with as many sections as the
    // exported knowledge, the values Python computed are used, so every sum and comparison built on them
    // comes out as it does in server.py.
    if (this.sections.length === IDF_SECTIONS && count < IDF_BY_COUNT.length) return IDF_BY_COUNT[count];
    return Math.log(1 + Math.max(this.sections.length, 1) / Math.max(count, 0.5));
  }

  score(section: Section, weights: ReadonlyMap<string, number>): number {
    let total = 0.0;
    for (const [t, w] of weights) {
      if (section.headTokens.has(t)) total += 2.5 * w * this.idf(t);
      else if (section.bodyTokens.has(t)) total += w * this.idf(t);
    }
    return total;
  }

  /** Full text of the shortened sections that best match the question (and the turn before it). */
  excerpts(question: string, history: readonly HistoryItem[]): string {
    const weights = new Map<string, number>();
    for (const t of tokens(question)) weights.set(t, 1.0);
    const lastTwo = history.slice(-2).reverse();
    [0.4, 0.5].forEach((w, i) => {
      if (i >= lastTwo.length) return;
      for (const t of tokens(lastTwo[i].text)) if (!weights.has(t)) weights.set(t, w);
    });
    if (!weights.size) return "";
    const scored = this.sections.filter((s) => s.title && s.body).map((s) => ({ sc: this.score(s, weights), s }));
    const best = scored.reduce((m, x) => Math.max(m, x.sc), scored.length ? -Infinity : 0.0);
    if (best < 1.0) return "";
    const picked = scored
      .filter((x) => x.s.cut && x.sc >= 0.6 * best)
      .sort((a, b) => b.sc - a.sc)                                // stable, like sorted(key=-score)
      .slice(0, EXCERPT_SECTIONS);
    return picked.map((x) => `### ${x.s.title}\n${cpSlice(x.s.body, EXCERPT_MAX_CHARS)}`).join("\n\n");
  }
}
