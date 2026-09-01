export type HistoryDifficulty = 'Foundation' | 'Current' | 'Target' | 'Challenge';

const HISTORY_DIFFICULTIES: HistoryDifficulty[] = ['Foundation', 'Current', 'Target', 'Challenge'];

export type DifficultyStats = {
  correct: number;
  total: number;
};

export type HistoryMistake = {
  word: string;
  real: boolean;
  chineseMeaning?: string;
};

export type HistoryRecord = {
  id: string;
  completedAt: string;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  byDifficulty: Record<HistoryDifficulty, DifficultyStats>;
  mistakes: HistoryMistake[];
};

export type HistoryAnswerLike = {
  item: {
    word: string;
    real: boolean;
    difficulty: HistoryDifficulty;
    chineseMeaning?: string;
  };
  correct: boolean;
};

export type OverallHistoryStats = {
  totalRounds: number;
  totalQuestions: number;
  recentAverageAccuracy: number;
};

const STORAGE_KEY = 'det-trainer-history-v1';
const MAX_STORED_RECORDS = 300;
const RECENT_WINDOW = 10;

function emptyDifficultyStats(): Record<HistoryDifficulty, DifficultyStats> {
  const stats = {} as Record<HistoryDifficulty, DifficultyStats>;
  for (const difficulty of HISTORY_DIFFICULTIES) {
    stats[difficulty] = { correct: 0, total: 0 };
  }
  return stats;
}

function isHistoryRecord(value: unknown): value is HistoryRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.correctCount === 'number' &&
    typeof record.incorrectCount === 'number' &&
    typeof record.accuracy === 'number' &&
    typeof record.byDifficulty === 'object' &&
    record.byDifficulty !== null &&
    Array.isArray(record.mistakes)
  );
}

export function loadHistory(): HistoryRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isHistoryRecord);
  } catch {
    return [];
  }
}

export function buildHistoryRecord(answers: HistoryAnswerLike[]): HistoryRecord {
  const correctCount = answers.filter((answer) => answer.correct).length;
  const incorrectCount = answers.length - correctCount;
  const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;
  const byDifficulty = emptyDifficultyStats();

  for (const answer of answers) {
    const stats = byDifficulty[answer.item.difficulty];
    stats.total += 1;
    if (answer.correct) stats.correct += 1;
  }

  const mistakes: HistoryMistake[] = answers
    .filter((answer) => !answer.correct)
    .map((answer) => ({
      word: answer.item.word,
      real: answer.item.real,
      chineseMeaning: answer.item.chineseMeaning,
    }));

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
    correctCount,
    incorrectCount,
    accuracy,
    byDifficulty,
    mistakes,
  };
}

export function saveHistoryRecord(record: HistoryRecord): HistoryRecord[] {
  const next = [record, ...loadHistory()].slice(0, MAX_STORED_RECORDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (e.g. private browsing quota) — keep training usable without history.
  }
  return next;
}

export function getOverallStats(records: HistoryRecord[]): OverallHistoryStats {
  const totalRounds = records.length;
  const totalQuestions = records.reduce((sum, record) => sum + record.correctCount + record.incorrectCount, 0);
  const recent = records.slice(0, RECENT_WINDOW);
  const recentAverageAccuracy = recent.length
    ? Math.round(recent.reduce((sum, record) => sum + record.accuracy, 0) / recent.length)
    : 0;

  return { totalRounds, totalQuestions, recentAverageAccuracy };
}

export function difficultyAccuracy(stats: DifficultyStats): number {
  return stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
}

export type MistakeWordEntry = {
  word: string;
  real: boolean;
  chineseMeaning?: string;
};

const MISTAKE_WORDS_STORAGE_KEY = 'det-trainer-mistake-words-v1';

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

function isMistakeWordEntry(value: unknown): value is MistakeWordEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.word === 'string' && typeof entry.real === 'boolean';
}

export function loadMistakeWords(): MistakeWordEntry[] {
  try {
    const raw = window.localStorage.getItem(MISTAKE_WORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isMistakeWordEntry);
  } catch {
    return [];
  }
}

export function recordMistakeWords(mistakes: HistoryMistake[]): MistakeWordEntry[] {
  const existing = loadMistakeWords();
  const known = new Set(existing.map((entry) => normalizeWord(entry.word)));
  const additions: MistakeWordEntry[] = [];

  for (const mistake of mistakes) {
    const key = normalizeWord(mistake.word);
    if (known.has(key)) continue;
    known.add(key);
    additions.push({ word: mistake.word, real: mistake.real, chineseMeaning: mistake.chineseMeaning });
  }

  if (additions.length === 0) return existing;

  const next = [...existing, ...additions];
  try {
    window.localStorage.setItem(MISTAKE_WORDS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — keep training usable without the mistake registry.
  }
  return next;
}

export { HISTORY_DIFFICULTIES };
