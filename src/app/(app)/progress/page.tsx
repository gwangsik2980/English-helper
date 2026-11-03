import Link from "next/link";
import { ReviewList } from "@/features/progress/ReviewList";
import { CountUp } from "@/features/ui/CountUp";
import { ArrowUpRight } from "@/features/ui/Icons";
import { XP_RULES } from "@/server/config";
import { requirePageUser } from "@/server/http";
import { BAND_LABEL_KO, getProgress } from "@/server/services/progress";
import { listReviewItems } from "@/server/services/review";

export const metadata = { title: "성장 기록 · ENGLISH QUEST" };

const TREND_KO = { up: "↗ 좋아지는 중", flat: "→ 비슷하게 유지", down: "↘ 최근 주춤", unknown: "관찰이 더 필요해요" };

export default async function ProgressPage() {
  const userId = await requirePageUser();
  const [p, reviews] = await Promise.all([getProgress(userId), listReviewItems(userId)]);
  const pct = p.xp.xpForNext ? Math.round((p.xp.xpIntoLevel / p.xp.xpForNext) * 100) : 100;

  const reviewsDone = reviews.filter((r) => r.status === "done").length;
  const stats: { value: number; suffix?: string; label: string }[] = [
    { value: p.xp.level, label: "현재 레벨" },
    { value: p.xp.total, suffix: " XP", label: "누적 경험치" },
    { value: p.activity.completedThisWeek, suffix: "회", label: "이번 주 완료한 미션" },
    { value: reviewsDone, suffix: "개", label: "복습한 표현" },
  ];

  return (
    <div className="space-y-14">
      <header>
        <p className="eyebrow reveal">Progress</p>
        <h1 className="display reveal-lines mt-4 text-4xl sm:text-5xl">
          <span className="line">
            <span>성장 기록</span>
          </span>
        </h1>
      </header>

      <section aria-labelledby="xp-title" className="card-ink reveal px-6 py-12 sm:px-10 sm:py-14 md:px-16" style={{ ["--rise" as string]: "40px" }}>
        <p className="eyebrow-light">By the numbers</p>
        <h2 id="xp-title" className="mt-4 max-w-[20ch] text-3xl font-medium tracking-tight md:text-4xl">
          점수가 아니라 쌓인 연습으로 보여 줘요.
        </h2>
        <ul className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4">
          {stats.map((st, i) => (
            <li key={st.label} className="reveal" style={{ ["--delay" as string]: `${200 + i * 90}ms` }}>
              <p className="text-5xl font-semibold tracking-tight sm:text-6xl">
                <CountUp value={st.value} suffix={st.suffix} />
              </p>
              <p className="mt-3 text-sm text-white/55">{st.label}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 border-t border-white/10 pt-6">
          <div
            className="h-1 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="다음 레벨까지 진행률"
          >
            <div className="h-full rounded-full bg-accent-from" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-3 text-xs tracking-wide text-white/50">
            {p.xp.xpForNext !== null ? `Lv.${p.xp.level + 1}까지 ${p.xp.xpForNext - p.xp.xpIntoLevel} XP` : "최고 레벨이에요"}
          </p>
          <details className="mt-4 text-sm text-white/70">
            <summary className="cursor-pointer font-medium text-white">경험치는 이렇게 계산해요</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/60">
              <li>미션 완료 +{XP_RULES.missionComplete} XP (한 마디 이상 대화한 경우)</li>
              <li>상황 목표 달성 +{XP_RULES.goalMet} XP, 일부 달성 +{XP_RULES.goalPartial} XP</li>
              <li>복습 완료 +{XP_RULES.reviewDone} XP</li>
              <li>연속 출석 보상은 없어요. 쉬었다 와도 손해 보지 않아요.</li>
            </ul>
          </details>
        </div>
      </section>

      <section aria-labelledby="skills-title">
        <p className="eyebrow">Skills</p>
        <h2 id="skills-title" className="display mt-3 text-3xl">
          역량 추세
        </h2>
        <p className="mb-6 mt-2 max-w-2xl text-sm text-muted">
          점수 대신 대화에서 관찰한 단계와 관찰 횟수를 보여 줘요. 관찰이 2번 미만이면 추세를 판단하지 않아요.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {p.skills.map((s, i) => (
            <li key={s.skill} className="card-soft reveal p-5" style={{ ["--delay" as string]: `${i * 60}ms` }}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{s.labelKo}</h3>
                <span className="text-xs text-muted">관찰 {s.observations}회</span>
              </div>
              <p className="mt-4 text-xl font-medium tracking-tight">
                {s.latestBand ? BAND_LABEL_KO[s.latestBand] : "기록 없음"}
              </p>
              <p className="text-sm text-muted">{TREND_KO[s.trend]}</p>
              {s.history.length > 0 && (
                <p
                  className="mt-3 flex gap-1"
                  aria-label={`최근 관찰: ${s.history.slice(-5).map((h) => BAND_LABEL_KO[h.band]).join(", ")}`}
                >
                  {s.history.slice(-5).map((h, k) => (
                    <span
                      key={k}
                      aria-hidden
                      className={`h-1.5 flex-1 rounded-full ${
                        h.band === "proficient" ? "bg-ink" : h.band === "developing" ? "bg-ink/45" : "bg-ink/15"
                      }`}
                    />
                  ))}
                </p>
              )}
              {s.excludedLowConfidence > 0 && (
                <p className="mt-2 text-xs text-muted">확신도가 낮은 관찰 {s.excludedLowConfidence}건은 제외했어요.</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="review" aria-labelledby="review-title" className="scroll-mt-24">
        <p className="eyebrow">Review</p>
        <h2 id="review-title" className="display mb-6 mt-3 text-3xl">
          복습 큐
        </h2>
        <ReviewList initial={reviews} />
      </section>

      <section aria-labelledby="sessions-title">
        <p className="eyebrow">History</p>
        <h2 id="sessions-title" className="display mb-6 mt-3 text-3xl">
          학습 기록
        </h2>
        {p.sessions.length === 0 ? (
          <p className="card-soft text-sm text-muted">
            아직 기록이 없어요.{" "}
            <Link href="/missions" className="font-medium text-accent">
              미션을 시작
            </Link>
            해 보세요.
          </p>
        ) : (
          <ul>
            {p.sessions.map((s, i) => (
              <li key={s.id} className={i > 0 ? "border-t border-line" : ""}>
                <Link
                  href={s.status === "completed" ? `/session/${s.id}/result` : `/session/${s.id}`}
                  className="nudge-group flex items-center gap-4 rounded-[1.25rem] px-4 py-5 transition-all duration-300 hover:bg-surface sm:gap-6 sm:px-6 sm:hover:pl-8"
                >
                  <span className="w-12 shrink-0 text-sm font-medium text-subtle">
                    {new Date(s.startedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                  </span>
                  <span className="flex-1 text-lg font-medium tracking-tight sm:text-2xl">{s.missionTitle}</span>
                  <span className="hidden text-sm text-muted sm:block">
                    {s.status !== "completed"
                      ? "진행 중"
                      : s.insufficientData
                        ? "판정 보류"
                        : s.feedbackStatus === "ok"
                          ? `목표 ${s.goalsMet}/${s.goalsTotal}`
                          : "분석 불가"}
                  </span>
                  <span className="arrow-badge h-10 w-10 sm:h-12 sm:w-12">
                    <ArrowUpRight className="nudge-right" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ledger-title">
        <p className="eyebrow">Ledger</p>
        <h2 id="ledger-title" className="display mb-6 mt-3 text-3xl">
          경험치 내역
        </h2>
        {p.xpEvents.length === 0 ? (
          <p className="card-soft text-sm text-muted">아직 받은 경험치가 없어요.</p>
        ) : (
          <ul className="card space-y-2 text-sm sm:p-6">
            {p.xpEvents.map((e, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="text-muted">{e.reason}</span>
                <span className="shrink-0 font-semibold">+{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
