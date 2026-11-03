import { ProfileForm } from "@/features/profile/ProfileForm";
import { LogoMark } from "@/features/ui/Icons";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "시작 설정 · ENGLISH QUEST" };

export default async function OnboardingPage() {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-8 lg:py-16">
      <p className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <LogoMark className="text-[1.25rem] text-accent" /> ENGLISH QUEST
      </p>
      <p className="eyebrow reveal mt-12">시작 설정</p>
      <h1 className="display reveal-lines mt-4 max-w-[16ch] text-4xl sm:text-5xl">
        <span className="line">
          <span>어떤 영어를</span>
        </span>
        <span className="line">
          <span>연습하고 싶나요?</span>
        </span>
      </h1>
      <p className="reveal mt-4 text-muted" style={{ ["--delay" as string]: "250ms" }}>
        1분이면 끝나요. 모든 항목은 나중에 설정에서 바꿀 수 있어요.
      </p>

      <section className="card reveal mt-10 sm:p-8" style={{ ["--delay" as string]: "350ms" }}>
        <ProfileForm
          initial={{
            displayName: profile.displayName,
            level: profile.level,
            goals: profile.goals.length ? profile.goals : ["daily"],
            correctionMode: profile.correctionMode,
            dailyMinutes: profile.dailyMinutes,
          }}
          submitLabel="첫 미션 추천받기"
          redirectTo="/"
        />
      </section>

      <section className="card-soft mt-4 text-sm leading-relaxed text-muted">
        <h2 className="mb-1 font-semibold text-text">학습 데이터는 이렇게 다뤄요</h2>
        <p>
          대화 텍스트는 피드백과 성장 기록을 만드는 데 쓰여요. 대화 중에 마이크로 말할 수도 있는데, 마이크 권한은 처음 쓸 때 목적을
          먼저 안내한 뒤 물어봐요. 거부해도 텍스트로 계속 학습할 수 있고, 녹음된 소리는 우리 서버에 저장되지 않아요.
        </p>
      </section>
    </main>
  );
}
