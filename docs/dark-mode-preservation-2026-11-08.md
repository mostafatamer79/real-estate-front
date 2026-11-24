# Dark mode preservation

The service catalog selects its original committed dark presentation in `ServicesDark.tsx`, including the original card dimensions, heading, decorative effects and interactions. The newer request/provider links remain available. The refined light catalog continues in `page.tsx`.

All light redesign selectors for services and home start with `html:not(.dark)`. The broad dark glass overrides were removed, dark CSS variables and default settings were restored, and the dashboard's original dark entrance motion is enabled again. Quick actions and property cards retain their original dark hover/entrance motion while respecting reduced-motion preferences. The light-only chart draw animation remains scoped to light mode.

Verified locally with synthetic settings at 320px, 390px, 768px and 1440px: light/dark switching, original dark service card markup and heading, no dark matches for the new home rules, no horizontal overflow and no page exceptions. Existing original dark motion is restored on the dashboard. External map tiles were blocked in the fixture.

Production was deployed from an isolated source snapshot with the production API/WebSocket URLs baked into the build. The first attempted artifact with a local API URL was rolled back before the corrected release. Final production checks returned 200 for `/`, `/services`, `/service-providers` and `/details`; the homepage returned 200 publicly. The theme button switched both ways and persisted after reload at 390px and 1440px. Both PM2 processes are online. The previous frontend directory and a compressed rollback archive were retained.
