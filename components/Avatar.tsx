"use client";

import { useEffect, useRef, useState } from "react";

type AvatarProps = {
  text: string; // spoken aloud whenever it changes
  listening?: boolean; // true while the mic is capturing the answer
  onSpeechEnd?: () => void; // fired once the question finishes being read
  autoSpeak?: boolean; // set false to render a silent portrait (e.g. landing page)
};

// Picks the most natural-sounding English voice available, avoiding the
// default robotic ones (David/Zira/Mark) in favour of Google / "Natural" voices.
function pickVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synth.getVoices();
  if (!voices.length) return null;
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = en.length ? en : voices;

  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural/.test(n)) s += 100; // MS Online Natural voices
    if (/google/.test(n)) s += 80; // Google US English
    if (/samantha|aria|jenny|ava|libby|sonia|emma/.test(n)) s += 60; // nicer named voices
    if (v.lang === "en-US") s += 20;
    if (/david|zira|mark|hazel/.test(n)) s -= 40; // dated robotic voices
    if (v.localService) s -= 5; // online voices usually sound better
    return s;
  };

  return [...pool].sort((a, b) => score(b) - score(a))[0] ?? null;
}

// A polished, human-looking AI examiner. Reads each question aloud with a
// natural voice, blinks and "talks" while speaking, glows while listening,
// and reports when it has finished speaking so recording can start.
export default function Avatar({
  text,
  listening = false,
  onSpeechEnd,
  autoSpeak = true,
}: AvatarProps) {
  const [speaking, setSpeaking] = useState(false);

  const onEndRef = useRef(onSpeechEnd);
  useEffect(() => {
    onEndRef.current = onSpeechEnd;
  });

  useEffect(() => {
    if (!autoSpeak || !text) return;

    let finished = false;
    let started = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      setSpeaking(false);
      onEndRef.current?.();
    };

    if (typeof window === "undefined" || !window.speechSynthesis) {
      finish();
      return;
    }

    const synth = window.speechSynthesis;

    const speakNow = () => {
      if (started) return;
      started = true;
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(synth);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "en-US";
      utterance.rate = 0.96; // slightly slower = warmer, more human
      utterance.pitch = 1.02;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = finish;
      utterance.onerror = finish;
      synth.cancel();
      synth.speak(utterance);
    };

    // Voices load asynchronously in some browsers.
    if (synth.getVoices().length) {
      speakNow();
    } else {
      synth.addEventListener?.("voiceschanged", speakNow, { once: true });
      setTimeout(speakNow, 400); // fallback if the event never fires
    }

    // Safety: if onend never fires (autoplay blocked), proceed anyway.
    const words = text.split(/\s+/).length;
    const fallbackMs = Math.max(3500, words * 480) + 1800;
    const fallback = setTimeout(finish, fallbackMs);

    return () => {
      clearTimeout(fallback);
      try {
        synth.cancel();
      } catch {
        // ignore
      }
      setSpeaking(false);
    };
  }, [text, autoSpeak]);

  const active = speaking || listening;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-36 w-36">
        {/* Pulsing rings while active */}
        {active && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20" />
            <span
              className="absolute inset-2 animate-ping rounded-full bg-violet-500/20"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}

        {/* Gradient frame */}
        <div
          className={`animate-float relative h-36 w-36 rounded-full bg-gradient-to-br from-indigo-400 via-violet-400 to-fuchsia-400 p-[3px] shadow-2xl transition-all ${
            speaking
              ? "shadow-indigo-500/50"
              : listening
              ? "shadow-emerald-500/50"
              : "shadow-indigo-500/30"
          }`}
        >
          <div className="h-full w-full overflow-hidden rounded-full">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3730a3" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="jacket" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5cda6" />
                  <stop offset="100%" stopColor="#e7b189" />
                </linearGradient>
              </defs>

              {/* Backdrop */}
              <rect x="0" y="0" width="200" height="200" fill="url(#bg)" />

              {/* Shoulders / jacket */}
              <path
                d="M28,200 C32,162 68,148 100,148 C132,148 168,162 172,200 Z"
                fill="url(#jacket)"
              />
              {/* Shirt collar */}
              <path d="M84,150 L100,178 L116,150 L108,146 L100,150 L92,146 Z" fill="#e5e7eb" />
              {/* Tie */}
              <path d="M100,156 L94,168 L100,200 L106,168 Z" fill="#6366f1" />

              {/* Neck */}
              <rect x="88" y="126" width="24" height="30" rx="11" fill="url(#skin)" />
              <path d="M88,140 C94,150 106,150 112,140 L112,150 L88,150 Z" fill="#d99e74" opacity="0.5" />

              {/* Ears */}
              <ellipse cx="64" cy="96" rx="7" ry="11" fill="url(#skin)" />
              <ellipse cx="136" cy="96" rx="7" ry="11" fill="url(#skin)" />

              {/* Head */}
              <ellipse cx="100" cy="92" rx="36" ry="42" fill="url(#skin)" />

              {/* Hair */}
              <path
                d="M60,96 C54,46 84,34 100,34 C116,34 146,46 140,96 C136,68 122,56 100,56 C78,56 64,68 60,96 Z"
                fill="#2b2533"
              />
              <path d="M58,96 C56,78 60,66 70,60 C64,72 62,84 64,98 Z" fill="#2b2533" />
              <path d="M142,96 C144,78 140,66 130,60 C136,72 138,84 136,98 Z" fill="#2b2533" />

              {/* Cheeks */}
              <ellipse cx="74" cy="106" rx="6" ry="4" fill="#f0a78a" opacity="0.45" />
              <ellipse cx="126" cy="106" rx="6" ry="4" fill="#f0a78a" opacity="0.45" />

              {/* Eyebrows */}
              <rect x="76" y="80" width="18" height="4.5" rx="2.25" fill="#3a2f2a" />
              <rect x="106" y="80" width="18" height="4.5" rx="2.25" fill="#3a2f2a" />

              {/* Eyes (blink together) */}
              <g className="face-blink">
                <ellipse cx="86" cy="92" rx="9" ry="6" fill="#ffffff" />
                <circle cx="87.5" cy="92" r="4" fill="#5b4636" />
                <circle cx="87.5" cy="92" r="1.9" fill="#160f0a" />
                <circle cx="89" cy="90.5" r="1.2" fill="#ffffff" />
              </g>
              <g className="face-blink">
                <ellipse cx="114" cy="92" rx="9" ry="6" fill="#ffffff" />
                <circle cx="112.5" cy="92" r="4" fill="#5b4636" />
                <circle cx="112.5" cy="92" r="1.9" fill="#160f0a" />
                <circle cx="114" cy="90.5" r="1.2" fill="#ffffff" />
              </g>

              {/* Nose */}
              <path
                d="M100,96 L96,109 Q100,113 104,109"
                stroke="#d9a87f"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Mouth: talking ellipse while speaking, gentle smile otherwise */}
              {speaking ? (
                <g>
                  <ellipse className="face-talk" cx="100" cy="123" rx="9" ry="6" fill="#8a2b2b" />
                  <rect x="93" y="118" width="14" height="2.6" rx="1.3" fill="#ffffff" opacity="0.9" />
                </g>
              ) : (
                <path
                  d="M88,121 Q100,131 112,121"
                  stroke="#a85a48"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
        </div>

        {/* Listening ring accent */}
        {listening && (
          <span className="absolute inset-0 rounded-full ring-2 ring-emerald-400/70" />
        )}
      </div>

      {/* Status label */}
      <div className="text-sm font-medium">
        {speaking ? (
          <span className="text-indigo-300">Speaking…</span>
        ) : listening ? (
          <span className="flex items-center gap-2 text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Listening…
          </span>
        ) : (
          <span className="text-slate-400">AI Examiner</span>
        )}
      </div>
    </div>
  );
}
