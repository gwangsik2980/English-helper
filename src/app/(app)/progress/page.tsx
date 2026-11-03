import Link from "next/link";
import { ReviewList } from "@/features/progress/ReviewList";
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

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">성장 기록</h1>

      <section aria-labelledby="xp-title" className="card">
        <h2 id="xp-title" className="text-sm font-semibold text-muted">
          레벨과 경험치
        </h2>
        <p className="mt-1 text-3xl font-bold">Lv. {p.xp.level}</p>
        <div
          className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="다음 레벨까지 진행률"
        >
          <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-muted">
          누적 {p.xp.total} XP
          {p.xp.xpForNext !== null ? ` · 다음 레벨까지 ${p.xp.xpForNext - p.xp.xpIntoLevel} XP 남음` : " · 최고 레벨이에요"}
        </p>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold">경험치는 이렇게 계산해요</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>미션 완료 +{XP_RULES.missionComplete} XP (한 마디 이상 대화한 경우)</li>
            <li>상황 목표 달성 +{XP_RULES.goalMet} XP, 일부 달성 +{XP_RULES.goalPartial} XP</li>
            <li>복습 완료 +{XP_RULES.reviewDone} XP</li>
            <li>연속 출석 보상은 없어요. 쉬었다 와도 손해 보지 않아요.</li>
          </ul>
        </details>
      </section>

      <section aria-labelledby="skills-title">
        <h2 id="skills-title" className="section-title">
          역량 추세
        </h2>
        <p className="mb-3 text-sm text-muted">
          점수 대신 대화에서 관찰한 단계와 관찰 횟수를 보여 줘요. 관찰이 2번 미만이면 추세를 판단하지 않아요.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {p.skills.map((s) => (
            <li key={s.skill} className="card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-bold">{s.labelKo}</h3>
                <span className="text-xs text-muted">관찰 {s.observations}회</span>
              </div>
              <p className="mt-1 text-sm">
                {s.latestBand ? `최근: ${BAND_LABEL_KO[s.latestBand]}` : "아직 관찰 기록이 없어요"}
              </p>
              <p className="text-sm text-muted">{TREND_KO[s.trend]}</p>
              {s.history.length > 0 && (
                <p className="mt-2 text-xs text-muted" aria-label={`최근 관찰: ${s.history.slice(-5).map((h) => BAND_LABEL_KO[h.band]).join(", ")}`}>
                  {s.history.slice(-5).map((h, i) => (
                    <span key={i} aria-hidden className="mr-1 inline-block rounded bg-surface-2 px-1.5 py-0.5">
                      {BAND_LABEL_KO[h.band]}
                    </span>
                  ))}
                </p>
              )}
              {s.excludedLowConfidence > 0 && (
                <p className="mt-1 text-xs text-muted">확신도가 낮은 관찰 {s.excludedLowConfidence}건은 제외했어요.</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section id="review" aria-labelledby="review-title">
        <h2 id="review-title" className="section-title">
          복습 큐
        </h2>
        <ReviewList initial={reviews} />
      </section>

      <section aria-labelledby="sessions-title">
        <h2 id="sessions-title" className="section-title">
          학습 기록
        </h2>
        {p.sessions.length === 0 ? (
          <p className="card text-sm text-muted">
            아직 기록이 없어요. <Link href="/missions" className="font-semibold text-brand">미션을 시작</Link>해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {p.sessions.map((s) => (
              <li key={s.id}>
                <Link
                  href={s.status === "completed" ? `/session/${s.id}/result` : `/session/${s.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                >
                  <span>
                    <span className="block font-semibold">{s.missionTitle}</span>
                    <span className="text-xs text-muted">
                      {new Date(s.startedAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-muted">
                    {s.status !== "completed"
                      ? "진행 중"
                      : s.insufficientData
                        ? "판정 보류"
                        : s.feedbackStatus === "ok"
                          ? `목표 ${s.goalsMet}/${s.goalsTotal}`
                          : "분석 불가"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="ledger-title">
        <h2 id="ledger-title" className="section-title">
          경험치 내역
        </h2>
        {p.xpEvents.length === 0 ? (
          <p className="card text-sm text-muted">아직 받은 경험치가 없어요.</p>
        ) : (
          <ul className="card space-y-1.5 text-sm">
            {p.xpEvents.map((e, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span>{e.reason}</span>
                <span className="shrink-0 font-semibold">+{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
