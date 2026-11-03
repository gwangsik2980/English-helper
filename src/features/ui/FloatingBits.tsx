"use client";

import { useEffect, useRef } from "react";

export type Bit = { text: string; top: string; left: string; size?: "sm" | "md" | "lg"; tone?: "glass" | "pink" };

const SIZE = { sm: "text-xs px-3 py-1.5", md: "text-sm px-4 py-2", lg: "text-base px-5 py-2.5" };

/**
 * Floating English speech bubbles that bob, drift with the cursor (parallax)
 * and get pushed away when the pointer comes close — the reference's berry
 * "force field" (radius 400px, strength 80, lerp 0.1), with words instead of fruit.
 * Decorative only; hidden from assistive tech and off for reduced motion.
 */
export function FloatingBits({ bits, className = "" }: { bits: Bit[]; className?: string }) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>("[data-bit]"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const state = els.map(() => ({ rx: 0, ry: 0 }));
    const mouse = { x: 0, y: 0, px: -9999, py: -9999 };
    const cur = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
      mouse.px = e.clientX;
      mouse.py = e.clientY;
    };
    window.addEventListener("pointermove", onMove);
    const durs = [5, 7, 6, 8, 5.5, 6.5, 9, 11, 10];
    let raf = 0;
    const tick = () => {
      const t = Date.now() * 0.001;
      cur.x += (mouse.x - cur.x) * 0.05;
      cur.y += (mouse.y - cur.y) * 0.05;
      root.style.transform = `translate(${cur.x * 40}px, ${cur.y * 40}px)`;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dx = mouse.px - (r.left + r.width / 2);
        const dy = mouse.py - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        let tx = 0;
        let ty = 0;
        if (dist < 400) {
          const force = (400 - dist) / 400;
          tx = (dx / dist) * force * -80;
          ty = (dy / dist) * force * -80;
        }
        const s = state[i];
        s.rx += (tx - s.rx) * 0.1;
        s.ry += (ty - s.ry) * 0.1;
        const phase = (t + i * 0.7) * ((Math.PI * 2) / durs[i % durs.length]);
        el.style.transform = `translate(${s.rx}px, ${s.ry + Math.sin(phase) * 15}px) rotate(${Math.cos(phase) * 6}deg)`;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div ref={box} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {bits.map((b) => (
        <span
          key={b.text}
          data-bit
          lang="en"
          className={`absolute whitespace-nowrap rounded-[1.25rem] font-medium shadow-[0_10px_20px_rgb(0_0_0/0.2)] ${SIZE[b.size ?? "md"]} ${
            b.tone === "pink"
              ? "rounded-br-sm bg-accent text-accent-ink"
              : "glass-bar rounded-bl-sm text-white/90"
          }`}
          style={{ top: b.top, left: b.left }}
        >
          {b.text}
        </span>
      ))}
    </div>
  );
}
