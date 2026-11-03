const PERMISSION_LEVELS = new Set(['none', 'view', 'manage']);

const ADMIN_PERMISSION_DEFINITIONS = [
  { id: 'offers', labelAr: 'إدارة العروض', labelEn: 'Offers management' },
  { id: 'orders', labelAr: 'إدارة الطلبات', labelEn: 'Orders management' },
  { id: 'marketing', labelAr: 'إدارة التسويق', labelEn: 'Marketing' },
  { id: 'financial', labelAr: 'الإدارة المالية', labelEn: 'Finance' },
  { id: 'properties', labelAr: 'إدارة الأملاك', labelEn: 'Properties' },
  { id: 'legal', labelAr: 'الإدارة القانونية', labelEn: 'Legal' },
  { id: 'employees', labelAr: 'إدارة الموظفين', labelEn: 'Employees' },
];

function createDefaultDepartmentPermissions() {
  return ADMIN_PERMISSION_DEFINITIONS.reduce((permissions, { id }) => {
    permissions[id] = id === 'employees' ? false : 'none';
    return permissions;
  }, {});
}

function normalizeDepartmentPermissions(value) {
  const defaults = createDefaultDepartmentPermissions();
  if (!value || typeof value !== 'object') return defaults;

  return ADMIN_PERMISSION_DEFINITIONS.reduce((permissions, { id }) => {
    if (id === 'employees') {
      permissions[id] = value[id] === true;
    } else if (PERMISSION_LEVELS.has(value[id])) {
      permissions[id] = value[id];
    }
    return permissions;
  }, defaults);
}

module.exports = {
  ADMIN_PERMISSION_DEFINITIONS,
  createDefaultDepartmentPermissions,
  normalizeDepartmentPermissions,
};
