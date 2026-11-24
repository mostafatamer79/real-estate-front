# Chat 04 result — customer-support

Status: NOT_READY

*(Marked NOT_READY per instructions: unit/state and contract tests passed 13/13, scoped ESLint passed with 0 errors/0 warnings; local dev server was not active so live browser rendered screenshots remain PENDING).*

---

## Routes and files

### Assigned routes
- `/customerservice` (Main Customer Experience & Care Hub)
- `/customerservice/contact` (Direct Contact & Message Dispatch Focus)
- `/customerservice/support` (Support Cases & Ticket Management Focus)

### Exact owned modified files
- `components/customer-service/CustomerServicePage.tsx`
- `app/customerservice/page.tsx`
- `app/customerservice/contact/page.tsx`
- `app/customerservice/support/page.tsx`
- `tests/redesign-support-state.test.cjs`

### Exact owned created files
- `components/customer-service/customer-service.module.css`
- `lib/redesign-chat04-support.ts`
- `tests/parallel-chat04-support.test.cjs`
- `public/artworks/chat04-concierge.svg`
- `docs/antigravity-parallel-2026-11-18/reports/chat-04.md`

### Ownership and boundary check
- Handover gate: `agy-recover-support` completed with exit code 0 (`/tmp/realestate-redesign-20261118/agy-recover-support/result.json`), process terminated, prior work absorbed and before-state diff recorded at `/tmp/chat04-before.diff`.
- `app/customerservice/faq/page.tsx` belongs to Chat 11 and was strictly NOT modified.
- `app/admin/customer-service` and all `/admin/*` routes were strictly NOT modified.
- No shared API client, global CSS, shared header/footer, or package dependencies were touched.

---

## Changes and real behavior

### 1. Route Awareness & Dedicated Page Contexts
- Created a shared sub-navigation bar (`subNavBar`) on all three routes with accessible ARIA tablist semantics (`role="tablist"`, `role="tab"`, `aria-selected`):
  - **Care Hub (`/customerservice`)**: Architectural hero with concierge artwork, gateway cards (Support, FAQ, Catalog), official communication channels, and direct inquiry form.
  - **Direct Contact (`/customerservice/contact`)**: Contact-first layout with channel cards (Phone, Email, X), dispatch form with explicit `sourcePath: "/customerservice/contact"`, and guidance pointing authenticated users to ticket tracking.
  - **Support Tickets (`/customerservice/support`)**: Dedicated case management console. If unauthenticated, presents an authenticated login gateway redirecting back to `/customerservice/support`. If authenticated, provides search/filter pills, ticket history cards, retry on network failure, and an in-page collapsible "New Ticket" drawer with `sourcePath: "/customerservice/support"`.
- Connected secondary navigation to `/customerservice/faq` (Chat 11) and `/services` (Service Catalog).

### 2. Marcelo Architectural Aesthetics & WCAG AA Tokens
- Created `components/customer-service/customer-service.module.css` using Marcelo architectural design principles:
  - Pearl background (`#f8f7f4` light, `#07101c` dark), Royal Navy ink (`#0b192c` light, `#f0f4f8` dark), and Warm Brass accents (`#946528` light, `#e6bb78` dark).
  - Scoped portal token container `.dialogPortalContent` defined for both light and `:global(.dark)` to ensure the Radix/shadcn body portal inherits tokens without falling back to undefined CSS variables.
  - High-contrast gold button rule: Dark mode `.btnBrass` uses dark navy ink (`#0b192c`) over `#e6bb78` gold, ensuring > 8:1 contrast (surpassing WCAG AA 4.5:1).
  - Pure CSS Module selectors only: No bare unscoped `*` or universal selectors.
  - Reduced-motion queries (`@media (prefers-reduced-motion: reduce)`) scoped strictly to local classes (`.pageContainer *`, `.dialogPortalContent *`).
  - Added original SVG artwork `public/artworks/chat04-concierge.svg` representing an architectural grand arch and concierge beacon.

