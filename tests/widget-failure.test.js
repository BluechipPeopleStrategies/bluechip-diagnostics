import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, within } from '@testing-library/dom';

const script = readFileSync('public/widget.js', 'utf8');
let fetchMock;

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-bcw]').forEach(s => s.remove());
  delete window.__bcwLoaded;
  delete window.BlueChipChat;
  location.hash = '';
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const flushBot = () => vi.advanceTimersByTime(6000);
const flushPromises = async () => { await vi.advanceTimersByTimeAsync(10); };

function openOnTopic(slug) {
  window.BlueChipChat.open({ topic: slug });
  const ui = within(document.body);
  flushBot();
  fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Test' } });
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  flushBot();
  return ui;
}
// Send the details, then answer (or skip) the optional "how did you hear about us?" question.
function sendLead(ui, answer = 'Skip') {
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  flushBot();
  fireEvent.click(ui.getByRole('button', { name: answer, exact: true }));
}
function fillContact(ui) {
  fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
  flushBot();
  fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
  fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'test@example.com' } });
  fireEvent.click(ui.getByRole('checkbox'));
}

describe('"Other BlueChip services" topic (opened from a quiz result)', () => {
  it('describes BlueChip in general and never shows the AI Handoff Plan price or guarantee', () => {
    openOnTopic('other');
    const text = document.body.textContent;
    expect(text).toContain("You’re looking at Other BlueChip services");
    expect(text).toContain('practical AI, embedded HR, governance evaluations');
    expect(text).not.toMatch(/C\$795|guarantee|net hours|fee comes back/);
  });

  it('sends the inquiry under the topic label', () => {
    const ui = openOnTopic('other');
    fillContact(ui);
    sendLead(ui);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('Other BlueChip services');
  });
});

describe('the widget only says "Got it" once the inquiry was recorded', () => {
  it('confirms on a 2xx reply', async () => {
    const ui = openOnTopic('ai-handoff-plan');
    fillContact(ui);
    sendLead(ui);
    await flushPromises();
    expect(document.body.textContent).toContain('Got it, Test.');
  });

  it('keeps the form and says so on a 502, and lets the visitor try again', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });
    const ui = openOnTopic('ai-handoff-plan');
    fillContact(ui);
    sendLead(ui);
    await flushPromises();
    expect(document.body.textContent).not.toContain('Got it');
    expect(document.body.textContent).toContain("Sorry, that didn't go through.");
    expect(document.body.textContent).toContain('thomas@bluechip-people-strategies.com');
    const skip = ui.getByRole('button', { name: 'Skip', exact: true });
    expect(skip).not.toBeDisabled();
    fireEvent.click(skip);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain('Got it, Test.');
  });

  it('does the same when the network is down', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const ui = openOnTopic('ai-handoff-plan');
    fillContact(ui);
    sendLead(ui);
    await flushPromises();
    expect(document.body.textContent).not.toContain('Got it');
    expect(document.body.textContent).toContain("Sorry, that didn't go through.");
  });

  it('ignores a second click while the first is still sending', async () => {
    let release;
    fetchMock.mockImplementationOnce(() => new Promise(r => { release = r; }));
    const ui = openOnTopic('ai-handoff-plan');
    fillContact(ui);
    sendLead(ui);
    const skip = ui.getByRole('button', { name: 'Skip', exact: true });
    fireEvent.click(skip);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release({ ok: true });
    await flushPromises();
    expect(document.body.textContent).toContain('Got it, Test.');
  });
});
