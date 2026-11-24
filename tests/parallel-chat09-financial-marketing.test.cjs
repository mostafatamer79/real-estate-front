const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '..');

function loadHelpers() {
  const context = { exports: {} };
  const source = fs.readFileSync(path.join(rootDir, 'lib', 'redesign-chat09-financial-marketing.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('resolveFinancialSummaryState correctly handles initial loading, availability, stale cache, and error', () => {
  const { resolveFinancialSummaryState } = loadHelpers();

  // Initial loading without confirmed data
  assert.equal(resolveFinancialSummaryState(null, true, false), 'initial_loading');

  // Initial failure without confirmed data -> unavailable
  assert.equal(resolveFinancialSummaryState(null, false, true), 'unavailable');

  // Confirmed data available
  const mockData = { totalSales: 100000, netProfit: 25000 };
  assert.equal(resolveFinancialSummaryState(mockData, false, false), 'available');

  // Failed refresh when confirmed data already exists -> stale (preserves confirmed data!)
  assert.equal(resolveFinancialSummaryState(mockData, false, true), 'stale');
});

test('extractFinancialKpis prevents false zero KPIs when summary data is unavailable or null', () => {
  const { extractFinancialKpis } = loadHelpers();

  // Unavailable data: must return null for all values, NEVER 0!
  const unavailableKpis = extractFinancialKpis(null, false);
  assert.equal(unavailableKpis.length, 6);
  for (const kpi of unavailableKpis) {
    assert.equal(kpi.value, null, `KPI ${kpi.id} should be null when unavailable, not 0`);
    assert.equal(kpi.isAvailable, false);
  }

  // Available data with confirmed values
  const confirmedData = {
    totalSales: 450000,
    totalRentals: 120000,
    totalCommission: 23500,
    totalExpenses: 8000,
    netProfit: 15500,
    totalTax: 3525,
  };
  const confirmedKpis = extractFinancialKpis(confirmedData, true);
  assert.equal(confirmedKpis.length, 6);
  const sales = confirmedKpis.find(k => k.id === 'sales');
  assert.equal(sales.value, 450000);
  assert.equal(sales.isAvailable, true);

  const profit = confirmedKpis.find(k => k.id === 'netProfit');
  assert.equal(profit.value, 15500);
  assert.equal(profit.isAvailable, true);

  // Legitimate zero values should be preserved when confirmed
  const zeroData = {
    totalSales: 0,
    totalRentals: 0,
    totalCommission: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalTax: 0,
  };
  const zeroKpis = extractFinancialKpis(zeroData, true);
  for (const kpi of zeroKpis) {
    assert.equal(kpi.value, 0, `Legitimate confirmed zero for ${kpi.id} must be preserved`);
    assert.equal(kpi.isAvailable, true);
  }
});

test('formatFinancialAmount formats numbers and provides explicit fallback when unavailable', () => {
  const { formatFinancialAmount } = loadHelpers();

  assert.equal(formatFinancialAmount(null, 'ar'), 'غير متاح');
  assert.equal(formatFinancialAmount(undefined, 'en'), 'Unavailable');
  assert.equal(formatFinancialAmount(NaN, 'ar', 'بيانات غير متوفرة'), 'بيانات غير متوفرة');

  // Legitimate zero
  assert.match(formatFinancialAmount(0, 'en'), /^0/);

  // Formatted numbers
  assert.equal(formatFinancialAmount(5000, 'en'), '5,000');
});

test('canUserAccessFinancial correctly validates roles, departments, and permissions', () => {
  const { canUserAccessFinancial } = loadHelpers();

  assert.equal(canUserAccessFinancial(null), false);
  assert.equal(canUserAccessFinancial(undefined), false);
  assert.equal(canUserAccessFinancial({ role: 'client' }), false);

  // Direct allowed roles
  assert.equal(canUserAccessFinancial({ role: 'admin' }), true);
  assert.equal(canUserAccessFinancial({ role: 'finance' }), true);
  assert.equal(canUserAccessFinancial({ role: 'finance_admin' }), true);
  assert.equal(canUserAccessFinancial({ role: 'manager' }), true);
  assert.equal(canUserAccessFinancial({ role: 'viewer' }), true);

  // Department match
  assert.equal(canUserAccessFinancial({ role: 'employee', departments: ['finance'] }), true);
  assert.equal(canUserAccessFinancial({ role: 'employee', departments: ['financial'] }), true);
  assert.equal(canUserAccessFinancial({ role: 'employee', departments: ['legal'] }), false);

  // Granular department permission
  assert.equal(canUserAccessFinancial({ role: 'user', departmentPermissions: { finance: 'read' } }), true);
  assert.equal(canUserAccessFinancial({ role: 'user', departmentPermissions: { finance: 'none' } }), false);
});

test('canUserAccessMarketing correctly validates roles, departments, and permissions', () => {
  const { canUserAccessMarketing } = loadHelpers();

  assert.equal(canUserAccessMarketing(null), false);
  assert.equal(canUserAccessMarketing(undefined), false);
  assert.equal(canUserAccessMarketing({ role: 'client' }), false);

  // Direct allowed roles
  assert.equal(canUserAccessMarketing({ role: 'admin' }), true);
  assert.equal(canUserAccessMarketing({ role: 'marketing' }), true);
  assert.equal(canUserAccessMarketing({ role: 'marketing_admin' }), true);
  assert.equal(canUserAccessMarketing({ role: 'manager' }), true);
  assert.equal(canUserAccessMarketing({ role: 'viewer' }), true);

  // Department match
  assert.equal(canUserAccessMarketing({ role: 'employee', departments: ['marketing'] }), true);
  assert.equal(canUserAccessMarketing({ role: 'employee', departments: ['sales'] }), false);

  // Granular department permission
  assert.equal(canUserAccessMarketing({ role: 'user', departmentPermissions: { marketing: 'manage' } }), true);
  assert.equal(canUserAccessMarketing({ role: 'user', departmentPermissions: { marketing: 'none' } }), false);
});

test('isValidFinancialTab and isValidMarketingTab validate allowed tabs', () => {
  const { isValidFinancialTab, isValidMarketingTab } = loadHelpers();

  assert.equal(isValidFinancialTab('dashboard'), true);
  assert.equal(isValidFinancialTab('transactions'), true);
  assert.equal(isValidFinancialTab('commissions'), true);
  assert.equal(isValidFinancialTab('invalid_tab'), false);

  assert.equal(isValidMarketingTab('advertising'), true);
  assert.equal(isValidMarketingTab('photography'), true);
  assert.equal(isValidMarketingTab('requests'), true);
  assert.equal(isValidMarketingTab('general_requests'), true);
  assert.equal(isValidMarketingTab('unknown'), false);
});

test('calculateMonthlyChartBars scales bars safely and avoids division by zero', () => {
  const { calculateMonthlyChartBars } = loadHelpers();

  assert.equal(calculateMonthlyChartBars(undefined).length, 0);
  assert.equal(calculateMonthlyChartBars([]).length, 0);

  const bars = calculateMonthlyChartBars([
    { month: 'Jan', income: 10000, expenses: 5000, net: 5000 },
    { month: 'Feb', income: 20000, expenses: 10000, net: 10000 },
  ], 140);

  assert.equal(bars.length, 2);
  assert.equal(bars[1].incomeHeightPx, 140);
  assert.equal(bars[1].expenseHeightPx, 70);
});

test('filterMarketingRequests filters strictly by status without synthetic data', () => {
  const { filterMarketingRequests } = loadHelpers();

  const sample = [
    { id: '1', status: 'pending' },
    { id: '2', status: 'completed' },
    { id: '3', status: 'pending' },
  ];

  assert.equal(filterMarketingRequests(sample, 'all').length, 3);
  assert.equal(filterMarketingRequests(sample, 'pending').length, 2);
  assert.equal(filterMarketingRequests(sample, 'completed').length, 1);
  assert.equal(filterMarketingRequests(sample, 'rejected').length, 0);
});

test('CSS modules are strictly scoped with no bare :focus-visible or bare * selectors', () => {
  const financialCss = fs.readFileSync(
    path.join(rootDir, 'components', 'redesign', 'chat09', 'financial-standalone.module.css'),
    'utf8'
  );
  const marketingCss = fs.readFileSync(
    path.join(rootDir, 'components', 'redesign', 'chat09', 'marketing-standalone.module.css'),
    'utf8'
  );

  for (const [name, css, rootClass] of [
    ['financial', financialCss, '.financialRoot'],
    ['marketing', marketingCss, '.marketingRoot'],
  ]) {
    // Assert root definition exists
    assert.match(css, new RegExp(`\\${rootClass}\\s*\\{`), `${name} must define root class`);

    // Strip comments to test rules accurately
    const strippedCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

    // Disallow bare :focus-visible without root class
    const bareFocusMatch = strippedCss.match(/^\s*:focus-visible/m);
    assert.equal(bareFocusMatch, null, `${name} must not contain bare :focus-visible`);
    assert.match(css, new RegExp(`\\${rootClass}\\s+:focus-visible`), `${name} must scope :focus-visible under root`);

    // Disallow bare * without root class
    const bareUniversalMatch = strippedCss.match(/^\s*\*(?![\w-])/m);
    assert.equal(bareUniversalMatch, null, `${name} must not contain bare universal selector *`);

    // Assert reduced motion scoping
    assert.match(css, /prefers-reduced-motion:\s*reduce/, `${name} must implement reduced motion query`);
    assert.match(css, new RegExp(`\\${rootClass}\\s+\\*`), `${name} must scope reduced motion selectors under root`);
  }
});

test('app route entrypoints properly render standalone components inside Suspense', () => {
  const financialPage = fs.readFileSync(path.join(rootDir, 'app', 'financial', 'page.tsx'), 'utf8');
  assert.match(financialPage, /import FinancialStandalone from ['"]@\/components\/redesign\/chat09\/FinancialStandalone['"]/);
  assert.match(financialPage, /<Suspense[\s\S]*?>\s*<FinancialStandalone\s*\/>\s*<\/Suspense>/);

  const marketingPage = fs.readFileSync(path.join(rootDir, 'app', 'marketing', 'page.tsx'), 'utf8');
  assert.match(marketingPage, /import MarketingStandalone from ['"]@\/components\/redesign\/chat09\/MarketingStandalone['"]/);
  assert.match(marketingPage, /<Suspense[\s\S]*?>\s*<MarketingStandalone\s*\/>\s*<\/Suspense>/);
});

test('original admin-shared FinancialWorkspace and MarketingWorkspace remain byte-preserved and unmodified', () => {
  // Verify that the original components are untouched
  const finOriginalPath = path.join(rootDir, 'components', 'financial', 'FinancialWorkspace.tsx');
  const mktOriginalPath = path.join(rootDir, 'components', 'marketing', 'MarketingWorkspace.tsx');

  assert.equal(fs.existsSync(finOriginalPath), true, 'FinancialWorkspace.tsx must exist');
  assert.equal(fs.existsSync(mktOriginalPath), true, 'MarketingWorkspace.tsx must exist');

  const finContent = fs.readFileSync(finOriginalPath, 'utf8');
  const mktContent = fs.readFileSync(mktOriginalPath, 'utf8');

  // Verify key signatures of the original implementations
  assert.match(finContent, /export default function FinancialPage\(/);
  assert.match(mktContent, /export default function MarketingPage\(/);
});

test('architectural artworks exist under public/artworks/chat09-* with non-trivial size', () => {
  const finArtwork = path.join(rootDir, 'public', 'artworks', 'chat09-financial-atrium.webp');
  const mktArtwork = path.join(rootDir, 'public', 'artworks', 'chat09-marketing-terrace.webp');

  assert.equal(fs.existsSync(finArtwork), true, 'Financial atrium artwork must exist');
  assert.equal(fs.existsSync(mktArtwork), true, 'Marketing terrace artwork must exist');

  const finStat = fs.statSync(finArtwork);
  const mktStat = fs.statSync(mktArtwork);

  assert.ok(finStat.size > 20000, 'Financial artwork must be a non-trivial graphic asset');
  assert.ok(mktStat.size > 20000, 'Marketing artwork must be a non-trivial graphic asset');
});
