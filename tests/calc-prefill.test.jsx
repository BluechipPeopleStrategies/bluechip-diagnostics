import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';

const SESSION_KEY = 'bluechip:ai-opportunity-check:session';
const NOTE = "We've carried over what you picked in the quick estimate. Change anything that's off.";
const URL_OK = '/ai-opportunity-check?src=calc&seat=clerk&tasks=minutes,email,payroll&hours=4,6,3&people=2';

let capture;
beforeEach(() => { sessionStorage.clear(); capture = vi.fn(); window.posthog = { capture }; });
afterEach(() => { cleanup(); sessionStorage.clear(); delete window.posthog; });

const renderAt = (url) => render(<MemoryRouter initialEntries={[url]}><AiOpportunityCheck /></MemoryRouter>);
const saved = () => JSON.parse(sessionStorage.getItem(SESSION_KEY));
const events = () => capture.mock.calls.map(([name, props]) => ({ name, props }));
const firstView = () => events().find(e => e.name === 'check_question_viewed');

describe('AI Pulse: continuing from the homepage calculator', () => {
  it('pre-answers, starts at the first open question and says so', () => {
    renderAt(URL_OK);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(firstView().props).toMatchObject({ question_id: 'toolsToday', question_number: 3, resumed: false });
    expect(saved().answers).toEqual({ orgType: 'municipal', areas: ['meetingNotes', 'correspondence'] });
    expect(saved().areaInputs).toEqual({ meetingNotes: { hours: 4, people: 2 }, correspondence: { hours: 6, people: 2 } });
    expect(saved().qIndex).toBe(2);
  });

  it('lets the visitor go back and change a prefilled answer', () => {
    const { container } = renderAt(URL_OK);
    fireEvent.click(screen.getByRole('button', { name: 'Back' })); // Q2
    fireEvent.click(screen.getByRole('button', { name: 'Back' })); // Q1
    expect(container.querySelector('input[name="orgType"][value="municipal"]')).toBeChecked();
    fireEvent.click(container.querySelector('input[name="orgType"][value="trades"]'));
    expect(container.querySelector('input[name="orgType"][value="trades"]')).toBeChecked();
  });

  it('shows the prefilled picks and sizing on question 2', () => {
    const { container } = renderAt(URL_OK);
    fireEvent.click(screen.getByRole('button', { name: 'Back' })); // Q2 picks
    expect(container.querySelector('input[name="areas"][value="meetingNotes"]')).toBeChecked();
    expect(container.querySelector('input[name="areas"][value="correspondence"]')).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Next' })); // sizing
    expect(container.textContent).toMatch(/2 people\s*×\s*4 hours\s*=\s*8 hours a week/);
    expect(container.textContent).toMatch(/2 people\s*×\s*6 hours\s*=\s*12 hours a week/);
  });

  it('sends check_prefilled once, with the seat and two counts only', () => {
    renderAt(URL_OK);
    const fired = events().filter(e => e.name === 'check_prefilled');
    expect(fired).toHaveLength(1);
    expect(fired[0].props).toEqual({ seat: 'clerk', tasks_mapped: 2, tasks_skipped: 1 });
  });

  it('a saved in-progress session wins: params ignored, no note, no event', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      v: 1, answers: { orgType: 'trades' }, qIndex: 1, step: 'questions', areaInputs: {},
    }));
    const { container } = renderAt(URL_OK);
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    expect(events().some(e => e.name === 'check_prefilled')).toBe(false);
    expect(firstView().props).toMatchObject({ question_id: 'areas', resumed: true });
    expect(saved().answers).toEqual({ orgType: 'trades' });
    expect(container.querySelector('input[name="areas"][value="meetingNotes"]')).not.toBeChecked();
  });

  it('a blank saved session does not block the pre-fill', () => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ v: 1, answers: {}, qIndex: 0, step: 'questions', areaInputs: {} }));
    renderAt(URL_OK);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(saved().answers.orgType).toBe('municipal');
  });

  it('a reload after the pre-fill resumes the saved check, not the params', () => {
    const first = renderAt(URL_OK);
    fireEvent.click(first.container.querySelector('input[name="toolsToday"][value="m365"]'));
    first.unmount();
    capture.mockClear();
    renderAt(URL_OK);
    expect(events().some(e => e.name === 'check_prefilled')).toBe(false);
    expect(saved().answers.toolsToday).toEqual(['m365']);
  });

  it('without src=calc the check starts at question 1 as before', () => {
    renderAt('/ai-opportunity-check?seat=clerk&tasks=email&hours=3');
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    expect(firstView().props).toMatchObject({ question_id: 'orgType', resumed: false });
    expect(events().some(e => e.name === 'check_prefilled')).toBe(false);
  });

  it('a seat with no organization type starts at question 1 but keeps the areas', () => {
    renderAt('/ai-opportunity-check?src=calc&seat=smb&tasks=email,reports&hours=3,2&people=1');
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(firstView().props).toMatchObject({ question_id: 'orgType' });
    expect(saved().answers).toEqual({ areas: ['correspondence', 'reports'] });
  });

  it('shows no note when nothing maps, but still reports the attempt', () => {
    renderAt('/ai-opportunity-check?src=calc&tasks=payroll,files&hours=3,3');
    expect(screen.queryByText(NOTE)).not.toBeInTheDocument();
    expect(events().find(e => e.name === 'check_prefilled').props).toEqual({ seat: null, tasks_mapped: 0, tasks_skipped: 2 });
  });

  it('ignores garbage params without breaking the check', () => {
    renderAt('/ai-opportunity-check?src=calc&seat=zzz&tasks=nope&hours=999&people=-5');
    expect(firstView().props).toMatchObject({ question_id: 'orgType' });
  });
});
