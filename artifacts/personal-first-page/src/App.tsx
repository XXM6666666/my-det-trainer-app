import { useState } from 'react';
import { Route, Router as WouterRouter } from 'wouter';

type Question = {
  word: string;
  isReal: boolean;
};

type AnswerRecord = {
  question: Question;
  answer: boolean;
  correct: boolean;
};

type Screen = 'home' | 'practice' | 'results';
type RoundMode = 'new' | 'mistakes';

const QUESTION_BANK: Question[] = [
  { word: 'abundant', isReal: true },
  { word: 'acclaim', isReal: true },
  { word: 'adaptable', isReal: true },
  { word: 'adaptrive', isReal: false },
  { word: 'adjacent', isReal: true },
  { word: 'advocate', isReal: true },
  { word: 'alleviate', isReal: true },
  { word: 'ambiguous', isReal: true },
  { word: 'amplify', isReal: true },
  { word: 'analyzation', isReal: false },
  { word: 'anticipate', isReal: true },
  { word: 'appraise', isReal: true },
  { word: 'arbitrary', isReal: true },
  { word: 'articulate', isReal: true },
  { word: 'assimilate', isReal: true },
  { word: 'beneficial', isReal: true },
  { word: 'benevolent', isReal: true },
  { word: 'brevity', isReal: true },
  { word: 'circumvent', isReal: true },
  { word: 'coherent', isReal: true },
  { word: 'comprehend', isReal: true },
  { word: 'conclusive', isReal: true },
  { word: 'constrain', isReal: true },
  { word: 'contemplate', isReal: true },
  { word: 'contradict', isReal: true },
  { word: 'convergent', isReal: true },
  { word: 'correlate', isReal: true },
  { word: 'credibility', isReal: true },
  { word: 'cumulative', isReal: true },
  { word: 'deliberate', isReal: true },
  { word: 'deteriorate', isReal: true },
  { word: 'diminish', isReal: true },
  { word: 'discrepancy', isReal: true },
  { word: 'disparitive', isReal: false },
  { word: 'elaborate', isReal: true },
  { word: 'empirical', isReal: true },
  { word: 'endeavor', isReal: true },
  { word: 'envision', isReal: true },
  { word: 'equitable', isReal: true },
  { word: 'erroneous', isReal: true },
  { word: 'evaluate', isReal: true },
  { word: 'exacerbate', isReal: true },
  { word: 'facilitate', isReal: true },
  { word: 'feasible', isReal: true },
  { word: 'formidable', isReal: true },
  { word: 'frugal', isReal: true },
  { word: 'hinderance', isReal: false },
  { word: 'hypothetical', isReal: true },
  { word: 'illustrate', isReal: true },
  { word: 'impartial', isReal: true },
  { word: 'implicit', isReal: true },
  { word: 'inadvertent', isReal: true },
  { word: 'incisive', isReal: true },
  { word: 'inevitable', isReal: true },
  { word: 'inferential', isReal: true },
  { word: 'innovative', isReal: true },
  { word: 'integrity', isReal: true },
  { word: 'intangible', isReal: true },
  { word: 'intricate', isReal: true },
  { word: 'juxtapose', isReal: true },
  { word: 'legitimate', isReal: true },
  { word: 'meticulous', isReal: true },
  { word: 'mitigate', isReal: true },
  { word: 'nuanced', isReal: true },
  { word: 'obscurative', isReal: false },
  { word: 'obsolete', isReal: true },
  { word: 'paradigm', isReal: true },
  { word: 'pervasive', isReal: true },
  { word: 'plausible', isReal: true },
  { word: 'precedent', isReal: true },
  { word: 'proficient', isReal: true },
  { word: 'proliferate', isReal: true },
  { word: 'reconcile', isReal: true },
  { word: 'refute', isReal: true },
  { word: 'reinforce', isReal: true },
  { word: 'reluctant', isReal: true },
  { word: 'resilient', isReal: true },
  { word: 'rigorous', isReal: true },
  { word: 'scrutinize', isReal: true },
  { word: 'substantiate', isReal: true },
  { word: 'subtle', isReal: true },
  { word: 'sufficive', isReal: false },
  { word: 'synthesize', isReal: true },
  { word: 'transient', isReal: true },
  { word: 'unprecedented', isReal: true },
  { word: 'versatile', isReal: true },
  { word: 'vulnerable', isReal: true },
  { word: 'withstand', isReal: true },
  { word: 'withdrawal', isReal: true },
];

