import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import { questions } from '../src/lib/aiOpportunity';

const SESSION_KEY = 'bluechip:ai-opportunity-check:session';
const READY = {
  orgType: 'professional', areas: ['correspondence', 'reports'], toolsToday: ['m365'], aiTools: ['none'],
  information: ['public'], protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone', orgSize: '11-50',
  owner: 'exec', heldBack: ['nothing'], feel: 'keen', timing: 'thisMonth',
};

beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); sessionStorage.clear(); });

const renderCheck = () => render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
const advance = (ms = 400) => act(() => { vi.advanceTimersByTime(ms); });

describe('AI Pulse result: the rate and weeks fields can be typed into', () => {
  function renderResult() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      v: 1, answers: READY, qIndex: 0, step: 'result',
      areaInputs: { correspondence: { hours: 5, people: 1 }, reports: { hours: 5, people: 1 } }, rate: 40, weeks: 48,
    }));
    renderCheck();
    advance(100);
  }

  it('typing 75 into the hourly cost gives 75, not 155', () => {
    renderResult();
    const rate = screen.getAllByLabelText('Employee cost per hour')[0];
    rate.focus();
    fireEvent.change(rate, { target: { value: '7' } });
    expect(rate).toHaveValue(7); // below the minimum while typing: left alone
    fireEvent.change(rate, { target: { value: '75' } });
    expect(rate).toHaveValue(75);
    fireEvent.blur(rate);
    expect(rate).toHaveValue(75);
  });

  it('typing 40 into the working weeks gives 40, not 52', () => {
    renderResult();
    const weeks = screen.getAllByLabelText('Working weeks a year')[0];
    fireEvent.change(weeks, { target: { value: '4' } });
    expect(weeks).toHaveValue(4);
    fireEvent.change(weeks, { target: { value: '40' } });
    expect(weeks).toHaveValue(40);
    fireEvent.blur(weeks);
    expect(weeks).toHaveValue(40);
  });

  it('clears and retypes freely, and clamps to the allowed range on blur or Enter', () => {
    renderResult();
    const rate = screen.getAllByLabelText('Employee cost per hour')[0];
    fireEvent.change(rate, { target: { value: '' } });
    expect(rate).toHaveValue(null);
    fireEvent.blur(rate); // nothing typed: keeps the last good value
    expect(rate).toHaveValue(40);
    fireEvent.change(rate, { target: { value: '999' } });
    fireEvent.blur(rate);
    expect(rate).toHaveValue(250);
    fireEvent.change(rate, { target: { value: '3' } });
    fireEvent.keyDown(rate, { key: 'Enter' });
    expect(rate).toHaveValue(15);
  });

  it('the typed value reaches the estimate', () => {
    renderResult();
    const rate = screen.getAllByLabelText('Employee cost per hour')[0];
    fireEvent.change(rate, { target: { value: '100' } });
    fireEvent.blur(rate);
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).rate).toBe(100);
  });
});

describe('AI Pulse single-choice questions', () => {
  const radio = (id, value) => document.querySelector(`input[name="${id}"][value="${value}"]`);

  it('two quick picks advance one question, not two', () => {
    renderCheck();
    fireEvent.click(radio('orgType', 'professional'));
    fireEvent.click(radio('orgType', 'trades'));
    advance();
    expect(screen.getByText(/^Question 2 of 12/)).toBeInTheDocument();
    expect(screen.queryByText(/^Question 3 of 12/)).not.toBeInTheDocument();
  });

  it('a keyboard pick (arrow key) records the answer and waits for Next', () => {
    renderCheck();
    const fieldset = document.querySelector('fieldset.ai-stepper-question');
    fireEvent.keyDown(fieldset, { key: 'ArrowDown' });
    fireEvent.click(radio('orgType', 'trades'));
    advance(1000);
    expect(screen.getByText('Question 1 of 12.')).toBeInTheDocument();
    expect(radio('orgType', 'trades')).toBeChecked();
    // The visitor can look through the options before committing.
    fireEvent.keyDown(fieldset, { key: 'ArrowDown' });
    fireEvent.click(radio('orgType', 'healthcare'));
    advance(1000);
    expect(screen.getByText('Question 1 of 12.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(/^Question 2 of 12/)).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(SESSION_KEY)).answers.orgType).toBe('healthcare');
  });

  it('a mouse pick still moves on by itself', () => {
    renderCheck();
    fireEvent.pointerDown(radio('orgType', 'trades'));
    fireEvent.click(radio('orgType', 'trades'), { detail: 1 });
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    advance();
    expect(screen.getByText(/^Question 2 of 12/)).toBeInTheDocument();
  });

  it('keeps all twelve questions', () => {
    expect(questions).toHaveLength(12);
  });
});
