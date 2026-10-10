import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, within } from '@testing-library/dom';

const script = readFileSync('public/widget.js', 'utf8');
let fetchMock;
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
  window.history.replaceState(null, '', '/');
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  window.gtag = vi.fn();
  window.posthog = { capture: vi.fn() };
  vi.useFakeTimers();
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
});
afterEach(() => {
  vi.restoreAllMocks();
  added.forEach(([target, type, fn, opts]) => target.removeEventListener(type, fn, opts));
  vi.useRealTimers(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/');
  delete window.gtag; delete window.posthog;
});

const flushBot = () => vi.advanceTimersByTime(6000);
const flushPromises = async () => { await vi.advanceTimersByTimeAsync(10); };

function giveName(ui) {
  flushBot();
  fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Test' } });
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
  flushBot();
}

function openOnTopic(slug) {
  window.BlueChipChat.open({ topic: slug });
  const ui = within(document.body);
  giveName(ui);
  return ui;
}

describe('chooser topics', () => {
  it('offers Workplace investigation, and Leadership development right after the retainer topic', () => {
    window.BlueChipChat.open();
    const ui = within(document.body);
    giveName(ui);
    const labels = [...document.querySelectorAll('.bcw-foot button.bcw-choice')].map(b => b.textContent);
    expect(labels).toContain('Workplace investigation');
    expect(labels).not.toContain('Termination or workplace investigation');
    expect(labels.indexOf('Leadership development')).toBe(labels.indexOf('Practical AI and/or Embedded HR Retainers') + 1);
  });
});

describe('leadership topic', () => {
  it('opens on its own bubble', () => {
    openOnTopic('leadership');
    expect(document.body.textContent).toContain('You’re looking at Leadership development');
  });

  it('has the approved link, bubble and answers in the source', () => {
    expect(script).toContain("From a half-day team session to a multi-month cohort, sized to you. Tell us what's prompting it and we'll suggest a size.");
    expect(script).toContain("url: 'https://www.bluechip-people-strategies.com/leadership'");
    expect(script).toContain("link: 'Explore leadership development'");
    expect(script).toContain("['Can we start small?', 'Yes. Start with a half-day session or a short assessment.']");
    expect(script).toContain("['Are assessments confidential?', 'Yes. Individual reports go to the person, and how results are used is agreed up front.']");
  });
});

describe('generate_lead event', () => {
  function sendLead(ui) {
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    flushBot();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'test@example.com' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Skip' }));
  }

  const leadCalls = (fn) => fn.mock.calls.filter(c => c[1] === 'generate_lead');

  it('fires once on success with the topic label and no personal details', async () => {
    const ui = openOnTopic('leadership');
    expect(leadCalls(window.gtag)).toHaveLength(0);
    sendLead(ui);
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(leadCalls(window.gtag)).toEqual([['event', 'generate_lead', { lead_source: 'chat', topic: 'Leadership development' }]]);
    expect(window.posthog.capture.mock.calls.filter(c => c[0] === 'generate_lead')).toEqual([['generate_lead', { lead_source: 'chat', topic: 'Leadership development' }]]);
    // The chat funnel steps are tracked too (Oct 9), with topic labels only.
    const steps = window.gtag.mock.calls.map(c => c[1]);
    expect(steps).toEqual(expect.arrayContaining(['bc_chat_panel_open', 'bc_chat_topic', 'bc_chat_form']));
    expect(JSON.stringify(window.gtag.mock.calls)).not.toMatch(/Test|test@example|7805550100/);
    expect(JSON.stringify(window.posthog.capture.mock.calls)).not.toMatch(/Test|test@example|7805550100/);
  });

  it('does not fire when the send fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const ui = openOnTopic('leadership');
    sendLead(ui);
    await flushPromises();
    expect(leadCalls(window.gtag)).toHaveLength(0);
    expect(window.posthog.capture.mock.calls.filter(c => c[0] === 'generate_lead')).toHaveLength(0);
  });
});
