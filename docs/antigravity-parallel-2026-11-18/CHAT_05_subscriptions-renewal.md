# Chat 05 — subscriptions-renewal

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/subscriptions/new`, `/internal/renew-subscription`.
Codex review group: 3. Reviewer is read-only; you implement only your assignment.

## Start gate

HOLD: current recovery lane agy-recover-subscriptions may still own these files. Completion report: /tmp/realestate-redesign-20261118/agy-recover-subscriptions/result.json. Check that it exists, inspect status and ensure worker really exited. A timeout/failure is not a passed handover. Start edits ONLY after Codex/user explicitly releases the lane; until then inspect read-only or return WAITING_FOR_HANDOVER.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/subscriptions/new/page.tsx`
- `app/subscriptions/new/subscription-redesign.module.css`
- `app/internal/renew-subscription/page.tsx`
- `lib/redesign-subscription-quote.ts`
- `tests/redesign-subscription-quote.test.cjs`

## New-file ownership

- `components/redesign/chat05/` (directory subtree)
- `lib/redesign-chat05-` (filename prefix)
- `tests/parallel-chat05-` (filename prefix)
- `scripts/parallel-chat05-` (filename prefix)
- `public/artworks/chat05-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-05.md`; optional matching JSON.

## Concrete work

HANDOVER lane: wait for existing AGY subscription recovery to finish and release files, then inspect real integration. Earlier OpenCode produced a helper and large unused CSS while the page remained unchanged. Integrate pricing availability and actual helper: missing/failed prices must never submit a false free quote; explicit real zero stays valid. Keep department/seat/billing/promo/preview/permission/server recalculation contracts and preserve selections through language/failures. Do not activate subscriptions locally. Add bounded meaningful tests importing the actual production helper. Only after the new-subscription page is checked, finish internal renewal with real plan/price/status, guest return target, pending/retry and existing payment flow; no invented renewal endpoint or confirmed-payment claim. New CSS must be used and scoped, not another unintegrated artifact.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
