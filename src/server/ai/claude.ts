import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { RawFeedbackSchema } from "@/shared/schemas/feedback";
import { AppError } from "../errors";
import type {
  AnalyzerContext,
  ConversationPartner,
  FeedbackAnalyzer,
  PartnerContext,
  PartnerReply,
} from "./ports";
import { feedbackSystemPrompt, feedbackUserPayload, partnerSystemPrompt } from "./prompts";

const DEFAULT_MODEL = "claude-opus-5-5";
// Server-side fallback: if a request is declined by a safety classifier,
// the API re-runs it on Anthropic's recommended fallback model.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

/**
 * `fallbacks: "default"` is accepted by the Opus 5.x / Fable / Sonnet 5.5
 * line on the Claude API. Claude Haiku 5.5 has no server-side fallback, so
 * the parameter is left out there.
 */
function fallbackParams(model: string) {
  const supported = /^claude-(opus-5|fable-5|mythos-5|sonnet-5-5)/.test(model);
  return supported ? { betas: [FALLBACK_BETA], fallbacks: "default" as const } : {};
}

const PartnerOutputSchema = z.object({
  reply: z.string(),
  tip: z
    .object({
      original: z.string(),
      suggested: z.string(),
      reason_ko: z.string(),
    })
    .nullable(),
  scene_complete: z.boolean(),
});

/** Token counts only; never conversation text (project logging rule). */
function logUsage(kind: string, model: string, usage: { input_tokens: number; output_tokens: number }) {
  console.info(`[ai] ${kind} model=${model} input_tokens=${usage.input_tokens} output_tokens=${usage.output_tokens}`);
}

function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Anthropic.RateLimitError) {
    return new AppError("ai_unavailable", "AI가 잠시 바빠요. 몇 초 뒤에 다시 보내 주세요.");
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    console.error("[ai] Anthropic credentials rejected");
    return new AppError("ai_unavailable", "AI 연결 설정에 문제가 있어요. 관리자에게 알려 주세요.");
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return new AppError("ai_unavailable", "AI 서버에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.");
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`[ai] Anthropic API error status=${err.status}`);
    return new AppError("ai_unavailable", "AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  return new AppError("ai_unavailable", "AI 응답을 받지 못했어요. 잠시 후 다시 시도해 주세요.");
}

export class ClaudePartner implements ConversationPartner {
  constructor(
    private readonly client: Anthropic,
    readonly modelName: string = process.env.CLAUDE_PARTNER_MODEL || process.env.CLAUDE_MODEL || DEFAULT_MODEL,
  ) {}

  async reply(ctx: PartnerContext): Promise<PartnerReply> {
    // The API needs the first message to come from the user, so the scene
    // start is a fixed marker; the opening line itself is in the system prompt.
    const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: "(The learner walks into the scene.)" }];
    for (const line of ctx.history) {
      messages.push({ role: line.speaker === "user" ? "user" : "assistant", content: line.text });
    }
    try {
      const response = await this.client.beta.messages.parse({
        model: this.modelName,
        max_tokens: 2048,
        system: partnerSystemPrompt(ctx),
        messages,
        // Conversation turns are short and latency-sensitive.
        output_config: { effort: "low", format: betaZodOutputFormat(PartnerOutputSchema) },
        ...fallbackParams(this.modelName),
      });
      logUsage("partner", response.model, response.usage);
      if (response.stop_reason === "refusal" || !response.parsed_output) {
        throw new AppError("ai_output_invalid", "AI가 이 문장에 답하지 못했어요. 표현을 바꿔서 다시 보내 주세요.");
      }
      const out = response.parsed_output;
      return {
        text: out.reply.trim(),
        tip: out.tip ? { original: out.tip.original, suggested: out.tip.suggested, reasonKo: out.tip.reason_ko } : null,
        sceneComplete: out.scene_complete,
      };
    } catch (err) {
      throw toAppError(err);
    }
  }
}

export class ClaudeFeedbackAnalyzer implements FeedbackAnalyzer {
  constructor(
    private readonly client: Anthropic,
    readonly modelName: string = process.env.CLAUDE_FEEDBACK_MODEL || process.env.CLAUDE_MODEL || DEFAULT_MODEL,
  ) {}

  async analyze(ctx: AnalyzerContext): Promise<unknown> {
    try {
      const stream = this.client.beta.messages.stream({
        model: this.modelName,
        max_tokens: 16000,
        system: feedbackSystemPrompt(),
        messages: [{ role: "user", content: feedbackUserPayload(ctx) }],
        output_config: { effort: "medium", format: betaZodOutputFormat(RawFeedbackSchema) },
        ...fallbackParams(this.modelName),
      });
      const response = await stream.finalMessage();
      logUsage("feedback", response.model, response.usage);
      if (response.stop_reason === "refusal") {
        throw new AppError("ai_output_invalid", "피드백을 만들지 못했어요.");
      }
      // Return raw parsed JSON; the feedback service validates schema and ids.
      const text = response.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      try {
        return JSON.parse(text);
      } catch {
        throw new AppError("ai_output_invalid", "피드백 형식이 올바르지 않았어요.");
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw toAppError(err);
    }
  }
}
