import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { signUp } from "@/server/auth";
import { setAiForTesting } from "@/server/ai";
import { RuleBasedAnalyzer, ScriptedPartner } from "@/server/ai/mock";
import type { ConversationPartner, FeedbackAnalyzer } from "@/server/ai/ports";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { seedMissions } from "@/server/repositories/missions";
import { deleteAccountData } from "@/server/services/account";
import { completeSession, getFeedback } from "@/server/services/feedback";
import { saveProfile } from "@/server/services/profile";
import { recommendMissions } from "@/server/services/recommend";
import { completeReviewItem, saveReviewItem } from "@/server/services/review";
import { addTurn, getSession, startSession } from "@/server/services/sessions";
import { xpSummary } from "@/server/services/xp";

async function newUser() {
  const { userId } = await signUp({ email: `u-${randomUUID()}@example.test`, password: "password123" });
  await saveProfile(userId, {
    displayName: "테스터",
    level: "beginner",
    goals: ["daily"],
    correctionMode: "after_session",
    dailyMinutes: 10,
  });
  return userId;
}

const say = (userId: string, sessionId: string, text: string, clientTurnId = randomUUID()) =>
  addTurn(userId, sessionId, { text, clientTurnId });

async function expectNotFound(p: Promise<unknown>) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === "not_found");
}

beforeAll(async () => {
  await seedMissions();
});

beforeEach(() => {
  setAiForTesting({ partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() });
});

afterEach(() => setAiForTesting(null));

describe("text mission end to end (demo adapters)", () => {
  it("runs start -> turns -> complete -> feedback with evidence and XP", async () => {
    const userId = await newUser();
    const { sessionId, resumed } = await startSession(userId, "cafe-order");
    expect(resumed).toBe(false);

    await say(userId, sessionId, "Hi, I want a latte");
    await say(userId, sessionId, "A medium, please. Can I get that with oat milk?");
    await say(userId, sessionId, "For here, thank you.");

    // Starting the same mission again resumes the open session (QST-04).
    expect((await startSession(userId, "cafe-order")).sessionId).toBe(sessionId);

    await completeSession(userId, sessionId);
    const { view, xp } = await getFeedback(userId, sessionId);
    expect(view.status).toBe("ok");
    if (view.status !== "ok") return;

    const session = await getSession(userId, sessionId);
    const userTurnIds = new Set(session.turns.filter((t) => t.speaker === "user").map((t) => t.id));
    for (const g of view.feedback.goal_outcomes) {
      expect(g.status).toBe("met");
      g.evidence_turn_ids.forEach((id) => expect(userTurnIds.has(id)).toBe(true));
    }
    expect(view.feedback.improvements[0]?.suggested).toMatch(/Could I have/);

    // 20 completion + 3 goals x 10
    expect(xp.reduce((s, e) => s + e.amount, 0)).toBe(50);
    expect((await xpSummary(userId)).total).toBe(50);
  });

  it("never grants XP twice when completion is retried", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await say(userId, sessionId, "Could I have a latte with oat milk?");
    await say(userId, sessionId, "Medium, for here please.");

    await completeSession(userId, sessionId);
    const again = await completeSession(userId, sessionId);
    expect(again.alreadyCompleted).toBe(true);
    await Promise.all([completeSession(userId, sessionId), completeSession(userId, sessionId)]);

    expect((await xpSummary(userId)).total).toBe(50);
    expect(await prisma.sessionFeedback.count({ where: { sessionId } })).toBe(1);
  });

  it("does not duplicate a learner turn when the client retries the same send", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const id = randomUUID();
    const first = await say(userId, sessionId, "Could I have a latte?", id);
    const retry = await say(userId, sessionId, "Could I have a latte?", id);
    expect(retry.userTurn.id).toBe(first.userTurn.id);
    expect(retry.aiTurn.id).toBe(first.aiTurn.id);
    expect(await prisma.turn.count({ where: { sessionId } })).toBe(3); // opening + user + ai
  });

  it("keeps the learner turn when the partner fails, and fills the reply on retry", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const failing: ConversationPartner = {
      modelName: "failing",
      reply: async () => {
        throw new AppError("ai_unavailable", "down");
      },
    };
    setAiForTesting({ partner: failing, analyzer: new RuleBasedAnalyzer() });
    const id = randomUUID();
    await expect(say(userId, sessionId, "Could I have a latte?", id)).rejects.toBeInstanceOf(AppError);
    expect(await prisma.turn.count({ where: { sessionId, speaker: "user" } })).toBe(1);

    setAiForTesting({ partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() });
    const ok = await say(userId, sessionId, "Could I have a latte?", id);
    expect(ok.aiTurn.speaker).toBe("ai");
    expect(await prisma.turn.count({ where: { sessionId, speaker: "user" } })).toBe(1);

    // Editing after a failure replaces the unanswered line instead of stacking.
    setAiForTesting({ partner: failing, analyzer: new RuleBasedAnalyzer() });
    await expect(say(userId, sessionId, "Medium plz")).rejects.toBeInstanceOf(AppError);
    setAiForTesting({ partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() });
    await say(userId, sessionId, "A medium, please.");
    const texts = (await getSession(userId, sessionId)).turns.filter((t) => t.speaker === "user").map((t) => t.text);
    expect(texts).toEqual(["Could I have a latte?", "A medium, please."]);
  });

  it("holds scores for a very short session but still records completion", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await say(userId, sessionId, "Latte");
    await completeSession(userId, sessionId);
    const { view, xp } = await getFeedback(userId, sessionId);
    expect(view.status).toBe("ok");
    if (view.status === "ok") {
      expect(view.feedback.insufficient_data).toBe(true);
      expect(view.feedback.goal_outcomes.every((g) => g.status === "undetermined")).toBe(true);
    }
    expect(xp.map((e) => e.eventType)).toEqual(["mission_complete"]);
    expect(await prisma.skillObservation.count({ where: { sessionId } })).toBe(0);
  });

  it("shows a safe fallback instead of invalid model output", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await say(userId, sessionId, "Could I have a latte with oat milk?");
    await say(userId, sessionId, "Medium, for here please.");
    const bad: FeedbackAnalyzer = {
      modelName: "bad",
      analyze: async () => ({ goal_outcomes: [{ goal_id: "order_item", status: "met", reason_ko: "", evidence_turn_ids: ["fake"] }] }),
    };
    setAiForTesting({ partner: new ScriptedPartner(), analyzer: bad });
    await completeSession(userId, sessionId);
    const { view, xp } = await getFeedback(userId, sessionId);
    expect(view.status).toBe("unavailable");
    expect(xp.map((e) => e.eventType)).toEqual(["mission_complete"]);
  });
});

