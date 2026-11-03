import "server-only";
import { Prisma, type Turn } from "@prisma/client";
import { TurnInputSchema } from "@/shared/schemas/domain";
import { prisma } from "../db";
import { AppError } from "../errors";
import { getAi } from "../ai";
import type { CorrectionTip } from "../ai/ports";
import { MAX_TURNS_PER_SESSION, PROMPT_VERSIONS } from "../config";
import { getMissionByIdOrSlug, toMissionView } from "../repositories/missions";
import { getProfile } from "./profile";

export type TurnView = {
  id: string;
  sequence: number;
  speaker: "user" | "ai";
  text: string;
  modality: string;
  tip: CorrectionTip | null;
  createdAt: string;
};

export type SessionView = {
  id: string;
  status: "active" | "completed";
  missionId: string;
  missionSlug: string;
  missionTitle: string;
  startedAt: string;
  endedAt: string | null;
  sceneComplete: boolean;
  turns: TurnView[];
};

function toTurnView(t: Turn): TurnView {
  return {
    id: t.id,
    sequence: t.sequence,
    speaker: t.speaker as "user" | "ai",
    text: t.text,
    modality: t.modality,
    tip: t.metaJson ? ((JSON.parse(t.metaJson) as { tip?: CorrectionTip }).tip ?? null) : null,
    createdAt: t.createdAt.toISOString(),
  };
}

const notFound = () => new AppError("not_found", "학습 기록을 찾을 수 없어요. 홈에서 다시 시작해 주세요.");

/**
 * Every read is scoped by the authenticated userId. Someone else's session id
 * returns "not found", so ids can't be probed.
 */
async function loadOwnedSession(userId: string, sessionId: string) {
  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId },
    include: { mission: true, turns: { orderBy: { sequence: "asc" } } },
  });
  if (!session) throw notFound();
  return session;
}

function sceneCompleteFrom(turns: Turn[]) {
  const lastAi = [...turns].reverse().find((t) => t.speaker === "ai");
  if (!lastAi?.metaJson) return false;
  return Boolean((JSON.parse(lastAi.metaJson) as { sceneComplete?: boolean }).sceneComplete);
}

export async function getSession(userId: string, sessionId: string): Promise<SessionView> {
  const s = await loadOwnedSession(userId, sessionId);
  return {
    id: s.id,
    status: s.status as SessionView["status"],
    missionId: s.missionId,
    missionSlug: s.mission.slug,
    missionTitle: s.mission.title,
    startedAt: s.startedAt.toISOString(),
    endedAt: s.endedAt?.toISOString() ?? null,
    sceneComplete: sceneCompleteFrom(s.turns),
    turns: s.turns.map(toTurnView),
  };
}

export async function findActiveSession(userId: string, missionId?: string) {
  return prisma.learningSession.findFirst({
    where: { userId, status: "active", ...(missionId ? { missionId } : {}) },
    orderBy: { startedAt: "desc" },
    include: { mission: true, _count: { select: { turns: true } } },
  });
}

/** Starts a mission, or resumes the open session for it (QST-04). */
export async function startSession(userId: string, missionIdOrSlug: string) {
  const mission = await getMissionByIdOrSlug(missionIdOrSlug);
  if (!mission) throw new AppError("not_found", "미션을 찾을 수 없어요.");
  const existing = await findActiveSession(userId, mission.id);
  if (existing) return { sessionId: existing.id, resumed: true };

  const session = await prisma.learningSession.create({
    data: {
      userId,
      missionId: mission.id,
      promptVersion: PROMPT_VERSIONS.partner,
      turns: {
        create: { sequence: 1, speaker: "ai", text: mission.scenario.openingLine, modality: "text" },
      },
    },
  });
  return { sessionId: session.id, resumed: false };
}

/**
 * Adds a learner turn and the partner's reply.
 * Idempotent on clientTurnId (CON-08): a retry after a network error never
 * stores the learner line twice, and fills in a missing AI reply instead.
 */
