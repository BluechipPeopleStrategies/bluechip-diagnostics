import { layout, escapeHtml } from './_shared.js';

// Auto-reply to a contact-form sender (Thomas, Oct 9 2026): confirm we have the message, and point anyone who
// wants a quicker answer to the chat (Chip). Option B of the panel verdict: it reuses the chat's own live promise
// ("usually within a few hours on business days"); keep the two in step. Copy cleared by Infy and the panel:
// BlueChip docs/site-drafts/2026-10-09-contact-auto-reply-infy.md and references/advisory-panel/verdict-contact-auto-reply-2026-10-09.md.
export const AUTO_REPLY_CHAT_URL = 'https://www.bluechip-people-strategies.com/?utm_source=auto-reply&utm_medium=email&utm_campaign=contact-ack#chat';
export const AUTO_REPLY_SUBJECT = "We've got your message";
export const AUTO_REPLY_LINES = {
  thanks: "Thanks for getting in touch. We'll reply within two business days.",
  sooner: 'Need a quicker answer? Chat with Chip on our website and leave your number. We usually text back within a few hours on business days.',
  button: 'Chat with Chip',
  signoff: 'BlueChip People Strategies',
};
// Sender and why this one email arrived. No street address (Thomas, Oct 9: "We don't need the address in there").
export const AUTO_REPLY_FOOTER_LINES = [
  'BlueChip People Strategies Inc.',
  "You're getting this because you sent us a message through our website. It's the only email we'll send unless you write back.",
];

const P = 'margin:0 0 14px;';

export function buildContactAutoReplyEmail({ name } = {}) {
  const first = String(name ?? '').trim().split(/\s+/)[0] || '';
  const greeting = first ? `Hi ${escapeHtml(first)},` : 'Hi there,';
  const footerHtml = `<div style="font-size:12px;color:#6b6b6b;margin-top:40px;border-top:1px solid #e5e5e5;padding-top:14px;">${AUTO_REPLY_FOOTER_LINES.map((l) => `<p style="margin:0 0 6px;">${escapeHtml(l)}</p>`).join('')}</div>`;
  const html = layout(`
    <p style="${P}">${greeting}</p>
    <p style="${P}">${escapeHtml(AUTO_REPLY_LINES.thanks)}</p>
    <p style="${P}">${escapeHtml(AUTO_REPLY_LINES.sooner)}</p>
    <p style="margin:0 0 22px;"><a href="${AUTO_REPLY_CHAT_URL}" style="display:inline-block;background:#0B1A33;color:#F5EFE6;text-decoration:none;padding:12px 20px;border-radius:999px;font-family:Arial,sans-serif;font-size:15px;">${escapeHtml(AUTO_REPLY_LINES.button)}</a></p>
    <p style="${P}">${escapeHtml(AUTO_REPLY_LINES.signoff)}</p>`, { footerHtml });
  const text = [greeting, '', AUTO_REPLY_LINES.thanks, '', AUTO_REPLY_LINES.sooner, `${AUTO_REPLY_LINES.button}: ${AUTO_REPLY_CHAT_URL}`, '', AUTO_REPLY_LINES.signoff, '', '--', ...AUTO_REPLY_FOOTER_LINES].join('\n');
  return { subject: AUTO_REPLY_SUBJECT, html, text };
}
