import { AuthForm } from "@/features/auth/AuthForm";
import { redirectIfSignedIn } from "@/server/http";

export const metadata = { title: "로그인 · ENGLISH QUEST" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string | string[] }> }) {
  await redirectIfSignedIn();
  const { reset } = await searchParams;
  return <AuthForm mode="login" notice={reset === "done" ? "비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요." : undefined} />;
}
