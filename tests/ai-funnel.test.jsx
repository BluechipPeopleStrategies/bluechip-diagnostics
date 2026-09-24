import { fireEvent, render, screen, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import { questions } from '../src/lib/aiOpportunity';

afterEach(cleanup);

// A complete, non-sensitive, mid-size answer set used to drive the stepper to the end quickly.
const READY = {
  orgType: 'professional',
  areas: ['correspondence', 'reports'],
  toolsToday: ['m365'],
  aiTools: ['none'],
  workload: '5plus',
  information: ['public'],
  readiness: 'assign',
  orgSize: '11-50',
  owner: 'exec',
  heldBack: ['nothing'],
  feel: 'keen',
  timing: 'thisMonth',
};

async function answerCurrentQuestion(container, qId, values, isLast) {
  const q = questions.find(q => q.id === qId);
  const vals = Array.isArray(values) ? values : [values];
  vals.forEach(v => fireEvent.click(container.querySelector(`input[name="${qId}"][value="${v}"]`)));
  if (q.type === 'multi') {
    fireEvent.click(screen.getByRole('button', { name: /Next|See my estimate/ }));
  } else if (isLast) {
    // Auto-advance off the last question hands off into the calculator step instead of
    // rendering "Question 13 of 12", so wait for that step's own heading instead.
    await waitFor(() => expect(screen.getByText('How much time goes into this work now?')).toBeInTheDocument());
  } else {
    const next = questions[q.number]; // q.number is 1-based, so this is the following question
    await waitFor(() => expect(screen.getByText(new RegExp(`Question ${next.number} of ${questions.length}`))).toBeInTheDocument());
  }
}

async function driveToCalculator(container, overrides = {}) {
  const answers = { ...READY, ...overrides };
  for (const q of questions) {
    await answerCurrentQuestion(container, q.id, answers[q.id], q.number === questions.length);
  }
}

describe('the free check stepper', () => {
  it('shows the intro, the guarantee band, and question 1 of 12 on load', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText('How much time could AI give back to your team?')).toBeInTheDocument();
    expect(screen.getByText('The AI Handoff Plan: find 5 hours a week, or your money back.')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 12. 0 of 12 answered.')).toBeInTheDocument();
  });

  it('auto-advances a single-select question after a short beat, without a Next button', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('a pick-all question requires at least one pick before Next is enabled, and supports removing a pick', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText('Question 2 of 12. 1 of 12 answered.')).toBeInTheDocument());
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(next).not.toBeDisabled();
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]')); // toggle off
    expect(next).toBeDisabled();
  });

  it('stops picking once Q2 reaches its 4-area cap', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    const four = ['correspondence', 'reports', 'meetingNotes', 'findingInfo'];
    four.forEach(v => fireEvent.click(container.querySelector(`input[name="areas"][value="${v}"]`)));
    fireEvent.click(container.querySelector('input[name="areas"][value="scheduling"]'));
    expect(container.querySelector('input[name="areas"][value="scheduling"]')).not.toBeChecked();
    four.forEach(v => expect(container.querySelector(`input[name="areas"][value="${v}"]`)).toBeChecked());
  });

  it('the Back button returns to the previous question and is disabled on question 1', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
  });

  it('walks all 12 questions to the calculator, prefilled from the workload answer, and shows the result', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToCalculator(container);
    expect(screen.getByText('How much time goes into this work now?')).toBeInTheDocument();
    // workload 5plus -> defaultHours() prefill of 5 hours, shown in each row's number input
    const hourInputs = container.querySelectorAll('.ai-range-row input[type="number"]');
    expect(hourInputs[0].value).toBe('5');

    fireEvent.click(screen.getByRole('button', { name: 'Show my result' }));
    expect(screen.getByText(/Your team could get back about/)).toBeInTheDocument();
    expect(screen.getByText('You get the plan, and your team puts it in place.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See what the plan includes' })).toHaveAttribute('href', '/ai-handoff-plan');
  });

  it('skipping the calculator shows the no-range copy instead of a number range', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToCalculator(container);
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.getByText(/You skipped the hours, so there's no range yet/)).toBeInTheDocument();
  });

  it('shows a sensitive-information tailored line when Q6 includes a sensitive category', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToCalculator(container, { information: ['payroll'] });
    fireEvent.click(screen.getByRole('button', { name: 'Show my result' }));
    expect(screen.getByText(/it may need private or approved tools/)).toBeInTheDocument();
  });

  it('"Review my answers" returns to question 1 with prior picks intact', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToCalculator(container);
    fireEvent.click(screen.getByRole('button', { name: 'Show my result' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review my answers' }));
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
    expect(container.querySelector('input[name="orgType"][value="professional"]')).toBeChecked();
  });
});

describe('the AI Handoff Plan page', () => {
  it('names the plan, the price, and the automatic no-claim-window guarantee', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'The AI Handoff Plan', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('C$999, taxes included')).toBeInTheDocument();
    expect(screen.getByText(/your full fee comes back within 10 business days, no forms, no hoops/)).toBeInTheDocument();
    expect(screen.queryByText(/claim window|within 7 days/i)).not.toBeInTheDocument();
  });

  it('shows the "who does what" block and the three-column table', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByText('The plan is yours. Your team puts it in place.')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('We do')).toBeInTheDocument();
    expect(within(table).getByText('You do')).toBeInTheDocument();
    expect(within(table).getByText('Optional, if you want help')).toBeInTheDocument();
  });

  it('the single CTA is a styled button that opens the chat widget in place, not an off-page link', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    const ctas = screen.getAllByRole('link', { name: 'Start the conversation' });
    expect(ctas.length).toBeGreaterThan(0);
    ctas.forEach(cta => {
      expect(cta).toHaveAttribute('href', '#chat');
      expect(cta.className).toContain('ai-button');
    });
    expect(screen.queryByText('Discuss your Practical AI Audit')).not.toBeInTheDocument();
  });

  it('shows the credibility strip linking to /about', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /More about BlueChip/ })).toHaveAttribute('href', 'https://www.bluechip-people-strategies.com/about');
  });

  it('keeps an old ?workflow= link working', () => {
    render(<MemoryRouter initialEntries={['/ai-handoff-plan?workflow=reporting']}><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByText(/Your starting point:/)).toBeInTheDocument();
    expect(screen.getByText('Recurring reports')).toBeInTheDocument();
  });

  it('sets the document title and meta description from the launch strings', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(document.title).toBe('The AI Handoff Plan: Practical AI Audit | BlueChip');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/practical AI audit of your organization's recurring work/);
  });
});
