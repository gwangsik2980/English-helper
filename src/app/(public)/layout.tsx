import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { LogoMark } from "@/features/ui/Icons";
import { optionalPageUser } from "@/server/http";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  if (await optionalPageUser()) redirect("/");
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative flex flex-col justify-between overflow-hidden rounded-b-[2rem] bg-ink px-5 pb-10 pt-8 text-white sm:px-8 lg:m-3 lg:rounded-[2rem] lg:p-12">
        <p className="reveal flex items-center gap-2 text-lg font-semibold tracking-tight">
          <LogoMark className="text-[1.25rem] text-accent-from" /> ENGLISH QUEST
        </p>
        <div className="relative z-10 mt-14 lg:mt-0">
          <p className="eyebrow-light reveal" style={{ ["--delay" as string]: "100ms" }}>
            생활 속 영어 연습
          </p>
          <h1 className="display reveal-lines mt-4 max-w-[14ch] text-4xl sm:text-5xl lg:text-6xl">
            <span className="line">
              <span>Speak it</span>
            </span>
            <span className="line">
              <span>where it</span>
            </span>
            <span className="line">
              <span className="text-accent-from">matters.</span>
            </span>
          </h1>
          <p className="reveal mt-6 max-w-sm text-sm leading-relaxed text-white/60" style={{ ["--delay" as string]: "400ms" }}>
            카페 주문, 길 묻기, 회의 일정 변경처럼 실제로 겪을 장면에서 AI 상대와 대화하고, 내가 한 말을 근거로 한 피드백을 받아요.
          </p>
        </div>
        <p
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-4 select-none whitespace-nowrap text-center text-[7rem] font-bold leading-none text-white/5 lg:-bottom-6 lg:text-[9.5rem]"
        >
          QUEST
        </p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {children}
          <p className="mt-6 text-xs leading-relaxed text-muted">
            대화 내용은 피드백과 성장 기록을 만드는 데만 쓰여요. 설정에서 언제든 내려받거나 삭제할 수 있어요.
          </p>
        </div>
      </section>
    </main>
  );
}
