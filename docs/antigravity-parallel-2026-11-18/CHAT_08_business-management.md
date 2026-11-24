# Chat 08 — business-management

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/buildingmanagement`, `/internal`.
Codex review group: 3. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.
Dependency: finish chat 06 and read its route-contract report before implementation.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `components/properties/BuildingManagementWorkspace.tsx`
- `app/buildingmanagement/page.tsx`
- `app/internal/page.tsx`

## New-file ownership

- `components/redesign/chat08/` (directory subtree)
- `lib/redesign-chat08-` (filename prefix)
- `tests/parallel-chat08-` (filename prefix)
- `scripts/parallel-chat08-` (filename prefix)
- `public/artworks/chat08-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-08.md`; optional matching JSON.

## Concrete work

Start only after chat06 has finalized canonical routing, and preserve its initialSection/initialFinancialTab contract. Finish the BUSINESS/property management workspace, not /admin. Read the large file by relevant symbols/regions, not repeated whole-file dumps. Preserve actual portfolio/tenant/lease/payment/navigation/permission behavior and all dirty work; do not rewrite the whole 6K-line module. Known issues: 21rem drawer exceeds320px, toggle lacks accessible name/expanded state; offer-map overlay lacks proper dialog semantics/focus/Escape/return; financial mutation controls require actual permission-aware UI, pending guard and truthful status. Use existing accessible primitives read-only. Unknown financial data must not look like confirmed zero. One module/section at a time with functional checks, then wrapper routes. Do not modify FinancialWorkspace, MarketingWorkspace, API clients or shared dialogs; those may have excluded admin consumers. Financial/marketing originals remain read-only; avoid coupling chat09 standalone copies into this shared workspace without coordinator integration.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
