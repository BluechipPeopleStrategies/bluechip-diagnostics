/* global process */
import { PULSE_VERSION, SHARING_NOTICE, SCALE, OPPORTUNITIES, STATUS_LABELS, restorePulse, pulseSnapshot } from '../../src/lib/pulseDiscovery.js';
import { buildLeadNotificationEmail } from './lead-notification.js';
import { cleanRecipient } from '../_lib/email-address.js';
import { isHoneypot } from '../_lib/lead-helpers.js';
import { sanitizeAttribution, sanitizeHeardAbout } from '../_lib/attribution.js';
const esc = v => String(v ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HELP_LABELS = { none:'Nothing yet', part:'A tool or process helps with part of it', underused:'We have tools we could use more fully', unknown:'Not sure' };
const TOOLS = { m365:'Microsoft 365', google:'Google Workspace', mixed:'A mix of tools', other:'Something else', unknown:'Not sure' };
const INFO = { public:'Public or non-sensitive information', internal:'Internal work information', confidential:'Personal, client or other confidential information', unknown:'Not sure' };
export async function handlePulseDiscovery(body,res,{sendEmail}) {
  const email = cleanRecipient(body.email);
  if (!email || body.pulseVersion !== PULSE_VERSION || body.pulse?.version !== PULSE_VERSION || body.shareCompletedCheck !== true || body.sharingNoticeVersion !== SHARING_NOTICE) return res.status(400).json({ error:'invalid_discovery_request' });
  const state = restorePulse(body.pulse), snapshot = pulseSnapshot(state);
  const answers = OPPORTUNITIES.map(o => `${o.prompt}: ${STATUS_LABELS[state.answers[o.id]] || 'Not explored'}${state.help[o.id] ? `; Current help: ${HELP_LABELS[state.help[o.id]]}` : ''}`).join('\n') + `\nInformation: ${INFO[state.information] || 'Not answered'}\nTools: ${TOOLS[state.tools] || 'Not answered'}`;
  const resultLabel = `AI Pulse snapshot: ${snapshot.opportunities.length} current possibilities; ${snapshot.future.length} ideas for future work`;
  const details = `${resultLabel}\nStarting point: ${snapshot.startingPoint?.capability || 'Ask the team what they keep searching for, rewriting or explaining'}\nQualitative discovery; no personalized hours or savings estimate.\nFixed learning illustration only: ${SCALE.people} people x ${SCALE.hours} net hours/week x ${SCALE.weeks} weeks x C$${SCALE.rate}/hour = C$${SCALE.annualValue}/year in illustrative staff-time value, not cash savings.`;
  const checkSnapshot = { notice: SHARING_NOTICE, answers, details, json: JSON.stringify({ version:PULSE_VERSION, inputs:state, snapshot, fixedIllustration:SCALE }) };
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const where = { attribution:sanitizeAttribution(body.attribution) || undefined, heardAbout:sanitizeHeardAbout(body.heard_about) || undefined };
  const spamTrap = isHoneypot(body);
  let emailSent = false;
  if (!spamTrap) {
    const cards = (items,label) => items.length ? `<h2>${label}</h2>${items.map(o => `<h3>${esc(o.capability)}</h3><p>${esc(o.explain)}</p><p><strong>A first step:</strong> ${esc(o.first)}</p>`).join('')}` : '';
    const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1a33;padding:24px"><main style="max-width:640px;margin:auto"><h1>Your AI Pulse snapshot</h1><p>Your free opportunities and practical next steps.</p>${snapshot.startingPoint ? `<h2>Your starting point</h2><p>${esc(snapshot.startingPoint.first)}</p>` : '<p>Ask your team: what do we keep searching for, rewriting or explaining?</p>'}${cards(snapshot.opportunities,'Worth exploring')}${cards(snapshot.future,'Work you would like to do')}${snapshot.covered.length ? `<p><strong>Keep what works:</strong> ${snapshot.covered.map(o=>esc(o.capability)).join('; ')}.</p>` : ''}${snapshot.uncertain.length ? `<p><strong>Ask your team:</strong> ${snapshot.uncertain.map(o=>esc(o.capability)).join('; ')}.</p>` : ''}<h2>Small gains across a team</h2><p>Imagine 10 people finding 2.5 net hours each a week: 25 team hours a week, or 1,200 hours over 48 working weeks. At an illustrative C$40/hour, that is C$48,000 in annual staff-time value.</p><p>This is a fixed learning example, not a result calculated from your answers or a client outcome. It is capacity for other work, not cash savings. Net time allows for checking and upkeep. Software, setup and rollout costs are additional.</p><p><a href="https://check.bluechip-people-strategies.com/ai-handoff-plan">See how the AI Handoff Plan works, with current pricing and guarantee details</a>. Your fee is confirmed before you book.</p><p>Not sure whether it makes sense? Reply and we can talk through your work.</p>${body.includeAnswers === true ? `<h2>Your answers</h2><pre style="white-space:pre-wrap;font:inherit">${esc(answers)}</pre>` : ''}<p style="font-size:13px">You requested this one results email. Newsletter signup is a separate choice.</p></main></body></html>`;
    emailSent = await sendEmail({to:email,subject:'Your AI Pulse snapshot',html,replyTo:notifyTo});
  }
  const note = buildLeadNotificationEmail({ name:'',email,diagnosticId:'ai-opportunity-check',bandLabel:'',total:null,resultLabel,emailSent,nudgeScheduled:false,spamTrap,submittedAt:new Date().toISOString(),checkSnapshot,...where });
  const leadNotificationSent = await sendEmail({to:notifyTo,subject:spamTrap ? `[Check: spam trap] ${note.subject}` : note.subject,html:note.html,replyTo:email});
  return res.status(leadNotificationSent ? 200 : 502).json({ok:leadNotificationSent,emailSent,leadNotificationSent,nudgeScheduled:false});
}
