"use client";

import { useEffect, useRef, useState } from "react";

// Minimal shape of the bits of the Web Speech API we actually use.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type SpeechResultEvent = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

// Wraps the Web Speech API with continuous capture that auto-restarts when
// Chrome stops it on silence — so a single answer keeps accumulating until
// stop() is called. isSupported: null = checking, true/false = definitive.
export function useSpeech() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(""); // finalized text
  const [interim, setInterim] = useState(""); // in-progress words

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef(""); // accumulates final results across restarts
  const shouldListenRef = useRef(false); // desired listening state

  useEffect(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;

    if (!SR) {
      setIsSupported(false);
      return;
    }
    setIsSupported(true);

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalRef.current += result[0].transcript.trim() + " ";
        } else {
          interimText += result[0].transcript;
        }
      }
      setTranscript(finalRef.current.trim());
      setInterim(interimText.trim());
    };

    // Chrome ends the session on silence. If we still want to listen, restart.
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          // start() can throw if it's mid-teardown — ignore.
        }
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event) => {
      // Permission problems are terminal; stop trying to restart.
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
      }
      // Other errors (e.g. "no-speech") are followed by onend, which restarts.
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      try {
        recognition.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  // Begin a fresh capture for the current question.
  function start() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    finalRef.current = "";
    setTranscript("");
    setInterim("");
    shouldListenRef.current = true;
    try {
      recognition.start();
    } catch {
      // Already running — fine.
    }
    setIsListening(true);
  }

  // Stop capturing for good (until the next start()).
  function stop() {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    shouldListenRef.current = false;
    try {
      recognition.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }

  // Clear the transcript without touching the session.
  function reset() {
    finalRef.current = "";
    setTranscript("");
    setInterim("");
  }

  return { isSupported, isListening, transcript, interim, start, stop, reset };
}
