# Details HTML motion previews

Verified locally on 2026-11-20. Scope: `public/design-options/` D/E/F/G previews and content-options gallery. The real `/details` page and original map implementation were not modified by this task.

- 16 browser cases: all four variants at 1440x900, 390x844, 320x740 with reduced motion, and 844x390 landscape.
- Confirmed typography changes at three scroll positions in portrait/desktop, sticky scene, short viewport fallback, and live reduced-motion fallback.
- Checked content parity, inline JavaScript syntax, no images or videos, no horizontal document overflow, expand/collapse-all, dialogs/Escape/focus return, theme switching, anchors, and destination route existence.
- Eight gallery checks: all four watch/stop controls at desktop and mobile; iframe scenes use a 700px viewport so pinned motion is visible.
- Checked SHA-256 unchanged for DetailsNeighborhood.tsx, neighborhood-scene.js, Map.tsx, details-design.ts.

These are static visual prototypes. Account data and the live map are accessed through links to the original application. Route existence checks are not proof of authenticated backend behavior. No production build or deployment was performed for these static HTML changes.
