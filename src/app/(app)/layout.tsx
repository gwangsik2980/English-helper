import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav, TopNav } from "@/features/ui/NavLinks";
import { aiMode } from "@/server/ai";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);
  if (!profile.onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:p-2">
        본문으로 건너뛰기
      </a>
      <header className="sticky top-0 z-10 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-sm font-extrabold tracking-widest text-brand">
            ENGLISH QUEST
          </Link>
          <TopNav />
        </div>
      </header>
      {aiMode() === "demo" && (
        <div className="border-b border-border bg-warn-soft px-4 py-2 text-center text-xs text-warn">
          데모 모드예요. AI 키가 연결되지 않아 정해진 대사와 규칙 기반 피드백으로 동작해요.
        </div>
      )}
      <main id="main" className="mx-auto w-full max-w-5xl px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
