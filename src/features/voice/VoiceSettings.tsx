"use client";

import { useSpeechSynthesis } from "./speech-synthesis";
import { useVoicePrefs } from "./voice-prefs";

const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (on: boolean) => void }) => (
  <label className="flex cursor-pointer items-center justify-between gap-4">
    <span className="font-medium">{label}</span>
    <input
      type="checkbox"
      className="h-5 w-5 accent-white"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
    />
  </label>
);

export function VoiceSettings() {
  const { prefs, update } = useVoicePrefs();
  const tts = useSpeechSynthesis();
  const voice = tts.supported ? tts.voiceFor(prefs.naturalVoice) : null;
  const upgraded = voice ? /premium|enhanced|프리미엄|향상/i.test(`${voice.name} ${voice.voiceURI}`) : false;

  if (!tts.supported) {
    return <p className="text-sm text-muted">이 브라우저는 소리로 읽기를 지원하지 않아요. 텍스트로는 그대로 쓸 수 있어요.</p>;
  }

  return (
    <div className="space-y-4">
      <fieldset className="space-y-3">
        <legend className="sr-only">상대 말 듣기</legend>
        <Toggle label="새 답 자동으로 읽기" checked={prefs.autoRead} onChange={(on) => update({ autoRead: on })} />
        <Toggle label="느리게 읽기" checked={prefs.rate < 1} onChange={(on) => update({ rate: on ? 0.8 : 1 })} />
        <Toggle
          label="인터넷 음성 쓰기 (PC 크롬·엣지)"
          checked={prefs.naturalVoice}
          onChange={(on) => update({ naturalVoice: on })}
        />
      </fieldset>

      <div className="card-soft space-y-1 p-4 text-sm">
        <p>
          <span className="text-muted">지금 목소리 </span>
          <span className="font-semibold" lang="en">
            {voice ? voice.name : "영어 목소리를 찾는 중이거나 이 기기에 없어요"}
          </span>
          {upgraded && <span className="text-muted"> · 고품질</span>}
        </p>
        {voice && !upgraded && (
          <p className="text-muted">
            아이폰은 설정 → 손쉬운 사용 → 읽기 및 말하기 → 음성 → 영어에서 Ava 프리미엄을 받으면 더 자연스러워요.
          </p>
        )}
      </div>
    </div>
  );
}
