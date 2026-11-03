import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { prisma } from "./db";
import { AUTH_SESSION_DAYS } from "./config";
import { AppError } from "./errors";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number) => Promise<Buffer>;

export const CredentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algo, saltHex, keyHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function signUp(input: unknown) {
  const parsed = CredentialsSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("invalid_input", "이메일 형식과 8자 이상의 비밀번호를 확인해 주세요.");
  }
  const { email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("conflict", "이미 가입된 이메일이에요. 로그인해 주세요.");
  const user = await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password) },
  });
  return createAuthSession(user.id);
}

export async function logIn(input: unknown) {
  const parsed = CredentialsSchema.safeParse(input);
  const fail = new AppError("unauthorized", "이메일 또는 비밀번호가 맞지 않아요.");
  if (!parsed.success) throw fail;
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || user.status !== "active") throw fail;
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) throw fail;
  return createAuthSession(user.id);
}

async function createAuthSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.authSession.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  return { token, expiresAt, userId };
}

export async function userIdFromToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null;
  const session = await prisma.authSession.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.authSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.userId;
}

export async function revokeToken(token: string | undefined | null) {
  if (!token) return;
  await prisma.authSession.deleteMany({ where: { tokenHash: hashToken(token) } });
}
