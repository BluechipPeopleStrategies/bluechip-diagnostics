// The same question-specific labels are used in the check and shared results.
// These describe the existing five statuses; they do not estimate hours saved.
const COPY = {
  findDocs: [
    ['Finding documents slows us down', 'We spend more time searching than we would like.'],
    ['People find the right document easily', 'Our current way of finding information works well.'],
    ['We want to build a shared place to look', 'Useful team information is not yet easy to find.'],
  ],
  versions: [
    ['Checking versions causes extra work', 'People spend time confirming which copy to use.'],
    ['People know which version to use', 'Our current version control works well.'],
    ['We want to set up clearer version control', 'We would like one agreed home for current documents.'],
  ],
  teamAnswers: [
    ['We spend too long answering the same questions', 'Repeating routine answers takes effort we would like to reduce.'],
    ['Staff can get reliable answers easily', 'The way we answer routine questions works well.'],
    ['We want to build a useful answer library', 'We have not yet made these answers easy to reuse.'],
  ],
  dictation: [
    ['Getting ideas into writing takes too long', 'Creating the first draft takes more effort than we would like.'],
    ['Our way of drafting works well', 'People can get their ideas onto the page comfortably.'],
    ['We want to capture ideas we currently lose', 'Some useful ideas never become a draft.'],
  ],
  meetingCapture: [
    ['Writing up meetings takes too much effort', 'Notes and next steps need more work than we would like.'],
    ['Our notes and next steps work well', 'People can rely on the record and action list.'],
    ['We want to capture more useful meeting notes', 'Some meetings do not yet leave a usable record.'],
  ],
  emailDrafts: [
    ['We spend too long writing routine replies', 'Similar messages take effort to write again.'],
    ['Our reply process works well', 'We are happy with the time and checking involved.'],
    ['We want to answer messages we put off', 'Some useful replies do not get written yet.'],
  ],
  emailFollowup: [
    ['Chasing email follow-ups takes too much effort', 'Keeping track needs more checking than we would like.'],
    ['Our follow-ups stay on track', 'Our current reminders and next steps work well.'],
    ['We want to start tracking more follow-ups', 'Some threads do not yet have a clear next step.'],
  ],
  emailSearch: [
    ['Searching old emails slows us down', 'Finding a past detail takes more time than we would like.'],
    ['People can find past emails easily', 'Our current search and filing work well.'],
    ['We want to make old email knowledge usable', 'Useful past information is not yet easy to reuse.'],
  ],
  reports: [
    ['Assembling reports takes too much effort', 'Gathering facts and writing updates take time we would like to reduce.'],
    ['Report preparation runs smoothly', 'Our current reports are manageable to produce and check.'],
    ['We want to produce reports we currently skip', 'Useful updates do not yet get made.'],
  ],
  research: [
    ['Comparing information takes too much effort', 'Pulling the important points together slows us down.'],
    ['We can compare information well', 'Our current research and checking process works well.'],
    ['We want to compare more before deciding', 'Some useful research is not yet getting done.'],
  ],
  data: [
    ['Updating spreadsheets takes too much effort', 'Repeat entry, cleanup or checking slows us down.'],
    ['Spreadsheet updates run smoothly', 'Our current process is manageable and reliable.'],
    ['We want to maintain sheets we currently skip', 'Some useful tracking does not yet get updated.'],
  ],
  socialDrafts: [
    ['Creating updates takes too much effort', 'Drafting useful posts takes more work than we would like.'],
    ['Our content process works well', 'We can create and check the updates we need.'],
    ['We want to publish useful content more often', 'Some updates we would like to share never get made.'],
  ],
  repurpose: [
    ['Adapting content takes too much effort', 'Turning a good idea into another format slows us down.'],
    ['We reuse good content effectively', 'Our current way of adapting material works well.'],
    ['We want to start reusing more good ideas', 'Useful material is not yet reaching other formats.'],
  ],
  records: [
    ['Moving details between records takes too long', 'Repeat entry or checking creates extra work.'],
    ['Our records move through smoothly', 'Our current process is manageable and reliable.'],
    ['We want to connect records we do not use together', 'Some useful information is not yet being carried through.'],
  ],
  onboarding: [
    ['Explaining the same process takes too much effort', 'Repeated walkthroughs need time we would like to reduce.'],
    ['New people can learn the process easily', 'Our existing guidance and support work well.'],
    ['We want to create guides we do not have yet', 'Some routine processes have no reusable explanation.'],
  ],
  enquiries: [
    ['Repeating customer answers takes too much effort', 'Routine questions need time we would like to reduce.'],
    ['Customers get clear answers efficiently', 'Our current answers and exception handling work well.'],
    ['We want to cover questions we do not answer well yet', 'Useful customer guidance still needs creating.'],
  ],
  industryBrief: [
    ['Keeping up takes too much searching', 'Finding the updates that matter takes effort we would like to reduce.'],
    ['We get the updates we need', 'Our current sources and routine work well.'],
    ['We want to follow news we currently miss', 'Useful industry or competitor updates are not yet part of our routine.'],
  ],
  weeklyPriorities: [
    ['Sorting and rechecking priorities slows us down', 'Deciding what comes first takes more effort than we would like.'],
    ['People know what to work on first', 'Our current way of agreeing priorities works well.'],
    ['We want to start clearer priority planning', 'We do not yet make enough room for a shared weekly plan.'],
  ],
  actionOwnership: [
    ['Tracking commitments needs too much chasing', 'Confirming owners, dates or progress takes effort we would like to reduce.'],
    ['People know their actions and deadlines', 'Our current follow-through works well.'],
    ['We want to start a clearer action list', 'Some commitments do not yet have a shared owner and follow-up date.'],
  ],
  hrStartingPoints: [
    ['Routine onboarding and staff answers take too much effort', 'We repeat work that we would like to make easier.'],
    ['Staff get clear, consistent guidance', 'Our current onboarding and routine answers work well.'],
    ['We want to build more onboarding and staff support', 'Useful checklists or answers still need creating.'],
  ],
};
const IDS = ['friction', 'works', 'aspire'];
export function pulseAnswerChoices(item) {
  const copy = COPY[item.id];
  if (!copy) throw new Error(`Missing Pulse answer copy: ${item.id}`);
  return [
    ...copy.map(([label, hint], i) => ({ value: IDS[i], label, hint })),
    { value: 'na', label: 'This is not part of our work', hint: 'Leave this area out of our starting points.' },
    { value: 'unknown', label: 'I would need to ask the team', hint: 'Keep this as a useful question, not an assumed problem.' },
  ];
}
export function pulseAnswerLabel(item, value) {
  return pulseAnswerChoices(item).find(choice => choice.value === value)?.label || 'Not explored';
}
