export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/** Outbound mail. Implementations must never log the message body. */
export interface Mailer {
  readonly name: string;
  send(message: MailMessage): Promise<void>;
}
