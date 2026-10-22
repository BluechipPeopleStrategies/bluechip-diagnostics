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
const human = () => window.dispatchEvent(new Event('pointermove'));
// The prompt waits 8 seconds in view plus one human signal, then stays 10 seconds.
const DELAY = 8000, SHOW = 10000;
function showPrompt() { human(); vi.advanceTimersByTime(DELAY); return document.querySelector('.bcw-greet'); }

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => {
  delete document.visibilityState;
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

it('stays hidden on load and until the visitor has been on the page for eight seconds', () => {
  mount();
  const intro = document.querySelector('.bcw-greet');
  expect(intro).not.toBeVisible();
  human();
  vi.advanceTimersByTime(DELAY - 250);
  expect(intro).not.toBeVisible();
  vi.advanceTimersByTime(250);
  expect(intro).toBeVisible();
  expect(document.querySelector('#bcwLaunch')).toBeVisible();
});
it('never shows to a page that sees no scroll, pointer, touch or key activity', () => {
  mount();
  vi.advanceTimersByTime(120000);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
});
it('shows once a human signal arrives after the delay has already passed', () => {
  mount();
  vi.advanceTimersByTime(30000);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  human();
  vi.advanceTimersByTime(250);
  expect(document.querySelector('.bcw-greet')).toBeVisible();
});
it('does not count time while the tab is hidden', () => {
  mount();
  human();
  Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
  vi.advanceTimersByTime(60000);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  delete document.visibilityState;
  vi.advanceTimersByTime(DELAY);
  expect(document.querySelector('.bcw-greet')).toBeVisible();
});
it('stays for ten seconds, then leaves the launcher', () => {
  mount();
  const intro = showPrompt();
  vi.advanceTimersByTime(SHOW - 1);
  expect(intro).toBeVisible();
  vi.advanceTimersByTime(1);
  expect(intro).not.toBeVisible();
  expect(document.querySelector('#bcwLaunch')).toBeVisible();
});
it('says what Chip does', () => {
  mount();
  const intro = showPrompt();
  expect(intro.textContent).toMatch(/Questions about AI at work, or a people decision\?/);
  expect(intro.textContent).toMatch(/Ask Chip/);
});
it('does not repeat in the same session, nor on another page after it was shown', () => {
  mount();
  showPrompt();
  mount();
  human();
  vi.advanceTimersByTime(DELAY);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
});
it('does not show if the visitor opens the chat before the delay', () => {
  mount();
  human();
  vi.advanceTimersByTime(3000);
  fireEvent.click(document.querySelector('#bcwLaunch'));
  vi.advanceTimersByTime(DELAY);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
});
it('allows immediate dismissal and keeps it hidden after opening and closing chat', () => {
  mount();
  showPrompt();
  fireEvent.click(within(document.body).getByRole('button', { name: 'Dismiss chat introduction' }));
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  fireEvent.click(document.querySelector('#bcwLaunch'));
  fireEvent.click(within(document.body).getByRole('button', { name: 'Close chat' }));
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  expect(document.querySelector('#bcwLaunch')).toHaveFocus();
});
it('keeps the introduction available while someone is using its keyboard controls', () => {
  mount();
  const intro = showPrompt();
  within(intro).getByRole('button', { name: /Questions about AI at work, or a people decision/ }).focus();
  vi.advanceTimersByTime(20000);
  expect(intro).toBeVisible();
  document.querySelector('#bcwLaunch').focus();
  vi.advanceTimersByTime(SHOW);
  expect(intro).not.toBeVisible();
});
it('pauses on hover and resumes when the pointer leaves', () => {
  mount();
  const intro = showPrompt();
  fireEvent.mouseEnter(intro);
  vi.advanceTimersByTime(20000);
  expect(intro).toBeVisible();
  fireEvent.mouseLeave(intro);
  vi.advanceTimersByTime(SHOW);
  expect(intro).not.toBeVisible();
});
it('still works when session storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('unavailable'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('unavailable'); });
  mount();
  const intro = showPrompt();
  expect(intro).toBeVisible();
  vi.advanceTimersByTime(SHOW);
  expect(intro).not.toBeVisible();
  fireEvent.click(document.querySelector('#bcwLaunch'));
  expect(document.querySelector('#bcwPanel')).toHaveAttribute('aria-hidden', 'false');
});
it('records when the prompt is shown and when it is used, with no personal data', () => {
  window.gtag = vi.fn();
  mount();
  showPrompt();
  fireEvent.click(document.querySelector('.bcw-greet-open'));
  const names = window.gtag.mock.calls.map(c => c[1]);
  expect(names).toContain('bc_chat_prompt_shown');
  expect(names).toContain('bc_chat_prompt_open');
  delete window.gtag;
});
