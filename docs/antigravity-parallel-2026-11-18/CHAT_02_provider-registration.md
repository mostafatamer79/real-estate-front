# Chat 02 — provider-registration

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/service-providers`.
Codex review group: 2. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/service-providers/page.tsx`
- `app/service-providers/provider-registration.module.css`
- `tests/redesign-provider-registration.test.cjs`

## New-file ownership

- `components/redesign/chat02/` (directory subtree)
- `lib/redesign-chat02-` (filename prefix)
- `tests/parallel-chat02-` (filename prefix)
- `scripts/parallel-chat02-` (filename prefix)
- `public/artworks/chat02-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-02.md`; optional matching JSON.

## Concrete work

Correct and finish provider onboarding and opportunities using REVIEW_2. Main scoped reduced-motion selectors already; preserve that. Fix portal-local light/dark tokens, readable gold-button text, and stale opportunity pagination: old-page requests must not remain actionable as the new page loads/fails. Narrow the draft-persistence copy to what is implemented; navigation currently discards component state. Preserve dirty form/upload references through language changes, retries and background refresh. Preserve grants, expired-license blocking, real offer constraints/delivery modes and server approval. Distinguish provider opportunities from client-owned request tracking; do not claim /services/provider-requests shows assigned provider work without checking its owner-only backend contract. Keep actual multipart upload validation, long form and short-height offer dialog usable. Tests must exercise production helpers/behavior, not duplicated state simulations.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
