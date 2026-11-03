import { z } from "zod";
import { SKILL_KEYS } from "./domain";

export const FEEDBACK_SCHEMA_VERSION = "feedback.v1";

export const GoalStatusSchema = z.enum(["met", "partial", "not_met", "undetermined"]);
export type GoalStatus = z.infer<typeof GoalStatusSchema>;

export const ValueBandSchema = z.enum(["emerging", "developing", "proficient"]);

/**
 * Shape the feedback analyzer (LLM or demo) must return. Mirrors spec 7.3.
 * Every claim points at evidence turn ids so the UI can show the original line.
 */
export const RawFeedbackSchema = z.object({
  goal_outcomes: z.array(
    z.object({
      goal_id: z.string(),
      status: GoalStatusSchema,
      reason_ko: z.string(),
      evidence_turn_ids: z.array(z.string()),
    }),
  ),
  strengths: z.array(
    z.object({
      quote: z.string(),
      note_ko: z.string(),
      turn_id: z.string(),
    }),
  ),
  improvements: z.array(
    z.object({
      original: z.string(),
      suggested: z.string(),
      reason_ko: z.string(),
      turn_id: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  skill_observations: z.array(
    z.object({
      skill: z.enum(SKILL_KEYS),
      level: ValueBandSchema,
      confidence: z.number().min(0).max(1),
      evidence_turn_ids: z.array(z.string()),
    }),
  ),
  summary_ko: z.string(),
  next_practice: z
    .object({
      mission_id: z.string(),
      reason_ko: z.string(),
    })
    .nullable(),
  insufficient_data: z.boolean(),
});
export type RawFeedback = z.infer<typeof RawFeedbackSchema>;

/** What the result screen receives after server-side validation. */
export type FeedbackView =
  | {
      status: "ok";
      feedback: RawFeedback;
      model: string;
      promptVersion: string;
      schemaVersion: string;
    }
  | {
      status: "unavailable";
      messageKo: string;
    };
