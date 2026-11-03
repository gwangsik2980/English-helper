import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/server/config";
import { authedRoute, rateLimit, readJson } from "@/server/http";
import { changePassword } from "@/server/services/account";

export const POST = authedRoute(async ({ req, userId }) => {
  // Limits guessing the current password with a hijacked session.
  rateLimit(`password-change:${userId}`, 5, 15 * 60_000);
  const result = await changePassword(userId, req.cookies.get(AUTH_COOKIE)?.value, await readJson(req));
  return NextResponse.json(result);
});
