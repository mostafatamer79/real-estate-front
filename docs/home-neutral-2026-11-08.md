# Neutral light appearance

Supersedes the rejected blue and green surface treatments. Dashboard, welcome, grouped statistics, card/icon surfaces, charts, footer and Nafath panel now use white and neutral gray. Primary buttons, shared light defaults, theme-toggle and services accents now use charcoal and neutral gray; semantic success/error colors remain. Shared calm-page backgrounds and icon surfaces are neutral as well. Dark mode rules are unchanged.

Verified local Chromium at 1440px and 390px using synthetic data: canvas gradient has equal RGB channels and no document overflow. Inspected desktop render. Two footer regression files passed; git diff whitespace passed. No production deployment. Screenshots: verification/home-neutral-2026-11-08.

Button follow-up: verified computed map-button gradient RGB(69,69,69) → RGB(48,48,48) and shared primary #303030 at both widths. TypeScript passed; SettingsContext ESLint has zero errors and seven existing any-type warnings.
