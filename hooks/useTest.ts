"use client";

import { useEffect, useState } from "react";
import { pickQuestions, QUESTIONS_PER_TEST } from "@/lib/questions";

// Owns the test flow: which question we're on and the answer for each one.
// Questions are drawn at random from the pool on the client (after mount) to
// avoid a server/client hydration mismatch.
export function useTest() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    const picked = pickQuestions(QUESTIONS_PER_TEST);
    setQuestions(picked);
    setAnswers(picked.map(() => ""));
  }, []);

  const ready = questions.length > 0;
  const currentQuestion = questions[currentIndex] ?? "";
  const isLast = ready && currentIndex === questions.length - 1;
  const isFinished = ready && currentIndex >= questions.length;

  // Set the answer for the question currently on screen.
  function setAnswer(text: string) {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentIndex] = text;
      return copy;
    });
  }

  // Advance to the next question (or past the end -> finished).
  function next() {
    setCurrentIndex((i) => i + 1);
  }

  // Start over with a fresh random set of questions.
  function reset() {
    const picked = pickQuestions(QUESTIONS_PER_TEST);
    setQuestions(picked);
    setAnswers(picked.map(() => ""));
    setCurrentIndex(0);
  }

  return {
    questions,
    total: questions.length,
    ready,
    currentIndex,
    currentQuestion,
    answers,
    isLast,
    isFinished,
    setAnswer,
    next,
    reset,
  };
}
