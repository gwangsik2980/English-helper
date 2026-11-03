import { describe, expect, it } from "vitest";
import { englishVoices, pickEnglishVoice, type VoiceLike } from "@/features/voice/voice-choice";

const v = (name: string, lang: string, localService: boolean, isDefault = false, voiceURI?: string): VoiceLike => ({
  name,
  lang,
  localService,
  default: isDefault,
  voiceURI,
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

  it("prefers a downloaded Premium or Enhanced Apple voice over the compact one in both modes", () => {
    const upgraded = [
      ...iphone,
      v("Samantha", "en-US", true, false, "com.apple.voice.enhanced.en-US.Samantha"),
      v("Ava", "en-US", true, false, "com.apple.voice.premium.en-US.Ava"),
    ];
    expect(pickEnglishVoice(upgraded, false)?.voiceURI).toBe("com.apple.voice.premium.en-US.Ava");
    expect(pickEnglishVoice(upgraded, true)?.voiceURI).toBe("com.apple.voice.premium.en-US.Ava");
    const enhancedOnly = [...iphone, v("Zoe (Enhanced)", "en-US", true)];
    expect(pickEnglishVoice(enhancedOnly, false)?.name).toBe("Zoe (Enhanced)");
    // An online voice that merely says "enhanced" is not an on-device upgrade.
    expect(pickEnglishVoice([...edge, v("Enhanced Cloud", "en-US", false)], false)?.name).toMatch(/^Microsoft Zira/);
  });

  it("falls back to an online voice when no on-device English voice exists, and to null when none at all", () => {
    expect(pickEnglishVoice([v("Google US English", "en-US", false)], false)?.name).toBe("Google US English");
    expect(pickEnglishVoice([v("Yuna", "ko-KR", true)], false)).toBeNull();
  });

  it("lists English voices for the picker with high-quality ones first and no joke voices", () => {
    const list = englishVoices([
      ...iphone,
      v("Ava", "en-US", true, false, "com.apple.voice.premium.en-US.Ava"),
      v("Daniel", "en-GB", true),
    ]);
    expect(list.map((x) => x.name)).toEqual(["Ava", "Samantha", "Daniel"]);
  });
});
