"use client";

import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

type Item = { id: string; phrase: string; suggestedPhrase: string; reasonKo: string; status: "pending" | "done" };

export function ReviewList({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function complete(id: string) {
    setError(null);
    try {
      await api(`/api/review-items/${id}/complete`, { method: "POST" });
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: "done" } : x)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요.");
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/api/review-items/${id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "삭제하지 못했어요.");
    }
  }

  if (items.length === 0) {
    return <p className="card text-sm text-muted">저장한 표현이 없어요. 미션 결과 화면에서 고칠 표현을 복습에 저장할 수 있어요.</p>;
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((i) => {
          const shown = revealed.has(i.id) || i.status === "done";
          return (
            <li key={i.id} className="card-soft space-y-2 p-5">
              <p className="text-xs font-semibold text-muted">내가 했던 말</p>
              <p lang="en">{i.phrase}</p>
              {shown ? (
                <>
                  <p lang="en" className="font-semibold">
                    → {i.suggestedPhrase}
                  </p>
                  <p className="text-sm text-muted">{i.reasonKo}</p>
                </>
              ) : (
                <p className="text-sm text-muted">더 자연스러운 표현을 먼저 소리 내어 말해 본 뒤 확인해 보세요.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {!shown && (
                  <button
                    type="button"
                    className="btn-secondary min-h-9 text-sm"
                    onClick={() => setRevealed((s) => new Set(s).add(i.id))}
                  >
                    정답 표현 보기
                  </button>
                )}
                {i.status === "pending" ? (
                  shown && (
                    <button type="button" className="btn-primary min-h-9 text-sm" onClick={() => complete(i.id)}>
                      복습 완료 (+5 XP)
                    </button>
                  )
                ) : (
                  <span className="chip text-ok">✓ 복습함</span>
                )}
                <button type="button" className="btn-ghost min-h-9 text-sm" onClick={() => remove(i.id)}>
                  삭제
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