### 3. Mutex, Synchronous Pending Guards & Draft Preservation
- Form submission (`executeFeedbackSubmit`):
  - Synchronous `isSubmitting` mutex rejects concurrent clicks early (`blocked_by_mutex`).
  - Inputs and submit button are disabled while submission is pending.
  - Enforced validation rules (name, question, contact method matching, and max 200 characters).
  - Successful submission resets inputs and refreshes tickets.
- Reply submission (`executeTicketReply`):
  - Synchronous `replyingTicketId` mutex blocks re-entrant submissions.
  - If `replyAsUser()` throws or encounters an API error, the error is caught, the user is notified, and `ticketReplyDrafts[ticketId]` is **preserved** without deletion.
  - Draft is cleared only upon verified API success.
  - Triggers exactly **one** refresh after reply success to avoid redundant queries.

### 4. Resilient Ticket State & Error Recovery
- `executeTicketRefresh`:
  - Request sequence counter (`ticketRequestIdRef`) and mount check (`isMountedRef`) discard stale responses from out-of-order async resolutions.
  - When backend returns an error, `ticketsError` state is set with an explicit notice and interactive "إعادة المحاولة" / "Retry" button.
  - Network failures never masquerade as "لا توجد رسائل بعد" / "No messages yet".
  - Existing cached tickets are retained during background refresh errors so the user doesn't lose sight of their records.
  - Safe payload guards handle non-array or malformed API responses without throwing.

### 5. Dialog & Form Accessibility
- Every form input has an explicit ID matched with a `<Label htmlFor="...">` attribute:
  - `cs-name`
  - `cs-email`
  - `cs-phone`
  - `cs-question`
  - `cs-reply-[id]`
- Accessible scrollable dialog: `max-h-[85dvh]` with scrollable message trail (`overflow-y-auto`) and fixed header and reply footer, fully usable on compact mobile viewports (e.g. 320px width, 480px height).
- Screen-reader accessible status badges with AR/EN labels (`aria-label="حالة التذكرة: ..." / "Ticket status: ..."`).
- Settings integration: Respects `settings.csBg`, `settings.csCardBg`, `settings.csTextColor`, `settings.csFontSize`, `settings.csFontFamily`, `settings.contactPhone`, `settings.contactEmail`, `settings.contactTwitter`, and `settings.uiFlags` (`show_cs_channels`, `show_cs_form`, `show_cs_faq`).

---

## Verification

### Automated Scoped Tests

1. **Scoped ESLint Check**
   ```bash
   npx eslint components/customer-service/CustomerServicePage.tsx app/customerservice/page.tsx app/customerservice/contact/page.tsx app/customerservice/support/page.tsx lib/redesign-chat04-support.ts tests/redesign-support-state.test.cjs tests/parallel-chat04-support.test.cjs
   ```
   **Result:** Passed with 0 errors and 0 warnings.

2. **State & Regression Test Suite**
   ```bash
   node --test tests/redesign-support-state.test.cjs
   ```
   **Result:**
   - ✔ 1. submit pending mutex and validation prevents duplicate or invalid feedback (214.30ms)
   - ✔ 2. explicit history error and retry handling rather than silent empty list (98.97ms)
   - ✔ 3. caught reply errors and draft preservation (58.02ms)
   - ✔ 4. exactly one history refresh after reply success (62.09ms)
   - ✔ 5. safe stale response and unmount behavior (47.14ms)
   - ✔ 6. input IDs, matching labels, and actual route source path resolution (52.05ms)
   - Total: 6 passed, 0 failed.

