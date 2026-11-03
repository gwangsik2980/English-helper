import "server-only";
import { usedPatterns } from "@/shared/expressions";
import { keyExpressionsFor } from "../missions/key-expressions";
import { listPhrases } from "./phrases";

/**
 * Which of the mission's key expressions and the learner's own phrasebook
 * entries show up in the learner's lines. Plain text matching over the
 * stored transcript (see shared/expressions.ts), so nothing here comes
 * from model output.
 */
export async function expressionUsage(userId: string, missionSlug: string, learnerLines: string[]) {
  const key = keyExpressionsFor(missionSlug);
  const keyUsed = usedPatterns(learnerLines, key.map((e) => e.en));
  const phrases = await listPhrases(userId);
  const phraseUsed = usedPatterns(learnerLines, phrases.map((p) => p.phrase));
  return {
    key: key.map((e, i) => ({ ...e, used: keyUsed[i] })),
    myPhrasesUsed: phrases.filter((_, i) => phraseUsed[i]).map(({ phrase, meaningKo }) => ({ phrase, meaningKo })),
    myPhraseCount: phrases.length,
  };
}
