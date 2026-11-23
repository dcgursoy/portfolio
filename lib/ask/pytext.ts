// Python's view of text, for the port of server.py.
//
// server.py is written against Python's str and re. JavaScript differs in ways that change results:
//   \s   Python also counts U+001C to U+001F and U+0085 as whitespace and does not count U+FEFF.
//   \w   Python means any letter or number in any script, plus "_". JavaScript means ASCII only.
//   \d   Python means any decimal digit in any script. JavaScript means 0 to 9.
//   \b   follows \w, so it is written out as lookarounds on the word class below.
//   .    Python stops only at "\n". JavaScript also stops at "\r", U+2028 and U+2029: use [^\n].
//   re.I Python also matches dotless and dotted Turkish i for "i". JavaScript's i flag does not.
//   len  Python counts code points. JavaScript's .length counts UTF-16 units.
//   sum  Python (3.12 and later) adds floats with a compensated sum. A plain loop can differ in the last bit.
//   json Python's json.loads() also reads NaN, Infinity and -Infinity, and refuses very long whole numbers.
// Every pattern ported from server.py is built with the u flag from the pieces below, with no i flag
// (re.I is spelled out letter by letter with ci()) and no m flag (none of server.py's patterns is multiline).
//
// The character classes are not \p{...} properties: those follow the Unicode version of the JavaScript
// engine, which need not be the Unicode version of the Python that runs server.py. The export script
// measures what Python matches and writes the classes into generated.ts.
//
// toLowerCase() and normalize("NFC") follow the engine's Unicode version too. pyLower() and pyNfc() below
// apply them only to runs of characters Python's Unicode version knows, and leave the code points it has
// no character for untouched, as Python does. A newer Unicode version does not change the NFC form of
// older characters, and changes their lower case only in rare cases (none between Unicode 15.1 and 16).
// What remains: an engine with an OLDER Unicode version than Python's would leave some characters alone
// that Python changes.
import {
  PY_DIGIT, PY_IGNORECASE, PY_INT_MAX_STR_DIGITS, PY_LINE_BREAKS, PY_SPACE, PY_UNASSIGNED, PY_WORD,
} from "./generated";

/** Body of a character class: what Python's \s matches. */
export const S = PY_SPACE;
/** Body of a character class: what Python's \w matches (letters and numbers in every script, and "_"). */
export const W = PY_WORD;
/** Body of a character class: what Python's \d matches (decimal digits in every script). */
export const D = PY_DIGIT;

const LEFT = new RegExp(`^[${S}]+`, "u");
const RIGHT = new RegExp(`[${S}]+$`, "u");
const RUN = new RegExp(`[${S}]+`, "u");
const LINE_BREAK = new RegExp(`\\r\\n|[${PY_LINE_BREAKS}]`, "u");

const UNKNOWN_TO_PYTHON = new RegExp(`([${PY_UNASSIGNED}]+)`, "u");

/** `change` applied to each run of characters Python knows; the code points between the runs stay as they are. */
function onKnownRuns(s: string, change: (run: string) => string): string {
  if (!UNKNOWN_TO_PYTHON.test(s)) return change(s);
  // split() with a capturing group: the runs are at the even positions, what separates them at the odd ones
  return s.split(UNKNOWN_TO_PYTHON).map((part, i) => (i % 2 ? part : change(part))).join("");
}

/** str.lower() */
export function pyLower(s: string): string {
  return onKnownRuns(s, (run) => run.toLowerCase());
}

/** unicodedata.normalize("NFC", s) */
export function pyNfc(s: string): string {
  return onKnownRuns(s, (run) => run.normalize("NFC"));
}

/** str.strip() */
export function pyStrip(s: string): string {
  return s.replace(LEFT, "").replace(RIGHT, "");
}

/** str.rstrip() */
export function pyRStrip(s: string): string {
  return s.replace(RIGHT, "");
}

/** str.split() with no argument: the words between runs of whitespace. */
export function pySplit(s: string): string[] {
  const t = pyStrip(s);
  return t ? t.split(RUN) : [];
}