3. **Parallel Unit & Contract Test Suite**
   ```bash
   node --test tests/parallel-chat04-support.test.cjs
   ```
   **Result:**
   - ✔ 1. Route context and sourcePath resolution across all 3 customer service routes (318.74ms)
   - ✔ 2. Social handle and X profile URL normalization (20.78ms)
   - ✔ 3. Ticket status details with WCAG AA labels in Arabic and English (20.67ms)
   - ✔ 4. Safe ticket filtering and search across ID, question, and replies (13.13ms)
   - ✔ 5. Form validation helper with boundary tests (16.39ms)
   - ✔ 6. CSS Module purity, design tokens, and dialog portal scoping (0.44ms)
   - ✔ 7. Accessibility and route wrappers verification (0.90ms)
   - Total: 7 passed, 0 failed.

### Combined Focused Test Output
```text
✔ 1. Route context and sourcePath resolution across all 3 customer service routes
✔ 2. Social handle and X profile URL normalization
✔ 3. Ticket status details with WCAG AA labels in Arabic and English
✔ 4. Safe ticket filtering and search across ID, question, and replies
✔ 5. Form validation helper with boundary tests
✔ 6. CSS Module purity, design tokens, and dialog portal scoping
✔ 7. Accessibility and route wrappers verification
✔ 1. submit pending mutex and validation prevents duplicate or invalid feedback
✔ 2. explicit history error and retry handling rather than silent empty list
✔ 3. caught reply errors and draft preservation
✔ 4. exactly one history refresh after reply success
✔ 5. safe stale response and unmount behavior
✔ 6. input IDs, matching labels, and actual route source path resolution
ℹ tests 13
ℹ suites 0
ℹ pass 13
ℹ fail 0
```

### Rendered Browser Checks (Pending)
- Local dev server was not active (`curl http://localhost:3000/customerservice` returned code 000). Per `COMMON.md`, implementers must not launch concurrent dev servers.
- Rendered browser checks are marked **PENDING** for central coordinator / Codex review.
- Exact verification steps for Codex/coordinator once frontend server is running:
  1. Navigate to `http://localhost:3000/customerservice`:
     - Verify SubNavBar renders all 5 links (Hub, Contact, Support, FAQ, Services).
     - Verify Hub tab is highlighted as active.
     - Verify architectural artwork renders on viewport widths $\ge 768\text{px}$ and gracefully hides on mobile ($\le 480\text{px}$).
     - Verify direct channels (Phone, Email, X) have valid target attributes and protocol handlers (`tel:`, `mailto:`, `https://x.com/...`).
     - Submit an inquiry with name, email, and message $\le 200$ chars; check synchronous pending spinner on button.
  2. Navigate to `http://localhost:3000/customerservice/contact`:
     - Verify Contact tab is highlighted as active.
     - Verify contact dispatch form renders and submits with `pagePath: "/customerservice/contact"`.
  3. Navigate to `http://localhost:3000/customerservice/support`:
     - Test unauthenticated view: verify sign-in callout with redirect target `/customerservice/support`.
     - Test authenticated view: verify tickets list, status filter pills ("الكل", "جديد", "تم الرد", "تم الحل"), and search filter.
     - Simulate network failure on `listMine()`: verify explicit error message and interactive "إعادة المحاولة" button appear instead of empty state.
     - Click a ticket card: verify `Dialog` opens with user inquiry, customer service reply, and follow-up reply box.
     - Type a follow-up reply; mock a failed API response: verify error alert is displayed and draft in textarea is **preserved**.
     - Verify theme switching (light/dark): check dark gold button has dark ink text (`#0b192c`), contrast $\ge 4.5:1$.
     - Verify responsive viewports: 320px, 390px, 768px, 1024px, 1440px.

---

## Remaining findings and handover

1. **Excluded Pages & Cross-Route Dependencies**:
   - `app/customerservice/faq/page.tsx` belongs to Chat 11 and was preserved without modification; the SubNavBar correctly links to it.
   - `/admin/customer-service` remains distinct and untouched.
2. **Backend Mutation Protection**:
   - Tests exercise production handlers with synthetic mocks; no mutations or real feedback were sent.
3. **Uncommitted Status**:
   - All files remain uncommitted and unstaged per `COMMON.md`. Ready for central review by Codex review group 2.
