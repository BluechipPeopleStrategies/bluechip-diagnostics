import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiHandoffPlanPage from '../src/components/AiHandoffPlanPage.jsx';

vi.mock('../src/lib/chatWidget.js', () => ({ loadChatWidget: vi.fn() }));
const renderPage = (path = '/ai-handoff-plan') => render(
  <MemoryRouter initialEntries={[path]}><AiHandoffPlanPage /></MemoryRouter>,
);
afterEach(() => { cleanup(); delete window.posthog; delete window.gtag; });

it('uses the clear-start copy when an experiment is unavailable', () => {
  renderPage();
  expect(screen.getByRole('heading', { name: "Not sure where AI fits in your team's work?" })).toBeInTheDocument();
});

it('uses the assigned outcome variant and records views and conversation clicks with the same variant', () => {
  const capture = vi.fn();
  window.posthog = {
    getFeatureFlag: () => 'b', capture,
    onFeatureFlags: (ready) => { ready(); return () => {}; },
  };
  renderPage();
  expect(screen.getByRole('heading', { name: 'Give your team time back from repeat work.' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Ask us' }));
  expect(capture).toHaveBeenCalledWith('plan_message_view', {
    experiment: 'ai-handoff-message-v1', variant: 'b', edition: 'general',
  });
  expect(capture).toHaveBeenCalledWith('plan_message_conversation_click', {
    experiment: 'ai-handoff-message-v1', variant: 'b', edition: 'general',
  });
});

it('lets the owner preview either variant without creating experiment events', () => {
  const capture = vi.fn(), getFeatureFlag = vi.fn(() => 'a');
  window.posthog = { capture, getFeatureFlag, onFeatureFlags: vi.fn() };
  renderPage('/ai-handoff-plan?message-variant=b');
  expect(screen.getByRole('heading', { name: 'Give your team time back from repeat work.' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('link', { name: 'Ask us' }));
  expect(capture).not.toHaveBeenCalled();
  expect(getFeatureFlag).not.toHaveBeenCalled();
});

it('keeps the offer identical between variants', () => {
  const a = renderPage('/ai-handoff-plan?message-variant=a');
  const offerA = a.container.querySelector('.plan-booking-facts').textContent;
  const faqA = a.container.querySelector('.glass-faq').textContent;
  cleanup();
  const b = renderPage('/ai-handoff-plan?message-variant=b');
  expect(b.container.querySelector('.plan-booking-facts').textContent).toBe(offerA);
  expect(b.container.querySelector('.glass-faq').textContent).toBe(faqA);
});

it('reads the loaded SDK when it replaces the asynchronous bootstrap object', () => {
  let ready;
  window.posthog = {
    getFeatureFlag: vi.fn(),
    onFeatureFlags: callback => { ready = callback; },
  };
  renderPage();
  const capture = vi.fn();
  window.posthog = { getFeatureFlag: () => 'b', capture };
  act(() => ready());
  expect(screen.getByRole('heading', { name: 'Give your team time back from repeat work.' })).toBeInTheDocument();
  expect(capture).toHaveBeenCalledWith('plan_message_view', expect.objectContaining({ variant: 'b' }));
});

it('does not evaluate a queued flag callback after leaving the page', () => {
  let ready;
  window.posthog = { getFeatureFlag: vi.fn(), onFeatureFlags: callback => { ready = callback; } };
  const page = renderPage();
  page.unmount();
  const getFeatureFlag = vi.fn(() => 'b');
  window.posthog = { getFeatureFlag, capture: vi.fn() };
  act(() => ready());
  expect(getFeatureFlag).not.toHaveBeenCalled();
});

it('keeps opted-out visitors outside the experiment', () => {
  const getFeatureFlag = vi.fn(() => 'b'), capture = vi.fn();
  window.posthog = {
    getFeatureFlag, capture, has_opted_out_capturing: () => true,
    onFeatureFlags: callback => { callback(); },
  };
  renderPage();
  fireEvent.click(screen.getByRole('link', { name: 'Ask us' }));
  expect(getFeatureFlag).not.toHaveBeenCalled();
  expect(capture).not.toHaveBeenCalled();
});
