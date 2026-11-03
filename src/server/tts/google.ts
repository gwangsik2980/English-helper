import "server-only";
import { AppError } from "../errors";
import type { CloudVoiceId } from "@/shared/cloud-voices";

/*
 * Google Cloud Text-to-Speech over REST (no SDK). Without GOOGLE_TTS_API_KEY
 * the app keeps using the browser's own voices. The key goes in a header,
 * never the URL, and neither it nor the spoken text is logged.
 */

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

export function cloudVoiceEnabled() {
  return Boolean(process.env.GOOGLE_TTS_API_KEY);
}

export async function synthesize(text: string, voice: CloudVoiceId): Promise<Buffer> {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) throw new AppError("service_unavailable", "자연스러운 목소리가 아직 연결되지 않았어요. 기기 목소리로 읽어 드릴게요.");

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: "en-US", name: `en-US-Chirp3-HD-${voice}` },
        audioConfig: { audioEncoding: "MP3" },
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new AppError("service_unavailable", "목소리를 만들지 못했어요. 기기 목소리로 읽어 드릴게요.");
  }
  if (!res.ok) {
    // Status only: the body can echo request details.
    console.error(`[tts] google synthesize failed status=${res.status}`);
    throw new AppError("service_unavailable", "목소리를 만들지 못했어요. 기기 목소리로 읽어 드릴게요.");
  }
  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) throw new AppError("service_unavailable", "목소리를 만들지 못했어요. 기기 목소리로 읽어 드릴게요.");
  return Buffer.from(data.audioContent, "base64");
}
