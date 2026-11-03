import { describe, expect, it } from "vitest";
import { evidenceConfidenceCap, hasInsufficientData, validateFeedback } from "@/server/services/feedback";
import type { RawFeedback } from "@/shared/schemas/feedback";

const ctx = {
  userTurns: [
    { id: "t2", text: "I want one coffee" },
    { id: "t4", text: "Could I get that with oat milk?" },
  ],
  goalIds: ["order_item", "request_option"],
  candidateMissionIds: ["m-next"],
};

function base(): RawFeedback {
  return {
    goal_outcomes: [
      { goal_id: "order_item", status: "met", reason_ko: "", evidence_turn_ids: ["t2"] },
      { goal_id: "request_option", status: "met", reason_ko: "", evidence_turn_ids: ["t4"] },
    ],
    strengths: [{ quote: "Could I get that with oat milk?", note_ko: "", turn_id: "t4" }],
    improvements: [
      { original: "I want one coffee", suggested: "Could I have a coffee, please?", reason_ko: "", turn_id: "t2", confidence: 0.8 },
    ],
    skill_observations: [
      { skill: "vocabulary", level: "developing", confidence: 0.6, evidence_turn_ids: ["t2", "t4"], reason_ko: "" },
    ],
    summary_ko: "좋아요",
    next_practice: { mission_id: "m-next", reason_ko: "" },
    insufficient_data: false,
  };
}

describe("validateFeedback", () => {
  it("accepts well-formed feedback that cites real learner turns", () => {
    expect(validateFeedback(base(), ctx)).not.toBeNull();
  });

  it("rejects output that does not match the schema", () => {
    expect(validateFeedback({ hello: "world" }, ctx)).toBeNull();
    expect(validateFeedback("not json", ctx)).toBeNull();
  });

  it("rejects evidence pointing at turns that are not the learner's", () => {
    const fb = base();
    fb.goal_outcomes[0].evidence_turn_ids = ["t-made-up"];
    expect(validateFeedback(fb, ctx)).toBeNull();

    const fb2 = base();
    fb2.skill_observations[0].evidence_turn_ids = ["t1"]; // partner turn
    expect(validateFeedback(fb2, ctx)).toBeNull();
  });

  it("rejects missing, unknown or duplicated goal ids", () => {
    const missing = base();
    missing.goal_outcomes.pop();
    expect(validateFeedback(missing, ctx)).toBeNull();

    const unknown = base();
    unknown.goal_outcomes[1].goal_id = "fly_to_moon";
    expect(validateFeedback(unknown, ctx)).toBeNull();

    const dup = base();
    dup.goal_outcomes.push({ ...dup.goal_outcomes[0] });
    expect(validateFeedback(dup, ctx)).toBeNull();
  });

  it("drops quotes the learner never said", () => {
    const fb = base();
    fb.strengths.push({ quote: "I am a native speaker", note_ko: "", turn_id: "t2" });
    fb.improvements.push({ original: "something else", suggested: "x", reason_ko: "", turn_id: "t4", confidence: 0.9 });
    const out = validateFeedback(fb, ctx)!;
    expect(out.strengths).toHaveLength(1);
    expect(out.improvements).toHaveLength(1);
  });

  it("downgrades a met goal with no evidence to undetermined", () => {
    const fb = base();
    fb.goal_outcomes[0].evidence_turn_ids = [];
    expect(validateFeedback(fb, ctx)!.goal_outcomes[0].status).toBe("undetermined");
  });

  it("nulls a next_practice mission outside the candidates", () => {
    const fb = base();
    fb.next_practice = { mission_id: "m-not-allowed", reason_ko: "" };
    expect(validateFeedback(fb, ctx)!.next_practice).toBeNull();
  });

  it("holds goals and skills when the model reports insufficient data", () => {
    const fb = { ...base(), insufficient_data: true };
    const out = validateFeedback(fb, ctx)!;
    expect(out.goal_outcomes.every((g) => g.status === "undetermined")).toBe(true);
    expect(out.skill_observations).toEqual([]);
  });
});

describe("skill observation confidence", () => {
  it("caps confidence by the number of distinct cited turns", () => {
    const fb = base();
    fb.skill_observations = [
      { skill: "grammar", level: "proficient", confidence: 0.9, evidence_turn_ids: ["t4"], reason_ko: "" },
      { skill: "fluency", level: "developing", confidence: 0.9, evidence_turn_ids: ["t2", "t4", "t4"], reason_ko: "" },
    ];
    const out = validateFeedback(fb, ctx)!;
    expect(out.skill_observations.map((o) => o.confidence)).toEqual([0.5, 0.7]);
    expect(out.skill_observations[1].evidence_turn_ids).toEqual(["t2", "t4"]);
  });

  it("keeps listening at or below 0.6 and drops observations without evidence", () => {
    const fb = base();
    fb.skill_observations = [
      { skill: "listening", level: "proficient", confidence: 0.8, evidence_turn_ids: ["t2", "t4"], reason_ko: "" },
      { skill: "vocabulary", level: "developing", confidence: 0.6, evidence_turn_ids: [], reason_ko: "" },
    ];
    const out = validateFeedback(fb, ctx)!;
    expect(out.skill_observations).toHaveLength(1);
    expect(out.skill_observations[0]).toMatchObject({ skill: "listening", confidence: 0.6 });
  });

  it("does not raise a confidence the model already kept low", () => {
    const fb = base();
    fb.skill_observations[0].confidence = 0.4;
    expect(validateFeedback(fb, ctx)!.skill_observations[0].confidence).toBe(0.4);
    expect(evidenceConfidenceCap(5)).toBe(0.85);
  });
});

describe("hasInsufficientData", () => {
  it("needs at least two learner turns and a few words", () => {
    expect(hasInsufficientData([{ text: "Hi" }])).toBe(true);
    expect(hasInsufficientData([{ text: "Hi" }, { text: "Yes" }])).toBe(true);
    expect(hasInsufficientData([{ text: "Could I have a latte?" }, { text: "Medium with oat milk please" }])).toBe(false);
  });
});
