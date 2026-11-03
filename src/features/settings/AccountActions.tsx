"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        router.replace("/login");
        router.refresh();
      }}
    >
      로그아웃
    </button>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function del() {
    setStep("deleting");
    setError(null);
    try {
      await api("/api/account/data", { method: "DELETE" });
      router.replace("/signup");
      router.refresh();
    } catch (err) {
      setStep("confirm");
      setError(err instanceof ApiError ? err.message : "삭제하지 못했어요.");
    }
  }

  if (step === "idle") {
    return (
      <button type="button" className="btn-danger" onClick={() => setStep("confirm")}>
        계정 삭제
      </button>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-[0.875rem] border border-bad p-4">
      <p className="font-semibold text-bad">삭제하면 되돌릴 수 없어요.</p>
      <p className="text-sm">대화 기록, 피드백, 경험치, 복습 표현, 계정이 모두 지워져요.</p>
      <label htmlFor="confirm-delete" className="label">
        확인을 위해 &lsquo;삭제&rsquo;라고 입력해 주세요
      </label>
      <input id="confirm-delete" className="input" value={typed} onChange={(e) => setTyped(e.target.value)} />
      {error && (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn-danger" disabled={typed !== "삭제" || step === "deleting"} onClick={del}>
          {step === "deleting" ? "삭제하는 중…" : "영구 삭제"}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setStep("idle")}>
          취소
        </button>
      </div>
    </div>
  );
}

export function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function reset() {
    setCurrent("");
    setNext("");
    setConfirm("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return setError("새 비밀번호는 8자 이상으로 정해 주세요.");
    if (next !== confirm) return setError("두 비밀번호가 달라요. 같은 비밀번호를 한 번 더 입력해 주세요.");
    setBusy(true);
    setError(null);
    try {
      await api("/api/account/password", { method: "POST", json: { currentPassword: current, newPassword: next } });
      reset();
      setOpen(false);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "바꾸지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="space-y-3 text-center">
        {done && (
          <p role="status" className="rounded-[0.875rem] bg-ok-soft px-3 py-2 text-sm text-ok">
            비밀번호를 바꿨어요. 이 기기를 뺀 다른 기기의 로그인은 모두 풀렸어요.
          </p>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            setDone(false);
            setOpen(true);
          }}
        >
          비밀번호 바꾸기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4 text-left" noValidate>
      <div>
        <label htmlFor="current-password" className="label">
          지금 비밀번호
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="new-password" className="label">
          새 비밀번호
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="change-pw-help"
          className="input"
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <p id="change-pw-help" className="mt-1.5 text-sm text-muted">
          8자 이상으로 정해 주세요. 바꾸면 이 기기를 뺀 다른 기기의 로그인이 풀려요.
        </p>
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="label">
          새 비밀번호 확인
        </label>
        <input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={busy || !current}>
          {busy ? "바꾸는 중…" : "새 비밀번호 저장"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={busy}
          onClick={() => {
            reset();
            setOpen(false);
          }}
        >
          취소
        </button>
      </div>
    </form>
  );
}