describe("ownership", () => {
  it("denies another user's session, feedback and review data", async () => {
    const owner = await newUser();
    const intruder = await newUser();
    const { sessionId } = await startSession(owner, "cafe-order");
    const t = await say(owner, sessionId, "I want a latte");
    await say(owner, sessionId, "Medium with oat milk, for here please.");

    await expectNotFound(getSession(intruder, sessionId));
    await expectNotFound(say(intruder, sessionId, "hello"));
    await expectNotFound(completeSession(intruder, sessionId));

    await completeSession(owner, sessionId);
    await expectNotFound(getFeedback(intruder, sessionId));
    await expectNotFound(saveReviewItem(intruder, { sessionId, turnId: t.userTurn.id }));

    const { id } = await saveReviewItem(owner, { sessionId, turnId: t.userTurn.id });
    await expectNotFound(completeReviewItem(intruder, id));
  });
});

describe("review queue", () => {
  it("saves a validated improvement and grants review XP once", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    const t = await say(userId, sessionId, "I want a latte");
    await say(userId, sessionId, "Medium with oat milk, for here please.");
    await completeSession(userId, sessionId);
    const before = (await xpSummary(userId)).total;

    const { id } = await saveReviewItem(userId, { sessionId, turnId: t.userTurn.id });
    const again = await saveReviewItem(userId, { sessionId, turnId: t.userTurn.id });
    expect(again.id).toBe(id);

    await completeReviewItem(userId, id);
    await completeReviewItem(userId, id);
    expect((await xpSummary(userId)).total).toBe(before + 5);
  });
});

describe("recommendations", () => {
  it("prefers the last session's suggested follow-up and avoids just-played missions", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await say(userId, sessionId, "Could I have a latte with oat milk?");
    await say(userId, sessionId, "Medium, for here please.");
    await completeSession(userId, sessionId);
    const { view } = await getFeedback(userId, sessionId);
    const recs = await recommendMissions(userId, 3);
    expect(recs.map((r) => r.mission.id)).not.toContain("m-cafe-order");
    if (view.status === "ok" && view.feedback.next_practice) {
      expect(recs[0].mission.id).toBe(view.feedback.next_practice.mission_id);
    }
    expect(recs[0].reasonsKo.length).toBeGreaterThan(0);
  });
});

describe("account deletion", () => {
  it("removes the user and all owned learning data", async () => {
    const userId = await newUser();
    const { sessionId } = await startSession(userId, "cafe-order");
    await say(userId, sessionId, "Could I have a latte with oat milk?");
    await say(userId, sessionId, "Medium, for here please.");
    await completeSession(userId, sessionId);

    await deleteAccountData(userId);
    expect(await prisma.user.count({ where: { id: userId } })).toBe(0);
    expect(await prisma.learningSession.count({ where: { userId } })).toBe(0);
    expect(await prisma.turn.count({ where: { sessionId } })).toBe(0);
    expect(await prisma.xpEvent.count({ where: { userId } })).toBe(0);
  });
});
