import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: "1em", height: "1em", "aria-hidden": true } as const;
const stroke = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** Brand 4-point spark. */
export function LogoMark(p: P) {
  return (
    <svg viewBox="0 0 48 48" fill="currentColor" {...base} {...p}>
      <path d="M24 2c2.2 13.8 7.9 19.6 22 22-14.1 2.4-19.8 8.2-22 22-2.2-13.8-7.9-19.6-22-22 14.1-2.4 19.8-8.2 22-22Z" />
    </svg>
  );
}

export function ArrowRight(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} {...stroke} {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRight(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} {...stroke} {...base} {...p}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function CloseIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={2} {...stroke} {...base} {...p}>
      <path d="M4 4l16 16M20 4 4 20" />
    </svg>
  );
}

export function CircleDot(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.6} {...stroke} {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Star(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base} {...p}>
      <path d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.9l-5.8 3.05 1.1-6.46-4.69-4.58 6.49-.94L12 2.5z" />
    </svg>
  );
}

/** Pill button arrow badge. Use inside a `nudge-group` parent for the hover nudge. */
export function ArrowBadge({ dir = "right" }: { dir?: "right" | "up-right" }) {
  return (
    <span className="arrow-badge">
      {dir === "right" ? <ArrowRight className="nudge-right" /> : <ArrowUpRight className="nudge-up-right" />}
    </span>
  );
}

export function MicIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} {...base} {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function SpeakerIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" strokeWidth={1.8} {...stroke} {...base} {...p}>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
    </svg>
  );
}

export function StopIcon(p: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...base} {...p}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
    </svg>
  );
}