/** str.splitlines() */
export function pySplitLines(s: string): string[] {
  const lines = s.split(LINE_BREAK);
  if (lines[lines.length - 1] === "") lines.pop();   // no empty last line after a final break; "" gives []
  return lines;
}

/** len(s): the number of code points. */
export function cpLen(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < s.length) {
      const d = s.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) i++;
    }
    n++;
  }
  return n;
}

/** s[:end] for end >= 0, counted in code points. */
export function cpSlice(s: string, end: number): string {
  if (end <= 0) return "";
  if (s.length <= end) return s;
  let i = 0;
  for (let n = 0; n < end && i < s.length; n++) {
    const c = s.charCodeAt(i);
    const pair = c >= 0xd800 && c <= 0xdbff && i + 1 < s.length && (s.charCodeAt(i + 1) & 0xfc00) === 0xdc00;
    i += pair ? 2 : 1;
  }
  return s.slice(0, i);
}

/** Regular expression source that matches `literal` the way Python's re.I would. */
export function ci(literal: string): string {
  let out = "";
  for (const ch of literal) {
    const same = PY_IGNORECASE[ch.toLowerCase()];
    out += same ? `[${same}]` : ch.replace(/[\\^$.*+?()[\]{}|]/, "\\$&");
  }
  return out;
}

/** Python's truth value of a JSON value: None, False, 0, "", [] and {} are false. */
export function pyTruthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

/** True for a JSON object (a Python dict). */
export function isDict(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** dict.get(key): own keys only, so "constructor" and the like are not found on a parsed JSON object. */
export function dictGet(d: Record<string, unknown>, key: string): unknown {
  return Object.prototype.hasOwnProperty.call(d, key) ? d[key] : undefined;
}

/** sum() over floats as Python 3.12 and later computes it (Neumaier's compensated sum, as in CPython's sum). */
export function pySum(values: Iterable<number>): number {
  let total = 0;
  let c = 0;
  for (const x of values) {
    const t = total + x;
    c += Math.abs(total) >= Math.abs(x) ? (total - t) + x : (x - t) + total;
    total = t;
  }
  return c && Number.isFinite(c) ? total + c : total;
}

// A JSON string, one of the three constants only Python's json reads, or a number.
const JSON_TOKEN = /"[^"\\]*(?:\\[\s\S][^"\\]*)*"|-?Infinity|NaN|-?[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/g;
const WHOLE_NUMBER = /^-?[0-9]+$/;

/**
 * json.loads(text). JSON.parse reads the same texts with two exceptions, both handled here:
 * Python also reads the constants NaN, Infinity and -Infinity (each becomes an infinite number here:
 * the port only ever asks whether such a value is a string, a list, an object or true), and Python
 * refuses a whole number with more than PY_INT_MAX_STR_DIGITS digits.
 * Throws where Python raises ValueError.
 */
export function pyJsonLoads(text: string): unknown {
  const longNumbers = PY_INT_MAX_STR_DIGITS > 0 && text.length > PY_INT_MAX_STR_DIGITS;
  if (!longNumbers && !text.includes("NaN") && !text.includes("Infinity")) return JSON.parse(text);
  // The spaces keep a replaced constant from joining the text beside it into one number.
  return JSON.parse(text.replace(JSON_TOKEN, (token) => {
    if (token === "NaN" || token === "Infinity") return " 1e999 ";
    if (token === "-Infinity") return " -1e999 ";
    if (longNumbers && WHOLE_NUMBER.test(token) && token.replace("-", "").length > PY_INT_MAX_STR_DIGITS) {
      throw new SyntaxError("a whole number longer than Python's json.loads() accepts");
    }
    return token;
  }));
}

/** json.dumps(obj, ensure_ascii=False) for a flat object: the same bytes Python writes. */
export function pyJson(obj: Record<string, string | number | null>): string {
  return "{" + Object.entries(obj).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(", ") + "}";
}
