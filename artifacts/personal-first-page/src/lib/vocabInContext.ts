export type VICDifficulty = 'Foundation' | 'Current' | 'Target' | 'Challenge';

export type VICItem = {
  id: string;
  type: string;
  difficulty: VICDifficulty;
  sentence: string;
  answer: string;
  acceptedAnswers: string[];
  chineseMeaning: string;
  explanation: string;
  source: string;
  officialItem: boolean;
  reviewStatus: string;
};

export type VICAnswerResult = {
  itemId: string;
  userInput: string;
  correct: boolean;
};

const BLANK_MARKER = '_____';

export function splitSentenceAtBlank(sentence: string): [string, string] {
  const index = sentence.indexOf(BLANK_MARKER);
  if (index === -1) return [sentence, ''];
  return [sentence.slice(0, index), sentence.slice(index + BLANK_MARKER.length)];
}

export function checkVICAnswer(userInput: string, acceptedAnswers: string[]): boolean {
  const normalized = userInput.trim().toLowerCase();
  return acceptedAnswers.some((accepted) => accepted.trim().toLowerCase() === normalized);
}
