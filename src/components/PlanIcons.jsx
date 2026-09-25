// Hand-drawn line icons for the plan page (2026-09-25). Each one names what its step or node
// actually is, so it reads without its colour: a conversation, a scan across the work, a route
// through a workflow, a written document, a call. No robots, brains or circuit boards.
// Decorative next to their visible text labels, so aria-hidden.

function Icon({ children, className = '' }) {
  return (
    <svg className={`plan-icon ${className}`} viewBox="0 0 24 24" width="24" height="24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// Discovery: two people in conversation.
export function DiscoveryIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 6.5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H8l-3 2.5v-2.6a2 2 0 0 1-1.5-1.9z" />
      <path d="M17 8.5h1.5a2 2 0 0 1 2 2v4a2 2 0 0 1-1.5 1.9v2.6l-3-2.5h-4a2 2 0 0 1-2-2v-.5" />
    </Icon>
  );
}

// Opportunity scan: a magnifier moving across a grid of tasks.
export function ScanIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="3.5" width="5" height="5" rx="1" />
      <rect x="3" y="11" width="5" height="5" rx="1" />
      <rect x="10.5" y="3.5" width="5" height="5" rx="1" />
      <circle cx="15.5" cy="15" r="3.6" />
      <path d="m18.2 17.7 2.8 2.8" />
    </Icon>
  );
}

// Workflow walkthrough: a route with stops, the path the work takes.
export function RouteIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="5.5" r="2" />
      <circle cx="19" cy="18.5" r="2" />
      <path d="M7 5.5h7.5a3 3 0 0 1 0 6h-5a3 3 0 0 0 0 6H17" />
    </Icon>
  );
}

// Written plan: a document with a ranked list and a check.
export function PlanDocIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 2.8h8.5L19 7.3V20a1.2 1.2 0 0 1-1.2 1.2H6A1.2 1.2 0 0 1 4.8 20V4A1.2 1.2 0 0 1 6 2.8z" />
      <path d="M14.2 2.8v4.7H19" />
      <path d="M8 11.5h7M8 14.8h7" />
      <path d="m8 18 1.2 1.2L11.6 17" />
    </Icon>
  );
}

// Findings call: a phone handset.
export function CallIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6.6 3.5h2.7l1.4 4-2 1.4a11 11 0 0 0 6.4 6.4l1.4-2 4 1.4v2.7a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />
    </Icon>
  );
}

// Free check: a short checklist.
export function ChecklistIcon(props) {
  return (
    <Icon {...props}>
      <path d="m4 6.5 1.5 1.5L8.5 5M4 12.5 5.5 14l3-3M4 18.5 5.5 20l3-3" />
      <path d="M11.5 6.5H20M11.5 12.5H20M11.5 18.5H17" />
    </Icon>
  );
}

// Optional help: two hands on one task, shown as a plus joined to a person.
export function HelpIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="7.5" r="3" />
      <path d="M3.5 20v-1.5A5 5 0 0 1 8.5 13.5h1" />
      <path d="M17 12v8M13 16h8" />
    </Icon>
  );
}

// Outcome markers for the guarantee diagram: a tick, and an arrow returning to its start.
export function TickIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.7 2.7L16.2 9.5" />
    </Icon>
  );
}

export function ReturnIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 7 4.5 11.5 9 16" />
      <path d="M4.8 11.5H15a4.5 4.5 0 0 1 0 9h-2.5" />
    </Icon>
  );
}
