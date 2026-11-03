"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "홈", icon: "⌂" },
  { href: "/missions", label: "미션", icon: "◎" },
  { href: "/phrases", label: "표현장", icon: "✎" },
  { href: "/progress", label: "성장 기록", icon: "↗" },
  { href: "/settings", label: "설정", icon: "⚙" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="주요 메뉴" className="hidden md:block">
      <ul className="glass-bar flex items-center gap-1 rounded-full p-1">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  active ? "bg-accent text-accent-ink" : "text-muted hover:text-text"
                }`}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="주요 메뉴"
      className="glass-bar fixed inset-x-3 bottom-3 z-20 rounded-full p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] md:hidden"
    >
      <ul className="grid grid-cols-5 gap-1">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
                  active ? "bg-accent text-accent-ink" : "text-white/65"
                }`}
              >
                <span aria-hidden className="text-base leading-none">
                  {l.icon}
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
