// One recipient, plain address only. Rejects lists ("a@x.com,b@y.com"), display names
// ("Name <a@x.com>"), quotes, whitespace and control characters, so a request can never address
// more than the one inbox it names (2026-10-09 bug check, item 6).
const PART = '[^\\s@<>"\',;:()\\[\\]\\\\\\u0000-\\u001f]+';
const EMAIL_RE = new RegExp(`^${PART}@${PART}\\.${PART}$`);

export function cleanRecipient(value) {
  const email = String(value ?? '').trim();
  return email.length <= 254 && EMAIL_RE.test(email) ? email : '';
}
