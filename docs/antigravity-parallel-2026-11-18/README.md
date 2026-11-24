# Antigravity parallel implementation pack

**12 total implementation chats; maximum6 concurrent.** Existing three recovery workers reserve their slots until released. Chats04/05/06 are handovers, not three extra simultaneous replacements.

Read [START_HERE.md](START_HERE.md), then send one CHAT_XX.md per fresh Antigravity chat. [COMMON.md](COMMON.md) applies to every chat. [COVERAGE.md](COVERAGE.md) maps all remaining routes; [OWNERSHIP.json](OWNERSHIP.json) records exact file boundaries.

- [Chat01: login-otp-nafath](CHAT_01_login-otp-nafath.md) — `/login`, `/verify-otp`, `/nafath-login`
- [Chat02: provider-registration](CHAT_02_provider-registration.md) — `/service-providers`
- [Chat03: wallet-checkout](CHAT_03_wallet-checkout.md) — `/wallet`, `/checkout`
- [Chat04: customer-support](CHAT_04_customer-support.md) — `/customerservice`, `/customerservice/contact`, `/customerservice/support`
- [Chat05: subscriptions-renewal](CHAT_05_subscriptions-renewal.md) — `/subscriptions/new`, `/internal/renew-subscription`
- [Chat06: department-routing](CHAT_06_department-routing.md) — `/department-hub`, `/internal/[dept]`
- [Chat07: messaging](CHAT_07_messaging.md) — `/chat`, `/chat/[roomId]`, `/internal/chat`, `/internal/chat/[roomId]`
- [Chat08: business-management](CHAT_08_business-management.md) — `/buildingmanagement`, `/internal`
- [Chat09: financial-marketing](CHAT_09_financial-marketing.md) — `/financial`, `/marketing`
- [Chat10: department-requests-disputes](CHAT_10_department-requests-disputes.md) — `/internal/[dept]/requests`, `/disputes`
- [Chat11: public-content-faq](CHAT_11_public-content-faq.md) — `/about`, `/info`, `/share-opinion`, `/customerservice/faq`
- [Chat12: scan-map](CHAT_12_scan-map.md) — `/scan-map`

No admin/root/home redesign. No commit/push/deploy. Four existing Codex chats remain review-only. All outputs need independent review and browser/build verification before approval.
