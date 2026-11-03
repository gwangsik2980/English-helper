import { LevelCheck } from "@/features/onboarding/LevelCheck";
import { LogoMark } from "@/features/ui/Icons";
import { SiteFooter } from "@/features/ui/SiteFooter";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "레벨 확인 · ENGLISH QUEST" };

export default async function LevelCheckPage() {
  const userId = await requirePageUser();
  const p = await getProfile(userId);

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 sm:px-8 lg:py-16">
      <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <LogoMark className="text-[1.25rem] text-white" /> ENGLISH QUEST
      </p>
      <p className="eyebrow reveal mt-12">선택 · 1분</p>
      <h1 className="display reveal-lines mt-4 text-4xl sm:text-5xl">
        <span className="line">
          <span>짧은 레벨 확인</span>
        </span>
      </h1>
      <p className="reveal mt-4 text-muted" style={{ ["--delay" as string]: "200ms" }}>
        상황에 가장 자연스러운 영어를 골라 주세요. 결과는 첫 추천에만 쓰이고 저장되지 않아요.
      </p>
      <section className="card reveal mt-8 sm:p-8" style={{ ["--delay" as string]: "300ms" }}>
        <LevelCheck
          profile={{
            displayName: p.displayName,
            level: p.level,
            goals: p.goals,
            correctionMode: p.correctionMode,
            dailyMinutes: p.dailyMinutes,
          }}
        />
      </section>
      <SiteFooter className="mt-10" />
    </main>
  );
}
