const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadHelper() {
  const context = { exports: {}, URLSearchParams, Set, Array, Object, String, Number, isNaN };
  const source = fs.readFileSync(require.resolve('../lib/redesign-department-navigation.ts'), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('canonicalDeptSlug normalizes department slugs correctly', () => {
  const { canonicalDeptSlug } = loadHelper();
  assert.equal(canonicalDeptSlug('financial'), 'finance');
  assert.equal(canonicalDeptSlug('FINANCE'), 'finance');
  assert.equal(canonicalDeptSlug('employee'), 'employees');
  assert.equal(canonicalDeptSlug('employees'), 'employees');
  assert.equal(canonicalDeptSlug('property'), 'properties');
  assert.equal(canonicalDeptSlug('property_management'), 'properties');
  assert.equal(canonicalDeptSlug('pm'), 'properties');
  assert.equal(canonicalDeptSlug('legal'), 'legal');
  assert.equal(canonicalDeptSlug('marketing'), 'marketing');
  assert.equal(canonicalDeptSlug(''), '');
  assert.equal(canonicalDeptSlug(null), '');
  assert.equal(canonicalDeptSlug(undefined), '');
});

test('getDefaultSectionForDept assigns canonical defaults for bare departments', () => {
  const { getDefaultSectionForDept } = loadHelper();
  assert.equal(getDefaultSectionForDept('properties'), 'properties');
  assert.equal(getDefaultSectionForDept('legal'), 'legal');
  assert.equal(getDefaultSectionForDept('marketing'), 'marketing');
  assert.equal(getDefaultSectionForDept('employees'), 'users');
  assert.equal(getDefaultSectionForDept('finance'), 'financial');
  assert.equal(getDefaultSectionForDept('financial'), 'financial');
});

test('isSupportedWorkspaceSection identifies supported workspace sections', () => {
  const { isSupportedWorkspaceSection } = loadHelper();
  const valid = ['properties', 'financial', 'legal', 'marketing', 'users', 'offers', 'orders', 'subscriptions', 'service-requests'];
  for (const s of valid) {
    assert.equal(isSupportedWorkspaceSection(s), true, `Expected ${s} to be supported`);
  }
  const invalid = ['dashboard', 'payments', 'expenses', 'transactions', 'reports', 'unknown', ''];
  for (const s of invalid) {
    assert.equal(isSupportedWorkspaceSection(s), false, `Expected ${s} to be unsupported`);
  }
});

test('DEPARTMENT_HUB_LINKS uses canonical supported sections without dashboard alias', () => {
  const { DEPARTMENT_HUB_LINKS } = loadHelper();
  assert.equal(DEPARTMENT_HUB_LINKS.properties.section, 'properties');
  assert.equal(DEPARTMENT_HUB_LINKS.properties.href.includes('section=properties'), true);
  assert.equal(DEPARTMENT_HUB_LINKS.properties.href.includes('section=dashboard'), false);

  assert.equal(DEPARTMENT_HUB_LINKS.finance.section, 'financial');
  assert.equal(DEPARTMENT_HUB_LINKS.employees.section, 'users');
  assert.equal(DEPARTMENT_HUB_LINKS.legal.section, 'legal');
  assert.equal(DEPARTMENT_HUB_LINKS.marketing.section, 'marketing');
});

test('resolveDepartmentNavigation resolves bare departments deterministically', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  const prop = resolveDepartmentNavigation('properties', '');
  assert.equal(prop.canonicalDept, 'properties');
  assert.equal(prop.canonicalSection, 'properties');
  assert.equal(prop.needsReplace, false);

  const legal = resolveDepartmentNavigation('legal', '');
  assert.equal(legal.canonicalDept, 'legal');
  assert.equal(legal.canonicalSection, 'legal');
  assert.equal(legal.needsReplace, false);

  const mkt = resolveDepartmentNavigation('marketing', '');
  assert.equal(mkt.canonicalDept, 'marketing');
  assert.equal(mkt.canonicalSection, 'marketing');
  assert.equal(mkt.needsReplace, false);

  const emp = resolveDepartmentNavigation('employees', '');
  assert.equal(emp.canonicalDept, 'employees');
  assert.equal(emp.canonicalSection, 'users');
  assert.equal(emp.needsReplace, false);

  const fin = resolveDepartmentNavigation('finance', '');
  assert.equal(fin.canonicalDept, 'finance');
  assert.equal(fin.canonicalSection, 'financial');
  assert.equal(fin.canonicalFinancialTab, 'dashboard');
  assert.equal(fin.needsReplace, false);
});

test('resolveDepartmentNavigation normalizes unsupported dashboard alias to properties', () => {
  const { resolveDepartmentNavigation } = loadHelper();
  const res = resolveDepartmentNavigation('properties', 'view=properties&section=dashboard');
  assert.equal(res.canonicalDept, 'properties');
  assert.equal(res.canonicalSection, 'properties');
  assert.equal(res.needsReplace, true);
  assert.equal(res.targetUrl.includes('section=properties'), true);
  assert.equal(res.targetUrl.includes('section=dashboard'), false);
  assert.equal(res.targetUrl.includes('view=properties'), true);
});

test('resolveDepartmentNavigation preserves valid real subsections on properties', () => {
  const { resolveDepartmentNavigation } = loadHelper();
  
  const offers = resolveDepartmentNavigation('properties', 'section=offers');
  assert.equal(offers.canonicalSection, 'offers');
  assert.equal(offers.needsReplace, false);

  const orders = resolveDepartmentNavigation('properties', 'section=orders');
  assert.equal(orders.canonicalSection, 'orders');
  assert.equal(orders.needsReplace, false);

  const props = resolveDepartmentNavigation('properties', 'section=properties');
  assert.equal(props.canonicalSection, 'properties');
  assert.equal(props.needsReplace, false);
});

test('resolveDepartmentNavigation maps raw finance subtab to canonical tab without breaking workspace section', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  const payments = resolveDepartmentNavigation('finance', 'section=payments');
  assert.equal(payments.canonicalSection, 'financial');
  assert.equal(payments.canonicalFinancialTab, 'payments');
  assert.equal(payments.needsReplace, true);
  assert.equal(payments.targetUrl.includes('section=financial'), true);
  assert.equal(payments.targetUrl.includes('tab=payments'), true);

  const tx = resolveDepartmentNavigation('finance', 'section=transactions');
  assert.equal(tx.canonicalSection, 'financial');
  assert.equal(tx.canonicalFinancialTab, 'transactions');
  assert.equal(tx.needsReplace, true);
  assert.equal(tx.targetUrl.includes('section=financial'), true);
  assert.equal(tx.targetUrl.includes('tab=transactions'), true);

  const canon = resolveDepartmentNavigation('finance', 'section=financial&tab=payments');
  assert.equal(canon.canonicalSection, 'financial');
  assert.equal(canon.canonicalFinancialTab, 'payments');
  assert.equal(canon.needsReplace, false);
});

