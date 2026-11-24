# Chat 07 result — messaging

Status: NOT_READY

> Note: All unit, static, contract, and scoped lint tests have passed with 0 errors. Status is marked `NOT_READY` strictly according to COMMON.md and prompt directives because a live frontend server/browser was not running on localhost:3000 to execute interactive browser visual fixtures.

## Routes and files

### Assigned Routes
- `/chat`
- `/chat/[roomId]`
- `/internal/chat`
- `/internal/chat/[roomId]`

### Modified Files (Exclusive exact-file ownership)
- `app/chat/page.tsx`
- `app/chat/[roomId]/page.tsx`
- `app/internal/chat/page.tsx`
- `app/internal/chat/[roomId]/page.tsx`
- `components/chat/chat-lists-redesign.module.css`
- `tests/redesign-chat-lists.test.cjs`

### Created Files (Assigned new-file prefix)
- `lib/redesign-chat07-chat-utils.ts`
- `tests/parallel-chat07-rooms.test.cjs`
- `docs/antigravity-parallel-2026-11-18/reports/chat-07.md`

### Ownership Conflict Check
- No ownership conflicts. All edits are strictly confined to assigned paths and assigned prefixes (`lib/redesign-chat07-`, `tests/parallel-chat07-`, `reports/chat-07.md`).
- A pre-edit diff record was saved to scratch: `/home/mostafa/.gemini/antigravity/brain/be33effb-f278-4bac-aa56-a43b92e967bf/scratch/before-state.diff`.
- Unrelated workspace changes remain untouched. Work remains uncommitted.

---

## Changes and real behavior

### 1. P1 Repeated-Fetch Loop Resolved (`/chat` and `/internal/chat`)
- **Problem**: Review 4 identified that `fetchChats` depended on `currentUser`, while the mount effect re-parsed `localStorage` into a new user object and invoked `setCurrentUser` on every render, recreating the callback and triggering infinite re-fetching.
- **Correction**:
  - Introduced `currentUserRef` holding the loaded user identity stably across renders.
  - Decoupled `fetchChats` dependency from mutable `currentUser` object identity (now memoized stably on `[isRtl]`).
  - Stored user hydration executes once on mount and passes parsed credentials directly to `fetchChats(u)` without triggering re-render loop cascades.
  - Enforced bounded request execution under React StrictMode double-mounting with `fetchSeqRef` and `isMountedRef`.

### 2. P2 Malformed Participant Crash Resolved (`/chat` and `/internal/chat`)
- **Problem**: Review 4 noted that `room.participants` entries were dereferenced without validation. A null or primitive entry (`[null]`) caused uncaught TypeError, and non-string fields (`firstName: 123` or numeric phones) failed on `.trim()`.
- **Correction**:
  - Implemented `sanitizeParticipant(raw)` and `sanitizeParticipants(rawList)` in `lib/redesign-chat07-chat-utils.ts`: safely discards null, undefined, primitive, or malformed entries.
  - Implemented `safeParticipantName(participant, fallbackName, defaultFallback)`: safely coerces string/numeric first and last names, email, or phone without throwing `.trim()` on non-strings.
  - Implemented safe search normalization `normalizeSearchText` stripping Arabic diacritics and normalizing characters (أإآ -> ا, ة -> ه).

### 3. P2 New-Chat Modal Focus Management (`/internal/chat`)
- **Problem**: The new-chat modal had `role="dialog"` and `aria-modal="true"`, but lacked initial focus, keyboard focus containment (Tab trapping), Escape key dismissal, and trigger restoration.
- **Correction**:
  - Implemented `useModalFocusTrap` hook in `lib/redesign-chat07-chat-utils.ts`.
  - Attached `modalTriggerRef` to the "New Chat" header trigger button.
  - Attached `modalDialogRef` with `tabIndex={-1}` to the dialog container.
  - Automatically focuses the search input on open; traps Tab / Shift+Tab cycling within focusable modal children; dismisses on Escape key (disabled while `creatingRoom` is in progress); and restores focus to `modalTriggerRef.current` upon modal close.

### 4. Room Delivery Handling & Draft Preservation (`/chat/[roomId]` and `/internal/chat/[roomId]`)
- **Backend Gateway Inspection (READ ONLY)**:
  - Inspected `real-estate-back/src/chat/chat.gateway.ts`. The gateway `@SubscribeMessage('sendMessage')` does **not** accept an acknowledgement callback (`ack`).
  - Instead, the server broadcasts `receiveMessage` to the room on successful database write, or emits `'error'` to the client on exception.
  - As instructed: **no fabricated ack, fake delivery checkmarks, or synthetic server protocol was invented.**
