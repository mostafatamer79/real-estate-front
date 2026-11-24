# Start here — 12 Antigravity implementation chats

Open **12 fresh chats in total**, one CHAT_XX file per chat. Run **at most 6 implementation chats simultaneously**. The four existing Codex chats remain review-only and do not count as these 12 implementation chats. You do not need 12 new review chats.

The pack covers every one of the 26 currently Pending non-admin routes, plus login/OTP corrections. Assigned grouped routes must still be completed page by page. This is a task plan, not an assertion that all features are implemented or verified.

## Important existing workers

At creation, no completion reports were present for `agy-recover-support`, `agy-recover-subscriptions`, `agy-recover-departments`. They were launched earlier and may still be running. Their current status is UNKNOWN until checked. **Chats04/05/06 are HANDOVER replacements, not duplicate workers to start now.** Read their reports, ensure their processes exited, and obtain explicit handover from Codex/user before editing. Do not stop/kill another worker automatically. A completed self-report still requires code review; a timed-out run may have partial edits worth preserving.

## Simple schedule

1. Now: existing recovery workers occupy up to3 of the6 slots. Start new chats01(login),02(provider),03(wallet/checkout). These have separate file ownership.
2. When recovery owners finish and release files, start/continue handover chats04(support),05(subscriptions/renewal),06(department navigation) as needed, absorbing existing work instead of implementing twice.
3. As slots free, start07(messaging),09(standalone finance/marketing),11(content/FAQ),12(scan map).
4. After chat06 has finalized the route contract, start08(business workspace) and10(department requests/disputes). Always keep at most6 active implementers, counting existing workers.
5. Do not run concurrent project builds/dev servers/typechecks against the same checkout. Codex runs one central gate once writers settle.

## What to send

Open the realestate project in Antigravity. Attach or paste ONLY the matching CHAT_XX.md in each fresh chat. Each prompt tells it to read COMMON.md from this workspace; do not paste the full original conversation. Tell the agent its exact chat number. Never send the same task to two chats.

If Antigravity cannot access this filesystem, do not assume the absolute paths work: provide that chat's prompt plus COMMON.md and the necessary source snapshot, with equivalent exclusive ownership in its checkout. Do not automatically upload secrets, whole repositories, or change model services.

| Chat | Task | Start |
|---|---|---|
|01|Login, OTP, Nafath contract|Free when no auth worker remains|
|02|Provider onboarding corrections|Free when no provider worker remains|
|03|Wallet and checkout|Free when no wallet worker remains|
|04|Customer-service hub/contact/support|HOLD: existing support recovery|
|05|Subscriptions and renewal|HOLD: existing subscription recovery|
|06|Department hub and canonical routing|HOLD: existing department recovery|
|07|Public/internal chat lists and rooms|Free when no chat worker remains|
|08|Business/property management and internal root|After06 route contract|
|09|Standalone finance and marketing|Use owned standalone copies; admin-shared originals read-only|
|10|Department requests and disputes|After06 route contract|
|11|About, info, feedback, FAQ|Independent files|
|12|Scan map|Shared map/payment components read-only|

## Completion and review

Each implementation chat leaves its changes uncommitted and writes its own reports/chat-XX.md. Report status READY_FOR_REVIEW or NOT_READY; neither means final approval. Main Codex checks actual owned diffs, permissions/contracts, meaningful tests, rendered screens and links. Four review chats can divide the reports by the group number in each task. Review group3 also reviews business management08; review group4 reviews messaging/routing/requests/map. Initial reviews already found blockers, so a new changed patch needs a new review.

Central gates after writers settle: `npx tsc --noEmit`; `node --test tests/*.test.cjs`; scoped ESLint; `npm run build -- --webpack`; `node scripts/audit-redesign-links.cjs`; localhost browser fixtures per route/theme/locale/viewport and all owned controls/links. Do not equate route existence, HTTP200, tests copied from implementation or worker claims with functional completion.

Existing evidence: docs/verification/redesign-2026-11-16/PLATFORM_PAGES.md and docs/verification/redesign-2026-11-18/REVIEW_1.md through REVIEW_4.md. These reflect earlier snapshots; check current source. Do not rewrite shared progress files concurrently: Codex owns the overall tracker and acceptance.
