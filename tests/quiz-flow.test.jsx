import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuizPage from '../src/components/QuizPage';
import { encodeResult } from '../src/lib/share';
import orgPulse from '../src/data/org-pulse.json';
import supervisor from '../src/data/supervisor-blind-spot.json';
import dqi from '../src/data/dqi.json';
import governance from '../src/data/governance-eval-readiness.json';
import workplace from '../src/data/workplace-read.json';

const KEY = (slug) => `bluechip-diagnostic:${slug}:state`;

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:slug" element={<QuizPage />} />
        <Route path="/:slug/result/:resultCode" element={<QuizPage shareView />} />
      </Routes>
    </MemoryRouter>
  );
}
const press = (key, extra = {}) => fireEvent.keyDown(window, { key, ...extra });
const advance = (ms = 400) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

describe('quiz: a question is never skipped', () => {
  it('a double press of a number key answers once and moves on once', () => {
    renderAt('/org-pulse');
    expect(screen.getByText(/Question 1 of 25/)).toBeInTheDocument();
    press('3'); press('3');
    advance();
    expect(screen.getByText(/Question 2 of 25/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEY('org-pulse'))).answers).toEqual({ q01: 3 });
  });

  it('a held key (auto-repeat) and modified keys are ignored', () => {
    renderAt('/org-pulse');
    press('3', { repeat: true });
    press('2', { ctrlKey: true });
    advance();
    expect(screen.getByText(/Question 1 of 25/)).toBeInTheDocument();
    press('4');
    advance();
    expect(screen.getByText(/Question 2 of 25/)).toBeInTheDocument();
    press('2');
    advance();
    expect(screen.getByText(/Question 3 of 25/)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(KEY('org-pulse'))).answers).toEqual({ q01: 4, q02: 2 });
  });

  it('two quick clicks on the same question still advance only one question', () => {
    renderAt('/dqi');
    const [a, b] = screen.getAllByRole('button', { name: /Strongly|Agree|Disagree|Neutral/i });
    fireEvent.click(a); fireEvent.click(b);
    advance();
    expect(screen.getByText(/Question 2 of 18/)).toBeInTheDocument();
  });
});

describe('quiz: results only from a complete set of answers', () => {
  it('a saved "show results" with unanswered questions goes back to the first gap', () => {
    localStorage.setItem(KEY('org-pulse'), JSON.stringify({ answers: { q01: 3, q02: 3 }, currentIndex: 24, showResults: true }));
    renderAt('/org-pulse');
    expect(screen.getByText(/Question 3 of 25/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Retake/ })).not.toBeInTheDocument();
  });

  it('an empty saved state with show-results set starts from question 1', () => {
    localStorage.setItem(KEY('supervisor-blind-spot'), JSON.stringify({ answers: {}, currentIndex: 3, showResults: true }));
    renderAt('/supervisor-blind-spot');
    expect(screen.getByText(/Question 1 of 10/)).toBeInTheDocument();
  });

  it('a complete saved set shows the result', () => {
    const answers = Object.fromEntries(orgPulse.questions.map(q => [q.id, 3]));
    localStorage.setItem(KEY('org-pulse'), JSON.stringify({ answers, currentIndex: 24, showResults: true }));
    renderAt('/org-pulse');
    expect(screen.getByRole('button', { name: /Retake/ })).toBeInTheDocument();
  });
});

describe('quiz result: next step and promises', () => {
  function showResult(diagnostic) {
    const answers = Object.fromEntries(diagnostic.questions.map(q => [q.id, q.type === 'likert-5' ? 3 : q.options[0].value]));
    localStorage.setItem(KEY(diagnostic.id), JSON.stringify({ answers, currentIndex: diagnostic.questions.length - 1, showResults: true }));
    renderAt(`/${diagnostic.id}`);
    return document.body.textContent;
  }

  it.each([orgPulse, dqi, governance, supervisor, workplace])('$id ends in "Start the conversation", which opens the chat, and has no Clarity Call', (diagnostic) => {
    const text = showResult(diagnostic);
    const link = screen.getByRole('link', { name: /Start the conversation/ });
    expect(link.getAttribute('href')).toBe('#chat?topic=other');
    expect(text).not.toMatch(/clarity call|cal\.com|\$99|30[- ]minute/i);
    expect(text).not.toContain('—');
  });

  it.each([orgPulse, governance])('$id does not promise next moves it never shows', (diagnostic) => {
    showResult(diagnostic);
    const optin = document.querySelector('.bc-optin');
    expect(optin.textContent).toMatch(/dimension-by-dimension breakdown/);
    expect(optin.textContent).not.toMatch(/next moves/i);
    expect(screen.getByRole('button', { name: 'Unlock my breakdown' })).toBeInTheDocument();
  });

  it.each([dqi, supervisor, workplace])('$id still promises next moves, and shows them once unlocked', (diagnostic) => {
    showResult(diagnostic);
    expect(screen.getByRole('button', { name: 'Unlock my next moves' })).toBeInTheDocument();
  });
});

describe('quiz share link', () => {
  it('shows the shared band or archetype, and offers the quiz without "the The"', () => {
    renderAt(`/dqi/result/${encodeResult({ type: 'score', label: 'Mixed signal (62/100)' })}`);
    expect(screen.getByText('Mixed signal (62/100)')).toBeInTheDocument();
    cleanup();
    renderAt(`/workplace-read/result/${encodeResult({ type: 'archetype', label: 'drift' })}`);
    expect(screen.getByText('Drift')).toBeInTheDocument();
    const cta = screen.getByRole('link');
    expect(cta.textContent).toBe('Take The Workplace Read');
    expect(cta.getAttribute('href')).toBe('/workplace-read');
    cleanup();
    renderAt(`/org-pulse/result/${encodeResult({ type: 'score', label: 'Healthy (80/100)' })}`);
    expect(screen.getByRole('link').textContent).toBe('Take the Org Pulse');
  });

  it('falls back to the plain page for a garbled, edited or foreign code', () => {
    for (const code of ['!!!', encodeResult({ type: 'score', label: 'Totally made up (50/100)' }), encodeResult({ type: 'archetype', label: 'not-real' }), encodeResult({ type: 'score', label: 'Healthy (500/100)' })]) {
      renderAt(`/org-pulse/result/${code}`);
      expect(screen.getByText(/shared result from someone else's quiz/)).toBeInTheDocument();
      cleanup();
    }
  });
});

describe('Decision Quality Index result', () => {
  it('a perfect score is shown as the Calibrator, not a decision trap', () => {
    const answers = Object.fromEntries(dqi.questions.map(q => [q.id, q.type === 'likert-5' ? (q.reverseScored ? 1 : 5) : 'a']));
    localStorage.setItem(KEY('dqi'), JSON.stringify({ answers, currentIndex: 17, showResults: true }));
    renderAt('/dqi');
    expect(document.body.textContent).toMatch(/Calibrated/);
    expect(document.body.textContent).toMatch(/The Calibrator/);
    expect(document.body.textContent).not.toMatch(/The Gut-Caller/);
  });
});
