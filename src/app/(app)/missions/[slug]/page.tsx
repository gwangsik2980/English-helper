import Link from "next/link";
import { notFound } from "next/navigation";
import { MissionMeta } from "@/features/missions/MissionCard";
import { StartMissionButton } from "@/features/missions/StartMissionButton";
import { requirePageUser } from "@/server/http";
import { getMissionByIdOrSlug } from "@/server/repositories/missions";
import { findActiveSession } from "@/server/services/sessions";

export default async function MissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const userId = await requirePageUser();
  const { slug } = await params;
  const mission = await getMissionByIdOrSlug(slug);
  if (!mission) notFound();
  const active = await findActiveSession(userId, mission.id);
  const s = mission.scenario;

  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <Link href="/missions" className="text-sm font-semibold text-muted hover:text-text">
        ← 미션 목록
      </Link>
      <header className="space-y-2">
        <MissionMeta mission={mission} />
        <h1 className="text-2xl font-bold">{mission.title}</h1>
        <p className="text-muted">{s.summaryKo}</p>
      </header>

      <section className="card space-y-2">
        <h2 className="font-bold">상황</h2>
        <p className="leading-relaxed">{s.backgroundKo}</p>
        <p className="text-sm text-muted">
          상대역: <span lang="en">{s.aiRole}</span>
        </p>
      </section>

      <section className="card">
        <h2 className="mb-2 font-bold">성공 조건</h2>
        <ol className="list-decimal space-y-1 pl-5">
          {mission.successCriteria.map((c) => (
            <li key={c.id}>{c.descriptionKo}</li>
          ))}
        </ol>
      </section>

      <details className="card">
        <summary className="cursor-pointer font-bold">써 볼 만한 표현 힌트</summary>
        <ul className="mt-3 space-y-1.5" lang="en">
          {s.hintPhrases.map((h) => (
            <li key={h} className="rounded-lg bg-surface-2 px-3 py-2 text-[15px]">
              {h}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">대화 중에도 힌트 버튼으로 다시 볼 수 있어요.</p>
      </details>

      <div className="sticky bottom-20 z-10 md:static">
        {active ? (
          <Link href={`/session/${active.id}`} className="btn-primary w-full md:w-auto">
            저장된 대화 이어하기
          </Link>
        ) : (
          <StartMissionButton missionId={mission.id} className="btn-primary w-full md:w-auto" />
        )}
      </div>
    </article>
  );
}
