import { cleanup, render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import App from '../src/App';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';
import { saveCheckSession } from '../src/lib/freeCheckSession';
import {
  RATE_TABLE, AREA_RATE_MAP, wholeHoursRange, totalHoursRangeLabel, totalHoursSentence, topTimeArea, fitSignalReached,
  computeRange,
} from '../src/lib/aiOpportunity';
import { formatVisitorConfirmation } from '../api/_lib/lead-helpers.js';
import vercelConfig from '../vercel.json';

afterEach(() => { cleanup(); sessionStorage.clear(); window.history.pushState({}, '', '/'); });

const renderEdition = (path) => {
  const edition = path.endsWith('public-sector') ? 'public-sector' : 'general';
  return render(<MemoryRouter initialEntries={[path]}><AiHandoffPlanPage edition={edition} /></MemoryRouter>);
};

// The strings the release retires, on every visitor-facing surface.
const RETIRED = [
  /taxes? included/i, /including applicable tax/i, /introductory/i, /C\$999/, /C\$595/, /Implementation Sprint/i,
  /roadmap/i, /5,760/, /AI Opportunity Check/, /AI Capacity Check/, /—/, /org(anization)? architecture/i,
];

describe('plan page: order, both editions', () => {
  it.each([['/ai-handoff-plan'], ['/ai-handoff-plan/public-sector']])('runs lead, example, box, safety net, then Start the conversation on %s', (path) => {
    const { container } = renderEdition(path);
    const headline = container.querySelector('.plan-headline');
    const example = container.querySelector('.plan-example');
    const box = screen.getByRole('heading', { name: 'What you get for C$795' }).closest('section');
    const safety = container.querySelector('.plan-safety');
    const cta = within(safety).getByRole('link', { name: 'Start the conversation' });
    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(headline, example)).toBe(true);
    expect(follows(example, box)).toBe(true);
    expect(follows(box, safety)).toBe(true);
    // the button is the last thing inside the safety-net block, after the definitions and the Refund Policy reference
    expect(follows(within(safety).getByText(/Net means the hours saved each week/), cta)).toBe(true);
    expect(follows(within(safety).getByRole('link', { name: 'Refund Policy' }), cta)).toBe(true);
  });

  it.each([['/ai-handoff-plan'], ['/ai-handoff-plan/public-sector']])('carries none of the retired strings on %s, and never a bare "the plan"', (path) => {
    const { container } = renderEdition(path);
    RETIRED.forEach(re => expect(container.textContent).not.toMatch(re));
    // "the plan" is allowed only as part of "the AI Handoff Plan" (capital P) or "your AI plan"
    expect(container.textContent.replace(/the AI Handoff Plan/gi, '')).not.toMatch(/\bthe plan\b/i);
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).not.toMatch(/taxes|introductory/i);
    expect(document.title).not.toMatch(/Practical AI Audit/);
  });

  it('shows the price once as C$795 in the box heading and never the old prices', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: 'What you get for C$795' })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/C\$(595|999)/);
    // the only other C$795 is the retainer credit sentence
    expect((container.textContent.match(/C\$795/g) || []).length).toBe(2);
  });
});

