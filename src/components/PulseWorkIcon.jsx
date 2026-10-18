// Concrete work symbols, decorative alongside the visible task labels.
const paths = {
  knowledge: <><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v4"/><path d="M3 7h15l-2 13H3z"/><circle cx="17" cy="16" r="4"/><path d="m20 19 2 3"/></>,
  voice: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/></>,
  inbox: <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7M3 18l6-5M21 18l-6-5"/></>,
  documents: <><path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8M8 19h5"/></>,
  social: <><path d="m3 9 15-5v16L3 15zM7 16l1 5h4l-1-4M21 8v8"/></>,
  operations: <><rect x="4" y="4" width="16" height="18" rx="2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m7 11 1 1 2-2M13 11h4m-10 6 1 1 2-2M13 17h4"/></>,
  industry: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 11h4v5H7zM14 11h3M14 15h3M7 19h10"/></>,
  priorities: <><path d="M8 5h13M8 12h10M8 19h7M3 3v5M2 4l1-1 1 1M2 11c0-2 4-2 4 0 0 1-4 3-4 4h4M2 18h3l-2 2h2v2H2"/></>,
  accountability: <><circle cx="7" cy="6" r="3"/><path d="M2 18v-3a5 5 0 0 1 10 0v3M16 6h6M16 10h6m-7 7 2 2 5-6"/></>,
  people: <><circle cx="9" cy="6" r="3"/><path d="M2 21v-4a7 7 0 0 1 10-6M15 11h7v11h-9V13l2-2zM16 15h3M16 18h3"/></>,
};
export default function PulseWorkIcon({ family, size = 36 }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[family]}</svg>;
}
