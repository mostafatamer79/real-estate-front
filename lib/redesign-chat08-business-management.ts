/**
 * Chat 08: Business Management & Property Workspace Pure Helpers
 * 
 * Provides truthful financial calculation, permission evaluation,
 * mobile drawer responsiveness, and modal accessibility helpers
 * for /buildingmanagement and /internal routes.
 */

import { canAccessDepartment } from './redesign-department-navigation';

export interface MinimalUser {
  role?: string;
  departments?: string[];
  departmentPermissions?: Record<string, string>;
}

/**
 * Determines whether the user has permission to mutate financial records
 * (e.g. mark service request orders as paid, send invoices).
 * Requires Admin role OR active non-none access to finance or legal department.
 */
export function canUserMutateFinancials(user: MinimalUser | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'ADMIN') return true;
  return canAccessDepartment(user, 'finance') || canAccessDepartment(user, 'legal');
}

export type WorkspaceFinancialState = 'loading' | 'error' | 'empty' | 'available';

/**
 * Evaluates the truthful state of financial records.
 * Unknown or failed data is NEVER displayed as a confirmed zero.
 */
export function resolveWorkspaceFinancialState(
  leases: unknown[] | null | undefined,
  payments: unknown[] | null | undefined,
  hasError: boolean,
  isLoading: boolean
): WorkspaceFinancialState {
  if (isLoading) return 'loading';
  if (hasError) return 'error';
  if (!leases && !payments) return 'error';

  const leasesCount = Array.isArray(leases) ? leases.length : 0;
  const paymentsCount = Array.isArray(payments) ? payments.length : 0;

  if (leasesCount === 0 && paymentsCount === 0) {
    return 'empty';
  }
  return 'available';
}

export interface WorkspaceFinancialTotals {
  isAvailable: boolean;
  totalIncome: number | null;
  totalExpenses: number | null;
  netIncome: number | null;
  paidPaymentsCount: number | null;
  pendingPaymentsCount: number | null;
  leasesCount: number | null;
}

/**
 * Calculates truthful financial totals.
 * If data is unavailable due to error, returns null for figures so the UI can
 * render an unconfirmed / unavailable badge instead of fake 0 SAR.
 */
export function calculateWorkspaceFinancialTotals(
  leases: Array<{ rentAmount?: number; status?: string }> | null | undefined,
  payments: Array<{ amount?: number; status?: string }> | null | undefined,
  hasError: boolean
): WorkspaceFinancialTotals {
  if (hasError || !Array.isArray(leases) || !Array.isArray(payments)) {
    return {
      isAvailable: false,
      totalIncome: null,
      totalExpenses: null,
      netIncome: null,
      paidPaymentsCount: null,
      pendingPaymentsCount: null,
      leasesCount: null,
    };
  }

  const paidPayments = payments.filter((p) => p.status === 'paid' || p.status === 'completed');
  const pendingPayments = payments.filter((p) => p.status === 'pending');

  const totalIncome = paidPayments.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  // In the current backend schema, annual expenses are not recorded in this table
  const totalExpenses = 0;
  const netIncome = totalIncome - totalExpenses;

  return {
    isAvailable: true,
    totalIncome,
    totalExpenses,
    netIncome,
    paidPaymentsCount: paidPayments.length,
    pendingPaymentsCount: pendingPayments.length,
    leasesCount: leases.length,
  };
}

/**
 * Generates responsive mobile sidebar classes ensuring the drawer
 * never exceeds a 320px viewport (w-[min(21rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)]).
 */
export function getMobileSidebarClasses(isOpen: boolean): string {
  const base = 'fixed inset-y-0 start-0 z-50 w-[min(21rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] bg-card border-e shadow-2xl transform transition-transform duration-300 md:hidden flex flex-col';
  const state = isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full';
  return `${base} ${state}`;
}

/**
 * Generates accessibility attributes for the mobile drawer toggle button.
 */
export function getMobileToggleAria(isOpen: boolean, language: 'ar' | 'en') {
  return {
    'aria-label': isOpen
      ? (language === 'ar' ? 'إغلاق القائمة الجانبية' : 'Close sidebar')
      : (language === 'ar' ? 'فتح القائمة الجانبية' : 'Open sidebar'),
    'aria-expanded': isOpen,
    'aria-controls': 'bm-workspace-sidebar',
  };
}

/**
 * Normalizes raw section string from query parameters or deep links
 * into the canonical workspace section identifier.
 */
export function normalizeWorkspaceSection(rawSection: string | null | undefined): string {
  if (!rawSection) return 'properties';
  const clean = rawSection.toLowerCase().trim();

  switch (clean) {
    case 'dashboard':
    case 'portfolio':
    case 'properties':
      return 'properties';
    case 'employee':
    case 'employees':
    case 'users':
      return 'users';
    case 'finance':
    case 'payments':
    case 'transactions':
    case 'financial':
      return 'financial';
    case 'legal':
    case 'disputes':
      return 'legal';
    case 'marketing':
    case 'campaigns':
      return 'marketing';
    case 'orders':
    case 'requests':
      return 'orders';
    case 'tenants':
      return 'properties';
    default:
      return clean;
  }
}

/**
 * Resolves the initial tab for the financial section when routed via legacy aliases.
 */
export function resolveInitialFinancialTab(rawSection: string | null | undefined): string | null {
  if (!rawSection) return null;
  const clean = rawSection.toLowerCase().trim();
  if (clean === 'payments') return 'payments';
  if (clean === 'transactions') return 'transactions';
  if (clean === 'expenses') return 'expenses';
  return null;
}
