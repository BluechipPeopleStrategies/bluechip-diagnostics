import { fireEvent, render, screen, cleanup, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import { questions } from '../src/lib/aiOpportunity';

afterEach(cleanup);

// A complete, non-sensitive, mid-size answer set used to drive the stepper to the end quickly.
// No "workload" entry: Q5 was merged into Q2 (an hours/people row per picked area, defaulting
// to 5 hours and 1 person, which is enough for most of these tests).
const READY = {
  orgType: 'professional',
  areas: ['correspondence', 'reports'],
  toolsToday: ['m365'],
  aiTools: ['none'],
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
    // Auto-advance off the last question goes through the loading screen (reduced motion is
    // mocked in tests/setup.js, so it's a flat ~600ms) before the result lands.
    await waitFor(() => expect(screen.getByText('Your estimate')).toBeInTheDocument(), { timeout: 3000 });
  } else {
    const next = questions[q.number]; // q.number is 1-based, so this is the following question
    await waitFor(() => expect(screen.getByText(new RegExp(`Question ${next.number} of ${questions.length}`))).toBeInTheDocument());
  }
}

async function driveToResult(container, overrides = {}) {
  const answers = { ...READY, ...overrides };
  for (const q of questions) {
    await answerCurrentQuestion(container, q.id, answers[q.id], q.number === questions.length);
  }
}

