"use client";

import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

export function ReportFeedback({ sessionId }: { sessionId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    try {
      await api(`/api/sessions/${sessionId}/feedback/report`, { method: "POST", json: { message } });
      setState("sent");
    } catch (err) {
      setState("error");
      setError(err instanceof ApiError ? err.message : "보내지 못했어요.");
    }
  }

  if (state === "sent") return <p role="status" className="text-sm text-ok">✓ 의견을 보냈어요. 피드백 품질을 고치는 데 쓸게요.</p>;
  if (!open) {
    return (
      <button type="button" className="text-sm text-muted underline underline-offset-2" onClick={() => setOpen(true)}>
        피드백이 틀렸거나 이상한가요?
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <label htmlFor="report" className="label">
        어떤 점이 이상했나요?
      </label>
      <textarea
        id="report"
        className="input min-h-24 py-2"
        maxLength={1000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="예: 제가 한 말과 다른 문장을 인용했어요"
      />
      {error && <p role="alert" className="text-sm text-bad">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-secondary min-h-9 text-sm" disabled={!message.trim() || state === "sending"}>
          보내기
        </button>
        <button type="button" className="btn-ghost min-h-9 text-sm" onClick={() => setOpen(false)}>
          취소
        </button>
      </div>
    </form>
  );
}
