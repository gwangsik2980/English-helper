"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowBadge } from "@/features/ui/Icons";
import { api, ApiError } from "@/shared/api-client";

const errorText = (err: unknown) => (err instanceof ApiError ? err.message : "문제가 생겼어요. 다시 시도해 주세요.");

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="reveal mb-8">
      <p className="eyebrow-accent">{eyebrow}</p>
      <h2 className="display mt-2 text-3xl">{title}</h2>
    </div>
  );
}

function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-[0.875rem] bg-bad-soft px-3 py-2 text-sm text-bad">
      {message}
    </p>
  );
}

function BackToLogin() {
  return (
    <p className="text-center text-sm text-muted">
      <Link href="/login" className="font-semibold text-accent underline-offset-2 hover:underline">
        로그인으로 돌아가기
      </Link>
    </p>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/password-reset/request", { method: "POST", json: { email } });
      setSentTo(email.trim());
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <Heading eyebrow="메일을 확인해 주세요" title="링크를 보냈어요" />
        {/* Same message whether or not the account exists. */}
        <p className="text-sm leading-relaxed text-muted" role="status">
          <span className="font-semibold text-text">{sentTo}</span>(으)로 가입된 계정이 있다면 비밀번호 재설정 링크를 보냈어요.
          링크는 30분 동안 한 번만 쓸 수 있어요.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          몇 분이 지나도 메일이 없으면 스팸함을 확인하거나, 주소를 다시 확인한 뒤 한 번 더 요청해 주세요.
        </p>
        <button type="button" className="btn-secondary w-full" onClick={() => setSentTo(null)}>
          다른 주소로 다시 요청하기
        </button>
        <BackToLogin />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Heading eyebrow="비밀번호 찾기" title="재설정 링크 받기" />
      <p className="text-sm leading-relaxed text-muted">가입한 이메일을 적어 주시면 새 비밀번호를 정할 수 있는 링크를 보내 드려요.</p>
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
      <ErrorBox message={error} />
      <button type="submit" className="btn-primary btn-arrow nudge-group w-full justify-between" disabled={busy || !email}>
        {busy ? "보내는 중…" : "재설정 링크 보내기"}
        <ArrowBadge />
      </button>
      <BackToLogin />
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [linkDead, setLinkDead] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4">
        <Heading eyebrow="새 비밀번호" title="링크가 올바르지 않아요" />
        <p className="text-sm leading-relaxed text-muted">
          메일의 링크 주소가 잘렸거나 바뀐 것 같아요. 메일의 버튼을 다시 누르거나 재설정 링크를 새로 받아 주세요.
        </p>
        <Link href="/forgot-password" className="btn-primary w-full justify-center">
          재설정 링크 다시 받기
        </Link>
        <BackToLogin />
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return setError("새 비밀번호는 8자 이상으로 정해 주세요.");
    if (password !== confirm) return setError("두 비밀번호가 달라요. 같은 비밀번호를 한 번 더 입력해 주세요.");
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ next: string }>("/api/auth/password-reset/confirm", {
        method: "POST",
        json: { token, password },
      });
      router.replace(res.next);
      router.refresh();
    } catch (err) {
      setError(errorText(err));
      setLinkDead(err instanceof ApiError && err.code === "token_invalid");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Heading eyebrow="새 비밀번호" title="비밀번호 다시 정하기" />
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
          aria-describedby="new-pw-help"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p id="new-pw-help" className="mt-1.5 text-sm text-muted">
          8자 이상으로 정해 주세요. 바꾸면 다른 기기의 로그인도 모두 풀려요.
        </p>
      </div>
      <div>
        <label htmlFor="confirm-password" className="label">
          새 비밀번호 확인
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          required
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      <ErrorBox message={error} />
      {linkDead ? (
        <Link href="/forgot-password" className="btn-primary w-full justify-center">
          재설정 링크 다시 받기
        </Link>
      ) : (
        <button type="submit" className="btn-primary btn-arrow nudge-group w-full justify-between" disabled={busy}>
          {busy ? "바꾸는 중…" : "비밀번호 바꾸기"}
          <ArrowBadge />
        </button>
      )}
      <BackToLogin />
    </form>
  );
}