describe('plan page: lead, example, box and safety net text', () => {
  it('leads with capacity across people and labels the example, in hours only', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: 'Most teams have one piece of routine work that quietly adds up to hours every week. Which one is yours?' })).toBeInTheDocument();
    expect(container.querySelector('.glass-lede').textContent).toMatch(/so it rarely gets added up/);
    expect(container.querySelector('.glass-lede').textContent).toMatch(/An hour a week each doesn't sound like much until you count the people, and what you do with that time is your call\.$/);
    const example = container.querySelector('.plan-example');
    expect(within(example).getByText('An example')).toBeInTheDocument();
    expect(example.textContent).toContain("Say 5 people do that work, and your AI plan finds a change that could give each of them an hour a week, after checking the AI's work.");
    expect(example.textContent).toContain("That's 5 hours a week across your team, about 240 hours over a working year.");
    expect(example.textContent).toContain("With 12 people, it's 12 hours a week, about 15 working weeks of time a year.");
    expect(example.textContent).toContain("It's an example to show the scale, not a promise or a client result.");
    expect(example.textContent).toContain('Based on 48 working weeks a year and a 37.5-hour week.');
    expect(example.textContent).not.toMatch(/C\$|\$/);
  });

  it('puts the edition guardrail right after the example', () => {
    const general = renderEdition('/ai-handoff-plan').container.querySelector('.plan-example .plan-guardrail').textContent;
    expect(general).toMatch(/^AI doesn't replace your people's judgment on people decisions\./);
    cleanup();
    const municipal = renderEdition('/ai-handoff-plan/public-sector').container.querySelector('.plan-example .plan-guardrail').textContent;
    expect(municipal).toMatch(/^AI doesn't replace CAO judgment, council governance, or your privacy and records requirements\./);
    expect(municipal).toMatch(/not positions to cut/);
  });

  it('lists the seven inclusions in box order, with Your time and Not included, and no guarantee line inside the box', () => {
    renderEdition('/ai-handoff-plan');
    const box = screen.getByRole('heading', { name: 'What you get for C$795' }).closest('section');
    const items = within(box).getAllByRole('listitem').map(li => li.textContent);
    expect(items).toHaveLength(7);
    expect(items[0]).toBe('A 60-minute discovery session with up to two of the people who do the work');
    expect(items[1]).toMatch(/^A written plan within five business days of having what it needs: which parts of the workflow AI can take on and which stay with your people, how the hours add up across the people who do it/);
    expect(items[2]).toMatch(/^A starter kit/);
    expect(items[3]).toBe('A one-page summary for whoever signs off');
    expect(items[4]).toMatch(/^A simple hours tracker for the people doing the work/);
    expect(items[5]).toMatch(/^A 45-minute findings and setup call, where the first step gets set up in a tool you already allow, or, if none fits yet, the IT request gets written and ready to send/);
    expect(items[6]).toBe('A 15-minute check-in about 30 days later');
    expect(box.textContent).toMatch(/Your time: a short conversation with you before we start/);
    expect(box.textContent).toMatch(/Not included: software and licences, anything your IT team installs, rolling the change out to the rest of the team, and any other workflow\./);
    expect(box.textContent).not.toMatch(/guarantee|full fee/i);
  });

  it('shows "Your safety net" in the page, at body size, with its definitions, never behind a link or a details block', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    const safety = container.querySelector('.plan-safety');
    expect(safety.closest('details')).toBeNull();
    expect(safety.textContent).toContain("Your safety net: if your AI plan can't show at least 3 net hours a week in total across the people who do that workflow, your full fee comes back automatically within 10 business days of your findings call. No forms, no hoops.");
    expect(safety.textContent).toContain("It's a promise about what your AI plan finds, not about what happens afterwards.");
    expect(safety.textContent).toContain('The 3 hours are their total, not 3 hours each.');
    expect(safety.textContent).toContain('Net means the hours saved each week, minus the time it takes each week to check the AI\'s work and keep the tools running.');
    expect(within(safety).getByRole('link', { name: 'Refund Policy' })).toHaveAttribute('href', 'https://www.bluechip-people-strategies.com/refund');
    expect(safety.textContent).toMatch(/Asking doesn't book the AI Handoff Plan or take payment\./);
  });

  it('closes the retainer line on the sixty-day credit, with the conditions in the Refund Policy', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: 'What comes next is up to you' })).toBeInTheDocument();
    expect(container.textContent).toContain('You can keep your AI plan and put it in place yourself or with another provider, or ask us about ongoing help.');
    expect(container.textContent).toContain('If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice. Conditions are in our Refund Policy, section 1.');
  });
});

