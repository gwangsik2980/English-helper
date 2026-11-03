import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { completeSession } from "@/server/services/feedback";

// MVP runs analysis synchronously; the response shape leaves room for a job id.
export const POST = authedRoute<{ id: string }>(async ({ params, userId }) => {
  const result = await completeSession(userId, params.id);
  return NextResponse.json({ status: "completed", analysisJobId: null, ...result });
});
