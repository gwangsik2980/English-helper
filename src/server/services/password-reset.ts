import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "../auth";
import { PASSWORD_RESET } from "../config";
import { prisma } from "../db";
import { AppError } from "../errors";
import { getMailer } from "../mail";

const RequestSchema = z.object({ email: z.string().trim().toLowerCase().email().max(200) });
const ConfirmSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(200),
});

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Validates the request body up front so a malformed email gets a real error. */
export function parseResetRequest(input: unknown): string {
  const parsed = RequestSchema.safeParse(input);
  if (!parsed.success) throw new AppError("invalid_input", "이메일 형식을 확인해 주세요.");
  return parsed.data.email;
}

/**
 * Creates a one-time reset link and mails it. Callers must answer the client
 * the same way whatever this returns, so the response never reveals whether
 * an account exists. The result is for tests and identifier-only logs.
 */
export async function sendResetLink(email: string, baseUrl: string): Promise<"sent" | "no_account" | "throttled"> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "active") return "no_account";

  const since = new Date(Date.now() - PASSWORD_RESET.perUserWindowMs);
  const recent = await prisma.passwordResetToken.count({ where: { userId: user.id, createdAt: { gte: since } } });
  if (recent >= PASSWORD_RESET.perUserMax) return "throttled";

  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  await prisma.$transaction([
    // Rows older than the window are no longer needed for the count above.
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id, createdAt: { lt: since } } }),
    // A new link replaces earlier ones: expire them, but keep the rows so
    // they still count toward the per-account limit.
    prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: now } },
      data: { expiresAt: now },
    }),
    prisma.passwordResetToken.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(now.getTime() + PASSWORD_RESET.ttlMs),
      },
    }),
  ]);

  const link = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
  const minutes = Math.round(PASSWORD_RESET.ttlMs / 60_000);
  await getMailer().send({
    to: user.email,
    subject: "[ENGLISH QUEST] 비밀번호 재설정 링크",
    text: [
      "비밀번호 재설정을 요청하셨어요.",
      `아래 링크에서 새 비밀번호를 정해 주세요. 링크는 ${minutes}분 동안 한 번만 쓸 수 있어요.`,
      "",
      link,
      "",
      "직접 요청하지 않았다면 이 메일을 무시해 주세요. 비밀번호는 바뀌지 않아요.",
    ].join("\n"),
    html: `<p>비밀번호 재설정을 요청하셨어요.</p>
<p>아래 버튼에서 새 비밀번호를 정해 주세요. 링크는 ${minutes}분 동안 한 번만 쓸 수 있어요.</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;border-radius:999px;background:#111;color:#fff;text-decoration:none">새 비밀번호 정하기</a></p>
<p style="color:#666;font-size:13px">버튼이 안 되면 이 주소를 복사해 열어 주세요.<br>${link}</p>
<p style="color:#666;font-size:13px">직접 요청하지 않았다면 이 메일을 무시해 주세요. 비밀번호는 바뀌지 않아요.</p>`,
  });
  return "sent";
}

const INVALID_LINK = "링크가 만료됐거나 이미 사용됐어요. 비밀번호 재설정을 다시 요청해 주세요.";

/**
 * Sets a new password from a reset link. The token is single-use, and every
 * existing login session for the account is revoked so a stolen session
 * cookie stops working too.
 */
export async function resetPassword(input: unknown) {
  const parsed = ConfirmSchema.safeParse(input);
  if (!parsed.success) {
    const tokenIssue = parsed.error.issues.some((i) => i.path[0] === "token");
    if (tokenIssue) throw new AppError("token_invalid", INVALID_LINK);
    throw new AppError("invalid_input", "새 비밀번호는 8자 이상으로 정해 주세요.");
  }
  const passwordHash = await hashPassword(parsed.data.password);
  const tokenHash = hashToken(parsed.data.token);

  const userId = await prisma.$transaction(async (tx) => {
    const row = await tx.passwordResetToken.findUnique({ where: { tokenHash }, include: { user: true } });
    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now() || row.user.status !== "active") {
      throw new AppError("token_invalid", INVALID_LINK);
    }
    // Conditional claim so two concurrent submits cannot both succeed.
    const claimed = await tx.passwordResetToken.updateMany({
      where: { id: row.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) throw new AppError("token_invalid", INVALID_LINK);

    await tx.user.update({ where: { id: row.userId }, data: { passwordHash } });
    await tx.authSession.deleteMany({ where: { userId: row.userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId: row.userId, usedAt: null } });
    return row.userId;
  });
  return { status: "reset" as const, userId };
}
