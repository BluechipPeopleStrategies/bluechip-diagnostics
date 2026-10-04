import { fireEvent, render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AiOpportunityCheck from '../src/components/AiOpportunityCheck';

let capture;
beforeEach(() => { capture = vi.fn(); window.posthog = { capture }; });
afterEach(() => { cleanup(); sessionStorage.clear(); delete window.posthog; });

const events = () => capture.mock.calls.map(([name, props]) => ({ name, props }));

describe('free check funnel events', () => {
  it('records a start and the first question view, with structure only', () => {
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    const names = events().map(e => e.name);
    expect(names).toContain('check_started');
    const view = events().find(e => e.name === 'check_question_viewed');
    expect(view.props).toMatchObject({ question_id: 'orgType', question_number: 1, total: 12, substep: null, resumed: false });
  });

  it('records Q2 as pick then size, and never sends an answer value', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(events().some(e => e.props?.question_id === 'areas' && e.props.substep === 'pick')).toBe(true));
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(events().some(e => e.props?.question_id === 'areas' && e.props.substep === 'size')).toBe(true));
    const sent = JSON.stringify(capture.mock.calls);
    expect(sent).not.toMatch(/professional|correspondence/);
  });

  it('flags a restored session as resumed and sends no check_started', () => {
    sessionStorage.setItem('bc-free-check-session', '{}');
    const { unmount } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    unmount();
    capture.mockClear();
    window.posthog = { capture };
    // a fresh mount with a saved session (written by the first mount's save effect)
    render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    const view = events().find(e => e.name === 'check_question_viewed');
    expect(view.props.resumed).toBe(true);
    expect(events().map(e => e.name)).not.toContain('check_started');
  });

  it('does nothing and does not throw when PostHog is absent', () => {
    delete window.posthog;
    expect(() => render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>)).not.toThrow();
  });

  it('Back from question 3 returns to the sizing step of Q2, not the tile grid', async () => {
    const { container } = render(<MemoryRouter><AiOpportunityCheck /></MemoryRouter>);
    fireEvent.click(container.querySelector('input[name="orgType"][value="professional"]'));
    await waitFor(() => expect(container.querySelector('input[name="areas"]')).toBeInTheDocument());
    fireEvent.click(container.querySelector('input[name="areas"][value="correspondence"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(container.querySelector('input[name="toolsToday"]')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(container.querySelector('.ai-sizing-row')).toBeInTheDocument();
    expect(container.querySelector('input[name="areas"]')).not.toBeInTheDocument();
  });
});
