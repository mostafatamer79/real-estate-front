const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Standard repo loader for TypeScript modules
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
  matchesFieldCategories,
  matchesSpecialization,
  calculateMinOffer,
  calculateMaxOffer,
  isOpportunityActionable,
  validateUploadFile,
  validateOfferSubmission,
  getTrackingNavigationContract,
} = loadTsModule("../lib/redesign-chat02-provider-helpers.ts");

test("production helper: dynamic registration fields filter by enabled status and hierarchical categories", () => {
  const globalField = { enabled: true, categories: [] };
  const legalField = { enabled: true, categories: ["legal"] };
  const subCategoryField = { enabled: true, categories: ["legal_contracts"] };
  const disabledField = { enabled: false, categories: ["legal"] };

  assert.equal(matchesFieldCategories(globalField, ["construction"]), true);
  assert.equal(matchesFieldCategories(legalField, ["legal"]), true);
  assert.equal(matchesFieldCategories(legalField, ["legal_notary"]), true);
  assert.equal(matchesFieldCategories(subCategoryField, ["legal"]), true);
  assert.equal(matchesFieldCategories(legalField, ["marketing"]), false);
  assert.equal(matchesFieldCategories(disabledField, ["legal"]), false);
});

test("production helper: specialization matching respects category hierarchy and enabled flags", () => {
  const specAny = { enabled: true, categories: [] };
  const specLegal = { enabled: true, categories: ["legal"] };
  const specDisabled = { enabled: false, categories: ["legal"] };

  assert.equal(matchesSpecialization(specAny, ["legal", "marketing"]), true);
  assert.equal(matchesSpecialization(specLegal, ["legal"]), true);
  assert.equal(matchesSpecialization(specLegal, ["legal_documentation"]), true);
  assert.equal(matchesSpecialization(specLegal, ["legal", "marketing"]), false);
  assert.equal(matchesSpecialization(specDisabled, ["legal"]), false);
});

test("production helper: offer calculation preserves minimum fee and platform floor bounds", () => {
  assert.equal(calculateMinOffer(null), 0.01);
  assert.equal(calculateMinOffer({}), 0.01);

  // When percentage agreement is active, minimum offer floor applies
  const percentageProfile = { agreementType: "percentage", agreementValue: 10, minOffer: 150 };
  assert.equal(calculateMinOffer(percentageProfile), 150);

  // When fixed agreement fee is higher than minOffer, fixed agreement value sets the floor
  const fixedProfile = { agreementType: "fixed", agreementValue: 200, minOffer: 50 };
  assert.equal(calculateMinOffer(fixedProfile), 200);

  // When minOffer is higher than fixed agreement fee, minOffer sets the floor
  const fixedProfile2 = { agreementType: "fixed", agreementValue: 50, minOffer: 100 };
  assert.equal(calculateMinOffer(fixedProfile2), 100);

  // Max offer calculation
  assert.equal(calculateMaxOffer({ maxOffer: 5000 }), 5000);
  assert.equal(calculateMaxOffer({ maxOffer: 0 }), undefined);
  assert.equal(calculateMaxOffer(null), undefined);
});

test("production helper: isOpportunityActionable prevents stale actions during page loading or failures", () => {
  const approvedProfile = { status: "approved" };
  const pendingProfile = { status: "pending" };
  const validOpportunity = { ownOffer: null, availableDeliveryModes: ["online"] };
  const submittedOpportunity = { ownOffer: { amount: 500, deliveryMode: "online" } };

  // 1. Normal state: actionable
  assert.equal(
    isOpportunityActionable({
      item: validOpportunity,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading: false,
      isBusy: false,
    }),
    true,
  );

  // 2. Stale/refresh state: while page 2 is loading, page 1 items are NOT actionable
  assert.equal(
    isOpportunityActionable({
      item: validOpportunity,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading: true, // Pagination fetch in flight
      isBusy: false,
    }),
    false,
  );

  // 3. Busy state: during form submission, items are NOT actionable
  assert.equal(
    isOpportunityActionable({
      item: validOpportunity,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading: false,
      isBusy: true,
    }),
    false,
  );

  // 4. Blocked license: NOT actionable
  assert.equal(
    isOpportunityActionable({
      item: validOpportunity,
      profile: approvedProfile,
      licenseBlocked: true,
      isPageLoading: false,
      isBusy: false,
    }),
    false,
  );

  // 5. Unapproved profile: NOT actionable
  assert.equal(
    isOpportunityActionable({
      item: validOpportunity,
      profile: pendingProfile,
      licenseBlocked: false,
      isPageLoading: false,
      isBusy: false,
    }),
    false,
  );

  // 6. Already submitted offer: NOT actionable
  assert.equal(
    isOpportunityActionable({
      item: submittedOpportunity,
      profile: approvedProfile,
      licenseBlocked: false,
      isPageLoading: false,
      isBusy: false,
    }),
    false,
  );
});

