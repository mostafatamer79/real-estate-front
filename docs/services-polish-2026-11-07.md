# Service catalog positioning and light-mode refinement

The account actions now sit in the same header composition as the service heading: opposite the title on desktop and immediately underneath the description on smaller screens. Request tracking is the primary action; the provider portal is secondary. Accessible labels preserve the full original descriptions and the routes are unchanged. A separate top row contains back navigation and the platform name.

The catalog uses a clearer two/three-column desktop hierarchy, larger readable Arabic titles, visible destination arrows, larger icon targets, and more generous card spacing. Decorative numbering, badge clutter, and shimmer layers were removed from the catalog. Light mode stays neutral with one restrained green accent. Shared daylight shadows now use two subtle neutral layers. Card hover motion is bounded to 3px and respects reduced-motion preferences. Dark mode remains supported.

Browser verification checked both themes at 1440/390 px, including both account destinations, provider back navigation, and mouse/keyboard consent operation. No page errors, API writes, or horizontal overflow were observed. Additional layout checks passed at 1440, 1024, 768, 390, and 320 px. Hover motion was approximately -3px normally and absent with reduced motion. The first incomplete preview identity failed to reach the catalog; the completed preview account passed the checks above.

Full test suite: 84/84 pass. TypeScript passed. Focused ESLint has no errors and four existing any-type warnings. `git diff --check` passed. The code graph was refreshed. The screenshots and machine-readable results are under `docs/verification/services-polish-2026-11-07/`.

This remains local and has not been deployed.
