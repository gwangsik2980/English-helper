import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { discardSession, getSession } from "@/server/services/sessions";

export const GET = authedRoute<{ id: string }>(async ({ params, userId }) =>
  NextResponse.json(await getSession(userId, params.id)),
);

/** Ends an open session without feedback and deletes it. */
export const DELETE = authedRoute<{ id: string }>(async ({ params, userId }) => {
  await discardSession(userId, params.id);
  return NextResponse.json({ ok: true });
});
