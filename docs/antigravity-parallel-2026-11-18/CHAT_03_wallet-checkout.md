# Chat 03 — wallet-checkout

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/wallet`, `/checkout`.
Codex review group: 3. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/wallet/page.tsx`
- `app/wallet/wallet-redesign.module.css`
- `app/wallet/components/InvoicesSection.tsx`
- `app/wallet/components/WalletSidebar.tsx`
- `components/Payment/CheckoutHandoff.tsx`
- `app/checkout/page.tsx`
- `lib/redesign-wallet-amount.ts`
- `tests/redesign-wallet-amount.test.cjs`

## New-file ownership

- `components/redesign/chat03/` (directory subtree)
- `lib/redesign-chat03-` (filename prefix)
- `tests/parallel-chat03-` (filename prefix)
- `scripts/parallel-chat03-` (filename prefix)
- `public/artworks/chat03-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-03.md`; optional matching JSON.

## Concrete work

Finish wallet corrections from REVIEW_3, then checkout handoff. Main fixed CSS purity and lowered the mobile dock below z50 dialogs; retain those fixes. An old displayed balance becomes stale after failed refresh: mark unavailable and block withdrawals both in UI AND handler until fresh confirmation. Preserve invoice/subscription ledger sources independently so one endpoint failure does not delete cached rows from the other. Show commission/files failures with retry instead of successful empty content. Validate finite positive money at 2-decimal precision against current confirmed balance and guard duplicate pending actions. Preserve invoice types, document/receipt ownership and real gateway contracts; no local mark-paid/activation. Checkout guests need a real login link with a validated single target and wallet/back navigation. Preserve query target allowlists; real success remains server-confirmed. Keep existing wallet invoice tests. Shared PaymentMethodsModal, Geidea, receipt/PDF primitives and API clients are READ ONLY.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
