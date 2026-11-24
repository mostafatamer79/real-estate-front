# Chat 09 — financial-marketing

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/financial`, `/marketing`.
Codex review group: 3. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/financial/page.tsx`
- `app/marketing/page.tsx`

## New-file ownership

- `components/redesign/chat09/` (directory subtree)
- `lib/redesign-chat09-` (filename prefix)
- `tests/parallel-chat09-` (filename prefix)
- `scripts/parallel-chat09-` (filename prefix)
- `public/artworks/chat09-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-09.md`; optional matching JSON.

## Concrete work

Finish standalone financial and marketing pages sequentially. IMPORTANT: original components/financial/FinancialWorkspace.tsx and components/marketing/MarketingWorkspace.tsx are imported by excluded /admin routes and business management. They are READ ONLY. Use owned standalone copies/adapters under components/redesign/chat09/ with correctly resolved imports and the actual API contract; preserve all existing standalone tabs/actions/permissions rather than replacing them with a cosmetic placeholder. Existing nested managers can be consumed read-only; if a required fix lives in a forbidden shared child, report the dependency rather than mutating it. Original financial summary failures render zero KPIs; standalone must show unavailable/retry and retain confirmed data appropriately. Marketing uses real campaigns/requests/upload/status and permissions, no invented campaign/revenue/approval statistics. Scope all CSS to owned roots; no .dark/global leakage. Verify through main that original admin imports and default behavior are byte-unchanged. Backend must remain unchanged.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
