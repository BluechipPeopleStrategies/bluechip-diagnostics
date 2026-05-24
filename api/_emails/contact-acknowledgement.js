import { layout } from './_shared.js';

export function buildContactAcknowledgementEmail({ name }) {
  return {
    subject: 'Intake Received – BlueChip People Strategies',
    html: layout(`
      <p>Thank you for submitting your inquiry to BlueChip People Strategies.</p>
      <p>This message confirms receipt of your intake information. Please note that submission of an intake form does not create a client relationship, and no advice, opinion, or recommendation has been provided at this stage.</p>
      <p>Any discussion prior to a formal engagement is preliminary in nature and should not be relied upon for decision-making, action, or inaction. Professional services are only provided once a written agreement is in place and, where applicable, payment has been received.</p>
      <p>We will review your intake and follow up regarding next steps, scope, availability, and applicable terms.</p>
      <p>If you have time-sensitive or urgent matters, please indicate this in your reply.</p>
      <p>Kind regards,<br/>BlueChip People Strategies</p>
    `),
  };
}
