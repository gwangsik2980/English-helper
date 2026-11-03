import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoMark } from "@/features/ui/Icons";
import { BottomNav, TopNav } from "@/features/ui/NavLinks";
import { aiMode } from "@/server/ai";
import { requirePageUser } from "@/server/http";
import { getProfile } from "@/server/services/profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await requirePageUser();
  const profile = await getProfile(userId);
  if (!profile.onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-60 focus:rounded-[0.875rem] focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgb(4_5_12/0.6)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[88rem] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <LogoMark className="text-[1.25rem] text-white" />
            <span>ENGLISH QUEST</span>
          </Link>
          <TopNav />
          {aiMode() === "demo" && (
            <span className="chip glass-bar hidden lg:inline-flex" title="AI 키가 없어 정해진 대사와 규칙 기반 피드백으로 동작해요">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" /> 데모 모드
            </span>
          )}
        </div>
      </header>
      {aiMode() === "demo" && (
        <p className="mx-5 rounded-full bg-warn-soft px-4 py-2 text-center text-xs text-warn sm:mx-8 lg:hidden">
          데모 모드예요. AI 키가 연결되지 않아 정해진 대사와 규칙 기반 피드백으로 동작해요.
        </p>
      )}
      <main id="main" className="relative mx-auto w-full max-w-[88rem] px-5 py-8 sm:px-8 lg:py-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
