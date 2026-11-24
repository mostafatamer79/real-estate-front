# Chat 06 — department-routing

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/department-hub`, `/internal/[dept]`.
Codex review group: 4. Reviewer is read-only; you implement only your assignment.

## Start gate

HOLD: current recovery lane agy-recover-departments may still own these files. Completion report: /tmp/realestate-redesign-20261118/agy-recover-departments/result.json. Check that it exists, inspect status and ensure worker really exited. A timeout/failure is not a passed handover. Start edits ONLY after Codex/user explicitly releases the lane; until then inspect read-only or return WAITING_FOR_HANDOVER.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/department-hub/page.tsx`
- `app/department-hub/department-hub-redesign.module.css`
- `app/internal/[dept]/page.tsx`
- `lib/redesign-department-navigation.ts`
- `tests/redesign-department-navigation.test.cjs`

## New-file ownership

- `components/redesign/chat06/` (directory subtree)
- `lib/redesign-chat06-` (filename prefix)
- `tests/parallel-chat06-` (filename prefix)
- `scripts/parallel-chat06-` (filename prefix)
- `public/artworks/chat06-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-06.md`; optional matching JSON.

## Concrete work

HANDOVER lane: wait for AGY department recovery and release before writing. Fix route selection and hub permissions from REVIEW_4. Shared BuildingManagementWorkspace reads raw URL section as well as initial props: changing initialSection alone cannot fix unsupported section=dashboard/payments. Use canonical supported section values, preserve meaningful authorized subsections and financial subtab through the actual prop/query contract. Defaults: properties->properties, legal->legal, marketing->marketing, employees->users, finance->financial. Keep direct entry, hub link, reload and Back consistent without redirect loops/render-side navigation. Support finance/financial alias consistently with existing guards; explicit denies remain denied. Hub summary failure is unavailable/retry, never confirmed zero. Shared workspace belongs to chat08 and is READ ONLY here. Publish the canonical mapping in your report before chat08 starts. Preserve existing module/coming-soon/preview logic.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
