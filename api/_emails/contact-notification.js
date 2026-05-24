function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildContactNotificationEmail({ name, email, inquiry, source, acks }) {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeInquiry = escapeHtml(inquiry).replace(/\n/g, '<br/>');
  const safeSource = escapeHtml(source || 'website');
  const ack1 = acks?.advisoryOnly ? '✅' : '❌';
  const ack2 = acks?.decisionsAreMine ? '✅' : '❌';
  const ack3 = acks?.readMSA ? '✅' : '❌';
  return {
    subject: `New contact: ${name || email}`,
    html: `<!DOCTYPE html>
<html><body style="font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;font-size:16px;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">
    <p><strong>From:</strong> ${safeName} &lt;${safeEmail}&gt;</p>
    <p><strong>Source:</strong> ${safeSource}</p>
    <p><strong>Inquiry:</strong></p>
    <blockquote style="border-left:3px solid #ccc;margin:0;padding-left:14px;color:#333;">${safeInquiry}</blockquote>
    <p style="font-size:13px;color:#666;margin-top:24px;">
      Acknowledgements: ${ack1} advisory-only, ${ack2} decisions-are-mine, ${ack3} read-MSA
    </p>
    <p style="font-size:13px;color:#666;">Hit reply to respond directly. Their email is the Reply-To header.</p>
  </div>
</body></html>`,
  };
}
