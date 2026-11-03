import "server-only";

/**
 * Server-owned game rules (spec 6.2). The client never computes XP or levels;
 * it only renders what these rules produced.
 */
export const XP_RULES = {
  missionComplete: 20,
  goalMet: 10,
  goalPartial: 5,
  reviewDone: 5,
} as const;

/** Cumulative XP needed to reach each level. Index 0 = level 1. */
export const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200] as const;

export const PROMPT_VERSIONS = {
  partner: "partner.v1",
  feedback: "feedback-prompt.v1",
} as const;

/** Below this much user speech we hold scores instead of guessing (spec 4.5). */
export const INSUFFICIENT_DATA = {
  minUserTurns: 2,
  minUserWords: 8,
} as const;

/** Skill observations below this confidence are stored but excluded from trends. */
export const SKILL_CONFIDENCE_FLOOR = 0.5;

export const AUTH_SESSION_DAYS = 30;
export const AUTH_COOKIE = "eq_session";

export const TURN_RATE_LIMIT = { windowMs: 60_000, max: 20 } as const;

export const MAX_TURNS_PER_SESSION = 40;

export function levelForXp(totalXp: number) {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  const currentFloor = LEVEL_THRESHOLDS[level - 1];
  const next = LEVEL_THRESHOLDS[level] ?? null;
  return {
    level,
    currentFloor,
    nextThreshold: next,
    xpIntoLevel: totalXp - currentFloor,
    xpForNext: next === null ? null : next - currentFloor,
  };
}
