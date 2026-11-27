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

const newPageSource = fs.readFileSync(
  path.join(__dirname, '../app/subscriptions/new/page.tsx'),
  'utf8'
);

const renewPageSource = fs.readFileSync(
  path.join(__dirname, '../app/internal/renew-subscription/page.tsx'),
  'utf8'
);

const newCssSource = fs.readFileSync(
  path.join(__dirname, '../app/subscriptions/new/subscription-redesign.module.css'),
  'utf8'
);

const renewCssSource = fs.readFileSync(
  path.join(__dirname, '../components/redesign/chat05/renew-subscription.module.css'),
  'utf8'
);

test('quote helper treats explicit numeric 0 as valid but rejects missing/negative values', () => {
  const { toKnownPrice, buildCustomQuote } = loadQuoteModule();

  // Explicit zeros are valid prices
  assert.equal(toKnownPrice(0), 0);
  assert.equal(toKnownPrice('0'), 0);
  assert.equal(toKnownPrice('0.00'), 0);

  // Missing or negative values return null
  assert.equal(toKnownPrice(null), null);
  assert.equal(toKnownPrice(undefined), null);
  assert.equal(toKnownPrice(''), null);
  assert.equal(toKnownPrice(-15), null);

  // When a department is explicitly 0, total must compute as 0 (not null)
  const zeroQuote = buildCustomQuote(
    { departmentPrices: { 'admin.dept.offers': { monthly: 0, yearly: 0 } } },
    { selectedDepartments: ['admin.dept.offers'], employeeSeats: 0, billingPeriod: 'شهري' }
  );
  assert.equal(zeroQuote.hasUnknownPrices, false);
  assert.equal(zeroQuote.total, 0);

  // When a department has missing pricing, total must be null (never a false 0!)
  const missingQuote = buildCustomQuote(
    { departmentPrices: {} },
    { selectedDepartments: ['admin.dept.real_estate'], employeeSeats: 0, billingPeriod: 'شهري' }
  );
  assert.equal(missingQuote.hasUnknownPrices, true);
  assert.equal(missingQuote.total, null);
});

test('subscriptions/new page offers ready packages with server pricing and scoped CSS', () => {
  // Scoped CSS module import & usage
  assert.match(newPageSource, /import\s+styles\s+from\s+["']\.\/subscription-redesign\.module\.css["']/);
  assert.match(newPageSource, /className=\{styles\.subscriptionPage\}/);
  assert.match(newPageSource, /className=\{styles\.packageGrid\}/);
  assert.match(newPageSource, /className=\{styles\.quoteSection\}/);

  // Real architectural artwork
  assert.match(newPageSource, /\/artworks\/chat05-subscriptions-arch\.svg/);

  // Production helper usage
  assert.match(newPageSource, /getPackagePrice\(selectedPackage, subscriptionType\)/);
  assert.match(newPageSource, /packagesError/);
  assert.doesNotMatch(renewPageSource, /mode=custom|تخصيص الإدارات/);
  assert.doesNotMatch(newPageSource, /emptyGlobalPricing/);

  // Retry & Pending Mutex
  assert.match(newPageSource, /fetchData/);
  assert.match(newPageSource, /RotateCcw/);
  assert.match(newPageSource, /if\s*\(creating\)\s*return;/);
  assert.match(newPageSource, /isSubmitDisabled/);
  assert.match(newPageSource, /disabled=\{isSubmitDisabled\}/);

  // Contract invariants
  assert.match(newPageSource, /packageAdministrations=\{previewPackage\?\.administrations\}/);
  assert.doesNotMatch(newPageSource, />\s*اشتراك مخصص\s*<\/button>/);
});

test('internal/renew-subscription page enforces guest redirect, retry, real data, and existing payment flow', () => {
  // Guest return target
  assert.match(renewPageSource, /import\s*\{[^}]*loginHref[^}]*\}\s*from\s*["']@\/lib\/auth-navigation["']/);
  assert.match(renewPageSource, /loginHref\(["']\/internal\/renew-subscription["']\)/);

  // Scoped CSS module from chat05 components
  assert.match(renewPageSource, /import\s+styles\s+from\s+["']@\/components\/redesign\/chat05\/renew-subscription\.module\.css["']/);
  assert.match(renewPageSource, /className=\{styles\.renewPage\}/);
  assert.match(renewPageSource, /className=\{styles\.heroSection\}/);
  assert.match(renewPageSource, /className=\{styles\.statusCard\}/);

  // Real architectural artwork
  assert.match(renewPageSource, /\/artworks\/chat05-subscriptions-arch\.svg/);

  // Pending & Retry state
  assert.match(renewPageSource, /fetchError/);
  assert.match(renewPageSource, /loadStatus/);
  assert.match(renewPageSource, /RotateCcw/);

  // Real data: amount formatted with SaudiRiyalAmount, real status, dates
  assert.match(renewPageSource, /SaudiRiyalAmount/);
  assert.match(renewPageSource, /currentSub\?\.amount/);
  assert.match(renewPageSource, /status\?\.active/);
  assert.match(renewPageSource, /isPendingPayment/);

  // Existing payment flow: directs to /wallet?subscription= and /subscriptions/new
  assert.match(renewPageSource, /\/wallet\?subscription=/);
  assert.match(renewPageSource, /\/subscriptions\/new/);

  // Invariant: no invented renewal endpoint or confirmed payment claim
  assert.doesNotMatch(renewPageSource, /api\.post\(["']\/subscriptions\/renew["']/);
  assert.doesNotMatch(renewPageSource, /api\.post\(["']\/subscriptions\/.*\/renew["']/);
  assert.doesNotMatch(renewPageSource, /تم تأكيد الدفع/);
  assert.doesNotMatch(renewPageSource, /Payment confirmed/i);
});

test('stylesheets are valid CSS modules with local scoping and reduced motion support', () => {
  // Both stylesheets have reduced motion media query
  assert.match(newCssSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(renewCssSource, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);

  // Both stylesheets have scoped dark mode
  assert.match(newCssSource, /:global\(\.dark\)\s+\.subscriptionPage/);
  assert.match(renewCssSource, /:global\(\.dark\)\s+\.renewPage/);

  // Focus visible outline exists
  assert.match(newCssSource, /:focus-visible/);
  assert.match(renewCssSource, /:focus-visible/);
});
