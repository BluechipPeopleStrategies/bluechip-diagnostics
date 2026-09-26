// Single source of truth for the exact consent checkbox wording, so the confirmation-email
// "consent proof" copy (api/_lib/lunch-email.js) can never drift from what the registrant
// actually saw on screen (src/pages/Lunch/LunchRegister.jsx).
export const NEXT_SESSION_CONSENT_LABEL = 'Email me when the next session is scheduled. Unsubscribe any time.';
