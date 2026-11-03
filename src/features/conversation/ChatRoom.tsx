"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCalmFluid } from "@/features/ui/FluidBackground";
import { FeedbackProgress } from "./FeedbackProgress";
import { useChatViewport } from "./use-chat-viewport";
import {
  ArrowRight,
  LogoMark,
  MicIcon,
  SpeakerIcon,
  StopIcon,
} from "@/features/ui/Icons";
import {
  useSpeechRecognition,
  type RecognitionResult,
} from "@/features/voice/speech-recognition";
import { primeAudio, useSpeechSynthesis } from "@/features/voice/speech-synthesis";
import { useVoicePrefs } from "@/features/voice/voice-prefs";
import { api, ApiError } from "@/shared/api-client";
import { usesPattern } from "@/shared/expressions";
import {
  LOW_TRANSCRIPT_CONFIDENCE,
  MAX_TURN_CHARS,
} from "@/shared/schemas/domain";

export type ChatTurn = {
  id: string;
  speaker: "user" | "ai";
  text: string;
  tip: { original: string; suggested: string; reasonKo: string } | null;
  modality?: string;
};

type Outgoing = {
  text: string;
  modality: "text" | "voice";
  transcriptConfidence: number | null;
};
type Pending = Outgoing & {
  clientTurnId: string;
  state: "sending" | "failed";
  error?: string;
};

