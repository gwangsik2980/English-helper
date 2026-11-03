"use client";

import { useState } from "react";
import { api, ApiError } from "@/shared/api-client";

export type PhraseItem = { id: string; phrase: string; meaningKo: string };

export function PhraseBook({ initial }: { initial: PhraseItem[] }) {
  const [items, setItems] = useState(initial);
  const [phrase, setPhrase] = useState("");
  const [meaning, setMeaning] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!phrase.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const item = await api<PhraseItem>("/api/phrases", { method: "POST", json: { phrase, meaningKo: meaning } });
      setItems((xs) => [item, ...xs]);
      setPhrase("");
      setMeaning("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    try {
      await api(`/api/phrases/${id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "지우지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="card space-y-3 sm:p-6" noValidate>
        <div>
          <label htmlFor="phrase" className="label">
            영어 표현
          </label>
          <input
            id="phrase"
            lang="en"
            className="input"
            maxLength={120}
            autoComplete="off"
            autoCapitalize="sentences"
            placeholder="I was wondering if ~"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted">바꿔 넣는 부분은 ~로 적어 두면 대화에서 쓴 걸 알아봐요.</p>
        </div>
        <div>
          <label htmlFor="meaning" className="label">
            뜻 (선택)
          </label>
          <input
            id="meaning"
            className="input"
            maxLength={120}
            autoComplete="off"
            placeholder="혹시 ~해도 될까요"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}
        <button type="submit" className="btn-primary" disabled={!phrase.trim() || busy}>
          {busy ? "저장하는 중…" : "표현장에 추가"}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="card text-sm text-muted">
          아직 적어 둔 표현이 없어요. 책이나 영상에서 배운 표현을 적어 두면 미션 대화 중에 보여 주고, 실제로 썼는지 결과에서
          알려 줘요.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.id} className="card-soft flex items-start justify-between gap-3 p-4">
              <span className="min-w-0">
                <span lang="en" className="block font-semibold">
                  {i.phrase}
                </span>
                {i.meaningKo && <span className="mt-0.5 block text-sm text-muted">{i.meaningKo}</span>}
              </span>
              <button
                type="button"
                className="btn-ghost min-h-8 shrink-0 px-3 text-xs"
                onClick={() => void remove(i.id)}
                aria-label={`${i.phrase} 지우기`}
              >
                지우기
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
