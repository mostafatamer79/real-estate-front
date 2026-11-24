const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(relativePath) {
  const fullPath = require.resolve(relativePath);
  const source = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;

  const context = {
    exports: {},
    module: { exports: {} },
    require: (mod) => {
      if (mod.startsWith('./') || mod.startsWith('../')) {
        const path = require('node:path');
        const resolved = path.resolve(path.dirname(fullPath), mod);
        return loadModule(resolved.endsWith('.ts') ? resolved : `${resolved}.ts`);
      }
      return require(mod);
    },
    URLSearchParams,
    Set,
    Array,
    Object,
    String,
    Number,
    isNaN,
    console,
  };

  vm.runInNewContext(transpiled, context);
  return context.module.exports && Object.keys(context.module.exports).length > 0
    ? context.module.exports
    : context.exports;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Safe Party Extraction (Regression for `typeof null === 'object'` crash)
// ─────────────────────────────────────────────────────────────────────────────

test('safeExtractParty handles null without throwing TypeError (typeof null === "object" crash)', () => {
  const { safeExtractParty } = loadModule('../lib/redesign-chat10-disputes.ts');

  // CRITICAL REGRESSION: in JS, typeof null === 'object'.
  // Accessing null.name previously crashed the disputes page.
  const nullParty = safeExtractParty(null);
  assert.equal(nullParty.name, '—');

  const undefinedParty = safeExtractParty(undefined);
  assert.equal(undefinedParty.name, '—');

  const customFallback = safeExtractParty(null, 'غير متوفر');
  assert.equal(customFallback.name, 'غير متوفر');
});

test('safeExtractParty extracts names from strings, objects, and nested fields', () => {
  const { safeExtractParty } = loadModule('../lib/redesign-chat10-disputes.ts');

  const strParty = safeExtractParty('شركة إعمار العقارية');
  assert.equal(strParty.name, 'شركة إعمار العقارية');

  const objParty = safeExtractParty({
    name: 'سالم الدوسري',
    role: 'مدعي',
    phone: '0555555555',
    idNumber: '1029384756',
    city: 'الرياض',
  });
  assert.equal(objParty.name, 'سالم الدوسري');
  assert.equal(objParty.role, 'مدعي');
  assert.equal(objParty.phone, '0555555555');
  assert.equal(objParty.idNumber, '1029384756');
  assert.equal(objParty.city, 'الرياض');

  const titleParty = safeExtractParty({ title: 'مؤسسة الأفق للاستثمار' });
  assert.equal(titleParty.name, 'مؤسسة الأفق للاستثمار');

  const emptyObjParty = safeExtractParty({});
  assert.equal(emptyObjParty.name, '—');

  const numParty = safeExtractParty(998877);
  assert.equal(numParty.name, '998877');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dispute Status Configuration and Safe Handling
// ─────────────────────────────────────────────────────────────────────────────

test('getDisputeStatusConfig maps standard, alias, and fallback statuses safely', () => {
  const { getDisputeStatusConfig } = loadModule('../lib/redesign-chat10-disputes.ts');

  const inProg1 = getDisputeStatusConfig('inProgress');
  assert.equal(inProg1.labelAr, 'قيد المراجعة');
  assert.equal(inProg1.labelEn, 'Under Review');
  assert.equal(inProg1.dotClass.includes('animate-pulse'), true);

  const inProg2 = getDisputeStatusConfig('in_progress');
  assert.equal(inProg2.labelAr, 'قيد المراجعة');

  const completed = getDisputeStatusConfig('completed');
  assert.equal(completed.labelAr, 'مكتملة');

  const pending = getDisputeStatusConfig('pending');
  assert.equal(pending.labelAr, 'معلقة');

  const cancelled = getDisputeStatusConfig('cancelled');
  assert.equal(cancelled.labelAr, 'ملغاة');

  // Fallback for null, undefined, unknown string, or status 0
  const unknown1 = getDisputeStatusConfig(null);
  assert.equal(unknown1.labelAr, 'غير محدد');

  const unknown2 = getDisputeStatusConfig('custom_review');
  assert.equal(unknown2.labelAr, 'custom_review');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dispute Safe Filtering & Search
// ─────────────────────────────────────────────────────────────────────────────

test('filterDisputes filters safely across numbers, types, parties, and descriptions', () => {
  const { filterDisputes } = loadModule('../lib/redesign-chat10-disputes.ts');

  const disputes = [
    {
      id: '1',
      disputeNumber: 'DSP-101',
      disputeType: 'نزاع إيجاري',
      firstParty: { name: 'محمد القحطاني' },
      secondParty: 'شركة الأفق',
      disputeDescription: 'خلاف حول قيمة الصيانة الدورية',
    },
    {
      id: '2',
      disputeNumber: 'DSP-202',
      disputeType: 'نزاع ملكية',
      firstParty: null, // Note null party
      secondParty: { name: 'خالد العمري' },
      disputeDescription: 'تداخل حدود الصك الشرعي',
    },
  ];

  // Search by number
  assert.equal(filterDisputes(disputes, '101').length, 1);
  assert.equal(filterDisputes(disputes, '101')[0].id, '1');

  // Search by type
  assert.equal(filterDisputes(disputes, 'ملكية').length, 1);
  assert.equal(filterDisputes(disputes, 'ملكية')[0].id, '2');

  // Search by first party (including safe handling of null in second item)
  assert.equal(filterDisputes(disputes, 'القحطاني').length, 1);
  assert.equal(filterDisputes(disputes, 'العمري').length, 1);

  // Search by description
  assert.equal(filterDisputes(disputes, 'الصك').length, 1);

  // Empty query returns all
  assert.equal(filterDisputes(disputes, '').length, 2);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bilingual Fallback Text Helpers
// ─────────────────────────────────────────────────────────────────────────────

test('getDisputeText provides correct Arabic and English fallbacks', () => {
  const { getDisputeText } = loadModule('../lib/redesign-chat10-disputes.ts');

  assert.equal(getDisputeText('disputes.title', 'ar'), 'المنازعات العقارية');
  assert.equal(getDisputeText('disputes.title', 'en'), 'Real Estate Disputes');

  assert.equal(getDisputeText('disputes.details', 'ar'), 'تفاصيل القضية');
  assert.equal(getDisputeText('disputes.details', 'en'), 'Dispute Details');

  assert.equal(getDisputeText('disputes.firstParty', 'ar'), 'الطرف الأول');
  assert.equal(getDisputeText('disputes.secondParty', 'ar'), 'الطرف الثاني');

  assert.equal(getDisputeText('disputes.empty', 'ar'), 'لا توجد قضايا أو نزاعات مسجلة');

  // Custom translator takes precedence if available
  const customT = (key) => (key === 'disputes.title' ? 'قضايا ومنازعات مخصصة' : key);
  assert.equal(getDisputeText('disputes.title', 'ar', customT), 'قضايا ومنازعات مخصصة');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Numeral & Currency 0 Parsing
// ─────────────────────────────────────────────────────────────────────────────

test('parseLocaleNumber preserves currency 0 and handles Arabic-Indic digits', () => {
  const { parseLocaleNumber } = loadModule('../lib/redesign-chat10-requests.ts');

  // Standard numbers
  assert.equal(parseLocaleNumber('250'), 250);
  assert.equal(parseLocaleNumber(250), 250);

  // Arabic-Indic
  assert.equal(parseLocaleNumber('٢٥٠'), 250);
  assert.equal(parseLocaleNumber('١٥٠٠.٧٥'), 1500.75);

  // Eastern Arabic-Indic
  assert.equal(parseLocaleNumber('۲۵۰'), 250);

  // Currency 0 preservation (CRITICAL: 0 must not be falsy or NaN)
  assert.equal(parseLocaleNumber('0'), 0);
  assert.equal(parseLocaleNumber(0), 0);
  assert.equal(parseLocaleNumber('٠'), 0);
  assert.equal(parseLocaleNumber('۰'), 0);

  // Commas as decimals
  assert.equal(parseLocaleNumber('99,50'), 99.5);

  // Invalids
  assert.equal(isNaN(parseLocaleNumber('')), true);
  assert.equal(isNaN(parseLocaleNumber(null)), true);
  assert.equal(isNaN(parseLocaleNumber(undefined)), true);
  assert.equal(isNaN(parseLocaleNumber('abc')), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Offer Price Validation
// ─────────────────────────────────────────────────────────────────────────────

test('validateOfferPrice validates positive amounts and currency 0', () => {
  const { validateOfferPrice } = loadModule('../lib/redesign-chat10-requests.ts');

  const valid1 = validateOfferPrice('500');
  assert.equal(valid1.valid, true);
  assert.equal(valid1.price, 500);

  // Free/waived fee consultation (currency 0)
  const validZero = validateOfferPrice('0');
  assert.equal(validZero.valid, true);
  assert.equal(validZero.price, 0);

  const validArabicZero = validateOfferPrice('٠');
  assert.equal(validArabicZero.valid, true);
  assert.equal(validArabicZero.price, 0);

  // Negative price
  const invalidNegative = validateOfferPrice('-100');
  assert.equal(invalidNegative.valid, false);
  assert.equal(invalidNegative.error.includes('سالباً'), true);

  // Empty / Non-numeric
  const invalidEmpty = validateOfferPrice('');
  assert.equal(invalidEmpty.valid, false);

  const invalidText = validateOfferPrice('غير صالح');
  assert.equal(invalidText.valid, false);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Department Request Management Permissions
// ─────────────────────────────────────────────────────────────────────────────

test('canManageDepartmentRequests enforces roles, view-only, and explicit denies', () => {
  const { canManageDepartmentRequests } = loadModule('../lib/redesign-chat10-requests.ts');

  // 1. Admin always has manage access
  assert.equal(canManageDepartmentRequests({ role: 'admin' }, 'properties'), true);
  assert.equal(canManageDepartmentRequests({ role: 'admin' }, 'finance'), true);
  assert.equal(canManageDepartmentRequests({ role: 'admin' }, 'legal'), true);

  // 2. Manager role has manage access
  assert.equal(canManageDepartmentRequests({ role: 'manager' }, 'marketing'), true);

  // 3. Viewer role is strictly view-only (canManage === false)
  assert.equal(canManageDepartmentRequests({ role: 'viewer', departments: ['properties'] }, 'properties'), false);

  // 4. User with 'view' permission in departmentPermissions is view-only
  const viewOnlyUser = {
    role: 'agent',
    departments: ['properties'],
    departmentPermissions: { properties: 'view' },
  };
  assert.equal(canManageDepartmentRequests(viewOnlyUser, 'properties'), false);

  // 5. User with 'manage' permission
  const manageUser = {
    role: 'agent',
    departments: ['properties'],
    departmentPermissions: { properties: 'manage' },
  };
  assert.equal(canManageDepartmentRequests(manageUser, 'properties'), true);

  // 6. User with explicit deny 'none' or false
  const deniedUser = {
    role: 'broker',
    departments: ['properties'],
    departmentPermissions: { properties: 'none' },
  };
  assert.equal(canManageDepartmentRequests(deniedUser, 'properties'), false);

  // 7. Forbidden role without department access
  const unrelatedUser = {
    role: 'broker',
    departments: ['marketing'],
  };
  assert.equal(canManageDepartmentRequests(unrelatedUser, 'legal'), false);

  // 8. Finance / Financial alias handling
  const financeUser = {
    role: 'finance',
    departments: ['financial'],
    departmentPermissions: { finance: 'manage' },
  };
  assert.equal(canManageDepartmentRequests(financeUser, 'financial'), true);
  assert.equal(canManageDepartmentRequests(financeUser, 'finance'), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Request Filtering & Assignment Filter
// ─────────────────────────────────────────────────────────────────────────────

test('filterDepartmentRequests filters by search keywords and assignment toggle', () => {
  const { filterDepartmentRequests } = loadModule('../lib/redesign-chat10-requests.ts');

  const requests = [
    {
      id: 'req-001',
      clientName: 'عبدالله السبيعي',
      serviceType: 'استشارة قانونية عقارية',
      city: 'الرياض',
      district: 'العليا',
      category: 'legal',
      status: 'pending',
      price: 0,
      quantity: 1,
      createdAt: '2026-11-10T10:00:00Z',
      phone: '0500000001',
      assignedAgentId: 'agent-10',
    },
    {
      id: 'req-002',
      clientName: 'فاطمة الشهري',
      serviceType: 'تسويق عقار سكني',
      city: 'جدة',
      district: 'الحمراء',
      category: 'marketing',
      status: 'in_progress',
      price: 1500,
      quantity: 1,
      createdAt: '2026-11-12T10:00:00Z',
      phone: '0500000002',
      assignedAgentId: 'agent-20',
    },
  ];

  // Search by client
  assert.equal(filterDepartmentRequests(requests, 'السبيعي', false).length, 1);
  assert.equal(filterDepartmentRequests(requests, 'السبيعي', false)[0].id, 'req-001');

  // Search by service
  assert.equal(filterDepartmentRequests(requests, 'تسويق', false).length, 1);
  assert.equal(filterDepartmentRequests(requests, 'تسويق', false)[0].id, 'req-002');

  // Search by city
  assert.equal(filterDepartmentRequests(requests, 'الرياض', false).length, 1);

  // Toggle "showOnlyMine"
  const mineForAgent10 = filterDepartmentRequests(requests, '', true, 'agent-10');
  assert.equal(mineForAgent10.length, 1);
  assert.equal(mineForAgent10[0].id, 'req-001');

  const mineForAgent20 = filterDepartmentRequests(requests, '', true, 'agent-20');
  assert.equal(mineForAgent20.length, 1);
  assert.equal(mineForAgent20[0].id, 'req-002');

  const mineForUnknown = filterDepartmentRequests(requests, '', true, 'agent-99');
  assert.equal(mineForUnknown.length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Source Code Integrity Checks
// ─────────────────────────────────────────────────────────────────────────────

test('Disputes source code contains details button handler and eliminates typeof null === "object" crash', () => {
  const disputesSource = fs.readFileSync(require.resolve('../app/disputes/page.tsx'), 'utf8');

  // Must not have the crashing pattern
  assert.equal(
    disputesSource.includes("typeof dispute.firstParty === 'object' ? (dispute.firstParty as any).name"),
    false,
    'Crashing typeof null === object pattern must be removed'
  );

  // Must use safe party extraction
  assert.equal(disputesSource.includes('safeExtractParty'), true);

  // Must open details dialog
  assert.equal(disputesSource.includes('handleOpenDetails'), true);
  assert.equal(disputesSource.includes('DisputeDetailsDialog'), true);

  // Must have recoverable error state
  assert.equal(disputesSource.includes('role="alert"'), true);
});

test('Department Requests source code contains recoverable error handling and offers validation', () => {
  const reqSource = fs.readFileSync(require.resolve('../app/internal/[dept]/requests/page.tsx'), 'utf8');

  assert.equal(reqSource.includes('canAccessDepartment'), true);
  assert.equal(reqSource.includes('validateOfferPrice'), true);
  assert.equal(reqSource.includes('errorMessage'), true);
  assert.equal(reqSource.includes('role="alert"'), true);
  assert.equal(reqSource.includes('SimpleChatModal'), true);
});
