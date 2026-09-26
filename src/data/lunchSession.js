// Session config for /lunch and /lunch/live. One place to change per session -- see
// docs/2026-09-25-lunch-and-learn-registration-map.md ("What option A needs").
//
// EXAMPLE SESSION: Thomas has not set session 1's real date, YouTube/LinkedIn Live URLs yet.
// `isExample: true` drives the "Example date" badge on the page. Flip it to false (and fill in
// the real values below) once a session is actually scheduled.
export const SESSION = {
  isExample: true,
  seriesTitle: 'The Practical AI Lunch & Learn',
  title: 'Session 1: Routine email, handled',
  // Primary topic this session covers, matched against TOPICS ids below.
  topic: 'email',
  topicLabel: 'email',
  // Wall-clock local time, no offset -- resolved against `timeZone` via shared/tz.js so the
  // correct UTC instant is computed for both display and the .ics attachment regardless of
  // whether the date falls in MDT or MST.
  localStart: '2026-10-14T12:00:00',
  timeZone: 'America/Edmonton',
  durationMinutes: 45,
  registrationOpen: true,
  // Set these when the stream is ready. /lunch/live shows "the stream link appears here" until
  // youtubeUrl is set.
  youtubeUrl: '',
  linkedinUrl: '',
  host: { name: 'Thomas Slifka', org: 'BlueChip People Strategies, Edmonton', initials: 'TS' },
  topics: [
    {
      id: 'email',
      label: 'Email and replies',
      icon: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
      ideas: [
        'Faster replies to the same client questions',
        'A first draft I only have to check',
        'Keeping my tone consistent',
      ],
      fit: "You'll watch a week of routine replies drafted in your voice, checked, and ready to send.",
    },
    {
      id: 'reports',
      label: 'Reports from notes',
      icon: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6M9 7h3"/>',
      ideas: [
        'Turning rough notes into a clean report',
        'Monthly reports without the lost morning',
        'A template my team can reuse',
      ],
    },
    {
      id: 'minutes',
      label: 'Meeting minutes',
      icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
      ideas: [
        'Minutes the same day as the meeting',
        'Action items nobody forgets',
        'Board-ready minutes from a recording',
      ],
    },
    {
      id: 'staff',
      label: 'Answering staff questions',
      icon: '<path d="M4 5h16v10H9l-5 4z"/><path d="M9 9h6"/>',
      ideas: [
        'Fewer repeat policy questions',
        'A handbook staff can ask',
        'Knowing when a person should answer',
      ],
    },
    {
      id: 'intake',
      label: 'Scheduling and intake',
      icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
      ideas: [
        'Less back-and-forth booking',
        'Intake forms that fill themselves in',
        'A cleaner handoff to my team',
      ],
    },
    {
      id: 'privacy',
      label: 'Keeping private info safe',
      icon: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
      ideas: [
        'What never goes into ChatGPT',
        'A simple AI policy for my team',
        'Which tools are safe for client data',
      ],
      fit: 'The boundaries block covers this directly: what never goes into a consumer AI tool, and what to use instead.',
    },
    {
      id: 'other',
      label: 'Something else',
      icon: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M8 12h8"/>',
      ideas: [
        'The one task that eats my Mondays',
        'Where to start with AI at all',
        'Getting my team to actually use it',
      ],
    },
  ],
  agenda: [
    {
      topic: 'all',
      clock: '0:00',
      icon: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V12M16 12V8.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-5-2.7L4 15a1.6 1.6 0 0 1 2.6-1.8L7 14"/>',
      title: 'Welcome',
      sub: "Who it's for, and the one link you'll hear",
    },
    {
      topic: 'email',
      clock: '0:03',
      icon: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
      title: 'Live demo one',
      sub: 'A week of routine replies drafted in your voice, checked, ready to send',
    },
    {
      topic: 'email',
      clock: '0:18',
      icon: '<path d="M4 6h16M7 12h10M10 18h4"/>',
      title: 'Live demo two',
      sub: 'Sorting an inbox so the urgent ones surface first',
    },
    {
      topic: 'privacy',
      clock: '0:33',
      icon: '<path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="M12 8v5M12 16v.5"/>',
      title: "Where AI isn't safe",
      sub: 'Privacy, accuracy, and where a person has to check',
    },
    {
      topic: 'qa',
      clock: '0:38',
      icon: '<path d="M4 5h16v10H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',
      title: 'Your questions',
      sub: 'Seeded with what people ask for when they sign up',
    },
  ],
  flow: {
    caption: 'Demo one at a glance',
    subcaption: "What you'll watch at 0:03, start to finish",
    note: 'Made-up inbox. The minutes are an example from the demo, not a promise.',
    nodes: [
      {
        icon: '<path d="M3 6h18v12H3z"/><path d="m3 7 9 6 9-6"/>',
        title: 'A routine email arrives',
        sub: '"Can we move Thursday\'s walkthrough?"',
      },
      {
        ai: true,
        icon: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
        title: 'AI drafts the reply',
        sub: 'In your voice, from your past replies',
      },
      {
        icon: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
        title: 'You check it',
        sub: 'A person reads every draft',
      },
      {
        icon: '<path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="m10 13 5-5"/>',
        title: 'Sent',
        sub: 'About a minute instead of ten',
      },
    ],
  },
  promises: [
    {
      icon: '<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7.5 14h9"/>',
      text: 'Every demo uses made-up data',
    },
    { icon: '<circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/>', text: 'No pitch during teaching time' },
    {
      icon: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="m10 9 5 3-5 3z"/>',
      text: 'Replay sent if you miss it',
    },
  ],
};

