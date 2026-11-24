# Chat 10 — department-requests-disputes

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/internal/[dept]/requests`, `/disputes`.
Codex review group: 4. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.
Dependency: finish chat 06 and read its route-contract report before implementation.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/internal/[dept]/requests/page.tsx`
- `app/disputes/page.tsx`

## New-file ownership

- `components/redesign/chat10/` (directory subtree)
- `lib/redesign-chat10-` (filename prefix)
- `tests/parallel-chat10-` (filename prefix)
- `scripts/parallel-chat10-` (filename prefix)
- `public/artworks/chat10-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-10.md`; optional matching JSON.

## Concrete work

After chat06 publishes department access/navigation mapping, finish departmental request list/detail/actions, then disputes. Preserve existing authorization, prices, invoice decisions and chat destinations. Catch list/detail/chat failures as recoverable errors, not false empty success, and discard stale route responses. Tests need direct entry, forbidden roles, actual department grants, status/currency0, failure retry and every visible row/action. Disputes details button currently has no handler and nullable parties crash because typeof null==='object'; add actual accessible details dialog or a verified existing destination and safe parties. Keep complete descriptions accessible. Shared ServiceRequestsTable, LegalRequestFlow, chat-modal, financial APIs and modal primitives are read-only, including any admin consumers. Use owned local adapters if necessary; no simulated legal encryption or fabricated licensing/status metadata.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
