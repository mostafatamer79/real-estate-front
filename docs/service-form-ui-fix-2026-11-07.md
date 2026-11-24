# Service navigation and consent layout — 2026-11-07

The global platform theme is configured in `/admin/settings` under Appearance, using نهاري / ليلي and the existing save/confirmation flow. This change does not introduce a personal theme preference or alter saved production settings.

The service-provider page now includes an explicit back link to `/services`. The service catalog's provider and request-tracking links use compact theme-aware styles, rather than white blocks on the dark background.

The selected consent box stretched because the form-wide `[class*="bg-background"]` selector matched its checked-state background class. That rule set every match to 100% width with input padding and a minimum height. Reproduction at desktop width showed the marker growing from 18.75×18.75 px to 1023.5×52.5 px, squeezing the adjacent text to about 39 px wide. Submit controls were affected by the same selector.

The sizing/focus rules now target actual fields and comboboxes. Native checkbox/radio inputs are excluded from text-field styling. Checkbox and consent fields now use native labelled controls with keyboard operation and accessible required/invalid states. Legal-link destinations and consent validation remain intact. The submit action uses a compact, readable primary style.

Verification used a local mock API and preview account. In four combinations (1440/390 px × light/dark), navigation destinations and provider back navigation passed; clicking and pressing Space toggled consent correctly; checked/unchecked dimensions remained 18.75×18.75 px; the enabled submit action remained 45 px high; and no page errors, horizontal overflow, or API writes occurred. Screenshots/results are under `docs/verification/service-form-ui-2026-11-07/`.

The CSS regression test failed before the change and passed afterward. Full suite: 84/84 pass. TypeScript checking passed. Focused ESLint: no errors, 13 existing warnings. `git diff --check` passed and the code graph was refreshed. No deployment was performed.
