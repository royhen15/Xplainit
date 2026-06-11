// Shape of a successful evaluation.
export type EvaluationResult = {
  score: number; // 0-100
  explanation: string; // 2-3 sentences
};

// Client-side helper: POSTs the answers to our own server route, which holds
// the OpenAI key. Throws on any failure so the caller can show an error state.
export async function evaluateAnswers(
  answers: string[]
): Promise<EvaluationResult> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  });

  if (!res.ok) {
    throw new Error(`Evaluation failed (status ${res.status})`);
  }

  const data = (await res.json()) as EvaluationResult;
  return data;
}
