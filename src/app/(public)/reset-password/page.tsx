import { ResetPasswordForm } from "@/features/auth/PasswordResetForms";

// The token is in the URL, so never send it to other sites as a Referer.
export const metadata = { title: "새 비밀번호 · ENGLISH QUEST", referrer: "no-referrer" as const };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
