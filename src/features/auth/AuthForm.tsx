"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowBadge } from "@/features/ui/Icons";
import { api, ApiError } from "@/shared/api-client";

export function AuthForm({ mode, notice }: { mode: "login" | "signup"; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ next: string }>(`/api/auth/${mode}`, { method: "POST", json: { email, password } });
      router.replace(res.next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "문제가 생겼어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="reveal mb-8">
        <p className="eyebrow-accent">{isSignup ? "처음 시작하기" : "이어서 연습하기"}</p>
        <h2 className="display mt-2 text-3xl">{isSignup ? "계정 만들기" : "로그인"}</h2>
      </div>
      <div>
        <label htmlFor="email" className="label">
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="label">
            비밀번호
          </label>
          {!isSignup && (
            <Link href="/forgot-password" className="text-sm text-muted underline-offset-2 hover:text-accent hover:underline">
              비밀번호를 잊으셨나요?
            </Link>
          )}
        </div>
        <input
          id="password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={8}
          aria-describedby={isSignup ? "pw-help" : undefined}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isSignup && (
          <p id="pw-help" className="mt-1.5 text-sm text-muted">
            8자 이상으로 정해 주세요.
          </p>
        )}
      </div>
      {notice && !error && (
        <p role="status" className="rounded-[0.875rem] bg-ok-soft px-3 py-2 text-sm text-ok">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary btn-arrow nudge-group w-full justify-between" disabled={busy}>
        {busy ? "잠시만요…" : isSignup ? "가입하고 시작하기" : "로그인"}
        <ArrowBadge />
      </button>
      <p className="text-center text-sm text-muted">
        {isSignup ? "이미 계정이 있나요? " : "처음이신가요? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-accent underline-offset-2 hover:underline">
          {isSignup ? "로그인" : "회원가입"}
        </Link>
      </p>
    </form>
  );
}
