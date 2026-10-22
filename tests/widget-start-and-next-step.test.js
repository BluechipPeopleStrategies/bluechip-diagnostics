import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { fireEvent, within } from '@testing-library/react';

const script = readFileSync('public/widget.js', 'utf8');
function mount() {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-bcw]').forEach(s => s.remove());
  delete window.__bcwLoaded;
  delete window.BlueChipChat;
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
}
const flushBot = () => vi.advanceTimersByTime(6000);
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  window.gtag = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  mount();
});
afterEach(() => { delete window.gtag; vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function openChat() { fireEvent.click(document.querySelector('#bcwLaunch')); flushBot(); return within(document.body); }
const tracked = () => window.gtag.mock.calls.map(c => c[1]);

it('opens by saying what Chip does and offers tap-to-ask questions, without asking for a name first', () => {
  const ui = openChat();
  expect(document.body.textContent).toMatch(/plain answers to common questions about practical AI for your team and about people decisions/);
  expect(ui.queryByLabelText('Your name')).toBeNull();
  [
    'What does the free AI Pulse give me?',
    'What does the AI Handoff Plan include?',
    'How does the fee-back guarantee work?',
    'Do you set the tools up for us?',
    'Something else? Ask BlueChip directly.',
    'Browse questions and answers'
  ].forEach(name => expect(ui.getByRole('button', { name, exact: true })).toBeVisible());
});
it('answers a tapped question with the approved answer, anonymously', () => {
  const ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'How does the fee-back guarantee work?' }));
  flushBot();
  expect(document.body.textContent).toMatch(/your full fee comes back automatically within 10 business days/);
  expect(ui.queryByLabelText('Your name')).toBeNull();
  expect(tracked()).toContain('bc_chat_quick');
});
it('ends every answer with a next step before more questions', () => {
  const ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'What does the AI Handoff Plan include?' }));
  flushBot();
  const text = document.querySelector('.bcw-foot').textContent;
  expect(text.indexOf('Next step')).toBeGreaterThanOrEqual(0);
  expect(text.indexOf('Next step')).toBeLessThan(text.indexOf('More questions'));
  expect(ui.getByRole('button', { name: 'Ask BlueChip about this' })).toBeVisible();
  expect(ui.getByRole('link', { name: 'Read the full AI Handoff Plan details' })).toHaveAttribute('href', 'https://check.bluechip-people-strategies.com/ai-handoff-plan');
  expect(ui.getByRole('link', { name: 'Start with the free AI Pulse, no email needed' })).toHaveAttribute('href', 'https://check.bluechip-people-strategies.com/ai-opportunity-check');
});
it('makes the free AI Pulse the next step after a Pulse answer', () => {
  const ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'What does the free AI Pulse give me?' }));
  flushBot();
  expect(ui.getByRole('link', { name: 'Open the free AI Pulse' })).toHaveAttribute('href', 'https://check.bluechip-people-strategies.com/ai-opportunity-check');
  expect(ui.queryByRole('link', { name: 'Start with the free AI Pulse, no email needed' })).toBeNull();
});
it('records which next step was taken', () => {
  const ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'What does the AI Handoff Plan include?' }));
  flushBot();
  const link = ui.getByRole('link', { name: 'Start with the free AI Pulse, no email needed' });
  link.addEventListener('click', e => e.preventDefault());
  fireEvent.click(link);
  const call = window.gtag.mock.calls.find(c => c[1] === 'bc_chat_next');
  expect(call[2].step).toBe('ai_pulse');
});
it('still reaches the name step from "Something else" and from "Ask BlueChip about this"', () => {
  let ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'Something else? Ask BlueChip directly.' }));
  flushBot();
  expect(ui.getByLabelText('Your name')).toBeVisible();

  sessionStorage.clear();
  mount();
  ui = openChat();
  fireEvent.click(ui.getByRole('button', { name: 'Do you set the tools up for us?' }));
  flushBot();
  fireEvent.click(ui.getByRole('button', { name: 'Ask BlueChip about this' }));
  flushBot();
  expect(ui.getByLabelText('Your name')).toBeVisible();
});
it('still asks for a name first when arriving on a topic from a page button', () => {
  window.BlueChipChat.open({ topic: 'ai-handoff-plan' });
  flushBot();
  expect(within(document.body).getByLabelText('Your name')).toBeVisible();
});
