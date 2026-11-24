# Eight implementation lanes — November 18

User explicitly requested two implementations per review group, not two total. Review chats remain READ ONLY. Only /admin and /admin/* excluded (business management/internal remain included); / and /home also excluded by earlier scope. No commits/push/deploy.

## Review 1: agy-login (AGY)
Allowed files: components/auth/SignIn.tsx, components/auth/sign-in.module.css.
Completion report: /tmp/realestate-redesign-20261118/agy-login/result.json.

## Review 1: opencode-otp (OpenCode)
Allowed files: app/verify-otp/page.tsx, tests/otp-navigation-cancellation.test.cjs.
Completion report: /tmp/realestate-redesign-20261118/opencode-otp-repair/result.json.

## Review 2: agy-provider (AGY)
Allowed files: app/service-providers/page.tsx, app/service-providers/provider-registration.module.css.
Completion report: /tmp/realestate-redesign-20261118/agy-provider/result.json.

## Review 2: opencode-support (OpenCode)
Allowed files: components/customer-service/CustomerServicePage.tsx, components/customer-service/customer-service.module.css, app/customerservice/contact/page.tsx, app/customerservice/support/page.tsx.
Completion report: /tmp/realestate-redesign-20261118/opencode-support/result.json.

## Review 3: agy-wallet (AGY)
Allowed files: app/wallet/page.tsx, app/wallet/components/InvoicesSection.tsx, app/wallet/components/WalletSidebar.tsx, app/wallet/wallet-redesign.module.css.
Completion report: /tmp/realestate-redesign-20261118/agy-wallet/result.json.

## Review 3: opencode-subscriptions (OpenCode)
Allowed files: app/subscriptions/new/page.tsx, app/subscriptions/new/subscription-redesign.module.css, lib/redesign-subscription-quote.ts, tests/redesign-subscription-quote.test.cjs.
Completion report: /tmp/realestate-redesign-20261118/opencode-subscriptions/result.json.

## Review 4: agy-chat-lists (AGY)
Allowed files: app/chat/page.tsx, app/internal/chat/page.tsx, components/chat/chat-lists-redesign.module.css.
Completion report: /tmp/realestate-redesign-20261118/agy-chat-lists/result.json.

## Review 4: opencode-departments (OpenCode)
Allowed files: app/department-hub/page.tsx, app/department-hub/department-hub-redesign.module.css, app/internal/[dept]/page.tsx, lib/redesign-department-navigation.ts, tests/redesign-department-navigation.test.cjs.
Completion report: /tmp/realestate-redesign-20261118/opencode-departments/result.json.

Original OTP run timed out with partial implementation and failing custom test harness. Its SAME lane was restarted with compact context in opencode-otp-repair; the earlier timeout result must not be treated as success. AGY login returned implementation, pending independent review/browser proof. Other lanes were launched, not certified complete.

Approval: user explicitly authorized OTP source/context to configured free OpenCode model; separately explicitly authorized support/contact wrappers, subscription/new, department-hub/internal dept and necessary context. No broader provider/model authorization is inferred. Model opencode/glm-5.3-flash-free#max only; no paid fallback.

Baseline for login: /tmp/realestate-redesign-20261118/baseline. Snapshot before the SIX new lanes: /tmp/realestate-redesign-20261118/six-lanes-baseline plus six-lanes-hashes.json. Preserve all unrelated pre-existing dirty files. OTP snapshot may already include partial prior worker changes: review actual current behavior and do not claim that snapshot is its pristine starting version.

Reviewer chats: Review1=01a1ebde-a749-7cb2-9bed-28366d7bf713; Review2=01a1ebde-b564-7ee0-80f0-c6acd80beff0; Review3=01a1ebde-c063-79b1-a1ad-aa40d4c7963a; Review4=01a1ebde-cbe3-72b0-a760-663bf2adedef. Main retrieves their reports. They must not edit, delegate or send messages. Central independent build/typecheck/browser verification waits for owned changes to settle; individual workers run scoped lint/focused tests only.

