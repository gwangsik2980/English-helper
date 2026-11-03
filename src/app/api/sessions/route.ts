import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError } from "@/server/errors";
import { authedRoute, readJson } from "@/server/http";
import { startSession } from "@/server/services/sessions";

const Body = z.object({ missionId: z.string().min(1).max(100) });

export const POST = authedRoute(async ({ req, userId }) => {
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new AppError("invalid_input", "미션을 다시 골라 주세요.");
  const result = await startSession(userId, parsed.data.missionId);
  return NextResponse.json({ ...result, status: "active" }, { status: result.resumed ? 200 : 201 });
});
