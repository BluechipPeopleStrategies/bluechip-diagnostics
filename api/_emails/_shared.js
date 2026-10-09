const DEFAULT_FOOTER = `<p style="font-size:12px;color:#9a9a9a;font-style:italic;margin-top:40px;">You're getting this because you completed a BlueChip diagnostic. Reply STOP to opt out.</p>`;

// `footerHtml` replaces the default diagnostic footer for emails that need their own (e.g. the
// AI Pulse results email, which carries the sender name and mailing address).
export function layout(bodyHtml, { footerHtml } = {}) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 16px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;font-size:16px;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;">
    ${bodyHtml}
    ${footerHtml ?? DEFAULT_FOOTER}
  </div>
</body></html>`;
}

// Everything that comes from the browser is HTML-escaped before it goes into an email
// (2026-10-09 bug check, item 6: names and result text were interpolated raw).
export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The next step after a diagnostic result is "Start the conversation": the site chat, tagged
// so the visit is attributable. The paid Clarity Call and its booking link are gone (2026-10-09).
export const CONVERSATION_URL = 'https://www.bluechip-people-strategies.com/?utm_source=diagnostic-email#chat';

export function conversationLink() {
  return `<a href="${CONVERSATION_URL}" style="color:#1a1a1a;text-decoration:underline;">start the conversation</a>`;
}

// "Dimension (NN/100)" text for the score emails; degrades to the label alone, or to nothing,
// rather than printing "(null/100)" when a number or label is missing.
export function scoreText({ bandLabel, total }) {
  const band = escapeHtml(bandLabel);
  const hasTotal = Number.isInteger(total) && total >= 0 && total <= 100;
  if (band && hasTotal) return `${band} (${total}/100)`;
  if (band) return band;
  return hasTotal ? `${total}/100` : 'your score';
}
