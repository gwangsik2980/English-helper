import type { ReactNode } from "react";
import { FloatingBits } from "@/features/ui/FloatingBits";
import { FluidMode } from "@/features/ui/FluidBackground";
import { LogoMark } from "@/features/ui/Icons";

const BITS = [
  { text: "Could I have a latte?", top: "16%", left: "46%", size: "md" as const },
  { text: "Would Thursday work?", top: "36%", left: "64%", size: "sm" as const },
  { text: "Nice to meet you!", top: "58%", left: "52%", size: "lg" as const, tone: "pink" as const },
];

export default async function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <FluidMode mode="hero" />
      <section className="card-ink relative m-0 flex flex-col justify-between rounded-t-none rounded-b-[2rem] px-5 pb-10 pt-8 sm:px-8 lg:m-3 lg:rounded-[2rem] lg:p-12">
        <FloatingBits bits={BITS} className="hidden lg:block" />
        <p className="reveal relative flex items-center gap-2 text-lg font-semibold tracking-tight">
          <LogoMark className="text-[1.25rem] text-white" /> ENGLISH QUEST
        </p>
        <div className="relative z-10 mt-14 lg:mt-0">
          <p className="eyebrow reveal" style={{ ["--delay" as string]: "100ms" }}>
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
              <span className="script ink-text text-[1.35em]">matters.</span>
            </span>
          </h1>
          <p className="reveal mt-6 max-w-sm text-sm leading-relaxed text-white/70" style={{ ["--delay" as string]: "400ms" }}>
            카페 주문, 길 묻기, 회의 일정 변경처럼 실제로 겪을 장면에서 AI 상대와 대화하고, 내가 한 말을 근거로 한 피드백을 받아요.
          </p>
        </div>
        <p
          aria-hidden
          className="script pointer-events-none absolute inset-x-0 -bottom-4 select-none whitespace-nowrap text-center text-[8rem] text-white/[0.06] lg:-bottom-6 lg:text-[11rem]"
        >
          Quest
        </p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {children}
          <p className="mt-6 text-xs leading-relaxed text-subtle">
            대화 내용은 피드백과 성장 기록을 만드는 데만 쓰여요. 설정에서 언제든 내려받거나 삭제할 수 있어요.
          </p>
        </div>
      </section>
    </main>
  );
}
