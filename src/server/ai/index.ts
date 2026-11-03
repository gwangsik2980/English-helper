import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ClaudeFeedbackAnalyzer, ClaudePartner } from "./claude";
import { RuleBasedAnalyzer, ScriptedPartner } from "./mock";
import type { ConversationPartner, FeedbackAnalyzer } from "./ports";

export type AiMode = "claude" | "demo";

export function aiMode(): AiMode {
  return process.env.ANTHROPIC_API_KEY ? "claude" : "demo";
}

let cached: { partner: ConversationPartner; analyzer: FeedbackAnalyzer } | null = null;

export function getAi() {
  if (cached) return cached;
  if (aiMode() === "claude") {
    const client = new Anthropic();
    cached = { partner: new ClaudePartner(client), analyzer: new ClaudeFeedbackAnalyzer(client) };
  } else {
    cached = { partner: new ScriptedPartner(), analyzer: new RuleBasedAnalyzer() };
  }
  return cached;
}

/** Test hook: inject fake adapters. */
export function setAiForTesting(ai: { partner: ConversationPartner; analyzer: FeedbackAnalyzer } | null) {
  cached = ai;
}
