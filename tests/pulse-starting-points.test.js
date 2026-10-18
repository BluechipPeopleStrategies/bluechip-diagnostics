import { it, expect } from 'vitest';
import { freshPulse, pulseSnapshot } from '../src/lib/pulseDiscovery.js';
import { pulseStartingPoints } from '../src/lib/pulseStartingPoints.js';
import { buildPulseStartingPointsEmail } from '../api/_emails/pulse-starting-points.js';

it('keeps a chosen fourth idea in both the three-card takeaway and the email', () => {
  const result = pulseSnapshot({...freshPulse(), answers:{findDocs:'friction',dictation:'friction',reports:'friction',weeklyPriorities:'aspire',hrStartingPoints:'unknown',industryBrief:'na'},priority:'weeklyPriorities'});
  const visible = pulseStartingPoints(result);
  expect(visible).toHaveLength(3);
  expect(visible[0].id).toBe('weeklyPriorities');
  expect(new Set(visible.map(item=>item.id)).size).toBe(3);
  expect(visible.some(item=>['hrStartingPoints','industryBrief'].includes(item.id))).toBe(false);
  const email = buildPulseStartingPointsEmail(result,'',false);
  expect(email).toContain('Make priorities easier to agree');
  expect(email).toContain('Your chosen starting point.');
  expect(email.match(/<table /g)).toHaveLength(3);
});
