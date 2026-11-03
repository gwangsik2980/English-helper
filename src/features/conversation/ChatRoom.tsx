"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LogoMark } from "@/features/ui/Icons";
import { api, ApiError } from "@/shared/api-client";
import { MAX_TURN_CHARS } from "@/shared/schemas/domain";

export type ChatTurn = {
  id: string;
  speaker: "user" | "ai";
  text: string;
  tip: { original: string; suggested: string; reasonKo: string } | null;
};

type Pending = { clientTurnId: string; text: string; state: "sending" | "failed"; error?: string };

type Props = {
  sessionId: string;
  missionTitle: string;
  aiRole: string;
  goals: { id: string; descriptionKo: string }[];
  hints: string[];
  initialTurns: ChatTurn[];
  initialSceneComplete: boolean;
};

function newClientTurnId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function ChatRoom(props: Props) {
  const router = useRouter();
  const [turns, setTurns] = useState<ChatTurn[]>(props.initialTurns);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [sceneComplete, setSceneComplete] = useState(props.initialSceneComplete);
  const [panel, setPanel] = useState<"none" | "goals" | "hints">("none");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState<"idle" | "working" | "failed">("idle");
  const [endError, setEndError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, pending]);

  async function send(text: string, clientTurnId: string) {
    setPending({ clientTurnId, text, state: "sending" });
    try {
      const res = await api<{
        userTurn: ChatTurn;
        aiTurn: ChatTurn;
        sceneComplete: boolean;
      }>(`/api/sessions/${props.sessionId}/turns`, { method: "POST", json: { text, clientTurnId } });
      setTurns((t) => [...t.filter((x) => x.id !== res.userTurn.id), res.userTurn, res.aiTurn]);
      setSceneComplete(res.sceneComplete);
      setPending(null);
      inputRef.current?.focus();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "보내지 못했어요.";
      if (err instanceof ApiError && err.code === "session_closed") {
        router.refresh();
      }
      setPending({ clientTurnId, text, state: "failed", error: message });
    }
  }

  function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    void send(text, newClientTurnId());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Korean IME: don't send while a syllable is still being composed.
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  }

  async function endSession() {
    setEnding("working");
    setEndError(null);
    try {
      await api(`/api/sessions/${props.sessionId}/complete`, { method: "POST" });
      router.push(`/session/${props.sessionId}/result`);
    } catch (err) {
      setEnding("failed");
      setEndError(err instanceof ApiError ? err.message : "대화를 끝내지 못했어요.");
    }
  }

  const userTurnCount = turns.filter((t) => t.speaker === "user").length;

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="border-b border-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
          <Link href="/" className="btn-ghost px-2" aria-label="홈으로 나가기 (대화는 저장돼요)">
            ←
          </Link>
          <LogoMark aria-hidden className="shrink-0 text-[1.1rem] text-accent" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">{props.missionTitle}</h1>
            <p className="truncate text-xs text-muted">
              상대: <span lang="en">{props.aiRole}</span>
            </p>
          </div>
          <button type="button" className="btn-secondary min-h-9 px-4 text-xs font-medium uppercase tracking-wide" onClick={() => setConfirmEnd(true)}>
            끝내기
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl gap-2 px-3 pb-2">
          <button
            type="button"
            aria-expanded={panel === "goals"}
            aria-controls="chat-panel"
            onClick={() => setPanel(panel === "goals" ? "none" : "goals")}
            className="chip"
          >
            목표 {props.goals.length}개
          </button>
          <button
            type="button"
            aria-expanded={panel === "hints"}
            aria-controls="chat-panel"
            onClick={() => setPanel(panel === "hints" ? "none" : "hints")}
            className="chip"
          >
            힌트 보기
          </button>
          <span className="chip ml-auto" aria-live="polite">
            ✓ 자동 저장됨
          </span>
        </div>
        {panel !== "none" && (
          <div id="chat-panel" className="mx-auto max-w-3xl px-3 pb-3">
            <div className="rounded-[1.25rem] bg-surface p-4 text-sm">
              {panel === "goals" ? (
                <ol className="list-decimal space-y-1 pl-5">
                  {props.goals.map((g) => (
                    <li key={g.id}>{g.descriptionKo}</li>
                  ))}
                </ol>
              ) : (
                <ul className="space-y-1" lang="en">
                  {props.hints.map((h) => (
                    <li key={h}>
                      <button
                        type="button"
                        className="text-left hover:underline"
                        onClick={() => {
                          setDraft(h);
                          setPanel("none");
                          inputRef.current?.focus();
                        }}
                      >
                        {h}
                      </button>
                    </li>
                  ))}
                  <li className="pt-1 text-xs text-muted" lang="ko">
                    문장을 누르면 입력창에 들어가요. 고쳐서 보내도 좋아요.
                  </li>
                </ul>
              )}
            </div>
          </div>
        )}
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto" aria-live="polite" aria-label="대화 내용">
        <ol className="mx-auto max-w-3xl space-y-3 px-4 py-6">
          {turns.map((t) => (
            <li key={t.id} className={`flex flex-col ${t.speaker === "user" ? "items-end" : "items-start"}`}>
              <span className="sr-only">{t.speaker === "user" ? "나:" : "상대:"}</span>
              <p
                lang="en"
                className={`max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] px-4 py-3 text-[15px] leading-relaxed ${
                  t.speaker === "user"
                    ? "rounded-br-md bg-ink text-white"
                    : "rounded-bl-md bg-surface"
                }`}
              >
                {t.text}
              </p>
              {t.tip && (
                <div className="reveal mt-2 max-w-[85%] rounded-[1.25rem] bg-accent-soft px-4 py-3 text-sm">
                  <p className="eyebrow-accent text-xs">더 자연스러운 표현</p>
                  <p lang="en" className="mt-1">
                    <span className="text-muted line-through">{t.tip.original}</span> →{" "}
                    <span className="font-semibold">{t.tip.suggested}</span>
                  </p>
                  <p className="mt-0.5 text-muted">{t.tip.reasonKo}</p>
                </div>
              )}
            </li>
          ))}
          {pending && (
            <li className="flex flex-col items-end">
              <p lang="en" className="max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] rounded-br-md bg-ink/60 px-4 py-2.5 text-[15px] text-white">
                {pending.text}
              </p>
              {pending.state === "sending" ? (
                <p className="mt-2 self-start text-sm text-muted" role="status">
                  상대가 답하는 중…
                </p>
              ) : (
                <div role="alert" className="mt-2 max-w-[85%] rounded-[1.25rem] bg-bad-soft px-4 py-3 text-sm text-bad">
                  <p>{pending.error}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary min-h-9 px-3 text-sm"
                      onClick={() => void send(pending.text, pending.clientTurnId)}
                    >
                      다시 보내기
                    </button>
                    <button
                      type="button"
                      className="btn-ghost min-h-9 px-3 text-sm"
                      onClick={() => {
                        setDraft(pending.text);
                        setPending(null);
                        router.refresh();
                      }}
                    >
                      고쳐서 보내기
                    </button>
                  </div>
                </div>
              )}
            </li>
          )}
          {sceneComplete && !pending && (
            <li className="reveal rounded-[1.25rem] bg-ok-soft px-5 py-4 text-sm">
              <p className="font-semibold text-ok">장면이 자연스럽게 마무리됐어요.</p>
              <p className="mt-1">대화를 끝내고 피드백을 받아 보세요. 더 이야기하고 싶다면 계속해도 괜찮아요.</p>
              <button type="button" className="btn-primary mt-3 min-h-9 text-sm" onClick={() => setConfirmEnd(true)}>
                끝내고 피드백 받기
              </button>
            </li>
          )}
        </ol>
      </div>

      {confirmEnd && (
        <div role="dialog" aria-modal="false" aria-labelledby="end-title" className="border-t border-line bg-white">
          <div className="mx-auto max-w-3xl space-y-2 px-3 py-3">
            <p id="end-title" className="font-semibold">
              대화를 끝낼까요?
            </p>
            <p className="text-sm text-muted">
              {userTurnCount < 2
                ? "아직 대화가 짧아서 평가는 보류될 수 있어요. 그래도 지금까지 내용은 저장돼요."
                : "끝내면 지금까지의 대화로 피드백을 만들어요. 끝낸 대화에는 더 이어서 말할 수 없어요."}
            </p>
            {endError && (
              <p role="alert" className="text-sm text-bad">
                {endError}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={endSession} disabled={ending === "working"}>
                {ending === "working" ? "피드백을 만드는 중…" : ending === "failed" ? "다시 시도" : "끝내고 피드백 받기"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmEnd(false)}
                disabled={ending === "working"}
              >
                계속 대화하기
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="border-t border-line bg-white pb-[env(safe-area-inset-bottom)]"
        aria-label="메시지 보내기"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-2">
          <label htmlFor="chat-input" className="sr-only">
            영어로 답하기
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={1}
            lang="en"
            maxLength={MAX_TURN_CHARS}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="영어로 답해 보세요"
            disabled={Boolean(pending) || ending === "working"}
            className="input max-h-32 min-h-11 flex-1 resize-none rounded-[1.375rem] py-2.5"
            autoComplete="off"
            autoCapitalize="sentences"
          />
          <button
            type="submit"
            className="btn-primary h-11 w-11 shrink-0 p-0"
            aria-label="보내기"
            disabled={!draft.trim() || Boolean(pending) || ending === "working"}
          >
            <ArrowRight className="text-base" />
          </button>
        </div>
        <p className="mx-auto max-w-3xl px-3 pb-2 text-xs text-muted">
          Enter로 보내고 Shift+Enter로 줄을 바꿔요. 홈으로 나가도 대화는 저장되고 나중에 이어할 수 있어요.
        </p>
      </form>
    </div>
  );
}
