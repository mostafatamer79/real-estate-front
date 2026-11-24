# Light presentation refinement

Light services now has a larger dark-green heading, sage featured service cards, green icon tiles, restrained category watermarks and separated footer actions. Other cards stay white with quiet borders and shadows. All service design rules remain scoped to `html:not(.dark)`; the original `ServicesDark.tsx` presentation was unchanged in this refinement.

Shared light styling restores stronger heading hierarchy, sage icon surfaces, text selection and visible form focus. Removed broad transparent section/main overrides and global card pseudo-elements/positioning, allowing each component to retain its own layout and status surface.

The design engineering guidance informed brief, interruptible interaction feedback. Hover effects apply to pointer devices; reduced-motion users keep static arrows. Existing copy, service destinations and admin preview behavior are retained.

Browser checks used synthetic settings at 320, 390, 768 and 1440px. Arabic and English, Enter-key theme switching, reduced motion, switching in both directions, the original dark service markup/background and no horizontal overflow passed. The 320/768 checks had no uncaught page exceptions. TypeScript, service navigation/form regressions and diff whitespace checking passed. Build compilation was exercised through local webpack dev; no new production build or deployment was performed.

Screenshots: `verification/light-mode-final-2026-11-08/light-desktop.png`, `light-mobile.png`, `dark-desktop.png`.
