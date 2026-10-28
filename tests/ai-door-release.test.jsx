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
  /roadmap/i, /AI Opportunity Check/, /AI Capacity Check/, /—/, /org(anization)? architecture/i,
];

describe('plan page: order, both editions', () => {
  it.each([['/ai-handoff-plan'], ['/ai-handoff-plan/public-sector']])('runs lead, example, box, safety net, then Start the conversation on %s', (path) => {
    const { container } = renderEdition(path);
    const headline = container.querySelector('.plan-headline');
    const example = container.querySelector('#pulse-scale');
    const box = screen.getByRole('heading', { name: 'What your AI Handoff Plan includes' }).closest('section');
    const safety = container.querySelector('.plan-safety');
    const cta = within(safety).getByRole('link', { name: 'Start the conversation' });
    const follows = (a, b) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(headline, example)).toBe(true);
    expect(follows(example, box)).toBe(true);
    expect(follows(box, safety)).toBe(true);
    // the button is the last thing inside the safety-net block, after the definitions and the Refund Policy reference
    expect(follows(within(safety).getByText(/accounts for the time spent checking the work and keeping it running/), cta)).toBe(true);
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

  it('shows the price once in its booking section and never the old prices', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: 'What your AI Handoff Plan includes' })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/C\$(595|999)/);
    // The scenario is fee-independent; the current fee appears in its own box.
    expect((container.textContent.match(/C\$795/g) || []).length).toBe(1);
  });
});

