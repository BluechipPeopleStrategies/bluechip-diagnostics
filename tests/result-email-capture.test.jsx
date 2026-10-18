import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { KeepResults } from '../src/components/KeepResults';

beforeEach(() => { sessionStorage.clear(); window.posthog = { capture: vi.fn() }; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); delete window.posthog; });

describe('results email invitation', () => {
  it('shows the email field and sharing disclosure without another expansion click', () => {
    render(<KeepResults answers={{}} />);
    expect(screen.getByLabelText('Your email')).toBeVisible();
    expect(screen.getByText(/completed answers and result are shared with Thomas/)).toBeInTheDocument();
  });

  it('counts an accepted result request without putting an email or answers in analytics', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, emailSent: true, leadNotificationSent: true }) })));
    const { container } = render(<KeepResults answers={{ orgType: 'professional' }} />);
    fireEvent.change(screen.getByLabelText('Your email'), { target: { value: 'visitor@example.com' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(window.posthog.capture).toHaveBeenCalledWith('check_results_email_accepted', expect.objectContaining({ owner_recorded: true })));
    expect(JSON.stringify(window.posthog.capture.mock.calls)).not.toMatch(/visitor@example.com|professional/);
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body)).toMatchObject({ shareCompletedCheck: true, sharingNoticeVersion: 'ai-pulse-results-v2' });
  });

  it('warns when the visitor email was accepted but the owner record failed', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({ ok: false, emailSent: true, leadNotificationSent: false }) })));
    const { container } = render(<KeepResults answers={{}} />);
    fireEvent.change(screen.getByLabelText('Your email'), { target: { value: 'visitor@example.com' } });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(screen.getByText(/couldn't confirm the copy for Thomas/)).toBeInTheDocument());
    expect(window.posthog.capture.mock.calls.map(([name]) => name)).not.toContain('check_results_email_accepted');
  });
});
