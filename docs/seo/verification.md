# SEO deployment verification — 23 October 2026

Deployed to https://www.digitalbrokerage.sa. Releases and rollback backups:

- `/var/backups/digitalbrokerage/seo-20261023-01`: previous frontend source and build before SEO.
- `/var/backups/digitalbrokerage/seo-20261023-02`: source and build before the guest-listing correction.

Only the frontend was rebuilt/restarted. Existing server source edits and environment files were preserved; no database records or payment transactions were changed. The temporary preview process was removed.

## Verified

- Fresh local production build succeeded; final staged server build succeeded after the guest-listing correction.
- TypeScript: `npx tsc --noEmit` passed.
- All 19 new SEO and guest-browsing tests passed. Full frontend suite: 67 passed, 1 existing failure.
- Targeted ESLint: no errors; 20 existing warnings in the moved listing client component.
- Public HTTPS and localhost Googlebot checks passed for eight public URLs and ten private URLs: HTTP status, title, description, canonical, Open Graph, structured data, and index/noindex rules.
- Seven canonical public URLs in `/sitemap.xml`; duplicate contact alias and private routes excluded. API reported zero active public listings at verification. Active listings are added automatically and carry real modification timestamps.
- `/robots.txt` advertises the sitemap; `/manifest.webmanifest` returns 200; missing listing UUID returns HTTP 404.
- Browser: public homepage, About, and Services remain accessible to guests. A browser-discovered redirect from Offers was reproduced: guest initialization fetched private appointment endpoints and the global 401 handler redirected to login. Fixed by loading appointments only with an existing token and restricting guest listing requests to active offers. Tests preserve signed-in appointment loading. After the correction, the live browser stayed on `/offers` after initialization and displayed the public empty-listing state without redirecting to login.

## Existing repository failures

- Test: `mobile header uses a polished shell and motion with reduced-motion support`, in `tests/mobile-header-footer-polish.test.cjs:32`. The test and Header source were unchanged by this task.
- Full repository ESLint: 71 errors and 1,417 warnings in existing files. These were not hidden or suppressed. SEO metadata, route layouts, server rendering helpers, and regression tests lint without errors.

## External steps and limits

Google Search Console/Bing ownership verification and sitemap submission have not been performed: the owner's webmaster account access was not available. Set the optional verification token values described in README and submit `https://www.digitalbrokerage.sa/sitemap.xml` in the owner's account. Search engine indexing and ranking were not verified or guaranteed. No real public listing detail could be tested in the live UI because the public listing inventory was empty; metadata, inactive-listing rules, API failure behavior, and missing-listing handling were regression-tested.
