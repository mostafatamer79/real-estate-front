# Chat 01 — login-otp-nafath

Use this as the initial prompt in ONE fresh Antigravity implementation chat.

Read `/home/mostafa/Work/mostakl/realestate/real-estate-front/docs/antigravity-parallel-2026-11-18/COMMON.md` and `START_HERE.md` first. They are binding context for this task. Do not request the entire original conversation.

## Assignment

Routes: `/login`, `/verify-otp`, `/nafath-login`.
Codex review group: 1. Reviewer is read-only; you implement only your assignment.

## Start gate

Start only when no other worker owns these files.

## Exclusive exact-file ownership (create assigned missing files only if needed)

- `components/auth/SignIn.tsx`
- `components/auth/sign-in.module.css`
- `app/verify-otp/page.tsx`
- `app/verify-otp/verify-otp.module.css`
- `app/login/page.tsx`
- `app/nafath-login/page.tsx`
- `tests/otp-navigation-cancellation.test.cjs`

## New-file ownership

- `components/redesign/chat01/` (directory subtree)
- `lib/redesign-chat01-` (filename prefix)
- `tests/parallel-chat01-` (filename prefix)
- `scripts/parallel-chat01-` (filename prefix)
- `public/artworks/chat01-` (filename prefix)
- Your report: `docs/antigravity-parallel-2026-11-18/reports/chat-01.md`; optional matching JSON.

## Concrete work

Finish the login visual correction, then OTP behavior, then verify the Nafath route contract. Review1 found the returned login still uses separated rounded cards instead of the requested immersive threshold composition; inspect rendered views before redesigning. One artwork instance already exists; keep it responsive. Remove unsupported accreditation claims (main already removed one: do not reintroduce it). Preserve method settings, keyboard tabs, input values, safe return destinations and normalization contract. Verify the actual supported phone convention before changing normalization; submit/store the same canonical identifier. Review1 found support-link cancellation also fires on Ctrl/Cmd-click: cancel only navigation leaving this page, using the installed Next Link navigation semantics. Preserve Back/unmount cancellation, expiry/resend guards and distinct invalid-code/offline/server/malformed-response feedback. Validate real success fields before storage. /nafath-login currently redirects to /profile; do not simulate a standalone Nafath identity service. Render AR/EN/theme/mobile/tablet/desktop before calling the result visually ready.

## Execution checklist

- [ ] Confirm handover/ownership, inspect current source and the relevant review.
- [ ] Preserve a small local before-state/diff record for your owned files without stashing/resetting other work.
- [ ] Implement and functionally check the first assigned page, then advance through remaining routes.
- [ ] Run scoped lint and meaningful focused tests; use localhost intercepted fixtures for rendered checks if available.
- [ ] Check every owned control/link, AR/EN, themes, viewport/keyboard/reduced motion and failure/retry states.
- [ ] Produce the specified report with actual evidence and unresolved checks; leave uncommitted. Browser unavailable means NOT READY, not passed.
