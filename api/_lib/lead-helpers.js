const CAPS = { name: 120, need: 1500, contact: 200, email: 200, source: 100 };

// The trap field is named bc_hp_trap. It used to be "company", but browsers autofill any
// field called company, so real visitors were flagged as bots and their leads were dropped
// (found 2026-09-24). A stray "company" value from an old cached widget is now ignored.
export function isHoneypot(body) {
  return typeof body?.bc_hp_trap === 'string' && body.bc_hp_trap.trim().length > 0;
}

// Canadian or US number (North American plan, +1). Visitor confirmation texts only go to these;
// anyone else gets their reply by email.
export function isNorthAmericanPhone(value) {
  const d = String(value || '').replace(/\D/g, '');
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
}

// Same phone number, compared on the last 10 digits (ignores +1, spaces and dashes).
export function samePhone(a, b) {
  const d = (v) => String(v || '').replace(/\D/g, '').slice(-10);
  return d(a).length >= 7 && d(a) === d(b);
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Email copy of every chat lead, so a failed text never means a missed lead.
export function buildChatLeadEmail(lead, { smsSent, suspectedSpam, confirmationNote } = {}) {
  const flag = suspectedSpam ? '[Check: spam trap] ' : '';
  const rows = [
    ['Name', lead.name], ['Need', lead.need], ['Phone', lead.contact], ['Email', lead.email || '(not given)'],
    ['Texting consent', lead.consent ? 'yes' : 'NO'], ['Page', lead.source || 'chat widget'],
    ['Text alert to Thomas', smsSent ? 'sent' : 'NOT sent (reply from this email)'],
  ];
  if (confirmationNote) rows.push(['Visitor confirmation', confirmationNote]);
  const note = suspectedSpam
    ? '<p style="color:#8b2e2e"><strong>The hidden spam-trap field was filled in.</strong> It is probably a bot, but check before ignoring it. No text alert was sent for this one.</p>'
    : '';
  return {
    subject: `${flag}New chat lead: ${lead.name || lead.contact} (${lead.need || 'no topic'})`,
    html: `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5;padding:20px"><div style="max-width:600px;margin:0 auto"><p style="font-size:18px"><strong>New chat lead</strong></p>${note}<table cellpadding="6" style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="color:#555;vertical-align:top"><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join('')}</table><p style="font-size:13px;color:#666;margin-top:20px">Reply to this email to reach them if they gave an email address.</p></div></body></html>`,
  };
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

export function validateLead({ name, need, contact, email }) {
  if (!name || !need || !contact) {
    return { ok: false, error: 'missing_required_fields' };
  }
  // Email is required from the widget (2026-09-24). An older cached widget may still send
  // none, so a missing email is accepted here rather than losing the lead.
  // Never reject a lead over an odd-looking email: the email copy still reaches Thomas.
  void email;
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
export function formatVisitorConfirmation({ name, need }) {
  const hi = name ? `Hi ${name}, ` : 'Hi, ';   // reads: "Hi T, it's Chip with BlueChip People Strategies."
  // "Practical AI Audit" is the old label, kept so inquiries from a cached widget (or an old
  // shared link) still get the right confirmation text after the rename to The AI Handoff Plan.
  if (need === 'The AI Handoff Plan' || need === 'Practical AI Audit') {
    return hi + "it's Chip with BlueChip People Strategies. We received your AI Handoff Plan inquiry (C$999, taxes included). This is not a booking or payment. We'll text you about next steps, usually within a few hours on business days. Reply STOP to opt out.";
  }
  // Old label kept so inquiries from a cached widget still get the right text.
  if (need === 'Practical AI and/or Embedded HR Retainers' || need === 'Embedded HR + AI Advisory') {
    return hi + "it's Chip with BlueChip People Strategies. We received your Practical AI and/or Embedded HR Retainers inquiry. Support can focus on AI alone or combine HR and AI. We'll text you about next steps, usually within a few hours on business days. Reply STOP to opt out.";
  }
  return hi + "it's Chip with BlueChip People Strategies. Thanks for reaching out. We've got your note, and someone will text you back at this number, usually within a few hours on business days. Reply STOP to opt out.";
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
