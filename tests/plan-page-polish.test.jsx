import { fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const RETAINERS = 'https://www.bluechip-people-strategies.com/embedded-hr-retainers';
const renderPlan = () => render(<MemoryRouter initialEntries={['/ai-handoff-plan']}><AiHandoffPlanPage /></MemoryRouter>);

describe('plan page FAQ copy and named offerings (punch list 38, 39)', () => {
  it('uses the exact new retainer sentence', () => {
    renderPlan();
    expect(screen.getByText(/A retainer isn't required to keep your plan or to decide if we can meet your needs\./)).toBeInTheDocument();
    expect(screen.queryByText(/to qualify for the refund/)).not.toBeInTheDocument();
  });

  it('links every named offering to the page that explains it', () => {
    renderPlan();
    const sprint = screen.getAllByRole('link', { name: 'Implementation Sprint' });
    expect(sprint.length).toBe(2);
    sprint.forEach(a => expect(a).toHaveAttribute('href', `${RETAINERS}#practical-ai-audit`));
    screen.getAllByRole('link', { name: 'Practical AI Retainer' }).forEach(a => expect(a).toHaveAttribute('href', RETAINERS));
    expect(screen.getByRole('link', { name: 'Embedded HR Retainer' })).toHaveAttribute('href', RETAINERS);
  });
});

describe('site header (punch list 41, 42, 58)', () => {
  it('names the free check "AI Opportunity Check" and marks the current page', () => {
    renderPlan();
    const nav = screen.getByRole('navigation', { name: 'AI pages' });
    expect(within(nav).getByRole('link', { name: 'AI Opportunity Check' })).toBeInTheDocument();
    expect(within(nav).queryByText('Free AI check')).not.toBeInTheDocument();
    const current = within(nav).getByRole('link', { name: 'The AI Handoff Plan' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'AI Opportunity Check' })).not.toHaveAttribute('aria-current');
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
    expect(within(nav).getByRole('link', { name: 'AI Opportunity Check' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('look inside the plan (punch list 37)', () => {
  it('is a labelled illustrative document with the five sections', () => {
    renderPlan();
    const section = screen.getByRole('region', { name: 'Look inside the plan' });
    expect(within(section).getByText('Illustrative structure, not a client result.')).toBeInTheDocument();
    [
      'Current workflow and evidence',
      'Recommended tool and alternatives',
      'Baseline time, expected review time and net savings',
      'Costs, permissions and setup effort',
      'One redesigned workflow, implementation steps and success measures',
    ].forEach(t => expect(within(section).getByText(t)).toBeInTheDocument());
    expect(within(section).getAllByRole('listitem')).toHaveLength(5);
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
    const free = screen.getByRole('link', { name: 'Start with the free AI Opportunity Check' });
    expect(free).toHaveAttribute('href', '/ai-opportunity-check');
    expect(free.closest('.plan-free-check')).toBeTruthy();
  });
});
