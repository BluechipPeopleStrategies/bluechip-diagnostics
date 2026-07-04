import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import QuizHeader from './QuizHeader';
import QuestionView from './QuestionView';
import NavControls from './NavControls';
import ResultsPage from './ResultsPage';
import { loadState, saveState, clearState } from '../lib/persistence';

import orgPulse from '../data/org-pulse.json';
import dqi from '../data/dqi.json';
import workplaceRead from '../data/workplace-read.json';
import supervisorBlindSpot from '../data/supervisor-blind-spot.json';

const diagnostics = {
  'org-pulse': orgPulse,
  dqi: dqi,
  'workplace-read': workplaceRead,
  'supervisor-blind-spot': supervisorBlindSpot,
};

export default function QuizPage({ shareView = false }) {
  const { slug, resultCode } = useParams();
  const diagnostic = diagnostics[slug];

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [orgSize, setOrgSize] = useState('');

  // Restore state on mount (per slug). Clamp a stale saved index against the
  // current questions length so a quiz that was lengthened/shortened — or a state
  // that over-advanced via rapid-clicks — can't trap the user on a blank screen.
  useEffect(() => {
    if (!diagnostic) return;
    const lastIndex = diagnostic.questions.length - 1;
    const saved = loadState(slug);
    if (saved) {
      const savedIndex = saved.currentIndex || 0;
      setAnswers(saved.answers || {});
      setCurrentIndex(Math.min(Math.max(savedIndex, 0), lastIndex));
      setShowResults(!!saved.showResults || savedIndex > lastIndex);
      setEmailSubmitted(!!saved.emailSubmitted);
      setOrgSize(saved.orgSize || '');
    } else {
      setAnswers({});
      setCurrentIndex(0);
      setShowResults(false);
      setEmailSubmitted(false);
      setOrgSize('');
    }
  }, [slug, diagnostic]);

  // Persist on every change
  useEffect(() => {
    if (!diagnostic) return;
    saveState(slug, { answers, currentIndex, showResults, emailSubmitted, orgSize });
  }, [slug, diagnostic, answers, currentIndex, showResults, emailSubmitted, orgSize]);

  const handleAnswer = useCallback(
    (value) => {
      if (!diagnostic) return;
      const q = diagnostic.questions[currentIndex];
      if (!q) return;
      setAnswers((prev) => ({ ...prev, [q.id]: value }));
      const lastIndex = diagnostic.questions.length - 1;
      // Clamp inside the setter so rapid clicks can't over-advance past the last question.
      if (currentIndex < lastIndex) {
        setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, lastIndex)), 220);
      } else {
        setTimeout(() => setShowResults(true), 220);
      }
    },
    [diagnostic, currentIndex]
  );

  const handleBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    clearState(slug);
    setAnswers({});
    setCurrentIndex(0);
    setShowResults(false);
    setEmailSubmitted(false);
    setOrgSize('');
  }, [slug]);

  if (!diagnostic) {
    return (
      <main className="bc-page">
        <h1>Not found</h1>
        <p>No diagnostic with slug <strong>{slug}</strong>.</p>
      </main>
    );
  }

  if (shareView && resultCode) {
    return (
      <main className="bc-page">
        <h1>Shared <em>result</em></h1>
        <p>This is a shared result from someone else's quiz. Want to take it yourself?</p>
        <div className="bc-cta-row">
          <a className="bc-cta" href={`/${slug}`}>Take the {diagnostic.title}</a>
        </div>
      </main>
    );
  }

  if (showResults) {
    return (
      <ResultsPage
        diagnostic={diagnostic}
        answers={answers}
        onRestart={handleRestart}
        emailSubmitted={emailSubmitted}
        onEmailSubmitted={() => setEmailSubmitted(true)}
        orgSize={orgSize}
        onOrgSize={setOrgSize}
      />
    );
  }

  const question = diagnostic.questions[currentIndex];
  if (!question) {
    return (
      <main className="bc-page">
        <p>Loading…</p>
      </main>
    );
  }
  const selectedValue = answers[question.id];

  return (
    <main className="bc-page">
      <QuizHeader currentIndex={currentIndex} total={diagnostic.questions.length} title={diagnostic.title} />
      <QuestionView question={question} selectedValue={selectedValue} onAnswer={handleAnswer} />
      <NavControls onBack={handleBack} onRestart={handleRestart} canGoBack={currentIndex > 0} />
    </main>
  );
}
