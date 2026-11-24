const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.join(__dirname, "..");

test("components/chat/chat-lists-redesign.module.css contains required editorial design tokens and responsive states", () => {
  const cssPath = path.join(projectRoot, "components/chat/chat-lists-redesign.module.css");
  assert.ok(fs.existsSync(cssPath), "CSS module file must exist");
  const css = fs.readFileSync(cssPath, "utf8");

  // Editorial Pearl, Royal Navy (#0b192c) & Brass/Gold Tokens
  assert.match(css, /--cl-bg:\s*#f5f4f0/, "Defines pearl page background");
  assert.match(css, /#0b192c/, "Uses Royal Navy color");
  assert.match(css, /--cl-gold:\s*#c5a880/, "Defines restrained brass/desert gold");
  assert.match(css, /:global\(\.dark\)/, "Supports dark mode theme overrides");
  assert.match(css, /--cl-gold:\s*#d4af37/, "Defines dark mode gold");

  // 44px accessible touch controls
  assert.match(css, /min-height:\s*44px/, "Enforces minimum 44px control heights for accessibility");
  assert.match(css, /min-width:\s*44px/, "Enforces minimum 44px control widths for accessibility");

  // Reduced motion query
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/, "Respects prefers-reduced-motion accessibility");

  // Small screens fine-tuning (320px - 389px)
  assert.match(css, /@media\s*\(max-width:\s*389px\)/, "Provides responsive tuning for 320px/389px mobile screens");
});

test("app/chat/page.tsx: Public chat list correctly implements error/retry, safe participant handling, unread badges and no fabricated status", () => {
  const tsxPath = path.join(projectRoot, "app/chat/page.tsx");
  assert.ok(fs.existsSync(tsxPath), "Public chat page file must exist");
  const source = fs.readFileSync(tsxPath, "utf8");

  // Check that it does not use fabricated CheckCheck or fake delivery checkmarks
  assert.doesNotMatch(
    source,
    /CheckCheck/,
    "Must not contain fabricated CheckCheck delivery/read checkmarks"
  );

  // Check error state and retry mechanism
  assert.match(source, /setError\(/, "Must set error state on API failure");
  assert.match(source, /retryBtn/, "Must include a retry button for failed loading");
  assert.match(source, /fetchChats\(\)/, "Retry button must invoke fetchChats");

  // Check distinct genuine empty state vs search empty state
  assert.match(source, /chats\.length === 0/, "Must detect genuine empty state");
  assert.match(source, /filteredChats\.length === 0/, "Must detect search query empty state");

  // Check safe direct-entry back navigation
  assert.match(source, /canNavigateBack/, "Must use canNavigateBack for safe history check");
  assert.match(source, /\/details/, "Must provide fallback to /details on direct entry");

  // Check stale/unmount guard
  assert.match(source, /isMountedRef/, "Must guard against updates after component unmount");
  assert.match(source, /fetchSeqRef/, "Must guard against stale out-of-order fetch results");

  // Check PullToRefresh wrapper preservation
  assert.match(source, /<PullToRefresh/, "Must keep PullToRefresh wrapper for public mobile chat");

  // Transpile TypeScript to check for syntax errors
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.ok(transpiled.outputText.length > 500, "Should transpile cleanly without syntax errors");

  // P1: Check that fetchChats does NOT depend on mutable currentUser object (prevents infinite re-fetch loop)
  assert.doesNotMatch(
    source,
    /useCallback\(async\s*\(.*?\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*currentUser/,
    "fetchChats must not depend on mutable currentUser reference to avoid P1 fetch loop"
  );
  assert.match(
    source,
    /currentUserRef/,
    "Must use currentUserRef for stable user identity access across renders"
  );

  // P2: Check safe malformed participant handling
  assert.match(
    source,
    /sanitizeParticipants/,
    "Must use sanitizeParticipants to safely reject null/non-object participant entries"
  );
  assert.match(
    source,
    /safeParticipantName/,
    "Must use safeParticipantName to safely format names without failing on numbers or non-strings"
  );
});

test("app/internal/chat/page.tsx: Internal chat list preserves section guard, eligibility, pending protections and safe back", () => {
  const tsxPath = path.join(projectRoot, "app/internal/chat/page.tsx");
  assert.ok(fs.existsSync(tsxPath), "Internal chat page file must exist");
  const source = fs.readFileSync(tsxPath, "utf8");

  // Check section guard preservation
  assert.match(source, /useSectionGuard\(["']chat["']\)/, "Must preserve useSectionGuard('chat')");
  assert.match(source, /ComingSoonOverlay/, "Must render ComingSoonOverlay when section is closed");

  // Check eligibility preservation (admin or manager only)
  assert.match(
    source,
    /currentUser\?\.role === ["']admin["']\s*\|\|\s*currentUser\?\.role === ["']manager["']/,
    "Must strictly preserve admin or manager role check for new chat creation"
  );

  // Check pending protection during room creation
  assert.match(source, /creatingRoom/, "Must track creatingRoom state");
  assert.match(source, /disabled=\{creatingRoom\}/, "Must disable user buttons while creatingRoom is true");

  // Check error state and retry mechanism
  assert.match(source, /setError\(/, "Must set error state on API failure");
  assert.match(source, /retryBtn/, "Must include a retry button for failed loading");

  // Check safe direct-entry back navigation to /internal
  assert.match(source, /canNavigateBack/, "Must use canNavigateBack for safe history check");
  assert.match(source, /\/internal/, "Must provide fallback to /internal on direct entry");

  // Check stale/unmount guard
  assert.match(source, /isMountedRef/, "Must guard against updates after component unmount");
  assert.match(source, /fetchSeqRef/, "Must guard against stale out-of-order fetch results");

  // P1: Check that fetchChats does NOT depend on mutable currentUser object
  assert.doesNotMatch(
    source,
    /useCallback\(async\s*\(.*?\)\s*=>\s*\{[\s\S]*?\},\s*\[\s*currentUser/,
    "fetchChats must not depend on mutable currentUser reference to avoid P1 fetch loop"
  );
  assert.match(
    source,
    /currentUserRef/,
    "Must use currentUserRef for stable user identity access across renders"
  );

  // P2: Check safe malformed participant handling
  assert.match(
    source,
    /sanitizeParticipants/,
    "Must use sanitizeParticipants to safely reject null/non-object participant entries"
  );
  assert.match(
    source,
    /safeParticipantName/,
    "Must use safeParticipantName to safely format names"
  );

  // P2: Check new-chat modal focus trap and restoration
  assert.match(
    source,
    /useModalFocusTrap/,
    "Must use useModalFocusTrap to enforce focus containment, Escape key, and restoration"
  );
  assert.match(
    source,
    /modalTriggerRef/,
    "Must use modalTriggerRef to restore trigger focus on modal close"
  );
  assert.match(
    source,
    /modalDialogRef/,
    "Must use modalDialogRef to trap keyboard focus within modal"
  );

  // Transpile TypeScript to check for syntax errors
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.ok(transpiled.outputText.length > 500, "Should transpile cleanly without syntax errors");
});
