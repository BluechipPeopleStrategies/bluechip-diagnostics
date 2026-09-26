// Minimal RFC5545 .ics builder. No calendar library is added (project convention: no new npm
// packages) -- a single VEVENT with one 15-minute VALARM is a small, well-specified format.

function pad(n) {
  return String(n).padStart(2, '0');
}

// YYYYMMDDTHHMMSSZ, the "form 2" UTC date-time RFC5545 requires when there is no VTIMEZONE block.
function toIcsUtc(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

// Escapes TEXT-type values per RFC5545 3.3.11 (backslash, semicolon, comma, newline).
function escapeText(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Folds a content line at 75 octets, as RFC5545 3.1 requires (continuation lines start with a
// single space). Splitting on code units is fine here: every field we emit is escaped ASCII.
function foldLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 0) {
    parts.push(' ' + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return parts.join('\r\n');
}

/**
 * Builds a one-event .ics calendar file.
 * @param {object} opts
 * @param {string} opts.uid - stable unique id for the event (e.g. registration id + @domain).
 * @param {Date} opts.start - absolute UTC instant the session starts.
 * @param {number} opts.durationMinutes - session length in minutes.
 * @param {string} opts.title - SUMMARY.
 * @param {string} opts.description - DESCRIPTION (plain text; newlines are escaped for us).
 * @param {string} opts.url - the join link (also used as LOCATION, since it's a virtual session).
 * @param {number} [opts.alarmMinutesBefore] - VALARM lead time. Defaults to 15.
 * @param {Date} [opts.dtstamp] - DTSTAMP; defaults to now. Pass a fixed Date in tests.
 * @returns {string} CRLF-terminated .ics file content.
 */
export function buildIcs({
  uid,
  start,
  durationMinutes,
  title,
  description,
  url,
  alarmMinutesBefore = 15,
  dtstamp = new Date(),
}) {
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BlueChip People Strategies//Practical AI Lunch and Learn//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${toIcsUtc(dtstamp)}`,
    `DTSTART:${toIcsUtc(start)}`,
    `DTEND:${toIcsUtc(end)}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    `URL:${escapeText(url)}`,
    `LOCATION:${escapeText(url)}`,
    'BEGIN:VALARM',
    `TRIGGER:-PT${alarmMinutesBefore}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)} starts in ${alarmMinutesBefore} minutes`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
