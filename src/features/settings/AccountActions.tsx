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
        계정과 모든 학습 데이터 삭제
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-bad p-4">
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
