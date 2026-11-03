import { ProfileForm } from "@/features/profile/ProfileForm";
import { ChangePassword, DeleteAccount, LogoutButton } from "@/features/settings/AccountActions";
import { VoiceSettings } from "@/features/voice/VoiceSettings";
import { requirePageUser } from "@/server/http";
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
        />
      </section>

      <section aria-labelledby="voice-title" className="card reveal sm:p-8">
        <h2 id="voice-title" className="section-title">
          음성
        </h2>
        <VoiceSettings />
      </section>

      <section aria-labelledby="security-title" className="card reveal space-y-4 sm:p-8">
        <h2 id="security-title" className="section-title">
          계정 보안
        </h2>
        <ChangePassword />
      </section>

      <section aria-labelledby="privacy-title" className="card reveal space-y-4 sm:p-8">
        <h2 id="privacy-title" className="section-title">
          개인정보와 데이터
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>저장하는 것: 이메일, 학습 설정, 대화 텍스트(말로 보낸 문장은 인식 확신도 포함), 피드백, 경험치, 복습 표현</li>
          <li>저장하지 않는 것: 녹음된 음성 (서버로 오지 않음), 비밀번호 원문 (암호화된 값만 저장)</li>
          <li>보관 기간: 직접 삭제하기 전까지 보관돼요. 계정을 삭제하면 모든 학습 데이터가 즉시 지워져요.</li>
          <li>대화에는 실제 이름, 전화번호, 주소 같은 개인정보 대신 가상의 정보를 써 주세요.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <a href="/api/account/export" className="btn-light">
            내 데이터 내려받기 (JSON)
          </a>
          <LogoutButton />
        </div>
        <div className="border-t border-line pt-4">
          <DeleteAccount />
        </div>
      </section>

      <p className="text-center text-xs text-muted">{profile.email}로 로그인됨</p>
    </div>
  );
}
