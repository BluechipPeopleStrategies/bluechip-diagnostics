// Concrete work symbols, decorative alongside the visible task labels.
const paths = {
  knowledge: <><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v4"/><path d="M3 7h15l-2 13H3z"/><circle cx="17" cy="16" r="4"/><path d="m20 19 2 3"/></>,
  voice: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/></>,
  inbox: <><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m3 6 9 7 9-7M3 18l6-5M21 18l-6-5"/></>,
  documents: <><path d="M5 2h9l5 5v15H5zM14 2v6h5M8 12h8M8 16h8M8 19h5"/></>,
  social: <><path d="m3 9 15-5v16L3 15zM7 16l1 5h4l-1-4M21 8v8"/></>,
  operations: <><rect x="4" y="4" width="16" height="18" rx="2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m7 11 1 1 2-2M13 11h4m-10 6 1 1 2-2M13 17h4"/></>,
  industry: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h10M7 11h4v5H7zM14 11h3M14 15h3M7 19h10"/></>,
};
export default function PulseWorkIcon({ family }) {
  return <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[family]}</svg>;
}
