# Apple Pay checkout diagnosis — 23 October 2026

The production gateway's SDK configuration endpoint reported
`applePay.isApplePayWebEnabled=true` and response code `000`. Apple Pay for Web
is enabled; earlier statements that activation was unconfirmed are superseded
by this check. No merchant configuration was changed.

The canonical domain association URL returned HTTP 200 and its SHA-256 matched
the supplied file:
`576b62156cdb73e789ec0a2cba1c9b03aae0623ab39d3c0d505b193848f15f21`.

The reported 1 SAR wallet invoice remained unpaid, with no ledger entry. A
read-only Geidea lookup by that exact merchant reference returned response code
000 and an empty orders array. This does not establish the absence of a bank
hold or a payment under a different provider reference. A recent rejected
callback cannot be attributed to this invoice from the available logs.

The local SDK wrapper discarded error codes and support references. It also
ignored order IDs returned through SDK error/cancel events, potentially losing
a recoverable pending payment. It now retains only validated response codes and
GUID support references, displays them in the checkout error, and independently
verifies any order returned by the SDK before determining the outcome. Raw
provider payloads, card data and provider error text are not retained or shown.

Twelve checkout tests, targeted ESLint and TypeScript checks passed. The wider
frontend suite still fails `mobile-header-footer-polish.test.cjs`; that failure
predates this fix. Browser reproduction was unavailable because local browser
use is disabled in Work settings. No new payment was submitted.

The Apple Pay transaction failure remains unresolved until a failed attempt's
provider code/reference is captured and traced. Do not claim this diagnostics
fix proves Apple Pay payment success.
