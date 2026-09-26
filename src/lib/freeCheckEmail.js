// "Email my results" send path for the free AI check (item 61, 2026-09-25). Goes through the
// app's existing /api/submit endpoint (Resend), which has a dedicated 'ai-opportunity-check'
// branch: the server recomputes the estimate from the raw answers rather than trusting any text
// from the browser, so the endpoint can't be used to mail arbitrary content to arbitrary people.
// `bc_hp_trap` is the honeypot: the same field name the chat widget already uses, chosen because
// no browser autofill heuristic targets it (a field named "company" on another BlueChip form was
// silently filled by autofill and dropped real leads for three months).
export const AI_CHECK_DIAGNOSTIC_ID = 'ai-opportunity-check';

export async function sendFreeCheckResultsEmail({ email, include, answers, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText, honeypot = '' }) {
  const endpoint = import.meta.env.VITE_SUBMIT_ENDPOINT || '/api/submit';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      diagnosticId: AI_CHECK_DIAGNOSTIC_ID,
      email,
      include: include === 'answers' ? 'answers' : 'estimate',
      answers, areaInputs, rate, weeks, headcount, ownerOtherText, toolsOtherText,
      bc_hp_trap: honeypot,
      submittedAt: new Date().toISOString(),
    }),
  });
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON response */ }
  return { ok: res.ok && data.ok !== false, emailSent: data.emailSent !== false };
}
