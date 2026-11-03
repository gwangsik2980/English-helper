import { NextResponse } from "next/server";
import { authedRoute, readJson } from "@/server/http";
import { addPhrase, listPhrases } from "@/server/services/phrases";

export const GET = authedRoute(async ({ userId }) => NextResponse.json({ items: await listPhrases(userId) }));

export const POST = authedRoute(async ({ req, userId }) =>
  NextResponse.json(await addPhrase(userId, await readJson(req)), { status: 201 }),
);
