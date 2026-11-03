import "server-only";
import type { Turn } from "@prisma/client";
import { LEVEL_NUMBER } from "@/shared/schemas/domain";
import {
  FEEDBACK_SCHEMA_VERSION,
  RawFeedbackSchema,
  type FeedbackView,
  type RawFeedback,
} from "@/shared/schemas/feedback";
import { prisma } from "../db";
import { AppError } from "../errors";
import { getAi } from "../ai";
import { INSUFFICIENT_DATA, PROMPT_VERSIONS, XP_RULES } from "../config";
import { listMissions, toMissionView } from "../repositories/missions";
import { getProfile } from "./profile";
import { awardXp } from "./xp";

type ValidationContext = {
  userTurns: { id: string; text: string }[];
  goalIds: string[];
  candidateMissionIds: string[];
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Server-side gate between model output and the learner (spec 7.3).
 * - Shape must match the schema.
 * - Goal ids must be exactly the mission's goals.
 * - Every evidence id must be a learner turn of this session; otherwise the
 *   whole result is rejected rather than shown with made-up evidence.
 * - Quotes that don't appear in the cited turn are dropped.
 */
export function validateFeedback(raw: unknown, ctx: ValidationContext): RawFeedback | null {
  const parsed = RawFeedbackSchema.safeParse(raw);
  if (!parsed.success) return null;
  const fb = parsed.data;
  const turnById = new Map(ctx.userTurns.map((t) => [t.id, t]));
  const validIds = (ids: string[]) => ids.every((id) => turnById.has(id));

  const seenGoals = new Set(fb.goal_outcomes.map((g) => g.goal_id));
  if (seenGoals.size !== fb.goal_outcomes.length) return null;
  if (ctx.goalIds.some((id) => !seenGoals.has(id)) || fb.goal_outcomes.some((g) => !ctx.goalIds.includes(g.goal_id))) {
    return null;
  }
  if (!fb.goal_outcomes.every((g) => validIds(g.evidence_turn_ids))) return null;
  if (!fb.skill_observations.every((o) => validIds(o.evidence_turn_ids))) return null;

  const goal_outcomes = fb.goal_outcomes.map((g) =>
    // A "met" or "partial" claim without evidence is not trustworthy.
    (g.status === "met" || g.status === "partial") && g.evidence_turn_ids.length === 0
      ? { ...g, status: "undetermined" as const }
      : g,
  );

  const strengths = fb.strengths
    .filter((s) => {
      const t = turnById.get(s.turn_id);
      return t !== undefined && norm(t.text).includes(norm(s.quote));
    })
    .slice(0, 2);

  const improvements = fb.improvements
    .filter((i) => {
      const t = turnById.get(i.turn_id);
      return t !== undefined && norm(t.text).includes(norm(i.original)) && norm(i.original) !== norm(i.suggested);
    })
    .slice(0, 3);

  const next_practice =
    fb.next_practice && ctx.candidateMissionIds.includes(fb.next_practice.mission_id) ? fb.next_practice : null;

  if (fb.insufficient_data) {
    return {
      ...fb,
      goal_outcomes: goal_outcomes.map((g) => ({ ...g, status: "undetermined" as const })),
      strengths,
      improvements,
      skill_observations: [],
      next_practice,
    };
  }
  return { ...fb, goal_outcomes, strengths, improvements, next_practice };
}

export function hasInsufficientData(userTurns: { text: string }[]) {
  const words = userTurns.reduce((n, t) => n + t.text.split(/\s+/).filter(Boolean).length, 0);
  return userTurns.length < INSUFFICIENT_DATA.minUserTurns || words < INSUFFICIENT_DATA.minUserWords;
}

function overallOutcome(fb: RawFeedback | null) {
  if (!fb || fb.insufficient_data) return "undetermined";
  const statuses = fb.goal_outcomes.map((g) => g.status);
  if (statuses.length > 0 && statuses.every((s) => s === "met")) return "all_met";
  if (statuses.some((s) => s === "met" || s === "partial")) return "partial";
  return "none";
}

const OUTCOME_RANK: Record<string, number> = { undetermined: 0, none: 1, partial: 2, all_met: 3 };

function insufficientFeedback(goalIds: string[]): RawFeedback {
  return {
    goal_outcomes: goalIds.map((id) => ({
      goal_id: id,
      status: "undetermined",
      reason_ko: "대화가 짧아서 판단을 보류했어요.",
      evidence_turn_ids: [],
    })),
    strengths: [],
    improvements: [],
    skill_observations: [],
    summary_ko: "대화가 짧아서 이번에는 평가를 보류했어요. 몇 마디 더 주고받으면 근거 있는 피드백을 드릴 수 있어요.",
    next_practice: null,
    insufficient_data: true,
  };
}

/**
 * Ends a session and produces feedback, skill observations, progress and XP
 * in one transaction. Safe to call twice: the second call returns the first
 * result and grants nothing new.
 */
export async function completeSession(userId: string, sessionId: string) {
  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId },
    include: { mission: true, turns: { orderBy: { sequence: "asc" } } },
  });
  if (!session) throw new AppError("not_found", "학습 기록을 찾을 수 없어요.");
  if (session.status === "completed") return { sessionId, alreadyCompleted: true };

  const mission = toMissionView(session.mission);
  const profile = await getProfile(userId);
  const userTurns = session.turns.filter((t: Turn) => t.speaker === "user");
  const goalIds = mission.successCriteria.map((c) => c.id);
  const levelNum = LEVEL_NUMBER[profile.level];
  const candidates = (await listMissions()).filter(
    (m) => m.id !== mission.id && m.levelMin <= levelNum + 1 && m.levelMax >= levelNum,
  );
  const ai = getAi();

  let feedback: RawFeedback | null;
  let modelName = ai.analyzer.modelName;
  if (hasInsufficientData(userTurns)) {
    // Not enough speech to judge: skip the model call (and its cost).
    feedback = insufficientFeedback(goalIds);
    modelName = "none";
  } else {
    feedback = null;
    for (let attempt = 0; attempt < 2 && !feedback; attempt++) {
      try {
        const raw = await ai.analyzer.analyze({
          mission,
          level: profile.level,
          turns: session.turns.map((t) => ({
            id: t.id,
            sequence: t.sequence,
            speaker: t.speaker as "user" | "ai",
            text: t.text,
            modality: t.modality,
            transcriptConfidence: t.transcriptConfidence,
          })),
          candidateMissions: candidates.map((m) => ({
            id: m.id,
            title: m.title,
            learningPointsKo: m.scenario.learningPointsKo,
          })),
        });
        feedback = validateFeedback(raw, {
          userTurns: userTurns.map((t) => ({ id: t.id, text: t.text })),
          goalIds,
          candidateMissionIds: candidates.map((m) => m.id),
        });
        if (!feedback) console.warn(`[feedback] validation failed session=${sessionId} attempt=${attempt + 1}`);
      } catch (err) {
        console.warn(
          `[feedback] analyzer error session=${sessionId} attempt=${attempt + 1} code=${err instanceof AppError ? err.code : "unknown"}`,
        );
      }
    }
  }

  const outcome = overallOutcome(feedback);
  const criteriaById = new Map(mission.successCriteria.map((c) => [c.id, c]));

  await prisma.$transaction(async (tx) => {
    const flipped = await tx.learningSession.updateMany({
      where: { id: sessionId, userId, status: "active" },
      data: { status: "completed", endedAt: new Date(), summaryJson: JSON.stringify({ outcome }) },
    });
    if (flipped.count === 0) return; // completed concurrently by another request

    await tx.sessionFeedback.create({
      data: {
        sessionId,
        schemaVersion: FEEDBACK_SCHEMA_VERSION,
        promptVersion: PROMPT_VERSIONS.feedback,
        model: modelName,
        status: feedback ? "ok" : "unavailable",
        outcomesJson: JSON.stringify(feedback?.goal_outcomes ?? []),
        strengthsJson: JSON.stringify(feedback?.strengths ?? []),
        improvementsJson: JSON.stringify(feedback?.improvements ?? []),
        confidenceJson: JSON.stringify({
          skill_observations: feedback?.skill_observations ?? [],
          summary_ko: feedback?.summary_ko ?? null,
        }),
        nextPracticeJson: feedback?.next_practice ? JSON.stringify(feedback.next_practice) : null,
        insufficientData: feedback?.insufficient_data ?? false,
      },
    });

    if (feedback && !feedback.insufficient_data) {
      for (const o of feedback.skill_observations) {
        await tx.skillObservation.create({
          data: {
            userId,
            sessionId,
            skillKey: o.skill,
            valueBand: o.level,
            confidence: o.confidence,
            evidenceTurnIds: JSON.stringify(o.evidence_turn_ids),
          },
        });
      }
    }

    const prev = await tx.userMissionProgress.findUnique({
      where: { userId_missionId: { userId, missionId: mission.id } },
    });
    const best =
      prev?.bestOutcome && OUTCOME_RANK[prev.bestOutcome] >= OUTCOME_RANK[outcome] ? prev.bestOutcome : outcome;
    await tx.userMissionProgress.upsert({
      where: { userId_missionId: { userId, missionId: mission.id } },
      create: { userId, missionId: mission.id, completionCount: 1, bestOutcome: outcome, lastPlayedAt: new Date() },
      update: { completionCount: { increment: 1 }, bestOutcome: best, lastPlayedAt: new Date() },
    });

    if (userTurns.length > 0) {
      await awardXp(
        {
          userId,
          sessionId,
          eventType: "mission_complete",
          amount: XP_RULES.missionComplete,
          reason: `미션 완료: ${mission.title}`,
          idempotencyKey: `session:${sessionId}:complete`,
        },
        tx,
      );
    }
    if (feedback && !feedback.insufficient_data) {
      for (const g of feedback.goal_outcomes) {
        const desc = criteriaById.get(g.goal_id)?.descriptionKo ?? g.goal_id;
        if (g.status === "met") {
          await awardXp(
            {
              userId,
              sessionId,
              eventType: "goal_met",
              amount: XP_RULES.goalMet,
              reason: `목표 달성: ${desc}`,
              idempotencyKey: `session:${sessionId}:goal:${g.goal_id}`,
            },
            tx,
          );
        } else if (g.status === "partial") {
          await awardXp(
            {
              userId,
              sessionId,
              eventType: "goal_partial",
              amount: XP_RULES.goalPartial,
              reason: `목표 일부 달성: ${desc}`,
              idempotencyKey: `session:${sessionId}:goal:${g.goal_id}`,
            },
            tx,
          );
        }
      }
    }
  });

  return { sessionId, alreadyCompleted: false };
}

