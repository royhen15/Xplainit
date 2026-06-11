"use client";

import { useEffect } from "react";

// Hardens the page while the test is in progress: blocks all keyboard input
// and shortcuts, right-click, copy/cut/paste, text selection, and scrolling.
// (OS-level actions like Alt+Tab can't be blocked here — tab-switching is
// caught separately by the cheating detector.)
export function useLockdown(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener("keydown", block, true);
    document.addEventListener("contextmenu", block, true);
    document.addEventListener("copy", block, true);
    document.addEventListener("cut", block, true);
    document.addEventListener("paste", block, true);
    document.addEventListener("selectstart", block, true);
    document.addEventListener("dragstart", block, true);

    const prevOverflow = document.body.style.overflow;
    const prevSelect = document.body.style.userSelect;
    document.body.style.overflow = "hidden";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("keydown", block, true);
      document.removeEventListener("contextmenu", block, true);
      document.removeEventListener("copy", block, true);
      document.removeEventListener("cut", block, true);
      document.removeEventListener("paste", block, true);
      document.removeEventListener("selectstart", block, true);
      document.removeEventListener("dragstart", block, true);
      document.body.style.overflow = prevOverflow;
      document.body.style.userSelect = prevSelect;
    };
  }, [active]);
}
