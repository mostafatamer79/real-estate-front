export function canManageUsers(user: { role?: string; departments?: unknown; departmentPermissions?: Record<string, unknown> } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const permission = user.departmentPermissions?.employees;
  if (permission === false || permission === 'none' || permission === 'view') return false;
  return permission === true || permission === 'manage'
    || (Array.isArray(user.departments) && user.departments.includes('employees'));
}
