"use client";

import { useEffect, useRef, useState } from "react";

// Lightweight cheating detection: flags when the user leaves the test screen,
// via tab switch (document.visibilityState) or window blur.
// `active` lets the caller monitor only while the test is in progress.
export function useCheating(active: boolean = true) {
  const [violations, setViolations] = useState(0);
  const [showWarning, setShowWarning] = useState(false);

  // Tracks whether we're currently "away" so a single tab switch
  // (which fires both blur AND visibilitychange) counts only once.
  const awayRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;

    function goAway() {
      if (awayRef.current) return; // already counted this absence
      awayRef.current = true;
      setViolations((v) => v + 1);
      setShowWarning(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setShowWarning(false), 4000);
    }

    function comeBack() {
      awayRef.current = false;
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") goAway();
      else comeBack();
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", goAway);
    window.addEventListener("focus", comeBack);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", goAway);
      window.removeEventListener("focus", comeBack);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [active]);

  function reset() {
    setViolations(0);
    setShowWarning(false);
    awayRef.current = false;
  }

  return { violations, showWarning, reset };
}