test('resolveDepartmentNavigation normalizes employees and department slug aliases', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  const emp = resolveDepartmentNavigation('employees', 'section=employees');
  assert.equal(emp.canonicalSection, 'users');
  assert.equal(emp.needsReplace, true);
  assert.equal(emp.targetUrl.includes('section=users'), true);

  const slug = resolveDepartmentNavigation('financial', 'section=financial');
  assert.equal(slug.canonicalDept, 'finance');
  assert.equal(slug.needsReplace, true);
  assert.equal(slug.targetUrl.startsWith('/internal/finance'), true);
});

test('canAccessDepartment enforces access rules and preserves explicit denies', () => {
  const { canAccessDepartment } = loadHelper();

  // Admin access
  assert.equal(canAccessDepartment({ role: 'admin' }, 'finance'), true);
  assert.equal(canAccessDepartment({ role: 'admin' }, 'properties'), true);

  // Finance alias support
  assert.equal(canAccessDepartment({ departments: ['finance'] }, 'finance'), true);
  assert.equal(canAccessDepartment({ departments: ['financial'] }, 'finance'), true);
  assert.equal(canAccessDepartment({ departmentPermissions: { financial: 'view' } }, 'finance'), true);
  assert.equal(canAccessDepartment({ departmentPermissions: { finance: 'manage' } }, 'finance'), true);

  // Explicit denies stay denied
  assert.equal(canAccessDepartment({ departments: ['finance'], departmentPermissions: { finance: 'none' } }, 'finance'), false);
  assert.equal(canAccessDepartment({ departments: ['finance'], departmentPermissions: { financial: 'none' } }, 'finance'), false);
  assert.equal(canAccessDepartment({ departments: ['financial'], departmentPermissions: { financial: 'none' } }, 'finance'), false);
  assert.equal(canAccessDepartment({ departments: ['financial'], departmentPermissions: { finance: false } }, 'finance'), false);

  // Properties / Offers / Orders sub-module access
  assert.equal(canAccessDepartment({ departments: ['properties'] }, 'properties'), true);
  assert.equal(canAccessDepartment({ departments: ['offers'] }, 'properties'), true);
  assert.equal(canAccessDepartment({ departments: ['orders'] }, 'properties'), true);
  assert.equal(canAccessDepartment({ departmentPermissions: { offers: 'view' } }, 'properties'), true);
  assert.equal(canAccessDepartment({ departmentPermissions: { properties: 'none' } }, 'properties'), false);

  // Employees access & denies
  assert.equal(canAccessDepartment({ departments: ['employees'] }, 'employees'), true);
  assert.equal(canAccessDepartment({ departmentPermissions: { employees: 'view' } }, 'employees'), true);
  assert.equal(canAccessDepartment({ departments: ['employees'], departmentPermissions: { employees: 'none' } }, 'employees'), false);

  // Denied user with no roles
  assert.equal(canAccessDepartment({ departments: [] }, 'legal'), false);
  assert.equal(canAccessDepartment(null, 'properties'), false);
});

