"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowBadge } from "@/features/ui/Icons";
import { api, ApiError } from "@/shared/api-client";
import {
  LEVEL_LABEL_KO,
  type CorrectionMode,
  type Goal,
  type Level,
} from "@/shared/schemas/domain";

type Q = {
  situationKo: string;
  prompt?: string;
  options: string[];
  answer: number;
};

// Ordered easy → hard. Content draft; review wording before launch.
const QUESTIONS: Q[] = [
  {
    situationKo: "카페 점원이 묻습니다. 가장 자연스러운 대답은?",
    prompt: "What can I get for you?",
    options: ["I am latte.", "Could I have a latte, please?", "Yes, I can."],
    answer: 1,
  },
  {
    situationKo: "처음 온 도시에서 길을 물을 때 가장 자연스러운 표현은?",
    options: [
      "Where is station go?",
      "Station, how?",
      "Excuse me, how do I get to the station?",
    ],
    answer: 2,
  },
  {
    situationKo: "동료가 창문을 열어도 되는지 묻습니다. 괜찮다고 할 때는?",
    prompt: "Do you mind if I open the window?",
    options: ["Not at all, go ahead.", "Yes, I mind.", "No, don't open."],
    answer: 0,
  },
  {
    situationKo: "협력사에 회의 일정을 바꾸자고 할 때 가장 정중한 표현은?",
    options: [
      "Change the meeting to Thursday.",
      "You must move the meeting.",
      "Would it be possible to move our meeting to Thursday?",
    ],
    answer: 2,
  },
  {
    situationKo:
      "당신은 점원입니다. 손님이 이렇게 말할 때 가장 자연스러운 대답은?",
    prompt: "I'm afraid there's been a mix-up with my order.",
    options: [
      "Mix-up is not my problem.",
      "I'm so sorry about that. Let me fix it right away.",
      "Yes, it is mixed.",
    ],
    answer: 1,
  },
];

// 초급/중급/상급 all end in a final consonant, so the particle is always "으로".
function suggestLevel(score: number): Level {
  if (score >= 5) return "advanced";
  if (score >= 3) return "intermediate";
  return "beginner";
}

type Profile = {
  displayName: string;
  level: Level;
  goals: Goal[];
  correctionMode: CorrectionMode;
  dailyMinutes: number;
};

export function LevelCheck({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = index >= QUESTIONS.length;
  const q = QUESTIONS[Math.min(index, QUESTIONS.length - 1)];
  const suggested = suggestLevel(score);

  function choose(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  }

  function next() {
    setPicked(null);
    setIndex((i) => i + 1);
  }

  async function apply(level: Level) {
    setSaving(true);
    setError(null);
    try {
      if (level !== profile.level)
        await api("/api/profile", {
          method: "PUT",
          json: { ...profile, level },
        });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "저장하지 못했어요. 다시 시도해 주세요.",
      );
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5" role="status">
        <p className="eyebrow">결과</p>
        <p className="text-5xl font-semibold tracking-tight">
          {score}
          <span className="text-xl text-muted"> / {QUESTIONS.length}</span>
        </p>
        <p className="text-lg">
          추천 레벨은 <strong>{LEVEL_LABEL_KO[suggested]}</strong>이에요.
          {suggested !== profile.level &&
            ` 처음에 고른 레벨은 ${LEVEL_LABEL_KO[profile.level]}이에요.`}
        </p>
        <p className="text-sm text-muted">
          다섯 문제로 본 잠정 추천이에요. 실력을 단정하는 점수가 아니고, 대화가
          쌓이면 추천 미션이 함께 조정돼요. 레벨은 설정에서 언제든 바꿀 수
          있어요.
        </p>
        {error && (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary btn-arrow nudge-group"
            disabled={saving}
            onClick={() => apply(suggested)}
          >
            {LEVEL_LABEL_KO[suggested]}으로 시작하기
            <ArrowBadge />
          </button>
          {suggested !== profile.level && (
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => apply(profile.level)}
            >
              {LEVEL_LABEL_KO[profile.level]} 유지하기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">
          {index + 1} / {QUESTIONS.length}
        </p>
        <Link
          href="/"
          className="text-sm text-muted underline-offset-2 hover:text-text hover:underline"
        >
          건너뛰기
        </Link>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
        <div
          className="h-full rounded-full bg-white transition-[width] duration-300"
          style={{ width: `${(index / QUESTIONS.length) * 100}%` }}
        />
      </div>
      <fieldset className="space-y-3">
        <legend className="text-lg font-medium">{q.situationKo}</legend>
        {q.prompt && (
          <p
            lang="en"
            className="glass-bar mt-3 w-fit rounded-[1.25rem] rounded-bl-md px-4 py-3"
          >
            {q.prompt}
          </p>
        )}
        <div className="mt-3 grid gap-2">
          {q.options.map((o, i) => {
            const state =
              picked === null
                ? "idle"
                : i === q.answer
                  ? "correct"
                  : i === picked
                    ? "wrong"
                    : "dim";
            return (
              <button
                key={o}
                type="button"
                lang="en"
                onClick={() => choose(i)}
                disabled={picked !== null}
                aria-pressed={picked === i}
                className={`rounded-[1.25rem] border p-4 text-left transition-colors ${
                  state === "correct"
                    ? "border-ok bg-ok-soft"
                    : state === "wrong"
                      ? "border-bad bg-bad-soft"
                      : state === "dim"
                        ? "border-line opacity-60"
                        : "border-line bg-surface hover:bg-surface-2"
                }`}
              >
                <span aria-hidden className="mr-2 text-muted">
                  {state === "correct"
                    ? "✓"
                    : state === "wrong"
                      ? "✕"
                      : String.fromCharCode(65 + i)}
                </span>
                {o}
              </button>
            );
          })}
        </div>
      </fieldset>
      {picked !== null && (
        <div className="flex items-center justify-between gap-3" role="status">
          <p className="text-sm">
            {picked === q.answer
              ? "맞아요."
              : "괜찮아요. 초록색이 더 자연스러운 표현이에요."}
          </p>
          <button type="button" className="btn-primary" onClick={next}>
            {index + 1 === QUESTIONS.length ? "결과 보기" : "다음"}
          </button>
        </div>
      )}
    </div>
  );
}
