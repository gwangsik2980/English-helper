import { NextResponse, after } from "next/server";
import { PASSWORD_RESET } from "@/server/config";
import { appBaseUrl, clientIp, rateLimit, readJson, route } from "@/server/http";
import { parseResetRequest, sendResetLink } from "@/server/services/password-reset";

export const POST = route(async ({ req, requestId }) => {
  rateLimit(`reset-request:${clientIp(req)}`, PASSWORD_RESET.perIpMax, PASSWORD_RESET.perIpWindowMs);
  const email = parseResetRequest(await readJson(req));
  const baseUrl = appBaseUrl(req);
  // Look-up and sending happen after the response, so the reply is identical
  // in content and timing whether or not the account exists.
  after(async () => {
    try {
      await sendResetLink(email, baseUrl);
    } catch (err) {
      console.error(`[password-reset] send failed requestId=${requestId}`, err instanceof Error ? err.message : "unknown");
    }
  });
  return NextResponse.json({ ok: true }, { status: 202 });
});