describe('plan page: two editions and the switch', () => {
  it('the public sector edition uses municipal wording and its own chat topic', () => {
    const { container } = renderEdition('/ai-handoff-plan/public-sector');
    expect(screen.getByRole('heading', { name: 'Council sets the priorities. Where does the time to deliver them come from?' })).toBeInTheDocument();
    expect(container.querySelector('.plan-box-opener').textContent).toMatch(/^Name one workflow your staff repeat\./);
    expect(container.querySelector('.glass-lede').textContent).toMatch(/that's time that can go back to council priorities\.$/);
    screen.getAllByRole('link', { name: 'Start the conversation' }).forEach(a => expect(a).toHaveAttribute('href', '#chat?topic=public-sector'));
    expect(document.title).toMatch(/municipalities and public bodies/);
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/^Name one workflow your staff repeat, and for C\$795/);
  });

  it('the general edition says "Pick one workflow your team repeats"', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(container.querySelector('.plan-box-opener').textContent).toMatch(/^Pick one workflow your team repeats\./);
  });

  it('a visible switch links the two editions and marks the current one in words', () => {
    renderEdition('/ai-handoff-plan');
    const nav = screen.getByRole('navigation', { name: 'Choose your edition' });
    const general = within(nav).getByRole('link', { name: /Business or nonprofit/ });
    const pub = within(nav).getByRole('link', { name: /Municipality or public body/ });
    expect(general).toHaveAttribute('aria-current', 'page');
    expect(pub).not.toHaveAttribute('aria-current');
    expect(pub).toHaveAttribute('href', '/ai-handoff-plan/public-sector');
    expect(general).toHaveAttribute('href', '/ai-handoff-plan');
    cleanup();
    renderEdition('/ai-handoff-plan/public-sector');
    const nav2 = screen.getByRole('navigation', { name: 'Choose your edition' });
    expect(within(nav2).getByRole('link', { name: /Municipality or public body/ })).toHaveAttribute('aria-current', 'page');
  });

  it('the header keeps The AI Handoff Plan current on the public sector page', () => {
    renderEdition('/ai-handoff-plan/public-sector');
    const nav = screen.getByRole('navigation', { name: 'AI pages' });
    expect(within(nav).getByRole('link', { name: 'The AI Handoff Plan' })).toHaveAttribute('aria-current', 'page');
  });

  it('serves the public sector page at its route and redirects /ai-handoff-plan/municipal there', () => {
    window.history.pushState({}, '', '/ai-handoff-plan/municipal?workflow=reporting');
    render(<App />);
    expect(window.location.pathname).toBe('/ai-handoff-plan/public-sector');
    expect(window.location.search).toBe('?workflow=reporting');
    expect(screen.getByRole('heading', { name: 'Council sets the priorities. Where does the time to deliver them come from?' })).toBeInTheDocument();
    const r = vercelConfig.redirects.find(x => x.source === '/ai-handoff-plan/municipal');
    expect(r).toEqual({ source: '/ai-handoff-plan/municipal', destination: '/ai-handoff-plan/public-sector', permanent: true });
  });
});

describe('AI Pulse: the rename', () => {
  const ANSWERS = {
    orgType: 'professional', areas: ['correspondence'], toolsToday: ['m365'], aiTools: ['none'], information: ['public'],
    protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone', orgSize: '11-50', owner: 'exec', heldBack: ['nothing'],
    feel: 'keen', timing: 'thisMonth',
  };
  function showResult(area, hours, people, answers = {}) {
    saveCheckSession({ answers: { ...ANSWERS, areas: [area], ...answers }, step: 'result', headcount: 1, areaInputs: { [area]: { hours, people } } });
    return render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>).container;
  }

  it('names the check AI Pulse in its heading, title and meta, and keeps the old route', () => {
    sessionStorage.clear();
    const { container } = render(<MemoryRouter initialEntries={['/ai-opportunity-check']}><AiOpportunityCheck /></MemoryRouter>);
    expect(container.querySelector('.ai-intro-eyebrow').textContent).toBe('Free AI Pulse');
    expect(document.title).toBe('AI Pulse: a free AI check | BlueChip');
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/hours a week AI could give your team back/);
    RETIRED.forEach(re => expect(container.textContent).not.toMatch(re));
  });

  it('shows the print header and the result with no trace of the old name', () => {
    const container = showResult('correspondence', 5, 1);
    expect(container.querySelector('.ai-fc-print-head').textContent).toMatch(/AI Pulse results/);
    expect(container.textContent).not.toMatch(/Opportunity Check/);
  });
});

