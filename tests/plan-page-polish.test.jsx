import { fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const renderPlan = () => render(<MemoryRouter initialEntries={['/ai-handoff-plan']}><AiHandoffPlanPage /></MemoryRouter>);

describe('plan page FAQ copy and retainer line (AI door release, 2026-10-08)', () => {
  it('says a retainer is not needed to keep your AI plan', () => {
    renderPlan();
    expect(screen.getByText('Do I need to buy ongoing support?')).toBeInTheDocument();
    expect(screen.getByText('No. You can keep your AI plan and put it in place yourself or with another provider.')).toBeInTheDocument();
  });

  it('states the retainer credit and points to the Refund Policy, with no roadmap, minimum or Implementation Sprint', () => {
    const { container } = renderPlan();
    expect(container.textContent).toContain('If you sign a Practical AI and/or Embedded HR retainer with us within 60 days of your findings call, your C$795 is credited against its first invoice.');
    expect(container.textContent).not.toMatch(/roadmap|six-month|Implementation Sprint/i);
    expect(screen.queryByRole('link', { name: /Retainer/ })).not.toBeInTheDocument(); // "ask us about ongoing help" has no link
    screen.getAllByRole('link', { name: 'Refund Policy' }).forEach(a => expect(a).toHaveAttribute('href', 'https://www.bluechip-people-strategies.com/refund'));
  });
});

describe('site header (punch list 41, 42, 58)', () => {
  it('names the free check "AI Pulse" and marks the current page', () => {
    renderPlan();
    const nav = screen.getByRole('navigation', { name: 'AI pages' });
    expect(within(nav).getByRole('link', { name: 'AI Pulse' })).toBeInTheDocument();
    expect(within(nav).queryByText('AI Opportunity Check')).not.toBeInTheDocument();
    expect(within(nav).queryByText('Free AI check')).not.toBeInTheDocument();
    const current = within(nav).getByRole('link', { name: 'The AI Handoff Plan' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'AI Pulse' })).not.toHaveAttribute('aria-current');
  });

  it('clicking the current page scrolls to the top instead of doing nothing', () => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    renderPlan();
    const nav = screen.getByRole('navigation', { name: 'AI pages' });
    fireEvent.click(within(nav).getByRole('link', { name: 'The AI Handoff Plan' }));
    // tests/setup.js reports prefers-reduced-motion: reduce, so this is the jump, not the glide
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    vi.unstubAllGlobals();
  });

  it('marks the free check as current on its own page', () => {
    render(<MemoryRouter initialEntries={['/ai-opportunity-check']}><AiOpportunityCheck /></MemoryRouter>);
    const nav = screen.getByRole('navigation', { name: 'AI pages' });
    expect(within(nav).getByRole('link', { name: 'AI Pulse' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('look inside your AI plan (punch list 37, updated 2026-10-08)', () => {
  it('is a labelled illustrative document with the six sections, matching the "What you get for C$795" box', () => {
    renderPlan();
    const section = screen.getByRole('region', { name: 'Look inside your AI plan' });
    expect(within(section).getByText('Illustrative structure, not a client result.')).toBeInTheDocument();
    [
      'Current workflow and evidence',
      'Recommended tool and alternatives',
      'Baseline time, expected review time and net savings',
      "Costs, setup effort, and what should and shouldn't go into each tool",
      'Which parts of the workflow AI can take on and which stay with your people',
      'How the hours add up across the people who do it',
    ].forEach(t => expect(within(section).getByText(t)).toBeInTheDocument());
    expect(within(section).getAllByRole('listitem')).toHaveLength(6);
    expect(section.textContent).not.toMatch(/redesign/i);
    // no numbers presented as a result anywhere in the illustration
    expect(section.textContent).not.toMatch(/\d+\s*(hrs?|hours|%|C\$)/i);
  });
});

describe('closing CTA (punch list 40)', () => {
  it('keeps the chat hook on every primary button and gives the free check its own row', () => {
    renderPlan();
    const ctas = screen.getAllByRole('link', { name: 'Start the conversation' });
    expect(ctas.length).toBe(3); // header, price panel, closing card
    ctas.forEach(a => expect(a.className).toContain('plan-btn'));
    const free = screen.getByRole('link', { name: 'Start with the free AI Pulse' });
    expect(free).toHaveAttribute('href', '/ai-opportunity-check');
    expect(free.closest('.plan-free-check')).toBeTruthy();
  });
});
