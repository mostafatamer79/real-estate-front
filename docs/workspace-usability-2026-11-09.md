# Navigation, tables and forms — 2026-11-09

Shared segmented tabs now respect the active language's RTL/LTR direction, show a high-contrast charcoal active state in light mode and respect reduced motion. The mobile back control checks known same-origin history through the Navigation API, with a conservative same-origin referrer fallback; otherwise it opens `/details`. This fixes the verified direct-entry case where browser history included `about:blank`. Explicit page back handlers and the profile return destination remain supported.

Shared pagination generates a bounded set of buttons, avoiding an array proportional to the total page count, marks the current page for assistive technology, clamps the current page and wraps on small screens. It benefits the existing user/offer/order/property administrator lists as well as the shared requests table.

The shared ServiceRequestsTable (marketing, legal/disputes, finance and property workspaces) adds labeled search/status/sort/refresh controls, Arabic name/digit search normalization, result counts, ten-record client pagination and consistent desktop rows/mobile cards. Failed loads are distinct from empty searches and have retry; filtering can be cleared. In-flight requests are cancelled on refresh, department changes and unmount. Invalid dates display a fallback. Row entrance fades no longer replay on each sort/page change.

Dynamic service forms retain their schema/sections/payload while adding associated labels, accessible native radio inputs, per-field errors, first-error focus, a submit error summary and keyboard submission. The submit action remains available to explain incomplete fields; validation blocks invalid requests. Required terms, number/quantity and disabled selections are checked. Failed requests preserve input, concurrent submissions are locked synchronously, successful submissions remain locked during the redirect, and redirect timers are cleared on unmount. Legal flow action buttons cooperate with the form without unintended cancel submissions.

The dashboard chart is now correctly labeled as **monthly transaction amounts in SAR**, matching `FinancialService.getChartData`; it is not a price-per-square-metre series. This is a presentation correction, with no change to financial calculations. Independent dashboard requests start together, and loading waits for the auth token to avoid the duplicate initial fetch.

## Validation

- Production webpack build passed; TypeScript passed; all 27 existing/new test files passed. The helper regression file covers bounded pagination, Arabic search/filter/order, form validation and safe back navigation, including initial red/green checks.
- Local production-browser fixtures at 1440 and 390px exercised populated lists, pagination, search, status filters, sorting, no results, retry after a failed load, invalid forms, first-error focus, native radio keyboard operation, failed saves, preserved input, concurrent submit protection and successful-save locking. Only two synthetic POSTs were accepted (one intentional failure, one success).
- RTL keyboard tabs, active-tab contrast, direct-entry back fallback, English validation, dark navigation, corrected chart units and one chart GET on initial dashboard entry passed. No uncaught page exceptions were captured. Evidence: `verification/workspace-usability-2026-11-09/checks.json` and screenshots.
- Focused lint for the new/shared changes has zero errors and 13 existing warnings. The existing effect-lint findings in LegalRequestFlow's definition-loading effect and the dashboard fetch effect remain; the full touched-file lint set is therefore not clean. Existing optional `@emotion/is-prop-valid` build warnings also remain. No rule suppressions or dependency changes were added.
- Diff whitespace and verification-script syntax checks passed.

## Scope and limitations

Search, sort and pagination apply to the requests already returned by the existing API batch (up to 500). If the API total is larger, the UI explicitly explains that scope. This does not add server-wide search or change backend endpoints, access policies or financial actions. Upload-placeholder behavior in the existing form schema remains unchanged. No real service requests, payments, messages or production records were created. No deployment performed.

Reproduce using `scripts/verify-workspace-usability.cjs` against a built local frontend on port 3360, with `PUPPETEER_MODULE` and `CHROME_PATH` pointing to an installed Puppeteer/Chromium. The script serves synthetic settings on port 3030, bypasses service-worker cache, intercepts API calls, and blocks external media requests.