function shuffleQuestions(questions: Question[]) {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createNewRound() {
  return shuffleQuestions(QUESTION_BANK).slice(0, 20);
}

function Home({ onStart }: { onStart: () => void }) {
  return (
    <main className="page-shell home-page">
      <div className="ambient-mark ambient-mark-left" aria-hidden="true" />
      <div className="ambient-mark ambient-mark-right" aria-hidden="true" />
      <section className="home-card" aria-labelledby="app-title">
        <div className="brand-lockup" aria-label="My DET Trainer">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">MY DET TRAINER</span>
        </div>
        <div className="home-copy">
          <p className="eyebrow">A small study desk for today</p>
          <h1 id="app-title">My DET Trainer</h1>
          <p className="home-description">
            Twenty focused word checks. Take a breath, trust your instincts, and build a steadier vocabulary.
          </p>
        </div>
        <button className="primary-button start-button" type="button" onClick={onStart} data-testid="button-start-training">
          开始单词训练
          <span className="button-arrow" aria-hidden="true">→</span>
        </button>
        <p className="material-note">Original practice material, not official questions.</p>
      </section>
      <p className="home-footer">One round at a time.</p>
    </main>
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
  round: Question[];
  currentIndex: number;
  selectedAnswer: boolean | null;
  onAnswer: (answer: boolean) => void;
  onNext: () => void;
  mode: RoundMode;
}) {
  const question = round[currentIndex];
  const answered = selectedAnswer !== null;
  const isCorrect = answered && selectedAnswer === question.isReal;
  const progress = ((currentIndex + (answered ? 1 : 0)) / round.length) * 100;

  return (
    <main className="page-shell practice-page">
      <header className="practice-header">
        <div className="brand-lockup compact" aria-label="My DET Trainer">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">MY DET TRAINER</span>
        </div>
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
          <h1 id="word-heading" className="word-display" data-testid="text-current-word">{question.word}</h1>
          <p className="word-prompt">Is this a real English word?</p>
        </div>
        <div className="answer-area">
          <div className="answer-buttons" role="group" aria-label="Choose an answer">
            <button
              className={`answer-button ${answered && selectedAnswer === true ? 'selected' : ''} ${answered && question.isReal ? 'correct-option' : ''} ${answered && selectedAnswer === true && !question.isReal ? 'incorrect-option' : ''}`}
              type="button"
              onClick={() => onAnswer(true)}
              disabled={answered}
              data-testid="button-real-word"
            >
              ✅ Real Word
            </button>
            <button
              className={`answer-button ${answered && selectedAnswer === false ? 'selected' : ''} ${answered && !question.isReal ? 'correct-option' : ''} ${answered && selectedAnswer === false && question.isReal ? 'incorrect-option' : ''}`}
              type="button"
              onClick={() => onAnswer(false)}
              disabled={answered}
              data-testid="button-not-a-word"
            >
              ❌ Not a Word
            </button>
          </div>
          <div className={`feedback ${answered ? 'visible' : ''} ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`} aria-live="polite" data-testid="status-answer-feedback">
            {answered && (
              <>
                <span className="feedback-icon" aria-hidden="true">{isCorrect ? '✓' : '!'}</span>
                <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
              </>
            )}
          </div>
          <button className={`next-button ${answered ? 'visible' : ''}`} type="button" onClick={onNext} disabled={!answered} data-testid="button-next-question">
            {currentIndex === round.length - 1 ? 'See Results' : 'Next Question'}
            <span aria-hidden="true">→</span>
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
        <div className="brand-lockup compact" aria-label="My DET Trainer">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">MY DET TRAINER</span>
        </div>
        <span className="results-label">ROUND COMPLETE</span>
      </header>
      <section className="results-content" aria-labelledby="results-heading">
        <div className="results-intro">
          <p className="eyebrow">Your practice, in view</p>
          <h1 id="results-heading">Round results</h1>
          <p>{incorrectAnswers.length === 0 ? 'A clean round. Your attention is paying off.' : 'Notice the words that need another pass.'}</p>
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
            <ul className="mistake-list" data-testid="list-mistakes">
              {incorrectAnswers.map((answer, index) => (
                <li key={`${answer.question.word}-${index}`} data-testid={`text-mistake-${index}`}>
                  <span>{answer.question.word}</span>
                  <span className="mistake-mark" aria-hidden="true">!</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-mistakes" data-testid="text-no-mistakes">Nothing to revisit from this round.</p>
          )}
        </section>
        <div className="results-actions">
          <button className="primary-button" type="button" onClick={onNewRound} data-testid="button-start-new-round">
            Start New Round
            <span className="button-arrow" aria-hidden="true">→</span>
          </button>
          <button className="secondary-button" type="button" onClick={onMistakes} disabled={incorrectAnswers.length === 0} data-testid="button-practice-mistakes">
            Practice Mistakes Again
          </button>
        </div>
        <p className="material-note results-note">Original practice material, not official questions.</p>
      </section>
    </main>
  );
}

function HomeRoute() {
  const [screen, setScreen] = useState<Screen>('home');
  const [round, setRound] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [roundMode, setRoundMode] = useState<RoundMode>('new');

  const beginRound = (questions: Question[], mode: RoundMode) => {
    setRound(questions);
    setRoundMode(mode);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setScreen('practice');
  };

  const startNewRound = () => {
    beginRound(createNewRound(), 'new');
  };

  const startMistakes = () => {
    const mistakes = answers.filter((answer) => !answer.correct).map((answer) => answer.question);
    if (mistakes.length > 0) {
      beginRound(shuffleQuestions(mistakes), 'mistakes');
    }
  };

  const handleAnswer = (answer: boolean) => {
    if (selectedAnswer !== null) return;
    const question = round[currentIndex];
    setSelectedAnswer(answer);
    setAnswers((previous) => [
      ...previous,
      { question, answer, correct: answer === question.isReal },
    ]);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    if (currentIndex === round.length - 1) {
      setScreen('results');
      return;
    }
    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer(null);
  };

  if (screen === 'practice') {
    return (
      <Practice
        round={round}
        currentIndex={currentIndex}
        selectedAnswer={selectedAnswer}
        onAnswer={handleAnswer}
        onNext={handleNext}
        mode={roundMode}
      />
    );
  }

  if (screen === 'results') {
    return <Results answers={answers} onMistakes={startMistakes} onNewRound={startNewRound} />;
  }

  return <Home onStart={startNewRound} />;
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