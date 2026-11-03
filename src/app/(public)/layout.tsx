import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { optionalPageUser } from "@/server/http";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  if (await optionalPageUser()) redirect("/");
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-sm font-bold tracking-widest text-brand">ENGLISH QUEST</p>
        <h1 className="mt-2 text-2xl font-bold">생활 속 상황에서 쓰는 영어</h1>
        <p className="mt-2 text-muted">
          카페 주문, 길 묻기, 회의 일정 변경처럼 실제로 겪을 장면에서 AI 상대와 대화하고, 근거가 있는 피드백을 받아요.
        </p>
      </div>
      {children}
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        대화 내용은 피드백과 성장 기록을 만드는 데만 쓰여요. 설정에서 언제든 내려받거나 삭제할 수 있어요.
      </p>
    </main>
  );
}
