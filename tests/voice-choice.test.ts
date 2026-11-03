import { describe, expect, it } from "vitest";
import { pickEnglishVoice, type VoiceLike } from "@/features/voice/voice-choice";

const v = (name: string, lang: string, localService: boolean, isDefault = false): VoiceLike => ({
  name,
  lang,
  localService,
  default: isDefault,
});

// Roughly what PC Chrome and Edge report.
const chrome = [v("Microsoft David - English (United States)", "en-US", true, true), v("Google US English", "en-US", false), v("Google 한국의", "ko-KR", false)];
const edge = [
  v("Microsoft Zira - English (United States)", "en-US", true),
  v("Microsoft Aria Online (Natural) - English (United States)", "en-US", false),
  v("Microsoft SunHi Online (Natural) - Korean (Korea)", "ko-KR", false),
];
// iPhone Safari: every voice is on-device, including joke voices tagged en-US.
const iphone = [v("Albert", "en-US", true), v("Samantha", "en-US", true), v("Yuna", "ko-KR", true, true)];

describe("pickEnglishVoice", () => {
  it("uses an on-device voice by default so speech starts right away", () => {
    expect(pickEnglishVoice(chrome, false)?.name).toMatch(/^Microsoft David/);
    expect(pickEnglishVoice(edge, false)?.name).toMatch(/^Microsoft Zira/);
  });

  it("uses the online natural voice when the learner turns it on", () => {
    expect(pickEnglishVoice(chrome, true)?.name).toBe("Google US English");
    expect(pickEnglishVoice(edge, true)?.name).toMatch(/Aria Online \(Natural\)/);
  });

  it("skips novelty voices and non-English voices on iPhone", () => {
    expect(pickEnglishVoice(iphone, false)?.name).toBe("Samantha");
    expect(pickEnglishVoice(iphone, true)?.name).toBe("Samantha");
  });

  it("falls back to an online voice when no on-device English voice exists, and to null when none at all", () => {
    expect(pickEnglishVoice([v("Google US English", "en-US", false)], false)?.name).toBe("Google US English");
    expect(pickEnglishVoice([v("Yuna", "ko-KR", true)], false)).toBeNull();
  });
});
