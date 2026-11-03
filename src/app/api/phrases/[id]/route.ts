import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { deletePhrase } from "@/server/services/phrases";

export const DELETE = authedRoute<{ id: string }>(async ({ params, userId }) => {
  await deletePhrase(userId, params.id);
  return NextResponse.json({ ok: true });
});
