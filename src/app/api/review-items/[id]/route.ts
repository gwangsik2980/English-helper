import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { deleteReviewItem } from "@/server/services/review";

export const DELETE = authedRoute<{ id: string }>(async ({ params, userId }) =>
  NextResponse.json(await deleteReviewItem(userId, params.id)),
);
