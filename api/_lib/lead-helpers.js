const CAPS = { name: 120, need: 1500, contact: 200, source: 100 };

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
    source: clean(body.source, CAPS.source),
  };
}

export function validateLead({ name, need, contact }) {
  if (!name || !need || !contact) {
    return { ok: false, error: 'missing_required_fields' };
  }
  return { ok: true };
}

export function formatLeadSms({ name, need, contact, source }) {
  const lines = [
    'New BlueChip lead',
    `Name: ${name}`,
    `Need: ${need}`,
    `Contact: ${contact}`,
  ];
  if (source) lines.push(`(from ${source})`);
  return lines.join('\n');
}
