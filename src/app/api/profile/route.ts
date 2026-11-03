import { NextResponse } from "next/server";
import { authedRoute, readJson } from "@/server/http";
import { getProfile, saveProfile } from "@/server/services/profile";

export const GET = authedRoute(async ({ userId }) => NextResponse.json(await getProfile(userId)));

export const PUT = authedRoute(async ({ req, userId }) =>
  NextResponse.json(await saveProfile(userId, await readJson(req))),
);
