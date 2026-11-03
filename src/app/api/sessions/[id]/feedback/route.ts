import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { getFeedback } from "@/server/services/feedback";

export const GET = authedRoute<{ id: string }>(async ({ params, userId }) => {
  const { view, xp } = await getFeedback(userId, params.id);
  return NextResponse.json({ feedback: view, xp });
});
