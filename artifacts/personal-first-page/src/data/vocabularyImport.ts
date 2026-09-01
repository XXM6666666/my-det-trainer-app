export const VOCABULARY_DIFFICULTIES = [
  'Foundation',
  'Current',
  'Target',
  'Challenge',
] as const;

export type VocabularyDifficulty = (typeof VOCABULARY_DIFFICULTIES)[number];

export type ImportVocabularyItem = {
  word: string;
  real: boolean;
  difficulty: VocabularyDifficulty;
  chineseMeaning?: string;
  simpleDefinition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  confusedWith?: string | {
    word: string;
    chineseMeaning: string;
  };
  source: string;
  verified: boolean;
};

export type VocabularyValidationIssue = {
  index: number;
  word?: string;
  errors: string[];
};

export type VocabularyBankSummary = {
  total: number;
  verifiedTrue: number;
  verifiedFalse: number;
  byDifficulty: Record<VocabularyDifficulty, number>;
  real: number;
  fake: number;
};

export type VocabularyImportPreparation = {
  validItems: ImportVocabularyItem[];
  newItems: ImportVocabularyItem[];
  replacements: ImportVocabularyItem[];
  duplicateWords: string[];
  issues: VocabularyValidationIssue[];
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isDifficulty = (value: unknown): value is VocabularyDifficulty =>
  typeof value === 'string' &&
  VOCABULARY_DIFFICULTIES.includes(value as VocabularyDifficulty);

const normalizeWord = (word: string) => word.trim().toLocaleLowerCase();

function validateItem(value: unknown, index: number): VocabularyValidationIssue | null {
  const item = value as Record<string, unknown> | null;
  const errors: string[] = [];

  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { index, errors: ['item must be an object'] };
  }

  if (!isNonEmptyString(item.word)) errors.push('word is required');
  if (typeof item.real !== 'boolean') errors.push('real must be a boolean');
  if (!isDifficulty(item.difficulty)) {
    errors.push('difficulty must be Foundation, Current, Target, or Challenge');
  }
  if (!isNonEmptyString(item.source)) errors.push('source is required');
  if (typeof item.verified !== 'boolean') errors.push('verified must be a boolean');

  if (item.real === true) {
    if (!isNonEmptyString(item.chineseMeaning)) errors.push('chineseMeaning is required when real is true');
    if (!isNonEmptyString(item.simpleDefinition)) errors.push('simpleDefinition is required when real is true');
    if (!isNonEmptyString(item.partOfSpeech)) errors.push('partOfSpeech is required when real is true');
    if (!isNonEmptyString(item.exampleSentence)) errors.push('exampleSentence is required when real is true');
  }

  if (item.real === false && item.confusedWith !== undefined) {
    const confusedWith = item.confusedWith;
    const validString = isNonEmptyString(confusedWith);
    const objectValue = confusedWith as Record<string, unknown> | null;
    const validObject =
      objectValue &&
      typeof objectValue === 'object' &&
      !Array.isArray(objectValue) &&
      isNonEmptyString(objectValue.word) &&
      isNonEmptyString(objectValue.chineseMeaning);

    if (!validString && !validObject) {
      errors.push('confusedWith must contain word and chineseMeaning when provided');
    }
  }

  return errors.length > 0
    ? {
        index,
        word: isNonEmptyString(item.word) ? item.word : undefined,
        errors,
      }
    : null;
}

export function prepareVocabularyImport(
  currentBank: readonly ImportVocabularyItem[],
  incoming: unknown,
): VocabularyImportPreparation {
  if (!Array.isArray(incoming)) {
    return {
      validItems: [],
      newItems: [],
      replacements: [],
      duplicateWords: [],
      issues: [{ index: -1, errors: ['the import file must contain a JSON array'] }],
    };
  }

  const issues = incoming
    .map((item, index) => validateItem(item, index))
    .filter((issue): issue is VocabularyValidationIssue => issue !== null);
  const invalidIndexes = new Set(issues.map((issue) => issue.index));
  const validItems = incoming.filter((_, index) => !invalidIndexes.has(index)) as ImportVocabularyItem[];

  const knownWords = new Set(currentBank.map((item) => normalizeWord(item.word)));
  const batchWords = new Set<string>();
  const currentByWord = new Map(currentBank.map((item) => [normalizeWord(item.word), item]));
  const replacements: ImportVocabularyItem[] = [];
  const duplicateWords: string[] = [];
  const newItems: ImportVocabularyItem[] = [];

  for (const item of validItems) {
    const normalizedWord = normalizeWord(item.word);
    if (batchWords.has(normalizedWord)) {
      duplicateWords.push(item.word);
      continue;
    }
    batchWords.add(normalizedWord);

    const existing = currentByWord.get(normalizedWord);
    if (existing?.verified === false && item.verified === true) {
      replacements.push(item);
    } else if (knownWords.has(normalizedWord)) {
      duplicateWords.push(item.word);
    } else {
      newItems.push(item);
    }
  }

  return { validItems, newItems, replacements, duplicateWords, issues };
}

export function summarizeVocabularyBank(items: readonly ImportVocabularyItem[]): VocabularyBankSummary {
  const byDifficulty = Object.fromEntries(
    VOCABULARY_DIFFICULTIES.map((difficulty) => [difficulty, 0]),
  ) as Record<VocabularyDifficulty, number>;

  for (const item of items) {
    byDifficulty[item.difficulty] += 1;
  }

  return {
    total: items.length,
    verifiedTrue: items.filter((item) => item.verified === true).length,
    verifiedFalse: items.filter((item) => item.verified === false).length,
    byDifficulty,
    real: items.filter((item) => item.real === true).length,
    fake: items.filter((item) => item.real === false).length,
  };
}