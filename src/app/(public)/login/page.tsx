import { AuthForm } from "@/features/auth/AuthForm";

export const metadata = { title: "로그인 · ENGLISH QUEST" };

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
