export type CTestDifficulty = 'Foundation' | 'Current' | 'Target' | 'Challenge';

export type CTestAnswer = {
  full: string;
  shown: string;
  missing: string;
  sentenceIndex: number;
};

export type CTestItem = {
  id: string;
  type: string;
  difficulty: CTestDifficulty;
  domain: string;
  fullText: string;
  promptText: string;
  answers: CTestAnswer[];
  source: string;
  officialItem: boolean;
  reviewStatus: string;
};

export type CTestBlankResult = {
  passageId: string;
  full: string;
  missing: string;
  userInput: string;
  correct: boolean;
};

export type CTestPromptSegment =
  | { type: 'text'; value: string }
  | { type: 'blank'; blankIndex: number; length: number };

export function parseCTestPromptSegments(promptText: string): CTestPromptSegment[] {
  const segments: CTestPromptSegment[] = [];
  const regex = /_+/g;
  let lastIndex = 0;
  let blankIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(promptText))) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: promptText.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'blank', blankIndex, length: match[0].length });
    blankIndex += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < promptText.length) {
    segments.push({ type: 'text', value: promptText.slice(lastIndex) });
  }

  return segments;
}

export function checkCTestAnswer(userInput: string, missing: string): boolean {
  return userInput.trim().toLowerCase() === missing.trim().toLowerCase();
}
