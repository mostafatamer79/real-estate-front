# Review 2 — source findings, not approval

Both worker outcomes now exist: **AGY provider completed; OpenCode support timed out without implementing its scope.** This is source review only; I ran no builds, tests, browser fixtures, or mutations.

Actionable provider findings:

- **P1 — CSS Module compilation risk, high confidence.** [provider-registration.module.css:744](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/service-providers/provider-registration.module.css:744) contains unqualified `*`, `*::before`, and `*::after` selectors. These lack a local class and violate CSS Modules’ pure-selector requirement. Scope reduced-motion rules to local page/dialog classes. **Acceptance:** main’s production build compiles the module and reduced-motion behavior remains scoped.

- **P2 — Offer dialog loses its design variables, high confidence.** [DialogContent:1248](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/service-providers/page.tsx:1248) renders through a body portal, but every `--pr-*` token is defined on `.pageContainer`. The portal is outside that ancestor, so field backgrounds, borders, text and button colors using those variables become invalid. Give the dialog its own scoped token class, including dark overrides. **Acceptance:** open the offer dialog in both themes; inspect computed variables, contrast, focus and short-height scrolling.

- **P2 — Pagination keeps stale opportunities actionable during refresh, high confidence.** [load:115](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/service-providers/page.tsx:115) sets only `refreshing` after hydration. Opportunity rendering, bid eligibility and pagination controls still gate on `loading` (674, 692–697, 751, 762). Clicking Next therefore leaves the previous page’s requests actionable while displaying the new page number; failure preserves that mismatch. Use separate opportunity loading/error state or gate these controls on refreshing. **Acceptance:** delay/fail page-two fetch; page-one requests must not appear actionable as page two.

- **P2 — Dark primary-button contrast, high confidence.** [primaryBtn:645](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/service-providers/provider-registration.module.css:645) uses white text over dark-theme gold `#e6bb78`, yielding roughly **1.8:1** contrast. Use dark ink for dark-theme gold buttons. **Acceptance:** normal and hover states meet text contrast requirements.

- **P2 — Unsupported draft-persistence promise, high confidence.** [application copy:789](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/service-providers/page.tsx:789) claims drafts remain saved during navigation, but drafts exist only in component state/refs. Following the Nafath/profile link discards them. Restrict the copy to language changes/background refreshes, or explicitly implement approved persistence. **Acceptance:** copy matches actual navigation behavior.

Verification and scope:

- Provider changes reviewed against the snapshot: page, new CSS module, and new provider test. The test is explicitly permitted by the worker brief although omitted from the lane summary. No owned-file scope violation found.
- New tests duplicate functions/state simulations rather than exercising production code. Their reported passing results do **not** establish draft preservation, duplicate prevention, or responsive behavior.
- Support component and contact/support wrappers are byte-identical to baseline; proposed CSS and test files are absent. Duplicate feedback submission, hidden history failures, uncaught reply failures and duplicate reply refreshes remain unresolved.
- Existing provider language-independent hydration and tracking links are present in source. Main still needs independent checks and rendered acceptance after correcting the findings above.

