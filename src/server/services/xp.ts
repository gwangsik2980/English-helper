import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { levelForXp } from "../config";

type Tx = Prisma.TransactionClient;

export type XpAward = {
  userId: string;
  sessionId?: string | null;
  eventType: "mission_complete" | "goal_met" | "goal_partial" | "review_done";
  amount: number;
  reason: string;
  /** Same key => same award. Retries never grant XP twice. */
  idempotencyKey: string;
};

/** Append-only ledger write. Returns false if this award already exists. */
export async function awardXp(award: XpAward, tx: Tx = prisma): Promise<boolean> {
  // Check first so a retry inside a transaction doesn't hit the constraint
  // (Postgres aborts a transaction on any failed statement).
  const existing = await tx.xpEvent.findUnique({ where: { idempotencyKey: award.idempotencyKey } });
  if (existing) return false;
  try {
    await tx.xpEvent.create({ data: { ...award, sessionId: award.sessionId ?? null } });
    return true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return false;
    throw err;
  }
}

export async function xpSummary(userId: string) {
  const agg = await prisma.xpEvent.aggregate({ where: { userId }, _sum: { amount: true } });
  const total = agg._sum.amount ?? 0;
  return { total, ...levelForXp(total) };
}
