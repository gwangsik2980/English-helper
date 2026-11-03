"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/*
 * Per-device voice preferences. Stored in localStorage on purpose: they are
 * conveniences tied to the device's mic/speakers, not account data.
 */
export type VoicePrefs = {
  /** Read each new partner line aloud automatically. */
  autoRead: boolean;
  /** Speech rate for partner lines (0.8 = slower). */
  rate: number;
  /** The learner has seen the microphone purpose notice. */
  micIntroSeen: boolean;
};

const KEY = "eq.voice.v1";
const EVENT = "eq-voice-prefs";
const DEFAULTS: VoicePrefs = { autoRead: false, rate: 1, micIntroSeen: false };

// In-memory fallback when storage is blocked (private mode etc.).
let memory: string | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useVoicePrefs() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  const prefs = useMemo<VoicePrefs>(() => {
    if (!raw) return DEFAULTS;
    try {
      return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<VoicePrefs>) };
    } catch {
      return DEFAULTS;
    }
  }, [raw]);

  const update = useCallback(
    (patch: Partial<VoicePrefs>) => {
      const next = JSON.stringify({ ...prefs, ...patch });
      memory = next;
      try {
        window.localStorage.setItem(KEY, next);
      } catch {
        // keep in memory only
      }
      window.dispatchEvent(new Event(EVENT));
    },
    [prefs],
  );

  return { prefs, update };
}
