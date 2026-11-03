import "server-only";
import { SKILL_KEYS, SKILL_LABEL_KO, type SkillKey } from "@/shared/schemas/domain";
import { prisma } from "../db";
import { SKILL_CONFIDENCE_FLOOR } from "../config";
import { xpSummary } from "./xp";
import { listRecentSessions } from "./sessions";

const BAND_RANK = { emerging: 1, developing: 2, proficient: 3 } as const;
type Band = keyof typeof BAND_RANK;
export const BAND_LABEL_KO: Record<Band, string> = {
  emerging: "시작 단계",
  developing: "성장 중",
  proficient: "능숙",
};

export type SkillTrend = {
  skill: SkillKey;
  labelKo: string;
  observations: number;
  excludedLowConfidence: number;
  latestBand: Band | null;
  trend: "up" | "flat" | "down" | "unknown";
  history: { band: Band; at: string }[];
};

/**
 * Skill view shows a trend plus how many observations back it up, never a
 * single authoritative score (spec 4.2, 4.6). Fewer than 2 observations => "unknown".
 */
export async function skillTrends(userId: string): Promise<SkillTrend[]> {
  const rows = await prisma.skillObservation.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return SKILL_KEYS.map((skill) => {
    const all = rows.filter((r) => r.skillKey === skill);
    const used = all.filter((r) => r.confidence >= SKILL_CONFIDENCE_FLOOR);
    const history = used.map((r) => ({ band: r.valueBand as Band, at: r.createdAt.toISOString() }));
    let trend: SkillTrend["trend"] = "unknown";
    if (history.length >= 2) {
      const recent = history.slice(-3);
      const earlier = history.slice(0, Math.max(1, history.length - 3));
      const avg = (xs: typeof history) => xs.reduce((s, h) => s + BAND_RANK[h.band], 0) / xs.length;
      const diff = avg(recent) - avg(earlier);
      trend = diff > 0.3 ? "up" : diff < -0.3 ? "down" : "flat";
    }
    return {
      skill,
      labelKo: SKILL_LABEL_KO[skill],
      observations: used.length,
      excludedLowConfidence: all.length - used.length,
      latestBand: history.at(-1)?.band ?? null,
      trend,
      history,
    };
  });
}

export async function weeklyActivity(userId: string) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const completed = await prisma.learningSession.count({
    where: { userId, status: "completed", endedAt: { gte: since } },
  });
  const last = await prisma.learningSession.findFirst({
    where: { userId, status: "completed" },
    orderBy: { endedAt: "desc" },
    select: { endedAt: true },
  });
  return { completedThisWeek: completed, lastStudiedAt: last?.endedAt?.toISOString() ?? null };
}

export async function getProgress(userId: string) {
  const [xp, skills, sessions, activity, xpEvents] = await Promise.all([
    xpSummary(userId),
    skillTrends(userId),
    listRecentSessions(userId, 30),
    weeklyActivity(userId),
    prisma.xpEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return {
    xp,
    skills,
    sessions,
    activity,
    xpEvents: xpEvents.map((e) => ({
      amount: e.amount,
      reason: e.reason,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