describe('plan page: lead, example, box and safety net text', () => {
  it('uses a short lead and labels the team-hours equation as an illustration', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: "Not sure where AI fits in your team's work?" })).toBeInTheDocument();
    expect(container.querySelector('.glass-lede').textContent).toMatch(/don't need to know the tools or arrive with a plan/);
    const example = container.querySelector('#pulse-scale');
    expect(within(example).getByText(/not a result from your answers/)).toBeInTheDocument();
    expect(within(example).getByRole('group', { name: 'Illustrative team hours' }).textContent).toMatch(/10people.*2.5net hours each.*25team hours/);
    expect(example.textContent).toContain('1,200 team hours a year');
    expect(example.textContent).toContain('48 working weeks');
    expect(example.textContent).toContain('Hours allow for checking and upkeep.');
    expect(example.textContent).toContain('C$48,000');
  });

  it('puts the edition guardrail right after the example', () => {
    const general = renderEdition('/ai-handoff-plan').container.querySelector('.plan-scale-learning .plan-guardrail').textContent;
    expect(general).toMatch(/^AI doesn't replace your people's judgment on people decisions\./);
    cleanup();
    const municipal = renderEdition('/ai-handoff-plan/public-sector').container.querySelector('.plan-scale-learning .plan-guardrail').textContent;
    expect(municipal).toMatch(/^AI doesn't replace CAO judgment, council governance, or your privacy and records requirements\./);
    expect(municipal).toMatch(/not positions to cut/);
  });

  it('keeps the deliverables clear, separates time and extra costs, and links delivery terms', () => {
    renderEdition('/ai-handoff-plan');
    const box = screen.getByRole('heading', { name: 'What your AI Handoff Plan includes' }).closest('section');
    const steps = box.querySelectorAll('.plan-flow-step');
    expect(steps).toHaveLength(4);
    expect(steps[0].textContent).toMatch(/60 minutes.*Meet virtually with up to two people/);
    ['What AI could take on, what your people keep', 'Tool choice, costs and setup effort', 'What information can go into which tool', 'Projected net team hours a week'].forEach(text => {
      expect(within(steps[1]).getByText(text).tagName).toBe('LI');
    });
    expect(steps[1].textContent).toContain('Written for your team');
    expect(steps[2].textContent).toMatch(/45 minutes.*Try a first step together in an approved tool.*IT request ready to send/);
    expect(steps[3].textContent).toMatch(/About 30 days later.*15-minute check-in on how it is going/);
    expect(within(box).getByRole('link',{name:'see our Terms'})).toHaveAttribute('href','https://www.bluechip-people-strategies.com/terms');
    expect(box.querySelectorAll('.plan-included-tools li')).toHaveLength(4);
    expect(box.querySelectorAll('.plan-kit-icon svg')).toHaveLength(4);
    ['4-day quick-start guide','Starter kit','Sign-off summary','Hours tracker','Prompts, templates and a review checklist.','One page to share and approve.','See how time changes across the agreed work.'].forEach(text=>expect(within(box).getByText(text)).toBeInTheDocument());
    expect(within(box).getByRole('heading',{name:'Time we need from you'})).toBeInTheDocument();
    expect(box.textContent).toContain('About 2 hours each');
    expect([...box.querySelectorAll('.plan-call-list strong')].map(e=>e.textContent)).toEqual(['60 min','45 min','15 min']);
    expect(box.textContent).toContain('If you are one of those participants, it is already included in your 2 hours.');
    expect(within(box).getByRole('heading',{name:'If you choose to implement'})).toBeInTheDocument();
    expect(box.textContent).toContain('Possible extra costs, only if needed:');
    expect(box.textContent).toContain('We start with your existing tools and look for the most economical fit.');
    expect(box.textContent).toContain('You approve any extra BlueChip work and price before it starts.');
    expect(box.textContent).toContain('Software and licences');
    expect(box.textContent).toContain('IT installations and wider rollout');
    expect(box.textContent).toContain('Additional implementation support beyond your findings call');
    expect(box.textContent).not.toMatch(/guarantee|full fee/i);
  });

  it.each([['/ai-handoff-plan','ai-handoff-plan'],['/ai-handoff-plan/public-sector','public-sector']])('groups investment, value, safety and timing without monthly scarcity on %s',(path,topic)=>{
    const {container}=renderEdition(path);
    const offer=screen.getByRole('heading',{name:'Your investment. Your safety net.'}).closest('section');
    expect(offer.querySelector('.plan-safety')).not.toBeNull();
    expect(offer.textContent).toContain('One-time investment');
    expect(offer.textContent).toContain('C$795');
    expect(offer.textContent).toContain('C$5,760');
    expect(offer.textContent).toContain('if achieved');
    expect(offer.textContent).toContain('not a business average or cash savings');
    expect(offer.textContent).toContain("We'll agree the people and work to look at together before you pay");
    expect(offer.querySelector('.plan-booking-grid > div:first-child .plan-scope-agreement')).not.toBeNull();
    expect(within(offer).getByRole('link',{name:'Ask us about timing →'})).toHaveAttribute('href',`#chat?topic=${topic}`);
    expect(container.textContent).not.toContain('Monthly capacity');
    expect(container.textContent).not.toContain('12 AI Handoff');
    expect(screen.getByRole('heading',{name:'Questions about getting started'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'Your work. Your call.'})).toBeInTheDocument();
    expect(container.querySelector('.plan-workflow-list').textContent).toContain('You decide what to hand over, what stays with your people, and what to try first.');
  });

  it('shows the plain-language promise and net-time basis openly, with practical refund details in the FAQ', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    const safety = container.querySelector('.plan-safety');
    expect(safety.closest('details')).toBeNull();
    expect(safety.textContent).toContain("We'll show you where to get at least 3 hours a week back across your team, or refund your plan fee.");
    expect(safety.textContent).toContain('accounts for the time spent checking the work and keeping it running');
    const promise = screen.getByText('How does the three-hour promise work?').closest('details');
    expect(promise.textContent).toContain('people and work we review together');
    expect(promise.textContent).toContain('automatically refund your full fee within 10 business days of your findings call');
    expect(promise.textContent).toContain('the time you get back depends on putting them to work');
    expect(screen.getByText("What if we don't know where to start with AI?").closest('details')).toHaveAttribute('open');
    expect(safety.textContent).not.toMatch(/Net means the hours saved each week/);
    expect(within(safety).getByRole('link', { name: 'Refund Policy' })).toHaveAttribute('href', 'https://www.bluechip-people-strategies.com/refund');
    expect(safety.querySelector('.plan-cta-lead')).toBeNull();
    expect(within(safety).getByRole('link',{name:'Start the conversation'})).toHaveClass('plan-btn--safety');
  });

  it('closes the retainer line on the sixty-day credit without repeating the refund-policy sentence', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(screen.getByRole('heading', { name: 'Your plan. Your choice.' })).toBeInTheDocument();
    const choice=screen.getByRole('heading',{name:'Your plan. Your choice.'}).closest('section');
    expect(choice.textContent).toContain('Once you have your plan, you choose how to implement it: your team, another provider, or BlueChip.');
    expect(choice.textContent).not.toContain('No retainer required');
    expect(container.textContent).toContain('If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your AI Handoff findings call, the eligible plan fee you paid is credited against its first invoice.');
    const retainer = container.querySelector('.plan-safety').nextElementSibling;
    expect(retainer.textContent).not.toContain('Conditions are in our Refund Policy');
    expect(within(container.querySelector('.plan-safety')).getByRole('link', { name: 'Refund Policy' })).toHaveAttribute('href', 'https://www.bluechip-people-strategies.com/refund');
  });
});

