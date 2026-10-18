import { PULSE_IDEA_VISUALS } from '../../src/data/pulseIdeaVisuals.js';
import { pulseStartingPoints } from '../../src/lib/pulseStartingPoints.js';
import { pulseAnswerLabel } from '../../src/data/pulseAnswerCopy.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function buildPulseStartingPointsEmail(snapshot, answers, includeAnswers) {
  const items = pulseStartingPoints(snapshot);
  const cards = items.map(item => {
    const [title, steps] = PULSE_IDEA_VISUALS[item.id];
    const cells = steps.map((step, i) => `<td width="33%" valign="top" style="padding:10px 7px;border-top:2px solid #c9a24b;background:#f5efe6;font-size:13px;line-height:1.5"><span style="font-size:11px">${['INPUT','POSSIBLE HELP','PEOPLE CHECK'][i]}</span><br><strong>${esc(step)}</strong></td>`).join('');
    return `<h2 style="font-size:22px;line-height:1.3;margin-top:28px">${esc(title)}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="table-layout:fixed"><tr>${cells}</tr></table><p><strong>One step to try:</strong> ${esc(item.first)}</p>${snapshot.startingPoint?.id === item.id ? '<p style="font-size:13px">Your chosen starting point.</p>' : ''}`;
  }).join('');
  return `<!doctype html><html lang="en"><body style="font-family:Arial,sans-serif;line-height:1.6;color:#0b1a33;padding:24px"><main style="max-width:640px;margin:auto"><h1>Your AI starting points</h1><p>Practical ideas from the areas you chose, with one first step to try. This is not a personalized time-savings estimate.</p>${cards || '<p>No gap has been assumed. Ask your team what they keep searching for, rewriting or explaining.</p>'}${snapshot.covered.length ? `<p><strong>Keep what works:</strong> ${snapshot.covered.map(o=>esc(pulseAnswerLabel(o,'works'))).join('; ')}.</p>` : ''}${snapshot.uncertain.length ? `<p><strong>A useful question for your team:</strong> ${snapshot.uncertain.map(o=>esc(o.prompt)).join('; ')}. These were marked unsure, not counted as needs.</p>` : ''}<p>Use non-sensitive examples in tools your organization approves. People check the facts and make the decisions.</p><p><a href="https://check.bluechip-people-strategies.com/ai-handoff-plan">Explore the AI Handoff Plan</a> for a deeper review, tool choices, current pricing and guarantee details. Your fee is confirmed before booking.</p>${includeAnswers ? `<h2>Your answers</h2><pre style="white-space:pre-wrap;font:inherit">${esc(answers)}</pre>` : ''}<p style="font-size:13px">You requested this one free ideas email. Newsletter signup is a separate choice.</p></main></body></html>`;
}
