import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import IndexPage from '../src/components/IndexPage';
import QuizPage from '../src/components/QuizPage';
import orgPulse from '../src/data/org-pulse.json';
import dqi from '../src/data/dqi.json';
import workplaceRead from '../src/data/workplace-read.json';
import supervisorBlindSpot from '../src/data/supervisor-blind-spot.json';

afterEach(cleanup);

const renderHub = () => render(
  <MemoryRouter>
    <IndexPage />
  </MemoryRouter>
);

describe('IndexPage hub', () => {
  it('is titled Free checks and shows exactly three cards in order', () => {
    const { container } = renderHub();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Free checks');
    expect(document.body.textContent).not.toMatch(/diagnostics/i);
    const titles = [...container.querySelectorAll('.bc-card-link-block h3')].map(h => h.textContent);
    expect(titles).toEqual(['AI Pulse', 'Governance Health Check', 'Decision Signature']);
  });

  it('keeps the Start here badge on AI Pulse and uses no unvalidated headcount number', () => {
    const { container } = renderHub();
    const badge = screen.getByText(/^start here$/i);
    expect(badge.closest('.bc-card-link-block').querySelector('h3').textContent).toBe('AI Pulse');
    // The routing copy must not ship an unvalidated "25+" style threshold.
    expect(container.textContent).not.toMatch(/\d+\+\s*(people|staff)/i);
  });

  it('uses the short subhead', () => {
    renderHub();
    expect(screen.getByText('Pick the one that fits your seat.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Short, sharp/);
  });

  it('keeps the role-based routing line under the remaining cards', () => {
    renderHub();
    expect(screen.getByText(/anyone who sits on a board that evaluates a CAO/i)).toBeInTheDocument();
    expect(screen.getByText('For leaders and owners who manage people.')).toBeInTheDocument();
  });

  it('sends Decision Signature to the main site in the same tab', () => {
    const { container } = renderHub();
    const card = [...container.querySelectorAll('.bc-card-link-block')].find(a => a.querySelector('h3').textContent === 'Decision Signature');
    expect(card.tagName).toBe('A');
    expect(card.getAttribute('href')).toBe('https://www.bluechip-people-strategies.com/decision-signature');
    expect(card.getAttribute('target')).toBeNull();
    expect(card.textContent).toContain('25 questions. About 4 minutes. How you make decisions, and the gap it can create in the people you lead.');
  });

  it('leaves the four retired cards off the hub only: their quiz pages still open', () => {
    renderHub();
    ['Org Pulse', 'Decision Quality Index', 'Workplace Read', 'Supervisor Blind Spot'].forEach(t => expect(screen.queryByText(t)).toBeNull());
    cleanup();
    [['org-pulse', orgPulse], ['dqi', dqi], ['workplace-read', workplaceRead], ['supervisor-blind-spot', supervisorBlindSpot]].forEach(([slug, data]) => {
      render(
        <MemoryRouter initialEntries={[`/${slug}`]}>
          <Routes><Route path="/:slug" element={<QuizPage />} /></Routes>
        </MemoryRouter>
      );
      expect(screen.queryByText(/not found/i)).toBeNull();
      expect(document.body.textContent).toContain(data.title);
      cleanup();
    });
  });
});
