import "server-only";
import { ConsoleMailer } from "./console";
import type { Mailer } from "./ports";
import { ResendMailer } from "./resend";

let cached: Mailer | null = null;

export function getMailer(): Mailer {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  cached = key
    ? new ResendMailer(key, process.env.MAIL_FROM || "ENGLISH QUEST <onboarding@resend.dev>")
    : new ConsoleMailer();
  return cached;
}

/** Test hook: inject a fake mailer. */
export function setMailerForTesting(mailer: Mailer | null) {
  cached = mailer;
}
