import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { signUp } from "@/server/auth";
import { setAiForTesting } from "@/server/ai";
import { RuleBasedAnalyzer, ScriptedPartner } from "@/server/ai/mock";
import { AppError } from "@/server/errors";
import { seedMissions } from "@/server/repositories/missions";
import { saveProfile } from "@/server/services/profile";
import { addTurn, startSession } from "@/server/services/sessions";
import { partnerLineAudio, parseVoice } from "@/server/services/speech";
import { cloudVoiceFor } from "@/features/voice/speech-synthesis";

async function newUser() {
  const { userId } = await signUp({ email: `s-${randomUUID()}@example.test`, password: "password123" });
  await saveProfile(userId, { displayName: "t", level: "beginner", goals: ["daily"], correctionMode: "after_session", dailyMinutes: 10 });
  return userId;
}

const code = (c: string) => (e: unknown) => e instanceof AppError && e.code === c;

beforeAll(async () => {
  await seedMissions();
});
beforeEach(() => setAiForTesting({ partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() }));
afterEach(() => {
  setAiForTesting(null);
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("partner line audio", () => {
  it("voices only the owner's stored partner lines, with the key in a header", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const { aiTurn, userTurn } = await addTurn(userId, sessionId, { text: "Could I get a latte?", clientTurnId: randomUUID() });

    vi.stubEnv("GOOGLE_TTS_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => Response.json({ audioContent: Buffer.from("mp3").toString("base64") }));
    vi.stubGlobal("fetch", fetchMock);

    const audio = await partnerLineAudio(userId, aiTurn.id, "Aoede");
    expect(audio.toString()).toBe("mp3");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).not.toContain("test-key");
    expect((init.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("test-key");
    const body = JSON.parse(init.body as string);
    expect(body.voice.name).toBe("en-US-Chirp3-HD-Aoede");
    expect(body.input.text).toBe(aiTurn.text);

    // The learner's own line, someone else's line, and unknown voices are refused.
    await expect(partnerLineAudio(userId, userTurn.id, "Aoede")).rejects.toSatisfy(code("not_found"));
    await expect(partnerLineAudio(await newUser(), aiTurn.id, "Aoede")).rejects.toSatisfy(code("not_found"));
    expect(() => parseVoice("Bogus")).toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports the voice as unavailable without a key or when Google fails", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const { aiTurn } = await addTurn(userId, sessionId, { text: "Hi", clientTurnId: randomUUID() });

    vi.stubEnv("GOOGLE_TTS_API_KEY", "");
    await expect(partnerLineAudio(userId, aiTurn.id, "Kore")).rejects.toSatisfy(code("service_unavailable"));

    vi.stubEnv("GOOGLE_TTS_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("quota", { status: 429 })));
    await expect(partnerLineAudio(userId, aiTurn.id, "Kore")).rejects.toSatisfy(code("service_unavailable"));
  });
});

describe("cloudVoiceFor", () => {
  it("uses the cloud voice by default only when the server has one", () => {
    expect(cloudVoiceFor(false, null)).toBeNull();
    expect(cloudVoiceFor(true, null)).toBe("Aoede");
    expect(cloudVoiceFor(true, "google:Charon")).toBe("Charon");
    expect(cloudVoiceFor(true, "com.apple.voice.compact.en-GB.Daniel")).toBeNull();
    expect(cloudVoiceFor(false, "google:Charon")).toBeNull();
  });
});
