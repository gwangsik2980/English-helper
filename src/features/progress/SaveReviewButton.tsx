"use client";

import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

export function SaveReviewButton({ sessionId, turnId, saved: initiallySaved }: { sessionId: string; turnId: string; saved: boolean }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(initiallySaved ? "saved" : "idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setState("saving");
    try {
      await api("/api/review-items", { method: "POST", json: { sessionId, turnId } });
      setState("saved");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요.");
    }
  }

  if (state === "saved") {
    return (
      <p role="status" className="text-sm font-semibold text-ok">
        ✓ 복습 목록에 저장됐어요
      </p>
    );
  }
  return (
    <div>
      <button type="button" className="btn-secondary min-h-9 px-3 text-sm" onClick={save} disabled={state === "saving"}>
        {state === "saving" ? "저장하는 중…" : "복습에 저장"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
