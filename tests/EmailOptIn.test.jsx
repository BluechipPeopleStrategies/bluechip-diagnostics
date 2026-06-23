import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import EmailOptIn from '../src/components/EmailOptIn';

afterEach(cleanup);

describe('EmailOptIn unlock copy (per-tool accuracy)', () => {
  it('names the dimension breakdown for scored tools', () => {
    render(<EmailOptIn diagnosticId="org-pulse" resultLabel="Healthy (80/100)" hasDimensions />);
    expect(screen.getByText(/dimension-by-dimension breakdown/i)).toBeInTheDocument();
  });

  it('names the cheat sheet for Supervisor Blind Spot', () => {
    render(<EmailOptIn diagnosticId="supervisor-blind-spot" resultLabel="friend" hasCheatSheet />);
    expect(screen.getByText(/cheat sheet/i)).toBeInTheDocument();
  });

  it('falls back to a next-moves-only promise with no false extras', () => {
    render(<EmailOptIn diagnosticId="workplace-read" resultLabel="drift" />);
    const body = screen.getByText(/personalized next moves, built around your result/i);
    expect(body).toBeInTheDocument();
    expect(body.textContent).not.toMatch(/cheat sheet|dimension-by-dimension/i);
  });
});
