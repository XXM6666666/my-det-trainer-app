import { useState } from 'react';
import { Route, Router as WouterRouter } from 'wouter';
import rawVocabularyBank from './data/vocabularyBank.json';
import {
  buildHistoryRecord,
  difficultyAccuracy,
  getOverallStats,
  loadHistory,
  loadMistakeWords,
  recordMistakeWords,
  saveHistoryRecord,
  HISTORY_DIFFICULTIES,
  type HistoryRecord,
  type MistakeWordEntry,
} from './lib/history';
import { speakWord } from './lib/speech';

type Difficulty = 'Foundation' | 'Current' | 'Target' | 'Challenge';

type VocabularyItem = {
  word: string;
  real: boolean;
  chineseMeaning?: string;
  simpleDefinition?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  difficulty: Difficulty;
  confusedWith?: string | {
    word: string;
    chineseMeaning: string;
  };
  source: string;
  verified: boolean;
};

type AnswerRecord = {
  item: VocabularyItem;
  answer: boolean;
  correct: boolean;
};

type Screen = 'home' | 'practice' | 'results' | 'history';
type RoundMode = 'new' | 'mistakes';

const DEFAULT_ROUND_QUOTAS: Record<Difficulty, number> = {
  Foundation: 4,
  Current: 8,
  Target: 6,
  Challenge: 2,
};

const HISTORICAL_MISTAKES_ROUND_SIZE = 20;

// Prepared for a future review algorithm. The current round always uses
// DEFAULT_ROUND_QUOTAS; these counters do not alter selection yet.
type PerformanceProfile = Record<Difficulty, {
  answered: number;
  correct: number;
  streak: number;
}>;

const INITIAL_PERFORMANCE_PROFILE: PerformanceProfile = {
  Foundation: { answered: 0, correct: 0, streak: 0 },
  Current: { answered: 0, correct: 0, streak: 0 },
  Target: { answered: 0, correct: 0, streak: 0 },
  Challenge: { answered: 0, correct: 0, streak: 0 },
};

const VOCABULARY_BANK = rawVocabularyBank as VocabularyItem[];
const VERIFIED_VOCABULARY_BANK = VOCABULARY_BANK.filter((item) => item.verified);

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createNewRound(): VocabularyItem[] {
  const difficulties = Object.keys(DEFAULT_ROUND_QUOTAS) as Difficulty[];
  const targetRealCount = 8 + Math.floor(Math.random() * 5);
  const availableRealCounts = difficulties.map((difficulty) => {
    const items = VERIFIED_VOCABULARY_BANK.filter((item) => item.difficulty === difficulty);
    const realCount = items.filter((item) => item.real).length;
    const fakeCount = items.length - realCount;
    const quota = DEFAULT_ROUND_QUOTAS[difficulty];

    return {
      difficulty,
      min: Math.max(0, quota - fakeCount),
      max: Math.min(quota, realCount),
    };
  });

  const possibleCounts: Record<Difficulty, number>[] = [];
  const findCounts = (index: number, counts: Partial<Record<Difficulty, number>>, total: number) => {
    if (index === availableRealCounts.length) {
      if (total === targetRealCount) {
        possibleCounts.push(counts as Record<Difficulty, number>);
      }
      return;
    }

    const { difficulty, min, max } = availableRealCounts[index];
    for (let count = min; count <= max; count += 1) {
      if (total + count <= targetRealCount) {
        findCounts(index + 1, { ...counts, [difficulty]: count }, total + count);
      }
    }
  };

  findCounts(0, {}, 0);
  if (possibleCounts.length === 0) {
    throw new Error('The vocabulary bank cannot support an 8–12 real-word round.');
  }

  const realCounts = possibleCounts[Math.floor(Math.random() * possibleCounts.length)];
  const round = difficulties.flatMap((difficulty) => {
    const quota = DEFAULT_ROUND_QUOTAS[difficulty];
    const realItems = shuffle(VERIFIED_VOCABULARY_BANK.filter((item) => item.difficulty === difficulty && item.real))
      .slice(0, realCounts[difficulty]);
    const fakeItems = shuffle(VERIFIED_VOCABULARY_BANK.filter((item) => item.difficulty === difficulty && !item.real))
      .slice(0, quota - realCounts[difficulty]);

    return [...realItems, ...fakeItems];
  });

  return shuffle(round);
}

