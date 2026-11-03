import { NextResponse } from "next/server";
import { TURN_RATE_LIMIT } from "@/server/config";
import { authedRoute, rateLimit, readJson } from "@/server/http";
import { addTurn } from "@/server/services/sessions";

// Claude calls can take tens of seconds; Vercel Hobby allows up to 60.
export const maxDuration = 60;

export const POST = authedRoute<{ id: string }>(async ({ req, params, userId }) => {
  rateLimit(`turn:${userId}`, TURN_RATE_LIMIT.max, TURN_RATE_LIMIT.windowMs);
  const result = await addTurn(userId, params.id, await readJson(req));
  return NextResponse.json(result);
});
