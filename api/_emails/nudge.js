// The 24-hour "Following up on your ... result" nudge is retired (2026-10-09): the opt-in
// promises "No auto-sequence", and the Clarity Call it pointed at no longer exists. Nothing
// schedules it any more. These two exports remain only so a nudge already sitting in Resend's
// queue can still be found and cancelled (api/_lib/followups.js, api/cal-webhook.js).
export const DIAGNOSTIC_TITLES = {
  'org-pulse': 'Org Pulse',
  'dqi': 'DQI',
  'supervisor-blind-spot': 'Supervisor Blind Spot',
  'workplace-read': 'Workplace Read',
  'governance-eval-readiness': 'Governance Health Check',
};

// Matches every subject the retired nudge produced.
export const NUDGE_SUBJECT_RE = /^Following up on your .+ result$/;
