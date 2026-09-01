import { useState } from 'react';
import { Route, Router as WouterRouter } from 'wouter';

type Difficulty = 'Foundation' | 'Current' | 'Target' | 'Challenge';

type VocabularyItem = {
  word: string;
  real: boolean;
  meaning?: string;
  explanation?: string;
  partOfSpeech?: string;
  example?: string;
  difficulty: Difficulty;
  confusedWith?: {
    word: string;
    meaning: string;
  };
};

type AnswerRecord = {
  item: VocabularyItem;
  answer: boolean;
  correct: boolean;
};

type Screen = 'home' | 'practice' | 'results';
type RoundMode = 'new' | 'mistakes';

const DEFAULT_ROUND_QUOTAS: Record<Difficulty, number> = {
  Foundation: 4,
  Current: 8,
  Target: 6,
  Challenge: 2,
};

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

const VOCABULARY_BANK: VocabularyItem[] = [
  { word: 'adaptable', real: true, meaning: '适应性强的；能适应变化的', explanation: 'An adaptable person or thing can adjust when circumstances change.', partOfSpeech: 'adjective', example: 'Her adaptable approach helped the team work through the change.', difficulty: 'Foundation' },
  { word: 'adjacent', real: true, meaning: '邻近的；相邻的', explanation: 'Adjacent things are beside each other.', partOfSpeech: 'adjective', example: 'The library is in the adjacent building.', difficulty: 'Foundation' },
  { word: 'beneficial', real: true, meaning: '有益的；有帮助的', explanation: 'Something beneficial gives a good result or advantage.', partOfSpeech: 'adjective', example: 'A short walk can be beneficial for your concentration.', difficulty: 'Foundation' },
  { word: 'coherent', real: true, meaning: '连贯的；有条理的', explanation: 'A coherent idea is easy to understand because its parts fit together.', partOfSpeech: 'adjective', example: 'She gave a coherent explanation of the experiment.', difficulty: 'Foundation' },
  { word: 'appraize', real: false, difficulty: 'Foundation', confusedWith: { word: 'appraise', meaning: '评估；评价价值或质量' } },
  { word: 'hinderance', real: false, difficulty: 'Foundation', confusedWith: { word: 'hindrance', meaning: '妨碍进步的事物；障碍' } },
  { word: 'reliable', real: true, meaning: '可靠的；值得信赖的', explanation: 'A reliable person or thing can be depended on.', partOfSpeech: 'adjective', example: 'We need a reliable source before making a decision.', difficulty: 'Foundation' },
  { word: 'convenient', real: true, meaning: '方便的；便利的', explanation: 'Convenient things save time or effort.', partOfSpeech: 'adjective', example: 'The evening class is convenient for my schedule.', difficulty: 'Foundation' },

  { word: 'alleviate', real: true, meaning: '减轻；缓解', explanation: 'To alleviate a problem is to reduce how serious or uncomfortable it is.', partOfSpeech: 'verb', example: 'The new schedule may alleviate some pressure on staff.', difficulty: 'Current' },
  { word: 'ambiguous', real: true, meaning: '模棱两可的；有歧义的', explanation: 'An ambiguous statement is not completely clear about what it means.', partOfSpeech: 'adjective', example: 'The ambiguous instruction confused the new students.', difficulty: 'Current' },
  { word: 'anticipate', real: true, meaning: '预期；预料并准备', explanation: 'To anticipate something is to think it will happen before it does.', partOfSpeech: 'verb', example: 'We anticipate a busy week before the holiday.', difficulty: 'Current' },
  { word: 'articulate', real: true, meaning: '清楚表达；善于表达的', explanation: 'To articulate an idea is to explain it in clear words.', partOfSpeech: 'verb', example: 'He can articulate complex ideas in a simple way.', difficulty: 'Current' },
  { word: 'circumvent', real: true, meaning: '规避；绕过', explanation: 'To circumvent something is to find a way around it instead of facing it directly.', partOfSpeech: 'verb', example: 'The team found a legal way to circumvent the delay.', difficulty: 'Current' },
  { word: 'comprehend', real: true, meaning: '理解；领会', explanation: 'To comprehend is to understand the meaning of something.', partOfSpeech: 'verb', example: 'It took time to comprehend the full report.', difficulty: 'Current' },
  { word: 'constrain', real: true, meaning: '限制；约束', explanation: 'To constrain something is to keep it within certain limits.', partOfSpeech: 'verb', example: 'A small budget can constrain the project.', difficulty: 'Current' },
  { word: 'discrepancy', real: true, meaning: '差异；不一致', explanation: 'A discrepancy is a mismatch or inconsistency.', partOfSpeech: 'noun', example: 'The accountant noticed a discrepancy in the totals.', difficulty: 'Current' },
  { word: 'equatible', real: false, difficulty: 'Current', confusedWith: { word: 'equitable', meaning: '公平的；公正合理的' } },
  { word: 'feasible', real: true, meaning: '可行的；切实可行的', explanation: 'A feasible plan can realistically be completed.', partOfSpeech: 'adjective', example: 'The group discussed a feasible way to reduce waste.', difficulty: 'Current' },
  { word: 'inadvertent', real: true, meaning: '无意的；非故意的', explanation: 'An inadvertent action happens by accident.', partOfSpeech: 'adjective', example: 'The email caused an inadvertent misunderstanding.', difficulty: 'Current' },
  { word: 'mitigate', real: true, meaning: '减轻；缓和不良影响', explanation: 'To mitigate a risk is to reduce its possible damage.', partOfSpeech: 'verb', example: 'Trees can help mitigate the effects of extreme heat.', difficulty: 'Current' },
  { word: 'plausible', real: true, meaning: '貌似合理的；可信的', explanation: 'A plausible idea could be true because it makes sense.', partOfSpeech: 'adjective', example: 'Her explanation was plausible but needed more evidence.', difficulty: 'Current' },
  { word: 'proficient', real: true, meaning: '熟练的；精通的', explanation: 'A proficient person can do something well.', partOfSpeech: 'adjective', example: 'After practice, he became proficient at presenting data.', difficulty: 'Current' },
  { word: 'subtle', real: true, meaning: '细微的；不明显的', explanation: 'A subtle difference is small and may need careful attention.', partOfSpeech: 'adjective', example: 'There was a subtle change in her tone.', difficulty: 'Current' },
  { word: 'sufficive', real: false, difficulty: 'Current' },
  { word: 'versatile', real: true, meaning: '多才多艺的；用途广泛的', explanation: 'A versatile person or thing is useful in varied situations.', partOfSpeech: 'adjective', example: 'A versatile notebook works for planning and sketching.', difficulty: 'Current' },

  { word: 'conclusive', real: true, meaning: '决定性的；确凿的', explanation: 'Conclusive evidence gives a final and convincing answer.', partOfSpeech: 'adjective', example: 'The test did not provide conclusive evidence.', difficulty: 'Target' },
  { word: 'empirical', real: true, meaning: '以观察或实验为依据的', explanation: 'Empirical knowledge comes from what can be observed or tested.', partOfSpeech: 'adjective', example: 'The paper presents empirical evidence from three studies.', difficulty: 'Target' },
  { word: 'exacerbate', real: true, meaning: '加剧；使恶化', explanation: 'To exacerbate a situation is to increase its difficulty or harm.', partOfSpeech: 'verb', example: 'Poor communication can exacerbate a small disagreement.', difficulty: 'Target' },
  { word: 'juxtapose', real: true, meaning: '并置；把不同事物放在一起比较', explanation: 'To juxtapose things is to place them side by side so their contrast is clear.', partOfSpeech: 'verb', example: 'The exhibit juxtaposes old photographs with new ones.', difficulty: 'Target' },
  { word: 'meticulous', real: true, meaning: '一丝不苟的；非常细心的', explanation: 'A meticulous person works with great care and precision.', partOfSpeech: 'adjective', example: 'Her meticulous notes made the research easy to review.', difficulty: 'Target' },
  { word: 'pervasive', real: true, meaning: '普遍存在的；遍及各处的', explanation: 'A pervasive influence is present in many places or parts of a situation.', partOfSpeech: 'adjective', example: 'Digital tools have a pervasive role in modern work.', difficulty: 'Target' },
  { word: 'substantiate', real: true, meaning: '用证据证实；支持说法', explanation: 'To substantiate an idea is to show that it is likely true.', partOfSpeech: 'verb', example: 'The researcher used records to substantiate the claim.', difficulty: 'Target' },
  { word: 'obscurative', real: false, difficulty: 'Target' },
  { word: 'proliferate', real: true, meaning: '迅速增加；激增', explanation: 'Things proliferate when they grow in number very rapidly.', partOfSpeech: 'verb', example: 'Small cafés began to proliferate across the neighborhood.', difficulty: 'Target' },

  { word: 'intransigent', real: true, meaning: '不妥协的；不愿改变立场的', explanation: 'An intransigent person refuses to compromise.', partOfSpeech: 'adjective', example: 'The intransigent negotiator rejected every revision.', difficulty: 'Challenge' },
  { word: 'ephemeral', real: true, meaning: '短暂的；转瞬即逝的', explanation: 'Something ephemeral disappears or ends quickly.', partOfSpeech: 'adjective', example: 'The artist captured the ephemeral colors of the sunset.', difficulty: 'Challenge' },
  { word: 'anachronistic', real: true, meaning: '时代错误的；不合时代的', explanation: 'An anachronistic thing seems out of place in its historical period.', partOfSpeech: 'adjective', example: 'The modern phrase sounded anachronistic in the historical novel.', difficulty: 'Challenge' },
  { word: 'contentious', real: true, meaning: '有争议的；容易引起争论的', explanation: 'A contentious topic often creates strong opposing opinions.', partOfSpeech: 'adjective', example: 'The committee postponed the contentious discussion.', difficulty: 'Challenge' },
  { word: 'circumscriptive', real: false, difficulty: 'Challenge' },
  { word: 'prevaricate', real: true, meaning: '含糊其辞；回避直接回答', explanation: 'To prevaricate is to speak vaguely instead of telling the truth clearly.', partOfSpeech: 'verb', example: 'When asked about the error, the spokesperson began to prevaricate.', difficulty: 'Challenge' },
];

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createNewRound(): VocabularyItem[] {
  return shuffle((Object.keys(DEFAULT_ROUND_QUOTAS) as Difficulty[]).flatMap((difficulty) =>
    shuffle(VOCABULARY_BANK.filter((item) => item.difficulty === difficulty)).slice(0, DEFAULT_ROUND_QUOTAS[difficulty]),
  ));
}