type Props = {
  sessionId: string;
  missionTitle: string;
  aiRole: string;
  goals: { id: string; descriptionKo: string }[];
  hints: string[];
  /** Mission key expressions and the learner's own phrasebook ({ en: pattern, ko: meaning }). */
  keyExpressions: { en: string; ko: string }[];
  myPhrases: { en: string; ko: string }[];
  /** The server can voice partner lines with Google's natural voices. */
  cloudVoice: boolean;
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
  const [sceneComplete, setSceneComplete] = useState(
    props.initialSceneComplete,
  );
  const [panel, setPanel] = useState<"none" | "goals" | "hints">("none");
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState<
    "idle" | "working" | "failed" | "discarding"
  >("idle");
  const [undoing, setUndoing] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const [endError, setEndError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ---- Voice (stage 4): free browser speech, text always remains the main path.
  const { prefs, update: updatePrefs } = useVoicePrefs();
  const tts = useSpeechSynthesis({ cloud: props.cloudVoice });
  /** The draft came from speech; kept so we know whether the learner edited it. */
  const [voiceDraft, setVoiceDraft] = useState<RecognitionResult | null>(null);
  const [micNotice, setMicNotice] = useState<"none" | "intro" | "unsupported">(
    "none",
  );
  const stt = useSpeechRecognition((r) => {
    setDraft(r.transcript);
    setVoiceDraft(r);
    inputRef.current?.focus();
  });
  const listening = stt.state === "listening";
  const lowConfidence =
    voiceDraft !== null &&
    voiceDraft.confidence !== null &&
    voiceDraft.confidence < LOW_TRANSCRIPT_CONFIDENCE &&
    draft.trim() === voiceDraft.transcript;

  function onMicClick() {
    tts.stop();
    primeAudio();
    if (listening) {
      stt.stop();
      return;
    }
    if (stt.state === "unsupported") {
      setMicNotice("unsupported");
      return;
    }
    if (!prefs.micIntroSeen) {
      setMicNotice("intro");
      return;
    }
    stt.start();
  }

  // Reading screen: keep the ink background calm behind the conversation.
  useCalmFluid();
  useChatViewport(rootRef, listRef);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, pending]);

  async function send(out: Outgoing, clientTurnId: string) {
    setPending({ ...out, clientTurnId, state: "sending" });
    try {
      const res = await api<{
        userTurn: ChatTurn;
        aiTurn: ChatTurn;
        sceneComplete: boolean;
      }>(`/api/sessions/${props.sessionId}/turns`, {
        method: "POST",
        json: { ...out, clientTurnId },
      });
      setTurns((t) => [
        ...t.filter((x) => x.id !== res.userTurn.id),
        res.userTurn,
        res.aiTurn,
      ]);
      setSceneComplete(res.sceneComplete);
      setPending(null);
      if (prefs.autoRead) tts.speak(res.aiTurn.id, res.aiTurn.text, prefs.rate, prefs.naturalVoice, prefs.voiceURI);
      inputRef.current?.focus();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "보내지 못했어요.";
      if (err instanceof ApiError && err.code === "session_closed") {
        router.refresh();
      }
      setPending({ ...out, clientTurnId, state: "failed", error: message });
    }
  }

  function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const text = draft.trim();
    if (!text || pending || listening) return;
    // This tap lets the reply's audio play automatically on iPhone.
    if (prefs.autoRead) primeAudio();
    // A transcript the learner edited is their own confirmed text, so its
    // recognizer confidence no longer applies.
    const fromVoice = voiceDraft !== null;
    const unedited = fromVoice && text === voiceDraft.transcript;
    setDraft("");
    setVoiceDraft(null);
    void send(
      {
        text,
        modality: fromVoice ? "voice" : "text",
        transcriptConfidence: unedited ? voiceDraft.confidence : null,
      },
      newClientTurnId(),
    );
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
      await api(`/api/sessions/${props.sessionId}/complete`, {
        method: "POST",
      });
      router.push(`/session/${props.sessionId}/result`);
    } catch (err) {
      setEnding("failed");
      setEndError(
        err instanceof ApiError ? err.message : "대화를 끝내지 못했어요.",
      );
    }
  }

  /** Discard: end without feedback and delete this conversation. */
  async function discardSession() {
    setEnding("discarding");
    setEndError(null);
    try {
      await api(`/api/sessions/${props.sessionId}`, { method: "DELETE" });
      router.replace("/");
      router.refresh();
    } catch (err) {
      setEnding("idle");
      setEndError(
        err instanceof ApiError
          ? err.message
          : "대화를 지우지 못했어요. 잠시 후 다시 눌러 주세요.",
      );
    }
  }

  /** Takes back my last line (and the reply) and puts it back in the input. */
  async function undoLast(turnId: string) {
    setUndoing(true);
    setUndoError(null);
    tts.stop();
    try {
      const res = await api<{ text: string }>(
        `/api/sessions/${props.sessionId}/turns/last`,
        { method: "DELETE" },
      );
      setTurns((t) => t.slice(0, t.findIndex((x) => x.id === turnId)));
      setSceneComplete(false);
      setDraft(res.text);
      setVoiceDraft(null);
      inputRef.current?.focus();
    } catch (err) {
      setUndoError(
        err instanceof ApiError
          ? err.message
          : "고치지 못했어요. 잠시 후 다시 눌러 주세요.",
      );
    } finally {
      setUndoing(false);
    }
  }

  const userTurnCount = turns.filter((t) => t.speaker === "user").length;
  const userLines = turns.filter((t) => t.speaker === "user").map((t) => t.text);
  const used = (pattern: string) => userLines.some((l) => usesPattern(l, pattern));
  const lastUserTurnId = [...turns].reverse().find((t) => t.speaker === "user")?.id;
  const canUndo = !pending && !listening && ending === "idle";

  return (
    <div ref={rootRef} className="fixed inset-x-0 top-0 flex h-dvh flex-col">
      <header className="border-b border-white/10 bg-[rgb(4_5_12/0.5)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
          <Link
            href="/"
            className="btn-ghost px-2"
            aria-label="홈으로 나가기 (대화는 저장돼요)"
          >
            ←
          </Link>
          <LogoMark aria-hidden className="shrink-0 text-[1.1rem] text-white" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">
              {props.missionTitle}
            </h1>
            <p className="truncate text-xs text-muted">
              상대: <span lang="en">{props.aiRole}</span>
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary min-h-9 px-4 text-xs font-medium uppercase tracking-wide"
            onClick={() => setConfirmEnd(true)}
          >
            끝내기
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2 px-3 pb-2">
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
            표현 보기
          </button>
          {tts.supported && (
            <>
              <button
                type="button"
                aria-pressed={prefs.autoRead}
                onClick={() => updatePrefs({ autoRead: !prefs.autoRead })}
                className={`chip ${prefs.autoRead ? "border-white/60 bg-white/15 text-white" : ""}`}
              >
                <SpeakerIcon /> 자동 읽기 {prefs.autoRead ? "켬" : "끔"}
              </button>
              <button
                type="button"
                aria-pressed={prefs.rate < 1}
                onClick={() => updatePrefs({ rate: prefs.rate < 1 ? 1 : 0.8 })}
                className={`chip ${prefs.rate < 1 ? "border-white/60 bg-white/15 text-white" : ""}`}
              >
                느리게
              </button>
            </>
          )}
          <span
            className="chip ml-auto hidden sm:inline-flex"
            aria-live="polite"
          >
            ✓ 자동 저장됨
          </span>
        </div>
        {panel !== "none" && (
          <div id="chat-panel" className="mx-auto max-w-3xl px-3 pb-3">
            <div
              data-scroll
              className="max-h-[45dvh] overflow-y-auto overscroll-contain rounded-[1.25rem] bg-surface p-4 text-sm"
            >
              {panel === "goals" ? (
                <ol className="list-decimal space-y-1 pl-5">
                  {props.goals.map((g) => (
                    <li key={g.id}>{g.descriptionKo}</li>
                  ))}
                </ol>
              ) : (
                <div className="space-y-4">
                  {[
                    { title: "핵심 표현", list: props.keyExpressions },
                    { title: "내 표현장", list: props.myPhrases },
                  ].map(
                    (group) =>
                      group.list.length > 0 && (
                        <section key={group.title}>
                          <h3 className="mb-1.5 text-xs font-semibold text-muted">
                            {group.title}
                          </h3>
                          <ul className="space-y-1.5">
                            {group.list.map((e) => (
                              <li key={e.en} className="flex items-start gap-2">
                                <span
                                  aria-label={used(e.en) ? "씀" : undefined}
                                  className={`mt-0.5 w-4 shrink-0 text-xs ${used(e.en) ? "text-ok" : "text-subtle"}`}
                                >
                                  {used(e.en) ? "✓" : "·"}
                                </span>
                                <span>
                                  <span lang="en" className="font-semibold">
                                    {e.en}
                                  </span>
                                  {e.ko && (
                                    <span className="block text-xs text-muted">
                                      {e.ko}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ),
                  )}
                <section>
                <h3 className="mb-1.5 text-xs font-semibold text-muted">
                  예문 (누르면 입력창에 들어가요)
                </h3>
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
                </ul>
                </section>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        aria-live="polite"
        aria-label="대화 내용"
      >
        {/* One pixel taller than the list so it always scrolls and bounces
            like a messenger, even with a single message. */}
        <ol className="mx-auto min-h-[calc(100%+1px)] max-w-3xl space-y-3 px-4 py-6">
          {turns.map((t) => (
            <li
              key={t.id}
              className={`flex flex-col ${t.speaker === "user" ? "items-end" : "items-start"}`}
            >
              <span className="sr-only">
                {t.speaker === "user" ? "나:" : "상대:"}
              </span>
              <p
                lang="en"
                className={`max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] px-4 py-3 text-[15px] leading-relaxed ${
                  t.speaker === "user"
                    ? "rounded-br-md bg-accent text-accent-ink"
                    : "glass-bar rounded-bl-md"
                }`}
              >
                {t.text}
              </p>
              {t.speaker === "ai" && tts.supported && (
                <button
                  type="button"
                  onClick={() =>
                    tts.speakingId === t.id
                      ? tts.stop()
                      : tts.speak(t.id, t.text, prefs.rate, prefs.naturalVoice, prefs.voiceURI)
                  }
                  className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted hover:text-text"
                  aria-label={
                    tts.speakingId === t.id ? "읽기 멈추기" : "소리로 듣기"
                  }
                >
                  {tts.speakingId === t.id ? <StopIcon /> : <SpeakerIcon />}
                  {tts.speakingId === t.id ? "멈추기" : "듣기"}
                </button>
              )}
              {t.speaker === "user" &&
                (t.modality === "voice" || t.id === lastUserTurnId) && (
                  <span className="mt-1 inline-flex items-center gap-2 text-xs text-muted">
                    {t.modality === "voice" && (
                      <span className="inline-flex items-center gap-1">
                        <MicIcon /> 말해서 보냄
                      </span>
                    )}
                    {t.id === lastUserTurnId && canUndo && (
                      <button
                        type="button"
                        disabled={undoing}
                        onClick={() => void undoLast(t.id)}
                        className="rounded-full px-2 py-1 hover:text-text"
                        aria-label="마지막으로 보낸 말 고치기. 상대의 답도 함께 지워져요"
                      >
                        {undoing ? "되돌리는 중…" : "고치기"}
                      </button>
                    )}
                  </span>
                )}
              {t.id === lastUserTurnId && undoError && (
                <p role="alert" className="mt-1 text-xs text-bad">
                  {undoError}
                </p>
              )}
              {t.tip && (
                <div className="reveal mt-2 max-w-[85%] rounded-[1.25rem] bg-accent-soft px-4 py-3 text-sm">
                  <p className="eyebrow-accent text-xs">더 자연스러운 표현</p>
                  <p lang="en" className="mt-1">
                    <span className="text-muted line-through">
                      {t.tip.original}
                    </span>{" "}
                    → <span className="font-semibold">{t.tip.suggested}</span>
                  </p>
                  <p className="mt-0.5 text-muted">{t.tip.reasonKo}</p>
                </div>
              )}
            </li>
          ))}
          {pending && (
            <li className="flex flex-col items-end">
              <p
                lang="en"
                className="max-w-[85%] whitespace-pre-wrap rounded-[1.25rem] rounded-br-md bg-accent/60 px-4 py-2.5 text-[15px] text-accent-ink"
              >
                {pending.text}
              </p>
              {pending.state === "sending" ? (
                <p className="mt-2 self-start text-sm text-muted" role="status">
                  상대가 답하는 중…
                </p>
              ) : (
                <div
                  role="alert"
                  className="mt-2 max-w-[85%] rounded-[1.25rem] bg-bad-soft px-4 py-3 text-sm text-bad"
                >
                  <p>{pending.error}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="btn-secondary min-h-9 px-3 text-sm"
                      onClick={() =>
                        void send(
                          {
                            text: pending.text,
                            modality: pending.modality,
                            transcriptConfidence: pending.transcriptConfidence,
                          },
                          pending.clientTurnId,
                        )
                      }
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
              <p className="font-semibold text-ok">
                장면이 자연스럽게 마무리됐어요.
              </p>
              <p className="mt-1">
                대화를 끝내고 피드백을 받아 보세요. 더 이야기하고 싶다면
                계속해도 괜찮아요.
              </p>
              <button
                type="button"
                className="btn-primary mt-3 min-h-9 text-sm"
                onClick={() => setConfirmEnd(true)}
              >
                끝내고 피드백 받기
              </button>
            </li>
          )}
        </ol>
      </div>

      {confirmEnd && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="end-title"
          className="border-t border-white/10 bg-[rgb(4_5_12/0.7)] backdrop-blur-xl"
        >
          {ending === "working" ? (
            <div className="mx-auto max-w-3xl px-3 py-4">
              <span id="end-title" className="sr-only">
                피드백 만드는 중
              </span>
              <FeedbackProgress />
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-2 px-3 py-3">
              <p id="end-title" className="font-semibold">
                대화를 끝낼까요?
              </p>
              <p className="text-sm text-muted">
                {userTurnCount < 2
                  ? "피드백을 받으면 대화가 짧아서 평가가 보류될 수 있어요. 종료하면 피드백 없이 이 대화를 지워요."
                  : "피드백 받기는 지금까지의 대화로 평가해요. 종료하면 피드백 없이 이 대화를 지워요."}
              </p>
              {endError && (
                <p role="alert" className="text-sm text-bad">
                  {endError}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  className="btn-ghost px-2 text-bad"
                  disabled={ending === "discarding"}
                  onClick={discardSession}
                >
                  {ending === "discarding" ? "지우는 중…" : "종료"}
                </button>
                <button
                  type="button"
                  className="btn-secondary px-2"
                  disabled={ending === "discarding"}
                  onClick={() => {
                    setConfirmEnd(false);
                    setEndError(null);
                  }}
                >
                  계속 대화하기
                </button>
                <button
                  type="button"
                  className="btn-primary px-2"
                  disabled={ending === "discarding"}
                  onClick={endSession}
                >
                  {ending === "failed" ? "다시 시도" : "피드백 받기"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(micNotice !== "none" ||
        listening ||
        stt.error ||
        tts.error ||
        lowConfidence ||
        voiceDraft) && (
        <div className="border-t border-white/10 bg-[rgb(4_5_12/0.7)] backdrop-blur-xl">
          <div className="mx-auto max-w-3xl space-y-2 px-3 py-3 text-sm">
            {micNotice === "intro" && (
              <div
                className="space-y-2"
                role="dialog"
                aria-labelledby="mic-title"
              >
                <p id="mic-title" className="font-semibold">
                  마이크로 말해서 답할 수 있어요
                </p>
                <p className="text-muted">
                  버튼을 누를 때마다 한 문장만 듣고 자동으로 멈춰요. 받아 적은
                  문장은 보내기 전에 확인하고 고칠 수 있어요. 음성은 브라우저의
                  음성 인식 서비스(Chrome은 Google)가 처리하고, 우리 서버에는
                  보낸 글자만 저장돼요.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-primary min-h-9 text-sm"
                    onClick={() => {
                      updatePrefs({ micIntroSeen: true });
                      setMicNotice("none");
                      stt.start();
                    }}
                  >
                    마이크 켜기
                  </button>
                  <button
                    type="button"
                    className="btn-ghost min-h-9 text-sm"
                    onClick={() => setMicNotice("none")}
                  >
                    텍스트로만 할게요
                  </button>
                </div>
              </div>
            )}
            {micNotice === "unsupported" && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3"
              >
                <p className="text-muted">
                  이 브라우저는 음성 인식을 지원하지 않아요. Chrome, Edge,
                  Safari에서 쓸 수 있어요. 지금은 텍스트로 계속해 주세요.
                </p>
                <button
                  type="button"
                  className="btn-ghost min-h-8 px-3 text-xs"
                  onClick={() => setMicNotice("none")}
                >
                  닫기
                </button>
              </div>
            )}
            {listening && (
              <div className="flex items-center gap-3" role="status">
                <span aria-hidden className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bad opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-bad" />
                </span>
                <span className="flex-1">
                  <span className="font-semibold">마이크 켜짐 · 듣는 중</span>
                  <span lang="en" className="block truncate text-muted">
                    {stt.interim ||
                      "영어로 말해 보세요. 말을 멈추면 자동으로 끝나요."}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn-secondary min-h-9 px-3 text-xs"
                  onClick={stt.stop}
                >
                  다 말했어요
                </button>
                <button
                  type="button"
                  className="btn-ghost min-h-9 px-3 text-xs"
                  onClick={stt.cancel}
                >
                  취소
                </button>
              </div>
            )}
            {!listening && voiceDraft && (
              <p
                className={lowConfidence ? "text-warn" : "text-muted"}
                role="status"
              >
                {lowConfidence
                  ? "잘못 알아들었을 수 있어요. 입력창의 문장을 확인하고 고친 뒤 보내 주세요. 고치지 않으면 이 문장은 평가에서 빠져요."
                  : "말한 내용을 받아 적었어요. 맞는지 확인하고 보내 주세요. 고쳐도 괜찮아요."}
              </p>
            )}
            {stt.error && (
              <div
                role="alert"
                className="flex items-start justify-between gap-3 text-bad"
              >
                <p>{stt.error}</p>
                <button
                  type="button"
                  className="btn-ghost min-h-8 px-3 text-xs"
                  onClick={stt.clearError}
                >
                  닫기
                </button>
              </div>
            )}
            {tts.error && (
              <p role="alert" className="text-bad">
                {tts.error}
              </p>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="border-t border-white/10 bg-[rgb(4_5_12/0.5)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        aria-label="메시지 보내기"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-3 py-2.5">
          <button
            type="button"
            onClick={onMicClick}
            disabled={Boolean(pending) || (ending === "working" || ending === "discarding")}
            aria-pressed={listening}
            aria-label={listening ? "말하기 끝내기" : "마이크로 말하기"}
            className={`btn h-11 w-11 shrink-0 p-0 ${
              listening
                ? "bg-bad text-[#2b0606]"
                : stt.state === "unsupported"
                  ? "border border-white/15 text-subtle"
                  : "border border-white/20 bg-white/5 text-white"
            }`}
          >
            {listening ? <StopIcon /> : <MicIcon className="text-lg" />}
          </button>
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
            onChange={(e) => {
              setDraft(e.target.value);
              if (!e.target.value.trim()) setVoiceDraft(null);
            }}
            onKeyDown={onKeyDown}
            placeholder={
              listening
                ? "듣는 중…"
                : "영어로 답해 보세요"
            }
            disabled={Boolean(pending) || (ending === "working" || ending === "discarding") || listening}
            className="input max-h-32 min-h-11 flex-1 resize-none rounded-[1.375rem] py-2.5"
            autoComplete="off"
            autoCapitalize="sentences"
          />
          <button
            type="submit"
            className="btn-light h-11 w-11 shrink-0 p-0"
            aria-label="보내기"
            disabled={
              !draft.trim() ||
              Boolean(pending) ||
              (ending === "working" || ending === "discarding") ||
              listening
            }
          >
            <ArrowRight className="text-base" />
          </button>
        </div>
      </form>
    </div>
  );
}
