import { ProfileForm } from "@/features/profile/ProfileForm";
import { ChangePassword, DeleteAccount, LogoutButton } from "@/features/settings/AccountActions";
import { VoiceSettings } from "@/features/voice/VoiceSettings";
import { requirePageUser } from "@/server/http";
import { cloudVoiceEnabled } from "@/server/tts/google";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "설정 · ENGLISH QUEST" };

export default async function SettingsPage() {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <p className="eyebrow reveal">Settings</p>
        <h1 className="display reveal-lines mt-4 text-4xl sm:text-5xl">
          <span className="line">
            <span>설정</span>
          </span>
        </h1>
      </header>

      <section aria-labelledby="learn-title" className="card reveal sm:p-8">
        <h2 id="learn-title" className="section-title">
          학습 설정
        </h2>
        <ProfileForm
          initial={{
            displayName: profile.displayName,
            level: profile.level,
            goals: profile.goals,
            correctionMode: profile.correctionMode,
            dailyMinutes: profile.dailyMinutes,
          }}
          submitLabel="저장"
          compact
        />
      </section>

      <section aria-labelledby="voice-title" className="card reveal sm:p-8">
        <h2 id="voice-title" className="section-title">
          음성
        </h2>
        <VoiceSettings cloud={cloudVoiceEnabled()} />
      </section>

      <section aria-labelledby="privacy-title" className="card reveal space-y-4 sm:p-8">
        <h2 id="privacy-title" className="section-title">
          개인정보와 데이터
        </h2>
        <div className="flex flex-wrap items-start gap-2">
          <a href="/api/account/export" className="btn-light">
            데이터 내려받기
          </a>
          <DeleteAccount />
        </div>
      </section>

      <div className="flex flex-wrap items-start justify-center gap-2">
        <ChangePassword />
        <LogoutButton />
      </div>
    </div>
  );
}