function Brand() {
  return (
    <div className="brand-lockup" aria-label="My DET Trainer">
      <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="brand-name">MY DET TRAINER</span>
    </div>
  );
}

function Home({ onStart }: { onStart: () => void }) {
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
        <p className="material-note">Original practice material, not official DET questions.</p>
      </section>
      <p className="home-footer">One round at a time.</p>
    </main>
  );
}

function LearningFeedback({ item }: { item: VocabularyItem }) {
  if (!item.real) {
    return (
      <div className="learning-feedback fake-feedback" data-testid={`feedback-learning-${item.word}`}>
        <p className="feedback-fake-title">Not a real English word</p>
        {item.confusedWith && (
          <div className="confusion-note">
            <p><span className="detail-label">Real word</span><strong>{item.confusedWith.word}</strong></p>
            <p><span className="detail-label">Meaning</span>{item.confusedWith.meaning}</p>
            <p><span className="detail-label">Correct spelling</span>{item.confusedWith.word}</p>
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
      <dl className="learning-details">
        <div><dt>Chinese meaning</dt><dd>{item.meaning}</dd></div>
        <div><dt>Simple explanation</dt><dd>{item.explanation}</dd></div>
        <div><dt>Part of speech</dt><dd>{item.partOfSpeech}</dd></div>
        <div><dt>Example</dt><dd className="example-text">“{item.example}”</dd></div>
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

function HomeRoute() {
  const [screen, setScreen] = useState<Screen>('home');
  const [round, setRound] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [roundMode, setRoundMode] = useState<RoundMode>('new');
  const [, setPerformanceProfile] = useState<PerformanceProfile>(INITIAL_PERFORMANCE_PROFILE);

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
      setScreen('results');
      return;
    }
    setCurrentIndex((previous) => previous + 1);
    setSelectedAnswer(null);
  };

  if (screen === 'practice') {
    return <Practice round={round} currentIndex={currentIndex} selectedAnswer={selectedAnswer} onAnswer={handleAnswer} onNext={handleNext} mode={roundMode} />;
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