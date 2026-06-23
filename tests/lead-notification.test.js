import { describe, it, expect } from 'vitest';
import { buildLeadNotificationEmail } from '../api/_emails/lead-notification.js';

describe('buildLeadNotificationEmail', () => {
  it('puts the lead name (or email) in the subject', () => {
    expect(buildLeadNotificationEmail({ name: 'Dana Lee', email: 'dana@acme.org' }).subject).toBe(
      'New diagnostic lead: Dana Lee'
    );
    expect(buildLeadNotificationEmail({ name: '', email: 'dana@acme.org' }).subject).toBe(
      'New diagnostic lead: dana@acme.org'
    );
  });

  it('includes the email, diagnostic, and band+score in the body', () => {
    const { html } = buildLeadNotificationEmail({
      name: 'Dana Lee',
      email: 'dana@acme.org',
      diagnosticId: 'supervisor-blind-spot',
      bandLabel: 'The Coach',
      total: 72,
      resultLabel: 'The Coach (72/100)',
    });
    expect(html).toContain('dana@acme.org');
    expect(html).toContain('supervisor-blind-spot');
    expect(html).toContain('The Coach (72/100)');
  });

  it('warns when the result email did not send', () => {
    expect(buildLeadNotificationEmail({ email: 'd@x.org', emailSent: false }).html).toContain('did NOT send');
    expect(buildLeadNotificationEmail({ email: 'd@x.org', emailSent: true }).html).toContain('result email sent');
  });

  it('escapes HTML in untrusted fields', () => {
    const { html } = buildLeadNotificationEmail({
      name: '<script>alert(1)</script>',
      email: 'x@y.org',
    });
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
