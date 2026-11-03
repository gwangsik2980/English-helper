import { AuthForm } from "@/features/auth/AuthForm";

export const metadata = { title: "회원가입 · ENGLISH QUEST" };

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
