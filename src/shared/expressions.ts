/*
 * Expression patterns and how we tell whether the learner used one.
 *
 * A pattern is written the way a learner would note it down:
 *   "Could I get ~?"              "~" or "..." marks the part you fill in
 *   "Would you mind ~ing?"        "ing" right after "~" is ignored
 *   "for here / to go"            "/" separates alternatives
 * A line counts as using the pattern when every fixed piece of one
 * alternative appears in it, in order. This is a plain text check, not an
 * AI judgement, so it never invents usage that isn't in the transcript.
 */

export type KeyExpression = {
  /** Pattern shown to the learner and used for matching. */
  en: string;
  /** Korean meaning and when to use it. */
  ko: string;
  /** One full example sentence. */
  example: string;
};

export function normalizeForMatch(text: string) {
  return text
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fixed pieces of each alternative, e.g. "Could I get ~?" -> [["could i get"]]. */
export function patternPieces(pattern: string): string[][] {
  return pattern
    .split("/")
    .map((alt) =>
      alt
        .replace(/\([^)]*\)/g, " ")
        .split(/~(?:ing\b)?|\.{2,}|…|\bsth\b|\bsb\b/i)
        .map(normalizeForMatch)
        .filter((p) => p.length > 0),
    )
    .filter((pieces) => pieces.length > 0);
}

function containsInOrder(line: string, pieces: string[]) {
  const padded = ` ${line} `;
  let from = 0;
  for (const piece of pieces) {
    const at = padded.indexOf(` ${piece} `, from);
    if (at < 0) return false;
    from = at + piece.length + 1;
  }
  return true;
}

export function usesPattern(line: string, pattern: string) {
  const text = normalizeForMatch(line);
  return patternPieces(pattern).some((pieces) => containsInOrder(text, pieces));
}

/** Patterns (by index) that appear in any of the learner's lines. */
export function usedPatterns(lines: string[], patterns: string[]) {
  return patterns.map((p) => lines.some((line) => usesPattern(line, p)));
}