test('formatSummaryStat returns unavailable instead of false zero on failure', () => {
  const { formatSummaryStat } = loadHelper();

  const success = formatSummaryStat(1250, false);
  assert.equal(success.isUnavailable, false);
  assert.equal(success.displayValue, '1,250');

  const zeroSuccess = formatSummaryStat(0, false);
  assert.equal(zeroSuccess.isUnavailable, false);
  assert.equal(zeroSuccess.displayValue, '0');

  const errorFailure = formatSummaryStat(0, true);
  assert.equal(errorFailure.isUnavailable, true);
  assert.equal(errorFailure.displayValue, null);

  const nullFailure = formatSummaryStat(null, false);
  assert.equal(nullFailure.isUnavailable, true);
  assert.equal(nullFailure.displayValue, null);
});

test('resolveDepartmentNavigation handles duck-typed Next.js searchParams and plain objects', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  // Duck-typed ReadonlyURLSearchParams mock
  const mockParams = {
    toString() { return 'section=payments'; },
    get(key) { return key === 'section' ? 'payments' : null; },
  };
  const res = resolveDepartmentNavigation('finance', mockParams);
  assert.equal(res.canonicalSection, 'financial');
  assert.equal(res.canonicalFinancialTab, 'payments');
  assert.equal(res.needsReplace, true);
  assert.equal(res.targetUrl.includes('tab=payments'), true);

  // Plain object input
  const plainObj = { section: 'orders' };
  const propRes = resolveDepartmentNavigation('properties', plainObj);
  assert.equal(propRes.canonicalSection, 'orders');
  assert.equal(propRes.needsReplace, false);
});

test('resolveDepartmentNavigation keeps canonical reloads and history free of replace loops', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  const canonicalProps = resolveDepartmentNavigation('properties', 'section=properties');
  assert.equal(canonicalProps.needsReplace, false);
  assert.equal(canonicalProps.canonicalSection, 'properties');

  const canonicalLegal = resolveDepartmentNavigation('legal', 'section=legal');
  assert.equal(canonicalLegal.needsReplace, false);
  assert.equal(canonicalLegal.canonicalSection, 'legal');

  const canonicalMarketing = resolveDepartmentNavigation('marketing', 'section=marketing');
  assert.equal(canonicalMarketing.needsReplace, false);
  assert.equal(canonicalMarketing.canonicalSection, 'marketing');

  const canonicalUsers = resolveDepartmentNavigation('employees', 'section=users');
  assert.equal(canonicalUsers.needsReplace, false);
  assert.equal(canonicalUsers.canonicalSection, 'users');

  const canonicalFin = resolveDepartmentNavigation('finance', 'section=financial&tab=expenses');
  assert.equal(canonicalFin.needsReplace, false);
  assert.equal(canonicalFin.canonicalSection, 'financial');
  assert.equal(canonicalFin.canonicalFinancialTab, 'expenses');
});

test('resolveDepartmentNavigation normalizes all financial subtabs', () => {
  const { resolveDepartmentNavigation } = loadHelper();
  const subtabs = ['payments', 'transactions', 'expenses', 'reports', 'settlements', 'service_requests'];

  for (const tab of subtabs) {
    const res = resolveDepartmentNavigation('finance', `section=${tab}`);
    assert.equal(res.canonicalSection, 'financial', `Expected section=financial for raw ${tab}`);
    assert.equal(res.canonicalFinancialTab, tab, `Expected tab=${tab}`);
    assert.equal(res.needsReplace, true);
    assert.equal(res.targetUrl.includes(`tab=${tab}`), true);
  }
});

test('resolveDepartmentNavigation normalizes invalid sections to canonical defaults', () => {
  const { resolveDepartmentNavigation } = loadHelper();

  const badLegal = resolveDepartmentNavigation('legal', 'section=invalid_xyz');
  assert.equal(badLegal.canonicalSection, 'legal');
  assert.equal(badLegal.needsReplace, true);
  assert.equal(badLegal.targetUrl.includes('section=legal'), true);

  const badMarketing = resolveDepartmentNavigation('marketing', 'section=invalid_xyz');
  assert.equal(badMarketing.canonicalSection, 'marketing');
  assert.equal(badMarketing.needsReplace, true);
  assert.equal(badMarketing.targetUrl.includes('section=marketing'), true);

  const badProp = resolveDepartmentNavigation('properties', 'section=invalid_xyz');
  assert.equal(badProp.canonicalSection, 'properties');
  assert.equal(badProp.needsReplace, true);
  assert.equal(badProp.targetUrl.includes('section=properties'), true);
});

