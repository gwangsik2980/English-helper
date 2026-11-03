import type { RawFeedback } from "@/shared/schemas/feedback";
import { findStrengthNote, findTip } from "./mock-rules";
import type {
  AnalyzerContext,
  ConversationPartner,
  FeedbackAnalyzer,
  PartnerContext,
  PartnerReply,
} from "./ports";

/**
 * Demo-mode adapters. They cost nothing and need no network, so the full
 * learning loop can be built and tested before an API key exists.
 */
export class ScriptedPartner implements ConversationPartner {
  readonly modelName = "demo-scripted";

  async reply(ctx: PartnerContext): Promise<PartnerReply> {
    const userLines = ctx.history.filter((l) => l.speaker === "user");
    const last = userLines.at(-1)?.text ?? "";
    const { mockScript, mockClosing } = ctx.mission.scenario;
    const index = userLines.length - 1;
    const tip = ctx.correctionMode === "during" ? findTip(last) : null;
    if (index >= mockScript.length) {
      return { text: mockClosing, tip, sceneComplete: true };
    }
    return { text: mockScript[index], tip, sceneComplete: false };
  }
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export class RuleBasedAnalyzer implements FeedbackAnalyzer {
  readonly modelName = "demo-rules";

  async analyze(ctx: AnalyzerContext): Promise<RawFeedback> {
    const userTurns = ctx.turns.filter((t) => t.speaker === "user");
    const userIds = userTurns.map((t) => t.id);

    const goal_outcomes = ctx.mission.successCriteria.map((c) => {
      const hits = userTurns.filter((t) =>
        c.mockPatterns.some((p) => t.text.toLowerCase().includes(p.toLowerCase())),
      );
      return hits.length > 0
        ? {
            goal_id: c.id,
            status: "met" as const,
            reason_ko: `"${c.descriptionKo}" 목표에 해당하는 발화가 있었어요.`,
            evidence_turn_ids: hits.slice(0, 2).map((t) => t.id),
          }
        : {
            goal_id: c.id,
            status: "not_met" as const,
            reason_ko: `"${c.descriptionKo}"에 해당하는 발화를 찾지 못했어요.`,
            evidence_turn_ids: [],
          };
    });

    const strengths = userTurns
      .map((t) => ({ t, note: findStrengthNote(t.text) }))
      .filter((x): x is { t: (typeof userTurns)[number]; note: string } => x.note !== null)
      .slice(0, 2)
      .map(({ t, note }) => ({ quote: t.text, note_ko: note, turn_id: t.id }));

    // Don't "correct" words the recognizer may have misheard.
    const improvements = userTurns
      .filter((t) => !(t.modality === "voice" && t.transcriptConfidence != null && t.transcriptConfidence < 0.5))
      .map((t) => ({ t, tip: findTip(t.text) }))
      .filter((x) => x.tip !== null)
      .slice(0, 2)
      .map(({ t, tip }) => ({
        original: tip!.original,
        suggested: tip!.suggested,
        reason_ko: tip!.reasonKo,
        turn_id: t.id,
        confidence: 0.7,
      }));

    const metCount = goal_outcomes.filter((g) => g.status === "met").length;
    const avgWords = userTurns.reduce((s, t) => s + wordCount(t.text), 0) / Math.max(1, userTurns.length);
    const politeTurns = userTurns.filter((t) => findStrengthNote(t.text) !== null);

    const skill_observations: RawFeedback["skill_observations"] = [
      {
        skill: "fluency",
        level: avgWords >= 8 ? "proficient" : avgWords >= 4 ? "developing" : "emerging",
        confidence: 0.5,
        evidence_turn_ids: userIds,
        reason_ko: `한 번 말할 때 평균 ${Math.round(avgWords)}단어를 썼어요.`,
      },
      {
        skill: "vocabulary",
        level: metCount >= 2 ? "developing" : "emerging",
        confidence: 0.55,
        evidence_turn_ids: userIds,
        reason_ko: `상황 목표 ${goal_outcomes.length}개 중 ${metCount}개에 필요한 표현을 썼어요.`,
      },
      {
        skill: "grammar",
        level: improvements.length === 0 ? "developing" : "emerging",
        confidence: 0.5,
        evidence_turn_ids: improvements.length ? improvements.map((i) => i.turn_id) : userIds,
        reason_ko: improvements.length ? `고칠 만한 문장이 ${improvements.length}개 보였어요.` : "눈에 띄는 문법 실수가 없었어요.",
      },
      {
        skill: "naturalness",
        level: politeTurns.length >= 2 ? "developing" : "emerging",
        confidence: 0.5,
        evidence_turn_ids: politeTurns.length ? politeTurns.map((t) => t.id) : userIds,
        reason_ko: politeTurns.length ? `공손한 표현을 ${politeTurns.length}번 썼어요.` : "please, could 같은 공손한 표현이 아직 적었어요.",
      },
    ];

    const next = ctx.candidateMissions.find((m) => m.id !== ctx.mission.id) ?? null;
    const total = goal_outcomes.length;

    return {
      goal_outcomes,
      strengths,
      improvements,
      skill_observations,
      summary_ko:
        metCount === total
          ? "상황 목표를 모두 해냈어요. 대화를 끝까지 이끌어 갔어요."
          : `목표 ${total}개 중 ${metCount}개를 해냈어요. 놓친 목표는 다음에 힌트를 보며 다시 연습해 봐요.`,
      next_practice: next
        ? { mission_id: next.id, reason_ko: `"${next.learningPointsKo[0] ?? next.title}" 표현을 다른 상황에서도 연습해요.` }
        : null,
      insufficient_data: false,
    };
  }
}
