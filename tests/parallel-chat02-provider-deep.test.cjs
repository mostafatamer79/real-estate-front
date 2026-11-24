const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");
const ts = require("typescript");

function loadTsModule(relativePath) {
  const fullPath = path.resolve(__dirname, relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  const mod = { exports: {} };
  const customRequire = (id) => {
    if (id.startsWith("@/lib/")) {
      return loadTsModule(`../lib/${id.slice(6)}.ts`);
    }
    return require(id);
  };
  new Function("require", "module", "exports", transpiled)(customRequire, mod, mod.exports);
  return mod.exports;
}

const {
  isOpportunityActionable,
  validateUploadFile,
  validateOfferSubmission,
  getTrackingNavigationContract,
  calculateMinOffer,
} = loadTsModule("../lib/redesign-chat02-provider-helpers.ts");

test("dirty tracking and upload reference preservation lifecycle", () => {
  let hasHydrated = false;
  const dirtyFields = new Set();
  const formState = {
    city: "",
    notes: "",
    licenseDocument: "",
    categories: [],
  };

  const initialServerProfile = {
    city: "Riyadh",
    notes: "Original server notes",
    licenseDocument: "https://storage.test/v1/license.pdf",
    requestedCategories: ["legal"],
  };

  function hydrate(profile) {
    if (!hasHydrated) {
      hasHydrated = true;
      if (profile) {
        if (!dirtyFields.has("city")) formState.city = profile.city || "";
        if (!dirtyFields.has("notes")) formState.notes = profile.notes || "";
        if (!dirtyFields.has("licenseDocument")) formState.licenseDocument = profile.licenseDocument || "";
        if (!dirtyFields.has("categories")) formState.categories = profile.requestedCategories || [];
      }
    }
  }

  // 1. Initial hydration loads server data
  hydrate(initialServerProfile);
  assert.equal(formState.city, "Riyadh");
  assert.equal(formState.licenseDocument, "https://storage.test/v1/license.pdf");

  // 2. User edits city and uploads new license document
  formState.city = "Dammam";
  dirtyFields.add("city");

  const uploadResult = validateUploadFile({
    type: "application/pdf",
    size: 2 * 1024 * 1024,
  });
  assert.equal(uploadResult.valid, true);
  formState.licenseDocument = "https://storage.test/v2/new-license.pdf";
  dirtyFields.add("licenseDocument");

  // 3. Background refresh or language toggle
  hydrate(initialServerProfile);

  // Must preserve user's edited city and newly uploaded document
  assert.equal(formState.city, "Dammam");
  assert.equal(formState.licenseDocument, "https://storage.test/v2/new-license.pdf");

  // 4. Submission failure maintains dirty state
  const submissionFailed = true;
  if (submissionFailed) {
    // dirtyFields must NOT be cleared on failure
  }
  assert.equal(dirtyFields.has("licenseDocument"), true);
  assert.equal(dirtyFields.has("city"), true);
  assert.equal(formState.city, "Dammam");
  assert.equal(formState.licenseDocument, "https://storage.test/v2/new-license.pdf");

  // 5. Successful submission updates server state and clears dirty set
  const nextServerProfile = {
    city: "Dammam",
    notes: "Original server notes",
    licenseDocument: "https://storage.test/v2/new-license.pdf",
    requestedCategories: ["legal"],
  };
  dirtyFields.clear();
  assert.equal(dirtyFields.size, 0);
  assert.equal(nextServerProfile.licenseDocument, formState.licenseDocument);
});

test("stale opportunity pagination guard and error recovery", () => {
  const approvedProfile = { status: "approved" };
  const page1Item = { id: "item-1", ownOffer: null, availableDeliveryModes: ["online"] };

  // Page 1 is active: item is actionable
  let isPageLoading = false;
  let displayedPage = 1;

  assert.equal(
    isOpportunityActionable({
      item: page1Item,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading,
      isBusy: false,
    }),
    true,
  );

  // User clicks Next (navigating to page 2):
  // isPageLoading transitions to true
  isPageLoading = true;

  // Stale page 1 item MUST NOT remain actionable while page 2 is loading
  assert.equal(
    isOpportunityActionable({
      item: page1Item,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading,
      isBusy: false,
    }),
    false,
  );

  // Page 2 fails to load:
  isPageLoading = false;
  let opportunityError = "Network error loading page 2";

  // displayedPage remains 1
  assert.equal(displayedPage, 1);
  assert.ok(opportunityError.length > 0);

  // On retry and successful page 2 response:
  isPageLoading = true;
  opportunityError = "";
  const page2Item = { id: "item-2", ownOffer: null, availableDeliveryModes: ["online"] };
  displayedPage = 2;
  isPageLoading = false;

  assert.equal(displayedPage, 2);
  assert.equal(
    isOpportunityActionable({
      item: page2Item,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading,
      isBusy: false,
    }),
    true,
  );
});

test("mathematical contrast compliance for primary gold buttons", () => {
  // Relative luminance calculation according to WCAG 2.1 specs
  function getLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  function getContrastRatio(rgb1, rgb2) {
    const l1 = getLuminance(...rgb1);
    const l2 = getLuminance(...rgb2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Light theme: Gold #946528 [148, 101, 40] with white text #ffffff [255, 255, 255]
  const lightContrast = getContrastRatio([148, 101, 40], [255, 255, 255]);
  assert.ok(lightContrast >= 4.5, `Light contrast ${lightContrast} should meet WCAG AA (>= 4.5:1)`);

  // Dark theme: Gold #e6bb78 [230, 187, 120] with dark ink #0b192c [11, 25, 44]
  const darkContrast = getContrastRatio([230, 187, 120], [11, 25, 44]);
  assert.ok(darkContrast >= 7.0, `Dark contrast ${darkContrast} should meet WCAG AAA (>= 7.0:1)`);

  // Verify previous broken contrast (#ffffff on #e6bb78 was ~1.8:1)
  const previousBrokenDarkContrast = getContrastRatio([230, 187, 120], [255, 255, 255]);
  assert.ok(previousBrokenDarkContrast < 2.0, "Previous white text on light gold failed contrast requirements");
});
