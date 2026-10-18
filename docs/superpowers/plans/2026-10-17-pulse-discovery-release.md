# AI Pulse discovery integration

> For agentic workers: use superpowers:executing-plans. The coordinator implements this bounded approved design in the existing isolated branch, with one separate final reviewer.

Goal: replace the public Pulse's workload calculator with the approved short discovery journey and prominent fixed scale example, preserving disclosed email sharing and owner capture.

Architecture: new focused React component and deterministic discovery module. Existing legacy check code and mail payload remain supported for already-open clients. Versioned discovery requests use the existing submit endpoint, rate limiting, honeypot, sender and owner Lead-Data contract. No dependencies or third-party accounts added.

Spec: BlueChip/projects/ai-audit/2026-10-17-pulse-discovery-draft/DECISIONS.md and approved standalone prototype. Thomas: "Okay, let's proceed." The fixed example and current price come from the reviewed draft. Newsletter and quarterly draw remain held.

## Constraints and review focus

- Free result without email. No hours/people/rate input in Pulse, no inferred savings from selections or falsely matched averages.
- Ten x2.5 x48 xC$40 = C$48,000, explicitly hypothetical; current C$795 comparison and three-net-team-hour plan guarantee remain separate.
- All six areas selectable; skipped/unsure/already-working remain distinct; no silent defaults from legacy saved calculator answers.
- Sanitize malformed/restored/hostile client data. Recompute shared records on the server from known catalogue/status values; never trust client descriptions or computed claims.
- Only structural analytics; no raw answers/email in analytics. Owner sharing requires the exact displayed notice version and explicit request. Owner-send failure must not be reported as complete capture.
- Real email, account actions, dependencies, publication and campaign sends are outside local verification. Preserve the existing open-tracker production overlay during any eventual deployment.

## Task 1: discovery and live email contract

Files: src/lib/pulseDiscovery.js, src/data/pulseCatalogue.js; api/_emails/ai-pulse-discovery.js; api/_lib/ai-check-results.js; tests/pulse-discovery.test.js and tests/pulse-discovery-email.test.js.

- [ ] Write failing tests: malformed session resets; all-six selection; no numeric personalized result; distinct statuses; exact fixed example; server rejects missing disclosure; unknown versions reject; hostile text does not enter emails; honeypot skips visitor; owner failure returns non-success; full sanitized record preserves answers and uncertainty.
- [ ] Run those tests and confirm failure, implement smallest sanitizer/snapshot/email path, then rerun to green.
- [ ] Retain legacy payload behavior and verify existing free-check email tests.

## Task 2: approved React journey

Files: src/components/AiPulseDiscovery.jsx, AiPulseDiscovery.css, PulseScale.jsx; src/App.jsx; src/components/IndexPage.jsx; tests/ai-pulse-discovery.test.jsx.

- [ ] Write failing UI tests: actual App route; choose all; learn after answer; skip/back without a trap; no workload fields; scale before longer ideas; free result; disclosed email request and honest partial failure; keyboard focus preserved through selection/modal or inline disclosure; print and restored state.
- [ ] Implement the approved flow using React's stable control nodes and existing SiteHeader, SEO, analytics and chat route. Use an inline email form rather than introducing a new dialog.
- [ ] Add the same fixed scale/value illustration to the Handoff Plan's existing learning section. Keep workflow sizing inside the paid delivery, not the public pages. Add a current-price change/confirmation line. Preserve the staged refund dedup.
- [ ] Run focused regressions, full suite, lint/build and headless phone/desktop journey/layout checks.

## Task 3: evergreen one-pager and final gate

- [x] Inspect the real v17 PDF. It contains C$795 and fee-dependent comparisons; draft-copy approval had not updated the PDF.
- [x] Build a separate editable evergreen revision using the accepted navy composition. Preserve current deliverables and guarantee, replace fixed price/fee multiples with current-price link and fee-confirmation wording, and use the approved scale scenario. Do not overwrite active campaign manifests or queued attachments.
- [ ] Extract/reopen/render PDF, verify no fixed price or fee-based break-even, links/QR, fonts, margins and phone detail proof. Apply Infy then panel to final copy.
- [ ] One available separate Codex reviewer under the October 17 provider-neutral rule checks the exact code, payloads, PDF and receipts. Fix material findings, verify, retain hashes, local commits and concrete handoff.
- [ ] Resolve final public-release boundary against the exact integrated artifact and existing dated release instructions. No automatic campaign send, new contest or extra live test email.
