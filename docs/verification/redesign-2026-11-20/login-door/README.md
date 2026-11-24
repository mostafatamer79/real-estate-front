# Login doorway and blue platform palette

Implemented the selected doorway in the real `/login` route. The four service controls are buttons: they change the selected description locally and never navigate or send requests. Replaced the mounted WebGL login scene with original SVG/HTML doorway geometry. Authentication submit logic was compared against the pre-integration snapshot and was unchanged.

Light appearance uses blue-grey `#e3eaf4`; dark appearance uses navy `#101827`, with readable dark surfaces and text. Shared background defaults and legacy neutral background normalization were updated. No backend settings were saved.

Details remain six standalone HTML options under `public/design-options`, linked from `motion-choices.html`. Added three options: map first, property observatory, spatial sequence. All six now include `map-viewer.html`, which uses a byte-for-byte copy of the original neighborhood scene engine and the installed Three.js build with its license. `node scripts/sync-design-map-preview.cjs` refreshes the local preview assets. The actual details page, original scene geometry, markers and map controls were preserved; only shared default colours changed.

Verification:
- ESLint for SignIn and LoginServiceDoor; TypeScript check.
- Relevant auth/navigation/login/details-design/form-style tests passed, including the existing OTP cancellation suite.
- Five real-route browser cases: Arabic/English, desktop/mobile, light/dark, reduced motion. No network writes from service selection. Synthetic 503 preserves input; synthetic successful OTP response follows the existing verification handoff. No real OTP sent by tests.
- Twelve details-map browser cases: six designs at desktop/mobile. Verified WebGL canvas, rotation changes image, zoom, reset, marker selection, theme propagation, no document overflow or page runtime errors.
- Production webpack build passed. No deployment, commit or push.

AGY initially was unavailable on PATH; retry from the installed binary timed out without producing the component. Codex completed and reviewed the implementation locally.

Live local preview limitation: the existing remote `/api/settings/public` response rejects browser reads from `http://127.0.0.1:3000` through CORS. The UI uses existing fallback settings in that case. No backend CORS policy was modified and no real verification message was sent; OTP browser checks used intercepted synthetic responses. The login door and local 3D map preview controls were verified independently of that network restriction.
