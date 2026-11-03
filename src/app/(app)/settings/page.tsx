import { ProfileForm } from "@/features/profile/ProfileForm";
import { DeleteAccount, LogoutButton } from "@/features/settings/AccountActions";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export const metadata = { title: "설정 · ENGLISH QUEST" };

export default async function SettingsPage() {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">설정</h1>

      <section aria-labelledby="learn-title" className="card">
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

      <section aria-labelledby="voice-title" className="card">
        <h2 id="voice-title" className="section-title">
          음성
        </h2>
        <p className="text-sm text-muted">
          지금 버전은 텍스트 대화만 지원해요. 음성 대화가 추가되면 마이크 권한을 쓰기 전에 목적을 먼저 안내하고, 권한을 거부해도
          텍스트로 계속 학습할 수 있게 할게요.
        </p>
      </section>

      <section aria-labelledby="privacy-title" className="card space-y-4">
        <h2 id="privacy-title" className="section-title">
          개인정보와 데이터
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>저장하는 것: 이메일, 학습 설정, 대화 텍스트, 피드백, 경험치, 복습 표현</li>
          <li>저장하지 않는 것: 음성 원본 (현재 음성 기능 없음), 비밀번호 원문 (암호화된 값만 저장)</li>
          <li>보관 기간: 직접 삭제하기 전까지 보관돼요. 계정을 삭제하면 모든 학습 데이터가 즉시 지워져요.</li>
          <li>대화에는 실제 이름, 전화번호, 주소 같은 개인정보 대신 가상의 정보를 써 주세요.</li>
        </ul>
        <div className="flex flex-wrap gap-2">
          <a href="/api/account/export" className="btn-secondary">
            내 데이터 내려받기 (JSON)
          </a>
          <LogoutButton />
        </div>
        <div className="border-t border-border pt-4">
          <DeleteAccount />
        </div>
      </section>

      <p className="text-center text-xs text-muted">{profile.email}로 로그인됨</p>
    </div>
  );
}