describe('plan page: two editions and the switch', () => {
  it.each([
    ['/ai-handoff-plan', 'ai-handoff-plan'],
    ['/ai-handoff-plan/public-sector', 'public-sector'],
  ])('the closing contact action keeps the correct chat context on %s', (path, topic) => {
    const { container } = renderEdition(path);
    expect(within(container.querySelector('.plan-close')).getByRole('link', { name: 'Ask us' }))
      .toHaveAttribute('href', `#chat?topic=${topic}`);
  });

  it('the public sector edition uses municipal wording and its own chat topic', () => {
    const { container } = renderEdition('/ai-handoff-plan/public-sector');
    expect(screen.getByRole('heading', { name: 'Not sure where AI fits in your municipality?' })).toBeInTheDocument();
    expect(container.querySelector('.plan-box-opener').textContent).toMatch(/where AI can help your team/);
    expect(container.querySelector('.glass-lede').textContent).toMatch(/free up staff time for council priorities/);
    screen.getAllByRole('link', { name: 'Start the conversation' }).forEach(a => expect(a).toHaveAttribute('href', '#chat?topic=public-sector'));
    expect(document.title).toMatch(/municipalities and public bodies/);
    expect(document.querySelector('meta[name="description"]').getAttribute('content')).toMatch(/Current fee C\$795, confirmed before booking/);
  });

  it('the general edition reviews the team work without a single-task cap', () => {
    const { container } = renderEdition('/ai-handoff-plan');
    expect(container.querySelector('.plan-box-opener').textContent).toMatch(/where AI can help your team/);
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
    expect(screen.getByRole('heading', { name: 'Not sure where AI fits in your municipality?' })).toBeInTheDocument();
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

  it('cost: C$795, no tax added, and asking books nothing', () => {
    const a = ask('The AI Handoff Plan', 'What does the AI Handoff Plan cost?');
    expect(a).toBe("See the AI Handoff Plan page for current pricing. Pricing for future bookings may change at BlueChip's sole discretion; your fee is confirmed before booking. Asking here doesn't book anything or take payment.");
  });

  it('included: the short list, in box order', () => {
    const a = ask('The AI Handoff Plan', 'What is included?');
    expect(a).toBe('A discovery session, a written AI plan, a starter kit, a findings and setup call, and a check-in about 30 days later.');
  });

  it('guarantee: across the people who do the workflow, automatic, a finding and not a result', () => {
    const a = ask('The AI Handoff Plan', 'How does the three-hour guarantee work?');
    expect(a).toContain('evidence-backed potential for at least 3 net team hours a week across the agreed people and work reviewed');
    expect(a).toContain('automatically within 10 business days of your findings call');
    expect(a).toContain("It's a promise about what your AI plan finds, not about what happens afterwards");
    expect(a).toContain('not 3 hours each');
  });

  it('setup: the first step is set up on the findings call, rollout beyond it is not included', () => {
    const a = ask('The AI Handoff Plan', 'Do you set the tools up for us?');
    expect(a).toMatch(/45-minute findings call.*first step in an approved tool, within the time available/);
    expect(a).toMatch(/Rolling the change out to the rest of the team/);
    expect(a).toMatch(/not included/);
  });

  it('retainer: the sixty-day credit on signing, conditions in the Refund Policy, no roadmap', () => {
    const a = ask('The AI Handoff Plan', 'Do I have to buy a retainer?');
    expect(a).toContain('If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your AI Handoff findings call, the eligible plan fee you paid is credited against its first invoice.');
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
    expect(first).toMatch(/^Tell us about the work your staff repeat\./);
    fireEvent.click(ui.getByRole('button', { name: 'What does it cost, and how do we pay?' }));
    flush();
    const cost = [...document.querySelectorAll('.bcw-msg-bot')].pop().textContent;
    expect(cost).toMatch(/purchase order is issued/);
    expect(cost).toMatch(/current pricing/);
    expect(cost).toMatch(/fee is confirmed before booking/);
  });

  it('the public sector topic opens from #chat?topic=public-sector and is recorded as its own lead topic', () => {
    const ui = within(document.body);
    window.BlueChipChat.open({ topic: 'public-sector' });
    flush();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flush();
    expect(document.body.textContent).toContain('You’re looking at The AI Handoff Plan for municipalities and public bodies.');
    expect(document.body.textContent).toContain('Tell us about the work your staff repeat');
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    flush();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'sam@example.com' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flush();
    fireEvent.click(ui.getByRole('button', { name: 'Skip', exact: true }));   // the optional "how did you hear" question
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('The AI Handoff Plan (public sector)');
  });

  it('the chooser offers the public sector plan, and picking it plays the municipal opening bubbles', () => {
    const ui = within(document.body);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    flush();
    fireEvent.click(ui.getByRole('button', { name: 'Something else? Ask BlueChip directly.' }));   // first screen offers tap-to-ask questions
    flush();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flush();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan for a municipality or public body', exact: true }));
    flush();
    expect(document.body.textContent).toContain('Tell us about the work your staff repeat, and the AI Handoff Plan looks across it for practical AI improvements with your staff in control.');
    expect(document.body.textContent).toContain('council priorities');
  });

  it('the visitor confirmation text for the public sector inquiry links to its page', () => {
    const msg = formatVisitorConfirmation({ name: 'Sam', need: 'The AI Handoff Plan (public sector)' });
    expect(msg).toContain('/ai-handoff-plan/public-sector');
    expect(msg).toContain('not a booking or payment');
    expect(formatVisitorConfirmation({ name: 'Sam', need: 'The AI Handoff Plan' })).not.toContain('public-sector');
  });
});
