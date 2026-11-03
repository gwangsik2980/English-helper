import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signUp } from "@/server/auth";
import { setAiForTesting } from "@/server/ai";
import { RuleBasedAnalyzer, ScriptedPartner } from "@/server/ai/mock";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { seedMissions } from "@/server/repositories/missions";
import { completeSession, getFeedback, hasInsufficientData, isLowConfidenceTranscript } from "@/server/services/feedback";
import { saveProfile } from "@/server/services/profile";
import { addTurn, startSession } from "@/server/services/sessions";

async function newUser() {
  const { userId } = await signUp({ email: `v-${randomUUID()}@example.test`, password: "password123" });
  await saveProfile(userId, {
    displayName: "음성",
    level: "beginner",
    goals: ["daily"],
    correctionMode: "after_session",
    dailyMinutes: 10,
  });
  return userId;
}

beforeAll(async () => {
  await seedMissions();
});
beforeEach(() => setAiForTesting({ partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() }));
afterEach(() => setAiForTesting(null));

describe("low-confidence transcripts", () => {
  it("only flags unedited voice lines below 0.5", () => {
    expect(isLowConfidenceTranscript({ text: "x", modality: "voice", transcriptConfidence: 0.3 })).toBe(true);
    expect(isLowConfidenceTranscript({ text: "x", modality: "voice", transcriptConfidence: 0.8 })).toBe(false);
    expect(isLowConfidenceTranscript({ text: "x", modality: "voice", transcriptConfidence: null })).toBe(false);
    expect(isLowConfidenceTranscript({ text: "x", modality: "text", transcriptConfidence: 0.1 })).toBe(false);
  });

  it("does not count low-confidence lines toward enough data", () => {
    const misheard = { modality: "voice", transcriptConfidence: 0.2 };
    expect(
      hasInsufficientData([
        { text: "Could I have a latte with oat milk please", ...misheard },
        { text: "Medium size for here thank you", ...misheard },
      ]),
    ).toBe(true);
    expect(
      hasInsufficientData([
        { text: "Could I have a latte with oat milk please", modality: "voice", transcriptConfidence: 0.9 },
        { text: "Medium size for here thank you", modality: "voice", transcriptConfidence: null },
      ]),
    ).toBe(false);
  });
});

describe("voice turns", () => {
  it("stores modality and confidence, and ignores confidence on typed turns", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const v = await addTurn(userId, sessionId, {
      text: "Could I have a latte?",
      clientTurnId: randomUUID(),
      modality: "voice",
      transcriptConfidence: 0.91,
    });
    const t = await addTurn(userId, sessionId, {
      text: "Medium, please.",
      clientTurnId: randomUUID(),
      transcriptConfidence: 0.2, // ignored: typed turns have no recognizer
    });
    const rows = await prisma.turn.findMany({ where: { id: { in: [v.userTurn.id, t.userTurn.id] } } });
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(byId.get(v.userTurn.id)).toMatchObject({ modality: "voice", transcriptConfidence: 0.91 });
    expect(byId.get(t.userTurn.id)).toMatchObject({ modality: "text", transcriptConfidence: null });
    expect(v.userTurn.modality).toBe("voice");
  });

  it("rejects an out-of-range confidence", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await expect(
      addTurn(userId, sessionId, { text: "Hi", clientTurnId: randomUUID(), modality: "voice", transcriptConfidence: 3 }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("holds scores when every learner line was misheard", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    for (const text of ["Could I have a latte with oat milk please", "Medium for here thank you very much"]) {
      await addTurn(userId, sessionId, { text, clientTurnId: randomUUID(), modality: "voice", transcriptConfidence: 0.3 });
    }
    await completeSession(userId, sessionId);
    const { view, xp } = await getFeedback(userId, sessionId);
    expect(view.status).toBe("ok");
    if (view.status === "ok") expect(view.feedback.insufficient_data).toBe(true);
    expect(xp.map((e) => e.eventType)).toEqual(["mission_complete"]);
  });
});
