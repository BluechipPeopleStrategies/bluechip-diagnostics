import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import QuizPage from '../src/components/QuizPage';
import supervisor from '../src/data/supervisor-blind-spot.json';

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
const press = (key) => fireEvent.keyDown(window, { key });
const advance = (ms = 400) => act(() => { vi.advanceTimersByTime(ms); });
const named = (calls, name) => calls.filter((c) => c[1] === name);

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); window.gtag = vi.fn(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); delete window.gtag; });

describe('quiz analytics: counts without answers', () => {
  it('sends started once, one event per question and completed once', () => {
    renderAt('/supervisor-blind-spot');
    const total = supervisor.questions.length;
    for (let i = 0; i < total; i++) { press('1'); press('1'); advance(); }
    const calls = window.gtag.mock.calls;
    expect(named(calls, 'quiz_started')).toHaveLength(1);
    expect(named(calls, 'quiz_question_answered')).toHaveLength(total);
    expect(named(calls, 'quiz_completed')).toHaveLength(1);
    expect(named(calls, 'quiz_completed')[0][2]).toEqual({ diagnostic_id: 'supervisor-blind-spot', total_questions: total });
    // never an answer value: only diagnostic id, question number and total
    for (const [, , props] of named(calls, 'quiz_question_answered')) {
      expect(Object.keys(props).sort()).toEqual(['diagnostic_id', 'question_number', 'total_questions']);
    }
  });

  it('a shared result view is counted', () => {
    renderAt('/supervisor-blind-spot/result/zz');
    expect(named(window.gtag.mock.calls, 'quiz_shared_result_viewed')).toHaveLength(1);
  });
});
