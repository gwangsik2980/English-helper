import "server-only";
import { z } from "zod";
import { prisma } from "../db";
import { AppError } from "../errors";
import { XP_RULES } from "../config";
import { awardXp } from "./xp";

const SaveSchema = z.object({ sessionId: z.string(), turnId: z.string() });

/**
 * Saves an improvement from a session's validated feedback into the review
 * queue. The phrase pair comes from stored feedback, not from the client,
 * so a learner can't inject arbitrary text as "AI feedback".
 */
export async function saveReviewItem(userId: string, input: unknown) {
  const parsed = SaveSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_input", "저장할 표현을 다시 골라 주세요.");
  const { sessionId, turnId } = parsed.data;

  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId },
    include: { feedback: true },
  });
  if (!session?.feedback || session.feedback.status !== "ok") {
    throw new AppError("not_found", "저장할 피드백을 찾을 수 없어요.");
  }
  const improvements = JSON.parse(session.feedback.improvementsJson) as {
    original: string;
    suggested: string;
    reason_ko: string;
    turn_id: string;
  }[];
  const imp = improvements.find((i) => i.turn_id === turnId);
  if (!imp) throw new AppError("not_found", "저장할 표현을 찾을 수 없어요.");

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const item = await prisma.reviewItem.upsert({
    where: { userId_sourceTurnId: { userId, sourceTurnId: turnId } },
    create: {
      userId,
      sourceTurnId: turnId,
      sourceSessionId: sessionId,
      phrase: imp.original,
      suggestedPhrase: imp.suggested,
      reasonKo: imp.reason_ko,
      dueAt,
    },
    update: {},
  });
  return { id: item.id };
}

export async function listReviewItems(userId: string, opts: { status?: "pending" | "done"; take?: number } = {}) {
  const items = await prisma.reviewItem.findMany({
    where: { userId, ...(opts.status ? { status: opts.status } : {}) },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    take: opts.take ?? 50,
  });
  return items.map((i) => ({
    id: i.id,
    phrase: i.phrase,
    suggestedPhrase: i.suggestedPhrase,
    reasonKo: i.reasonKo,
    status: i.status as "pending" | "done",
    dueAt: i.dueAt.toISOString(),
    sourceSessionId: i.sourceSessionId,
  }));
}

export async function completeReviewItem(userId: string, itemId: string) {
  const item = await prisma.reviewItem.findFirst({ where: { id: itemId, userId } });
  if (!item) throw new AppError("not_found", "복습 표현을 찾을 수 없어요.");
  await prisma.$transaction(async (tx) => {
    await tx.reviewItem.update({ where: { id: item.id }, data: { status: "done", reviewedAt: new Date() } });
    await awardXp(
      {
        userId,
        sessionId: null,
        eventType: "review_done",
        amount: XP_RULES.reviewDone,
        reason: `복습 완료: ${item.suggestedPhrase}`,
        idempotencyKey: `review:${item.id}`,
      },
      tx,
    );
  });
  return { ok: true };
}

export async function deleteReviewItem(userId: string, itemId: string) {
  const res = await prisma.reviewItem.deleteMany({ where: { id: itemId, userId } });
  if (res.count === 0) throw new AppError("not_found", "복습 표현을 찾을 수 없어요.");
  return { ok: true };
}
