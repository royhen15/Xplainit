// Demo question topics. MVP — no DB.
// Each session randomly picks ONE topic, then draws QUESTIONS_PER_TEST
// questions from that topic's pool.
export type Topic = {
  name: string;
  questions: string[];
};

export const TOPICS: Topic[] = [
  {
    name: "LeBron James",
    questions: [
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
    ],
  },
  {
    name: "Basic Coding",
    questions: [
      "In programming, what is a 'variable' used for?",
      "What is the difference between a 'for' loop and a 'while' loop?",
      "What does the acronym 'HTML' stand for?",
      "What two values can a boolean hold?",
      "What is a 'function' in programming, and why is it useful?",
      "What does the term 'bug' mean in software development?",
      "What is an 'array' used for?",
      "What does the acronym 'API' stand for?",
      "What is the purpose of an 'if' statement?",
      "What does it mean to 'debug' a program?",
      "In JavaScript, what is the difference between '==' and '==='?",
      "What is the difference between a programming language's syntax and its logic?",
    ],
  },
  {
    name: "Basic Culinary",
    questions: [
      "What does it mean to 'sauté' an ingredient?",
      "At what temperature does water boil at sea level, in degrees Celsius?",
      "What does it mean to 'preheat' an oven?",
      "Name a common leavening agent used to make bread rise.",
      "What is the main difference between baking and frying?",
      "What does 'dicing' a vegetable mean?",
      "What is the purpose of marinating meat before cooking?",
      "What does it mean to 'simmer' a sauce?",
      "Name one basic ingredient used to make a simple salad dressing.",
      "What kitchen tool is typically used to measure liquid ingredients?",
      "What does it mean to 'season' a dish?",
      "What is the difference between boiling and steaming food?",
    ],
  },
];

export const QUESTIONS_PER_TEST = 3;

// A single test session: the chosen topic plus the questions for it.
export type Session = {
  topic: string;
  questions: string[];
};

// Picks one random topic, then `count` random questions from that topic.
export function pickSession(count: number = QUESTIONS_PER_TEST): Session {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const shuffled = [...topic.questions].sort(() => Math.random() - 0.5);
  return {
    topic: topic.name,
    questions: shuffled.slice(0, Math.min(count, topic.questions.length)),
  };
}
