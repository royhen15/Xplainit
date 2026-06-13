"use client";

import { useEffect, useState } from "react";
import { pickSession, QUESTIONS_PER_TEST } from "@/lib/questions";

// Owns the test flow: which topic this session is on, which question we're on,
// and the answer for each one. A topic + its questions are drawn at random on
// the client (after mount) to avoid a server/client hydration mismatch.
export function useTest() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  useEffect(() => {
    const session = pickSession(QUESTIONS_PER_TEST);
    setTopic(session.topic);
    setQuestions(session.questions);
    setAnswers(session.questions.map(() => ""));
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

  // Start over with a fresh random topic and set of questions.
  function reset() {
    const session = pickSession(QUESTIONS_PER_TEST);
    setTopic(session.topic);
    setQuestions(session.questions);
    setAnswers(session.questions.map(() => ""));
    setCurrentIndex(0);
  }

  return {
    topic,
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
