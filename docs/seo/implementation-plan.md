# Search visibility implementation

Approved scope: improve search discovery and page metadata, then deploy to digitalbrokerage.sa.

1. Centralize canonical URLs, public route policy, Arabic page titles/descriptions, listing metadata, and safe JSON-LD serialization; test public/private boundaries and untrusted listing text.
2. Give visitors a server-rendered public homepage and links, retaining signed-in navigation and login access. Allow only explicit public browsing routes through the client wrapper.
3. Add metadata layouts, public listing summaries, breadcrumbs, Organization/WebSite schemas, a current sitemap, robots.txt, and optional Search Console verification. Respect disabled/hidden site sections and inactive listings.
4. Run regression tests, TypeScript, lint and production build; inspect generated HTML and indexing endpoints.
5. Deploy only SEO files over a staged copy of the current server source, preserve existing configuration and edits, back up source/build, then verify public responses. Roll back if health verification fails.

Limits: metadata does not guarantee rankings. Search Console ownership and sitemap submission require access to the owner's Google account. No payment, account or database mutations are part of this work.
