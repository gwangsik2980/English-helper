import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { authedRoute, rateLimit, readJson } from "@/server/http";

const Body = z.object({ message: z.string().trim().min(1).max(1000) });

export const POST = authedRoute<{ id: string }>(async ({ req, params, userId }) => {
  rateLimit(`report:${userId}`, 5, 60_000);
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new AppError("invalid_input", "내용을 1000자 이내로 적어 주세요.");
  const session = await prisma.learningSession.findFirst({ where: { id: params.id, userId }, select: { id: true } });
  if (!session) throw new AppError("not_found", "학습 기록을 찾을 수 없어요.");
  await prisma.feedbackReport.create({ data: { userId, sessionId: session.id, message: parsed.data.message } });
  return NextResponse.json({ ok: true }, { status: 201 });
});
