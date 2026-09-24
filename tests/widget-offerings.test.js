import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, within } from '@testing-library/dom';
import { formatVisitorConfirmation } from '../api/_lib/lead-helpers.js';

const script = readFileSync('public/widget.js', 'utf8');
let fetchMock;
beforeEach(() => {
  document.body.innerHTML = '';
  delete window.__bcwLoaded;
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
});
afterEach(() => vi.unstubAllGlobals());
function choose(label) {
  const ui = within(document.body);
  fireEvent.click(document.querySelector('#bcwLaunch'));
  fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Test' } });
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  fireEvent.click(ui.getByRole('button', { name: label, exact: true }));
  return ui;
}
describe('new offering intake', () => {
  it('lets visitors browse accurate answers anonymously and preserves the topic for handoff', () => {
    const ui = within(document.body);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    fireEvent.click(ui.getByRole('button', { name: 'Browse questions and answers' }));
    expect(ui.queryByLabelText('Your name')).toBeNull();
    fireEvent.click(ui.getByRole('button', { name: 'Practical AI Audit', exact: true }));
    fireEvent.click(ui.getByRole('button', { name: 'How does the five-hour guarantee work?' }));
    expect(document.body.textContent).toContain('evidence-backed potential');
    expect(document.body.textContent).toContain('not five hours per employee');
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(ui.getByRole('button', { name: 'Ask BlueChip about this' }));
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Test' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('Practical AI Audit');
  });
  it('supports returning to topics and links resources without collecting details', () => {
    const ui = within(document.body);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    fireEvent.click(ui.getByRole('button', { name: 'Browse questions and answers' }));
    fireEvent.click(ui.getByRole('button', { name: 'Free AI Opportunity Check', exact: true }));
    fireEvent.click(ui.getByRole('button', { name: 'Does the free check prove I will save five hours?' }));
    expect(document.body.textContent).toContain('does not confirm the audit guarantee');
    expect(ui.getByRole('link', { name: 'Open the free AI Opportunity Check' })).toHaveAttribute('href', 'https://bluechip-diagnostics.vercel.app/ai-opportunity-check');
    fireEvent.click(ui.getByRole('button', { name: 'All topics' }));
    expect(ui.getByRole('button', { name: 'Other BlueChip services', exact: true })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('explains price and scope before contact, and requires consent before submitting', () => {
    const ui = choose('Practical AI Audit');
    expect(document.body.textContent).toContain('C$999 per organization');
    expect(document.body.textContent).toContain('one priority workflow redesigned');
    expect(document.body.textContent).toContain('five net hours per week across your organization in total');
    expect(ui.queryByLabelText('Your phone number')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    const send = ui.getByRole('button', { name: 'Send', exact: true });
    expect(send).toBeDisabled();
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(send);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({ need: 'Practical AI Audit', consent: true });
  });
  it('keeps AI-only and combined advisory options and supports changing service', () => {
    const ui = choose('Practical AI and/or Embedded HR Retainers');
    expect(document.body.textContent).toContain('Support can focus on AI alone or combine HR and AI');
    fireEvent.click(ui.getByRole('button', { name: 'Choose a different service' }));
    expect(ui.getByRole('button', { name: 'Practical AI Audit', exact: true })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends an inquiry acknowledgement, not a booking or savings promise', () => {
    const audit = formatVisitorConfirmation({ name: 'Test', need: 'Practical AI Audit' });
    expect(audit).toContain('C$999 including applicable tax');
    expect(audit).toContain('not a booking or payment');
    expect(audit).toContain('STOP');
    expect(formatVisitorConfirmation({ need: 'Embedded HR + AI Advisory' })).toContain('AI alone or combine HR and AI');
    expect(formatVisitorConfirmation({ need: 'Practical AI and/or Embedded HR Retainers' })).toContain('Practical AI and/or Embedded HR Retainers inquiry');
    expect(formatVisitorConfirmation({ need: 'Leadership coaching' })).not.toContain('C$999');
  });
  it('links the free check without submitting contact details', () => {
    const ui = choose('Free AI Opportunity Check');
    expect(ui.getByRole('link', { name: 'Start the free AI Opportunity Check' })).toHaveAttribute('href', 'https://bluechip-diagnostics.vercel.app/ai-opportunity-check');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('opens intake for an incoming audit discussion link', () => {
    window.history.replaceState(null, '', '/#chat');
    document.body.innerHTML = '';
    delete window.__bcwLoaded;
    window.eval(script);
    expect(document.querySelector('#bcwPanel')).toHaveAttribute('aria-hidden', 'false');
    expect(fetchMock).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });
});
