const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const libPath = path.resolve(__dirname, "../lib/redesign-chat04-support.ts");
const cssPath = path.resolve(__dirname, "../components/customer-service/customer-service.module.css");
const pagePath = path.resolve(__dirname, "../components/customer-service/CustomerServicePage.tsx");

// Import lib via ts transpile
function loadLib() {
  const ts = require("typescript");
  const vm = require("node:vm");
  const source = fs.readFileSync(libPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const ctx = { exports: {}, module: { exports: {} }, require: () => ({}) };
  vm.runInNewContext(transpiled, ctx);
  return ctx.exports;
}

test("1. Route context and sourcePath resolution across all 3 customer service routes", () => {
  const { resolveSourcePath, getRouteMeta } = loadLib();

  // Route path resolution
  assert.equal(resolveSourcePath("/customerservice", null), "/customerservice");
  assert.equal(resolveSourcePath("/customerservice/contact", null), "/customerservice/contact");
  assert.equal(resolveSourcePath("/customerservice/support", null), "/customerservice/support");

  // Fallback to pathname when sourcePath is omitted
  assert.equal(resolveSourcePath(undefined, "/customerservice"), "/customerservice");
  assert.equal(resolveSourcePath(undefined, "/customerservice/contact"), "/customerservice/contact");
  assert.equal(resolveSourcePath(undefined, "/customerservice/support"), "/customerservice/support");
  assert.equal(resolveSourcePath(undefined, "/customerservice/anything-else"), "/customerservice");
  assert.equal(resolveSourcePath(undefined, null), "/customerservice");
  assert.equal(resolveSourcePath("", ""), "/customerservice");

  // Route metadata
  const hubMeta = getRouteMeta("/customerservice");
  assert.equal(hubMeta.tabKey, "hub");
  assert.ok(hubMeta.titleAr.includes("مركز"));
  assert.ok(hubMeta.titleEn.includes("Hub"));

  const contactMeta = getRouteMeta("/customerservice/contact");
  assert.equal(contactMeta.tabKey, "contact");
  assert.ok(contactMeta.titleAr.includes("التواصل"));

  const supportMeta = getRouteMeta("/customerservice/support");
  assert.equal(supportMeta.tabKey, "support");
  assert.ok(supportMeta.titleAr.includes("تذاكر"));
});

test("2. Social handle and X profile URL normalization", () => {
  const { getXProfileUrl, getXDisplayHandle } = loadLib();

  // Full URLs
  assert.equal(getXProfileUrl("https://x.com/realestate_sa"), "https://x.com/realestate_sa");
  assert.equal(getXDisplayHandle("https://x.com/realestate_sa"), "@realestate_sa");

  // @handle format
  assert.equal(getXProfileUrl("@realestate_sa"), "https://x.com/realestate_sa");
  assert.equal(getXDisplayHandle("@realestate_sa"), "@realestate_sa");

  // Bare handle
  assert.equal(getXProfileUrl("realestate_sa"), "https://x.com/realestate_sa");
  assert.equal(getXDisplayHandle("realestate_sa"), "@realestate_sa");

  // Empty string
  assert.equal(getXProfileUrl("   "), "#");
  assert.equal(getXDisplayHandle("   "), "");
});

test("3. Ticket status details with WCAG AA labels in Arabic and English", () => {
  const { getTicketStatusDetails } = loadLib();

  const statuses = ["new", "replied", "customer_replied", "resolved"];

  for (const status of statuses) {
    const ar = getTicketStatusDetails(status, "ar");
    const en = getTicketStatusDetails(status, "en");

    assert.ok(ar.label.length > 0);
    assert.ok(ar.ariaLabel.startsWith("حالة"));
    assert.ok(en.label.length > 0);
    assert.ok(en.ariaLabel.startsWith("Ticket"));
    assert.equal(ar.variant, status === "customer_replied" ? "customer_replied" : status);
  }
});

test("4. Safe ticket filtering and search across ID, question, and replies", () => {
  const { filterTickets } = loadLib();

  const sampleTickets = [
    { id: "tick-001-abc", question: "Inquiry about villa in Riyadh", adminReply: "Agent reply here", status: "replied" },
    { id: "tick-002-xyz", question: "Maintenance issue with AC", adminReply: null, status: "new" },
    { id: "tick-003-def", question: "Contract dispute", adminReply: "Resolved by legal", userReply: "Thank you", status: "resolved" },
  ];

  // Filter by status
  const replied = filterTickets(sampleTickets, "", "replied");
  assert.equal(replied.length, 1);
  assert.equal(replied[0].id, "tick-001-abc");

  // Filter by ID query
  const searchedId = filterTickets(sampleTickets, "002", "all");
  assert.equal(searchedId.length, 1);
  assert.equal(searchedId[0].id, "tick-002-xyz");

  // Filter by content query (Arabic / English keyword)
  const searchedContent = filterTickets(sampleTickets, "villa", "all");
  assert.equal(searchedContent.length, 1);
  assert.equal(searchedContent[0].id, "tick-001-abc");

  // Filter with matching user reply
  const searchedUserReply = filterTickets(sampleTickets, "Thank you", "all");
  assert.equal(searchedUserReply.length, 1);
  assert.equal(searchedUserReply[0].id, "tick-003-def");

  // Malformed or null inputs must not crash
  assert.equal(filterTickets(null, "test", "all").length, 0);
  assert.equal(filterTickets(undefined, "test", "all").length, 0);
  assert.equal(filterTickets([null, undefined], "test", "all").length, 0);
});

test("5. Form validation helper with boundary tests", () => {
  const { validateFeedbackForm } = loadLib();

  // Valid email submission
  const validEmail = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "email",
    email: "mostafa@example.com",
    question: "General inquiry text",
  });
  assert.equal(validEmail.isValid, true);
  assert.equal(Object.keys(validEmail.errors).length, 0);

  // Missing email
  const missingEmail = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "email",
    email: "",
    question: "General inquiry text",
  });
  assert.equal(missingEmail.isValid, false);
  assert.ok(missingEmail.errors.email);

  // Invalid email format
  const badEmail = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "email",
    email: "not-an-email",
    question: "General inquiry text",
  });
  assert.equal(badEmail.isValid, false);
  assert.ok(badEmail.errors.email);

  // Valid phone submission
  const validPhone = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "phone",
    phoneNumber: "0501234567",
    question: "General inquiry text",
  });
  assert.equal(validPhone.isValid, true);

  // Short/invalid phone
  const shortPhone = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "phone",
    phoneNumber: "123",
    question: "General inquiry text",
  });
  assert.equal(shortPhone.isValid, false);
  assert.ok(shortPhone.errors.phoneNumber);

  // Exceeding 200 char limit
  const longQuestion = validateFeedbackForm({
    name: "Mostafa",
    contactMethod: "email",
    email: "mostafa@example.com",
    question: "A".repeat(205),
  }, 200);
  assert.equal(longQuestion.isValid, false);
  assert.ok(longQuestion.errors.question);
});

