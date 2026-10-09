import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, within } from '@testing-library/dom';

const script = readFileSync('public/widget.js', 'utf8');
let fetchMock;
// Each test evaluates a fresh copy of the widget, which adds document/window listeners that
// would otherwise outlive it and fire in later tests.
let added = [];

beforeEach(() => {
  added = [];
  for (const target of [document, window]) {
    const orig = target.addEventListener.bind(target);
    vi.spyOn(target, 'addEventListener').mockImplementation((type, fn, opts) => { added.push([target, type, fn, opts]); return orig(type, fn, opts); });
  }
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-bcw]').forEach(s => s.remove());
  delete window.__bcwLoaded;
  delete window.BlueChipChat;
  delete window.BlueChipAttribution;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState(null, '', '/ai-handoff-plan?utm_source=TikTok&utm_medium=bio&utm_campaign=ai-news-daily');
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
});
afterEach(() => {
  vi.restoreAllMocks();
  added.forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
  vi.useRealTimers(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
});

const flushBot = () => vi.advanceTimersByTime(6000);
const flushPromises = async () => { await vi.advanceTimersByTimeAsync(10); };
const body = (i = 0) => JSON.parse(fetchMock.mock.calls[i][1].body);

// Opens the chat on the plan topic, gives a name, then fills in and sends the contact details.
function toQuestion() {
  window.BlueChipChat.open({ topic: 'ai-handoff-plan' });
  const ui = within(document.body);
  flushBot();
  fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Test' } });
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  flushBot();
  fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
  flushBot();
  fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
  fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'test@example.com' } });
  fireEvent.click(ui.getByRole('checkbox'));
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  return ui;
}

const OPTIONS = [
  'LinkedIn', 'Instagram', 'TikTok', 'YouTube', 'Facebook', 'Threads', 'Google search',
  'ChatGPT or another AI', 'Someone referred me', 'An email from BlueChip', 'An event or talk', 'Other', 'Skip',
];

describe('"How did you hear about us?" step', () => {
  it('asks the optional question after the details, and sends nothing until it is answered', () => {
    toQuestion();
    expect(document.body.textContent).not.toContain('One last thing');   // still typing
    flushBot();
    expect(document.body.textContent).toContain('One last thing: how did you hear about us? (optional)');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lists the options in order with Skip last, as keyboard-reachable buttons', () => {
    toQuestion();
    flushBot();
    const foot = document.querySelector('.bcw-foot');
    const labels = [...foot.querySelectorAll('button.bcw-choice')].map(b => b.textContent);
    expect(labels).toEqual(OPTIONS);
    expect(document.activeElement).toBe(foot.querySelector('button.bcw-choice'));
    expect(foot.querySelector('button.bcw-choice:last-of-type, button.bcw-skip').textContent).toBe('Skip');
  });

  it('puts visual space between Skip and the answers', () => {
    toQuestion();
    flushBot();
    const skip = document.querySelector('.bcw-foot button.bcw-skip');
    expect(skip).not.toBeNull();
    expect(skip.textContent).toBe('Skip');
    const css = document.head.querySelector('style[data-bcw]').textContent;
    expect(css).toMatch(/\.bcw-choice\.bcw-skip\{margin-top:\d+px\}/);
  });

  it('sends the slug as heard_about, with attribution, when an option is chosen', async () => {
    const ui = toQuestion();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'TikTok', exact: true }));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = body();
    expect(sent.heard_about).toBe('tiktok');
    expect(sent.attribution.first).toMatchObject({ source: 'tiktok', medium: 'bio', campaign: 'ai-news-daily', landing: '/ai-handoff-plan' });
    expect(sent.attribution.last.source).toBe('tiktok');
    expect(sent).toMatchObject({ name: 'Test', need: 'The AI Handoff Plan', contact: '7805550100', email: 'test@example.com', consent: true });
    expect(document.body.textContent).toContain('Got it, Test.');
  });

  it.each([
    ['ChatGPT or another AI', 'ai_assistant'], ['An email from BlueChip', 'email'], ['Google search', 'google'], ['Someone referred me', 'referral'], ['An event or talk', 'event'],
  ])('maps "%s" to %s', async (label, slug) => {
    const ui = toQuestion();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: label, exact: true }));
    await flushPromises();
    expect(body().heard_about).toBe(slug);
  });

  it('Skip sends the lead without heard_about', async () => {
    const ui = toQuestion();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Skip', exact: true }));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body()).not.toHaveProperty('heard_about');
    expect(body()).toHaveProperty('attribution');
    expect(document.body.textContent).toContain('Got it, Test.');
  });

  it('on a failed send keeps the choices, says so, and lets the visitor try again', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 502 });
    const ui = toQuestion();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'LinkedIn', exact: true }));
    await flushPromises();
    expect(document.body.textContent).not.toContain('Got it');
    expect(document.body.textContent).toContain("Sorry, that didn't go through.");
    fireEvent.click(ui.getByRole('button', { name: 'Skip', exact: true }));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain('Got it, Test.');
  });
});

describe('the lead is never lost at the question', () => {
  it('closing the chat while the question shows sends the lead, without heard_about', async () => {
    toQuestion();
    flushBot();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('.bcw-close'));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.keepalive).toBe(true);
    const sent = body();
    expect(sent).toMatchObject({ name: 'Test', contact: '7805550100', email: 'test@example.com', need: 'The AI Handoff Plan', consent: true });
    expect(sent).not.toHaveProperty('heard_about');
    expect(sent.attribution.first.source).toBe('tiktok');
  });

  it('closing before the question has finished appearing still sends the lead', async () => {
    toQuestion();   // the question is still "typing"
    fireEvent.click(document.querySelector('.bcw-close'));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body()).not.toHaveProperty('heard_about');
  });

  it('Escape closes the chat and sends the lead too', async () => {
    toQuestion();
    flushBot();
    fireEvent.keyDown(document, { key: 'Escape' });
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('leaving the page (pagehide) while the question shows sends the lead', async () => {
    toQuestion();
    flushBot();
    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1].keepalive).toBe(true);
    expect(body()).not.toHaveProperty('heard_about');
  });

  it('never sends the lead twice: close then pagehide', async () => {
    const ui = toQuestion();
    flushBot();
    fireEvent.click(document.querySelector('.bcw-close'));
    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();
    expect(ui.queryByRole('button', { name: 'Skip', exact: true })).toBeNull();   // the lead went; the question is closed
    expect(document.body.textContent).toContain('Got it, Test.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('after an answer, closing the chat does not send again', async () => {
    const ui = toQuestion();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Threads', exact: true }));
    await flushPromises();
    fireEvent.click(document.querySelector('.bcw-close'));
    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(body().heard_about).toBe('threads');
  });

  it('does not send anything on close before the details have been given', async () => {
    window.BlueChipChat.open({ topic: 'ai-handoff-plan' });
    flushBot();
    fireEvent.click(document.querySelector('.bcw-close'));
    window.dispatchEvent(new Event('pagehide'));
    await flushPromises();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('if the send on close fails, reopening brings the question back and the visitor can retry', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const ui = toQuestion();   // closed while still typing, so no buttons are on screen
    fireEvent.click(document.querySelector('.bcw-close'));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(document.querySelector('#bcwLaunch'));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Skip', exact: true }));
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain('Got it, Test.');
  });
});