export async function getFeedback(userId: string, sessionId: string) {
  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId },
    include: { feedback: true, mission: true, xpEvents: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) throw new AppError("not_found", "학습 기록을 찾을 수 없어요.");
  if (session.status !== "completed" || !session.feedback) {
    throw new AppError("conflict", "아직 대화가 끝나지 않았어요. 대화를 마치면 피드백을 볼 수 있어요.");
  }
  const f = session.feedback;
  const conf = JSON.parse(f.confidenceJson) as {
    skill_observations: RawFeedback["skill_observations"];
    summary_ko: string | null;
  };
  const view: FeedbackView =
    f.status === "ok"
      ? {
          status: "ok",
          model: f.model,
          promptVersion: f.promptVersion,
          schemaVersion: f.schemaVersion,
          feedback: {
            goal_outcomes: JSON.parse(f.outcomesJson),
            strengths: JSON.parse(f.strengthsJson),
            improvements: JSON.parse(f.improvementsJson),
            skill_observations: conf.skill_observations,
            summary_ko: conf.summary_ko ?? "",
            next_practice: f.nextPracticeJson ? JSON.parse(f.nextPracticeJson) : null,
            insufficient_data: f.insufficientData,
          },
        }
      : {
          status: "unavailable",
          messageKo:
            "이번 대화는 분석을 완료하지 못했어요. 대화 기록과 완료 경험치는 저장됐어요. 같은 미션을 다시 해 보면 피드백을 받을 수 있어요.",
        };

  return {
    view,
    mission: toMissionView(session.mission),
    xp: session.xpEvents.map((e) => ({ amount: e.amount, reason: e.reason, eventType: e.eventType })),
  };
}
