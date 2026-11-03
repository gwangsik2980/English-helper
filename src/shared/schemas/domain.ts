import { z } from "zod";

export const CATEGORIES = ["daily", "transport", "shopping", "dining", "work", "service"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL_KO: Record<Category, string> = {
  daily: "일상",
  transport: "이동",
  shopping: "쇼핑",
  dining: "식사",
  work: "직장",
  service: "서비스",
};

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type Level = (typeof LEVELS)[number];

export const LEVEL_LABEL_KO: Record<Level, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "상급",
};

export const LEVEL_NUMBER: Record<Level, number> = { beginner: 1, intermediate: 2, advanced: 3 };

export const GOALS = ["travel", "daily", "work"] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABEL_KO: Record<Goal, string> = { travel: "여행", daily: "일상", work: "직장" };

export const CORRECTION_MODES = ["after_session", "during"] as const;
export type CorrectionMode = (typeof CORRECTION_MODES)[number];
export const CORRECTION_LABEL_KO: Record<CorrectionMode, string> = {
  after_session: "세션이 끝난 뒤 한꺼번에",
  during: "대화 중에 짧게",
};

export const SKILL_KEYS = ["fluency", "vocabulary", "grammar", "listening", "naturalness"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
export const SKILL_LABEL_KO: Record<SkillKey, string> = {
  fluency: "유창성",
  vocabulary: "어휘 활용",
  grammar: "문법 정확도",
  listening: "듣기/이해",
  naturalness: "자연스러움",
};

export const SuccessCriterionSchema = z.object({
  id: z.string(),
  descriptionKo: z.string(),
  // Used only by the demo (mock) analyzer to judge without an LLM.
  mockPatterns: z.array(z.string()),
});
export type SuccessCriterion = z.infer<typeof SuccessCriterionSchema>;

export const ScenarioSchema = z.object({
  summaryKo: z.string(),
  backgroundKo: z.string(),
  aiRole: z.string(),
  userRole: z.string(),
  setting: z.string(),
  openingLine: z.string(),
  learningPointsKo: z.array(z.string()),
  hintPhrases: z.array(z.string()),
  // Lines the demo partner uses when no LLM is configured.
  mockScript: z.array(z.string()).min(1),
  mockClosing: z.string(),
  goalsAffinity: z.array(z.enum(GOALS)),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

export type MissionView = {
  id: string;
  slug: string;
  title: string;
  category: Category;
  levelMin: number;
  levelMax: number;
  durationMin: number;
  version: number;
  scenario: Scenario;
  successCriteria: SuccessCriterion[];
};

export const ProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(30),
  level: z.enum(LEVELS),
  goals: z.array(z.enum(GOALS)).min(1),
  correctionMode: z.enum(CORRECTION_MODES),
  dailyMinutes: z.number().int().min(5).max(60),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const MAX_TURN_CHARS = 500;
export const TurnInputSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TURN_CHARS),
  clientTurnId: z.string().min(8).max(64),
});
