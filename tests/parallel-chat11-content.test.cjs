const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

// Direct module loader using TypeScript compiler to exercise real production code
function loadTsModule(relativePath) {
  const fullPath = path.resolve(__dirname, "..", relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const context = {
    exports: {},
    module: { exports: {} },
    require,
    console,
    URL,
  };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

const {
  buildFaqSections,
  resolveInfoTab,
  validateOpinionForm,
  safeNavigateBack,
} = loadTsModule("lib/redesign-chat11-content.ts");

test("buildFaqSections: empty published FAQ array returns [] without silent fallback", () => {
  const fallback = [{ category: "Fallback Cat", items: [{ id: "1", question: "Q", answer: "A" }] }];
  const result = buildFaqSections([], [], "ar", { fallbackDataIfNull: fallback });

  assert.equal(result.length, 0, "Published empty state must return empty array, not fallback data");
});

test("buildFaqSections: null faqs triggers fallback data if provided", () => {
  const fallback = [{ category: "Fallback Cat", items: [{ id: "1", question: "Q", answer: "A" }] }];
  const result = buildFaqSections(null, [], "ar", { fallbackDataIfNull: fallback });

  assert.deepEqual(result, fallback, "Null faqs (initial loading/unfetched) should use fallback data if provided");
});

test("buildFaqSections: preserves orphaned category IDs without dropping questions", () => {
  const categories = [
    { id: "cat-1", nameAr: "الفئة الأولى", nameEn: "Category 1", sortOrder: 1 },
  ];

  const faqs = [
    {
      id: "faq-1",
      questionAr: "سؤال 1",
      questionEn: "Question 1",
      answerAr: "جواب 1",
      answerEn: "Answer 1",
      categoryId: "cat-1",
      sortOrder: 1,
    },
    {
      id: "faq-orphaned",
      questionAr: "سؤال يتيم",
      questionEn: "Orphaned Question",
      answerAr: "جواب يتيم",
      answerEn: "Orphaned Answer",
      categoryId: "cat-deleted-or-missing",
      categoryAr: "فئة قديمة",
      categoryEn: "Old Category",
      sortOrder: 2,
    },
    {
      id: "faq-no-cat",
      questionAr: "سؤال بدون فئة",
      questionEn: "Uncategorized Question",
      answerAr: "جواب بدون فئة",
      answerEn: "Uncategorized Answer",
      categoryId: null,
      sortOrder: 3,
    },
  ];

  const resultAr = buildFaqSections(faqs, categories, "ar");

  // All 3 questions must be preserved across sections
  const totalQuestionsAr = resultAr.reduce((sum, s) => sum + s.items.length, 0);
  assert.equal(totalQuestionsAr, 3, "All questions including orphaned categories must be preserved");

  const catNames = resultAr.map((s) => s.category);
  assert.ok(catNames.includes("الفئة الأولى"));
  assert.ok(catNames.includes("فئة قديمة"), "Orphaned category custom title must be preserved");
  assert.ok(catNames.includes("أسئلة عامة"), "General fallback title used when no category label exists");

  // Test English localization
  const resultEn = buildFaqSections(faqs, categories, "en");
  const catNamesEn = resultEn.map((s) => s.category);
  assert.ok(catNamesEn.includes("Category 1"));
  assert.ok(catNamesEn.includes("Old Category"));
  assert.ok(catNamesEn.includes("General Questions"));
  assert.equal(resultEn[0].items[0].question, "Question 1");
});

test("resolveInfoTab: normalizes aliases and preserves deep links", () => {
  const validTabs = [
    { key: "terms_short" },
    { key: "usage" },
    { key: "permits" },
    { key: "contact" },
  ];

  // Aliases
  assert.equal(resolveInfoTab("terms", validTabs), "terms_short");
  assert.equal(resolveInfoTab("privacy", validTabs), "usage");

  // Direct valid keys
  assert.equal(resolveInfoTab("permits", validTabs), "permits");
  assert.equal(resolveInfoTab("contact", validTabs), "contact");
  assert.equal(resolveInfoTab("usage", validTabs), "usage");

  // Invalid or empty fallback
  assert.equal(resolveInfoTab("unknown_tab", validTabs), "terms_short");
  assert.equal(resolveInfoTab("", validTabs), "terms_short");
  assert.equal(resolveInfoTab(null, validTabs), "terms_short");
});

test("validateOpinionForm: validates required fields, lengths, and email format", () => {
  // Empty inputs
  const emptyResAr = validateOpinionForm({ name: "", message: "" }, "ar");
  assert.equal(emptyResAr.isValid, false);
  assert.ok(emptyResAr.errors.name);
  assert.ok(emptyResAr.errors.message);

  // Short message
  const shortMsgRes = validateOpinionForm({ name: "محمد", message: "قصير" }, "ar");
  assert.equal(shortMsgRes.isValid, false);
  assert.ok(shortMsgRes.errors.message);

  // Invalid email
  const invalidEmailRes = validateOpinionForm({ name: "محمد أحمد", message: "رسالة تفصيلية ممتازة", email: "bad-email" }, "ar");
  assert.equal(invalidEmailRes.isValid, false);
  assert.ok(invalidEmailRes.errors.email);

  // Valid without email
  const validNoEmail = validateOpinionForm({ name: "محمد أحمد", message: "رسالة مقترح ممتازة للمنصة" }, "ar");
  assert.equal(validNoEmail.isValid, true);
  assert.equal(Object.keys(validNoEmail.errors).length, 0);

  // Valid with email (English)
  const validWithEmailEn = validateOpinionForm(
    { name: "John Doe", message: "A very helpful feedback suggestion for the platform", email: "john@example.com" },
    "en"
  );
  assert.equal(validWithEmailEn.isValid, true);
  assert.equal(Object.keys(validWithEmailEn.errors).length, 0);
});

test("safeNavigateBack: falls back if no internal referrer exists", () => {
  let pushedRoute = null;
  let backCalled = false;
  const mockRouter = {
    back: () => { backCalled = true; },
    push: (url) => { pushedRoute = url; },
  };

  // When window/document has no referrer
  global.window = { history: { length: 1 }, location: { host: "localhost:3000" } };
  global.document = { referrer: "" };

  safeNavigateBack(mockRouter, "/customerservice");
  assert.equal(backCalled, false);
  assert.equal(pushedRoute, "/customerservice");

  // Clean up globals
  delete global.window;
  delete global.document;
});
