/*
 * Which browser voice reads partner lines. Kept free of browser globals so
 * it can be unit tested with plain objects.
 *
 * Online voices (Chrome's "Google US English", Edge's "... Online (Natural)")
 * sound more human but fetch audio from a server first, which adds a pause
 * of a second or two. On-device voices start right away. The learner picks
 * which matters more in settings; on-device is the default.
 */
export type VoiceLike = Pick<SpeechSynthesisVoice, "name" | "lang" | "localService" | "default">;

const NATURAL = /natural|neural|samantha|google/i;
// macOS/iOS ship joke voices (Albert, Bells, Bubbles...) tagged en-US; never pick them.
const NOVELTY =
  /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|deranged|hysterical|pipe organ|junior|ralph|fred|kathy|princess/i;
const PREFERRED_LOCAL = /samantha|ava|allison|alex|karen|daniel|zira|david|mark|aria|jenny/i;

const isEnUS = (v: VoiceLike) => v.lang.replace("_", "-") === "en-US";
const isEn = (v: VoiceLike) => v.lang.toLowerCase().startsWith("en");

export function pickEnglishVoice<V extends VoiceLike>(voices: readonly V[], preferNatural: boolean): V | null {
  const usable = voices.filter((v) => isEn(v) && !NOVELTY.test(v.name));
  const first = (...tests: ((v: V) => boolean)[]) => {
    for (const test of tests) {
      const hit = usable.find(test);
      if (hit) return hit;
    }
    return null;
  };

  if (preferNatural) {
    return first(
      (v) => isEnUS(v) && NATURAL.test(v.name),
      (v) => isEnUS(v),
      () => true,
    );
  }
  return first(
    (v) => v.localService && isEnUS(v) && v.default,
    (v) => v.localService && isEnUS(v) && PREFERRED_LOCAL.test(v.name),
    (v) => v.localService && isEnUS(v),
    (v) => v.localService,
    (v) => isEnUS(v),
    () => true,
  );
}