describe('AI Pulse result: top lines, rounding, gap line and fit signal', () => {
  const ANSWERS = {
    orgType: 'professional', toolsToday: ['m365'], aiTools: ['none'], information: ['public'],
    protectInfo: ['ownDevices'], readiness: 'yesHaveSomeone', orgSize: '11-50', owner: 'exec', heldBack: ['nothing'],
    feel: 'keen', timing: 'thisMonth',
  };
  function showResult(areaInputs) {
    saveCheckSession({ answers: { ...ANSWERS, areas: Object.keys(areaInputs) }, step: 'result', headcount: 1, areaInputs });
    return render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>).container;
  }
  const FIT = 'With this many hours across your team, this looks like a good place to start.';

  it('opens with "Where the most time goes" (most hours x people) and "One thing to try this week"', () => {
    // reports: 5 x 1 = 5 team hours; findingInfo: 4 x 3 = 12 team hours -> findingInfo wins even though it was picked second
    const container = showResult({ reports: { hours: 5, people: 1 }, findingInfo: { hours: 4, people: 3 } });
    const top = container.querySelector('.ai-fc-top');
    const lines = top.querySelectorAll('.ai-fc-top-line');
    expect(lines).toHaveLength(2);
    expect(lines[0].textContent).toBe('Where the most time goes: Finding information');
    expect(lines[1].textContent).toMatch(/^One thing to try this week: Track the time spent on finding information for one week/);
    // above the hours estimate
    expect(top.compareDocumentPosition(container.querySelector('.ai-result-headline')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.textContent).not.toMatch(/time-sink|quick win/i);
  });

  it('labels the tiles as time AI could free up', () => {
    const container = showResult({ correspondence: { hours: 20, people: 2 } });
    const labels = [...container.querySelectorAll('.ai-stat-tiles')[0].querySelectorAll('.ai-stat-label')].map(n => n.textContent);
    expect(labels).toContain('Hours a week AI could free up');
    expect(labels).toContain('Hours a year AI could free up');
  });

  it('rounds the yearly tile to the nearest 10 hours and never rounds the top end up', () => {
    // correspondence 20 h x 2 people: low 4.8, likely 8.8 a week; x 48 weeks = 230.4 to 422.4 a year
    const container = showResult({ correspondence: { hours: 20, people: 2 } });
    const tiles = container.querySelectorAll('.ai-stat-tiles')[0].querySelectorAll('.ai-stat-tile strong');
    expect(tiles[0].textContent).toBe('About 5 to 8');
    expect(tiles[1].textContent).toBe('About 230 to 420');
  });

  it('shows the gap line above the plan button, naming the AI Handoff Plan first and "your AI plan" after', () => {
    const container = showResult({ correspondence: { hours: 5, people: 1 } });
    const close = container.querySelector('.ai-fc-close');
    const copy = close.querySelector('.ai-fc-close-copy');
    const gap = close.querySelector('.ai-fc-gap');
    const cta = within(close).getByRole('link', { name: 'See how the AI Handoff Plan works' });
    expect(copy.textContent).toBe("That's what the AI Handoff Plan works out, measured against your actual work.");
    expect(gap.textContent).toBe("You know roughly where the time goes. Your AI plan shows which steps AI could take on for everyone who does that work, in tools you're allowed to use, and helps your people start on the first one.");
    expect(gap.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(close.textContent).not.toMatch(/sets up the first one/);
  });

  it.each([
    ['correspondence', 6, 2, true],   // drafting area: 12 team hours reaches the line
    ['correspondence', 5, 2, false],  // 10
    ['reports', 12, 1, true],
    ['reports', 11, 1, false],
    ['findingInfo', 5, 4, true],      // other area: 20 reaches the line
    ['findingInfo', 6, 3, false],     // 18
    ['meetingNotes', 10, 2, true],    // meeting notes count with the 20-hour group
    ['meetingNotes', 6, 2, false],    // 12 is not enough for meeting notes
  ])('fit signal for %s, %s h x %s people: shown=%s, and the plan button always stays', (area, hours, people, shown) => {
    const container = showResult({ [area]: { hours, people } });
    if (shown) expect(container.textContent).toContain(FIT);
    else expect(container.textContent).not.toContain(FIT);
    expect(within(container.querySelector('main')).getByRole('link', { name: 'See how the AI Handoff Plan works' })).toBeInTheDocument();
    // the signal is a steer and never mentions the 3-hour promise
    expect(container.querySelector('.ai-fc-fit')?.textContent ?? '').not.toMatch(/3|promise|guarantee/);
  });

  it('judges the fit signal on the biggest area only', () => {
    // two small drafting areas of 8 team hours each do not add up to 12
    const container = showResult({ correspondence: { hours: 8, people: 1 }, reports: { hours: 8, people: 1 } });
    expect(container.textContent).not.toContain(FIT);
  });

  it('says "Under 1 hour a week" for a likely under 1, and never disqualifies', () => {
    const container = showResult({ scheduling: { hours: 0.5, people: 1 } });
    expect(container.querySelector('.ai-result-headline').textContent).toBe('Under 1 hour a week');
    expect(container.textContent).not.toMatch(/not qualify|don't qualify|ineligible|disqualif/i);
  });
});

describe('whole-hour rounding rules (Infy batch 3)', () => {
  it.each([
    [0.3, 0.9, 1, { kind: 'under' }],
    [0.6, 1.1, 1, { kind: 'upTo', hi: 1 }],
    [0.4, 3.7, 1, { kind: 'upTo', hi: 3 }],
    [2.4, 4.6, 1, { kind: 'range', lo: 2, hi: 4 }],
    [3.6, 3.9, 1, { kind: 'about', hi: 3 }],
    [1.5, 1.9, 1, { kind: 'about', hi: 1 }],
    [2, 2, 1, { kind: 'about', hi: 2 }],
    [96, 192, 10, { kind: 'range', lo: 100, hi: 190 }],
    [4, 8, 10, { kind: 'range', lo: 4, hi: 8 }], // yearly totals under 10 fall back to whole hours
  ])('wholeHoursRange(%s, %s, step %s)', (low, likely, step, expected) => {
    expect(wholeHoursRange(low, likely, step)).toEqual(expected);
  });

  it('never rounds the top end up, even a hair under a whole hour', () => {
    expect(wholeHoursRange(1.0, 1.9999, 1)).toEqual({ kind: 'about', hi: 1 });
    expect(wholeHoursRange(1.0, 2.0000000001, 1)).toEqual({ kind: 'range', lo: 1, hi: 2 });
    expect(wholeHoursRange(1, 2 - 1e-12, 1)).toEqual({ kind: 'range', lo: 1, hi: 2 }); // float noise under a whole hour is not a rounded-up top end
  });

  it('uses the singular only at exactly 1', () => {
    expect(totalHoursSentence(0.6, 1.1)).toBe('Up to about 1 hour a week');
    expect(totalHoursSentence(1, 1.4)).toBe('About 1 hour a week');
    expect(totalHoursSentence(2, 2.4)).toBe('About 2 hours a week');
    expect(totalHoursSentence(0.2, 0.4)).toBe('Under 1 hour a week');
    expect(totalHoursSentence(96, 192, { step: 10, period: 'a year' })).toBe('About 100 to 190 hours a year');
    expect(totalHoursRangeLabel(0.6, 3.1)).toBe('Up to about 3');
  });
});

describe('where the most time goes, and the fit rule', () => {
  const rows = (...r) => computeRange(r.map(([area, hours, people]) => ({ area, hours, people }))).rows;

  it('picks the area with the most hands-on hours (hours x people), first picked on a tie', () => {
    expect(topTimeArea(rows(['reports', 5, 1], ['findingInfo', 4, 3])).area).toBe('findingInfo');
    expect(topTimeArea(rows(['reports', 6, 1], ['correspondence', 3, 2])).area).toBe('reports');
    expect(topTimeArea([])).toBeNull();
  });

  it('does not name "Not sure yet" as the place the time goes, unless it is the only pick', () => {
    expect(topTimeArea(rows(['notSureArea', 20, 5], ['reports', 2, 1])).area).toBe('reports');
    expect(topTimeArea(rows(['notSureArea', 20, 5])).area).toBe('notSureArea');
  });

  it('the fit signal needs about 12 team hours for drafting areas and 20 for the rest', () => {
    expect(fitSignalReached(topTimeArea(rows(['correspondence', 12, 1])))).toBe(true);
    expect(fitSignalReached(topTimeArea(rows(['correspondence', 11.5, 1])))).toBe(false);
    expect(fitSignalReached(topTimeArea(rows(['staffQuestions', 20, 1])))).toBe(true);
    expect(fitSignalReached(topTimeArea(rows(['staffQuestions', 19, 1])))).toBe(false);
    expect(fitSignalReached(null)).toBe(false);
  });

  it('leaves the savings rates alone (Thomas, late 2026-10-08)', () => {
    expect(RATE_TABLE.correspondence).toMatchObject({ low: 0.12, likely: 0.22 });
    expect(RATE_TABLE.reports).toMatchObject({ low: 0.08, likely: 0.18 });
    expect(RATE_TABLE.meetings).toMatchObject({ low: 0.25, likely: 0.38 });
    expect(RATE_TABLE.search).toMatchObject({ low: 0.10, likely: 0.25 });
    expect(RATE_TABLE.floor).toMatchObject({ low: 0.05, likely: 0.15 });
    expect(AREA_RATE_MAP.meetingNotes).toBe('meetings');
  });
});

describe('chat widget answers (AI door release)', () => {
  const script = readFileSync('public/widget.js', 'utf8');
  let fetchMock;
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('style[data-bcw]').forEach(x => x.remove());
    delete window.__bcwLoaded;
    delete window.BlueChipChat;
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers();
    window.eval(script);
    if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  const flush = () => vi.advanceTimersByTime(6000);
  function ask(topicLabel, question) {
    const ui = within(document.body);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    flush();
    fireEvent.click(ui.getByRole('button', { name: 'Browse questions and answers' }));
    flush();
    fireEvent.click(ui.getByRole('button', { name: topicLabel, exact: true }));
    fireEvent.click(ui.getByRole('button', { name: question }));
    flush();
    return [...document.querySelectorAll('.bcw-msg-bot')].pop().textContent;
  }

  it('source: browse is on, and no retired string remains', () => {
    expect(script).toMatch(/var SHOW_BROWSE = true;/);
    [/taxes? included/i, /including applicable tax/i, /introductory/i, /C\$999/, /C\$595/, /5,760/, /Opportunity Check/, /Implementation Sprint/i, /roadmap/i, /—/]
      .forEach(re => expect(script).not.toMatch(re));
  });

  it('cost: C$795, no tax, a reference to Refund Policy section 1', () => {
    const a = ask('The AI Handoff Plan', 'What does the AI Handoff Plan cost?');
    expect(a).toMatch(/^C\$795 per organization\./);
    expect(a).toMatch(/not registered for GST, so no tax is added/);
    expect(a).toContain('See our Refund Policy, section 1: https://www.bluechip-people-strategies.com/refund');
  });

  it('included: the seven inclusions in box order, then what is not included', () => {
    const a = ask('The AI Handoff Plan', 'What is included?');
    const order = ['1. A 60-minute discovery session', '2. A written plan within five business days', '3. A starter kit', '4. A one-page summary',
      '5. A simple hours tracker', '6. A 45-minute findings and setup call', '7. A 15-minute check-in about 30 days later', 'Not included: software and licences'];
    let at = -1;
    order.forEach(part => { const i = a.indexOf(part); expect(i).toBeGreaterThan(at); at = i; });
  });

  it('guarantee: across the people who do the workflow, automatic, a finding and not a result', () => {
    const a = ask('The AI Handoff Plan', 'How does the three-hour guarantee work?');
    expect(a).toContain('at least 3 net hours a week in total across the people who do that workflow');
    expect(a).toContain('automatically within 10 business days of your findings call');
    expect(a).toContain("It's a promise about what your AI plan finds, not about what happens afterwards");
    expect(a).toContain('not 3 hours each');
  });

  it('setup: the first step is set up on the findings call, rollout beyond it is not included', () => {
    const a = ask('The AI Handoff Plan', 'Do you set the tools up for us?');
    expect(a).toMatch(/set up the first step with us/);
    expect(a).toMatch(/Rolling the change out to the rest of the team/);
    expect(a).toMatch(/not included/);
  });

  it('retainer: the sixty-day credit on signing, conditions in the Refund Policy, no roadmap', () => {
    const a = ask('The AI Handoff Plan', 'Do I have to buy a retainer?');
    expect(a).toContain('If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice.');
    expect(a).toContain('Conditions are in our Refund Policy, section 1.');
    expect(a).not.toMatch(/roadmap|six-month/i);
  });

  it('refund and cancellation are answered by reference to the Refund Policy', () => {
    const a = ask('The AI Handoff Plan', 'Can I cancel, or get a refund?');
    expect(a).toContain('section 1 of our Refund Policy');
  });

  it('advisory pricing carries no plan price', () => {
    const a = ask('Practical AI and/or Embedded HR Retainers', 'How much is ongoing advisory?');
    expect(a).not.toMatch(/C\$/);
  });

  it('has a public sector topic with municipal wording and purchase-order payment', () => {
    const ui = within(document.body);
    const first = ask('The AI Handoff Plan for municipalities and public bodies', 'What does it cover?');
    expect(first).toMatch(/^Name one workflow your staff repeat\./);
    fireEvent.click(ui.getByRole('button', { name: 'What does it cost, and how do we pay?' }));
    flush();
    const cost = [...document.querySelectorAll('.bcw-msg-bot')].pop().textContent;
    expect(cost).toMatch(/purchase order is issued/);
    expect(cost).toMatch(/C\$795, with no tax added/);
  });

  it('the public sector topic opens from #chat?topic=public-sector and is recorded as its own lead topic', () => {
    const ui = within(document.body);
    window.BlueChipChat.open({ topic: 'public-sector' });
    flush();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flush();
    expect(document.body.textContent).toContain('You’re looking at The AI Handoff Plan for municipalities and public bodies.');
    expect(document.body.textContent).toContain('Name one workflow your staff repeat');
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    flush();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'sam@example.com' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('The AI Handoff Plan (public sector)');
  });

  it('the chooser offers the public sector plan, and picking it plays the municipal opening bubbles', () => {
    const ui = within(document.body);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    flush();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flush();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan for a municipality or public body', exact: true }));
    flush();
    expect(document.body.textContent).toContain('Name one workflow your staff repeat, and the AI Handoff Plan looks for the steps AI could take on for everyone who does it.');
    expect(document.body.textContent).toContain('council priorities');
  });

  it('the visitor confirmation text for the public sector inquiry links to its page', () => {
    const msg = formatVisitorConfirmation({ name: 'Sam', need: 'The AI Handoff Plan (public sector)' });
    expect(msg).toContain('/ai-handoff-plan/public-sector');
    expect(msg).toContain('not a booking or payment');
    expect(formatVisitorConfirmation({ name: 'Sam', need: 'The AI Handoff Plan' })).not.toContain('public-sector');
  });
});
