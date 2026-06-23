import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ClarityCallCTA from '../src/components/ClarityCallCTA';

describe('ClarityCallCTA', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_CAL_BOOKING_URL', 'https://cal.com/thomas-slifka/clarity-call-free');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    cleanup();
  });

  it('renders the reward-framed headline and copy', () => {
    render(<ClarityCallCTA diagnosticId="org-pulse" tier="exposed" total={42} />);
    expect(screen.getByRole('heading', { name: /you've earned a free clarity call/i })).toBeInTheDocument();
    expect(screen.getByText(/30-minute conversation/i)).toBeInTheDocument();
  });

  it('links to the Cal.com URL with diagnostic context prefilled in notes', () => {
    render(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} />);
    const link = screen.getByRole('link', { name: /book my free clarity call/i });
    const href = link.getAttribute('href');
    expect(href).toContain('cal.com');
    const notes = new URL(href).searchParams.get('notes');
    expect(notes).toContain('Diagnostic: dqi');
    expect(notes).toContain('Tier: uneven');
    expect(notes).toContain('Total: 60/100');
  });

  it('still renders a link when tier and total are missing', () => {
    render(<ClarityCallCTA diagnosticId="supervisor-blind-spot" />);
    const link = screen.getByRole('link', { name: /book my free clarity call/i });
    const notes = new URL(link.getAttribute('href')).searchParams.get('notes');
    expect(notes).toContain('Diagnostic: supervisor-blind-spot');
    expect(notes).not.toContain('Tier:');
    expect(notes).not.toContain('Total:');
  });

  it('does not mention the $99 fee or Stripe', () => {
    const { container } = render(<ClarityCallCTA diagnosticId="org-pulse" tier="exposed" total={42} />);
    expect(container.textContent).not.toMatch(/\$99/);
    expect(container.textContent).not.toMatch(/stripe/i);
    expect(container.textContent).not.toMatch(/paid/i);
  });

  it('renders result-specific copy when a resultKey is given (archetype tool)', () => {
    render(<ClarityCallCTA diagnosticId="supervisor-blind-spot" resultKey="friend" />);
    expect(
      screen.getByRole('heading', { name: /being liked is not the same as being trusted/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /help me have the hard conversation/i })).toBeInTheDocument();
  });

  it('interpolates the lowest dimension into the Org Pulse CTA', () => {
    render(
      <ClarityCallCTA
        diagnosticId="org-pulse"
        tier="exposed"
        total={42}
        resultKey="pressure-building"
        lowestDimension="Accountability"
      />
    );
    expect(screen.getByRole('heading', { name: /starting with accountability/i })).toBeInTheDocument();
  });

  it('falls back to the generic CTA for an unmapped result', () => {
    render(<ClarityCallCTA diagnosticId="org-pulse" resultKey="not-a-band" />);
    expect(screen.getByRole('heading', { name: /you've earned a free clarity call/i })).toBeInTheDocument();
  });
});
