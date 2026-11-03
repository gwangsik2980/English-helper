import { NextResponse } from "next/server";
import { revokeToken } from "@/server/auth";
import { AUTH_COOKIE } from "@/server/config";
import { clearAuthCookie, route } from "@/server/http";

export const POST = route(async ({ req }) => {
  await revokeToken(req.cookies.get(AUTH_COOKIE)?.value);
  const res = NextResponse.json({ ok: true });
  clearAuthCookie(res);
  return res;
});
