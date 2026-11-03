import { authedRoute, rateLimit } from "@/server/http";
import { parseVoice, partnerLineAudio, previewAudio } from "@/server/services/speech";

/**
 * GET /api/speech?turnId=...&voice=Aoede  -> MP3 of one of my partner lines
 * GET /api/speech?preview=1&voice=Aoede   -> MP3 of a fixed sample line
 */
export const GET = authedRoute(async ({ req, userId }) => {
  rateLimit(`speech:${userId}`, 40, 10 * 60 * 1000);
  const url = new URL(req.url);
  const voice = parseVoice(url.searchParams.get("voice"));
  const turnId = url.searchParams.get("turnId");
  const audio =
    url.searchParams.get("preview") === "1"
      ? await previewAudio(voice)
      : await partnerLineAudio(userId, turnId ?? "", voice);
  return new Response(new Uint8Array(audio), {
    headers: {
      "Content-Type": "audio/mpeg",
      // A turn's text never changes, so the same device can replay it for free.
      "Cache-Control": "private, max-age=604800, immutable",
    },
  });
});
