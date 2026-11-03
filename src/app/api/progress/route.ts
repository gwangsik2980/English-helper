import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { getProgress } from "@/server/services/progress";

export const GET = authedRoute(async ({ userId }) => NextResponse.json(await getProgress(userId)));