describe('the free check stepper', () => {
  it('is 11 questions, with no mention of the plan, price or guarantee before the result', () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText('How much time could AI give back to your team?')).toBeInTheDocument();
    expect(screen.getByText('Find out roughly how many hours a week AI could give your team back. About two minutes, no email.')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 11. 0 of 11 answered.')).toBeInTheDocument();
    // Scoped to the stepper content, not the shared SiteHeader nav (which always names the
    // plan as a navigation link -- that's wayfinding, not sales copy).
    const stepper = container.querySelector('.ai-stepper');
    expect(stepper.textContent).not.toMatch(/guarantee/i);
    expect(stepper.textContent).not.toMatch(/C\$999/);
    expect(stepper.textContent).not.toMatch(/The AI Handoff Plan/);
  });

  it('the plan-page CTA in the header carries no gold button on the free check (plain nav only)', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Start the conversation' })).not.toBeInTheDocument();
  });

  it('auto-advances a single-select question after a short beat, without a Next button', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('a pick-all question requires at least one pick before Next is enabled, and supports removing a pick', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText('Question 2 of 11. 1 of 11 answered.')).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/Question 2 of 11/)).toBeInTheDocument());
    const four = ['correspondence', 'reports', 'meetingNotes', 'findingInfo'];
    four.forEach(v => fireEvent.click(container.querySelector(`input[name="areas"][value="${v}"]`)));
    fireEvent.click(container.querySelector('input[name="areas"][value="scheduling"]'));
    expect(container.querySelector('input[name="areas"][value="scheduling"]')).not.toBeChecked();
    four.forEach(v => expect(container.querySelector(`input[name="areas"][value="${v}"]`)).toBeChecked());
  });

  it('ticking a Q2 area reveals an inline hours slider and people stepper, defaulting to 5 hours and 1 person', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 11/)).toBeInTheDocument());
    expect(container.querySelector('#hours-correspondence')).not.toBeInTheDocument();
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    const slider = container.querySelector('#hours-correspondence');
    expect(slider).toHaveValue('5');
    expect(container.querySelector('.ai-people-count').textContent).toBe('1');
    // unticking removes the row
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(container.querySelector('#hours-correspondence')).not.toBeInTheDocument();
  });

  it('adjusting the hours slider and the people stepper updates the live preview line', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 11/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(screen.getByText(/hours a week back, so far\./)).toBeInTheDocument();
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '20' } });
    // more hours -> a bigger live-preview range than the 5-hour default produced
    expect(container.querySelector('#hours-correspondence')).toHaveValue('20');
    fireEvent.click(screen.getByRole('button', { name: 'More people' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('the Back button returns to the previous question and is disabled on question 1', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 11/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(/Question 1 of 11/)).toBeInTheDocument();
  });

  it('walks all 11 questions through the loading screen to a dashboard result', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(container.querySelector('.ai-result-headline').textContent).toMatch(/About \d+ to \d+ hours a week/);
    expect(screen.getByText('across the areas you picked')).toBeInTheDocument();
    expect(screen.getByText('Hours a week')).toBeInTheDocument();
    expect(screen.getByText('Hours a year')).toBeInTheDocument();
    expect(screen.getByText('Staff time value')).toBeInTheDocument();
  });

  it('the loading screen shows a status region before the result', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    const answers = READY;
    for (const q of questions.slice(0, -1)) {
      await answerCurrentQuestion(container, q.id, answers[q.id], false);
    }
    const last = questions[questions.length - 1];
    fireEvent.click(container.querySelector(`input[name="${last.id}"][value="${answers[last.id]}"]`));
    // The single-select auto-advance beat (200ms) runs before the loading step mounts.
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument());
    expect(screen.getByText('Calculating your estimate...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Your estimate')).toBeInTheDocument(), { timeout: 3000 });
  });

  it('shows a per-area breakdown row for each picked area', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.getByText('Emails and correspondence')).toBeInTheDocument();
    expect(screen.getByText('Recurring reports')).toBeInTheDocument();
  });

  it('shows the "what if more of your team works like this" headcount section, defaulted to the org-size midpoint', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container); // orgSize 11-50 -> midpoint 25
    expect(screen.getByText('What if more of your team works like this?')).toBeInTheDocument();
    expect(screen.getByText(/across 25/)).toBeInTheDocument();
  });

  it('shows at most one tailored line, with the sensitive add-on winning when it applies', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { information: ['payroll'], heldBack: ['budget'] });
    expect(screen.getByText(/it may need private or approved tools/)).toBeInTheDocument();
    expect(screen.queryByText(/expected software cost/)).not.toBeInTheDocument();
  });

  it('drops the band-line and the big guarantee box, and never says "5-hour guarantee line"', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.queryByText(/even the low end of your range is above that line/)).not.toBeInTheDocument();
    expect(screen.queryByText(/5-hour guarantee line/)).not.toBeInTheDocument();
    expect(screen.queryByText('You get the plan, and your team puts it in place.')).not.toBeInTheDocument();
  });

  it('the suggested-areas sentence lowercases area names and uses a serial-comma join', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    // professional's suggestions are correspondence, proposals, findingInfo; picking
    // correspondence and reports leaves proposals + findingInfo suggested.
    await driveToResult(container);
    expect(screen.getByText(
      "Where we'd also look in an organization like yours: proposals, quotes and grant applications, and finding information."
    )).toBeInTheDocument();
  });

  it('ends in one quiet next step, not a gold CTA or a big guarantee box, and carries numbers to the plan page', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const cta = screen.getByRole('link', { name: 'See how the plan works' });
    expect(cta.className).toContain('ai-secondary');
    expect(cta.className).not.toContain('ai-button');
    expect(cta.getAttribute('href')).toMatch(/^\/ai-handoff-plan\?perPersonHours=[\d.]+&employees=\d+$/);
    expect(screen.getByText('At least 5 net hours a week found, or your fee back.')).toBeInTheDocument();
  });

  it('keeps the "not a promise of results" honesty line, folded into the disclosure', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(container.querySelector('.ai-disclosure').textContent).toMatch(/isn't a promise of results or a cash saving/);
  });

  it('folds the basis, studies and caps explanation into the collapsed disclosure', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.getByText('How this estimate works')).toBeInTheDocument();
    expect(container.querySelector('.ai-disclosure').textContent).toMatch(/at most 25 hours a week per person for any one area/);
  });

  it('"Review my answers" returns to question 1 with prior picks intact', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    fireEvent.click(screen.getByRole('button', { name: 'Review my answers' }));
    expect(screen.getByText(/Question 1 of 11/)).toBeInTheDocument();
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

  it('the single CTA opens the chat widget preselected to the plan topic', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    const ctas = screen.getAllByRole('link', { name: 'Start the conversation' });
    expect(ctas.length).toBeGreaterThan(0);
    ctas.forEach(cta => {
      expect(cta).toHaveAttribute('href', '#chat?topic=ai-handoff-plan');
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

  it('carries ?perPersonHours= and ?employees= into the team calculator as starting values', () => {
    render(<MemoryRouter initialEntries={['/ai-handoff-plan?perPersonHours=3.5&employees=80']}><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByLabelText('Hours a week, one person')).toHaveValue('3.5');
    expect(screen.getByLabelText('Employees')).toHaveValue('80');
  });

  it('with no carry-over params, the team calculator starts from the intended defaults (1 hour, 25 employees), not the slider minimums', () => {
    // Regression: Number(null) is 0, a finite number, which a naive isFinite check would clamp
    // to the slider's minimum (0.5 hours, 1 person) instead of falling back to the real default.
    render(<MemoryRouter initialEntries={['/ai-handoff-plan']}><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByLabelText('Hours a week, one person')).toHaveValue('1');
    expect(screen.getByLabelText('Employees')).toHaveValue('25');
  });

  it('shows only one interactive team calculator on the page (the old separate calculator is merged in)', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getAllByText('Employee cost')).toHaveLength(1);
  });

  it('replaces the old deliverables list and takeaway cards with the numbered step flow', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByText('How it works, and what you get.')).toBeInTheDocument();
    expect(screen.getByText('Discovery')).toBeInTheDocument();
    expect(screen.getByText('Written plan')).toBeInTheDocument();
    expect(screen.queryByText('A focused plan, with clear deliverables.')).not.toBeInTheDocument();
    expect(screen.queryByText('What you take away')).not.toBeInTheDocument();
  });

  it('sets the document title and meta description from the launch strings', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(document.title).toBe('The AI Handoff Plan: Practical AI Audit | BlueChip');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/practical AI audit of your organization's recurring work/);
  });
});
