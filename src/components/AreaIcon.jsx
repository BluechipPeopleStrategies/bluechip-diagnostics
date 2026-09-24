// One small line icon per Q2 area (design feedback 2026-09-24: the generic "≡" glyph didn't
// distinguish the eleven tiles). Plain inline SVG, no icon library, 20x20, stroke on
// currentColor so it inherits .ai-tile-icon's soft/gold coloring by hover and selected state.
const STROKE = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' };

const PATHS = {
  // Emails and correspondence: envelope
  correspondence: (
    <>
      <rect x="2.5" y="4.5" width="15" height="11" rx="1.2" {...STROKE} />
      <path d="M3 5.5l7 5.5 7-5.5" {...STROKE} />
    </>
  ),
  // Recurring reports: bar chart
  reports: (
    <>
      <path d="M3 17V3" {...STROKE} />
      <path d="M3 17h14" {...STROKE} />
      <rect x="5.5" y="10" width="2.6" height="7" {...STROKE} />
      <rect x="10" y="6.5" width="2.6" height="10.5" {...STROKE} />
      <rect x="14.5" y="12.5" width="2.6" height="4.5" {...STROKE} />
    </>
  ),
  // Meeting notes and follow-up: speech bubble
  meetingNotes: (
    <>
      <path d="M2.5 4.5h15v9h-9.5l-3.2 3v-3H2.5z" {...STROKE} />
      <path d="M6 8h8M6 10.8h5" {...STROKE} />
    </>
  ),
  // Finding information: magnifier
  findingInfo: (
    <>
      <circle cx="8.3" cy="8.3" r="5.3" {...STROKE} />
      <path d="M12.3 12.3l4.7 4.7" {...STROKE} />
    </>
  ),
  // Scheduling and bookings: calendar
  scheduling: (
    <>
      <rect x="2.5" y="4" width="15" height="13" rx="1.2" {...STROKE} />
      <path d="M2.5 8h15" {...STROKE} />
      <path d="M6.3 2.3v3.2M13.7 2.3v3.2" {...STROKE} />
    </>
  ),
  // Invoices, receipts and data entry: receipt
  invoicing: (
    <>
      <path d="M4.5 2.5h11v15l-2-1.3-1.8 1.3-1.7-1.3-1.8 1.3-1.7-1.3-2 1.3z" {...STROKE} />
      <path d="M7 6.3h6M7 9.3h6M7 12.3h3.6" {...STROKE} />
    </>
  ),
  // Hiring and onboarding: person-plus
  hiring: (
    <>
      <circle cx="7.6" cy="6.6" r="3" {...STROKE} />
      <path d="M2.2 17c.6-3.6 3-5.4 5.4-5.4s4.8 1.8 5.4 5.4" {...STROKE} />
      <path d="M15.5 6.5v5.4M12.8 9.2h5.4" {...STROKE} />
    </>
  ),
  // Customer or public enquiries: chat with a question mark
  enquiries: (
    <>
      <path d="M2.5 4.5h15v9h-9.5l-3.2 3v-3H2.5z" {...STROKE} />
      <text x="10" y="12" fontSize="8" textAnchor="middle" fill="currentColor" stroke="none" fontFamily="Inter, sans-serif">?</text>
    </>
  ),
  // Client or case notes: clipboard
  caseNotes: (
    <>
      <rect x="4" y="3.3" width="12" height="14.2" rx="1.2" {...STROKE} />
      <rect x="7.3" y="2" width="5.4" height="2.6" rx="0.7" {...STROKE} />
      <path d="M6.6 9h6.8M6.6 11.8h6.8M6.6 14.6h4.4" {...STROKE} />
    </>
  ),
  // Proposals, quotes and grant applications: document with a pen
  proposals: (
    <>
      <path d="M4.5 2.5h7l3.5 3.5V17.5h-10.5z" {...STROKE} />
      <path d="M11.5 2.5v3.5H15" {...STROKE} />
      <path d="M6.7 15.3l6.2-6.2 1.6 1.6-6.2 6.2H6.7z" {...STROKE} />
    </>
  ),
  // Writing and editing: pencil
  writingEditing: (
    <>
      <path d="M12.5 3.5l4 4-9 9-4.6 1 1-4.6z" {...STROKE} />
      <path d="M11 5l4 4" {...STROKE} />
    </>
  ),
  // Research and summarizing documents: document with a magnifier
  research: (
    <>
      <path d="M5 2.5h7l3 3v6.4h-10z" {...STROKE} />
      <path d="M11.5 2.5v3.5H15" {...STROKE} />
      <circle cx="8.2" cy="13" r="2.7" {...STROKE} />
      <path d="M10.2 15l2.1 2.1" {...STROKE} />
    </>
  ),
  // Spreadsheets and data cleanup: grid
  spreadsheets: (
    <>
      <rect x="2.5" y="3" width="15" height="14" rx="1.2" {...STROKE} />
      <path d="M2.5 8h15M2.5 12.5h15M7.5 3v14M12.8 3v14" {...STROKE} />
    </>
  ),
  // Social posts, newsletters and marketing copy: megaphone
  socialContent: (
    <>
      <path d="M2.5 8.5v3l3 .6v-4.2z" {...STROKE} />
      <path d="M5.5 7.5l9-3.8v12.6l-9-3.8z" {...STROKE} />
      <path d="M5.8 12.1l1 3.8" {...STROKE} />
      <path d="M14.5 7.2a3 3 0 010 5.6" {...STROKE} />
    </>
  ),
  // Training materials and how-to guides: graduation cap
  trainingMaterials: (
    <>
      <path d="M10 3l8 3.6-8 3.6-8-3.6z" {...STROKE} />
      <path d="M5.5 8.2v3.8c0 1.2 2 2.2 4.5 2.2s4.5-1 4.5-2.2V8.2" {...STROKE} />
      <path d="M18 6.6v4.4" {...STROKE} />
    </>
  ),
  // Policies, procedures and templates: document with a checklist
  policies: (
    <>
      <path d="M4.5 2.5h7l3.5 3.5V17.5h-10.5z" {...STROKE} />
      <path d="M11.5 2.5v3.5H15" {...STROKE} />
      <path d="M6.3 10.2l1.2 1.2 2.4-2.6" {...STROKE} />
      <path d="M6.3 14l1.2 1.2 2.4-2.6" {...STROKE} />
    </>
  ),
  // Other (type your own): typed lines with a cursor
  otherArea: (
    <>
      <path d="M3 6.5h13" {...STROKE} />
      <path d="M3 10.3h9" {...STROKE} />
      <path d="M3 14.1h6" {...STROKE} />
      <path d="M16.3 12v5" {...STROKE} strokeWidth={1.6} />
    </>
  ),
  // Not sure yet: dotted circle
  notSureArea: (
    <circle cx="10" cy="10" r="7" strokeDasharray="2.2 2.4" {...STROKE} />
  ),
};

export default function AreaIcon({ area, className = 'ai-tile-icon' }) {
  const content = PATHS[area];
  if (!content) return null;
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      {content}
    </svg>
  );
}

// A small check-in-a-circle, used as the bullet for each "look for" line in the result's
// "Where to look" cards. Same stroke style as the area icons, standalone since it isn't
// keyed by area value.
export function CheckCircleIcon({ className = 'ai-lookout-check' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" {...STROKE} />
      <path d="M6.7 10.2l2 2 4.3-4.6" {...STROKE} />
    </svg>
  );
}
