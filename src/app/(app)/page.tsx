import Link from "next/link";
import { MissionMeta } from "@/features/missions/MissionCard";
import { StartMissionButton } from "@/features/missions/StartMissionButton";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";
import { weeklyActivity } from "@/server/services/progress";
import { recommendMissions } from "@/server/services/recommend";
import { listReviewItems } from "@/server/services/review";
import { findActiveSession } from "@/server/services/sessions";
import { xpSummary } from "@/server/services/xp";

function daysAgoKo(iso: string | null) {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
  return days <= 0 ? "오늘" : days === 1 ? "어제" : `${days}일 전`;
}

export default async function HomePage() {
  const userId = await requirePageUser();
  const [profile, recs, active, reviews, activity, xp] = await Promise.all([
    getProfile(userId),
    recommendMissions(userId, 3),
    findActiveSession(userId),
    listReviewItems(userId, { status: "pending", take: 3 }),
    weeklyActivity(userId),
    xpSummary(userId),
  ]);
  const [top, ...others] = recs;
  const lastStudied = daysAgoKo(activity.lastStudiedAt);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">{profile.displayName}님, 오늘은 어떤 상황을 연습해 볼까요?</h1>
        <p className="mt-1 text-muted">
          {lastStudied ? `마지막 학습: ${lastStudied} · ` : ""}이번 주에 미션 {activity.completedThisWeek}개를 마쳤어요.
        </p>
      </section>

      {active && (
        <section aria-labelledby="continue-title" className="card border-accent bg-accent-soft">
          <h2 id="continue-title" className="text-sm font-bold text-accent">
            이어하기
          </h2>
          <p className="mt-1 font-semibold">{active.mission.title}</p>
          <p className="text-sm text-muted">대화 {active._count.turns}개가 저장돼 있어요.</p>
          <Link href={`/session/${active.id}`} className="btn-primary mt-3">
            이어서 대화하기
          </Link>
        </section>
      )}

      {top && (
        <section aria-labelledby="today-title">
          <h2 id="today-title" className="section-title">
            오늘의 추천 미션
          </h2>
          <div className="card space-y-3">
            <MissionMeta mission={top.mission} />
            <h3 className="text-xl font-bold">{top.mission.title}</h3>
            <p className="text-muted">{top.mission.scenario.summaryKo}</p>
            <ul className="space-y-1 text-sm">
              {top.reasonsKo.map((r) => (
                <li key={r} className="flex gap-2">
                  <span aria-hidden className="text-brand">
                    ✓
                  </span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <StartMissionButton missionId={top.mission.id} />
              <Link href={`/missions/${top.mission.slug}`} className="btn-secondary">
                상황 자세히 보기
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="review-title">
          <h2 id="review-title" className="section-title">
            복습할 표현
          </h2>
          {reviews.length === 0 ? (
            <p className="card text-sm text-muted">
              아직 저장한 표현이 없어요. 미션을 마친 뒤 결과 화면에서 &lsquo;복습에 저장&rsquo;을 눌러 보세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="card p-4">
                  <p className="text-sm text-muted line-through decoration-1">{r.phrase}</p>
                  <p className="font-semibold">{r.suggestedPhrase}</p>
                </li>
              ))}
              <li>
                <Link href="/progress#review" className="text-sm font-semibold text-brand hover:underline">
                  복습하러 가기 →
                </Link>
              </li>
            </ul>
          )}
        </section>

        <section aria-labelledby="growth-title">
          <h2 id="growth-title" className="section-title">
            성장
          </h2>
          <div className="card">
            <p className="text-sm text-muted">레벨</p>
            <p className="text-2xl font-bold">Lv. {xp.level}</p>
            <p className="mt-1 text-sm text-muted">
              누적 {xp.total} XP
              {xp.xpForNext !== null ? ` · 다음 레벨까지 ${xp.xpForNext - xp.xpIntoLevel} XP` : " · 최고 레벨"}
            </p>
            <Link href="/progress" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
              성장 기록 보기 →
            </Link>
          </div>
        </section>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="more-title">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="more-title" className="text-lg font-bold">
              이런 상황도 있어요
            </h2>
            <Link href="/missions" className="text-sm font-semibold text-brand hover:underline">
              전체 미션 →
            </Link>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {others.map((o) => (
              <li key={o.mission.id} className="card">
                <MissionMeta mission={o.mission} />
                <Link href={`/missions/${o.mission.slug}`} className="mt-2 block font-bold hover:underline">
                  {o.mission.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{o.reasonsKo[0]}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
