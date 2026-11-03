"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/*
 * Free text-to-speech via the browser's speechSynthesis. Voices come from
 * the OS, so quality differs by device. The text bubble always stays
 * visible, so failure here never blocks learning.
 */

function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "en-US" && /natural|neural|samantha|google/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null
  );
}

const noopSubscribe = () => () => {};
const hasSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeechSynthesis() {
  const supported = useSyncExternalStore(noopSubscribe, hasSynthesis, () => false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (!hasSynthesis()) return;
    const load = () => {
      voiceRef.current = pickEnglishVoice();
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const speak = useCallback((id: string, text: string, rate = 1) => {
    if (!("speechSynthesis" in window)) return;
    setError(null);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    if (voiceRef.current) u.voice = voiceRef.current;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = (e) => {
      setSpeakingId(null);
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setError("소리로 읽지 못했어요. 기기 소리 설정을 확인하거나 텍스트로 읽어 주세요.");
      }
    };
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
  }, []);

  return { supported, speakingId, error, speak, stop };
}
