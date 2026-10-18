export const FAMILIES=[
  {
    "id": "knowledge",
    "title": "Find the right information",
    "cue": "Documents, latest versions and team knowledge",
    "mark": "01"
  },
  {
    "id": "voice",
    "title": "Say it, then shape it",
    "cue": "Dictation, meeting notes and next actions",
    "mark": "02"
  },
  {
    "id": "inbox",
    "title": "Keep email moving",
    "cue": "Replies, buried decisions and follow-ups",
    "mark": "03"
  },
  {
    "id": "documents",
    "title": "Get useful work onto the page",
    "cue": "Reports, research and spreadsheets",
    "mark": "04"
  },
  {
    "id": "social",
    "title": "Keep showing up",
    "cue": "Social posts, newsletters and useful content",
    "mark": "05"
  },
  {
    "id": "operations",
    "title": "Make everyday work flow",
    "cue": "Records, onboarding and repeat questions",
    "mark": "06"
  }
];
export const OPPORTUNITIES=[
  {
    "id": "findDocs",
    "family": "knowledge",
    "prompt": "Do people hunt through folders, chats or email to find a document?",
    "capability": "A searchable home for team knowledge",
    "explain": "Bring the useful sources together so people can find an answer and check where it came from. This is sometimes called a second brain.",
    "first": "Choose one recurring question. Put its approved source documents in one organized place and test whether someone else can find the answer."
  },
  {
    "id": "versions",
    "family": "knowledge",
    "prompt": "Does anyone ask, “Is this the latest version?”",
    "capability": "One current source, with version history",
    "explain": "Clear ownership and version history can prevent repeated checking and rework. An AI search tool is only useful when the underlying sources are reliable.",
    "first": "Pick one frequently used document. Give it an owner, a single approved home and a clear review date."
  },
  {
    "id": "teamAnswers",
    "family": "knowledge",
    "prompt": "Do the same staff questions interrupt the same person?",
    "capability": "Findable answers with named sources",
    "explain": "A small, maintained knowledge base can help people answer routine questions themselves. Sensitive or judgment-heavy questions still go to the right person.",
    "first": "Collect five recurring questions and the approved answers. Check that staff can access the sources they are allowed to see."
  },
  {
    "id": "dictation",
    "family": "voice",
    "prompt": "Do you type messages that would be easier to say out loud?",
    "capability": "Voice-to-text, then a checked draft",
    "explain": "Speak the first draft, then check names, numbers and meaning. Dictation can fit inside the writing workflow you already have.",
    "first": "Try dictating one non-sensitive message in an approved tool, then compare the full time including corrections."
  },
  {
    "id": "meetingCapture",
    "family": "voice",
    "prompt": "Do meeting notes or action lists take too long to write?",
    "capability": "A first draft of notes and next actions",
    "explain": "Approved note assistance can organize what was discussed so a person can check the record. Recording permission and information handling come first.",
    "first": "Start with non-sensitive notes you already have permission to use. Test the action list against the original record."
  },
  {
    "id": "emailDrafts",
    "family": "inbox",
    "prompt": "Do routine replies keep getting written from scratch?",
    "capability": "Draft replies from approved information",
    "explain": "Use a reusable starting point for routine replies. A person checks the recipient, facts, tone and attachments before anything goes out.",
    "first": "Choose one common reply. Create an approved starting template and test drafting from it with non-sensitive information."
  },
  {
    "id": "emailFollowup",
    "family": "inbox",
    "prompt": "Do follow-ups or decisions disappear inside long email threads?",
    "capability": "A clear next-action list",
    "explain": "Summaries and reminders can make a thread easier to act on. They should point back to the message so nothing important gets lost.",
    "first": "Take one non-sensitive thread and compare a proposed next-action list with the actual messages."
  },
  {
    "id": "emailSearch",
    "family": "inbox",
    "prompt": "Do you search old messages to find a file, answer or decision?",
    "capability": "Search across the sources you are allowed to use",
    "explain": "Connect the question to its source, with the right access permissions. Email search and document search may be the same pool of work.",
    "first": "Write three questions you repeatedly search email to answer. Identify the authoritative source for each."
  },
  {
    "id": "reports",
    "family": "documents",
    "prompt": "Do reports or updates repeat the same structure each time?",
    "capability": "A reusable, source-based first draft",
    "explain": "Build from a consistent template and approved inputs. People still check the interpretation, figures and final wording.",
    "first": "Choose one recurring report. Separate its reusable structure from the facts that change each time."
  },
  {
    "id": "research",
    "family": "documents",
    "prompt": "Does reading and comparing documents leave too little time to decide?",
    "capability": "A source-linked summary and comparison",
    "explain": "A first-pass summary can bring key points together. Check quotations, omissions and competing views before relying on it.",
    "first": "Compare a short AI-assisted summary with two non-sensitive documents you already understand."
  },
  {
    "id": "data",
    "family": "documents",
    "prompt": "Do you keep cleaning the same spreadsheets or copying the same figures?",
    "capability": "Repeatable cleanup and checking steps",
    "explain": "A clear rule or small automation may help before AI is needed. Keep a source copy and check the output.",
    "first": "Write down one repeated cleanup rule and test it on a copy of a small, non-sensitive sheet."
  },
  {
    "id": "socialDrafts",
    "family": "social",
    "prompt": "Does creating useful social content keep slipping down the list?",
    "capability": "Turn your expertise into a checked draft",
    "explain": "Start with something useful you can actually teach or show. AI can help shape a draft while you retain the point of view and check the claims.",
    "first": "Take one real question a customer asks. Draft a useful answer and check it before considering a post."
  },
  {
    "id": "repurpose",
    "family": "social",
    "prompt": "Do good ideas get used once, then disappear?",
    "capability": "Give approved material another useful format",
    "explain": "A talk, guide or article can supply several distinct pieces. Each should do a useful job instead of repeating the same generic post.",
    "first": "Choose one approved piece and identify a different audience question it could help answer."
  },
  {
    "id": "records",
    "family": "operations",
    "prompt": "Do people move the same details between forms, records or invoices?",
    "capability": "Capture once, then reuse with checks",
    "explain": "A clearer form or existing automation may remove repeat typing. Keep an approval step for consequential changes.",
    "first": "Map one repeated transfer of information. Note the source, destination and person who checks it."
  },
  {
    "id": "onboarding",
    "family": "operations",
    "prompt": "Do you explain the same process each time someone starts or takes over?",
    "capability": "A maintained how-to guide",
    "explain": "Turn a real walkthrough into a usable starting guide, with an owner who keeps it current. Avoid putting private employee information into a general tool.",
    "first": "Record the steps of one routine process in an approved way, then ask a colleague to follow the draft guide."
  },
  {
    "id": "enquiries",
    "family": "operations",
    "prompt": "Do customers ask the same questions over and over?",
    "capability": "Consistent answers from approved sources",
    "explain": "A useful answer library can support staff and, where appropriate, a reviewed self-service option. Exceptions still need a person.",
    "first": "Collect five recurring questions. Check the correct answers and decide which should always come to a person."
  }
];
export const STATUSES=[
  [
    "friction",
    "We do this, but it takes too much effort"
  ],
  [
    "works",
    "This already works well"
  ],
  [
    "aspire",
    "We skip it, or would like to do more"
  ],
  [
    "na",
    "This does not apply"
  ],
  [
    "unknown",
    "Not sure yet"
  ]
];