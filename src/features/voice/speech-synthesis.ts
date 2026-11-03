"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { englishVoices, pickEnglishVoice } from "./voice-choice";

/** The learner's picked voice when it still exists on this device, else the automatic choice. */
function resolveVoice(voices: SpeechSynthesisVoice[], preferNatural: boolean, voiceURI: string | null) {
  return (voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : undefined) ?? pickEnglishVoice(voices, preferNatural);
}

/*
 * Free text-to-speech via the browser's speechSynthesis. Voices come from
 * the OS, so quality differs by device. The text bubble always stays
 * visible, so failure here never blocks learning.
 */

const noopSubscribe = () => () => {};
const hasSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeechSynthesis() {
  const supported = useSyncExternalStore(noopSubscribe, hasSynthesis, () => false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!hasSynthesis()) return;
    // Some browsers (Chrome) fill the voice list late; asking once starts the load.
    const load = () => setVoices(window.speechSynthesis.getVoices());
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

  /** preferNatural picks online voices that sound better but can start a second or two later. */
  const speak = useCallback(
    (id: string, text: string, rate = 1, preferNatural = false, voiceURI: string | null = null) => {
    if (!("speechSynthesis" in window)) return;
    setError(null);
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    const voice = resolveVoice(window.speechSynthesis.getVoices(), preferNatural, voiceURI);
    if (voice) u.voice = voice;
    u.onend = () => setSpeakingId((cur) => (cur === id ? null : cur));
    u.onerror = (e) => {
      setSpeakingId(null);
      if (e.error !== "interrupted" && e.error !== "canceled") {
        setError("소리로 읽지 못했어요. 기기 소리 설정을 확인하거나 텍스트로 읽어 주세요.");
      }
    };
    setSpeakingId(id);
    window.speechSynthesis.speak(u);
    },
    [],
  );

  /** The voice speak() would use now, for showing in settings. */
  const voiceFor = useCallback(
    (preferNatural: boolean, voiceURI: string | null = null) => resolveVoice(voices, preferNatural, voiceURI),
    [voices],
  );
  const choices = englishVoices(voices);

  return { supported, speakingId, error, speak, stop, voiceFor, choices };
}
