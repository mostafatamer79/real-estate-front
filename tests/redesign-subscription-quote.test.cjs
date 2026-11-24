const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadQuoteModule() {
  const context = { exports: {} };
  const source = fs.readFileSync(
    path.join(__dirname, '../lib/redesign-subscription-quote.ts'),
    'utf8'
  );
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('toKnownPrice accepts valid finite non-negative numbers and preserves explicit zero', () => {
  const { toKnownPrice } = loadQuoteModule();

  // Valid positive numbers and decimals
  assert.equal(toKnownPrice(100), 100);
  assert.equal(toKnownPrice(49.99), 49.99);
  assert.equal(toKnownPrice('250'), 250);
  assert.equal(toKnownPrice('  75.50  '), 75.5);

  // Critical requirement: Real explicit zero remains valid
  assert.equal(toKnownPrice(0), 0);
  assert.equal(toKnownPrice('0'), 0);
  assert.equal(toKnownPrice('0.00'), 0);
});

test('toKnownPrice rejects negative values, empty strings, and malformed inputs', () => {
  const { toKnownPrice } = loadQuoteModule();

  assert.equal(toKnownPrice(-1), null);
  assert.equal(toKnownPrice('-50'), null);
  assert.equal(toKnownPrice(-0.01), null);

  assert.equal(toKnownPrice(null), null);
  assert.equal(toKnownPrice(undefined), null);
  assert.equal(toKnownPrice(''), null);
  assert.equal(toKnownPrice('   '), null);
  assert.equal(toKnownPrice(NaN), null);
  assert.equal(toKnownPrice(Infinity), null);
  assert.equal(toKnownPrice(-Infinity), null);
  assert.equal(toKnownPrice(true), null);
  assert.equal(toKnownPrice(false), null);
  assert.equal(toKnownPrice([]), null);
  assert.equal(toKnownPrice({}), null);
});

test('normalizeSeats sanitizes input and enforces bounds [0, MAX_EMPLOYEE_SEATS]', () => {
  const { normalizeSeats, MAX_EMPLOYEE_SEATS } = loadQuoteModule();
  assert.equal(MAX_EMPLOYEE_SEATS, 500);

  // Valid inputs
  assert.equal(normalizeSeats(1), 1);
  assert.equal(normalizeSeats(25), 25);
  assert.equal(normalizeSeats('50'), 50);

  // Floored decimal
  assert.equal(normalizeSeats(10.8), 10);

  // Non-positive or invalid inputs clamped to 0
  assert.equal(normalizeSeats(0), 0);
  assert.equal(normalizeSeats(-5), 0);
  assert.equal(normalizeSeats('abc'), 0);
  assert.equal(normalizeSeats(null), 0);
  assert.equal(normalizeSeats(undefined), 0);
  assert.equal(normalizeSeats(NaN), 0);

  // Upper bound enforcement
  assert.equal(normalizeSeats(500), 500);
  assert.equal(normalizeSeats(501), 500);
  assert.equal(normalizeSeats(10000), 500);
});

test('readDepartmentPrice and readSeatPrice read period prices and handle missing or null safely', () => {
  const { readDepartmentPrice, readSeatPrice } = loadQuoteModule();

  const pricing = {
    departmentPrices: {
      'admin.dept.real_estate': { monthly: 150, yearly: 1500 },
      'admin.dept.offers': { monthly: 0, yearly: 0 }, // explicit zero
      'admin.dept.orders': { monthly: '80', yearly: null },
    },
    employeeSeatMonthlyPrice: 25,
    employeeSeatYearlyPrice: 250,
  };

  // Normal read
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.real_estate', 'شهري'), 150);
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.real_estate', 'سنوي'), 1500);

  // Explicit zero preserved
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.offers', 'شهري'), 0);
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.offers', 'سنوي'), 0);

  // Numeric string parsed
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.orders', 'شهري'), 80);

  // Missing or null price returns null
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.orders', 'سنوي'), null);
  assert.equal(readDepartmentPrice(pricing, 'admin.dept.unknown', 'شهري'), null);

  // Seat prices
  assert.equal(readSeatPrice(pricing, 'شهري'), 25);
  assert.equal(readSeatPrice(pricing, 'سنوي'), 250);

  // Null/undefined pricing object safety
  assert.equal(readDepartmentPrice(null, 'admin.dept.real_estate', 'شهري'), null);
  assert.equal(readDepartmentPrice(undefined, 'admin.dept.real_estate', 'شهري'), null);
  assert.equal(readSeatPrice(null, 'شهري'), null);
  assert.equal(readSeatPrice(undefined, 'سنوي'), null);
});

test('buildCustomQuote calculates quotes and does not substitute missing prices with zeros', () => {
  const { buildCustomQuote } = loadQuoteModule();

  const pricing = {
    departmentPrices: {
      'admin.dept.real_estate': { monthly: 100, yearly: 1000 },
      'admin.dept.offers': { monthly: 0, yearly: 0 }, // explicit zero
      'admin.dept.hr': { monthly: 80, yearly: 800 },
    },
    employeeSeatMonthlyPrice: 20,
    employeeSeatYearlyPrice: 200,
  };

  // Selection with known departments without HR
  const quote1 = buildCustomQuote(pricing, {
    selectedDepartments: ['admin.dept.real_estate', 'admin.dept.offers'],
    employeeSeats: 0,
    billingPeriod: 'شهري',
  });
  assert.equal(quote1.hasUnknownPrices, false);
  assert.equal(quote1.total, 100); // 100 + 0 = 100
  assert.equal(quote1.seats, null);

  // Selection with explicit 0 only
  const quoteZero = buildCustomQuote(pricing, {
    selectedDepartments: ['admin.dept.offers'],
    employeeSeats: 0,
    billingPeriod: 'شهري',
  });
  assert.equal(quoteZero.hasUnknownPrices, false);
  assert.equal(quoteZero.total, 0);

  // Selection with HR and employee seats
  const quoteWithSeats = buildCustomQuote(pricing, {
    selectedDepartments: ['admin.dept.hr'],
    employeeSeats: 3,
    billingPeriod: 'شهري',
  });
  assert.equal(quoteWithSeats.hasUnknownPrices, false);
  assert.equal(quoteWithSeats.seats?.count, 3);
  assert.equal(quoteWithSeats.seats?.unitPrice, 20);
  assert.equal(quoteWithSeats.seats?.total, 60);
  assert.equal(quoteWithSeats.total, 140); // 80 + 60

  // Selection with a department whose price is missing from pricing data
  const quoteMissing = buildCustomQuote(pricing, {
    selectedDepartments: ['admin.dept.real_estate', 'admin.dept.legal'],
    employeeSeats: 0,
    billingPeriod: 'شهري',
  });
  // Must NOT substitute legal price with 0 to produce fake 100 total!
  assert.equal(quoteMissing.hasUnknownPrices, true);
  assert.equal(quoteMissing.total, null);
  assert.equal(quoteMissing.lines.find(l => l.department === 'admin.dept.legal')?.price, null);

  // Selection with HR department but missing seat price
  const pricingNoSeat = {
    departmentPrices: {
      'admin.dept.hr': { monthly: 80, yearly: 800 },
    },
  };
  const quoteMissingSeat = buildCustomQuote(pricingNoSeat, {
    selectedDepartments: ['admin.dept.hr'],
    employeeSeats: 2,
    billingPeriod: 'شهري',
  });
  assert.equal(quoteMissingSeat.hasUnknownPrices, true);
  assert.equal(quoteMissingSeat.total, null);
  assert.equal(quoteMissingSeat.seats?.unitPrice, null);
  assert.equal(quoteMissingSeat.seats?.total, null);
});

test('resolveCustomQuoteGate blocks when pricing is loading or unavailable', () => {
  const { resolveCustomQuoteGate } = loadQuoteModule();

  const pricing = {
    departmentPrices: { 'admin.dept.real_estate': { monthly: 100, yearly: 1000 } },
  };
  const selection = {
    selectedDepartments: ['admin.dept.real_estate'],
    employeeSeats: 0,
    billingPeriod: 'شهري',
  };

  const gateLoading = resolveCustomQuoteGate({
    pricingStatus: 'loading',
    pricing,
    selection,
  });
  assert.equal(gateLoading.canSubmit, false);
  assert.equal(gateLoading.blockReason, 'pricing-loading');

  const gateUnavailable = resolveCustomQuoteGate({
    pricingStatus: 'unavailable',
    pricing,
    selection,
  });
  assert.equal(gateUnavailable.canSubmit, false);
  assert.equal(gateUnavailable.blockReason, 'pricing-unavailable');
});

test('resolveCustomQuoteGate blocks missing departments, missing prices, or missing seats', () => {
  const { resolveCustomQuoteGate } = loadQuoteModule();

  const pricing = {
    departmentPrices: {
      'admin.dept.real_estate': { monthly: 100, yearly: 1000 },
      'admin.dept.hr': { monthly: 50, yearly: 500 },
    },
    employeeSeatMonthlyPrice: 10,
    employeeSeatYearlyPrice: 100,
  };

  // No departments selected
  const gateNoDepts = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: [],
      employeeSeats: 0,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateNoDepts.canSubmit, false);
  assert.equal(gateNoDepts.blockReason, 'no-departments');

  // Department price missing in pricing data
  const gateMissingDeptPrice = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: ['admin.dept.legal'],
      employeeSeats: 0,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateMissingDeptPrice.canSubmit, false);
  assert.equal(gateMissingDeptPrice.blockReason, 'missing-department-price');

  // HR selected but seat price missing
  const gateMissingSeatPrice = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing: {
      departmentPrices: { 'admin.dept.hr': { monthly: 50, yearly: 500 } },
    },
    selection: {
      selectedDepartments: ['admin.dept.hr'],
      employeeSeats: 2,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateMissingSeatPrice.canSubmit, false);
  assert.equal(gateMissingSeatPrice.blockReason, 'missing-seat-price');

  // HR selected but employeeSeats < 1
  const gateMissingSeats = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: ['admin.dept.hr'],
      employeeSeats: 0,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateMissingSeats.canSubmit, false);
  assert.equal(gateMissingSeats.blockReason, 'missing-seats');
});

