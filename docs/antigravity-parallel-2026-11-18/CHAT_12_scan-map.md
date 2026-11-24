# Chat 12 — scan-map

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/scan-map`.
Codex review group: 4. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/scan-map/page.tsx`

## New-file ownership

- `components/redesign/chat12/` (directory subtree)
- `lib/redesign-chat12-` (filename prefix)
- `tests/parallel-chat12-` (filename prefix)
- `scripts/parallel-chat12-` (filename prefix)
- `public/artworks/chat12-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-12.md`; optional matching JSON.

## Concrete work

Finish the real scan-map workflow with a refined map-first composition and clear usable mobile controls. Shared app/src/components/Map and PaymentMethodsModal are READ ONLY (other pages/admin may consume them). Use owned local wrappers/adapters rather than altering shared contracts. Preserve actual places/selected district/report/payment flow and section/preview flags. Distinguish unavailable geolocation/maps/network/report/pricing from valid empty/zero. Protect draft selection, busy races, rerender/unmount and retry. Reports/results must be real server data; never fake generated analysis or settlement, and do not issue real payment/report mutations during checks. Use intercepted tiles/geolocation/API and explicitly note limits. Accessible map controls, named dialogs/focus/Escape, short-height mobile layout, layered payment/modal controls and all real links matter. No invented legal/property/AI reliability claims or report endpoints.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
