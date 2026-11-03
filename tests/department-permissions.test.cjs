const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ADMIN_PERMISSION_DEFINITIONS,
  createDefaultDepartmentPermissions,
  normalizeDepartmentPermissions,
} = require('../lib/department-permissions');

test('defines the same seven permission sections used by the owner flow', () => {
  assert.deepEqual(
    ADMIN_PERMISSION_DEFINITIONS.map(({ id }) => id),
    ['offers', 'orders', 'marketing', 'financial', 'properties', 'legal', 'employees'],
  );
});

test('creates safe defaults with no access until a section is selected', () => {
  assert.deepEqual(createDefaultDepartmentPermissions(), {
    offers: 'none',
    orders: 'none',
    marketing: 'none',
    financial: 'none',
    properties: 'none',
    legal: 'none',
    employees: false,
  });
});

test('normalizes legacy and incomplete values without dropping sections', () => {
  assert.deepEqual(normalizeDepartmentPermissions({ properties: 'manage', financial: 'view', employees: true }), {
    offers: 'none',
    orders: 'none',
    marketing: 'none',
    financial: 'view',
    properties: 'manage',
    legal: 'none',
    employees: true,
  });
});
