"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

export function StartMissionButton({
  missionId,
  label = "미션 시작",
  className = "btn-primary",
}: {
  missionId: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ sessionId: string }>("/api/sessions", { method: "POST", json: { missionId } });
      router.push(`/session/${res.sessionId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "미션을 시작하지 못했어요.");
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={start} disabled={busy} className={className}>
        {busy ? "준비하는 중…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-bad">
          {error}
        </p>
      )}
    </div>
  );
}