test("production helper: validateUploadFile enforces strict MIME types and 5MB size ceiling", () => {
  assert.deepEqual(validateUploadFile(null), { valid: false, errorKey: "invalid_type" });
  assert.deepEqual(
    validateUploadFile({ type: "application/javascript", size: 1024 }),
    { valid: false, errorKey: "invalid_type" },
  );
  assert.deepEqual(
    validateUploadFile({ type: "image/png", size: 6 * 1024 * 1024 }),
    { valid: false, errorKey: "file_too_large" },
  );

  // Valid files
  assert.deepEqual(
    validateUploadFile({ type: "application/pdf", size: 4 * 1024 * 1024 }),
    { valid: true },
  );
  assert.deepEqual(
    validateUploadFile({ type: "image/jpeg", size: 500 * 1024 }),
    { valid: true },
  );
  assert.deepEqual(
    validateUploadFile({ type: "image/webp", size: 2 * 1024 * 1024 }),
    { valid: true },
  );
});

test("production helper: validateOfferSubmission validates amounts, bounds and delivery modes", () => {
  const profile = {
    minOffer: 100,
    maxOffer: 1000,
    agreementType: "percentage",
    agreementValue: 10,
    deliveryModes: ["online"],
  };
  const opp = { availableDeliveryModes: ["online"] };

  // Amount validations
  assert.deepEqual(validateOfferSubmission(NaN, "online", profile, opp), {
    valid: false,
    errorKey: "amount_invalid",
  });
  assert.deepEqual(validateOfferSubmission(0, "online", profile, opp), {
    valid: false,
    errorKey: "amount_invalid",
  });
  assert.deepEqual(validateOfferSubmission(50, "online", profile, opp), {
    valid: false,
    errorKey: "below_min",
  });
  assert.deepEqual(validateOfferSubmission(1500, "online", profile, opp), {
    valid: false,
    errorKey: "above_max",
  });

  // Delivery mode validation
  assert.deepEqual(validateOfferSubmission(250, "in_person", profile, opp), {
    valid: false,
    errorKey: "invalid_delivery_mode",
  });

  // Valid offer
  assert.deepEqual(validateOfferSubmission(250, "online", profile, opp), {
    valid: true,
  });
});

test("production helper: tracking contract distinguishes provider opportunities from client tracking", () => {
  const contract = getTrackingNavigationContract();

  // Distinct endpoints for different responsibilities
  assert.equal(contract.clientRequestsHref, "/services/my-requests");
  assert.equal(contract.providerRequestsHref, "/services/provider-requests");
  assert.notEqual(contract.clientRequestsHref, contract.providerRequestsHref);

  // Must not claim provider-requests is assigned orders
  assert.ok(!contract.providerRequestsLabelAr.includes("المسندة"));
  assert.ok(!contract.providerRequestsLabelEn.toLowerCase().includes("assigned orders"));
  assert.ok(contract.explanationAr.includes("المعروضة هنا مخصصة للمزودين"));
});

test("CSS tokens: portal tokens and dark mode contrast tokens exist", () => {
  const cssPath = path.resolve(__dirname, "../app/service-providers/provider-registration.module.css");
  const css = fs.readFileSync(cssPath, "utf8");

  // Portal token classes
  assert.ok(css.includes(".dialogPortalTokens"), "Dialog portal tokens class must exist");
  assert.ok(css.includes(":global(.dark) .dialogPortalTokens"), "Dark dialog portal tokens must exist");

  // Dark gold text token with readable dark ink
  assert.ok(css.includes("--pr-gold-text: #ffffff;"), "Light mode gold button text defined");
  assert.ok(css.includes("--pr-gold-text: #0b192c;"), "Dark mode gold button text defined with high contrast dark ink");

  // Scoped reduced motion
  assert.ok(css.includes(".pageContainer *"), "Page reduced motion scoped");
  assert.ok(css.includes(".dialogPortalTokens *"), "Dialog portal reduced motion scoped");
});
