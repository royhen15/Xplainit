"use client";

import type { EvaluationResult } from "@/lib/evaluate";

// Result screen: a circular score gauge + the examiner's explanation.
export default function Result({ result }: { result: EvaluationResult }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (result.score / 100) * circumference;

  const color =
    result.score >= 70 ? "#34d399" : result.score >= 40 ? "#fbbf24" : "#f87171";

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
        Your Score
      </p>

      <div className="relative mx-auto mt-4 h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold text-white">{result.score}</span>
          <span className="text-xs text-slate-400">out of 100</span>
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md leading-relaxed text-slate-300">
        {result.explanation}
      </p>
    </div>
  );
}
