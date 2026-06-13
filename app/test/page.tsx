"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTest } from "@/hooks/useTest";
import { useSpeech } from "@/hooks/useSpeech";
import { useCheating } from "@/hooks/useCheating";
import { useProctor } from "@/hooks/useProctor";
import { useLockdown } from "@/hooks/useLockdown";
import { evaluateAnswers, type EvaluationResult } from "@/lib/evaluate";
import Question from "@/components/Question";
import Avatar from "@/components/Avatar";
import Result from "@/components/Result";
import Timer from "@/components/Timer";
import CameraMonitor from "@/components/CameraMonitor";

type EvalStatus = "idle" | "loading" | "done" | "error";

const QUESTION_SECONDS = 60;

export default function TestPage() {
  const router = useRouter();
  const test = useTest();
  const speech = useSpeech();
  const cheating = useCheating(!test.isFinished); // tab-switch / blur
  const proctor = useProctor(!test.isFinished); // camera + eye tracking
  useLockdown(!test.isFinished); // keyboard / copy / right-click / scroll

  const [evalStatus, setEvalStatus] = useState<EvalStatus>("idle");
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [timerEnabled, setTimerEnabled] = useState(false);
  // True while the examiner is reading the question — mic stays OFF.
  const [asking, setAsking] = useState(true);

  // Live text = finalized transcript + any in-progress words.
  const liveTranscript = (
    speech.transcript + (speech.interim ? " " + speech.interim : "")
  ).trim();

  // Each time a new question appears, go into "asking" mode with the mic off.
  // Recording only begins once the examiner finishes reading (handleQuestionRead).
  useEffect(() => {
    if (!test.ready || test.isFinished) return;
    setAsking(true);
    speech.stop();
    speech.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.currentIndex, test.ready]);

  function handleQuestionRead() {
    if (test.isFinished) return;
    setAsking(false);
    speech.start();
  }

  // When the test finishes, send the answers off for AI evaluation.
  useEffect(() => {
    if (!test.isFinished) return;
    let cancelled = false;
    setEvalStatus("loading");
    evaluateAnswers(test.answers)
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setEvalStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setEvalStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [test.isFinished]);

  function handleRestart() {
    speech.stop();
    test.reset();
    cheating.reset();
    proctor.reset();
    setResult(null);
    setEvalStatus("idle");
    setAsking(true);
  }

  function handleExit() {
    handleRestart();
    router.push("/");
  }

  // Save the current answer and advance.
  function handleNext() {
    speech.stop();
    test.setAnswer(liveTranscript);
    test.next();
    speech.reset();
  }

  // Which warning (if any) to show in the popup. None of these stop recording.
  const proctorWarning =
    proctor.status === "ready"
      ? !proctor.faceVisible
        ? "Stay in frame — your face isn’t visible."
        : proctor.lookingAway
        ? "Keep your eyes on the screen."
        : null
      : null;
  const activeWarning = cheating.showWarning
    ? "Stay on the test screen — recording continues."
    : proctorWarning;

  // --- Unsupported browser: clear message, don't fail silently. ---
  if (speech.isSupported === false) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
          <div className="text-4xl">🎙️</div>
          <h1 className="mt-4 text-2xl font-bold text-white">
            Browser not supported
          </h1>
          <p className="mt-3 text-slate-400">
            This test uses speech recognition, which works reliably only in{" "}
            <span className="font-semibold text-slate-200">Google Chrome</span>{" "}
            on desktop. Please reopen this page in Chrome to continue.
          </p>
        </div>
      </main>
    );
  }

  // --- Selecting questions on mount. ---
  if (!test.ready) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />
      </main>
    );
  }

  // --- Finished view: AI evaluation result. ---
  if (test.isFinished) {
    const totalWarnings = cheating.violations + proctor.violations;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl animate-fade-in rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          {evalStatus === "loading" && (
            <div className="py-8 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-indigo-400" />
              <p className="mt-4 text-slate-300">Evaluating your answers…</p>
            </div>
          )}

          {evalStatus === "error" && (
            <div className="py-4 text-center">
              <h1 className="text-2xl font-bold text-white">
                Something went wrong
              </h1>
              <p className="mt-2 text-slate-400">
                We couldn’t evaluate your answers. Please try again.
              </p>
            </div>
          )}

          {evalStatus === "done" && result && <Result result={result} />}

          {evalStatus !== "loading" && (
            <>
              {/* Proctoring summary */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                    totalWarnings > 0
                      ? "bg-red-500/15 text-red-300"
                      : "bg-emerald-500/15 text-emerald-300"
                  }`}
                >
                  {totalWarnings > 0
                    ? `⚠ ${totalWarnings} proctoring warning${
                        totalWarnings > 1 ? "s" : ""
                      }`
                    : "✓ Clean session"}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                  Tab switches: {cheating.violations}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                  Look-aways: {proctor.violations}
                </span>
              </div>

              {/* All transcripts */}
              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Your answers
                </h2>
                <ul className="mt-3 space-y-3">
                  {test.questions.map((q, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-sm font-medium text-slate-400">{q}</p>
                      <p className="mt-1 text-slate-100">
                        {test.answers[i] || (
                          <span className="italic text-slate-500">
                            No answer
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 active:scale-95"
                >
                  Take Test Again
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    );
  }

  // --- Active question. ---
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
      {/* Warning popup — does NOT stop recording */}
      {activeWarning && (
        <div className="pointer-events-none fixed left-1/2 top-6 z-50 -translate-x-1/2">
          <div className="animate-fade-in flex items-center gap-3 rounded-full border border-red-400/40 bg-red-500/90 px-6 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur">
            <span className="text-base">⚠️</span>
            {activeWarning}
          </div>
        </div>
      )}

      {/* Live camera feed (top-right) */}
      <div className="fixed right-5 top-16 z-30">
        <CameraMonitor
          videoRef={proctor.videoRef}
          status={proctor.status}
          faceVisible={proctor.faceVisible}
          lookingAway={proctor.lookingAway}
        />
      </div>

      {/* Exit / reset back to the start */}
      <button
        type="button"
        onClick={handleExit}
        className="absolute left-5 top-5 z-20 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
      >
        Exit
      </button>

      <div
        key={test.currentIndex}
        className="w-full max-w-xl animate-fade-in rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
      >
        {/* Topic for this session */}
        {test.topic && (
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-indigo-300">
            {test.topic}
          </p>
        )}

        {/* Progress dots */}
        <div className="mb-6 flex justify-center gap-2">
          {test.questions.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === test.currentIndex
                  ? "w-8 bg-indigo-400"
                  : i < test.currentIndex
                  ? "w-2 bg-indigo-400/50"
                  : "w-2 bg-white/15"
              }`}
            />
          ))}
        </div>

        <div className="flex justify-center">
          <Avatar
            text={test.currentQuestion}
            listening={speech.isListening}
            onSpeechEnd={handleQuestionRead}
          />
        </div>

        <div className="mt-6">
          <Question
            index={test.currentIndex}
            total={test.total}
            question={test.currentQuestion}
            transcript={liveTranscript}
            isListening={speech.isListening}
          />
        </div>

        {/* Mic status while the examiner is asking */}
        {asking && (
          <p className="mt-4 text-center text-xs font-medium text-slate-400">
            🔇 Microphone off while the examiner asks the question…
          </p>
        )}

        {/* Optional per-question timer (runs only while answering) */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            60s timer
          </label>
          {timerEnabled && !asking && (
            <Timer
              seconds={QUESTION_SECONDS}
              resetKey={test.currentIndex}
              onExpire={handleNext}
            />
          )}
        </div>

        {/* Controls */}
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleNext}
            disabled={asking}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:from-indigo-400 hover:to-violet-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {test.isLast ? "Finish" : "Next question"}
          </button>
        </div>
      </div>
    </main>
  );
}
