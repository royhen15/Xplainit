import { NextResponse } from "next/server";
import type { EvaluationResult } from "@/lib/evaluate";

// Examiner prompt — {{answers}} is replaced with the student's answers.
const EXAMINER_PROMPT = `You are an examiner. Evaluate the student's answers on correctness and clarity. Return ONLY JSON: { "score": number 0-100, "explanation": string of 2-3 sentences }. Answers: {{answers}}`;

// Defensively turn the model's text content into a valid EvaluationResult.
// Returns null if anything is missing or malformed.
function parseEvaluation(content: unknown): EvaluationResult | null {
  if (typeof content !== "string") return null;
  try {
    const parsed = JSON.parse(content) as {
      score?: unknown;
      explanation?: unknown;
    };
    const score = Number(parsed.score);
    const explanation = parsed.explanation;
    if (!Number.isFinite(score) || typeof explanation !== "string") {
      return null;
    }
    return {
      score: Math.max(0, Math.min(100, Math.round(score))), // clamp 0-100
      explanation,
    };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // Key lives ONLY on the server, read from the environment.
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  // Parse and validate the incoming answers.
  let answers: string[];
  try {
    const body = (await req.json()) as { answers?: unknown };
    answers = Array.isArray(body.answers) ? body.answers.map(String) : [];
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const answersText = answers
    .map((a, i) => `Q${i + 1}: ${a.trim() || "(no answer)"}`)
    .join("\n");
  const prompt = EXAMINER_PROMPT.replace("{{answers}}", answersText);

  // Call OpenAI. response_format forces syntactically valid JSON.
  let openaiRes: Response;
  try {
    openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the evaluation service." },
      { status: 502 }
    );
  }

  if (!openaiRes.ok) {
    return NextResponse.json(
      { error: "Evaluation service returned an error." },
      { status: 502 }
    );
  }

  // Pull the model's text and parse it defensively.
  let content: unknown;
  try {
    const completion = (await openaiRes.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    content = completion.choices?.[0]?.message?.content;
  } catch {
    content = null;
  }

  const result = parseEvaluation(content);
  if (!result) {
    return NextResponse.json(
      { error: "Could not parse the evaluation result." },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
