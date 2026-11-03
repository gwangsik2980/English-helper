/** Google Chirp 3 HD voices offered in settings (en-US). Free up to 1M characters a month. */
export const CLOUD_VOICES = [
  { id: "Aoede", labelKo: "Aoede · 여성" },
  { id: "Kore", labelKo: "Kore · 여성" },
  { id: "Charon", labelKo: "Charon · 남성" },
  { id: "Puck", labelKo: "Puck · 남성" },
] as const;

export type CloudVoiceId = (typeof CLOUD_VOICES)[number]["id"];
export const DEFAULT_CLOUD_VOICE: CloudVoiceId = "Aoede";

/** Voice preference values that mean "use this cloud voice". */
export const CLOUD_PREFIX = "google:";

export function isCloudVoiceId(v: string): v is CloudVoiceId {
  return CLOUD_VOICES.some((c) => c.id === v);
}
