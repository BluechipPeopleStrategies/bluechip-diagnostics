import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import QuizHeader from './QuizHeader';
import QuestionView from './QuestionView';
import NavControls from './NavControls';
import ResultsPage from './ResultsPage';
import { loadState, saveState, clearState } from '../lib/persistence';
import { describeSharedResult } from '../lib/share';
import { trackEvent } from '../lib/checkAnalytics';
import { usePageMeta } from '../lib/seo';

import orgPulse from '../data/org-pulse.json';
import dqi from '../data/dqi.json';
import workplaceRead from '../data/workplace-read.json';
import supervisorBlindSpot from '../data/supervisor-blind-spot.json';
import governanceEvalReadiness from '../data/governance-eval-readiness.json';

const diagnostics = {
  'org-pulse': orgPulse,
  dqi: dqi,
  'workplace-read': workplaceRead,
  'supervisor-blind-spot': supervisorBlindSpot,
  'governance-eval-readiness': governanceEvalReadiness,
};

export default function QuizPage({ shareView = false }) {
  const { slug, resultCode } = useParams();
  const diagnostic = diagnostics[slug];
  // Own title per quiz; the canonical is the main-site page that wraps this quiz (Oct 9, 2026).
  usePageMeta(diagnostic ? `${diagnostic.title} (free) | BlueChip` : 'Not found | BlueChip',
    diagnostic ? diagnostic.tagline : undefined,
    diagnostic ? `https://www.bluechip-people-strategies.com/${slug}` : undefined);

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [orgSize, setOrgSize] = useState('');
  // Questions already counted this visit, so a double press or a changed answer is not counted twice.
  const counted = useRef(new Set());

  // Quiz funnel counts (started, each question, completed) for PostHog and GA4: the diagnostic,
  // question number and total only, never the answer.
  useEffect(() => {
    if (shareView && resultCode && diagnostic) trackEvent('quiz_shared_result_viewed', { diagnostic_id: slug });
  }, [shareView, resultCode, diagnostic, slug]);

  // Restore state on mount (per slug). Clamp a stale saved index against the
  // current questions length so a quiz that was lengthened/shortened, or a state
  // that over-advanced via rapid-clicks, can't trap the user on a blank screen.
  // A saved "show results" is honoured only when every question has an answer; otherwise the
  // visitor goes back to the first unanswered question instead of seeing a score built on gaps.
  useEffect(() => {
    if (!diagnostic) return;
    const lastIndex = diagnostic.questions.length - 1;
    const saved = loadState(slug);
    if (saved) {
      const savedIndex = saved.currentIndex || 0;
      const savedAnswers = saved.answers || {};
      const firstGap = diagnostic.questions.findIndex((q) => savedAnswers[q.id] === undefined);
      const wantsResults = !!saved.showResults || savedIndex > lastIndex;
      setAnswers(savedAnswers);
      if (wantsResults && firstGap !== -1) {
        setCurrentIndex(firstGap);
        setShowResults(false);
      } else {
        setCurrentIndex(Math.min(Math.max(savedIndex, 0), lastIndex));
        setShowResults(wantsResults);
      }
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
      if (!counted.current.has(q.id)) {
        const total = diagnostic.questions.length;
        if (counted.current.size === 0 && Object.keys(answers).length === 0) trackEvent('quiz_started', { diagnostic_id: slug, total_questions: total });
        counted.current.add(q.id);
        trackEvent('quiz_question_answered', { diagnostic_id: slug, question_number: currentIndex + 1, total_questions: total });
        if (currentIndex === lastIndex) trackEvent('quiz_completed', { diagnostic_id: slug, total_questions: total });
      }
      // Advance only from the question that was answered. A second press inside the 220 ms delay
      // (double click, key repeat) schedules a second advance; without this check it moved on
      // twice and skipped a question unanswered.
      if (currentIndex < lastIndex) {
        setTimeout(() => setCurrentIndex((i) => (i === currentIndex ? i + 1 : i)), 220);
      } else {
        setTimeout(() => setShowResults(true), 220);
      }
    },
    [diagnostic, currentIndex, answers, slug]
  );

  const handleBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleRestart = useCallback(() => {
    trackEvent('quiz_restarted', { diagnostic_id: slug });
    counted.current = new Set();
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
    const shared = describeSharedResult(diagnostic, resultCode);
    return (
      <main className="bc-page">
        <h1>Shared <em>result</em></h1>
        {shared ? (
          <>
            <p>Someone shared this result from {diagnostic.title}:</p>
            <p><strong>{shared}</strong></p>
            <p>Want to find out where you land?</p>
          </>
        ) : (
          <p>This is a shared result from someone else's quiz. Want to take it yourself?</p>
        )}
        <div className="bc-cta-row">
          <a className="bc-cta" href={`/${slug}`}>Take {/^The /.test(diagnostic.title) ? '' : 'the '}{diagnostic.title}</a>
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
      <QuizHeader currentIndex={currentIndex} total={diagnostic.questions.length} title={diagnostic.title} slug={slug} />
      <QuestionView question={question} selectedValue={selectedValue} onAnswer={handleAnswer} />
      <NavControls onBack={handleBack} onRestart={handleRestart} canGoBack={currentIndex > 0} />
    </main>
  );
}
