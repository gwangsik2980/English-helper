"use client";

import { useEffect, useState } from "react";

const STEPS = ["대화를 정리하고 있어요", "상황 목표를 확인하고 있어요", "더 자연스러운 표현을 고르고 있어요", "경험치를 계산하고 있어요"];

/**
 * Shown while the session is analyzed (usually 10–20s, one server call).
 * The steps describe what the analysis covers; they advance on a timer,
 * not on live server progress, so the bar never claims to finish early.
 */
export function FeedbackProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => setElapsed((Date.now() - start) / 1000), 250);
    return () => window.clearInterval(id);
  }, []);

  const step = Math.min(Math.floor(elapsed / 4), STEPS.length - 1);
  // Approaches 90% asymptotically; the page navigates away when done.
  const pct = Math.round(90 * (1 - Math.exp(-elapsed / 7)));

  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">피드백을 만들고 있어요</p>
        <p className="text-xs tabular-nums text-muted">{Math.floor(elapsed)}초</p>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <div className="h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <ol className="space-y-1 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className={i < step ? "text-muted" : i === step ? "text-white" : "text-subtle"}>
            <span aria-hidden className="mr-2 inline-block w-3">
              {i < step ? "✓" : i === step ? "•" : ""}
            </span>
            {s}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">
        보통 10~20초 걸려요. 이 화면을 떠나도 대화는 저장돼 있고, 결과는 성장 기록에서 다시 볼 수 있어요.
        {elapsed > 30 && " 평소보다 오래 걸리고 있어요. 조금만 더 기다려 주세요."}
      </p>
    </div>
  );
}
