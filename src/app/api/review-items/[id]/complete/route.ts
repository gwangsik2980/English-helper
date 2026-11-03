import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { completeReviewItem } from "@/server/services/review";

export const POST = authedRoute<{ id: string }>(async ({ params, userId }) =>
  NextResponse.json(await completeReviewItem(userId, params.id)),
);
