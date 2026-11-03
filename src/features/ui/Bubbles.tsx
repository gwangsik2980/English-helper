"use client";

import { useEffect, useRef } from "react";

/**
 * Rising soda bubbles behind the UI (reference: spawn every 400ms, 10–30px,
 * 4–10s rise, +30px drift). Drawn with CSS instead of an image, capped so
 * long sessions don't pile up nodes, and off for reduced-motion users.
 */
export function Bubbles() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const spawn = () => {
      if (document.hidden || box.childElementCount > 40) return;
      const b = document.createElement("span");
      const size = Math.random() * 20 + 10;
      const duration = Math.random() * 6 + 4;
      b.className = "bubble";
      b.style.width = b.style.height = `${size}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.setProperty("--o", String(Math.random() * 0.4 + 0.2));
      b.style.animation = `float-up ${duration}s linear forwards`;
      box.appendChild(b);
      window.setTimeout(() => b.remove(), duration * 1000);
    };
    const id = window.setInterval(spawn, 400);
    return () => window.clearInterval(id);
  }, []);

  return <div ref={ref} aria-hidden className="bubbles" />;
}
