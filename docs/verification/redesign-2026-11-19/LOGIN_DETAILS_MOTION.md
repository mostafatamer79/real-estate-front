# Login and details motion refinement

Scope: login and details only. Existing dirty work preserved; no admin/home changes, dependency installation, commits or deployment.

Login: corrected the mobile showcase shrinking to 2px in the centered flex column; replaced the stale missing-class assertion with a responsive-width regression check. Staged brand, heading, tabs and form entrance; architectural line reveal; focus and pointer feedback; confirmed OTP exit capped at 220ms. Reduced motion skips the exit delay. Request cancellation and unmount are rechecked before pending-verification storage and navigation. Ordinary support-link navigation cancels pending registration; modified clicks preserve normal browser behavior.

Details: sequenced hero entrance; viewport-triggered section reveals; fine-pointer depth on the hero stage; reading progress; interruptible accordion expansion and collapse. Collapsed panels are inert and hidden from assistive technologies. System reduced-motion preference removes spatial movement. Effects clean up observers, listeners, frame requests and animations. Content is readable without animation initialization.

Independent checks: scoped ESLint, TypeScript, both CSS Modules purity checks and six focused Node tests passed. Browser fixtures passed login confirmation/cancellation and details accordion/inert checks at desktop 1440, mobile 390 and narrow 320, covering Arabic/English, light/dark, normal/reduced motion. Synthetic API interception only; no real OTP or backend writes. Existing broad details browser script reached a quick-action destination redirect mismatch and did not complete; focused changed-interaction checks passed independently. Physical-device testing and real provider delivery are not established by these checks.

Evidence: /tmp/realestate-motion-19 (source baselines, delegate report, independent logs, screenshots and JSON results). Local preview: http://localhost:3000/login and http://localhost:3000/details. No production build was run for this motion-only iteration.
