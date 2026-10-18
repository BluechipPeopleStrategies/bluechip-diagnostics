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
beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('introduces chat immediately for five seconds, then leaves the launcher', () => {
  mount();
  const intro = document.querySelector('.bcw-greet');
  expect(intro).toBeVisible();
  vi.advanceTimersByTime(4999);
  expect(intro).toBeVisible();
  vi.advanceTimersByTime(1);
  expect(intro).not.toBeVisible();
  expect(document.querySelector('#bcwLaunch')).toBeVisible();
});
it('does not repeat the introduction on another page in the same session', () => {
  mount();
  mount();
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
});
it('allows immediate dismissal and keeps it hidden after opening and closing chat', () => {
  mount();
  fireEvent.click(within(document.body).getByRole('button', { name: 'Dismiss chat introduction' }));
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  fireEvent.click(document.querySelector('#bcwLaunch'));
  fireEvent.click(within(document.body).getByRole('button', { name: 'Close chat' }));
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  expect(document.querySelector('#bcwLaunch')).toHaveFocus();
});
it('keeps the introduction available while someone is using its keyboard controls', () => {
  mount();
  const intro = document.querySelector('.bcw-greet');
  within(intro).getByRole('button', { name: /A people decision or a practical AI question/ }).focus();
  vi.advanceTimersByTime(10000);
  expect(intro).toBeVisible();
  document.querySelector('#bcwLaunch').focus();
  vi.advanceTimersByTime(5000);
  expect(intro).not.toBeVisible();
});
it('pauses on hover and resumes when the pointer leaves', () => {
  mount();
  const intro = document.querySelector('.bcw-greet');
  fireEvent.mouseEnter(intro);
  vi.advanceTimersByTime(10000);
  expect(intro).toBeVisible();
  fireEvent.mouseLeave(intro);
  vi.advanceTimersByTime(5000);
  expect(intro).not.toBeVisible();
});
it('still works when session storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('unavailable'); });
  mount();
  expect(document.querySelector('.bcw-greet')).toBeVisible();
  vi.advanceTimersByTime(5000);
  expect(document.querySelector('.bcw-greet')).not.toBeVisible();
  fireEvent.click(document.querySelector('#bcwLaunch'));
  expect(document.querySelector('#bcwPanel')).toHaveAttribute('aria-hidden', 'false');
});
