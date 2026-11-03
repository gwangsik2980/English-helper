"use client";

import { useEffect } from "react";

/**
 * iPhone Safari ignores `user-scalable=no`, so pinch zoom is also blocked
 * here: Safari's own gesture events, plus any two-finger move. One-finger
 * scrolling is untouched.
 */
export function NoPinchZoom() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();
    const stopMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    const gestures = ["gesturestart", "gesturechange", "gestureend"];
    gestures.forEach((g) => document.addEventListener(g, stop, { passive: false }));
    document.addEventListener("touchmove", stopMultiTouch, { passive: false });
    return () => {
      gestures.forEach((g) => document.removeEventListener(g, stop));
      document.removeEventListener("touchmove", stopMultiTouch);
    };
  }, []);
  return null;
}
