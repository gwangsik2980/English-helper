import { NextResponse } from "next/server";
import { PASSWORD_RESET } from "@/server/config";
import { clearAuthCookie, clientIp, rateLimit, readJson, route } from "@/server/http";
import { resetPassword } from "@/server/services/password-reset";

export const POST = route(async ({ req }) => {
  rateLimit(`reset-confirm:${clientIp(req)}`, PASSWORD_RESET.perIpMax * 2, PASSWORD_RESET.perIpWindowMs);
  await resetPassword(await readJson(req));
  // All sessions were revoked, including this browser's, if any.
  const res = NextResponse.json({ ok: true, next: "/login?reset=done" });
  clearAuthCookie(res);
  return res;
});
