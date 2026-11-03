import "server-only";
import { GOAL_LABEL_KO, LEVEL_NUMBER, type MissionView } from "@/shared/schemas/domain";
import { prisma } from "../db";
import { listMissions } from "../repositories/missions";
import { getProfile } from "./profile";

export type Recommendation = { mission: MissionView; reasonsKo: string[] };

const DAY = 24 * 60 * 60 * 1000;

/**
 * Rule-based recommender (spec 6.3 / 7.1 fallback). Mixes goal fit, level
 * fit, novelty and the last session's suggested follow-up, and avoids
 * repeating a mission played in the last few days.
 */
export async function recommendMissions(userId: string, take = 3): Promise<Recommendation[]> {
  const [profile, missions, progress, lastFeedback] = await Promise.all([
    getProfile(userId),
    listMissions(),
    prisma.userMissionProgress.findMany({ where: { userId } }),
    prisma.sessionFeedback.findFirst({
      where: { session: { userId }, status: "ok", nextPracticeJson: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const progressById = new Map(progress.map((p) => [p.missionId, p]));
  const level = LEVEL_NUMBER[profile.level];
  const suggested = lastFeedback?.nextPracticeJson
    ? (JSON.parse(lastFeedback.nextPracticeJson) as { mission_id: string; reason_ko: string })
    : null;

  const scored = missions.map((m) => {
    let score = 0;
    const reasons: string[] = [];
    const goalHit = m.scenario.goalsAffinity.find((g) => profile.goals.includes(g));
    if (goalHit) {
      score += 3;
      reasons.push(`'${GOAL_LABEL_KO[goalHit]}' 목표와 맞는 상황이에요.`);
    }
    if (level >= m.levelMin && level <= m.levelMax) {
      score += 2;
      reasons.push("지금 레벨에 맞는 난이도예요.");
    } else if (level < m.levelMin) {
      score -= 3;
    }
    if (m.durationMin <= profile.dailyMinutes) score += 1;

    const p = progressById.get(m.id);
    if (!p) {
      score += 2;
      reasons.push("아직 해 보지 않은 새 상황이에요.");
    } else if (Date.now() - p.lastPlayedAt.getTime() < 3 * DAY) {
      score -= 4;
    } else if (p.bestOutcome !== "all_met") {
      score += 1;
      reasons.push("지난번에 놓친 목표를 다시 채워 볼 수 있어요.");
    }
    if (suggested?.mission_id === m.id) {
      score += 3;
      reasons.unshift(suggested.reason_ko);
    }
    return { mission: m, score, reasonsKo: reasons.slice(0, 2) };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, take)
    .map(({ mission, reasonsKo }) => ({
      mission,
      reasonsKo: reasonsKo.length ? reasonsKo : ["전체 미션 중에서 골라 봤어요."],
    }));
}
