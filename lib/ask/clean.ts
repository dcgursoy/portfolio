// Output hygiene. Port of allowed_target() and clean_answer() in server.py, with the regular
// expressions translated one by one (the Python original is quoted above each).
import { ANSWER_MAX_CHARS, EMAIL, GITHUB, HAS_PROJECT_PAGES, LINKEDIN, PROJECT_PAGES } from "./generated";
import { sentenceEnds } from "./knowledge";
import { D, S, W, ci, cpLen, cpSlice, pyLower, pyNfc, pyStrip } from "./pytext";

const re = (source: string, flags = "u"): RegExp => new RegExp(source, flags);
const R = String.raw;

// MD_LINK = \[([^\[\]\n]{1,200})\]\(\s*<?((?:[^()\s<>]|\([^()\s<>]*\)){1,300})>?(?:\s+\"[^\"]*\")?\s*\)
export const MD_LINK = R`\[([^\[\]\n]{1,200})\]\([${S}]*<?((?:[^()${S}<>]|\([^()${S}<>]*\)){1,300})>?(?:[${S}]+"[^"]*")?[${S}]*\)`;
// LIST_MARK = ^\s*(?:[-*+•]\s+|\d{1,2}[.)]\s+)
export const LIST_MARK = re(R`^[${S}]*(?:[\-*+\u{2022}][${S}]+|[${D}]{1,2}[.)][${S}]+)`);
// EMOJI = [\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0000FE0F\U0000200D\U00002B50\U00002B06\U00002705]
const EMOJI = re(R`[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}\u{2B50}\u{2B06}\u{2705}]`, "gu");
// PHONE = (?<![\w.])(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\w.])
const PHONE = re(
  R`(?<![${W}.])(?:\+?1[${S}.\-]?)?\(?[${D}]{3}\)?[${S}.\-][${D}]{3}[${S}.\-][${D}]{4}(?![${W}.])`, "gu");

// (?:\.{0,2}/)?(projects/[a-z0-9][a-z0-9-]*\.html)            re.fullmatch
const TARGET_PAGE = re(R`^(?:\.{0,2}/)?(projects/[a-z0-9][a-z0-9-]*\.html)$`);
// https://github\.com/dcgursoy((?:/[A-Za-z0-9._-]+)*)/?         re.fullmatch
const TARGET_GITHUB = re(R`^https://github\.com/dcgursoy((?:/[A-Za-z0-9._\-]+)*)/?$`);
// https://(?:www\.)?linkedin\.com/in/dgursoy/?                 re.fullmatch, re.I
const TARGET_LINKEDIN = re(`^${ci("https://")}(?:${ci("www.")})?${ci("linkedin.com/in/dgursoy")}/?$`);

/** Return the canonical link target if it is one the site may link to, else null. */
export function allowedTarget(raw: string, pages: ReadonlySet<string>): string | null {
  const t = pyStrip(raw);
  let m = TARGET_PAGE.exec(t);
  if (m) {
    const target = "/" + m[1];
    if (pages.size && !pages.has(target)) return null;             // a page the site's text never names
    // server.py looks for the file on disk. Here the list of pages the export copied stands in for the disk.
    if (HAS_PROJECT_PAGES && !PROJECT_PAGES.has(target)) return null;   // named, but not built yet: no dead links
    return target;
  }
  if (pyLower(t) === "mailto:" + EMAIL) return "mailto:" + EMAIL;
  m = TARGET_GITHUB.exec(t);
  if (m) {
    if (m[1].split("/").some((seg) => seg === "." || seg === "..")) return null;
    return GITHUB + m[1];
  }
  if (TARGET_LINKEDIN.test(t)) return LINKEDIN;
  return null;
}