test('resolveCustomQuoteGate permits submission when prices and selections are fully valid', () => {
  const { resolveCustomQuoteGate } = loadQuoteModule();

  const pricing = {
    departmentPrices: {
      'admin.dept.real_estate': { monthly: 100, yearly: 1000 },
      'admin.dept.offers': { monthly: 0, yearly: 0 }, // explicit zero
      'admin.dept.hr': { monthly: 50, yearly: 500 },
    },
    employeeSeatMonthlyPrice: 10,
    employeeSeatYearlyPrice: 100,
  };

  // Normal valid selection
  const gateValid = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: ['admin.dept.real_estate'],
      employeeSeats: 0,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateValid.canSubmit, true);
  assert.equal(gateValid.blockReason, null);

  // Legitimate zero price allows submit
  const gateZero = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: ['admin.dept.offers'],
      employeeSeats: 0,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateZero.canSubmit, true);
  assert.equal(gateZero.blockReason, null);

  // HR with valid seats allows submit
  const gateHrValid = resolveCustomQuoteGate({
    pricingStatus: 'ready',
    pricing,
    selection: {
      selectedDepartments: ['admin.dept.hr'],
      employeeSeats: 5,
      billingPeriod: 'شهري',
    },
  });
  assert.equal(gateHrValid.canSubmit, true);
  assert.equal(gateHrValid.blockReason, null);
});

