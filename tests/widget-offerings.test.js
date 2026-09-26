import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fireEvent, within } from '@testing-library/dom';
import { formatVisitorConfirmation } from '../api/_lib/lead-helpers.js';

const script = readFileSync('public/widget.js', 'utf8');
let fetchMock;

beforeEach(() => {
  document.body.innerHTML = '';
  document.head.querySelectorAll('style[data-bcw]').forEach(s => s.remove());
  delete window.__bcwLoaded;
  delete window.BlueChipChat;
  fetchMock = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
  window.eval(script);
  if (!document.querySelector('#bcwLaunch')) document.dispatchEvent(new Event('DOMContentLoaded'));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

// Flushes the typing-indicator sequence (jsdom's mocked matchMedia reports reduced motion by
// default, per tests/setup.js, so this is a flat, bounded delay regardless of message count).
function flushBot() { vi.advanceTimersByTime(6000); }

function openChat() {
  fireEvent.click(document.querySelector('#bcwLaunch'));
}
function sendName(name) {
  const ui = within(document.body);
  flushBot();
  fireEvent.change(ui.getByLabelText('Your name'), { target: { value: name } });
  fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
}
function choose(label) {
  const ui = within(document.body);
  openChat();
  sendName('Test');
  flushBot();
  fireEvent.click(ui.getByRole('button', { name: label, exact: true }));
  flushBot();
  return ui;
}

describe('chip visibility (design fix 2026-09-24)', () => {
  it('styles topic chips with a visible navy border, bone fill, and an arrow, not near-white-on-white', () => {
    const styleText = document.querySelector('style[data-bcw]').textContent;
    expect(styleText).toMatch(/\.bcw-choice\{[^}]*background:#F5EFE6/i);
    expect(styleText).toMatch(/\.bcw-choice\{[^}]*border:1\.5px solid rgba\(11,26,51,\.35\)/);
    expect(styleText).toMatch(/\.bcw-choice\{[^}]*min-height:44px/);
    expect(styleText).toMatch(/\.bcw-choice:hover,\.bcw-choice:focus-visible\{border-color:#C9A24B/);
    expect(styleText).toMatch(/\.bcw-choice::after\{content:"\\2192"/);
  });
});

describe('the Free AI Opportunity Check topic is removed', () => {
  it('is not offered in the main choice list', () => {
    const ui = within(document.body);
    openChat();
    sendName('Test');
    flushBot();
    expect(ui.queryByRole('button', { name: 'Free AI Opportunity Check', exact: true })).not.toBeInTheDocument();
  });
  // Browse is hidden (SHOW_BROWSE = false, 2026-09-24, revisit ~2026-10-08), so the topic
  // browser itself isn't reachable right now; see "no longer offers the free check or browse".
});

describe('new offering intake', () => {
  // Browse is hidden (SHOW_BROWSE = false, 2026-09-24). Re-enable these two when it comes back.
  it.skip('lets visitors browse accurate answers anonymously and preserves the topic for handoff', () => {
    const ui = within(document.body);
    openChat();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Browse questions and answers' }));
    flushBot();
    expect(ui.queryByLabelText('Your name')).toBeNull();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true }));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'How does the three-hour guarantee work?' }));
    flushBot();
    expect(document.body.textContent).toContain('evidence-backed potential');
    expect(document.body.textContent).toContain('not three per person');
    expect(document.body.textContent).toContain('no forms, no hoops');
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(ui.getByRole('button', { name: 'Ask BlueChip about this' }));
    flushBot();
    sendName('Test');
    flushBot();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('The AI Handoff Plan');
  });
  // Browse is hidden (SHOW_BROWSE = false, 2026-09-24, revisit ~2026-10-08). Re-enable when it's back.
  it.skip('supports returning to topics and links resources without collecting details', () => {
    const ui = within(document.body);
    openChat();
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Browse questions and answers' }));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Other BlueChip services', exact: true }));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'All topics' }));
    flushBot();
    expect(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('answers the plan topic as three short bubbles: what it is, the deal, whose it is', () => {
    const ui = choose('The AI Handoff Plan');
    expect(document.body.textContent).toContain("The AI Handoff Plan looks at your team's recurring work");
    expect(document.body.textContent).toContain('C$999, taxes included');
    expect(document.body.textContent).toContain("Here's the deal");
    expect(document.body.textContent).toContain('at least 3 net hours a week of time savings across your organization');
    expect(document.body.textContent).toContain('your full fee comes back within 10 business days');
    expect(document.body.textContent).toContain('No forms, no hoops');
    expect(document.body.textContent).toContain('The plan is yours to put in place');
    expect(ui.queryByLabelText('Your phone number')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires consent before submitting', () => {
    const ui = choose('The AI Handoff Plan');
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    flushBot();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'test@example.com' } });
    const send = ui.getByRole('button', { name: 'Send', exact: true });
    expect(send).toBeDisabled();
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(send);
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({ need: 'The AI Handoff Plan', consent: true });
    expect(payload).toHaveProperty('bc_hp_trap');
    expect(payload).not.toHaveProperty('company');
  });
  it('keeps AI-only and combined advisory options and supports changing service', () => {
    const ui = choose('Practical AI and/or Embedded HR Retainers');
    expect(document.body.textContent).toContain('Support can focus on AI alone or combine HR and AI');
    fireEvent.click(ui.getByRole('button', { name: 'Choose a different service' }));
    flushBot();
    expect(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends an inquiry acknowledgement, not a booking or savings promise', () => {
    const audit = formatVisitorConfirmation({ name: 'Test', need: 'Practical AI Audit' });
    expect(audit).not.toContain('C$999');
    expect(audit).toContain('bluechip-diagnostics.vercel.app/ai-handoff-plan');
    expect(audit).toContain("it's Chip with BlueChip People Strategies");
    expect(audit).toContain('not a booking or payment');
    expect(audit).toContain('STOP');
    expect(formatVisitorConfirmation({ need: 'Embedded HR + AI Advisory' })).toContain('AI alone or combine HR and AI');
    expect(formatVisitorConfirmation({ need: 'Practical AI and/or Embedded HR Retainers' })).toContain('Practical AI and/or Embedded HR Retainers inquiry');
    expect(formatVisitorConfirmation({ need: 'Leadership coaching' })).not.toContain('C$999');
  });
  it('the phone-capture bubble uses the updated, semicolon-free copy', () => {
    choose('The AI Handoff Plan');
    fireEvent.click(within(document.body).getByRole('button', { name: 'Discuss this with BlueChip' }));
    flushBot();
    expect(document.body.textContent).toContain("This sends an inquiry. It doesn't book anything or charge you.");
    expect(document.body.textContent).not.toMatch(/does not book or charge you for an audit/);
  });
  it('no longer offers the free check or browse on the topic list', () => {
    const ui = within(document.body);
    openChat();
    flushBot();
    expect(ui.queryByRole('button', { name: 'Browse questions and answers' })).toBeNull();
    sendName('Test');
    flushBot();
    expect(ui.queryByRole('button', { name: 'Free AI Opportunity Check', exact: true })).toBeNull();
    expect(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true })).toBeVisible();
  });
});

