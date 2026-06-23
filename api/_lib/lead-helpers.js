const CAPS = { name: 120, need: 1500, contact: 200, email: 200, source: 100 };

export function isHoneypot(body) {
  return typeof body?.company === 'string' && body.company.trim().length > 0;
}

function clean(value, cap) {
  return (typeof value === 'string' ? value : '').trim().slice(0, cap);
}

export function sanitizeLead(body = {}) {
  return {
    name: clean(body.name, CAPS.name),
    need: clean(body.need, CAPS.need),
    contact: clean(body.contact, CAPS.contact),
    email: clean(body.email, CAPS.email),
    source: clean(body.source, CAPS.source),
    consent: body.consent === true || body.consent === 'true',
  };
}

export function validateLead({ name, need, contact }) {
  if (!name || !need || !contact) {
    return { ok: false, error: 'missing_required_fields' };
  }
  return { ok: true };
}

// True when the string looks like a phone number (digits, not an email) so we only
// auto-text real numbers, never an email a visitor may have typed.
export function looksLikePhone(value) {
  if (typeof value !== 'string' || value.includes('@')) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7;
}

// Confirmation texted back to the visitor (they opted in via the consent box).
export function formatVisitorConfirmation({ name }) {
  const hi = name ? `Hi ${name}, ` : 'Hi, ';
  return hi + "it's BlueChip People Strategies. Thanks for reaching out. We've got your note, and someone will text you back at this number, usually within a few hours on business days. Reply STOP to opt out.";
}

export function formatLeadSms({ name, need, contact, email, source, consent }) {
  const lines = [
    'New BlueChip lead',
    `Name: ${name}`,
    `Need: ${need}`,
    `Contact: ${contact}`,
  ];
  if (email) lines.push(`Email: ${email}`);
  lines.push(`Texting consent: ${consent ? 'yes' : 'NO'}`);
  if (source) lines.push(`(from ${source})`);
  return lines.join('\n');
}
