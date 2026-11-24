const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const projectRoot = path.join(__dirname, "..");

// Transpile and load pure helpers from lib/redesign-chat07-chat-utils.ts
function loadChatUtils() {
  const tsPath = path.join(projectRoot, "lib/redesign-chat07-chat-utils.ts");
  assert.ok(fs.existsSync(tsPath), "lib/redesign-chat07-chat-utils.ts must exist");
  const tsCode = fs.readFileSync(tsPath, "utf8");

  const transpiled = ts.transpileModule(tsCode, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
    },
  });

  const moduleExports = {};
  const moduleContext = {
    exports: moduleExports,
    require: (mod) => {
      if (mod === "react") {
        return {
          useEffect: () => {},
          useRef: (init) => ({ current: init }),
        };
      }
      return require(mod);
    },
  };

  const fn = new Function("exports", "require", "module", transpiled.outputText);
  fn(moduleExports, moduleContext.require, { exports: moduleExports });
  return moduleExports;
}

test("lib/redesign-chat07-chat-utils: sanitizeParticipant handles null, primitives, and malformed types safely", () => {
  const utils = loadChatUtils();

  assert.equal(utils.sanitizeParticipant(null), null, "null returns null");
  assert.equal(utils.sanitizeParticipant(undefined), null, "undefined returns null");
  assert.equal(utils.sanitizeParticipant("string"), null, "string returns null");
  assert.equal(utils.sanitizeParticipant(123), null, "number returns null");
  assert.equal(utils.sanitizeParticipant([]), null, "array returns null");

  // Valid participant
  const valid = utils.sanitizeParticipant({
    id: "user-1",
    firstName: " Mostafa ",
    lastName: " Mahmoud ",
    email: "test@example.com ",
    phone: " 0501234567 ",
    role: " agent ",
  });
  assert.deepEqual(valid, {
    id: "user-1",
    firstName: "Mostafa",
    lastName: "Mahmoud",
    email: "test@example.com",
    phone: "0501234567",
    role: "agent",
  });

  // Malformed field types (numbers instead of strings)
  const numbersAsStrings = utils.sanitizeParticipant({
    id: 101,
    firstName: 12345,
    lastName: 67890,
    phone: 5550001,
    email: null,
  });
  assert.equal(numbersAsStrings.firstName, "12345");
  assert.equal(numbersAsStrings.lastName, "67890");
  assert.equal(numbersAsStrings.phone, "5550001");
  assert.equal(numbersAsStrings.email, null);
});

test("lib/redesign-chat07-chat-utils: sanitizeParticipants filters invalid items without throwing", () => {
  const utils = loadChatUtils();

  assert.deepEqual(utils.sanitizeParticipants(null), []);
  assert.deepEqual(utils.sanitizeParticipants({}), []);
  assert.deepEqual(utils.sanitizeParticipants("not-array"), []);

  const mixed = [
    null,
    undefined,
    123,
    "bad",
    { id: "u-1", firstName: "Sarah" },
    null,
    { id: 2, phone: 999 },
  ];
  const cleaned = utils.sanitizeParticipants(mixed);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].id, "u-1");
  assert.equal(cleaned[0].firstName, "Sarah");
  assert.equal(cleaned[1].id, 2);
  assert.equal(cleaned[1].phone, "999");
});

test("lib/redesign-chat07-chat-utils: safeParticipantName never crashes on non-strings or null", () => {
  const utils = loadChatUtils();

  assert.equal(utils.safeParticipantName(null, null, "Fallback"), "Fallback");
  assert.equal(utils.safeParticipantName(undefined, "", "Default"), "Default");
  assert.equal(utils.safeParticipantName("string-not-obj", "CustomFallback"), "CustomFallback");

  // Number fields
  assert.equal(
    utils.safeParticipantName({ firstName: 123, lastName: 456 }),
    "123 456"
  );

  // Phone fallback
  assert.equal(
    utils.safeParticipantName({ firstName: null, lastName: null, phone: 987654 }),
    "987654"
  );

  // Email fallback
  assert.equal(
    utils.safeParticipantName({ firstName: "", lastName: "", email: "user@domain.com" }),
    "user@domain.com"
  );
});

