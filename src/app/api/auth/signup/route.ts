import { NextResponse } from "next/server";
import { signUp } from "@/server/auth";
import { readJson, route, setAuthCookie } from "@/server/http";

export const POST = route(async ({ req }) => {
  const { token } = await signUp(await readJson(req));
  const res = NextResponse.json({ ok: true, next: "/onboarding" }, { status: 201 });
  setAuthCookie(res, token);
  return res;
});
