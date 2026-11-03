import { AuthForm } from "@/features/auth/AuthForm";
import { redirectIfSignedIn } from "@/server/http";

export const metadata = { title: "회원가입 · ENGLISH QUEST" };

export default async function SignupPage() {
  await redirectIfSignedIn();
  return <AuthForm mode="signup" />;
}
