"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CLOUD_PREFIX, DEFAULT_CLOUD_VOICE, isCloudVoiceId, type CloudVoiceId } from "@/shared/cloud-voices";
import { englishVoices, pickEnglishVoice } from "./voice-choice";

/*
 * Reads partner lines aloud. With a cloud voice available (server has a
 * Google TTS key) lines are fetched as MP3 from /api/speech; otherwise, or
 * if that fails, the browser's own speechSynthesis reads them. The text
 * bubble always stays visible, so failure here never blocks learning.
 */

/** The learner's picked device voice when it still exists, else the automatic choice. */
function resolveVoice(voices: SpeechSynthesisVoice[], preferNatural: boolean, voiceURI: string | null) {
  const picked = voiceURI && !voiceURI.startsWith(CLOUD_PREFIX) ? voices.find((v) => v.voiceURI === voiceURI) : undefined;
  return picked ?? pickEnglishVoice(voices, preferNatural);
}

/** Cloud voice to use for a preference value, or null for a device voice. */
export function cloudVoiceFor(cloud: boolean, voiceURI: string | null): CloudVoiceId | null {
  if (!cloud) return null;
  if (!voiceURI) return DEFAULT_CLOUD_VOICE;
  if (!voiceURI.startsWith(CLOUD_PREFIX)) return null;
  const id = voiceURI.slice(CLOUD_PREFIX.length);
  return isCloudVoiceId(id) ? id : DEFAULT_CLOUD_VOICE;
}

// One shared <audio> element. iPhone Safari only lets a page play audio that
// a tap started; once this element has played inside a tap, later plays of
// the same element (after a network round trip) are allowed.
let audioEl: HTMLAudioElement | null = null;
let silentWav: string | null = null;

function makeSilentWav() {
  const samples = 800; // 0.1 s at 8 kHz, 8-bit mono
  const buf = new Uint8Array(44 + samples);
  const view = new DataView(buf.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  buf.fill(128, 44);
  let bin = "";
  buf.forEach((b) => (bin += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

function sharedAudio() {
  if (!audioEl) audioEl = new Audio();
  return audioEl;
}

/** Call from a tap (send, mic) so a later automatic read can play on iPhone. */
export function primeAudio() {
  if (typeof window === "undefined") return;
  const a = sharedAudio();
  if (!a.paused) return;
  silentWav ??= makeSilentWav();
  a.src = silentWav;
  void a.play().catch(() => undefined);
}

const noopSubscribe = () => () => {};
const hasSynthesis = () => typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeechSynthesis({ cloud = false }: { cloud?: boolean } = {}) {
  const deviceSupported = useSyncExternalStore(noopSubscribe, hasSynthesis, () => false);
  const supported = cloud || deviceSupported;
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  /** Bumped on every speak/stop so events from an older line are ignored. */
  const generation = useRef(0);

  useEffect(() => {
    if (!hasSynthesis()) return;
    // Some browsers (Chrome) fill the voice list late; asking once starts the load.
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
      audioEl?.pause();
    };
  }, []);

  const stop = useCallback(() => {
    generation.current += 1;
    if (hasSynthesis()) window.speechSynthesis.cancel();
    audioEl?.pause();
    setSpeakingId(null);
  }, []);

  const speakOnDevice = useCallback(
    (gen: number, id: string, text: string, rate: number, preferNatural: boolean, voiceURI: string | null) => {
      if (!hasSynthesis()) {
        setSpeakingId(null);
        setError("소리로 읽지 못했어요. 텍스트로 읽어 주세요.");
        return;
      }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rate;
      const voice = resolveVoice(window.speechSynthesis.getVoices(), preferNatural, voiceURI);
      if (voice) u.voice = voice;
      u.onend = () => {
        if (generation.current === gen) setSpeakingId(null);
      };
      u.onerror = (e) => {
        if (generation.current !== gen) return;
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

  /**
   * id is the partner turn id ("preview" for the settings sample).
   * preferNatural picks online device voices that sound better but can start a second or two later.
   */
  const speak = useCallback(
    (id: string, text: string, rate = 1, preferNatural = false, voiceURI: string | null = null) => {
      generation.current += 1;
      const gen = generation.current;
      setError(null);
      if (hasSynthesis()) window.speechSynthesis.cancel();
      const cloudVoice = cloudVoiceFor(cloud, voiceURI);
      if (!cloudVoice) {
        audioEl?.pause();
        speakOnDevice(gen, id, text, rate, preferNatural, voiceURI);
        return;
      }

      // Both the element's error event and the rejected play() can report one failure.
      let fellBack = false;
      const fallback = () => {
        if (generation.current !== gen || fellBack) return;
        fellBack = true;
        speakOnDevice(gen, id, text, rate, preferNatural, null);
      };
      const a = sharedAudio();
      a.pause();
      a.onended = () => {
        if (generation.current === gen) setSpeakingId(null);
      };
      a.onerror = fallback;
      const q = id === "preview" ? "preview=1" : `turnId=${encodeURIComponent(id)}`;
      a.src = `/api/speech?${q}&voice=${cloudVoice}`;
      a.playbackRate = rate;
      setSpeakingId(id);
      void a.play().catch((e: unknown) => {
        // AbortError: a newer line replaced this one.
        if (!(e instanceof DOMException && e.name === "AbortError")) fallback();
      });
    },
    [cloud, speakOnDevice],
  );

  /** The device voice speak() would use, for showing in settings. */
  const voiceFor = useCallback(
    (preferNatural: boolean, voiceURI: string | null = null) => resolveVoice(voices, preferNatural, voiceURI),
    [voices],
  );
  const choices = englishVoices(voices);

  return { supported, speakingId, error, speak, stop, voiceFor, choices };
}