test('page integration integrates pricing status, quote helper, retry recovery, and blocks invalid submit', () => {
  const pageSource = fs.readFileSync(
    path.join(__dirname, '../app/subscriptions/new/page.tsx'),
    'utf8'
  );

  // 1. Helper integration
  assert.match(pageSource, /import\s*\{[^}]*buildCustomQuote[^}]*\}\s*from\s*["']@\/lib\/redesign-subscription-quote["']/);
  assert.match(pageSource, /import\s*\{[^}]*resolveCustomQuoteGate[^}]*\}\s*from\s*["']@\/lib\/redesign-subscription-quote["']/);
  assert.match(pageSource, /buildCustomQuote\s*\(/);
  assert.match(pageSource, /resolveCustomQuoteGate\s*\(/);

  // 2. Explicit pricing status tracking (not conflated with 0s)
  assert.match(pageSource, /pricingStatus/);
  assert.match(pageSource, /useState<\s*PricingStatus\s*>\s*\(\s*["']loading["']\s*\)/);
  assert.doesNotMatch(pageSource, /emptyGlobalPricing/);

  // 3. Retry / recovery mechanism
  assert.match(pageSource, /retryPricing/);
  assert.match(pageSource, /RotateCcw/);

  // 4. Submit button disabled when quote cannot submit or amount is null, with mutex protection
  assert.match(pageSource, /isSubmitDisabled/);
  assert.match(pageSource, /computedAmount\s*===\s*null/);
  assert.match(pageSource, /disabled=\{isSubmitDisabled\}/);
  assert.match(pageSource, /if\s*\(creating\)\s*return;/);

  // 5. Preserves existing preview contract and custom option invariant
  assert.match(pageSource, /packageAdministrations=\{previewPackage\?\.administrations\}/);
  assert.doesNotMatch(pageSource, />\s*اشتراك مخصص\s*<\/button>/);

  // 6. Scoped CSS module and architectural artwork integration
  assert.match(pageSource, /import\s+styles\s+from\s+["']\.\/subscription-redesign\.module\.css["']/);
  assert.match(pageSource, /styles\.subscriptionPage/);
  assert.match(pageSource, /styles\.packageGrid/);
  assert.match(pageSource, /styles\.departmentFieldset/);
  assert.match(pageSource, /styles\.quoteSection/);
  assert.match(pageSource, /\/artworks\/chat05-subscriptions-arch\.svg/);
});

