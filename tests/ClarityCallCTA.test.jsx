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
    // "paid" may appear only in the proof strip's honest "same dimensions as our
    // paid assessments" line, never as a charge for THIS call.
    expect(container.textContent).not.toMatch(/paid (call|session|booking)/i);
  });

  it('renders the proof strip on every result', () => {
    render(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} />);
    expect(screen.getByText(/free doesn't mean shallow/i)).toBeInTheDocument();
  });

  it('renders the org-size bridge line only for a mapped size', () => {
    const { container, rerender } = render(
      <ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} orgSize="2-25" />
    );
    expect(container.textContent).toMatch(/one of five hats/i);
    rerender(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} orgSize="26-250" />);
    expect(container.textContent).toMatch(/growth often outpaces/i);
    rerender(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} orgSize="250+" />);
    expect(container.textContent).not.toMatch(/bring (that|it) to the call/i);
    rerender(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} />);
    expect(container.textContent).not.toMatch(/bring (that|it) to the call/i);
  });

  it('renders the team on-ramp only for the org-level tools, with a single link', () => {
    const { container, rerender } = render(
      <ClarityCallCTA diagnosticId="org-pulse" tier="exposed" total={42} />
    );
    expect(container.textContent).toMatch(/one person's read/i);
    expect(container.querySelectorAll('a').length).toBe(1);
    rerender(<ClarityCallCTA diagnosticId="workplace-read" resultKey="drift" />);
    expect(container.textContent).toMatch(/one person's read/i);
    rerender(<ClarityCallCTA diagnosticId="supervisor-blind-spot" resultKey="friend" />);
    expect(container.textContent).not.toMatch(/one person's read/i);
    rerender(<ClarityCallCTA diagnosticId="dqi" tier="uneven" total={60} />);
    expect(container.textContent).not.toMatch(/one person's read/i);
    expect(container.querySelectorAll('a').length).toBe(1);
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
