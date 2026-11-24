const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Helper to load actual exported handlers/functions from CustomerServicePage.tsx
function loadCustomerServiceModule() {
  const filePath = path.resolve(__dirname, "../components/customer-service/CustomerServicePage.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;

  const mockRequire = (id) => {
    if (id === "react") {
      return {
        useState: (init) => [init, () => {}],
        useEffect: () => {},
        useRef: (init) => ({ current: init }),
      };
    }
    if (id === "next/navigation") {
      return {
        useRouter: () => ({ push: () => {}, back: () => {} }),
        usePathname: () => "/customerservice",
      };
    }
    if (id.includes("lucide-react") || id.includes("framer-motion")) {
      return { motion: { div: "div", a: "a", button: "button", h1: "h1", p: "p" }, AnimatePresence: ({ children }) => children };
    }
    return {};
  };

  const context = {
    exports: {},
    module: { exports: {} },
    require: mockRequire,
    console,
    window: { setTimeout, clearTimeout, history: { length: 2 } },
    setTimeout,
    clearTimeout,
  };

  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test("1. submit pending mutex and validation prevents duplicate or invalid feedback", async () => {
  const { executeFeedbackSubmit } = loadCustomerServiceModule();
  assert.equal(typeof executeFeedbackSubmit, "function");

  let createCallCount = 0;
  const mockApi = {
    create: async (data) => {
      createCallCount++;
      return { success: true, data: { id: "ticket-1", ...data, status: "new", createdAt: new Date().toISOString() } };
    },
  };

  // Case A: Blocked by pending mutex
  const mutexResult = await executeFeedbackSubmit({
    isSubmitting: true,
    values: {
      name: "Ahmed",
      contactMethod: "email",
      email: "ahmed@example.com",
      type: "inquiry",
      question: "Hello support",
      pagePath: "/customerservice",
    },
    api: mockApi,
  });
  assert.equal(mutexResult.status, "blocked_by_mutex");
  assert.equal(createCallCount, 0, "API must not be called when mutex is active");

  // Case B: Validation error on empty name or question
  const valResult = await executeFeedbackSubmit({
    isSubmitting: false,
    values: {
      name: "   ",
      contactMethod: "email",
      email: "ahmed@example.com",
      type: "inquiry",
      question: "Hello",
      pagePath: "/customerservice",
    },
    api: mockApi,
  });
  assert.equal(valResult.status, "validation_error");
  assert.equal(createCallCount, 0, "API must not be called on empty name");

  // Case C: Character count limit
  const charLimitResult = await executeFeedbackSubmit({
    isSubmitting: false,
    values: {
      name: "Ahmed",
      contactMethod: "email",
      email: "ahmed@example.com",
      type: "inquiry",
      question: "x".repeat(205),
      charCount: 205,
      maxCharacters: 200,
      pagePath: "/customerservice",
    },
    api: mockApi,
  });
  assert.equal(charLimitResult.status, "validation_error");
  assert.equal(createCallCount, 0, "API must not be called when charCount > 200");

  // Case D: Successful submission
  let noticeType = null;
  let successCalled = false;

  const successResult = await executeFeedbackSubmit({
    isSubmitting: false,
    values: {
      name: "Ahmed",
      contactMethod: "email",
      email: "ahmed@example.com",
      type: "inquiry",
      question: "Valid question here",
      charCount: 19,
      maxCharacters: 200,
      pagePath: "/customerservice/contact",
    },
    api: mockApi,
    onNotice: (t) => {
      noticeType = t;
    },
    onSuccess: async () => {
      successCalled = true;
    },
  });

  assert.equal(successResult.status, "success");
  assert.equal(createCallCount, 1);
  assert.equal(successCalled, true);
  assert.equal(noticeType, "success");
  assert.equal(successResult.data.pagePath, "/customerservice/contact");
});

test("2. explicit history error and retry handling rather than silent empty list", async () => {
  const { executeTicketRefresh } = loadCustomerServiceModule();
  assert.equal(typeof executeTicketRefresh, "function");

  const requestIdRef = { current: 1 };
  let startCalled = false;
  let errorPayload = null;
  let successPayload = null;
  let finallyCalled = false;

  // Case A: Failing API call must trigger onError, not onSuccess
  const failingApi = {
    listMine: async () => {
      throw new Error("Network 500 error");
    },
  };

  const failResult = await executeTicketRefresh({
    api: failingApi,
    isAuthenticated: true,
    requestId: 1,
    currentRequestIdRef: requestIdRef,
    onStart: () => {
      startCalled = true;
    },
    onSuccess: (tickets) => {
      successPayload = tickets;
    },
    onError: (err) => {
      errorPayload = err;
    },
    onFinally: () => {
      finallyCalled = true;
    },
  });

  assert.equal(failResult.status, "error");
  assert.equal(startCalled, true);
  assert.equal(successPayload, null, "Must not report success with empty tickets on network error");
  assert.ok(errorPayload instanceof Error);
  assert.equal(finallyCalled, true);

  // Case B: Retry with successful response
  let retrySuccessPayload = null;
  const mockTickets = [{ id: "t1", question: "Previous inquiry", status: "replied" }];
  const workingApi = {
    listMine: async () => ({ success: true, data: mockTickets }),
  };

  const retryResult = await executeTicketRefresh({
    api: workingApi,
    isAuthenticated: true,
    requestId: 2,
    currentRequestIdRef: { current: 2 },
    onSuccess: (tickets) => {
      retrySuccessPayload = tickets;
    },
  });

  assert.equal(retryResult.status, "success");
  assert.deepEqual(retrySuccessPayload, mockTickets);

  // Case C: Unauthenticated state does not trigger API
  let unauthApiCalled = false;
  const unauthResult = await executeTicketRefresh({
    api: {
      listMine: async () => {
        unauthApiCalled = true;
        return { success: true, data: [] };
      },
    },
    isAuthenticated: false,
    requestId: 3,
    currentRequestIdRef: { current: 3 },
  });
  assert.equal(unauthResult.status, "unauthenticated");
  assert.equal(unauthApiCalled, false);
});

test("3. caught reply errors and draft preservation", async () => {
  const { executeTicketReply } = loadCustomerServiceModule();
  assert.equal(typeof executeTicketReply, "function");

  let draftCleared = false;
  let noticeType = null;
  let errorCaught = null;

  // Failing reply API
  const failingReplyApi = {
    replyAsUser: async () => {
      throw new Error("Failed to post user reply");
    },
  };

  const failResult = await executeTicketReply({
    ticketId: "t123",
    draft: "My important draft message",
    replyingTicketId: null,
    api: failingReplyApi,
    onDraftClear: () => {
      draftCleared = true;
    },
    onNotice: (type) => {
      noticeType = type;
    },
    onError: (err) => {
      errorCaught = err;
    },
  });

  assert.equal(failResult.status, "error");
  assert.ok(errorCaught instanceof Error);
  assert.equal(noticeType, "error");
  assert.equal(draftCleared, false, "Draft MUST be preserved when reply API fails");

  // Mutex check: replyingTicketId already set
  const mutexResult = await executeTicketReply({
    ticketId: "t123",
    draft: "Another reply",
    replyingTicketId: "t123",
    api: failingReplyApi,
  });
  assert.equal(mutexResult.status, "blocked_by_mutex");
});

test("4. exactly one history refresh after reply success", async () => {
  const { executeTicketReply } = loadCustomerServiceModule();

  let refreshCallCount = 0;
  let draftClearedTicketId = null;
  let successReceived = false;

  const mockApi = {
    replyAsUser: async (id, reply) => ({
      success: true,
      data: { id, userReply: reply, status: "customer_replied" },
    }),
  };

  const mockRefreshTickets = async () => {
    refreshCallCount++;
    return [{ id: "t123", userReply: "My reply", status: "customer_replied" }];
  };

  const result = await executeTicketReply({
    ticketId: "t123",
    draft: "My reply text",
    replyingTicketId: null,
    api: mockApi,
    refreshTickets: mockRefreshTickets,
    onDraftClear: (id) => {
      draftClearedTicketId = id;
    },
    onSuccess: () => {
      successReceived = true;
    },
  });

  assert.equal(result.status, "success");
  assert.equal(draftClearedTicketId, "t123", "Draft must be cleared on success");
  assert.equal(refreshCallCount, 1, "Exactly ONE history refresh must be executed after reply");
  assert.equal(successReceived, true);
});

test("5. safe stale response and unmount behavior", async () => {
  const { executeTicketRefresh, executeFeedbackSubmit, executeTicketReply } = loadCustomerServiceModule();

  // Test stale sequence race condition
  const currentReqRef = { current: 2 }; // request 2 has superseded request 1
  let staleSuccessCalled = false;

  const delayedApi = {
    listMine: async () => ({ success: true, data: [{ id: "stale" }] }),
  };

  const staleResult = await executeTicketRefresh({
    api: delayedApi,
    isAuthenticated: true,
    requestId: 1, // older request
    currentRequestIdRef: currentReqRef, // current is 2
    onSuccess: () => {
      staleSuccessCalled = true;
    },
  });

  assert.equal(staleResult.status, "stale_or_unmounted");
  assert.equal(staleSuccessCalled, false, "Stale request response must not trigger onSuccess");

  // Test unmounted execution for feedback submit
  let unmountedSuccess = false;
  const unmountedSubmitResult = await executeFeedbackSubmit({
    isSubmitting: false,
    values: {
      name: "User",
      contactMethod: "email",
      email: "user@example.com",
      type: "inquiry",
      question: "Hello",
      pagePath: "/customerservice",
    },
    api: {
      create: async () => ({ success: true, data: { id: "1" } }),
    },
    isMounted: () => false, // Component unmounted while waiting for API
    onSuccess: () => {
      unmountedSuccess = true;
    },
  });
  assert.equal(unmountedSubmitResult.status, "unmounted");
  assert.equal(unmountedSuccess, false, "Unmounted component must not trigger onSuccess callback");

  // Test unmounted execution for ticket reply
  let unmountedDraftCleared = false;
  const unmountedReplyResult = await executeTicketReply({
    ticketId: "t1",
    draft: "reply",
    api: {
      replyAsUser: async () => ({ success: true, data: { id: "t1" } }),
    },
    isMounted: () => false,
    onDraftClear: () => {
      unmountedDraftCleared = true;
    },
  });
  assert.equal(unmountedReplyResult.status, "unmounted");
  assert.equal(unmountedDraftCleared, false, "Unmounted component must not trigger onDraftClear");
});

test("6. input IDs, matching labels, and actual route source path resolution", () => {
  const { resolveSourcePath } = loadCustomerServiceModule();
  assert.equal(typeof resolveSourcePath, "function");

  // Verify route path resolution
  assert.equal(resolveSourcePath("/customerservice/contact", null), "/customerservice/contact");
  assert.equal(resolveSourcePath("/customerservice/support", null), "/customerservice/support");
  assert.equal(resolveSourcePath(undefined, "/customerservice/contact"), "/customerservice/contact");
  assert.equal(resolveSourcePath(undefined, "/customerservice/support"), "/customerservice/support");
  assert.equal(resolveSourcePath(undefined, null), "/customerservice");
  assert.equal(resolveSourcePath("", ""), "/customerservice");

  // Verify contact and support wrapper pages use actual route source paths
  const contactSource = fs.readFileSync(
    path.resolve(__dirname, "../app/customerservice/contact/page.tsx"),
    "utf8"
  );
  assert.ok(
    contactSource.includes('sourcePath="/customerservice/contact"'),
    "Contact wrapper page must provide /customerservice/contact"
  );

  const supportSource = fs.readFileSync(
    path.resolve(__dirname, "../app/customerservice/support/page.tsx"),
    "utf8"
  );
  assert.ok(
    supportSource.includes('sourcePath="/customerservice/support"'),
    "Support wrapper page must provide /customerservice/support"
  );

  // Verify form accessibility IDs and Labels in CustomerServicePage.tsx
  const pageSource = fs.readFileSync(
    path.resolve(__dirname, "../components/customer-service/CustomerServicePage.tsx"),
    "utf8"
  );

  assert.ok(pageSource.includes('htmlFor="cs-name"') && pageSource.includes('id="cs-name"'), "Name label and input must be paired via cs-name");
  assert.ok(pageSource.includes('htmlFor="cs-email"') && pageSource.includes('id="cs-email"'), "Email label and input must be paired via cs-email");
  assert.ok(pageSource.includes('htmlFor="cs-phone"') && pageSource.includes('id="cs-phone"'), "Phone label and input must be paired via cs-phone");
  assert.ok(pageSource.includes('htmlFor="cs-question"') && pageSource.includes('id="cs-question"'), "Question label and textarea must be paired via cs-question");
  assert.ok(pageSource.includes('htmlFor={`cs-reply-${selectedTicket.id}`}') && pageSource.includes('id={`cs-reply-${selectedTicket.id}`}'), "Reply dialog label and textarea must be paired");
});
