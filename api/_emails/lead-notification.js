function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Internal heads-up to Thomas when a diagnostic lead is captured, so leads do not
// sit unseen in the Notion DB. Mirrors buildContactNotificationEmail. Reply-To is
// set to the lead's address by the caller, so a reply goes straight to them.
export function buildLeadNotificationEmail({ name, email, diagnosticId, bandLabel, total, resultLabel, orgSize, sector, emailSent }) {
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
    <p style="font-size:13px;color:#666;">Hit reply to reach them directly (their email is the Reply-To). The full record is in the Diagnostic Submissions database in Notion.</p>
  </div>
</body></html>`,
  };
}
