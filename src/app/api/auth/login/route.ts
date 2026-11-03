import { NextResponse } from "next/server";
import { logIn } from "@/server/auth";
import { clientIp, rateLimit, readJson, route, setAuthCookie } from "@/server/http";

export const POST = route(async ({ req }) => {
  rateLimit(`login:${clientIp(req)}`, 10, 60_000);
  const { token } = await logIn(await readJson(req));
  const res = NextResponse.json({ ok: true, next: "/" });
  setAuthCookie(res, token);
  return res;
});
