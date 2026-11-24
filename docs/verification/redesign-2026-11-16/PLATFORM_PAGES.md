# Platform page-by-page review

Current sequence: `/details` → `/login` → remaining pages. User excluded `/` and `/home` from the current redesign. All current user edits outside reviewed scope must be preserved.

| Route | State | Evidence / next work |
|---|---|---|
| `/about` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/admin/customer-service` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/dashboard` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/info-content` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/legal` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/map-control` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/marketing` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/offers` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/operations` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/opinions` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/orders` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/packages` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/properties-management` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/purchase-requests` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/service-providers` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/service-requests` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/services` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/settings` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/subscriptions` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/transactions` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/trends` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/users/[id]` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/users` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/visit-requests` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/admin/wallet` | Excluded by user | Administration routes /admin and /admin/* excluded November 18. |
| `/buildingmanagement` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/chat/[roomId]` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/chat` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/checkout` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/complete-profile` | Implemented and independently reviewed | Four helper tests, eight AR/EN theme/viewport flows plus twelve edge cases passed in development and production modes. Existing backend role boundary integrated; failed stages preserve input; guests and incomplete sessions return to login. Production build passed. |
| `/customerservice/contact` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/customerservice/faq` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/customerservice` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/customerservice/support` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/department-hub` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/details` | Implemented and independently reviewed | Four viewport/theme functional combinations, admin settings checks, 3D visual review, scoped modal keyboard check. Final combined build to follow login. |
| `/disputes` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/financial` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/home` | Excluded | Restored to the original user snapshot and verified unchanged. |
| `/info` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal/[dept]` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal/[dept]/requests` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal/chat/[roomId]` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal/chat` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/internal/renew-subscription` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/login` | Implemented and independently reviewed | Cinematic architectural composition; eight AR/EN viewport/theme mocked OTP flows passed. Public exit routing tested. |
| `/marketing` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/nafath-login` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/offers/[id]` | Implemented; local review in progress | Eight mobile/desktop AR/EN theme cases passed gallery/fullscreen, share/report dialogs, purchase failure/retry, owner delete cancellation and edit destination. Main added explicit deletion confirmation, proxy response checking, chat cleanup/error retry, scoped dialog contrast and missing English copy. Combined production build and eight production-browser fixture cases passed. |
| `/offers/new` | Implemented and independently reviewed | Eight 320/1440 AR/EN theme cases passed required validation and numeric create payload without media/ownership fields. |
| `/offers` | Implemented and independently reviewed | Eight fixture cases passed filters, empty/error recovery, ownership actions and destinations; guest check passed. Combined production build and eight production-browser fixture cases passed. |
| `/orders/[id]` | Implemented and independently reviewed | Eight 320/1440 AR/EN theme cases passed actual data/status, zero-value rendering, client contact visibility, land conditional fields, back link, fetch and chat failure/retry, no clipped descendants or page exceptions. Main fixed actual mobile clipping and removed unsupported descriptive copy. Combined production build and eight production-browser fixture cases passed. |
| `/orders` | Implemented and independently reviewed | Eight 320/1440 AR/EN theme cases passed required/conditional fields, numeric payload, failed-save preservation, details route and delete cancel/confirm; compact mobile rail and no overflow verified. |
| `/` | Excluded | Restored to the original user snapshot and verified unchanged. |
| `/profile` | Implemented and independently reviewed | Local production: eight core, four upload and fourteen edge cases pass. Dirty drafts, multipart failures/retries, safe license applications, office roles and masked identity state verified. |
| `/scan-map` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/service-providers` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/services/form` | Implemented and independently reviewed | Eight 320/1440 theme/language checks passed validation, editable real fields, expected synthetic POST payload, failure/retry, wallet navigation and direct-route availability. Final removed-category recheck pending. |
| `/services/legal` | Implemented and independently reviewed | Eight 320/1440 theme/language checks passed category routes, soon/disabled settings, parent section guard and explicit admin preview. Dedicated generated legal artwork. |
| `/services/legal-requests` | Implemented and independently reviewed | Eight core plus twelve extra local production cases pass. Own legal requests, decimal/zero invoices, confirmed legacy decisions, ownership/paid locks, pagination, failure recovery, stale loads and unmount checked. Embedded admin unchanged. |
| `/services/my-requests` | Implemented and independently reviewed | Eight core and fourteen extra local production cases pass: status/category/search, cancellation, numeric target-department quotes, invoice locks, permissions and chat recovery. |
| `/services` | Implemented and independently reviewed | Distinct animated atelier artwork; eight viewport/theme/language tests passed category links, custom/hidden/soon states, section closure and overflow. Main replaced card stack with open rows. |
| `/services/provider-requests` | Implemented and independently reviewed | Eight core plus ten extra local production cases pass. Pagination, legacy data errors, locked/unlocked contacts, invoice links, guests, stale language responses and shrinking pages verified. |
| `/share-opinion` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/subscriptions/new` | Pending | UI, controls and links not yet reviewed in the corrected execution. |
| `/verify-otp` | Implemented and independently reviewed | Distinct generated staircase artwork. Four 320/390/1440 theme/language checks pass expiry, resend failure/recovery, native paste, wrong-code recovery and successful return. Final motion/cancellation checks in progress. |
| `/wallet` | Pending | UI, controls and links not yet reviewed in the corrected execution. |

| `/offers/[id]/edit` | Added and independently reviewed | Repaired a missing linked route. Eight browser cases passed prefill, changed-only PATCH including cleared notes, failed-save preservation and return to the property detail route. No media/ownership fields sent. |
