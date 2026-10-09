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

describe('EmailOptIn lead-source attribution', () => {
  it('sends the attribution object to /api/submit with the opt-in', async () => {
    const { fireEvent, waitFor } = await import('@testing-library/react');
    const { vi } = await import('vitest');
    const { captureAttribution, resetAttributionMemory } = await import('../src/lib/attribution.js');
    resetAttributionMemory();
    window.localStorage.clear(); window.sessionStorage.clear();
    window.history.replaceState(null, '', '/?utm_source=linkedin&utm_medium=post');
    captureAttribution();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, emailSent: true }) });
    vi.stubGlobal('fetch', fetchMock);
    render(<EmailOptIn diagnosticId="org-pulse" resultLabel="Healthy (80/100)" hasDimensions />);
    fireEvent.change(screen.getByLabelText('Your email'), { target: { value: 'pat@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /unlock/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.attribution.first).toMatchObject({ source: 'linkedin', medium: 'post' });
    expect(Object.keys(sent.attribution).sort()).toEqual(['first', 'last']);
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });
});