describe('typing cadence: indicator, delay, and cancellation', () => {
  it('shows a typing indicator before a bubble lands, and reveals chips only after the last bubble', () => {
    const ui = within(document.body);
    openChat();
    sendName('Test');
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true }));
    // After the pre-bubble beat (~500ms) but before the message delay completes: indicator
    // showing, nothing has landed yet, no action chips.
    vi.advanceTimersByTime(550);
    expect(document.querySelector('.bcw-typing')).toBeTruthy();
    expect(ui.queryByRole('button', { name: 'Discuss this with BlueChip' })).not.toBeInTheDocument();
    flushBot();
    expect(document.querySelector('.bcw-typing')).toBeNull();
    expect(ui.getByRole('button', { name: 'Discuss this with BlueChip' })).toBeInTheDocument();
  });
  it('cancels a queued sequence on close, so nothing lands after the panel is closed', () => {
    const ui = within(document.body);
    openChat();
    sendName('Test');
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true }));
    fireEvent.click(document.querySelector('.bcw-close'));
    const bubbleCountAtClose = document.querySelectorAll('.bcw-msg-bot').length;
    flushBot();
    expect(document.querySelectorAll('.bcw-msg-bot').length).toBe(bubbleCountAtClose);
  });
  it('cancels a queued sequence when redirected to a different topic mid-sequence', () => {
    const ui = within(document.body);
    openChat();
    sendName('Test');
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'The AI Handoff Plan', exact: true }));
    // Before the plan's 3-bubble answer has landed, something else asks for a different topic
    // (e.g. a second CTA click on the page): the queued plan bubbles must never land afterward.
    window.BlueChipChat.open({ topic: 'retainers' });
    flushBot();
    expect(document.body.textContent).not.toContain("Here's the deal");
    expect(document.body.textContent).toContain('Practical AI and/or Embedded HR Retainers');
  });
});

describe('topic preselect (plan-page CTA and #chat?topic=)', () => {
  it('window.BlueChipChat.open({ topic }) skips the chooser and greets by topic name', () => {
    const ui = within(document.body);
    window.BlueChipChat.open({ topic: 'ai-handoff-plan' });
    flushBot();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flushBot();
    expect(document.body.textContent).toContain("Thanks, Sam. You\u2019re looking at The AI Handoff Plan.");
    expect(document.body.textContent).toContain("Here's the deal");
    expect(ui.queryByRole('button', { name: 'The AI Handoff Plan', exact: true })).not.toBeInTheDocument(); // chooser skipped
  });
  it('an a[href="#chat?topic=ai-handoff-plan"] click opens preselected', () => {
    const ui = within(document.body);
    const link = document.createElement('a');
    link.href = '#chat?topic=ai-handoff-plan';
    link.textContent = 'Start the conversation';
    document.body.appendChild(link);
    fireEvent.click(link);
    flushBot();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flushBot();
    expect(document.body.textContent).toContain('You\u2019re looking at The AI Handoff Plan');
  });
  it('records the right lead topic label after a preselected conversation', () => {
    const ui = within(document.body);
    window.BlueChipChat.open({ topic: 'ai-handoff-plan' });
    flushBot();
    fireEvent.change(ui.getByLabelText('Your name'), { target: { value: 'Sam' } });
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    flushBot();
    fireEvent.click(ui.getByRole('button', { name: 'Discuss this with BlueChip' }));
    flushBot();
    fireEvent.change(ui.getByLabelText('Your phone number'), { target: { value: '7805550100' } });
    fireEvent.change(ui.getByLabelText('Your email'), { target: { value: 'sam@example.com' } });
    fireEvent.click(ui.getByRole('checkbox'));
    fireEvent.click(ui.getByRole('button', { name: 'Send', exact: true }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).need).toBe('The AI Handoff Plan');
  });
  it('opened with no topic (plain #chat or the launch button), it behaves as it does now: the chooser is shown', () => {
    window.history.replaceState(null, '', '/#chat');
    document.body.innerHTML = '';
    delete window.__bcwLoaded;
    window.eval(script);
    expect(document.querySelector('#bcwPanel')).toHaveAttribute('aria-hidden', 'false');
    expect(fetchMock).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/');
  });
});
