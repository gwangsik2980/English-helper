import "server-only";
import { z } from "zod";
import { normalizeForMatch, patternPieces } from "@/shared/expressions";
import { prisma } from "../db";
import { AppError } from "../errors";

/** Upper bound per learner; keeps the in-chat list and matching cheap. */
export const MAX_PHRASES = 200;

const PhraseInputSchema = z.object({
  phrase: z.string().trim().min(1).max(120),
  meaningKo: z.string().trim().max(120).default(""),
});

export type PhraseView = { id: string; phrase: string; meaningKo: string; createdAt: string };

const toView = (p: { id: string; phrase: string; meaningKo: string; createdAt: Date }): PhraseView => ({
  id: p.id,
  phrase: p.phrase,
  meaningKo: p.meaningKo,
  createdAt: p.createdAt.toISOString(),
});

export async function listPhrases(userId: string): Promise<PhraseView[]> {
  const rows = await prisma.phrase.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: MAX_PHRASES });
  return rows.map(toView);
}

export async function addPhrase(userId: string, input: unknown): Promise<PhraseView> {
  const parsed = PhraseInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new AppError("invalid_input", "영어 표현은 1자 이상 120자 이하로, 뜻은 120자 이하로 적어 주세요.");
  }
  const { phrase, meaningKo } = parsed.data;
  if (patternPieces(phrase).length === 0) {
    throw new AppError("invalid_input", "영어 단어가 들어간 표현으로 적어 주세요. 빈칸은 ~로 표시하면 돼요.");
  }
  const existing = await prisma.phrase.findMany({ where: { userId }, select: { phrase: true } });
  if (existing.length >= MAX_PHRASES) {
    throw new AppError("invalid_input", `표현은 ${MAX_PHRASES}개까지 저장할 수 있어요. 안 쓰는 표현을 지우고 다시 추가해 주세요.`);
  }
  const key = normalizeForMatch(phrase);
  if (existing.some((e) => normalizeForMatch(e.phrase) === key)) {
    throw new AppError("conflict", "이미 표현장에 있는 표현이에요.");
  }
  return toView(await prisma.phrase.create({ data: { userId, phrase, meaningKo } }));
}

/** Someone else's phrase id reads as not found. */
export async function deletePhrase(userId: string, id: string) {
  const { count } = await prisma.phrase.deleteMany({ where: { id, userId } });
  if (count === 0) throw new AppError("not_found", "표현을 찾지 못했어요. 이미 지웠을 수 있어요. 화면을 새로고침해 주세요.");
}
