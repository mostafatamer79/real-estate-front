# Workspace usability pass

Preserve neutral light styling and existing dark layouts. Improve shared segmented navigation and back-button fallback; replace the requests table's misleading refresh/filter affordance with named search/status/order controls, loaded-result counts, bounded client pagination, distinct error/empty states and consistent mobile cards. Search/filter operate on the existing loaded request batch; disclose truncation when the API total exceeds it rather than implying full-server search. Do not change billing or request permissions.

Dynamic forms: keep the existing schema/field groups and payload shape, add associated labels, accessible radio controls, per-field required/number/selection errors, focus the first invalid control, preserve input after failure, and prevent concurrent submissions. Keep successful submissions locked during redirect. Support Arabic/English validation messages.

Verify pure behavior helpers, existing regressions, TypeScript, focused lint, production build and local browser fixtures covering populated/empty/failed request lists, narrow layouts, keyboard navigation and invalid/failed/successful form submissions. No deployment or real payment/request submission.
