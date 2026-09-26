import { buildLeadDataBlock } from './lead-data.js';
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Internal heads-up to Thomas for every diagnostic lead. Since 2026-09-26 this email IS the
// lead record (Notion is legacy, read-only): the Lead-Data block at the bottom is what the
// local Obsidian capture job parses. Reply-To is set to the lead's address by the caller,
// so a reply goes straight to them.
export function buildLeadNotificationEmail({ name, email, diagnosticId, bandLabel, total, resultLabel, orgSize, sector, emailSent, nudgeScheduled, spamTrap = false, submittedAt }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeDiagnostic = escapeHtml(diagnosticId);
  const safeBand = escapeHtml(bandLabel);
  const scoreLine =
    total != null && bandLabel ? `${safeBand} (${total}/100)` : safeBand || escapeHtml(resultLabel) || '(n/a)';
  const orgLine = orgSize || sector ? `${escapeHtml(orgSize) || '(size n/a)'} · ${escapeHtml(sector) || '(sector n/a)'}` : '';
  const emailNote = emailSent
    ? 'Their result email sent.'
    : 'Heads up: their result email did NOT send, but the lead was still captured. Consider reaching out directly.';
  return {
    subject: `New diagnostic lead: ${name || email}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;font-size:16px;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">
    <p style="font-size:18px;"><strong>New diagnostic lead</strong></p>
    <p><strong>Name:</strong> ${safeName || '(not given)'}</p>
    <p><strong>Email:</strong> ${safeEmail}</p>
    <p><strong>Diagnostic:</strong> ${safeDiagnostic}</p>
    <p><strong>Result:</strong> ${scoreLine}</p>
    ${orgLine ? `<p><strong>Org:</strong> ${orgLine}</p>` : ''}
    <p style="font-size:13px;color:#666;margin-top:24px;">${emailNote}</p>
    <p style="font-size:13px;color:#666;">Hit reply to reach them directly (their email is the Reply-To). This one is not saved anywhere else, so this email is the record: a local job files it in the Obsidian Website Leads note.</p>
    ${buildLeadDataBlock({
      kind: 'diagnostic',
      diagnostic: diagnosticId || '',
      name: name || '',
      email: email || '',
      result: scoreLineText({ bandLabel, total, resultLabel }),
      band: bandLabel || '',
      score: total != null ? total : '',
      org_size: orgSize || '',
      sector: sector || '',
      visitor_email_sent: !!emailSent,
      nudge_scheduled: nudgeScheduled === undefined ? undefined : !!nudgeScheduled,
      spam_trap: !!spamTrap,
      submitted_at: submittedAt || new Date().toISOString(),
    })}
  </div>
</body></html>`,
  };
}

function scoreLineText({ bandLabel, total, resultLabel }) {
  if (total != null && bandLabel) return `${bandLabel} (${total}/100)`;
  return bandLabel || resultLabel || '';
}
