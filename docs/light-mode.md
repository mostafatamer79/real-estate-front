# Light mode for the formerly dark-only screens

The existing global appearance setting now styles the dark-only public pages, account screens, dashboards, department workspaces, navigation, dialogs, and tutorial surfaces in both modes. Light mode uses the platform's existing off-white, white, and deep-green palette. Dark utility styles remain explicit dark variants. Logos follow the saved appearance setting.

Theme ownership remains in SettingsContext. Administrators select نهاري / ليلي under Settings → Appearance and save using the existing flow. Selecting a mode edits the settings form; saving applies it globally. No per-user appearance preference or new production setting was introduced.

Legacy pale header/dashboard text presets resolve to the foreground color in light mode. Other configured text colors remain intact. Printed invoice artwork is unchanged. The pre-existing PageWrapper edit is preserved.

## Verification — 2026-11-06

- Browser checks used mocked API responses and a local preview identity, with no production writes.
- 24 combinations passed: login, details, profile, wallet, internal marketing, and admin settings × light/dark × 390/1440 px. Both modes were loaded through SettingsProvider using mocked saved settings. No JavaScript page errors, incorrect route redirects, or horizontal overflow were observed.
- Eight further login/dashboard captures passed after the final contrast and shadow refinements. Screenshots and browser results are in `docs/verification/light-mode-2026-11-06/`.
- Regression suite: 74/75 pass. The unchanged baseline also passes 74/75. The remaining test, `mobile header uses a polished shell and motion with reduced-motion support`, conflicts with the existing drawer contents and fails on the unchanged baseline. Three existing assertions were updated for the intentional appearance changes.
- Type checking remains blocked by existing admin-user data typing and generated Next route checks for the existing login props and exported settings constant. The new theme code introduces no reported type error.
- The broad ESLint run reported the same 44 errors as the unchanged baseline (existing unescaped entities, effect state updates, impure render calls, and imports). Focused checks after the contrast changes reported existing issues only.
- Turbopack could not resolve Tailwind after selecting the parent workspace as its root. Visual verification used the existing webpack development option instead.
- `git diff --check` passed. The local graphify code graph was refreshed.

This is a local implementation. No commit, push, or deployment was performed.

## Neutral surfaces, shadows, and motion refinement

The default daylight palette now uses neutral off-white, charcoal, and white, reserving green for actions and chart emphasis. Explicit administrator palette values remain supported. Shared card/glass surfaces use a small neutral shadow, overlays have a separate elevation, and interactive cards deepen their shadow only on precise hover devices. Decorative colored layers are hidden in light mode. Dashboard grouping containers no longer add a second raised surface; chart frames no longer nest visible borders. Quick-action artwork is monochrome in daylight.

The dashboard stays visible from the first render. Large spring/scale entrances and dramatic icon bounces were replaced with 2px hover lifts and restrained press feedback. CSS transitions no longer compete with Motion's transform updates on these controls. The shared MotionConfig respects the system's reduced-motion preference; the dashboard interactions also explicitly remove movement. Charts draw once in 420ms and appear immediately with reduced motion. Blanket `will-change: transform` hints on rounded dashboard elements were removed.

Verification artifacts are in `docs/verification/neutral-refinement-2026-11-06/`. Normal and reduced-motion browser checks confirmed a 2px hover lift versus no transform, a neutral hover shadow, and no box-shadow animation under reduced motion. Desktop/mobile light/dark screenshots showed no page errors or horizontal overflow, and no visible colored decorative layers in daylight. Populated-chart checks use synthetic data only. The regression suite remains at 74/75 with the same baseline failure; existing type and lint failures remain outside this visual change.

## Remaining pages and shared forms

The neutral treatment now extends across the service catalog and request forms, marketing, finance and wallet, property offers and orders, chat, account pages, customer service, company/info pages, subscriptions, admin pages, department workspaces, and shared dialogs. Neutral page/panel/icon classes preserve the dark palette. Colored decorative layers are hidden only in daylight. Warning/success surfaces and conditional selection backgrounds remain intact. Hover/press transforms are bounded, and reveal helpers stay visible while using a short fade. Gradient headings now render with solid readable foreground text in daylight.

Wallet navigation now uses readable monochrome artwork and a lighter bottom-bar shadow. The department timestamp explicitly handles its time-dependent hydration text, avoiding a mismatch when the server and client render on opposite sides of a second.

Validation: the first browser sweep covered 27 routes at 1440/390 px in light mode plus six routes at both widths in dark mode (66 checks). All routes returned 200 without page overflow. Three timestamp hydration warnings were discovered on the department hub and addressed. The final affected-page pass covered 18 light/dark desktop/mobile combinations with zero page errors and no overflow. API responses and the preview account were local mocks; no application mutations were observed. Artifacts are in `docs/verification/remaining-pages-2026-11-06/`.

The suite remains at 74/75, with the same baseline mobile-header test failure. Existing financial/property layout assertions now tolerate the additional styling classes. The expanded ESLint scope reports the same 47 errors and 1238 warnings on the unchanged baseline and the styled source; existing TypeScript errors remain. No deployment was performed.
