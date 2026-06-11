// Pool of demo questions (LeBron James). MVP — no DB.
// Each test randomly draws QUESTIONS_PER_TEST of these.
export const QUESTION_POOL: string[] = [
  "Which NBA team did LeBron James get drafted to in 2003?",
  "Name one team LeBron has won an NBA championship with.",
  "What position does LeBron James primarily play?",
  "Which high school did LeBron James attend in Akron, Ohio?",
  "How many NBA championships has LeBron James won in total?",
  "In what year did LeBron James first join the Los Angeles Lakers?",
  "What is LeBron James's well-known nickname, often shortened to 'King'?",
  "Which franchise did LeBron return to in 2014 after his years in Miami?",
  "LeBron became the NBA's all-time leading scorer in 2023 — whose record did he pass?",
  "Which college did LeBron James attend before going pro?",
  "How many times has LeBron James been named NBA Finals MVP?",
  "With which teammate did LeBron form a famous duo during his Miami Heat years?",
];

export const QUESTIONS_PER_TEST = 3;

// Returns `count` questions chosen at random from the pool.
export function pickQuestions(count: number = QUESTIONS_PER_TEST): string[] {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
