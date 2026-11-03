"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "홈", icon: "⌂" },
  { href: "/missions", label: "미션", icon: "◎" },
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
      <ul className="flex items-center gap-1 rounded-full border border-line/80 bg-white/60 p-1 backdrop-blur">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active ? "bg-ink text-white" : "text-muted hover:text-text"
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
      className="fixed inset-x-3 bottom-3 z-20 rounded-full bg-ink p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] text-white shadow-lg md:hidden"
    >
      <ul className="grid grid-cols-4">
        {LINKS.map((l) => {
          const active = isActive(pathname, l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center rounded-full text-[11px] font-medium transition-colors ${
                  active ? "bg-white/12 text-white" : "text-white/55"
                }`}
              >
                <span aria-hidden className={`text-base leading-none ${active ? "text-accent-from" : ""}`}>
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
