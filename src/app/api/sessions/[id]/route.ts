import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { getSession } from "@/server/services/sessions";

export const GET = authedRoute<{ id: string }>(async ({ params, userId }) =>
  NextResponse.json(await getSession(userId, params.id)),
);