function Brand() {
  return (
    <div className="brand-lockup" aria-label="My DET Trainer">
      <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="brand-name">MY DET TRAINER</span>
    </div>
  );
}

function Home({
  onStart,
  onViewHistory,
  onPracticeMistakes,
  hasVerifiedQuestions,
  hasMistakeWords,
}: {
  onStart: () => void;
  onViewHistory: () => void;
  onPracticeMistakes: () => void;
  hasVerifiedQuestions: boolean;
  hasMistakeWords: boolean;
}) {
  return (
    <main className="page-shell home-page">
      <div className="ambient-mark ambient-mark-left" aria-hidden="true" />
      <div className="ambient-mark ambient-mark-right" aria-hidden="true" />
      <section className="home-card" aria-labelledby="app-title">
        <Brand />
        <div className="home-copy">
          <p className="eyebrow">A small study desk for today</p>
          <h1 id="app-title">My DET Trainer</h1>
          <p className="home-description">Twenty focused word checks. Take a breath, trust your instincts, and build a steadier vocabulary.</p>
        </div>
        <button className="primary-button start-button" type="button" onClick={onStart} data-testid="button-start-training">
          开始单词训练
        </button>
        <button className="secondary-button history-entry-button" type="button" onClick={onViewHistory} data-testid="button-view-history">
          训练记录 / History
        </button>
        <button
          className="secondary-button history-entry-button"
          type="button"
          onClick={onPracticeMistakes}
          disabled={!hasMistakeWords}
          data-testid="button-practice-my-mistakes"
        >
          Practice My Mistakes
        </button>
        {!hasVerifiedQuestions && (
          <p className="bank-status" role="status">正式题库正在建设中</p>
        )}
        <p className="material-note">Original practice material, not official DET questions.</p>
      </section>
      <p className="home-footer">One round at a time.</p>
    </main>
  );
}

function PronunciationButtons({ word }: { word: string }) {
  return (
    <div className="pronunciation-buttons" role="group" aria-label={`Pronounce ${word}`}>
      <button
        type="button"
        className="pronounce-button"
        onClick={() => speakWord(word, 'en-US')}
        data-testid={`button-pronounce-us-${word}`}
      >
        🇺🇸 美式发音
      </button>
      <button
        type="button"
        className="pronounce-button"
        onClick={() => speakWord(word, 'en-GB')}
        data-testid={`button-pronounce-gb-${word}`}
      >
        🇬🇧 英式发音
      </button>
    </div>
  );
}

