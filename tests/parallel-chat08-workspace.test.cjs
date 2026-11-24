const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const rootDir = path.resolve(__dirname, '..');

function loadHelpers() {
  const context = {
    exports: {},
    require: (modulePath) => {
      if (modulePath === './redesign-department-navigation' || modulePath === '@/lib/redesign-department-navigation') {
        const depSource = fs.readFileSync(path.join(rootDir, 'lib', 'redesign-department-navigation.ts'), 'utf8');
        const transpiled = ts.transpileModule(depSource, {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText;
        const depContext = { exports: {} };
        vm.runInNewContext(transpiled, depContext);
        return depContext.exports;
      }
      return require(modulePath);
    },
  };

  const source = fs.readFileSync(path.join(rootDir, 'lib', 'redesign-chat08-business-management.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('canUserMutateFinancials enforces strict server-compatible role and department permissions', () => {
  const { canUserMutateFinancials } = loadHelpers();

  // Null or undefined user
  assert.equal(canUserMutateFinancials(null), false, 'Null user cannot mutate financials');
  assert.equal(canUserMutateFinancials(undefined), false, 'Undefined user cannot mutate financials');

  // Admin user
  assert.equal(canUserMutateFinancials({ role: 'admin' }), true, 'Admin role can mutate financials');
  assert.equal(canUserMutateFinancials({ role: 'ADMIN' }), true, 'ADMIN uppercase role can mutate financials');

  // User with finance or legal department
  assert.equal(canUserMutateFinancials({ role: 'agent', departments: ['finance'] }), true, 'Finance user can mutate financials');
  assert.equal(canUserMutateFinancials({ role: 'agent', departments: ['legal'] }), true, 'Legal user can mutate financials');

  // User with other department without finance/legal
  assert.equal(canUserMutateFinancials({ role: 'agent', departments: ['marketing'] }), false, 'Marketing user cannot mutate financials');
  assert.equal(canUserMutateFinancials({ role: 'client', departments: [] }), false, 'Regular client cannot mutate financials');

  // User with revoked / "none" department permission
  assert.equal(
    canUserMutateFinancials({
      role: 'agent',
      departments: ['finance'],
      departmentPermissions: { finance: 'none' },
    }),
    false,
    'Revoked finance permissions must be rejected'
  );
});

test('resolveWorkspaceFinancialState preserves truthful states and never disguises failure as zero', () => {
  const { resolveWorkspaceFinancialState } = loadHelpers();

  // Loading state
  assert.equal(resolveWorkspaceFinancialState(null, null, false, true), 'loading');

  // Error state
  assert.equal(resolveWorkspaceFinancialState(null, null, true, false), 'error');
  assert.equal(resolveWorkspaceFinancialState([], [], true, false), 'error');

  // Missing data treated as error
  assert.equal(resolveWorkspaceFinancialState(null, null, false, false), 'error');

  // Empty data
  assert.equal(resolveWorkspaceFinancialState([], [], false, false), 'empty');

  // Available data
  assert.equal(resolveWorkspaceFinancialState([{ id: 1 }], [{ id: 10 }], false, false), 'available');
});

test('calculateWorkspaceFinancialTotals never converts errors or missing data into fake 0 SAR', () => {
  const { calculateWorkspaceFinancialTotals } = loadHelpers();

  // Error case: totals must be null, isAvailable must be false
  const errTotals = calculateWorkspaceFinancialTotals(null, null, true);
  assert.equal(errTotals.isAvailable, false);
  assert.equal(errTotals.totalIncome, null);
  assert.equal(errTotals.leasesCount, null);
  assert.equal(errTotals.paidPaymentsCount, null);

  // Valid data case
  const mockLeases = [
    { rentAmount: 3000, status: 'active' },
    { rentAmount: 4500, status: 'active' },
  ];
  const mockPayments = [
    { amount: 3000, status: 'paid' },
    { amount: 4500, status: 'completed' },
    { amount: 3000, status: 'pending' },
  ];

  const validTotals = calculateWorkspaceFinancialTotals(mockLeases, mockPayments, false);
  assert.equal(validTotals.isAvailable, true);
  assert.equal(validTotals.totalIncome, 7500);
  assert.equal(validTotals.paidPaymentsCount, 2);
  assert.equal(validTotals.pendingPaymentsCount, 1);
  assert.equal(validTotals.leasesCount, 2);
});

test('getMobileSidebarClasses ensures drawer never exceeds 320px viewport', () => {
  const { getMobileSidebarClasses } = loadHelpers();

  const closedClasses = getMobileSidebarClasses(false);
  assert.match(closedClasses, /w-\[min\(21rem,calc\(100vw-1rem\)\)\]/);
  assert.match(closedClasses, /max-w-\[calc\(100vw-1rem\)\]/);
  assert.match(closedClasses, /-translate-x-full/);

  const openClasses = getMobileSidebarClasses(true);
  assert.match(openClasses, /w-\[min\(21rem,calc\(100vw-1rem\)\)\]/);
  assert.match(openClasses, /translate-x-0/);
});

test('getMobileToggleAria provides bilingual accessible names and state', () => {
  const { getMobileToggleAria } = loadHelpers();

  const arClosed = getMobileToggleAria(false, 'ar');
  assert.equal(arClosed['aria-label'], 'فتح القائمة الجانبية');
  assert.equal(arClosed['aria-expanded'], false);
  assert.equal(arClosed['aria-controls'], 'bm-workspace-sidebar');

  const arOpen = getMobileToggleAria(true, 'ar');
  assert.equal(arOpen['aria-label'], 'إغلاق القائمة الجانبية');
  assert.equal(arOpen['aria-expanded'], true);

  const enClosed = getMobileToggleAria(false, 'en');
  assert.equal(enClosed['aria-label'], 'Open sidebar');
  assert.equal(enClosed['aria-expanded'], false);

  const enOpen = getMobileToggleAria(true, 'en');
  assert.equal(enOpen['aria-label'], 'Close sidebar');
  assert.equal(enOpen['aria-expanded'], true);
});

test('normalizeWorkspaceSection maps query parameters to canonical sections', () => {
  const { normalizeWorkspaceSection, resolveInitialFinancialTab } = loadHelpers();

  assert.equal(normalizeWorkspaceSection('dashboard'), 'properties');
  assert.equal(normalizeWorkspaceSection('portfolio'), 'properties');
  assert.equal(normalizeWorkspaceSection('properties'), 'properties');
  assert.equal(normalizeWorkspaceSection('employee'), 'users');
  assert.equal(normalizeWorkspaceSection('employees'), 'users');
  assert.equal(normalizeWorkspaceSection('users'), 'users');
  assert.equal(normalizeWorkspaceSection('finance'), 'financial');
  assert.equal(normalizeWorkspaceSection('payments'), 'financial');
  assert.equal(normalizeWorkspaceSection('transactions'), 'financial');
  assert.equal(normalizeWorkspaceSection('legal'), 'legal');
  assert.equal(normalizeWorkspaceSection('marketing'), 'marketing');
  assert.equal(normalizeWorkspaceSection('orders'), 'orders');

  assert.equal(resolveInitialFinancialTab('payments'), 'payments');
  assert.equal(resolveInitialFinancialTab('transactions'), 'transactions');
  assert.equal(resolveInitialFinancialTab('expenses'), 'expenses');
  assert.equal(resolveInitialFinancialTab('properties'), null);
});

test('BuildingManagementWorkspace.tsx source satisfies all accessibility and permission requirements', () => {
  const workspaceSrc = fs.readFileSync(
    path.join(rootDir, 'components', 'properties', 'BuildingManagementWorkspace.tsx'),
    'utf8'
  );

  // 1. Mobile drawer 320px responsive constraints
  assert.match(workspaceSrc, /w-\[min\(21rem,calc\(100vw-1rem\)\)\]/, 'Drawer width must be bounded for 320px viewports');
  assert.match(workspaceSrc, /max-w-\[calc\(100vw-1rem\)\]/, 'Drawer max-width must prevent viewport overflow');

  // 2. Mobile toggle accessibility
  assert.match(workspaceSrc, /aria-controls="bm-workspace-sidebar"/, 'Toggle button must declare aria-controls');
  assert.match(workspaceSrc, /aria-expanded=\{isMobileSidebarOpen\}/, 'Toggle button must declare dynamic aria-expanded');
  assert.match(workspaceSrc, /id="bm-workspace-sidebar"/, 'Sidebar element must have id matching aria-controls');

  // 3. Offer map modal accessibility
  assert.match(workspaceSrc, /role="dialog"/, 'Offer map modal must declare role="dialog"');
  assert.match(workspaceSrc, /aria-modal="true"/, 'Offer map modal must declare aria-modal="true"');
  assert.match(workspaceSrc, /aria-labelledby="offer-map-modal-title"/, 'Offer map modal must declare aria-labelledby');
  assert.match(workspaceSrc, /offerMapTriggerRef/, 'Offer map trigger ref must be tracked for focus restoration');

  // 4. Financial error truthfulness
  assert.match(workspaceSrc, /financialError \?/, 'Financial section must check financialError');
  assert.match(workspaceSrc, /fetchFinancials\(\)/, 'Financial section must provide a retry action upon error');
  assert.doesNotMatch(workspaceSrc, /Annual Expenses.*amount=\{0\}/, 'Annual expenses must not hardcode 0 amount');

  // 5. Mutation permissions and pending state
  assert.match(workspaceSrc, /canMutateFinancials/, 'Financial actions must be guarded by canMutateFinancials');
  assert.match(workspaceSrc, /isMarkingPaid/, 'Mark paid button must track pending state');
  assert.match(workspaceSrc, /disabled=\{isMarkingPaid/, 'Mark paid button must disable during pending request');
});

test('app/buildingmanagement/page.tsx and app/internal/page.tsx contain accessible Suspense boundaries', () => {
  const bmPage = fs.readFileSync(path.join(rootDir, 'app', 'buildingmanagement', 'page.tsx'), 'utf8');
  const intPage = fs.readFileSync(path.join(rootDir, 'app', 'internal', 'page.tsx'), 'utf8');

  // BuildingManagement page Suspense
  assert.match(bmPage, /<Suspense/, 'BuildingManagement page must wrap workspace in Suspense');
  assert.match(bmPage, /role="status"/, 'BuildingManagement page Suspense fallback must include role="status"');
  assert.match(bmPage, /aria-live="polite"/, 'BuildingManagement page Suspense fallback must include aria-live="polite"');

  // Internal page Suspense
  assert.match(intPage, /<Suspense/, 'Internal page must wrap workspace in Suspense');
  assert.match(intPage, /role="status"/, 'Internal page Suspense fallback must include role="status"');
  assert.match(intPage, /aria-live="polite"/, 'Internal page Suspense fallback must include aria-live="polite"');
});
