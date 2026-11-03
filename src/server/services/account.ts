import "server-only";
import { z } from "zod";
import { hashPassword, hashToken, verifyPassword } from "../auth";
import { prisma } from "../db";
import { AppError } from "../errors";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200),
});

/**
 * Changes the password of a signed-in user. Needs the current password, so a
 * borrowed or stolen session alone cannot lock the owner out. Every other
 * login session and any outstanding reset link stop working; the session
 * that made the change stays signed in.
 */
export async function changePassword(userId: string, currentSessionToken: string | undefined, input: unknown) {
  const parsed = ChangePasswordSchema.safeParse(input);
  if (!parsed.success) {
    const newIssue = parsed.error.issues.some((i) => i.path[0] === "newPassword");
    throw new AppError(
      "invalid_input",
      newIssue ? "새 비밀번호는 8자 이상으로 정해 주세요." : "지금 쓰는 비밀번호를 입력해 주세요.",
    );
  }
  const { currentPassword, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("not_found", "계정을 찾지 못했어요. 다시 로그인해 주세요.");
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new AppError("invalid_input", "지금 비밀번호가 맞지 않아요. 기억나지 않으면 로그아웃 후 비밀번호 찾기를 써 주세요.");
  }
  if (currentPassword === newPassword) {
    throw new AppError("invalid_input", "지금과 다른 비밀번호로 정해 주세요.");
  }

  const passwordHash = await hashPassword(newPassword);
  const keep = currentSessionToken ? hashToken(currentSessionToken) : null;
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.authSession.deleteMany({ where: { userId, ...(keep ? { tokenHash: { not: keep } } : {}) } }),
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
  ]);
  return { status: "changed" as const };
}

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
