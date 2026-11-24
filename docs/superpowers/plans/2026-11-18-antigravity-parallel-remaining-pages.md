# Remaining non-admin pages implementation plan

**Goal:** Complete and independently verify the remaining non-admin redesign and reopened corrections using12 bounded Antigravity implementation chats and the four existing read-only Codex reviews.

**Architecture:** Exclusive existing-file ownership plus per-chat new namespaces; three existing recovery jobs retain ownership until explicit handover. One central integration/build gate after writers settle. Shared admin consumers stay unchanged.

**Tech stack:** Existing Next.js16/React/TypeScript/CSS Modules and project API/browser fixture tools; no dependency changes.

**Spec:** docs/WEBSITE_REDESIGN_MASTER_SPECIFICATION.md in the parent realestate repository, supplied design references, latest user scope excluding only admin plus earlier homepage exclusions, and docs/verification/redesign-2026-11-18/REVIEW_1.md through REVIEW_4.md.

## Steps

- [ ] Confirm live owners and release handover lanes04/05/06 only when actual processes finish.
- [ ] Follow docs/antigravity-parallel-2026-11-18/START_HERE.md and its12 task files, at most6 active implementers.
- [ ] Implement and functionally verify assigned routes one page at a time, preserving existing contracts and unrelated dirty work.
- [ ] Collect per-chat reports; inspect actual source changes and new files, correct blockers.
- [ ] Run central typecheck, tests, scoped lint, production build and static route inventory.
- [ ] Independently review rendered AR/EN light/dark screens, controls, failure cases, role gates and links; do not issue real API mutations.
- [ ] Obtain fresh four-group source reviews, fix new findings, then mark only supported routes complete in the main tracker.

No commit, push or deployment is authorized. Source-only review is not rendered acceptance. This plan does not automatically start new workers or cancel existing ones.
