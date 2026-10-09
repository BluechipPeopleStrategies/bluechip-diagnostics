// What a quiz result email may say. /api/submit takes the band and detail text from the browser,
// so the visitor email is built only from these known labels; anything else is dropped (2026-10-09
// bug check, item 6). tests/submit-security.test.js checks this list against the question banks in
// src/data, so a renamed band or dimension fails a test instead of silently emptying an email.
export const DIAGNOSTIC_RESULTS = {
  'org-pulse': {
    bands: ['Pressure building', 'Mixed signal', 'Healthy'],
    details: ['Organizational Clarity', 'Accountability', 'Talent Health', 'Decision Quality', 'Pressure & Pace'],
  },
  'dqi': {
    bands: ['Decision drag', 'Mixed signal', 'Calibrated'],
    details: ['Speed', 'Information', 'Calibration', 'Review'],
  },
  'governance-eval-readiness': {
    bands: ['Exposure showing', 'Goodwill dependent', 'Defensible'],
    details: ['Process & Structure', 'Evidence & Inputs', 'Candor & Independence', 'Feedback & Follow-through', 'Role Clarity & Expectations'],
  },
  'supervisor-blind-spot': {
    bands: ['fire-fighter', 'coach', 'friend', 'operator', 'visionary', 'enforcer', 'diplomat', 'builder'],
    details: ['The Fire Fighter', 'The Coach', 'The Friend', 'The Operator', 'The Visionary', 'The Enforcer', 'The Diplomat', 'The Builder'],
  },
  'workplace-read': {
    bands: ['quiet-erosion', 'pressure-cooker', 'politics-in-play', 'drift', 'healthy-tension'],
    details: ['Quiet Erosion', 'Pressure Cooker', 'Politicking', 'Drift', 'Healthy Tension'],
  },
};

export function isKnownDiagnostic(id) {
  return typeof id === 'string' && Object.prototype.hasOwnProperty.call(DIAGNOSTIC_RESULTS, id);
}

export function knownOrEmpty(diagnosticId, kind, value) {
  if (!isKnownDiagnostic(diagnosticId) || typeof value !== 'string') return '';
  return DIAGNOSTIC_RESULTS[diagnosticId][kind].includes(value) ? value : '';
}