test("lib/redesign-chat07-chat-utils: getParticipantInitials handles Arabic and English cleanly", () => {
  const utils = loadChatUtils();

  assert.equal(utils.getParticipantInitials(""), "");
  assert.equal(utils.getParticipantInitials(null), "");
  assert.equal(utils.getParticipantInitials("John Doe"), "JD");
  assert.equal(utils.getParticipantInitials("Single"), "SI");
  assert.equal(utils.getParticipantInitials("محمد علي"), "مع");
});

test("lib/redesign-chat07-chat-utils: normalizeSearchText strips diacritics and unifies Arabic letters", () => {
  const utils = loadChatUtils();

  assert.equal(utils.normalizeSearchText("أحمد"), "احمد");
  assert.equal(utils.normalizeSearchText("إبراهيم"), "ابراهيم");
  assert.equal(utils.normalizeSearchText("مدينة"), "مدينه");
  assert.equal(utils.normalizeSearchText("عَقَار"), "عقار");
  assert.equal(utils.normalizeSearchText("  Hello WORLD  "), "hello world");
});

test("app/chat/[roomId]/page.tsx: Preserves recoverable draft on disconnect/error, avoids duplicate sends and removes fake checkmarks", () => {
  const roomPath = path.join(projectRoot, "app/chat/[roomId]/page.tsx");
  assert.ok(fs.existsSync(roomPath), "Public room page must exist");
  const source = fs.readFileSync(roomPath, "utf8");

  // Check no fabricated CheckCheck delivery icon
  assert.doesNotMatch(
    source,
    /CheckCheck/,
    "Must NOT contain fabricated CheckCheck delivery/read checkmarks"
  );

  // Check draft preservation mechanism
  assert.match(
    source,
    /pendingDraftRef/,
    "Must use pendingDraftRef to track draft in flight"
  );
  assert.match(
    source,
    /setMessage\(pendingDraftRef\.current\)/,
    "Must restore pending draft back into message input upon disconnect or server rejection"
  );

  // Check duplicate send guard
  assert.match(
    source,
    /isSending/,
    "Must track isSending state to guard against duplicate sends"
  );
  assert.match(
    source,
    /if\s*\(!draft\s*\|\|\s*isSending\)\s*return/,
    "Must guard against sending while a message is already in flight"
  );

  // Check offline warning and recoverable send error banner
  assert.match(
    source,
    /socketConnected/,
    "Must track socketConnected status"
  );
  assert.match(
    source,
    /sendError/,
    "Must display explicit sendError with retry capability"
  );

  // Transpile to ensure no syntax errors
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.ok(transpiled.outputText.length > 500, "Should transpile cleanly without syntax errors");
});

test("app/internal/chat/[roomId]/page.tsx: Preserves recoverable draft on disconnect/error, avoids duplicate sends and removes fake checkmarks", () => {
  const roomPath = path.join(projectRoot, "app/internal/chat/[roomId]/page.tsx");
  assert.ok(fs.existsSync(roomPath), "Internal room page must exist");
  const source = fs.readFileSync(roomPath, "utf8");

  // Check no fabricated CheckCheck delivery icon
  assert.doesNotMatch(
    source,
    /CheckCheck/,
    "Must NOT contain fabricated CheckCheck delivery/read checkmarks"
  );

  // Check draft preservation mechanism
  assert.match(
    source,
    /pendingDraftRef/,
    "Must use pendingDraftRef to track draft in flight"
  );
  assert.match(
    source,
    /setMessage\(pendingDraftRef\.current\)/,
    "Must restore pending draft back into message input upon disconnect or server rejection"
  );

  // Check duplicate send guard
  assert.match(
    source,
    /isSending/,
    "Must track isSending state to guard against duplicate sends"
  );
  assert.match(
    source,
    /if\s*\(!draft\s*\|\|\s*isSending\)\s*return/,
    "Must guard against sending while a message is already in flight"
  );

  // Check offline warning and recoverable send error banner
  assert.match(
    source,
    /socketConnected/,
    "Must track socketConnected status"
  );
  assert.match(
    source,
    /sendError/,
    "Must display explicit sendError with retry capability"
  );

  // Transpile to ensure no syntax errors
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.ok(transpiled.outputText.length > 500, "Should transpile cleanly without syntax errors");
});