const CONTROL_BUT_NEWLINE = /[\x00-\x09\x0b-\x1f\x7f]/g;
// ```[a-zA-Z0-9_-]*
const FENCE = /```[a-zA-Z0-9_-]*/gu;
// !\[([^\]\n]*)\]\([^)\n]*\)
const IMAGE = /!\[([^\]\n]*)\]\([^)\n]*\)/gu;
// [\[\]()\n*_]
const LABEL_JUNK = /[\[\]()\n*_]/gu;
// <(https?://[^<>\s]+|mailto:[^<>\s]+)>
const AUTOLINK = re(R`<(https?://[^<>${S}]+|mailto:[^<>${S}]+)>`, "gu");
// </?[a-zA-Z][a-zA-Z0-9_]*(?:\s[^<>]*)?>
const TAG = re(R`</?[a-zA-Z][a-zA-Z0-9_]*(?:[${S}][^<>]*)?>`, "gu");
// ^\s{0,3}#{1,6}\s+
const HEADING_MARK = re(R`^[${S}]{0,3}#{1,6}[${S}]+`);
// ^\s*>\s?
const QUOTE_MARK = re(R`^[${S}]*>[${S}]?`);
// [-*_=\s]{3,}                                                   re.fullmatch
const RULE = re(R`^[\-*_=${S}]{3,}$`);
// [.?!:;,]$
const ENDS_WITH_PUNCTUATION = /[.?!:;,]$/u;
// \*\*(.+?)\*\*   __(.+?)__   ~~(.+?)~~                           (Python's . is anything but "\n")
const BOLD_STARS = /\*\*([^\n]+?)\*\*/gu;
const BOLD_UNDERSCORES = /__([^\n]+?)__/gu;
const STRIKE = /~~([^\n]+?)~~/gu;
// (?<![\w*])\*(?!\s)([^*]+?)(?<!\s)\*(?![\w*])
const ITALIC_STAR = re(R`(?<![${W}*])\*(?![${S}])([^*]+?)(?<![${S}])\*(?![${W}*])`, "gu");
// (?<![\w_])_(?!\s)([^_]+?)(?<!\s)_(?![\w_])
const ITALIC_UNDERSCORE = re(R`(?<![${W}])_(?![${S}])([^_]+?)(?<![${S}])_(?![${W}])`, "gu");
// \s*—\s*      (?<=\w)–(?=\w)      \s*–\s*
const EM_DASH = re(R`[${S}]*\u{2014}[${S}]*`, "gu");
const EN_DASH_RANGE = re(R`(?<=[${W}])\u{2013}(?=[${W}])`, "gu");
const EN_DASH = re(R`[${S}]*\u{2013}[${S}]*`, "gu");
// (?:mailto:)? + re.escape(EMAIL)                                 re.I
const EMAIL_TEXT = re(`(?:${ci("mailto:")})?${ci(EMAIL)}`, "gu");
// https://(?:github\.com/dcgursoy|(?:www\.)?linkedin\.com/in/dgursoy)[A-Za-z0-9._/-]*
const PROFILE_URL = re(R`https://(?:github\.com/dcgursoy|(?:www\.)?linkedin\.com/in/dgursoy)[A-Za-z0-9._/\-]*`, "gu");
// (?<![\w/.])/projects/[a-z0-9][a-z0-9-]*\.html
const BARE_PAGE = re(R`(?<![${W}/.])/projects/[a-z0-9][a-z0-9\-]*\.html`, "gu");
// [ \t\f\v]+
const BLANKS = /[ \t\f\v]+/gu;
// \s+([,.;:?])(?=\s|$)
const SPACE_BEFORE_PUNCTUATION = re(R`[${S}]+([,.;:?])(?=[${S}]|$)`, "gu");
// (?<!\.)\.\.(?!\.)
const DOUBLE_DOT = /(?<!\.)\.\.(?!\.)/gu;
// ,\s*\.
const COMMA_DOT = re(R`,[${S}]*\.`, "gu");
// \x00(\d+)\x00   (only this function writes these markers, always with ASCII digits)
const HELD = /\x00([0-9]+)\x00/gu;

/** Strip markdown except allow-listed links, tidy punctuation, cap the length. */
export function cleanAnswer(input: string | null | undefined, pages: ReadonlySet<string>): string {
  let text = pyNfc(input || "");
  text = text.replace(CONTROL_BUT_NEWLINE, "");
  text = text.replace(FENCE, " ").replaceAll("`", "");
  text = text.replace(IMAGE, "$1");

  const links: Array<[label: string, target: string]> = [];

  const hold = (label: string, target: string): string => {
    label = cpSlice(pyStrip(label.replace(LABEL_JUNK, "")), 80) || target;
    links.push([label, target]);
    return `\x00${links.length - 1}\x00`;
  };

  text = text.replace(re(MD_LINK, "gu"), (_all: string, label: string, raw: string) => {
    const target = allowedTarget(raw, pages);
    return target ? hold(label, target) : label;
  });
  text = text.replace(AUTOLINK, "$1");
  text = text.replace(TAG, " ");

  const lines: string[] = [];
  for (let line of text.split("\n")) {
    const wasItem = LIST_MARK.test(line);
    line = line.replace(HEADING_MARK, "");
    line = line.replace(QUOTE_MARK, "");
    line = pyStrip(line.replace(LIST_MARK, ""));
    if (!line || RULE.test(line)) continue;
    if (wasItem && !ENDS_WITH_PUNCTUATION.test(line)) line += ".";
    lines.push(line);
  }
  text = lines.join(" ");

  text = text.replace(BOLD_STARS, "$1");
  text = text.replace(BOLD_UNDERSCORES, "$1");
  text = text.replace(STRIKE, "$1");
  text = text.replace(ITALIC_STAR, "$1");
  text = text.replace(ITALIC_UNDERSCORE, "$1");
  text = text.replaceAll("**", "");

  text = text.replace(EM_DASH, ", ");                           // em dash
  text = text.replace(EN_DASH_RANGE, " to ");                   // 10–20, Jun–Aug
  text = text.replace(EN_DASH, ", ");                           // spaced en dash
  text = text.replace(/!+/gu, ".");
  text = text.replace(EMOJI, "");
  text = text.replace(PHONE, "[not published]");                // belt and braces: no phone number leaves here

  // contact details and page paths written as plain text become links
  text = text.replace(EMAIL_TEXT, () => hold(EMAIL, "mailto:" + EMAIL));
  text = text.replace(PROFILE_URL, (all: string) => {
    let url = all;
    let tail = "";
    while (url && ".,;:".includes(url[url.length - 1])) {
      tail = url[url.length - 1] + tail;
      url = url.slice(0, -1);
    }
    const target = allowedTarget(url, pages);
    return target ? hold(target.replace(/^https:\/\/(www\.)?/u, ""), target) + tail : all;
  });
  text = text.replace(BARE_PAGE, (all: string) => {
    const target = allowedTarget(all, pages);
    return target ? hold(all, target) : all;
  });

  text = text.replace(BLANKS, " ");
  text = text.replace(SPACE_BEFORE_PUNCTUATION, "$1");
  text = text.replace(DOUBLE_DOT, ".");
  text = pyStrip(text.replace(COMMA_DOT, "."));

  const expand = (s: string): string =>
    s.replace(HELD, (_all: string, n: string) => `[${links[Number(n)][0]}](${links[Number(n)][1]})`);

  let out = expand(text);
  if (cpLen(out) > ANSWER_MAX_CHARS) {
    let cut: string | null = null;
    const ends = sentenceEnds(text);
    for (let i = ends.length - 1; i >= 0; i--) {
      const candidate = expand(text.slice(0, ends[i]));
      if (cpLen(candidate) <= ANSWER_MAX_CHARS) {
        cut = candidate;
        break;
      }
    }
    if (cut === null || cpLen(cut) < 80) {
      let short = cpSlice(text, ANSWER_MAX_CHARS - 3);
      if (short.includes(" ")) short = short.slice(0, short.lastIndexOf(" "));
      if ((short.split("\x00").length - 1) % 2) short = short.slice(0, short.lastIndexOf("\x00"));
      cut = expand(short).replace(/[ ,;:]+$/u, "") + "...";
    }
    out = cut;
  }
  return pyStrip(out.replaceAll("\x00", ""));
}
