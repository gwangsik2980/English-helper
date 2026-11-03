import { describe, expect, it } from "vitest";
import { KEY_EXPRESSIONS } from "@/server/missions/key-expressions";
import { patternPieces, usedPatterns, usesPattern } from "@/shared/expressions";

describe("expression patterns", () => {
  it("splits on fill-in marks and alternatives", () => {
    expect(patternPieces("Could I get ~?")).toEqual([["could i get"]]);
    expect(patternPieces("Would you mind ~ing?")).toEqual([["would you mind"]]);
    expect(patternPieces("for here / to go")).toEqual([["for here"], ["to go"]]);
    expect(patternPieces("I've had ~ for")).toEqual([["i've had", "for"]]);
    expect(patternPieces("Something came up")).toEqual([["something came up"]]);
  });

  it("matches whole words in order, ignoring case and punctuation", () => {
    expect(usesPattern("Hi! Could I get a latte, please?", "Could I get ~?")).toBe(true);
    expect(usesPattern("could i GET an americano", "Could I get ~?")).toBe(true);
    expect(usesPattern("I’ve had a cough for three days.", "I've had ~ for")).toBe(true);
    expect(usesPattern("For three days I've had a cough", "I've had ~ for")).toBe(false);
    expect(usesPattern("Would you mind turning it down?", "Would you mind ~ing?")).toBe(true);
    expect(usesPattern("I want a latte", "Could I get ~?")).toBe(false);
    // "go" inside "going" is not "to go".
    expect(usesPattern("I'm going to stay", "for here / to go")).toBe(false);
    expect(usedPatterns(["To go, please."], ["for here / to go", "That's all, thanks"])).toEqual([true, false]);
  });

  it("every mission example actually uses its own expression", () => {
    for (const [slug, list] of Object.entries(KEY_EXPRESSIONS)) {
      for (const e of list) {
        expect(usesPattern(e.example, e.en), `${slug}: ${e.en}`).toBe(true);
      }
    }
  });
});
