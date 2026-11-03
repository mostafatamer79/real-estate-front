# Real Estate Frontend

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run start
```

## Required Environment

Copy `.env.example` to `.env` and set:

- `NEXT_PUBLIC_API_URL`

Use the full API base URL, including `/api`, for example:

```env
NEXT_PUBLIC_API_URL=https://api.example.com/api
```

## Production Notes

- The app falls back to static metadata if the backend is unavailable during build.
- Public settings are fetched at runtime from the backend settings endpoint.

## Search visibility

Public metadata uses the canonical `SITE_URL` (defaults to `https://www.digitalbrokerage.sa`).
Optional `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` values enable ownership verification meta tags. Rebuild after setting verification values.

- `/sitemap.xml` includes enabled public pages and active public offers, with real listing modification dates. It returns an error during a backend outage instead of publishing an empty listing inventory.
- `/robots.txt` advertises the sitemap to all crawlers. Private routes carry `noindex`; authentication remains enforced by the existing application/API.
- Listings and metadata use the same public read endpoints as guest browsing; no account data or authentication tokens are used.
- Arabic is the initial document language. English browser preferences remain supported by the language switcher. There are no separate language URLs, so no misleading `hreflang` links are generated.
- Disabled/hidden sections are omitted from the sitemap and receive `noindex`. No API/database visibility settings are changed.
- Public listing data is cached for 60 seconds; settings are read fresh with an 8-second timeout. Transient API failures return an error rather than incorrect listing details.

After deployment, the site owner should verify the domain in Google Search Console and Bing Webmaster Tools, submit `https://www.digitalbrokerage.sa/sitemap.xml`, and inspect the homepage and key listing URLs. Search position and indexing are controlled by the search engines; metadata alone does not guarantee rankings.
