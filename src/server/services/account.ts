import "server-only";
import { prisma } from "../db";

/**
 * Deletes the account and everything it owns (sessions, turns, feedback,
 * XP ledger, review items, login sessions) via cascading relations.
 * Voice recordings are never stored in the MVP, so there is nothing else to purge.
 */
export async function deleteAccountData(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
  return { status: "deleted" as const };
}

/** Data export for the settings page ("download my data"). */
export async function exportAccountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      sessions: { include: { turns: true, feedback: true, mission: { select: { title: true } } } },
      xpEvents: true,
      reviewItems: true,
      skillObs: true,
    },
  });
  if (!user) return null;
  const { passwordHash: _omit, ...rest } = user;
  void _omit;
  return { exportedAt: new Date().toISOString(), ...rest };
}