function LearningFeedback({ item }: { item: VocabularyItem }) {
  if (!item.real) {
    const confusedWord = typeof item.confusedWith === 'string'
      ? item.confusedWith
      : item.confusedWith?.word;
    const confusedMeaning = typeof item.confusedWith === 'string'
      ? undefined
      : item.confusedWith?.chineseMeaning;

    return (
      <div className="learning-feedback fake-feedback" data-testid={`feedback-learning-${item.word}`}>
        <p className="feedback-fake-title">Not a real English word</p>
        {item.confusedWith && (
          <div className="confusion-note">
            <p><span className="detail-label">Real word</span><strong>{confusedWord}</strong></p>
            {confusedMeaning && <p><span className="detail-label">Meaning</span>{confusedMeaning}</p>}
            <p><span className="detail-label">Correct spelling</span>{confusedWord}</p>
            {confusedWord && <PronunciationButtons word={confusedWord} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="learning-feedback real-feedback" data-testid={`feedback-learning-${item.word}`}>
      <div className="feedback-word-row">
        <span className="detail-label">Word</span>
        <strong>{item.word}</strong>
      </div>
      <PronunciationButtons word={item.word} />
      <dl className="learning-details">
        <div><dt>Chinese meaning</dt><dd>{item.chineseMeaning}</dd></div>
        <div><dt>Simple explanation</dt><dd>{item.simpleDefinition}</dd></div>
        <div><dt>Part of speech</dt><dd>{item.partOfSpeech}</dd></div>
        <div><dt>Example</dt><dd className="example-text">“{item.exampleSentence}”</dd></div>
      </dl>
    </div>
  );
}

function Practice({
  round,
  currentIndex,
  selectedAnswer,
  onAnswer,
  onNext,
  mode,
}: {
  round: VocabularyItem[];
  currentIndex: number;
  selectedAnswer: boolean | null;
  onAnswer: (answer: boolean) => void;
  onNext: () => void;
  mode: RoundMode;
}) {
  const item = round[currentIndex];
  const answered = selectedAnswer !== null;
  const isCorrect = answered && selectedAnswer === item.real;
  const progress = ((currentIndex + (answered ? 1 : 0)) / round.length) * 100;

  return (
    <main className="page-shell practice-page">
      <header className="practice-header">
        <Brand />
        <div className="question-count" aria-live="polite" data-testid="text-question-count">
          {currentIndex + 1} <span>/</span> {round.length}
        </div>
      </header>
      <div className="progress-track" aria-label={`${currentIndex + 1} of ${round.length} questions`} role="progressbar" aria-valuemin={1} aria-valuemax={round.length} aria-valuenow={currentIndex + 1}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <section className="practice-content" aria-labelledby="word-heading">
        <p className="eyebrow practice-eyebrow">{mode === 'mistakes' ? 'A closer look' : 'Word check'}</p>
        <div className={`word-card ${answered ? (isCorrect ? 'is-correct' : 'is-incorrect') : ''}`}>
          <span className="word-index">WORD {String(currentIndex + 1).padStart(2, '0')}</span>
          <h1 id="word-heading" className="word-display" data-testid="text-current-word">{item.word}</h1>
          <p className="word-prompt">Is this a real English word?</p>
        </div>
        <div className="answer-area">
          <div className="answer-buttons" role="group" aria-label="Choose an answer">
            <button
              className={`answer-button ${answered && selectedAnswer === true ? 'selected' : ''} ${answered && item.real ? 'correct-option' : ''} ${answered && selectedAnswer === true && !item.real ? 'incorrect-option' : ''}`}
              type="button"
              onClick={() => onAnswer(true)}
              disabled={answered}
              data-testid="button-real-word"
            >
              ✅ Real Word
            </button>
            <button
              className={`answer-button ${answered && selectedAnswer === false ? 'selected' : ''} ${answered && !item.real ? 'correct-option' : ''} ${answered && selectedAnswer === false && item.real ? 'incorrect-option' : ''}`}
              type="button"
              onClick={() => onAnswer(false)}
              disabled={answered}
              data-testid="button-not-a-word"
            >
              ❌ Not a Word
            </button>
          </div>
          {answered && (
            <div className={`submitted-feedback ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite" data-testid="status-answer-feedback">
              <strong>{isCorrect ? 'Correct' : 'Incorrect'}</strong>
              <LearningFeedback item={item} />
            </div>
          )}
          <button className={`next-button ${answered ? 'visible' : ''}`} type="button" onClick={onNext} disabled={!answered} data-testid="button-next-question">
            {currentIndex === round.length - 1 ? 'See Results' : 'Next Question'}
          </button>
        </div>
      </section>
    </main>
  );
}

function Results({
  answers,
  onMistakes,
  onNewRound,
}: {
  answers: AnswerRecord[];
  onMistakes: () => void;
  onNewRound: () => void;
}) {
  const correctCount = answers.filter((answer) => answer.correct).length;
  const incorrectAnswers = answers.filter((answer) => !answer.correct);
  const accuracy = answers.length ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <main className="page-shell results-page">
      <header className="practice-header results-header">
        <Brand />
        <span className="results-label">ROUND COMPLETE</span>
      </header>
      <section className="results-content" aria-labelledby="results-heading">
        <div className="results-intro">
          <p className="eyebrow">Your practice, in view</p>
          <h1 id="results-heading">Round results</h1>
          <p>{incorrectAnswers.length === 0 ? 'Review the details below, then choose your next round.' : 'Review each missed word while it is still fresh.'}</p>
        </div>
        <div className="score-grid" aria-label="Round score">
          <div className="score-card score-card-primary">
            <span className="score-label">Accuracy</span>
            <strong data-testid="text-accuracy">{accuracy}%</strong>
          </div>
          <div className="score-card">
            <span className="score-label">Correct</span>
            <strong data-testid="text-correct-count">{correctCount}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">Incorrect</span>
            <strong data-testid="text-incorrect-count">{incorrectAnswers.length}</strong>
          </div>
        </div>
        <section className="mistakes-section" aria-labelledby="mistakes-heading">
          <div className="section-heading">
            <h2 id="mistakes-heading">Words to revisit</h2>
            <span>{incorrectAnswers.length}</span>
          </div>
          {incorrectAnswers.length > 0 ? (
            <div className="mistake-review-list" data-testid="list-mistakes">
              {incorrectAnswers.map((answer, index) => (
                <article className="mistake-review" key={`${answer.item.word}-${index}`} data-testid={`text-mistake-${index}`}>
                  <div className="mistake-review-heading">
                    <span className="mistake-number">{String(index + 1).padStart(2, '0')}</span>
                    <h3>{answer.item.word}</h3>
                    <span className="missed-label">Missed</span>
                  </div>
                  <LearningFeedback item={answer.item} />
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-mistakes" data-testid="text-no-mistakes">Nothing to revisit from this round.</p>
          )}
        </section>
        <div className="results-actions">
          <button className="primary-button" type="button" onClick={onNewRound} data-testid="button-start-new-round">Start New Round</button>
          <button className="secondary-button" type="button" onClick={onMistakes} disabled={incorrectAnswers.length === 0} data-testid="button-practice-mistakes">Practice Mistakes Again</button>
        </div>
        <p className="material-note results-note">Original practice material, not official DET questions.</p>
      </section>
    </main>
  );
}

function History({ records, onBack }: { records: HistoryRecord[]; onBack: () => void }) {
  const stats = getOverallStats(records);

  return (
    <main className="page-shell results-page history-page">
      <header className="practice-header results-header">
        <Brand />
        <span className="results-label">TRAINING HISTORY</span>
      </header>
      <section className="results-content history-content" aria-labelledby="history-heading">
        <div className="results-intro">
          <p className="eyebrow">Your practice, over time</p>
          <h1 id="history-heading">训练记录</h1>
          <p>{records.length === 0 ? '还没有完成任何一轮训练。' : '最新一轮在最上面。'}</p>
        </div>
        <div className="score-grid" aria-label="Overall history stats">
          <div className="score-card score-card-primary">
            <span className="score-label">总轮数</span>
            <strong data-testid="text-history-total-rounds">{stats.totalRounds}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">总题数</span>
            <strong data-testid="text-history-total-questions">{stats.totalQuestions}</strong>
          </div>
          <div className="score-card">
            <span className="score-label">近期平均正确率</span>
            <strong data-testid="text-history-recent-accuracy">{stats.recentAverageAccuracy}%</strong>
          </div>
        </div>
        <section className="mistakes-section history-list-section" aria-labelledby="history-list-heading">
          <div className="section-heading">
            <h2 id="history-list-heading">历史轮次</h2>
            <span>{records.length}</span>
          </div>
          {records.length > 0 ? (
            <div className="mistake-review-list" data-testid="list-history">
              {records.map((record, index) => {
                const dateLabel = new Date(record.completedAt).toLocaleString();
                return (
                  <article className="mistake-review history-record" key={record.id} data-testid={`text-history-record-${index}`}>
                    <div className="mistake-review-heading">
                      <span className="mistake-number">{String(records.length - index).padStart(2, '0')}</span>
                      <h3>{dateLabel}</h3>
                      <span className="missed-label history-accuracy">{record.accuracy}%</span>
                    </div>
                    <div className="learning-feedback real-feedback history-record-detail">
                      <dl className="learning-details">
                        <div><dt>Correct / Incorrect</dt><dd>{record.correctCount} / {record.incorrectCount}</dd></div>
                        {HISTORY_DIFFICULTIES.map((difficulty) => (
                          <div key={difficulty}>
                            <dt>{difficulty}</dt>
                            <dd>{difficultyAccuracy(record.byDifficulty[difficulty])}% ({record.byDifficulty[difficulty].correct}/{record.byDifficulty[difficulty].total})</dd>
                          </div>
                        ))}
                        <div>
                          <dt>Mistakes</dt>
                          <dd>{record.mistakes.length === 0 ? '无' : record.mistakes.map((mistake) => mistake.word).join(', ')}</dd>
                        </div>
                      </dl>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="empty-mistakes">完成一轮训练后，记录会显示在这里。</p>
          )}
        </section>
        <div className="results-actions">
          <button className="primary-button" type="button" onClick={onBack} data-testid="button-history-back">返回首页</button>
        </div>
      </section>
    </main>
  );
}

function HomeRoute() {
  const [screen, setScreen] = useState<Screen>('home');
  const [round, setRound] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [roundMode, setRoundMode] = useState<RoundMode>('new');
  const [, setPerformanceProfile] = useState<PerformanceProfile>(INITIAL_PERFORMANCE_PROFILE);
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>(() => loadHistory());
  const [mistakeWords, setMistakeWords] = useState<MistakeWordEntry[]>(() => loadMistakeWords());

  const beginRound = (questions: VocabularyItem[], mode: RoundMode) => {
    setRound(questions);
    setRoundMode(mode);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setScreen('practice');
  };

  const startNewRound = () => beginRound(createNewRound(), 'new');

  const startMistakes = () => {
    const mistakes = answers.filter((answer) => !answer.correct).map((answer) => answer.item);
    if (mistakes.length > 0) beginRound(shuffle(mistakes), 'mistakes');
  };

  const startHistoricalMistakesPractice = () => {
    const pool = loadMistakeWords()
      .map((entry) => VOCABULARY_BANK.find((item) => item.word.toLowerCase() === entry.word.toLowerCase()))
      .filter((item): item is VocabularyItem => Boolean(item));
    if (pool.length === 0) return;
    const selection = pool.length > HISTORICAL_MISTAKES_ROUND_SIZE
      ? shuffle(pool).slice(0, HISTORICAL_MISTAKES_ROUND_SIZE)
      : shuffle(pool);
    beginRound(selection, 'mistakes');
  };

  const handleAnswer = (answer: boolean) => {
    if (selectedAnswer !== null) return;
    const item = round[currentIndex];
    const correct = answer === item.real;
    setSelectedAnswer(answer);
    setAnswers((previous) => [...previous, { item, answer, correct }]);
    setPerformanceProfile((previous) => ({
      ...previous,
      [item.difficulty]: {
        answered: previous[item.difficulty].answered + 1,
        correct: previous[item.difficulty].correct + (correct ? 1 : 0),
        streak: correct ? previous[item.difficulty].streak + 1 : 0,
      },
    }));
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    if (currentIndex === round.length - 1) {
      if (roundMode === 'new') {
        const record = buildHistoryRecord(answers);
        setHistoryRecords(saveHistoryRecord(record));
        setMistakeWords(recordMistakeWords(record.mistakes));
      }
      setScreen('results');
      return;
    }
    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer(null);
  };

  const goHome = () => setScreen('home');
  const viewHistory = () => {
    setHistoryRecords(loadHistory());
    setScreen('history');
  };

  if (screen === 'practice') {
    return <Practice round={round} currentIndex={currentIndex} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} onNext={handleNext} mode={roundMode} />;
  }
  if (screen === 'results') {
    return <Results answers={answers} onMistakes={startMistakes} onNewRound={startNewRound} />;
  }
  if (screen === 'history') {
    return <History records={historyRecords} onBack={goHome} />;
  }
  return (
    <Home
      onStart={startNewRound}
      onViewHistory={viewHistory}
      onPracticeMistakes={startHistoricalMistakesPractice}
      hasVerifiedQuestions={VERIFIED_VOCABULARY_BANK.length > 0}
      hasMistakeWords={mistakeWords.length > 0}
    />
  );
}

function Router() {
  return <Route path="/" component={HomeRoute} />;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;