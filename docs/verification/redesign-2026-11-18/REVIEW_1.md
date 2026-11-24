# Review 1 — source findings, not approval

Both completion reports now exist and report success. I inspected current source and snapshot diffs independently. **This is source review only:** I did not run tests, builds, or browser fixtures.

- **[P2, high confidence] Remove the new unsupported accreditation claim.** [SignIn.tsx:304](/home/mostafa/Work/mostakl/realestate/real-estate-front/components/auth/SignIn.tsx:304) introduces “منظومة معتمدة” (“accredited system”), absent from the baseline and English copy. Replace it with factual product language unless accreditation evidence exists. **Acceptance:** neither language implies unsupported certification.

- **[P2, high confidence] Login restores the card composition the stronger direction was intended to replace.** [sign-in.module.css:247](/home/mostafa/Work/mostakl/realestate/real-estate-front/components/auth/sign-in.module.css:247) adds a background, border, 28px radius, and shadow to the form; line 123 similarly frames the artwork. The baseline explicitly removed the floating form card. The resulting source still describes two separated rounded panels, with a single shared entrance animation, rather than the proposed image-boundary typography and staged cinematic composition. **Acceptance:** main should review rendered desktop/mobile captures against the requested dramatic direction before accepting the visual result.

- **[P2, medium confidence] Customer-service cancellation also runs when the current page will remain open.** [page.tsx:260](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/verify-otp/page.tsx:260) aborts on every Link click, including Ctrl/Cmd-click to open support in another tab. That silently cancels verification in the original tab. Restrict cancellation to navigation that actually leaves the current page, preferably using the installed Next Link navigation hook. **Acceptance:** ordinary support navigation cancels late credential writes; opening support in another tab leaves the original verification request running.

The OTP implementation otherwise addresses the reviewed source-level risks: Back aborts synchronously, duplicate requests are guarded, delayed responses check cancellation before credential writes, and connection/malformed-response errors have distinct bilingual messages. Safe-return and provider-return precedence remain intact. The repair also corrects the test harness’s module stubs and mount ordering; its reported **17/17 pass** remains worker evidence, not independently executed verification.

The login diff preserves auth handlers and settings behavior, adds a language toggle, and replaces duplicate artwork instances with one responsive instance.

**Scope:** inspected changes are within the four allowed files. The OTP snapshot already contained the earlier partial implementation, so its small repair diff is not the full OTP lane change. The AGY report’s `touchedFiles` includes the existing dirty repository inventory; it cannot establish worker attribution or prove repository-wide scope compliance.

**Outstanding acceptance:** main’s independent checks and rendered fixtures for AR/EN, both themes, narrow/tablet/desktop layouts, keyboard/reduced motion, settings states, OTP verification/resend cancellation races, and return routing. The earlier raw-versus-trimmed login identifier inconsistency remains unchanged. Missing refresh-token validation also remains pre-existing at [page.tsx:338](/home/mostafa/Work/mostakl/realestate/real-estate-front/app/verify-otp/page.tsx:338).

