"use client";

import { useEffect, type RefObject } from "react";

/*
 * Keeps the chat screen pinned to what the learner can actually see.
 *
 * iPhone Safari ignores `interactive-widget=resizes-content`: when the
 * keyboard opens, the page keeps its full height and the whole document
 * becomes draggable, so a swipe on the conversation drags the screen
 * (header and input included) up into empty space. Here the chat is fixed
 * to the visual viewport, the page behind it is locked, and only the
 * message list (and a long draft in the textarea) can scroll.
 */
export function useChatViewport(
  rootRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    html.classList.add("chat-lock");

    const vv = window.visualViewport;
    const fit = () => {
      if (!vv) return;
      root.style.height = `${vv.height}px`;
      root.style.transform = `translateY(${vv.offsetTop}px)`;
    };
    fit();
    vv?.addEventListener("resize", fit);
    vv?.addEventListener("scroll", fit);

    const onTouchMove = (e: TouchEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (target && (scrollRef.current?.contains(target) || target.closest("textarea"))) return;
      e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      html.classList.remove("chat-lock");
      vv?.removeEventListener("resize", fit);
      vv?.removeEventListener("scroll", fit);
      document.removeEventListener("touchmove", onTouchMove);
      root.style.height = "";
      root.style.transform = "";
    };
  }, [rootRef, scrollRef]);
}
