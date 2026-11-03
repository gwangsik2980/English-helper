import Link from "next/link";
import { notFound } from "next/navigation";
import { MissionMeta } from "@/features/missions/MissionCard";
import { StartMissionButton } from "@/features/missions/StartMissionButton";
import { ArrowBadge } from "@/features/ui/Icons";
import { requirePageUser } from "@/server/http";
import { getMissionByIdOrSlug } from "@/server/repositories/missions";
import { findActiveSession } from "@/server/services/sessions";

const d = (ms: number) => ({ ["--delay" as string]: `${ms}ms` });

export default async function MissionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const userId = await requirePageUser();
  const { slug } = await params;
  const mission = await getMissionByIdOrSlug(slug);
  if (!mission) notFound();
  const active = await findActiveSession(userId, mission.id);
  const s = mission.scenario;

  return (
    <article className="mx-auto max-w-5xl">
      <Link href="/missions" className="text-sm font-medium text-muted hover:text-text">
        ← 미션 목록
      </Link>

      <header className="mt-6 grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <div className="reveal">
            <MissionMeta mission={mission} />
          </div>
          <h1 className="display reveal-lines mt-4 text-4xl sm:text-5xl">
            <span className="line">
              <span>{mission.title}</span>
            </span>
          </h1>
          <p className="reveal mt-4 max-w-xl text-lg text-muted" style={d(200)}>
            {s.summaryKo}
          </p>
        </div>
        <div className="reveal hidden lg:col-span-4 lg:flex lg:justify-end" style={d(300)}>
          {active ? (
            <Link href={`/session/${active.id}`} className="btn-primary btn-arrow nudge-group">
              저장된 대화 이어하기
              <ArrowBadge />
            </Link>
          ) : (
            <StartMissionButton missionId={mission.id} />
          )}
        </div>
      </header>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section className="card-ink reveal space-y-3 sm:p-8" style={d(250)}>
          <h2 className="eyebrow-light">상황</h2>
          <p className="text-lg leading-relaxed text-white/90">{s.backgroundKo}</p>
          <p className="text-sm text-white/50">
            상대역 · <span lang="en">{s.aiRole}</span>
          </p>
        </section>

        <div className="space-y-4">
          <section className="card-soft reveal sm:p-6" style={d(320)}>
            <h2 className="eyebrow mb-3">성공 조건</h2>
            <ol className="space-y-2">
              {mission.successCriteria.map((c, i) => (
                <li key={c.id} className="flex gap-3">
                  <span className="w-6 text-sm font-medium text-subtle">0{i + 1}</span>
                  <span className="font-medium">{c.descriptionKo}</span>
                </li>
              ))}
            </ol>
          </section>

          <details className="card reveal sm:p-6" style={d(390)}>
            <summary className="cursor-pointer font-semibold">써 볼 만한 표현 힌트</summary>
            <ul className="mt-3 space-y-1.5" lang="en">
              {s.hintPhrases.map((h) => (
                <li key={h} className="rounded-[0.875rem] bg-surface px-3 py-2 text-[15px]">
                  {h}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">대화 중에도 힌트 버튼으로 다시 볼 수 있어요.</p>
          </details>
        </div>
      </div>

      <div className="sticky bottom-24 z-10 mt-6 lg:hidden">
        {active ? (
          <Link href={`/session/${active.id}`} className="btn-primary btn-arrow nudge-group w-full justify-between">
            저장된 대화 이어하기
            <ArrowBadge />
          </Link>
        ) : (
          <StartMissionButton missionId={mission.id} className="btn-primary w-full justify-between" />
        )}
      </div>
    </article>
  );
}
