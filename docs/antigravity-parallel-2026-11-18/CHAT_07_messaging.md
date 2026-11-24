# Chat 07 — messaging

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/chat`, `/chat/[roomId]`, `/internal/chat`, `/internal/chat/[roomId]`.
Codex review group: 4. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `app/chat/page.tsx`
- `app/chat/[roomId]/page.tsx`
- `app/internal/chat/page.tsx`
- `app/internal/chat/[roomId]/page.tsx`
- `components/chat/chat-lists-redesign.module.css`
- `tests/redesign-chat-lists.test.cjs`

## New-file ownership

- `components/redesign/chat07/` (directory subtree)
- `lib/redesign-chat07-` (filename prefix)
- `tests/parallel-chat07-` (filename prefix)
- `scripts/parallel-chat07-` (filename prefix)
- `public/artworks/chat07-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-07.md`; optional matching JSON.

## Concrete work

Finish chat-list corrections first, then each room. REVIEW_4 identified a fetch loop: fetch callback depends on currentUser while its effect reparses a fresh user object and sets it repeatedly. Use stable identity/ref or separate hydration, bounded StrictMode requests, explicit error/retry and safe stale handling. Validate null/non-object participant entries and optional name/phone types before trim/render. Internal new-chat dialog needs actual focus trap, Escape, initial focus and restoration using existing read-only primitives. Rooms currently clear drafts on socket.emit without delivery confirmation. Inspect existing chat client and backend gateway READ ONLY; use only the actual acknowledgement/event contract. Preserve recoverable draft on disconnect/rejection and avoid duplicate sends/reconnection duplication. Do not invent an ack, fake delivered/read status or new server protocol. AR/EN direction, accessible composer/back/send and actual timestamps. Scope leaves shared lib/chat and shared chat-modal primitives unchanged. Report if server contract prevents delivery proof.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
