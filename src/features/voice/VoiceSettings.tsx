"use client";

import { useSpeechSynthesis } from "./speech-synthesis";
import { isHighQuality } from "./voice-choice";
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
  const voice = tts.supported ? tts.voiceFor(prefs.naturalVoice, prefs.voiceURI) : null;
  const upgraded = voice ? isHighQuality(voice) : false;
  const hasHighQuality = tts.choices.some(isHighQuality);

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

      <div className="card-soft space-y-3 p-4 text-sm">
        <div>
          <label htmlFor="voice-pick" className="label">
            목소리
          </label>
          <div className="flex gap-2">
            <select
              id="voice-pick"
              className="input flex-1"
              value={prefs.voiceURI ?? ""}
              onChange={(e) => update({ voiceURI: e.target.value || null })}
            >
              <option value="">자동으로 고르기</option>
              {tts.choices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} · {v.lang}
                  {isHighQuality(v) ? " · 고품질" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary shrink-0"
              disabled={!voice}
              onClick={() =>
                tts.speakingId === "preview"
                  ? tts.stop()
                  : tts.speak("preview", "Hi there! What can I get started for you today?", prefs.rate, prefs.naturalVoice, prefs.voiceURI)
              }
            >
              {tts.speakingId === "preview" ? "멈추기" : "들어 보기"}
            </button>
          </div>
        </div>
        <p>
          <span className="text-muted">지금 목소리 </span>
          <span className="font-semibold" lang="en">
            {voice ? voice.name : "영어 목소리를 찾는 중이거나 이 기기에 없어요"}
          </span>
          {upgraded && <span className="text-muted"> · 고품질</span>}
        </p>
        {tts.error && (
          <p role="alert" className="text-bad">
            {tts.error}
          </p>
        )}
        {tts.choices.length > 0 && !hasHighQuality && (
          <p className="text-muted">
            이 브라우저가 넘겨준 영어 목소리 {tts.choices.length}개 중에 고품질 음성이 없어요. 기기에 받아 둔 음성이 목록에 없다면
            브라우저가 웹사이트에 그 음성을 열어 주지 않는 거예요.
          </p>
        )}
      </div>
    </div>
  );
}
