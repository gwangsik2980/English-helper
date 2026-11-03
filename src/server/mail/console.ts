import "server-only";
import type { MailMessage, Mailer } from "./ports";

/**
 * Used when no mail provider key is set. In development it prints the mail
 * text (which holds the reset link) so the flow can be tried locally.
 * In production it refuses to print: a reset link in server logs would let
 * anyone with log access take over the account.
 */
export class ConsoleMailer implements Mailer {
  readonly name = "console";

  async send(message: MailMessage) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[mail] RESEND_API_KEY is not set; mail was not sent.");
      return;
    }
    console.info(`[mail:dev] subject="${message.subject}"\n${message.text}`);
  }
}
