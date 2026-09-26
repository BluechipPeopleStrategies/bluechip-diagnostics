// Machine-readable "Lead-Data" footer for the internal lead notifications (2026-09-26).
//
// Notion is legacy and read-only, so these notification emails are now the lead record.
// A local job (BlueChip/tools/diagnostic-leads-to-obsidian.py) reads them from Thomas's
// mailbox and files each lead in the Obsidian vault. It parses this block rather than the
// human-readable HTML above it, so the email's look can change without breaking capture.
//
// Format, one field per line, inside a <pre> so the line breaks survive:
//   Lead-Data: v1
//   kind: diagnostic
//   email: pat@example.com
//   ...
//   End-Lead-Data
// Values are HTML-escaped in the email; inside a value a backslash is written `\\` and a
// line break `\n`, so every field stays on one line. Booleans are `yes` / `no`.

export const LEAD_DATA_START = 'Lead-Data: v1';
export const LEAD_DATA_END = 'End-Lead-Data';

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeValue(value) {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n');
}

// fields: ordered { key: value }. Undefined/null values are left out; an empty string is kept
// (so "name:" with nothing after it means the visitor gave no name).
export function buildLeadDataBlock(fields) {
  const lines = [LEAD_DATA_START];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    lines.push(`${key}: ${encodeValue(value)}`);
  }
  lines.push(LEAD_DATA_END);
  return `<pre style="font-family:Consolas,Menlo,monospace;font-size:11px;line-height:1.4;color:#888;white-space:pre-wrap;margin-top:24px;border-top:1px solid #eee;padding-top:8px;">${escapeHtml(lines.join('\n'))}</pre>`;
}

// Reverse of buildLeadDataBlock, for tests (the Python job has its own copy of this logic).
export function parseLeadDataBlock(html) {
  // The terminator must be a whole line: a value can never be, because every value line starts
  // with "key: ", so a visitor typing "End-Lead-Data" into a field cannot cut the block short.
  const start = html.indexOf(LEAD_DATA_START);
  if (start === -1) return null;
  const end = html.indexOf(`\n${LEAD_DATA_END}`, start);
  if (end === -1) return null;
  const unescape = (s) =>
    s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const out = {};
  for (const line of html.slice(start + LEAD_DATA_START.length, end).split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    if (!key) continue;
    const raw = unescape(line.slice(idx + 1).replace(/^ /, ''));
    out[key] = raw.replace(/\\(\\|n)/g, (_, c) => (c === 'n' ? '\n' : '\\'));
  }
  return out;
}
