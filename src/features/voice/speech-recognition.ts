"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * Free speech-to-text via the browser's Web Speech API.
 * Availability varies by browser (Chrome/Edge/Safari yes, Firefox no), so
 * every caller must keep the text input as the primary path.
 * Chrome sends the audio to its own speech service; our server never
 * receives audio — only the confirmed text the learner sends.
 */

// Minimal typings: the DOM lib does not ship these for all TS versions.
type SRAlternative = { transcript: string; confidence: number };
type SRResult = { isFinal: boolean; length: number; [i: number]: SRAlternative };
type SREvent = { resultIndex: number; results: { length: number; [i: number]: SRResult } };
type SRErrorEvent = { error: string };
interface SRInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type SRConstructor = new () => SRInstance;

function getRecognitionCtor(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type RecognitionState = "idle" | "listening" | "unsupported";

export type RecognitionResult = {
  transcript: string;
  /** 0–1 from the browser, or null when it reports none (some browsers send 0). */
  confidence: number | null;
};

const ERROR_KO: Record<string, string> = {
  "not-allowed": "마이크 권한이 꺼져 있어요. 브라우저 주소창의 마이크 아이콘에서 허용하거나, 텍스트로 계속해 주세요.",
  "service-not-allowed": "이 브라우저에서 음성 인식을 쓸 수 없어요. 텍스트로 계속해 주세요.",
  "no-speech": "말소리가 들리지 않았어요. 마이크 가까이에서 다시 말해 보세요.",
  "audio-capture": "마이크를 찾지 못했어요. 마이크 연결을 확인하거나 텍스트로 계속해 주세요.",
  network: "음성 인식 서버에 연결하지 못했어요. 인터넷을 확인하거나 텍스트로 계속해 주세요.",
  "language-not-supported": "영어 음성 인식을 지원하지 않는 환경이에요. 텍스트로 계속해 주세요.",
};

const noopSubscribe = () => () => {};

export function useSpeechRecognition(onResult: (r: RecognitionResult) => void) {
  // Server snapshot assumes support; the client corrects it after hydration.
  const supported = useSyncExternalStore(noopSubscribe, () => getRecognitionCtor() !== null, () => true);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SRInstance | null>(null);
  const resultRef = useRef<RecognitionResult | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => () => recRef.current?.abort(), []);

  const state: RecognitionState = !supported ? "unsupported" : listening ? "listening" : "idle";

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    setError(null);
    setInterim("");
    resultRef.current = null;
    const rec = new Ctor();
    rec.lang = "en-US";
    // One utterance per press: the mic never keeps listening on its own (spec 5).
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let finalText = "";
      let interimText = "";
      let conf: number | null = null;
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        const alt = r[0];
        if (r.isFinal) {
          finalText += alt.transcript;
          conf = alt.confidence > 0 ? alt.confidence : conf;
        } else {
          interimText += alt.transcript;
        }
      }
      setInterim(finalText || interimText);
      if (finalText) resultRef.current = { transcript: finalText.trim(), confidence: conf };
    };
    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setError(ERROR_KO[e.error] ?? "음성을 알아듣지 못했어요. 다시 시도하거나 텍스트로 계속해 주세요.");
    };
    rec.onend = () => {
      setListening(false);
      setInterim("");
      recRef.current = null;
      if (resultRef.current?.transcript) onResultRef.current(resultRef.current);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("음성 인식을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);
  const cancel = useCallback(() => {
    resultRef.current = null;
    recRef.current?.abort();
  }, []);

  return { state, interim, error, clearError: () => setError(null), start, stop, cancel };
}
