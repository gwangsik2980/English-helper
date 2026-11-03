"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowBadge } from "@/features/ui/Icons";
import { api, ApiError } from "@/shared/api-client";
import {
  CORRECTION_LABEL_KO,
  CORRECTION_MODES,
  GOAL_LABEL_KO,
  GOALS,
  LEVEL_LABEL_KO,
  LEVELS,
  type CorrectionMode,
  type Goal,
  type Level,
} from "@/shared/schemas/domain";

type Initial = {
  displayName: string;
  level: Level;
  goals: Goal[];
  correctionMode: CorrectionMode;
  dailyMinutes: number;
};

const LEVEL_HELP: Record<Level, string> = {
  beginner: "짧은 문장으로 말하는 게 아직 어려워요",
  intermediate: "기본 대화는 되지만 자연스럽게 말하고 싶어요",
  advanced: "웬만한 대화는 되고 표현을 다듬고 싶어요",
};

export function ProfileForm({
  initial,
  submitLabel,
  redirectTo,
  compact = false,
}: {
  initial: Initial;
  submitLabel: string;
  redirectTo?: string;
  /** Settings: hide the onboarding help lines. */
  compact?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Initial>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function toggleGoal(g: Goal) {
    setForm((f) => ({ ...f, goals: f.goals.includes(g) ? f.goals.filter((x) => x !== g) : [...f.goals, g] }));
    setStatus("idle");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    try {
      await api("/api/profile", { method: "PUT", json: form });
      setStatus("saved");
      if (redirectTo) {
        router.replace(redirectTo);
      }
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요. 다시 시도해 주세요.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="displayName" className="label">
          부를 이름
        </label>
        <input
          id="displayName"
          className="input"
          maxLength={30}
          value={form.displayName}
          onChange={(e) => {
            setForm({ ...form, displayName: e.target.value });
            setStatus("idle");
          }}
        />
      </div>

      <fieldset>
        <legend className="label">어떤 상황에서 영어를 쓰고 싶나요? (여러 개 선택 가능)</legend>
        <div className="flex flex-wrap gap-2">
          {GOALS.map((g) => {
            const on = form.goals.includes(g);
            return (
              <button
                type="button"
                key={g}
                aria-pressed={on}
                onClick={() => toggleGoal(g)}
                className={`btn ${on ? "bg-accent text-accent-ink" : "border border-line bg-surface text-white"}`}
              >
                {on ? "✓ " : ""}
                {GOAL_LABEL_KO[g]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">지금 내 영어 수준</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <label
              key={l}
              className={`cursor-pointer rounded-[1.25rem] border p-4 transition-colors ${form.level === l ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <input
                type="radio"
                name="level"
                value={l}
                checked={form.level === l}
                onChange={() => {
                  setForm({ ...form, level: l });
                  setStatus("idle");
                }}
                className="sr-only"
              />
              <span className="block font-semibold">
                {form.level === l ? "● " : "○ "}
                {LEVEL_LABEL_KO[l]}
              </span>
              {!compact && <span className="mt-1 block text-sm text-muted">{LEVEL_HELP[l]}</span>}
            </label>
          ))}
        </div>
        {!compact && (
          <p className="mt-2 text-sm text-muted">스스로 고른 수준은 출발점일 뿐이에요. 대화가 쌓이면 추천이 함께 조정돼요.</p>
        )}
      </fieldset>

      <fieldset>
        <legend className="label">교정은 언제 받을까요?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CORRECTION_MODES.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-[1.25rem] border p-4 transition-colors ${form.correctionMode === m ? "border-accent bg-accent-soft ring-1 ring-accent" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <input
                type="radio"
                name="correctionMode"
                value={m}
                checked={form.correctionMode === m}
                onChange={() => {
                  setForm({ ...form, correctionMode: m });
                  setStatus("idle");
                }}
                className="sr-only"
              />
              <span className="font-semibold">
                {form.correctionMode === m ? "● " : "○ "}
                {CORRECTION_LABEL_KO[m]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="dailyMinutes" className="label">
          하루 학습 시간: {form.dailyMinutes}분
        </label>
        <input
          id="dailyMinutes"
          type="range"
          min={5}
          max={30}
          step={5}
          value={form.dailyMinutes}
          onChange={(e) => {
            setForm({ ...form, dailyMinutes: Number(e.target.value) });
            setStatus("idle");
          }}
          className="w-full accent-[var(--accent)]"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="btn-primary btn-arrow nudge-group"
          disabled={status === "saving" || form.goals.length === 0}
        >
          {status === "saving" ? "저장하는 중…" : submitLabel}
          <ArrowBadge />
        </button>
        <span role="status" className="text-sm text-muted">
          {status === "saved" && !redirectTo ? "✓ 저장됐어요" : form.goals.length === 0 ? "목표를 하나 이상 골라 주세요" : ""}
        </span>
      </div>
    </form>
  );
}
