import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReportFeedback } from "@/features/progress/ReportFeedback";
import { SaveReviewButton } from "@/features/progress/SaveReviewButton";
import { StartMissionButton } from "@/features/missions/StartMissionButton";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { requirePageUser } from "@/server/http";
import { getMissionByIdOrSlug } from "@/server/repositories/missions";
import { getFeedback } from "@/server/services/feedback";
import { BAND_LABEL_KO } from "@/server/services/progress";
import { getSession } from "@/server/services/sessions";
import { SKILL_LABEL_KO } from "@/shared/schemas/domain";
import type { GoalStatus } from "@/shared/schemas/feedback";

export const metadata = { title: "결과 · ENGLISH QUEST" };

const STATUS_UI: Record<GoalStatus, { icon: string; label: string; cls: string }> = {
  met: { icon: "✓", label: "달성", cls: "bg-ok-soft text-ok" },
  partial: { icon: "◐", label: "일부 달성", cls: "bg-warn-soft text-warn" },
  not_met: { icon: "○", label: "미달성", cls: "bg-bad-soft text-bad" },
  undetermined: { icon: "?", label: "판단 보류", cls: "bg-surface-2 text-muted" },
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await requirePageUser();
  const { id } = await params;
  const session = await getSession(userId, id).catch((err) => {
    if (err instanceof AppError && err.code === "not_found") notFound();
    throw err;
  });
  if (session.status !== "completed") redirect(`/session/${id}`);

  const { view, mission, xp } = await getFeedback(userId, id);
  const turnText = new Map(session.turns.map((t) => [t.id, t.text]));
  const savedTurnIds = new Set(
    (
      await prisma.reviewItem.findMany({ where: { userId, sourceSessionId: id }, select: { sourceTurnId: true } })
    ).map((r) => r.sourceTurnId),
  );
  const xpTotal = xp.reduce((s, e) => s + e.amount, 0);
  const next =
    view.status === "ok" && view.feedback.next_practice
      ? await getMissionByIdOrSlug(view.feedback.next_practice.mission_id)
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header>
        <p className="text-sm font-semibold text-muted">미션 결과</p>
        <h1 className="text-2xl font-bold">{mission.title}</h1>
      </header>

      {view.status === "unavailable" ? (
        <section role="status" className="card border-warn bg-warn-soft">
          <h2 className="font-bold text-warn">피드백을 만들지 못했어요</h2>
          <p className="mt-1">{view.messageKo}</p>
        </section>
      ) : (
        <>
          <section className="card">
            <h2 className="mb-1 font-bold">한 줄 요약</h2>
            <p>{view.feedback.summary_ko}</p>
            {view.feedback.insufficient_data && (
              <p className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
                주고받은 말이 적어서 목표 판정과 역량 평가는 보류했어요. 적은 발화로 실력을 단정하지 않기 위해서예요.
              </p>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">상황 목표</h2>
            <ul className="space-y-3">
              {view.feedback.goal_outcomes.map((g) => {
                const c = mission.successCriteria.find((x) => x.id === g.goal_id);
                const ui = STATUS_UI[g.status];
                return (
                  <li key={g.goal_id} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${ui.cls}`}>
                        <span aria-hidden>{ui.icon} </span>
                        {ui.label}
                      </span>
                      <span className="font-semibold">{c?.descriptionKo ?? g.goal_id}</span>
                    </div>
                    <p className="text-sm text-muted">{g.reason_ko}</p>
                    {g.evidence_turn_ids.slice(0, 1).map((tid) => (
                      <blockquote key={tid} lang="en" className="border-l-4 border-border pl-3 text-sm">
                        &ldquo;{turnText.get(tid)}&rdquo;
                      </blockquote>
                    ))}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card">
            <h2 className="section-title">잘한 점</h2>
            {view.feedback.strengths.length === 0 ? (
              <p className="text-sm text-muted">이번 대화에서는 근거로 보여 줄 만한 문장을 고르지 못했어요.</p>
            ) : (
              <ul className="space-y-3">
                {view.feedback.strengths.map((s) => (
                  <li key={s.turn_id}>
                    <blockquote lang="en" className="font-semibold">
                      &ldquo;{s.quote}&rdquo;
                    </blockquote>
                    <p className="text-sm text-muted">{s.note_ko}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2 className="section-title">이렇게 말하면 더 자연스러워요</h2>
            {view.feedback.improvements.length === 0 ? (
              <p className="text-sm text-muted">특별히 고칠 표현을 찾지 못했어요.</p>
            ) : (
              <ul className="space-y-4">
                {view.feedback.improvements.map((i) => (
                  <li key={i.turn_id} className="space-y-1.5">
                    <p lang="en" className="text-muted">
                      <span className="sr-only">내가 한 말: </span>
                      {i.original}
                    </p>
                    <p lang="en" className="font-semibold">
                      <span aria-hidden>→ </span>
                      <span className="sr-only">더 자연스러운 표현: </span>
                      {i.suggested}
                    </p>
                    <p className="text-sm text-muted">{i.reason_ko}</p>
                    <SaveReviewButton sessionId={id} turnId={i.turn_id} saved={savedTurnIds.has(i.turn_id)} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {view.feedback.skill_observations.length > 0 && (
            <section className="card">
              <h2 className="section-title">이번 대화에서 관찰한 역량</h2>
              <ul className="space-y-1.5 text-sm">
                {view.feedback.skill_observations.map((o) => (
                  <li key={o.skill} className="flex justify-between gap-3">
                    <span className="font-semibold">{SKILL_LABEL_KO[o.skill]}</span>
                    <span className="text-muted">
                      {BAND_LABEL_KO[o.level]} · 확신도 {Math.round(o.confidence * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">
                한 번의 대화로 본 관찰이에요. 텍스트 대화만으로는 발음과 말하기 속도를 알 수 없어서 평가하지 않아요.
              </p>
            </section>
          )}
        </>
      )}

      <section className="card">
        <h2 className="section-title">획득 경험치 +{xpTotal} XP</h2>
        {xp.length === 0 ? (
          <p className="text-sm text-muted">이번 대화에서는 경험치가 없어요. 한 마디 이상 대화하면 완료 경험치를 받아요.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {xp.map((e, idx) => (
              <li key={idx} className="flex justify-between gap-3">
                <span>{e.reason}</span>
                <span className="shrink-0 font-semibold">+{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        {next && view.status === "ok" && view.feedback.next_practice && (
          <div className="card bg-brand-soft">
            <p className="text-sm font-semibold text-brand">다음 연습 추천</p>
            <p className="mt-1 font-bold">{next.title}</p>
            <p className="text-sm">{view.feedback.next_practice.reason_ko}</p>
            <div className="mt-3">
              <StartMissionButton missionId={next.id} label="이 미션 시작" />
            </div>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <StartMissionButton missionId={mission.id} label="같은 미션 다시 하기" className="btn-secondary" />
          <Link href="/" className="btn-ghost">
            홈으로
          </Link>
        </div>
      </section>

      <details className="card">
        <summary className="cursor-pointer font-semibold">대화 다시 보기</summary>
        <ol className="mt-3 space-y-2 text-sm" lang="en">
          {session.turns.map((t) => (
            <li key={t.id}>
              <span className="font-semibold" lang="ko">
                {t.speaker === "user" ? "나" : "상대"}:
              </span>{" "}
              {t.text}
            </li>
          ))}
        </ol>
      </details>

      <div className="pb-4">
        <ReportFeedback sessionId={id} />
        {view.status === "ok" && (
          <p className="mt-2 text-xs text-muted">
            AI 평가는 학습을 돕는 참고 정보이며 공식 시험 점수가 아니에요. (분석: {view.model === "demo-rules" ? "데모 규칙" : view.model === "none" ? "보류" : view.model})
          </p>
        )}
      </div>
    </div>
  );
}
