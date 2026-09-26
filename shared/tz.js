// Dependency-free IANA timezone helpers, used by both the client (session display) and the
// api/lunch-register.js serverless function (the .ics attachment). No date library is added
// (project convention: no new npm packages) -- this uses only the built-in Intl API, which
// already carries the tzdata needed to get DST transitions right.

// Converts a "wall clock" date/time as it would read on a clock in `timeZone` into the
// correct absolute UTC Date. E.g. zonedTimeToUtc('2026-10-14T12:00:00', 'America/Edmonton')
// returns the Date for 2026-10-14T18:00:00Z (Edmonton is UTC-6 in October, MDT).
export function zonedTimeToUtc(localDateTimeStr, timeZone) {
  const guess = new Date(`${localDateTimeStr}Z`);
  const offsetMs = tzOffsetMs(guess, timeZone);
  return new Date(guess.getTime() - offsetMs);
}

// How far `timeZone` is ahead of UTC at the instant `date`, in milliseconds.
function tzOffsetMs(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  const asIfUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) === 24 ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return asIfUtc - date.getTime();
}

// Formats an absolute Date in `timeZone` using Intl, returning the parts object rather than a
// locale string, so callers can lay the pieces out themselves (the sketch's date tile needs the
// month/day/weekday as separate strings).
export function formatInTimeZone(date, timeZone, options) {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone, ...options });
  return dtf.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
}
