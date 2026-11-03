"use client";

import { useEffect, useRef } from "react";
import { fluidSimulation } from "./fluid";

/**
 * Fixed WebGL ink background + legibility scrim (Flowstate reference).
 * One instance for the whole app (mounted in the root layout) so the
 * simulation survives page navigation instead of restarting.
 * Skipped for reduced-motion users or when WebGL is unavailable: the page
 * then shows the plain near-black base.
 */
export function FluidBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let destroy: (() => void) | undefined;
    try {
      destroy = fluidSimulation(canvas) as () => void;
    } catch {
      canvas.style.display = "none";
    }
    return () => destroy?.();
  }, []);

  return (
    <>
      <canvas ref={ref} aria-hidden className="fluid-canvas" />
      <div aria-hidden className="fluid-scrim" />
    </>
  );
}

type FluidMode = "hero" | "calm";

/**
 * Sets the background mode for the current screen:
 * - "hero": landing/login, ink at full strength (reference scrim)
 * - "calm": reading screens, auto-cursor off and a deep even veil
 * Screens that set nothing get the default dimmed veil.
 */
export function useFluidMode(mode: FluidMode) {
  useEffect(() => {
    document.body.dataset.fluid = mode;
    return () => {
      delete document.body.dataset.fluid;
    };
  }, [mode]);
}

export function useCalmFluid() {
  useFluidMode("calm");
}

/** Drop into a Server Component page to set its background mode. */
export function FluidMode({ mode }: { mode: FluidMode }) {
  useFluidMode(mode);
  return null;
}

export function CalmFluid() {
  return <FluidMode mode="calm" />;
}
