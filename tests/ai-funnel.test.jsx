import { fireEvent, render, screen, cleanup, within, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import { questions } from '../src/lib/aiOpportunity';

// The check now keeps its state in sessionStorage (item 59), so every test starts from a clean tab.
afterEach(() => { cleanup(); sessionStorage.clear(); });

// A complete, non-sensitive, mid-size answer set used to drive the stepper to the end quickly.
// No "workload" entry: Q5 was merged into Q2 (an hours/people row per picked area, defaulting
// to 5 hours and 1 person, which is enough for most of these tests).
const READY = {
  orgType: 'professional',
  areas: ['correspondence', 'reports'],
  toolsToday: ['m365'],
  aiTools: ['none'],
  information: ['public'],
  protectInfo: ['ownDevices'],
  readiness: 'yesHaveSomeone',
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
  it('is 12 questions, with no mention of the plan, price or guarantee before the result', () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText('How much time could AI give back to your team?')).toBeInTheDocument();
    expect(screen.getByText('Find out roughly how many hours a week AI could give your team back. About three minutes, no email.')).toBeInTheDocument();
    expect(screen.getByText('Question 1 of 12. 0 of 12 completed.')).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText('Question 2 of 12. 1 of 12 completed.')).toBeInTheDocument());
    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).toBeDisabled();
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(next).not.toBeDisabled();
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]')); // toggle off
    expect(next).toBeDisabled();
  });

  it('stops picking once Q2 reaches its 6-area cap', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    const six = ['correspondence', 'reports', 'meetingNotes', 'findingInfo', 'scheduling', 'invoicing'];
    six.forEach(v => fireEvent.click(container.querySelector(`input[name="areas"][value="${v}"]`)));
    fireEvent.click(container.querySelector('input[name="areas"][value="hiring"]'));
    expect(container.querySelector('input[name="areas"][value="hiring"]')).not.toBeChecked();
    six.forEach(v => expect(container.querySelector(`input[name="areas"][value="${v}"]`)).toBeChecked());
  });

  // Infy edit (2026-09-24): dropped the leading "Up to six." from the helper note -- the Q2
  // question label itself already says "Pick up to six", so the note no longer repeats it.
  it('Q2\'s helper note no longer repeats the pick count, since the question label already says it', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    expect(screen.getByText('Where would you most like time back? Pick up to six.')).toBeInTheDocument();
    expect(screen.getByText('Each one you pick gets its own hours and people below.')).toBeInTheDocument();
    expect(screen.queryByText(/^Up to six\./)).not.toBeInTheDocument();
  });

  it('offers the new "Answering staff questions" Q2 tile', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    expect(container.querySelector('input[name="areas"][value="staffQuestions"]')).toBeInTheDocument();
    expect(screen.getByText('Answering staff questions (policies, onboarding, how-to)')).toBeInTheDocument();
  });

  it('shows the "count everyone" helper line under a picked area\'s people stepper', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(screen.getByText('Count everyone at your organization who does this, not just you.')).toBeInTheDocument();
  });

  it('ticking a Q2 area reveals an inline hours slider and people stepper, defaulting to 5 hours and 1 person', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(screen.getByText(/hours a week back, so far\./)).toBeInTheDocument();
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '20' } });
    // more hours -> a bigger live-preview range than the 5-hour default produced
    expect(container.querySelector('#hours-correspondence')).toHaveValue('20');
    fireEvent.click(screen.getByRole('button', { name: 'More people' }));
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('the hours label is reworded and renders as plain text, not a bordered tile-styled box', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(screen.getByText('Hours a week one person spends on this')).toBeInTheDocument();
    expect(screen.queryByText('Hours a week, one person')).not.toBeInTheDocument();
    const label = container.querySelector('label[for="hours-correspondence"]');
    expect(label.className).toBe('ai-hours-field-label'); // not a .ai-tile-wrap/.ai-options label
  });

  it('the people-count label is dynamic, uses the live hours value, is singular at exactly 1, and falls back at 0', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    expect(screen.getByText('People at your organization who spend about 5 hrs a week on this')).toBeInTheDocument();
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '12' } });
    expect(screen.getByText('People at your organization who spend about 12 hrs a week on this')).toBeInTheDocument();
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '1' } });
    expect(screen.getByText('People at your organization who spend about 1 hr a week on this')).toBeInTheDocument();
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '0' } });
    expect(screen.getByText('People at your organization who spend time on this')).toBeInTheDocument();
  });

  it('shows a per-area breakdown line with the rate percentages under the live-preview total, plus the honesty note', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(container.querySelector('input[name="areas"][value="proposals"]'));
    // Reproduces Thomas's exact reported scenario: both areas at the default 5 hrs x 1 person.
    expect(screen.getByText('About 1.0 to 2.0 hours a week back, so far.')).toBeInTheDocument();
    const detail = container.querySelector('.ai-live-preview-detail');
    expect(within(detail).getByText(/Emails and correspondence: 5 hrs × 1 person × 12% to 22% = 0.6 to 1.1 hrs back a week/)).toBeInTheDocument();
    expect(within(detail).getByText(/Proposals, quotes and grant applications: 5 hrs × 1 person × 8% to 18% = 0.4 to 0.9 hrs back a week/)).toBeInTheDocument();
    expect(within(detail).getByText('The percentages are the share of that time AI can realistically save after someone checks its work.')).toBeInTheDocument();
  });

  it('the Back button returns to the previous question and is disabled on question 1', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled();
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
  });

  it('walks all 12 questions through the loading screen to a dashboard result', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(container.querySelector('.ai-result-headline').textContent).toMatch(/About \d+ to \d+ hours a week/);
    expect(screen.getByText('across the areas you picked')).toBeInTheDocument();
    const mainTiles = container.querySelector('.ai-stat-tiles');
    expect(within(mainTiles).getByText('Hours a week')).toBeInTheDocument();
    expect(within(mainTiles).getByText('Hours a year')).toBeInTheDocument();
    expect(within(mainTiles).getByText('Potential staff time value')).toBeInTheDocument();
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
    const breakdown = container.querySelector('.ai-area-breakdown');
    expect(within(breakdown).getByText('Emails and correspondence')).toBeInTheDocument();
    expect(within(breakdown).getByText('Recurring reports')).toBeInTheDocument();
  });

  it('shows the "what if more of your team works like this" headcount section, defaulted to the org-size midpoint', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container); // orgSize 11-50 -> midpoint 25
    expect(screen.getByText('What if more of your team works like this?')).toBeInTheDocument();
    expect(screen.getByText(/across 25/)).toBeInTheDocument();
  });

  // READY's defaults (correspondence + reports, 5 hrs/1 person each) net a likely total of
  // 5*0.22 + 5*0.18 = 2.0 hrs/week, under the 3-hour guarantee line.
  it('shows the honest under-guarantee line when the likely total is under 3 hrs/week', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.getByText('This counts only the people you entered. When several people do the same task, the hours can add up quickly, and the team slider below shows what that looks like.')).toBeInTheDocument();
  });

  it('hides the honest under-guarantee line once the likely total reaches 3 hrs/week', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.change(container.querySelector('#hours-correspondence'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'More people' })); // 1 -> 2 people
    fireEvent.click(container.querySelector('input[name="areas"][value="reports"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText(/Question 3 of 12/)).toBeInTheDocument());
    for (const q of questions.slice(2)) {
      await answerCurrentQuestion(container, q.id, READY[q.id], q.number === questions.length);
    }
    // 20 hrs x 2 people x 0.22 (correspondence, likely) + 5 x 1 x 0.18 (reports, likely) = 9.7
    expect(screen.queryByText(/This counts only the people you entered/)).not.toBeInTheDocument();
  });

  it('shows the "Information handling" look-at card when sensitive information has weak protection', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { information: ['payroll'], protectInfo: ['nothingFormal'] });
    expect(screen.getByText('Information handling')).toBeInTheDocument();
  });

  it('does not show the "Information handling" card when nothing is sensitive', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { information: ['public'], heldBack: ['budget'] });
    expect(screen.queryByText('Information handling')).not.toBeInTheDocument();
  });

  it('drops the band-line and the big guarantee box, and never says "5-hour guarantee line"', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.queryByText(/even the low end of your range is above that line/)).not.toBeInTheDocument();
    expect(screen.queryByText(/5-hour guarantee line/)).not.toBeInTheDocument();
    expect(screen.queryByText('You get the plan, and your team puts it in place.')).not.toBeInTheDocument();
  });

  it('the suggested-areas sentence lowercases area names, uses a serial-comma join, and folds into the lookout section as "Also worth a look"', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    // professional's suggestions are correspondence, proposals, findingInfo; picking
    // correspondence and reports leaves proposals + findingInfo suggested.
    await driveToResult(container);
    expect(screen.queryByText(/Where we'd also look/)).not.toBeInTheDocument();
    const lookout = container.querySelector('.ai-lookout-section');
    expect(within(lookout).getByText(
      "Also worth a look: proposals, quotes and grant applications, and finding information."
    )).toBeInTheDocument();
  });

  it('ends in one quiet next step, not a gold CTA or a big guarantee box, and carries numbers to the plan page', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const cta = screen.getByRole('link', { name: 'See how the plan works' });
    expect(cta.className).toContain('ai-secondary');
    expect(cta.className).not.toContain('ai-button');
    expect(cta.getAttribute('href')).toMatch(/^\/ai-handoff-plan\?perPersonHours=[\d.]+&employees=\d+$/);
    expect(screen.getByText('At least 3 net hours a week found across your organization, or your fee back.')).toBeInTheDocument();
  });

  it('keeps the "not a promise of results" honesty line, folded into the disclosure', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(container.querySelector('.ai-disclosure').textContent).toMatch(/not a promise of results or a cash saving/);
  });

  it('folds the basis, studies and caps explanation into the collapsed disclosure', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(screen.getByText('How this estimate works')).toBeInTheDocument();
    expect(container.querySelector('.ai-disclosure').textContent).toMatch(/at most 25 hours a week per person for any one area/);
  });

  // Rewritten 2026-09-24: org size (Q7) no longer affects the estimate, so the disclosure no
  // longer names a team size or org-size band anywhere in its text.
  it('the disclosure never mentions org size or a team-size band', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { orgSize: '201-500' });
    const text = container.querySelector('.ai-disclosure').textContent;
    expect(text).not.toMatch(/team of/i);
    expect(text).not.toMatch(/201-500|201 to 500/);
  });

  it('uses the exact verbatim explainer text (for Infy review)', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    expect(container.querySelector('.ai-disclosure p').textContent).toBe(
      "For each area you picked, we take the hours one person spends on it each week, multiply by the number of people who do that work, then multiply by the share of that time AI can realistically save. That share comes from published studies of similar work, minus an allowance for checking the tools' work. Where no study matches closely, or you typed your own area, we use our most conservative rate. Then we add the areas together. To keep it realistic, we count at most 25 hours a week per person for any one area, and 30 hours a week per person across all areas. The dollar figure uses the hourly cost and working weeks shown above. It's an estimate, not a promise of results or a cash saving."
    );
  });

  it('"Review my answers" returns to question 1 with prior picks intact', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    fireEvent.click(screen.getByRole('button', { name: 'Review my answers' }));
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
    expect(container.querySelector('input[name="orgType"][value="professional"]')).toBeChecked();
  });

  it('ticking "Other (type your own)" on Q2 reveals a label field, and the result bar uses the typed label as plain text', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { areas: ['otherArea'] });
    // Not driven through the label field by driveToResult (it only clicks tile inputs), so the
    // bar falls back to "Other work" here; the label field itself is exercised in the next test.
    // Scoped to the bar breakdown: the same fallback title also appears on its "what we'd look
    // at" card, so an unscoped query would find two matches.
    const breakdown = container.querySelector('.ai-area-breakdown');
    expect(within(breakdown).getByText('Other work')).toBeInTheDocument();
  });

  it('typing an Other-area label carries it onto the result bar, escaped as plain text (never rendered as markup)', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    const answers = { ...READY, areas: ['otherArea'] };
    for (const q of questions) {
      if (q.id === 'areas') {
        fireEvent.click(container.querySelector('input[name="areas"][value="otherArea"]'));
        const labelInput = container.querySelector('#other-area-label');
        expect(labelInput).toBeInTheDocument();
        fireEvent.change(labelInput, { target: { value: '<img src=x onerror=alert(1)>grant reporting' } });
        fireEvent.click(screen.getByRole('button', { name: 'Next' }));
        await waitFor(() => expect(screen.getByText(/Question 3 of 12/)).toBeInTheDocument());
      } else {
        await answerCurrentQuestion(container, q.id, answers[q.id], q.number === questions.length);
      }
    }
    expect(container.querySelector('.ai-area-breakdown').textContent).toContain('img src=x onerror=alert(1)grant reporting');
    expect(container.querySelector('.ai-area-breakdown img')).not.toBeInTheDocument();
  });

  it('"Other (type your own)" never appears in the "Where we\'d also look" suggestion sentence', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { areas: ['otherArea'] });
    const suggestion = screen.queryByText(/Where we'd also look/);
    if (suggestion) expect(suggestion.textContent).not.toMatch(/other \(type your own\)/i);
  });

  it('Q3 has the full 10-option tools list, and "Other" reveals an optional, sanitized text field', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText(/Question 3 of 12/)).toBeInTheDocument());
    ['Microsoft 365', 'Google Workspace', 'Accounting software', 'HR or payroll software',
      'Industry software (for example practice management, ERP or CRM)',
      'Project or task management (for example Asana, Monday or Trello)',
      'Chat and video calls (for example Slack or Zoom)',
      'Design and document tools (for example Canva or Adobe)',
      'Other (type your own)', 'Not sure',
    ].forEach(name => expect(screen.getByText(name)).toBeInTheDocument());

    expect(container.querySelector('#tools-other-text')).not.toBeInTheDocument();
    fireEvent.click(container.querySelector('input[name="toolsToday"][value="toolsOther"]'));
    const otherInput = container.querySelector('#tools-other-text');
    expect(otherInput).toBeInTheDocument();
    fireEvent.change(otherInput, { target: { value: '<b>Notion</b>' } });
    expect(screen.getByText('You said: bNotion/b')).toBeInTheDocument();
    expect(container.querySelector('.ai-other-label-field b')).not.toBeInTheDocument();
    // Optional: Next is still enabled with just toolsOther picked, no text required.
    expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
  });

  it('the AI-tools question (Q4) groups its options under three headings plus an ungrouped "None yet"', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText(/Question 3 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="toolsToday"][value="m365"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText(/Question 4 of 12/)).toBeInTheDocument());
    expect(screen.getByText('General assistants')).toBeInTheDocument();
    expect(screen.getByText('Built into Microsoft or Google')).toBeInTheDocument();
    expect(screen.getByText('Meeting and other')).toBeInTheDocument();
    ['DeepSeek', 'Kimi', 'Perplexity', 'Grok', 'Meta AI', 'Mistral Le Chat'].forEach(name =>
      expect(screen.getByText(name)).toBeInTheDocument());
  });

  it('Q9 "Someone else" reveals an optional text field, escaped as plain text', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    for (const q of questions) {
      if (q.id === 'owner') break;
      await answerCurrentQuestion(container, q.id, READY[q.id], false);
    }
    expect(screen.getByText(/Who usually leads new tools or process changes/)).toBeInTheDocument();
    expect(container.querySelector('#owner-other-text')).not.toBeInTheDocument();
    fireEvent.click(container.querySelector('input[name="owner"][value="someoneElse"]'));
    const otherInput = container.querySelector('#owner-other-text');
    expect(otherInput).toBeInTheDocument();
    fireEvent.change(otherInput, { target: { value: '<b>finance lead</b>' } });
    expect(screen.getByText('You said: bfinance lead/b')).toBeInTheDocument();
    expect(container.querySelector('.ai-other-label-field b')).not.toBeInTheDocument();
  });

  it('Q9 includes "We\'d want outside guidance" alongside the existing options', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    for (const q of questions) {
      if (q.id === 'owner') break;
      await answerCurrentQuestion(container, q.id, READY[q.id], false);
    }
    expect(container.querySelector('input[name="owner"][value="outsideGuidance"]')).toBeInTheDocument();
    expect(screen.getByText("We'd want outside guidance")).toBeInTheDocument();
  });

  it('asks the new "protect sensitive information" question right after the information question', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    for (const q of questions) {
      if (q.id === 'protectInfo') break;
      await answerCurrentQuestion(container, q.id, READY[q.id], false);
    }
    expect(screen.getByText('What do you currently do to protect sensitive information? Pick all that apply.')).toBeInTheDocument();
  });

  it('the area-hours slider shows tick marks at 0/5/10/15/20/25 and its max stays 25, not 20', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    const slider = container.querySelector('#hours-correspondence');
    expect(slider).toHaveAttribute('max', '25');
    const wrapper = slider.closest('.ai-gold-slider');
    const labels = Array.from(wrapper.querySelectorAll('.ai-slider-tick-label')).map(el => el.textContent);
    expect(labels).toEqual(['0', '5', '10', '15', '20', '25']);
  });

  it('PageUp/PageDown step the hours slider by 5, clamped to the 0-25 range', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    const slider = container.querySelector('#hours-correspondence');
    expect(slider).toHaveValue('5');
    fireEvent.keyDown(slider, { key: 'PageUp' });
    expect(slider).toHaveValue('10');
    fireEvent.keyDown(slider, { key: 'PageUp' });
    fireEvent.keyDown(slider, { key: 'PageUp' });
    fireEvent.keyDown(slider, { key: 'PageUp' }); // 10 -> 15 -> 20 -> 25, clamped at the real cap
    expect(slider).toHaveValue('25');
    fireEvent.keyDown(slider, { key: 'PageDown' });
    expect(slider).toHaveValue('20');
  });

  it('press-and-hold on the people stepper repeats the step after an initial delay', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));

    vi.useFakeTimers();
    const moreBtn = screen.getByRole('button', { name: 'More people' });
    fireEvent.pointerDown(moreBtn);
    act(() => { vi.advanceTimersByTime(400 + 110 * 3); }); // past the initial delay, a few repeat ticks
    fireEvent.pointerUp(moreBtn);
    vi.useRealTimers();

    const count = Number(container.querySelector('.ai-people-count').textContent);
    expect(count).toBeGreaterThan(1); // started at 1; a held press repeats, not just one step
  });

  it('a plain click on the stepper still steps exactly once (no double-step from the hold machinery)', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(screen.getByRole('button', { name: 'More people' }));
    expect(container.querySelector('.ai-people-count').textContent).toBe('2');
  });

  it('shows the main equation strip under the stat tiles, with editable weeks/rate and a low-value line under each term', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const mainEq = container.querySelectorAll('.ai-eq--result')[0];
    expect(within(mainEq).getByText('hrs/week')).toBeInTheDocument();
    expect(within(mainEq).getByText('hrs/year')).toBeInTheDocument();
    expect(within(mainEq).getByText('a year, potential staff time value')).toBeInTheDocument();
    expect(within(mainEq).getAllByText(/up to/).length).toBe(3); // hrs/week, hrs/year, the total
    const weeksInput = within(mainEq).getByLabelText('Working weeks a year');
    expect(weeksInput).toHaveValue(48);
    fireEvent.change(weeksInput, { target: { value: '50' } });
    expect(weeksInput).toHaveValue(50);
    const rateInput = within(mainEq).getByLabelText('Employee cost per hour');
    expect(rateInput).toHaveValue(40);
  });

  it('shows a second equation strip in the headcount section, live from the headcount slider', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const headcountSection = container.querySelector('.ai-headcount-section');
    const eq = headcountSection.querySelector('.ai-eq--result');
    expect(eq).toBeTruthy();
    expect(within(eq).getByText('hrs/week, per person')).toBeInTheDocument();
    expect(within(eq).getByText('people')).toBeInTheDocument();
    expect(within(eq).getByText('25')).toBeInTheDocument(); // default headcount for the 11-50 org-size band
  });

  it('shows a "Where to look" card for every picked area, plus up to 2 cross-cutting cards', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { information: ['health'], protectInfo: ['nothingFormal'] });
    const section = container.querySelector('.ai-lookout-section');
    expect(within(section).getByText('Where to look, based on your answers')).toBeInTheDocument();
    expect(within(section).getByText('Emails and correspondence')).toBeInTheDocument();
    expect(within(section).getByText('Recurring reports')).toBeInTheDocument();
    expect(within(section).getByText('Information handling')).toBeInTheDocument();
    expect(section.querySelectorAll('.ai-lookout-check').length).toBeGreaterThan(0);
  });

  it('shows exactly 3 numbered "free next steps" with a working copy button', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const section = container.querySelector('.ai-next-steps-section');
    expect(within(section).getByText('Next steps you can take this week')).toBeInTheDocument();
    expect(section.querySelectorAll('.ai-next-steps-list li').length).toBe(3);

    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    fireEvent.click(within(section).getByRole('button', { name: 'Copy these steps' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0][0]).toMatch(/^1\. .+\n2\. .+\n3\. .+$/);
    await waitFor(() => expect(within(section).getByText('Copied.')).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it('falls back gracefully when the clipboard is blocked', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const section = container.querySelector('.ai-next-steps-section');
    const writeText = vi.fn().mockRejectedValue(new Error('blocked'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    fireEvent.click(within(section).getByRole('button', { name: 'Copy these steps' }));
    await waitFor(() => expect(within(section).getByText(/Couldn.t copy automatically/)).toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it('never names a specific AI tool or vendor anywhere on the free result', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container, { aiTools: ['copilot'], readiness: 'notYetReady', information: ['health'], protectInfo: ['nothingFormal'] });
    const vendors = /chatgpt|microsoft copilot|google gemini|claude|deepseek|kimi|perplexity|grok|meta ai|mistral/i;
    const resultBody = container.querySelector('main');
    expect(resultBody.textContent).not.toMatch(vendors);
  });

  it('moves focus to the result h1, not the eyebrow, and the eyebrow carries no tabIndex/ref', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    const h1 = container.querySelector('.ai-result-headline');
    await waitFor(() => expect(h1).toHaveFocus()); // the focus() call is scheduled via setTimeout(0)
    const eyebrow = container.querySelector('.ai-eyebrow');
    expect(eyebrow.textContent).toBe('Your estimate');
    expect(eyebrow).not.toHaveAttribute('tabindex');
  });
});

describe('the free check keeps a result across navigation (item 59)', () => {
  function PlanStub() {
    return <div><p>Plan page stub</p><Link to="/ai-opportunity-check">Back to my results</Link></div>;
  }
  function RoutedCheck() {
    return <MemoryRouter initialEntries={['/ai-opportunity-check']}>
      <Routes>
        <Route path="/ai-opportunity-check" element={<AiOpportunityCheck />} />
        <Route path="/ai-handoff-plan" element={<PlanStub />} />
      </Routes>
    </MemoryRouter>;
  }

  it('clicking "See how the plan works" and coming back shows the same result, not question 1', async () => {
    const { container } = render(<RoutedCheck />);
    await driveToResult(container);
    const headline = container.querySelector('.ai-result-headline').textContent;
    fireEvent.click(screen.getByRole('link', { name: 'See how the plan works' }));
    expect(screen.getByText('Plan page stub')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: 'Back to my results' }));
    await waitFor(() => expect(container.querySelector('.ai-result-headline')).toBeInTheDocument());
    expect(container.querySelector('.ai-result-headline').textContent).toBe(headline);
    expect(screen.queryByText(/Question 1 of 12/)).not.toBeInTheDocument();
  });

  it('a reload (fresh mount in the same tab) restores the result, including edited rate and weeks', async () => {
    const { container, unmount } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    fireEvent.change(screen.getByLabelText('Working weeks a year'), { target: { value: '44' } });
    unmount();
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText('Your estimate')).toBeInTheDocument();
    expect(screen.getByLabelText('Working weeks a year')).toHaveValue(44);
  });

  it('an unfinished check resumes on the question the visitor was on', async () => {
    const { container, unmount } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="trades"]'));
    await waitFor(() => expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument());
    unmount();
    const again = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText(/Question 2 of 12/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(again.container.querySelector('input[name="orgType"][value="trades"]')).toBeChecked();
  });

  it('"Start over" clears the saved session and returns to an empty question 1', async () => {
    const { container, unmount } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    await driveToResult(container);
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
    expect(container.querySelector('input[name="orgType"][value="professional"]')).not.toBeChecked();
    unmount();
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText(/Question 1 of 12\. 0 of 12 completed/)).toBeInTheDocument();
  });

  it('ignores a corrupt saved session instead of crashing', () => {
    sessionStorage.setItem('bluechip:ai-opportunity-check:session', '{not json');
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText(/Question 1 of 12/)).toBeInTheDocument();
  });

  it('the intro note says answers stay in this tab, not that they clear on reload', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    expect(screen.getByText("Your answers stay in this browser tab until you close it. Please don't enter confidential information.")).toBeInTheDocument();
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

  it('pins the guarantee at 3 net hours a week, with the illustration recalculated (3 x 48 = 144 hrs, x C$40 = C$5,760)', () => {
    const { container } = render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(screen.getByText("We'll find at least 3 net hours a week of AI time savings, or your fee back.")).toBeInTheDocument();
    expect(screen.getByText('What three hours a week adds up to')).toBeInTheDocument();
    const eq = container.querySelector('.ai-eq');
    expect(eq).toHaveAttribute('aria-label', '3 net hours a week times 48 working weeks equals 144 hours a year; at C$40 an hour that is C$5,760 a year in potential staff capacity.');
    expect(within(eq).getByText('144')).toBeInTheDocument();
    expect(within(eq).getByText('C$5,760')).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/9,600|\b240\b|5 net hours|five net hours/);
    expect(screen.getByText('C$999, taxes included')).toBeInTheDocument();
  });

  it('sets the document title and meta description from the launch strings', () => {
    render(<MemoryRouter><AiHandoffPlanPage /></MemoryRouter>);
    expect(document.title).toBe('The AI Handoff Plan: Practical AI Audit | BlueChip');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/practical AI audit of your organization's recurring work/);
  });
});
