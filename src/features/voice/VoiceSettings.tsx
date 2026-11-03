"use client";

import { useSpeechRecognition } from "./speech-recognition";
import { useSpeechSynthesis } from "./speech-synthesis";
import { useVoicePrefs } from "./voice-prefs";

export function VoiceSettings() {
  const { prefs, update } = useVoicePrefs();
  const stt = useSpeechRecognition(() => {});
  const tts = useSpeechSynthesis();

  return (
    <div className="space-y-5">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="card-soft p-4">
          <dt className="text-muted">말하기 (음성 인식)</dt>
          <dd className="mt-1 font-semibold">
            {stt.state === "unsupported" ? "이 브라우저에서는 쓸 수 없어요" : "사용할 수 있어요"}
          </dd>
        </div>
        <div className="card-soft p-4">
          <dt className="text-muted">듣기 (소리로 읽기)</dt>
          <dd className="mt-1 font-semibold">{tts.supported ? "사용할 수 있어요" : "이 브라우저에서는 쓸 수 없어요"}</dd>
        </div>
      </dl>

      <fieldset className="space-y-3">
        <legend className="label">상대 말 듣기</legend>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-medium">새 답을 자동으로 소리 내어 읽기</span>
            <span className="text-sm text-muted">꺼 두어도 말풍선 아래 &lsquo;듣기&rsquo;로 언제든 들을 수 있어요.</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-white"
            checked={prefs.autoRead}
            onChange={(e) => update({ autoRead: e.target.checked })}
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-medium">느리게 읽기</span>
            <span className="text-sm text-muted">평소 속도의 0.8배로 읽어요.</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-white"
            checked={prefs.rate < 1}
            onChange={(e) => update({ rate: e.target.checked ? 0.8 : 1 })}
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-medium">자연스러운 목소리 쓰기</span>
            <span className="text-sm text-muted">
              PC 크롬·엣지에서 더 사람 같은 인터넷 음성으로 읽어요. 대신 소리가 나오기까지 1~2초 걸릴 수 있어요. 끄면 기기에 내장된
              목소리로 바로 읽어요. 아이폰은 원래 내장 목소리라 차이가 거의 없어요.
            </span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-white"
            checked={prefs.naturalVoice}
            onChange={(e) => update({ naturalVoice: e.target.checked })}
          />
        </label>
      </fieldset>

      <div className="space-y-1 text-sm text-muted">
        <p>
          음성 기능은 브라우저에 내장된 기능을 써서 무료예요. 마이크 버튼을 누를 때마다 한 문장만 듣고 자동으로 멈추고, 받아 적은
          문장은 보내기 전에 확인하고 고칠 수 있어요.
        </p>
        <p>
          녹음된 소리는 우리 서버로 오지 않아요. 브라우저의 음성 인식 서비스(Chrome은 Google)가 처리하고, 우리 서버에는 보낸 글자와
          인식 확신도만 저장돼요. 마이크 권한은 주소창의 마이크 아이콘에서 언제든 끌 수 있어요.
        </p>
        <p>이 설정은 지금 쓰는 기기에만 저장돼요.</p>
      </div>
    </div>
  );
}
