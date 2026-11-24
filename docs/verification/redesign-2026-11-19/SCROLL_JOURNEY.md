> Superseded by PINNED_SCENE.md: the floating companion described below has been removed. These results describe the previous iteration.

# Login / details: live architecture and continuous scrolling

User scope: stronger login/details experience; Arabic must have its own composition; the visual should continue with scrolling. No homepage/admin changes, backend edits, deployments or commits.

## Result

Login uses a procedural Three.js limestone/brass portal with pointer drag, accessible rotation slider, pause/resume and reset. The form remains available while the scene loads. Existing OTP handoff, return navigation, validation and cancellation remain. Original artwork is retained only as the WebGL fallback.

Details uses a separately authored live skyline. The SAME canvas travels from the opening composition into a reserved companion slot alongside the workspace. Its camera turns with the current operational chapter; section navigation reflects the actual visible configured sections. On mobile it becomes a compact sticky strip. The companion leaves with the workspace before the footer. Direct workspace access, real map/data, section visibility/order, saved palette and all original operational controls remain.

Arabic uses locally hosted IBM Plex Sans Arabic, mirrored composition, Arabic line height/spacing and a complete headline rather than letter-by-letter writing. Mobile text/navigation and the scene occupy separate regions. Font source: https://github.com/google/fonts/tree/main/ofl/ibmplexsansarabic ; OFL license retained beside the font files under public/fonts/ibm-plex-arabic.

Motion: reduced-motion preference uses a static 3D composition and an immediate dock-position change. Resize/intersection observers, event listeners, RAF, geometries, materials and renderer are cleaned up; rendering sleeps when settled, offscreen or hidden. Pause stops scene geometry while normal page scrolling remains usable.

## Review and evidence

AGY's first portal implementation was independently rejected: generic geometry, missing controls/cleanup, and a type error. Codex replaced it and reviewed the final combined source. No delegate self-report is treated as acceptance.

Independent ESLint and TypeScript checks passed; 73 Node test files passed. Four scoped CSS Modules passed purity parsing. Ten synthetic browser cases cover login/details, 1440/390/320, Arabic/English, light/dark and reduced motion. Login checks compare rendered pixels after manual orbit and verify synthetic OTP handoff. Details checks verify one canvas, docking within viewport, workspace jump, accordion/inert state, overflow and runtime errors. Two additional cases passed with WebGL explicitly disabled. Final Arabic scroll and pause evidence is recorded separately.

Evidence directory: /tmp/realestate-wow-v3 (source baselines, AGY report, independent logs, screenshots, JSON results and browser recordings). This proves local synthetic interactions, not real OTP delivery, production data, physical-device performance or every platform route. No fresh production build was run for this iteration. A previous broader details workflow script had a destination-guard fixture mismatch; it is not included among passing checks.

Preview: http://localhost:3000/login and http://localhost:3000/details .
