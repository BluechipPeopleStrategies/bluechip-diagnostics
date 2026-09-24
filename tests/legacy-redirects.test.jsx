import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, it, expect } from 'vitest';
import App from '../src/App';
import vercelConfig from '../vercel.json';

afterEach(cleanup);

// Vercel's own edge redirects (vercel.json) are what production actually uses; this just
// confirms the config shape. The App-level <Navigate> is the client-side fallback for
// SPA-only dev/preview servers that never see vercel.json (see App.jsx's LegacyRedirect).
describe('vercel.json redirects', () => {
  it('301s the old /ai-audit path to /ai-handoff-plan', () => {
    const r = vercelConfig.redirects.find(r => r.source === '/ai-audit');
    expect(r).toEqual({ source: '/ai-audit', destination: '/ai-handoff-plan', permanent: true });
  });
  it('301s the old /ai-check path to /ai-opportunity-check', () => {
    const r = vercelConfig.redirects.find(r => r.source === '/ai-check');
    expect(r).toEqual({ source: '/ai-check', destination: '/ai-opportunity-check', permanent: true });
  });
});

// App.jsx owns its own <BrowserRouter>, so these drive the real jsdom URL (what BrowserRouter
// reads) instead of wrapping App in a second, conflicting router.
describe('client-side legacy redirect fallback', () => {
  it('sends /ai-audit to the new plan page and keeps query params', () => {
    window.history.pushState({}, '', '/ai-audit?workflow=reporting');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'The AI Handoff Plan', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/Your starting point:/)).toBeInTheDocument();
  });
  it('sends /ai-check to the free check', () => {
    window.history.pushState({}, '', '/ai-check');
    render(<App />);
    expect(screen.getByText('How much time could AI give back to your team?')).toBeInTheDocument();
  });
});
