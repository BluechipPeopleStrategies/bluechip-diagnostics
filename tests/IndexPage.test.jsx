import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import IndexPage from '../src/components/IndexPage';

afterEach(cleanup);

describe('IndexPage routing (QW6)', () => {
  it('renders the role-based routing line under a card', () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/manage people directly/i)).toBeInTheDocument();
    expect(screen.getByText(/pressure-testing how they make the big calls/i)).toBeInTheDocument();
  });

  it('flags Org Pulse with a Start here badge and uses no unvalidated headcount number', () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/^start here$/i)).toBeInTheDocument();
    // The routing copy must not ship an unvalidated "25+" style threshold.
    expect(document.body.textContent).not.toMatch(/\d+\+\s*(people|staff)/i);
  });

  it('uses the vetted subhead', () => {
    render(
      <MemoryRouter>
        <IndexPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/fits your seat/i)).toBeInTheDocument();
  });
});
