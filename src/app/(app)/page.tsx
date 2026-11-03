import Link from "next/link";
import { MissionMeta } from "@/features/missions/MissionCard";
import { StartMissionButton } from "@/features/missions/StartMissionButton";
import { ArrowBadge, ArrowUpRight, LogoMark } from "@/features/ui/Icons";
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

const d = (ms: number) => ({ ["--delay" as string]: `${ms}ms` });

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
    <div className="space-y-12 lg:space-y-16">
      <section className="grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow reveal">{profile.displayName}님의 오늘</p>
          <h1 className="display reveal-lines mt-4 max-w-[16ch] text-4xl sm:text-5xl">
            <span className="line">
              <span>오늘은 어떤 상황을</span>
            </span>
            <span className="line">
              <span>연습해 볼까요?</span>
            </span>
          </h1>
        </div>
        <dl className="reveal grid grid-cols-3 gap-2 lg:col-span-5" style={d(300)}>
          {[
            ["레벨", `Lv.${xp.level}`],
            ["이번 주", `${activity.completedThisWeek}회`],
            ["마지막 학습", lastStudied ?? "—"],
          ].map(([k, v]) => (
            <div key={k} className="card-soft p-4">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 text-xl font-semibold tracking-tight">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {active && (
        <section
          aria-labelledby="continue-title"
          className="reveal flex flex-col gap-4 rounded-[1.25rem] bg-accent-soft p-5 sm:flex-row sm:items-center sm:justify-between"
          style={d(150)}
        >
          <div>
            <h2 id="continue-title" className="eyebrow-accent">
              이어하기
            </h2>
            <p className="mt-1 text-lg font-semibold">{active.mission.title}</p>
            <p className="text-sm text-muted">대화 {active._count.turns}개가 저장돼 있어요.</p>
          </div>
          <Link href={`/session/${active.id}`} className="btn-primary btn-arrow nudge-group self-start sm:self-auto">
            이어서 대화하기
            <ArrowBadge />
          </Link>
        </section>
      )}

      {top && (
        <section aria-labelledby="today-title" className="reveal" style={d(250)}>
          <h2 id="today-title" className="sr-only">
            오늘의 추천 미션
          </h2>
          <article className="card-ink grid gap-8 p-6 sm:p-10 lg:grid-cols-12 lg:items-end">
            <LogoMark
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 text-[16rem] text-white/[0.04] sm:text-[22rem]"
            />
            <div className="relative lg:col-span-7">
              <p className="eyebrow-light">오늘의 추천 미션</p>
              <h3 className="display mt-6 text-3xl sm:text-5xl">{top.mission.title}</h3>
              <p className="mt-3 max-w-lg text-white/60">{top.mission.scenario.summaryKo}</p>
              <div className="mt-6">
                <MissionMeta mission={top.mission} tone="light" />
              </div>
            </div>
            <div className="relative flex flex-col gap-5 lg:col-span-5 lg:items-end">
              <ul className="space-y-2 text-sm lg:text-right">
                {top.reasonsKo.map((r) => (
                  <li key={r} className="text-white/80">
                    <span aria-hidden className="mr-2 text-accent-from">
                      ✦
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <StartMissionButton missionId={top.mission.id} className="btn-light" />
                <Link
                  href={`/missions/${top.mission.slug}`}
                  className="btn border border-white/20 text-white hover:border-white/50"
                >
                  상황 자세히 보기
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="review-title" className="reveal" style={d(350)}>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="review-title" className="section-title mb-0">
              복습할 표현
            </h2>
            {reviews.length > 0 && (
              <Link href="/progress#review" className="text-sm font-medium text-accent hover:underline">
                복습하러 가기 →
              </Link>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="card-soft text-sm text-muted">
              아직 저장한 표현이 없어요. 미션을 마친 뒤 결과 화면에서 &lsquo;복습에 저장&rsquo;을 눌러 보세요.
            </p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((r) => (
                <li key={r.id} className="card-soft p-4">
                  <p lang="en" className="text-sm text-muted line-through decoration-1">
                    {r.phrase}
                  </p>
                  <p lang="en" className="mt-0.5 font-medium">
                    {r.suggestedPhrase}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="growth-title" className="reveal" style={d(420)}>
          <h2 id="growth-title" className="section-title">
            성장
          </h2>
          <Link href="/progress" className="card nudge-group flex items-center justify-between gap-4 hover:bg-surface/60">
            <div>
              <p className="text-4xl font-semibold tracking-tight">
                {xp.total}
                <span className="ml-1 text-base font-medium text-muted">XP</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                {xp.xpForNext !== null ? `다음 레벨까지 ${xp.xpForNext - xp.xpIntoLevel} XP` : "최고 레벨이에요"}
              </p>
            </div>
            <span className="arrow-badge h-11 w-11">
              <ArrowUpRight className="nudge-up-right" />
            </span>
          </Link>
        </section>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="more-title">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="more-title" className="section-title mb-0">
              이런 상황도 있어요
            </h2>
            <Link href="/missions" className="text-sm font-medium text-accent hover:underline">
              전체 미션 →
            </Link>
          </div>
          <ul>
            {others.map((o, i) => (
              <li key={o.mission.id} className={`reveal ${i > 0 ? "border-t border-line" : ""}`} style={d(450 + i * 80)}>
                <Link
                  href={`/missions/${o.mission.slug}`}
                  className="nudge-group flex items-center gap-4 rounded-[1.25rem] px-4 py-5 transition-all duration-300 hover:bg-surface sm:px-6 sm:hover:pl-8"
                >
                  <span className="w-7 text-sm font-medium text-subtle">0{i + 1}</span>
                  <span className="flex-1">
                    <span className="block text-xl font-medium tracking-tight sm:text-2xl">{o.mission.title}</span>
                    <span className="mt-1 block text-sm text-muted">{o.reasonsKo[0]}</span>
                  </span>
                  <span className="arrow-badge h-10 w-10 sm:h-12 sm:w-12">
                    <ArrowUpRight className="nudge-right" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
