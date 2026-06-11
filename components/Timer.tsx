"use client";

import { useEffect, useRef, useState } from "react";

type TimerProps = {
  seconds: number;
  resetKey: number | string; // change this to restart the countdown
  onExpire: () => void;
};

// Per-question countdown. Restarts whenever resetKey changes and calls
// onExpire once it hits zero.
export default function Timer({ seconds, resetKey, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  // Stable ref to onExpire so the tick effect doesn't depend on it.
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  // Restart the countdown for each new question.
  useEffect(() => {
    setRemaining(seconds);
  }, [resetKey, seconds]);

  // Tick down once per second; fire onExpire at zero.
  useEffect(() => {
    if (remaining <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const low = remaining <= 10;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
        low ? "bg-red-500/20 text-red-300" : "bg-white/10 text-slate-300"
      }`}
    >
      {remaining}s left
    </span>
  );
}
