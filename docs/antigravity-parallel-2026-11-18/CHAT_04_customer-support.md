# Chat 04 — customer-support

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/customerservice`, `/customerservice/contact`, `/customerservice/support`.
Codex review group: 2. Reviewer is read-only; you implement only your assignment.

## Start gate

HOLD: current recovery lane agy-recover-support may still own these files. Completion report: /tmp/realestate-redesign-20261118/agy-recover-support/result.json. Check that it exists, inspect status and ensure worker really exited. A timeout/failure is not a passed handover. Start edits ONLY after Codex/user explicitly releases the lane; until then inspect read-only or return WAITING_FOR_HANDOVER.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `components/customer-service/CustomerServicePage.tsx`
- `components/customer-service/customer-service.module.css`
- `app/customerservice/page.tsx`
- `app/customerservice/contact/page.tsx`
- `app/customerservice/support/page.tsx`
- `tests/redesign-support-state.test.cjs`

## New-file ownership

- `components/redesign/chat04/` (directory subtree)
- `lib/redesign-chat04-` (filename prefix)
- `tests/parallel-chat04-` (filename prefix)
- `scripts/parallel-chat04-` (filename prefix)
- `public/artworks/chat04-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-04.md`; optional matching JSON.

## Concrete work

HANDOVER lane: existing AGY recovery owns a subset of these files. Do not write until it has finished and Codex/user has handed over; then inspect its actual diff and retain useful work. Finish route-aware customer hub/contact/support without duplicate components or false promises. Feedback and replies need synchronous pending guards; history failures must not masquerade as empty; reply failures retain draft; avoid duplicate refresh after send. Preserve cached selected tickets and detect malformed/stale responses. Submit actual source route; use associated labels, accessible scrollable dialogs, FAQ/catalog navigation and actual section settings. FAQ page belongs to chat11: link it but do not edit it. /admin/customer-service is a distinct excluded page. Complete correctness before additional visual expansion.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
