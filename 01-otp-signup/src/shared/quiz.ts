// The questions and the scoring live here so the client and the server agree on them.

export type Race = 'elf' | 'dwarf' | 'man';
export type Scores = Record<Race, number>;
export type AnswerValue = string | number;
export type Answers = Record<string, AnswerValue>;

interface BaseQuestion {
  id: string;
  prompt: string;
  hint?: string;
}

export interface NumberQuestion extends BaseQuestion {
  kind: 'number';
  min: number;
  max: number;
  score: (value: number) => Partial<Scores>;
}

export interface ChoiceQuestion extends BaseQuestion {
  kind: 'choice';
  options: { value: string; label: string; race: Race }[];
}

export interface RangeQuestion extends BaseQuestion {
  kind: 'range';
  min: number;
  max: number;
  initial: number;
  minLabel: string;
  maxLabel: string;
  score: (value: number) => Partial<Scores>;
}

export interface TextQuestion extends BaseQuestion {
  kind: 'text';
  maxLength: number;
  placeholder?: string;
  score: (value: string) => Partial<Scores>;
}

export type Question = NumberQuestion | ChoiceQuestion | RangeQuestion | TextQuestion;

export const QUESTIONS: Question[] = [
  {
    id: 'age',
    kind: 'number',
    prompt: 'How old are you?',
    hint: 'In years. Be honest, the Elves will know.',
    min: 1,
    max: 20000,
    score: (age) => {
      if (age < 120) return { man: 2 };
      if (age <= 450) return { dwarf: 2 };
      return { elf: 2 };
    },
  },
  {
    id: 'trees',
    kind: 'choice',
    prompt: 'How much do you like trees?',
    options: [
      { value: 'chop', label: 'I like to chop them down.', race: 'dwarf' },
      { value: 'essence', label: 'They are the essence of the world.', race: 'elf' },
      { value: 'fences', label: "They're fine. Good for fences, and for hiding behind.", race: 'man' },
    ],
  },
  {
    id: 'power',
    kind: 'range',
    prompt: 'How much do you desire power?',
    hint: 'Nine rings were given to Men, who above all else desire power. No pressure.',
    min: 1,
    max: 10,
    initial: 5,
    minLabel: 'Not one bit',
    maxLabel: 'Give me the ring',
    score: (power) => {
      if (power <= 3) return { elf: 2 };
      if (power <= 7) return { dwarf: 2 };
      return { man: 2 };
    },
  },
  {
    id: 'mountain',
    kind: 'text',
    prompt: 'I say mountain, you say…',
    hint: 'First word that comes to mind.',
    maxLength: 40,
    placeholder: 'Your answer',
    score: (answer) => {
      const word = answer.trim().toLowerCase();
      if (word.includes('under') || word.includes('lonely')) return { dwarf: 2 };
      if (word.includes('doom')) return { man: 2 };
      // Anything else is the sort of thing an Elf would say.
      return { elf: 2 };
    },
  },
  {
    id: 'weapon',
    kind: 'choice',
    prompt: 'Sword, bow or axe?',
    options: [
      { value: 'sword', label: 'Sword', race: 'man' },
      { value: 'bow', label: 'Bow', race: 'elf' },
      { value: 'axe', label: 'Axe', race: 'dwarf' },
    ],
  },
  {
    id: 'beards',
    kind: 'choice',
    prompt: 'How do you feel about beards?',
    options: [
      { value: 'essential', label: 'Essential. Braided, ideally.', race: 'dwarf' },
      { value: 'optional', label: 'Optional. Depends on the week.', race: 'man' },
      { value: 'unknown', label: 'What is a beard?', race: 'elf' },
    ],
  },
];

/** Returns an error message, or null if the answer is fine. */
export function validateAnswer(question: Question, value: AnswerValue | undefined): string | null {
  switch (question.kind) {
    case 'number':
    case 'range': {
      if (value === undefined || value === '') return 'The scroll needs an answer.';
      const n = Number(value);
      if (!Number.isInteger(n)) return 'Whole numbers only, please.';
      if (n < question.min || n > question.max) {
        return `Pick a number between ${question.min} and ${question.max}.`;
      }
      return null;
    }
    case 'choice': {
      if (value === undefined || value === '') return 'Choose one.';
      return question.options.some((o) => o.value === value) ? null : 'That is not one of the options.';
    }
    case 'text': {
      if (typeof value !== 'string' || value.trim() === '') return 'The scroll needs an answer.';
      if (value.length > question.maxLength) return `Keep it under ${question.maxLength} characters.`;
      return null;
    }
  }
}

export function validateAnswers(answers: unknown): { field: string; message: string }[] {
  if (typeof answers !== 'object' || answers === null) {
    return [{ field: 'answers', message: 'Answers are missing.' }];
  }
  const given = answers as Record<string, AnswerValue | undefined>;
  return QUESTIONS.flatMap((q) => {
    const message = validateAnswer(q, given[q.id]);
    return message ? [{ field: q.id, message }] : [];
  });
}

/** Assumes the answers have already passed validateAnswers. */
export function scoreAnswers(answers: Answers): { race: Race; scores: Scores } {
  const scores: Scores = { elf: 0, dwarf: 0, man: 0 };
  for (const q of QUESTIONS) {
    const value = answers[q.id];
    let points: Partial<Scores>;
    if (q.kind === 'choice') {
      const race = q.options.find((o) => o.value === value)!.race;
      points = { [race]: 2 };
    } else if (q.kind === 'text') {
      points = q.score(String(value));
    } else {
      points = q.score(Number(value));
    }
    for (const [race, n] of Object.entries(points) as [Race, number][]) scores[race] += n;
  }

  const top = Math.max(...Object.values(scores));
  const leaders = (Object.keys(scores) as Race[]).filter((r) => scores[r] === top);
  if (leaders.length === 1) return { race: leaders[0], scores };

  // On a tie the weapon decides. You can tell a lot about someone from what they carry.
  const weapon = QUESTIONS.find((q) => q.id === 'weapon') as ChoiceQuestion;
  const weaponRace = weapon.options.find((o) => o.value === answers.weapon)!.race;
  return { race: leaders.includes(weaponRace) ? weaponRace : leaders[0], scores };
}
