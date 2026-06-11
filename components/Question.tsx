"use client";

type QuestionProps = {
  index: number; // zero-based
  total: number;
  question: string;
  transcript: string; // live transcript (final + interim)
  isListening: boolean;
};

// Renders the current question and the live speech transcript beneath it.
export default function Question({
  index,
  total,
  question,
  transcript,
  isListening,
}: QuestionProps) {
  return (
    <div className="w-full">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-300">
        Question {index + 1} of {total}
      </p>
      <h2 className="mt-3 text-center text-2xl font-semibold leading-snug text-white">
        {question}
      </h2>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          <span>Your answer</span>
          {isListening && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              recording
            </span>
          )}
        </div>

        <div className="min-h-[6.5rem] rounded-xl border border-white/10 bg-white/5 p-4 text-center text-base leading-relaxed text-slate-100 backdrop-blur">
          {transcript ? (
            transcript
          ) : (
            <span className="italic text-slate-500">
              {isListening
                ? "Listening… just start speaking your answer."
                : "Get ready — the examiner is reading the question."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
