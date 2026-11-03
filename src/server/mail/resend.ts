import "server-only";
import type { MailMessage, Mailer } from "./ports";

/**
 * Resend REST API (https://resend.com/docs/api-reference/emails/send-email).
 * Plain fetch so the app needs no extra SDK.
 */
export class ResendMailer implements Mailer {
  readonly name = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: MailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [message.to], subject: message.subject, text: message.text, html: message.html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Status only: the response body can echo the recipient address.
      throw new Error(`resend_failed_${res.status}`);
    }
  }
}
