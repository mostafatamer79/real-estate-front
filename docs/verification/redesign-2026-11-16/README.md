# Redesign verification

The user requested page-by-page redesign and functional review, starting with `/details` and login. `/` and `/home` remain excluded and match the starting user snapshot. Completion state is recorded in `PLATFORM_PAGES.md`; pending routes must not be represented as reviewed.

Reference notes: `REFERENCE_NOTES.md`. Original generated assets: `GENERATED_ARTWORK.md`. Detailed scope and review findings: `PAGE_REVIEW.md`.

## Reproduce local checks

Start the frontend locally and supply synthetic browser fixtures only. The scripts reject non-local base URLs and intercept API calls; they do not create real OTP, financial or service records.

```bash
E2E_BASE=http://127.0.0.1:3399 \
PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core \
CHROMIUM_EXECUTABLE=/absolute/path/to/chromium \
E2E_OUTPUT=/tmp/redesign-verification \
node scripts/verify-redesign-offers.cjs
```

Equivalent scripts: `verify-redesign-details.cjs`, `verify-redesign-services.cjs`, `verify-redesign-legal.cjs`, `verify-redesign-service-form.cjs`, and `verify-redesign-artwork.cjs`. Run one script at a time with its own output directory. Avoid rebuilding `.next` while a production-server browser check is active; launch a fresh production server after the build finishes.

Run `node scripts/audit-redesign-links.cjs` for a source inventory. Static route existence and HTTP status are distinct from per-page UI/workflow verification. Dynamic route expressions need contextual review. The read-only synthetic metadata server used during builds lives under the task's temporary evidence directory; no real backend/database was started.

## Limits

Checks use synthetic accounts/settings and mocked API responses. Map tiles are blocked by local fixtures. Real identity/OTP delivery, Nafath, payment settlement, production authorization, device keyboard behavior and real-device performance have not been certified. No deployment, push or commit was performed. Broad lint already contained unrelated failures before this redesign; report scoped lint separately.

Additional local fixture scripts: `verify-redesign-offer-editor.cjs`, `verify-redesign-orders.cjs`, `verify-redesign-offer-detail.cjs` and `verify-redesign-offer-detail-extra.cjs`. Use the same `E2E_BASE`, `PLAYWRIGHT_MODULE`, `CHROMIUM_EXECUTABLE` and optional `E2E_OUTPUT` variables. The extra detail script checks chat initialization failure/retry, proxy-visit HTTP failure/retry, guest return targets and listing retry. Socket delivery, payment processing and real booking dispatch are not certified by synthetic fixtures.


November 17 additions: local fixture scripts for profile (core/uploads/extra), service register (my-requests/core+extra), and provider tracking (provider-requests/core+extra). Use a separate E2E_OUTPUT directory for each script. If local server rendering needs an API at port 3030, and the project already points to that loopback API, start the read-only synthetic metadata fixture with `node tests/fixtures/local-metadata-server.cjs`. It binds only loopback and rejects all writes; do not replace or stop an existing backend to run it.

Legal client dossier scripts: `verify-redesign-legal-requests.cjs` and `verify-redesign-legal-requests-extra.cjs`. Final retained JSON reports and screenshots sit beside this document; platform-wide progress remains authoritative in PLATFORM_PAGES.md.
