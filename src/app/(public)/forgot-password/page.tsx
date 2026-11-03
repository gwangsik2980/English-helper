import { ForgotPasswordForm } from "@/features/auth/PasswordResetForms";
import { redirectIfSignedIn } from "@/server/http";

export const metadata = { title: "비밀번호 찾기 · ENGLISH QUEST" };

export default async function ForgotPasswordPage() {
  await redirectIfSignedIn();
  return <ForgotPasswordForm />;
}
