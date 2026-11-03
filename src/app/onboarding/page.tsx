import { ProfileForm } from "@/features/profile/ProfileForm";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "시작 설정 · ENGLISH QUEST" };

export default async function OnboardingPage() {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="text-sm font-bold tracking-widest text-brand">ENGLISH QUEST</p>
      <h1 className="mt-2 text-2xl font-bold">어떤 영어를 연습하고 싶은지 알려 주세요</h1>
      <p className="mt-2 text-muted">1분이면 끝나요. 모든 항목은 나중에 설정에서 바꿀 수 있어요.</p>

      <section className="card mt-6">
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

      <section className="mt-6 rounded-2xl bg-surface-2 p-5 text-sm leading-relaxed text-muted">
        <h2 className="mb-1 font-semibold text-text">학습 데이터는 이렇게 다뤄요</h2>
        <p>
          대화 텍스트는 피드백과 성장 기록을 만드는 데 쓰여요. 지금 버전은 텍스트 대화만 지원하고, 음성 기능이 추가되면 마이크
          권한은 따로 물어볼게요. 거부해도 텍스트로 계속 학습할 수 있어요.
        </p>
      </section>
    </main>
  );
}
