import { NextResponse } from "next/server";
import { logIn } from "@/server/auth";
import { rateLimit, readJson, route, setAuthCookie } from "@/server/http";

export const POST = route(async ({ req }) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  rateLimit(`login:${ip}`, 10, 60_000);
  const { token } = await logIn(await readJson(req));
  const res = NextResponse.json({ ok: true, next: "/" });
  setAuthCookie(res, token);
  return res;
});
