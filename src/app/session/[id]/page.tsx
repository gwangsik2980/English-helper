import { notFound, redirect } from "next/navigation";
import { ChatRoom } from "@/features/conversation/ChatRoom";
import { AppError } from "@/server/errors";
import { requirePageUser } from "@/server/http";
import { keyExpressionsFor } from "@/server/missions/key-expressions";
import { getMissionByIdOrSlug } from "@/server/repositories/missions";
import { listPhrases } from "@/server/services/phrases";
import { getSession } from "@/server/services/sessions";

export const metadata = { title: "대화 · ENGLISH QUEST" };

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requirePageUser();
  const { id } = await params;
  const session = await getSession(userId, id).catch((err) => {
    if (err instanceof AppError && err.code === "not_found") notFound();
    throw err;
  });
  if (session.status === "completed") redirect(`/session/${id}/result`);
  const mission = await getMissionByIdOrSlug(session.missionId);
  if (!mission) notFound();
  const phrases = await listPhrases(userId);

  return (
    <ChatRoom
      sessionId={session.id}
      missionTitle={mission.title}
      aiRole={mission.scenario.aiRole}
      goals={mission.successCriteria.map(({ id, descriptionKo }) => ({ id, descriptionKo }))}
      hints={mission.scenario.hintPhrases}
      keyExpressions={keyExpressionsFor(mission.slug).map(({ en, ko }) => ({ en, ko }))}
      myPhrases={phrases.map(({ phrase, meaningKo }) => ({ en: phrase, ko: meaningKo }))}
      initialSceneComplete={session.sceneComplete}
      initialTurns={session.turns.map((t) => ({ id: t.id, speaker: t.speaker, text: t.text, tip: t.tip, modality: t.modality }))}
    />
  );
}