// Comfort-level scale (step 2). Icons: brain/help, lightning, calendar-grid, connection, arrows.
export const LEVELS = [
  {
    n: 1,
    name: "What's AI, exactly?",
    eg: "I've heard the word. I haven't knowingly used it.",
    reply: "You're who this is built for. Every demo starts from zero, and nothing assumes you've used a tool before.",
    icon: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5V14M12 17v.3"/>',
  },
  {
    n: 2,
    name: "I've tried it",
    eg: "I've asked ChatGPT or Copilot a question or two.",
    reply: "Good starting point. You'll see how to go from asking it questions to handing it real, recurring work.",
    icon: '<path d="M5 3l6 16 2.3-6.7L20 10z"/>',
  },
  {
    n: 3,
    name: 'I use it most weeks',
    eg: 'Drafting emails, summarizing documents, cleaning up writing.',
    reply: "You'll pick up the steps that make it reliable: checking its work, reusing prompts, and knowing where it shouldn't go.",
    icon: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M12 14h2M16 14h1"/>',
  },
  {
    n: 4,
    name: "It's part of how we work",
    eg: 'Saved prompts, custom GPTs or Copilot, and my team uses it too.',
    reply: 'The boundaries block and the Q&A are the parts built for you. Bring the edge cases your team runs into.',
    icon: '<circle cx="8" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3 19c.6-3 2.7-4.5 5-4.5s4.4 1.5 5 4.5M13.5 18.5c.4-2.2 1.7-3.4 3.2-3.4 1.6 0 2.9 1.2 3.3 3.4"/>',
  },
  {
    n: 5,
    name: 'I build with it',
    eg: 'I run my own agents locally on open-source models, and I code with it every day.',
    reply: 'Welcome. Bring your hardest question to the Q&A, and help the room see what\'s possible.',
    icon: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  },
];

// Confirmation-screen "next step" block. The free AI Opportunity Check is deliberately NOT
// offered here -- Thomas's correction: session first, then the check (named at the session's
// close). See "Corrections from Thomas" in the registration map doc.
export const NEXT = {
  kicker: "Know someone who'd get value?",
  title: 'Bring a colleague',
  body: 'Same session, their own seat. Forward the link to anyone on your team who does the same recurring work.',
  cta: 'Copy the invite link',
  link: 'bluechip-people-strategies.com/lunch',
};