- **Draft Preservation & Disconnect Handling**:
  - Drafts in flight are held in `pendingDraftRef`.
  - If the socket is disconnected or not yet connected, sending is blocked and the user's draft is safely retained in the input with an informative offline notification.
  - If an in-flight send fails due to socket disconnect, server `'error'` event, or delivery timeout (10 seconds), the draft is immediately restored back into the `<textarea>` input (`setMessage(pendingDraftRef.current)`), `isSending` is cleared, and an alert banner with a "Retry" button is presented.
  - When `receiveMessage` matching the sender ID, room ID, and content arrives, delivery is confirmed and the pending draft ref is cleared.
  - Reconnection does not duplicate sends: on reconnect, the socket re-joins the room (`joinRoom`) without auto-re-emitting in-flight messages; restored drafts remain in the input for intentional user action.
- **Removed Fabricated Status**:
  - Removed all fake `CheckCheck` double checkmarks from both room pages. Real timestamps formatted via `formatConversationTime` are displayed with accessible clock indicators.
- **Accessibility & Direction**:
  - Responsive layout (320px to 1440px), min 44x44px touch targets on buttons, accessible back navigation using `canNavigateBack`, and full RTL/LTR language support via `useLanguage()`.

---

## Verification

### 1. Scoped ESLint
```bash
npx eslint app/chat/page.tsx app/chat/[roomId]/page.tsx app/internal/chat/page.tsx app/internal/chat/[roomId]/page.tsx lib/redesign-chat07-chat-utils.ts
```
**Result**: Exit code 0, 0 errors, 0 warnings.

### 2. Focused Unit and Integration Tests
```bash
node --test tests/redesign-chat-lists.test.cjs tests/parallel-chat07-rooms.test.cjs
```
**Result**:
```
✔ lib/redesign-chat07-chat-utils: sanitizeParticipant handles null, primitives, and malformed types safely (87.215138ms)
✔ lib/redesign-chat07-chat-utils: sanitizeParticipants filters invalid items without throwing (22.358774ms)
✔ lib/redesign-chat07-chat-utils: safeParticipantName never crashes on non-strings or null (18.875803ms)
✔ lib/redesign-chat07-chat-utils: getParticipantInitials handles Arabic and English cleanly (16.440428ms)
✔ lib/redesign-chat07-chat-utils: normalizeSearchText strips diacritics and unifies Arabic letters (12.536044ms)
✔ app/chat/[roomId]/page.tsx: Preserves recoverable draft on disconnect/error, avoids duplicate sends and removes fake checkmarks (38.728738ms)
✔ app/internal/chat/[roomId]/page.tsx: Preserves recoverable draft on disconnect/error, avoids duplicate sends and removes fake checkmarks (29.560344ms)
✔ components/chat/chat-lists-redesign.module.css contains required editorial design tokens and responsive states (1.418058ms)
✔ app/chat/page.tsx: Public chat list correctly implements error/retry, safe participant handling, unread badges and no fabricated status (140.408135ms)
✔ app/internal/chat/page.tsx: Internal chat list preserves section guard, eligibility, pending protections and safe back (64.550066ms)
ℹ tests 10
ℹ suites 0
ℹ pass 10
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 591.076525
```

### 3. Rendered Browser Checks (PENDING)
- Host check: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` returned code 000 (server offline).
- In accordance with COMMON.md: implementers do NOT launch background Next dev servers competing over `.next`.
- **Exact Browser Verification Steps for Coordinator / Codex Gate**:
  1. Start Next server: `npm run dev` (or run central build `npm run build -- --webpack`).
  2. Load `/chat` as authenticated client:
     - Verify no repeated API calls in network inspector on mount.
     - Search for participant names with Arabic diacritics and ensure filtering matches.
     - Click retry on simulated network failure.
  3. Load `/internal/chat` as admin/manager:
     - Click "محادثة جديدة" / "New Chat": ensure focus moves to the search input inside modal.
     - Press Tab repeatedly: verify focus is contained within modal controls.
     - Press Escape: verify modal closes and focus returns to the "محادثة جديدة" trigger button.
  4. Load `/chat/[roomId]` and `/internal/chat/[roomId]`:
     - Disconnect network / disable socket: type message and click send; verify draft is retained and offline banner shows with retry option.
     - Confirm message rows display actual timestamps with no fake double checkmarks.

---

## Remaining findings and handover
- **Server Contract Limitation**: As confirmed by read-only inspection of `real-estate-back/src/chat/chat.gateway.ts`, the WebSocket gateway does not provide an RPC acknowledgement callback on `sendMessage`. Delivery is verified client-side via the arrival of the server-broadcasted `receiveMessage` event.
- All changes remain uncommitted and ready for Codex central review group 4.