test("6. CSS Module purity, design tokens, and dialog portal scoping", () => {
  const css = fs.readFileSync(cssPath, "utf8");

  // Pure selectors rule: no bare `*` or `*::before` without local scoping
  const strippedCss = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const bareUniversalRegex = /^\s*(\*|\*::before|\*::after)\s*\{/gm;
  assert.equal(bareUniversalRegex.test(strippedCss), false, "Must not contain bare unscoped universal selectors");

  // Check presence of architectural tokens
  assert.ok(css.includes("--cs-bg"), "Missing --cs-bg token");
  assert.ok(css.includes("--cs-ink"), "Missing --cs-ink token");
  assert.ok(css.includes("--cs-brass"), "Missing --cs-brass token");
  assert.ok(css.includes("--cs-surface"), "Missing --cs-surface token");

  // Check Dialog portal tokens class for body portal rendering
  assert.ok(css.includes(".dialogPortalContent"), "Missing .dialogPortalContent class for portal token scoping");
  assert.ok(css.includes(":global(.dark) .dialogPortalContent"), "Missing dark mode override for .dialogPortalContent");

  // Check button contrast in dark mode (brass button must use dark ink, not white)
  assert.ok(css.includes("--cs-btn-brass-text: #0b192c;"), "Dark mode brass button must use dark navy ink for AA contrast");

  // Check reduced motion rule scoped locally
  assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "Missing reduced-motion media query");
  assert.ok(css.includes(".pageContainer *"), "Reduced-motion rule must be scoped to local containers");
});

test("7. Accessibility and route wrappers verification", () => {
  const pageSource = fs.readFileSync(pagePath, "utf8");

  // Label htmlFor and ID pairings
  assert.ok(pageSource.includes('htmlFor="cs-name"') && pageSource.includes('id="cs-name"'));
  assert.ok(pageSource.includes('htmlFor="cs-email"') && pageSource.includes('id="cs-email"'));
  assert.ok(pageSource.includes('htmlFor="cs-phone"') && pageSource.includes('id="cs-phone"'));
  assert.ok(pageSource.includes('htmlFor="cs-question"') && pageSource.includes('id="cs-question"'));
  assert.ok(pageSource.includes('htmlFor={`cs-reply-${selectedTicket.id}`}') && pageSource.includes('id={`cs-reply-${selectedTicket.id}`}'));

  // SubNavBar tablist and roles
  assert.ok(pageSource.includes('role="tablist"'));
  assert.ok(pageSource.includes('role="tab"'));
  assert.ok(pageSource.includes('href="/customerservice"'));
  assert.ok(pageSource.includes('href="/customerservice/contact"'));
  assert.ok(pageSource.includes('href="/customerservice/support"'));
  assert.ok(pageSource.includes('href="/customerservice/faq"'));
  assert.ok(pageSource.includes('href="/services"'));

  // Contact and Support wrapper page contracts
  const contactPage = fs.readFileSync(path.resolve(__dirname, "../app/customerservice/contact/page.tsx"), "utf8");
  assert.ok(contactPage.includes('sourcePath="/customerservice/contact"'));
  assert.ok(contactPage.includes('Suspense'));

  const supportPage = fs.readFileSync(path.resolve(__dirname, "../app/customerservice/support/page.tsx"), "utf8");
  assert.ok(supportPage.includes('sourcePath="/customerservice/support"'));
  assert.ok(supportPage.includes('Suspense'));
});
