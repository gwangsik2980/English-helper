import type { CorrectionMode, Level, MissionView } from "@/shared/schemas/domain";

/**
 * Provider-neutral boundaries (spec 9.1). UI and services depend on these,
 * never on a vendor SDK directly.
 */

export type ConversationLine = { speaker: "user" | "ai"; text: string };

export type CorrectionTip = { original: string; suggested: string; reasonKo: string };

export type PartnerContext = {
  mission: MissionView;
  level: Level;
  correctionMode: CorrectionMode;
  /** Full history including the opening line and the latest user line. */
  history: ConversationLine[];
};

export type PartnerReply = {
  text: string;
  tip: CorrectionTip | null;
  /** The partner believes the scene reached a natural end. */
  sceneComplete: boolean;
};

export interface ConversationPartner {
  readonly modelName: string;
  reply(ctx: PartnerContext): Promise<PartnerReply>;
}

export type AnalyzerTurn = {
  id: string;
  sequence: number;
  speaker: "user" | "ai";
  text: string;
  modality: string;
  transcriptConfidence: number | null;
};

export type AnalyzerContext = {
  mission: MissionView;
  level: Level;
  turns: AnalyzerTurn[];
  candidateMissions: { id: string; title: string; learningPointsKo: string[] }[];
};

export interface FeedbackAnalyzer {
  readonly modelName: string;
  /** Returns unvalidated output; the feedback service validates it. */
  analyze(ctx: AnalyzerContext): Promise<unknown>;
}
