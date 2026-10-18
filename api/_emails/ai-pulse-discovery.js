/* global process */
import { PULSE_VERSION, SHARING_NOTICE, LEGACY_SHARING_NOTICE, SCALE, OPPORTUNITIES, restorePulse, pulseSnapshot } from '../../src/lib/pulseDiscovery.js';
import { pulseAnswerLabel } from '../../src/data/pulseAnswerCopy.js';
import { buildPulseStartingPointsEmail } from './pulse-starting-points.js';
import { buildLeadNotificationEmail } from './lead-notification.js';
import { cleanRecipient } from '../_lib/email-address.js';
import { isHoneypot } from '../_lib/lead-helpers.js';
import { sanitizeAttribution, sanitizeHeardAbout } from '../_lib/attribution.js';
const HELP_LABELS = { none:'Nothing yet', part:'A tool or process helps with part of it', underused:'We have tools we could use more fully', unknown:'Not sure' };
const TOOLS = { m365:'Microsoft 365', google:'Google Workspace', mixed:'A mix of tools', other:'Something else', unknown:'Not sure' };
const INFO = { public:'Public or non-sensitive information', internal:'Internal work information', confidential:'Personal, client or other confidential information', unknown:'Not sure' };
export async function handlePulseDiscovery(body,res,{sendEmail}) {
  const email = cleanRecipient(body.email);
  if (!email || body.pulseVersion !== PULSE_VERSION || body.pulse?.version !== PULSE_VERSION || body.shareCompletedCheck !== true || ![SHARING_NOTICE, LEGACY_SHARING_NOTICE].includes(body.sharingNoticeVersion)) return res.status(400).json({ error:'invalid_discovery_request' });
  const state = restorePulse({...body.pulse, note: body.sharingNoticeVersion === SHARING_NOTICE ? body.pulse.note : ''}), snapshot = pulseSnapshot(state);
  const answers = OPPORTUNITIES.map(o => `${o.prompt}: ${pulseAnswerLabel(o,state.answers[o.id])}${state.help[o.id] ? `; Current help: ${HELP_LABELS[state.help[o.id]]}` : ''}`).join('\n') + `\nInformation: ${INFO[state.information] || 'Not answered'}\nTools: ${TOOLS[state.tools] || 'Not answered'}` + (state.note ? `\nOptional note: ${state.note}` : '');
  const resultLabel = `AI Pulse starting points: ${snapshot.opportunities.length} current possibilities; ${snapshot.future.length} ideas for future work`;
  const details = `${resultLabel}\nStarting point: ${snapshot.startingPoint?.capability || 'Ask the team what they keep searching for, rewriting or explaining'}\nQualitative discovery; no personalized hours or savings estimate.\nFixed learning illustration only: ${SCALE.people} people x ${SCALE.hours} net hours/week x ${SCALE.weeks} weeks x C$${SCALE.rate}/hour = C$${SCALE.annualValue}/year in illustrative staff-time value, not cash savings.`;
  const checkSnapshot = { notice: body.sharingNoticeVersion, answers, details, json: JSON.stringify({ version:PULSE_VERSION, inputs:state, snapshot, fixedIllustration:SCALE }) };
  const notifyTo = process.env.BLUECHIP_NOTIFY_EMAIL || process.env.BLUECHIP_FROM_EMAIL;
  const where = { attribution:sanitizeAttribution(body.attribution) || undefined, heardAbout:sanitizeHeardAbout(body.heard_about) || undefined };
  const spamTrap = isHoneypot(body);
  let emailSent = false;
  if (!spamTrap) {
    const html = buildPulseStartingPointsEmail(snapshot, answers, body.includeAnswers === true);
    emailSent = await sendEmail({to:email,subject:'Your AI starting points',html,replyTo:notifyTo});
  }
  const note = buildLeadNotificationEmail({ name:'',email,diagnosticId:'ai-opportunity-check',bandLabel:'',total:null,resultLabel,emailSent,nudgeScheduled:false,spamTrap,submittedAt:new Date().toISOString(),checkSnapshot,...where });
  const leadNotificationSent = await sendEmail({to:notifyTo,subject:spamTrap ? `[Check: spam trap] ${note.subject}` : note.subject,html:note.html,replyTo:email});
  return res.status(leadNotificationSent ? 200 : 502).json({ok:leadNotificationSent,emailSent,leadNotificationSent,nudgeScheduled:false});
}
