import { NextResponse } from "next/server";
import { authedRoute } from "@/server/http";
import { undoLastUserTurn } from "@/server/services/sessions";

/** Takes back the learner's last line and the reply to it. */
export const DELETE = authedRoute<{ id: string }>(async ({ params, userId }) =>
  NextResponse.json(await undoLastUserTurn(userId, params.id)),
);
