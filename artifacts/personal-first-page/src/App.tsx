import { useState } from 'react';
import { Route, Router as WouterRouter } from 'wouter';

function Home() {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  return (
    <main className="first-page">
      <section className="greeting-card">
        <h1
          className="greeting"
          data-state={hasCelebrated ? 'celebrated' : 'ready'}
          data-testid="text-greeting"
          aria-live="polite"
        >
          {hasCelebrated
            ? '卧槽，真的动了！！！'
            : 'Hello! 我做出了人生第一个网页 🎉'}
        </h1>
        <button
          className="hello-button"
          data-testid="button-点我"
          type="button"
          onClick={() => setHasCelebrated(true)}
        >
          点我
        </button>
      </section>
    </main>
  );
}

function Router() {
  return <Route path="/" component={Home} />;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;