export async function addTurn(userId: string, sessionId: string, input: unknown) {
  const parsed = TurnInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("invalid_input", "메시지는 1자 이상 500자 이하로 보내 주세요.");
  }
  const { text, clientTurnId, modality } = parsed.data;
  const transcriptConfidence = modality === "voice" ? (parsed.data.transcriptConfidence ?? null) : null;

  const session = await loadOwnedSession(userId, sessionId);
  if (session.status !== "active") {
    throw new AppError("session_closed", "이미 끝난 대화예요. 결과 화면에서 다시 도전할 수 있어요.");
  }

  let userTurn = session.turns.find((t) => t.clientTurnId === clientTurnId);
  if (userTurn) {
    const reply = session.turns.find((t) => t.sequence === userTurn!.sequence + 1);
    if (reply) {
      return { userTurn: toTurnView(userTurn), aiTurn: toTurnView(reply), sceneComplete: sceneCompleteFrom(session.turns) };
    }
  } else {
    if (session.turns.length >= MAX_TURNS_PER_SESSION) {
      throw new AppError("session_closed", "이 대화는 충분히 길어졌어요. 대화를 끝내고 피드백을 받아 보세요.");
    }
    const lastTurn = session.turns.at(-1);
    try {
      // A learner line whose reply never arrived (AI error) is replaced by the
      // edited line instead of leaving two unanswered lines in a row.
      userTurn =
        lastTurn?.speaker === "user"
          ? await prisma.turn.update({
              where: { id: lastTurn.id },
              data: { text, clientTurnId, modality, transcriptConfidence },
            })
          : await prisma.turn.create({
        data: {
          sessionId,
          sequence: (lastTurn?.sequence ?? 0) + 1,
          speaker: "user",
          text,
          modality,
          transcriptConfidence,
          clientTurnId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError("conflict", "메시지가 동시에 두 번 전송됐어요. 화면을 새로고침해 주세요.");
      }
      throw err;
    }
  }

  const profile = await getProfile(userId);
  const mission = toMissionView(session.mission);
  const history = [...session.turns.filter((t) => t.sequence < userTurn!.sequence), userTurn].map((t) => ({
    speaker: t.speaker as "user" | "ai",
    text: t.text,
  }));

  // If this throws, the learner turn stays saved and the client can retry
  // with the same clientTurnId to get the reply.
  const reply = await getAi().partner.reply({
    mission,
    level: profile.level,
    correctionMode: profile.correctionMode,
    history,
  });

  const aiTurn = await prisma.turn.create({
    data: {
      sessionId,
      sequence: userTurn.sequence + 1,
      speaker: "ai",
      text: reply.text,
      modality: "text",
      metaJson: JSON.stringify({ tip: reply.tip, sceneComplete: reply.sceneComplete }),
    },
  });

  return { userTurn: toTurnView(userTurn), aiTurn: toTurnView(aiTurn), sceneComplete: reply.sceneComplete };
}

export async function listRecentSessions(userId: string, take = 20) {
  const rows = await prisma.learningSession.findMany({
    where: { userId },
    orderBy: { startedAt: "desc" },
    take,
    include: { mission: true, feedback: true },
  });
  return rows.map((r) => {
    let met = 0;
    let total = 0;
    if (r.feedback && r.feedback.status === "ok" && !r.feedback.insufficientData) {
      const outcomes = JSON.parse(r.feedback.outcomesJson) as { status: string }[];
      total = outcomes.length;
      met = outcomes.filter((o) => o.status === "met").length;
    }
    return {
      id: r.id,
      missionTitle: r.mission.title,
      status: r.status,
      startedAt: r.startedAt.toISOString(),
      endedAt: r.endedAt?.toISOString() ?? null,
      goalsMet: met,
      goalsTotal: total,
      feedbackStatus: r.feedback?.status ?? null,
      insufficientData: r.feedback?.insufficientData ?? false,
    };
  });
}
