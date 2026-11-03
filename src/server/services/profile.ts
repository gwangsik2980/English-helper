import "server-only";
import {
  GOALS,
  ProfileInputSchema,
  type CorrectionMode,
  type Goal,
  type Level,
} from "@/shared/schemas/domain";
import { prisma } from "../db";
import { AppError } from "../errors";

export type ProfileView = {
  userId: string;
  email: string;
  displayName: string;
  level: Level;
  goals: Goal[];
  correctionMode: CorrectionMode;
  dailyMinutes: number;
  onboarded: boolean;
};

export async function getProfile(userId: string): Promise<ProfileView> {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) throw new AppError("unauthorized", "로그인이 필요해요.");
  const p = user.profile;
  const goals = p ? (JSON.parse(p.goalsJson) as string[]).filter((g): g is Goal => (GOALS as readonly string[]).includes(g)) : [];
  return {
    userId,
    email: user.email,
    displayName: p?.displayName ?? user.email.split("@")[0],
    level: (p?.level as Level) ?? "beginner",
    goals,
    correctionMode: (p?.correctionMode as CorrectionMode) ?? "after_session",
    dailyMinutes: p?.dailyMinutes ?? 10,
    onboarded: Boolean(p?.onboardingDoneAt),
  };
}

export async function saveProfile(userId: string, input: unknown): Promise<ProfileView> {
  const parsed = ProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("invalid_input", "입력값을 확인해 주세요. 목표는 하나 이상 골라야 해요.");
  }
  const d = parsed.data;
  const data = {
    displayName: d.displayName,
    level: d.level,
    goalsJson: JSON.stringify(d.goals),
    correctionMode: d.correctionMode,
    dailyMinutes: d.dailyMinutes,
  };
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, ...data, onboardingDoneAt: new Date() },
    update: { ...data, onboardingDoneAt: new Date() },
  });
  return getProfile(userId);
}
