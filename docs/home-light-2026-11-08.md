# Homepage daylight refinement

Covered both the guest public homepage (`/`) and the signed-in dashboard (`/details`). All new rules live in `app/home-light.css` and begin with `html:not(.dark)`. Existing dark utility classes, order, navigation handlers, map behavior and data fetching remain intact.

Dashboard: sage welcome panel visible on desktop and mobile, stronger section headings with fine separators, green map action, individual labeled quick-action tiles, and single-surface charts with more compact empty states. The public page gets a larger balanced heading, stronger primary CTA, and white feature/service surfaces. Content and capabilities come from existing copy/settings.

The design engineering guidance informed restrained hierarchy and consistent component spacing. No extra animation or dependencies were added.

Local checks used synthetic settings and a preview account at 390/1440px for both routes: theme switching, no horizontal overflow, no uncaught page exceptions, and no matching new homepage CSS rules in dark mode passed. External map tiles were blocked in the browser fixture; grey map tiles in screenshots are a test limitation. TypeScript and four relevant regression test files passed. ESLint reports one existing `react-hooks/set-state-in-effect` error at the dashboard's unchanged fetchData effect, plus existing warnings.

Deployed in the isolated production frontend release. Live route checks returned 200 for `/` and `/details`; browser theme switching and persistence passed at 390px and 1440px. Screenshots are under `verification/home-light-2026-11-08/`.
