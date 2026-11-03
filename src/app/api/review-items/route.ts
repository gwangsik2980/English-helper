import { NextResponse } from "next/server";
import { authedRoute, readJson } from "@/server/http";
import { listReviewItems, saveReviewItem } from "@/server/services/review";

export const GET = authedRoute(async ({ userId }) => NextResponse.json({ items: await listReviewItems(userId) }));

export const POST = authedRoute(async ({ req, userId }) =>
  NextResponse.json(await saveReviewItem(userId, await readJson(req)), { status: 201 }),
);
