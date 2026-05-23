export function layout(bodyHtml) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 16px;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;font-size:16px;background:#ffffff;">
  <div style="max-width:560px;margin:0 auto;">
    ${bodyHtml}
    <p style="font-size:12px;color:#9a9a9a;font-style:italic;margin-top:40px;">You're getting this because you completed a BlueChip diagnostic. Reply STOP to opt out.</p>
  </div>
</body></html>`;
}

export function buildCalUrl({ diagnosticId, bandLabel, total, detail }) {
  const baseUrl = process.env.CAL_BOOKING_URL || process.env.VITE_CAL_BOOKING_URL;
  if (!baseUrl) return '';
  let url;
  try {
    url = new URL(baseUrl);
  } catch {
    return '';
  }
  const lines = [];
  if (diagnosticId) lines.push(`Diagnostic: ${diagnosticId}`);
  if (bandLabel) lines.push(`Result: ${bandLabel}`);
  if (typeof total === 'number') lines.push(`Total: ${total}/100`);
  if (detail) lines.push(`Detail: ${detail}`);
  const notes = lines.join(' | ');
  if (notes) url.searchParams.set('notes', notes);
  return url.toString();
}

export function calLink(url, fallbackText = 'just reply to this email') {
  if (!url) return null;
  return `<a href="${url}" style="color:#1a1a1a;text-decoration:underline;">my Cal is here</a>`;
}
