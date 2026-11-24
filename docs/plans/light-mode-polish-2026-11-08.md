# Consistent neutral light mode

Approved scope: apply the six discussed improvements to converted pages, preserve dark mode, and reset Services to the original dark layout before adapting its colors to light. White/neutral gray surfaces and charcoal controls; no new green/blue branding.

1. Keep ServicesDark untouched as a reference. Replace the separate redesigned light Services layout with a theme-aware adaptation of that reference, preserving category order, grid spans, navigation, custom categories and availability/admin-preview rules.
2. Add scoped shared light rules for card hierarchy, readable descriptions/headings, form controls, button sizes, tables, focus, responsive wrapping and reduced motion. Use existing shared UI slots; preserve semantic statuses and specialized maps/chat layouts.
3. Compact the dashboard map, remove redundant nested record/empty-state boxes, improve chart labels and keyboard/pointer value inspection, and compact the light footer.
4. Verify TypeScript, focused lint, existing regressions and local browser route checks at phone/desktop widths. Compare Services category structure across themes and verify theme persistence, keyboard routing and soon/disabled/custom categories. Document actual route coverage and limits; no deployment.
