# Diagnostic Authoring Standards

The voice, structure, and quality rules that govern question content for all four BlueChip diagnostics. Update this doc as decisions evolve; treat it as the source of truth for future content edits.

## Voice

- **Direct. Anti-corporate. Concrete.** Match the BlueChip site voice (see `bluechip-website/_positioning.md`).
- **Names the failure mode before the fix.** Show the visitor what's broken before telling them what to do about it.
- **No HR jargon.** Cut every instance of: "holistic," "empower," "synergy," "people-first," "talent solutions," "unleash," "unlock potential," "journey," "passionate."
- **Concrete over abstract.** "Block 90 minutes" beats "make space for strategic work."
- **Second person, present tense, mostly.** "You decide fast" beats "Decision-makers tend to act quickly."

## Question rules

- **Each Likert question maps to exactly one dimension.** No question contributes to two dimensions. If a question genuinely belongs to two, the dimensions aren't distinct enough — fix the dimensions, not the question.
- **Reverse-scoring lives in JSON, never in question wording.** A question worded negatively (e.g., "We find out people are leaving when they resign, not before") gets `"reverseScored": true`. The engine inverts. Do NOT manually invert the answer values in the question text.
- **Multiple-choice options weight to exactly one archetype** (weight = 1). No half-credit splits across archetypes. If an option is "kind of both," it's not a good option — rewrite for crispness.
- **Likert options are standard 5-point.** Strongly disagree (1) → Strongly agree (5). Don't customize per question — consistency reduces cognitive load.
- **No double-barreled questions.** One claim per question. "We have clear roles AND clear priorities" is two questions. Split them.

## Dimension and archetype rules

- **Distinctness is non-negotiable.** Each diagnostic's `_distinctness` field declares what makes each dimension/archetype unique. Run the test: write the one-sentence definition for each; if two are paraphrases of each other, the set is wrong.
- **5–8 dimensions/archetypes per diagnostic.** Below 5, too coarse. Above 8, visitor can't keep them straight on a results page.
- **Archetype names should be short and memorable.** "The Fire Fighter" not "The Reactive Crisis Responder."
- **Every archetype has: summary, blindSpot, and either cheatCode (5 items) or nextMoves (3 items).** Pick one or the other per diagnostic — don't mix within a diagnostic.

## Score band rules

- **3 bands per dimension** (low / mid / high or exposed / uneven / healthy).
- **Boundaries are gap-free**: `[0, 40)`, `[40, 70)`, `[70, 100]`. Same convention every diagnostic.
- **Band narratives are tier-specific, not score-specific.** "You scored 73" narratives feel fortune-cookie. Bands describe a range of conditions; the narrative must be true for every score in that range.
- **Score bands include `nextMoves`** for the lower bands. Top-band visitors don't need a list of actions — they need preservation advice.

## Next-moves rules

- **3 actions per next-moves array.** No more, no less. Three keeps the list scannable and forces prioritization.
- **Specific, time-bounded, and observable.** "Hold a 15-minute weekly preview" beats "be more proactive." If a move can't be checked off as done, rewrite it.
- **No abstract recommendations.** "Reflect on your leadership style" is not a move; it's a wish.

## Result consistency invariants

The engine enforces these; content must respect them:

- All-min answers (1s, with reverse-scoring honored) produce **score 0** and lowest band.
- All-max answers (5s, reverse-honored) produce **score 100** and top band.
- A response set favoring a specific archetype on every MC question must produce that archetype as the result.
- Tied archetypes resolve by the `tiebreakOrder` array. Every diagnostic with `outputPattern: "archetype-match"` or `"both"` MUST declare `tiebreakOrder` containing every archetype id.

## Updating content

1. Edit the JSON in `src/data/<slug>.json`.
2. Run `npm run test:run` — edge-case tests will catch shape/distinctness/scoring issues.
3. Manually take the quiz on dev (`npm run dev`) and verify the result feels right.
4. Commit and deploy.
