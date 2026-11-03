import "server-only";
import { isCloudVoiceId, type CloudVoiceId } from "@/shared/cloud-voices";
import { prisma } from "../db";
import { AppError } from "../errors";
import { synthesize } from "../tts/google";

export const PREVIEW_LINE = "Hi there! What can I get started for you today?";
/** Partner lines are short; anything longer is not a partner line worth paying for. */
const MAX_SPEECH_CHARS = 1000;

export function parseVoice(v: string | null): CloudVoiceId {
  if (!v || !isCloudVoiceId(v)) throw new AppError("invalid_input", "목소리를 다시 골라 주세요.");
  return v;
}

/**
 * Audio for one of the learner's own partner lines. Only stored AI turns can
 * be voiced, so the endpoint cannot be used to synthesize arbitrary text on
 * our quota. Someone else's turn reads as not found.
 */
export async function partnerLineAudio(userId: string, turnId: string, voice: CloudVoiceId) {
  const turn = await prisma.turn.findFirst({
    where: { id: turnId, speaker: "ai", session: { userId } },
    select: { text: true },
  });
  if (!turn) throw new AppError("not_found", "읽을 문장을 찾지 못했어요. 화면을 새로고침해 주세요.");
  return synthesize(turn.text.slice(0, MAX_SPEECH_CHARS), voice);
}

export function previewAudio(voice: CloudVoiceId) {
  return synthesize(PREVIEW_LINE, voice);
}
