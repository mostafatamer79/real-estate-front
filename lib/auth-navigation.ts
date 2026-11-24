export function safeReturnTo(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x1f]/.test(value)) return null;
  try {
    const url = new URL(value, 'https://local.invalid');
    if (url.origin !== 'https://local.invalid' || /^\/(login|verify-otp|api|auth)(\/|$)/.test(url.pathname)) return null;
    return url.pathname + url.search + url.hash;
  } catch { return null; }
}
export const loginHref = (path: string) => '/login?next=' + encodeURIComponent(safeReturnTo(path) || '/services');
export function requestTrackingHref(user: {role?: string; departments?: string[]; departmentPermissions?: Record<string, unknown>} | null | undefined): string {
  if (user?.role === 'admin' || user?.role === 'agent') return '/services/my-requests';
  if (['employee','manager','legal','legal_admin','marketing','marketing_admin','finance','finance_admin'].includes(user?.role || '')) {
    const departments = ['legal','marketing','finance','properties','employees'];
    const department = (user?.departments || []).find(value => departments.includes(value) && !['none',false].includes(user?.departmentPermissions?.[value] as never))
      || departments.find(value => user?.role?.startsWith(value) || [true,'view','manage'].includes(user?.departmentPermissions?.[value] as never));
    if (department) return `/internal/${department}/requests`;
    return '/services/my-requests';
  }
  return '/services/provider-requests';
}
