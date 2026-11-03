import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { logIn, signUp, userIdFromToken } from "@/server/auth";
import { PASSWORD_RESET } from "@/server/config";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { setMailerForTesting } from "@/server/mail";
import type { MailMessage } from "@/server/mail/ports";
import { parseResetRequest, resetPassword, sendResetLink } from "@/server/services/password-reset";

const BASE = "https://app.example.test";
let outbox: MailMessage[] = [];

beforeEach(() => {
  outbox = [];
  setMailerForTesting({ name: "fake", send: async (m) => void outbox.push(m) });
});
afterEach(() => setMailerForTesting(null));

async function newAccount() {
  const email = `r-${randomUUID()}@example.test`;
  const session = await signUp({ email, password: "old-password" });
  return { email, ...session };
}

function tokenFromMail(m: MailMessage) {
  const match = m.text.match(/reset-password\?token=([\w-]+)/);
  if (!match) throw new Error("no link in mail");
  return match[1];
}

async function expectCode(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === code);
}

describe("password reset", () => {
  it("mails a link, sets the new password, and revokes every login session", async () => {
    const { email, token: oldSession, userId } = await newAccount();
    const second = await logIn({ email, password: "old-password" });

    expect(await sendResetLink(email, BASE)).toBe("sent");
    expect(outbox).toHaveLength(1);
    expect(outbox[0].to).toBe(email);
    expect(outbox[0].text).toContain(`${BASE}/reset-password?token=`);

    const token = tokenFromMail(outbox[0]);
    // Only the hash is stored.
    const row = await prisma.passwordResetToken.findFirstOrThrow({ where: { userId } });
    expect(row.tokenHash).not.toBe(token);
    expect(row.expiresAt.getTime() - row.createdAt.getTime()).toBeLessThanOrEqual(PASSWORD_RESET.ttlMs + 1000);

    await resetPassword({ token, password: "new-password" });

    expect(await userIdFromToken(oldSession)).toBeNull();
    expect(await userIdFromToken(second.token)).toBeNull();
    await expectCode(logIn({ email, password: "old-password" }), "unauthorized");
    expect((await logIn({ email, password: "new-password" })).userId).toBe(userId);
  });

  it("does not reveal whether an account exists", async () => {
    expect(await sendResetLink(`nobody-${randomUUID()}@example.test`, BASE)).toBe("no_account");
    expect(outbox).toHaveLength(0);
  });

  it("is single-use", async () => {
    const { email } = await newAccount();
    await sendResetLink(email, BASE);
    const token = tokenFromMail(outbox[0]);
    await resetPassword({ token, password: "new-password" });
    await expectCode(resetPassword({ token, password: "another-pass" }), "token_invalid");
  });

  it("rejects expired, unknown and superseded links", async () => {
    const { email, userId } = await newAccount();
    await sendResetLink(email, BASE);
    await sendResetLink(email, BASE);
    const [first, latest] = outbox.map(tokenFromMail);
    // A newer link replaces the older one.
    await expectCode(resetPassword({ token: first, password: "new-password" }), "token_invalid");

    await prisma.passwordResetToken.updateMany({ where: { userId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expectCode(resetPassword({ token: latest, password: "new-password" }), "token_invalid");

    await expectCode(resetPassword({ token: "x".repeat(43), password: "new-password" }), "token_invalid");
    await expectCode(resetPassword({ token: "short", password: "new-password" }), "token_invalid");
    // Still the old password.
    expect((await logIn({ email, password: "old-password" })).userId).toBe(userId);
  });

  it("asks for a longer password without spending the link", async () => {
    const { email } = await newAccount();
    await sendResetLink(email, BASE);
    const token = tokenFromMail(outbox[0]);
    await expectCode(resetPassword({ token, password: "short" }), "invalid_input");
    await resetPassword({ token, password: "long-enough" });
  });

  it("limits mails per account", async () => {
    const { email } = await newAccount();
    for (let i = 0; i < PASSWORD_RESET.perUserMax; i++) expect(await sendResetLink(email, BASE)).toBe("sent");
    expect(await sendResetLink(email, BASE)).toBe("throttled");
    expect(outbox).toHaveLength(PASSWORD_RESET.perUserMax);
  });

  it("validates the email format up front", () => {
    expect(parseResetRequest({ email: "  Me@Example.TEST " })).toBe("me@example.test");
    expect(() => parseResetRequest({ email: "not-an-email" })).toThrow(AppError);
  });
});
