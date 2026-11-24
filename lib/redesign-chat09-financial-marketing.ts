/**
 * lib/redesign-chat09-financial-marketing.ts
 * Pure domain logic and resilient state helpers for Standalone Financial and Marketing pages.
 * Chat 09 - Parallel Redesign
 */

export type FinancialSummaryState = 'initial_loading' | 'available' | 'stale' | 'unavailable';

export interface FinancialWorkspaceSummaryData {
  totalUsers?: number;
  activeOperations?: number;
  totalRevenue?: number;
  conversionRate?: number;
  totalSales?: number;
  totalRentals?: number;
  totalCommission?: number;
  totalExpenses?: number;
  totalTax?: number;
  netProfit?: number;
  invoiceStats?: {
    paidCount?: number;
    unpaidCount?: number;
    draftCount?: number;
    paidTotal?: number;
    outstandingTotal?: number;
  };
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    commissionAmount?: number;
    status: string;
    transactionDate: string;
    description?: string;
  }>;
  monthlyTotals?: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  expenseBreakdown?: Array<{
    category: string;
    total: number;
  }>;
}

export interface FinancialKpiItem {
  id: 'sales' | 'rentals' | 'commission' | 'expenses' | 'netProfit' | 'vat';
  labelKey: string;
  fallbackLabelAr: string;
  fallbackLabelEn: string;
  value: number | null;
  isAvailable: boolean;
}

/**
 * Determine the financial summary state based on confirmed data and request lifecycle.
 * Prevents initial failure from rendering as zero data, and marks cached data as stale on failed refresh.
 */
export function resolveFinancialSummaryState(
  confirmedData: FinancialWorkspaceSummaryData | null,
  isInitialLoading: boolean,
  hasFetchError: boolean
): FinancialSummaryState {
  if (isInitialLoading && !confirmedData) {
    return 'initial_loading';
  }
  if (hasFetchError) {
    return confirmedData ? 'stale' : 'unavailable';
  }
  if (confirmedData) {
    return 'available';
  }
  return 'initial_loading';
}

/**
 * Extract KPIs from confirmed financial summary.
 * If data is unavailable (state === 'unavailable' or data is null), values are strictly null.
 * Never maps an error or missing payload to 0.
 */
export function extractFinancialKpis(
  summary: FinancialWorkspaceSummaryData | null,
  isAvailable: boolean
): FinancialKpiItem[] {
  const kpiDefs: Array<{
    id: FinancialKpiItem['id'];
    key: string;
    labelAr: string;
    labelEn: string;
    getter: (s: FinancialWorkspaceSummaryData) => number | undefined;
  }> = [
    { id: 'sales', key: 'fin.kpi.sales', labelAr: 'إجمالي المبيعات', labelEn: 'Total Sales', getter: s => s.totalSales },
    { id: 'rentals', key: 'fin.kpi.rentals', labelAr: 'إجمالي الإيجارات', labelEn: 'Total Rentals', getter: s => s.totalRentals },
    { id: 'commission', key: 'fin.kpi.commission', labelAr: 'إجمالي العمولات', labelEn: 'Total Commissions', getter: s => s.totalCommission },
    { id: 'expenses', key: 'fin.kpi.expenses', labelAr: 'إجمالي المصروفات', labelEn: 'Total Expenses', getter: s => s.totalExpenses },
    { id: 'netProfit', key: 'fin.kpi.netProfit', labelAr: 'صافي الربح', labelEn: 'Net Profit', getter: s => s.netProfit },
    { id: 'vat', key: 'fin.kpi.vat', labelAr: 'ضريبة القيمة المضافة', labelEn: 'Value Added Tax (VAT)', getter: s => s.totalTax },
  ];

  return kpiDefs.map(def => {
    if (!isAvailable || !summary) {
      return {
        id: def.id,
        labelKey: def.key,
        fallbackLabelAr: def.labelAr,
        fallbackLabelEn: def.labelEn,
        value: null,
        isAvailable: false,
      };
    }

    const rawVal = def.getter(summary);
    const hasValidNum = typeof rawVal === 'number' && !isNaN(rawVal);

    return {
      id: def.id,
      labelKey: def.key,
      fallbackLabelAr: def.labelAr,
      fallbackLabelEn: def.labelEn,
      value: hasValidNum ? rawVal : null,
      isAvailable: hasValidNum,
    };
  });
}

/**
 * Format financial amount safely.
 * Returns explicit fallback string when value is null or unavailable.
 */
export function formatFinancialAmount(
  value: number | null | undefined,
  locale: 'ar' | 'en' = 'ar',
  unavailableFallback?: string
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return unavailableFallback ?? (locale === 'ar' ? 'غير متاح' : 'Unavailable');
  }

  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Validates financial page tabs.
 */
export const VALID_FINANCIAL_TABS = [
  'dashboard',
  'transactions',
  'commissions',
  'payments',
  'expenses',
  'reports',
  'wallet',
  'settlements',
  'service_requests',
] as const;

export type FinancialTab = (typeof VALID_FINANCIAL_TABS)[number];

export function isValidFinancialTab(tab: string | null | undefined): tab is FinancialTab {
  return VALID_FINANCIAL_TABS.includes(tab as FinancialTab);
}

/**
 * Validates marketing page tabs.
 */
export const VALID_MARKETING_TABS = [
  'advertising',
  'photography',
  'requests',
  'general_requests',
] as const;

export type MarketingTab = (typeof VALID_MARKETING_TABS)[number];

export function isValidMarketingTab(tab: string | null | undefined): tab is MarketingTab {
  return VALID_MARKETING_TABS.includes(tab as MarketingTab);
}

export interface UserAuthContext {
  role?: string;
  departments?: string[];
  departmentPermissions?: Record<string, string>;
}

/**
 * Check if the user is authorized to access the Financial page.
 */
export function canUserAccessFinancial(user: UserAuthContext | null | undefined): boolean {
  if (!user) return false;

  const allowedRoles = ['admin', 'finance', 'finance_admin', 'viewer', 'manager'];
  if (user.role && allowedRoles.includes(user.role)) {
    return true;
  }

  const depts = (user.departments || []).map(d => d.toLowerCase());
  if (depts.includes('finance') || depts.includes('financial')) {
    return true;
  }

  const perms = user.departmentPermissions || {};
  if (
    (perms.finance && perms.finance !== 'none') ||
    (perms.financial && perms.financial !== 'none')
  ) {
    return true;
  }

  return false;
}

/**
 * Check if the user is authorized to access the Marketing page.
 */
export function canUserAccessMarketing(user: UserAuthContext | null | undefined): boolean {
  if (!user) return false;

  const allowedRoles = ['admin', 'marketing', 'marketing_admin', 'viewer', 'manager'];
  if (user.role && allowedRoles.includes(user.role)) {
    return true;
  }

  const depts = (user.departments || []).map(d => d.toLowerCase());
  if (depts.includes('marketing')) {
    return true;
  }

  const perms = user.departmentPermissions || {};
  if (perms.marketing && perms.marketing !== 'none') {
    return true;
  }

  return false;
}

/**
 * Calculate scaled chart dimensions for monthly income vs expenses.
 */
export function calculateMonthlyChartBars(
  monthlyTotals: Array<{ month: string; income: number; expenses: number; net: number }> | undefined,
  maxBarHeightPx = 140
): Array<{
  month: string;
  income: number;
  expenses: number;
  net: number;
  incomeHeightPx: number;
  expenseHeightPx: number;
}> {
  if (!monthlyTotals || monthlyTotals.length === 0) {
    return [];
  }

  const recent = monthlyTotals.slice(-6);
  const maxValue = Math.max(
    ...recent.flatMap(m => [Number(m.income || 0), Number(m.expenses || 0)]),
    1
  );

  return recent.map(item => {
    const inc = Number(item.income || 0);
    const exp = Number(item.expenses || 0);
    return {
      month: item.month,
      income: inc,
      expenses: exp,
      net: Number(item.net || 0),
      incomeHeightPx: Math.max((inc / maxValue) * maxBarHeightPx, 8),
      expenseHeightPx: Math.max((exp / maxValue) * maxBarHeightPx, 8),
    };
  });
}

/**
 * Filter marketing requests truthfully by status without synthetic records.
 */
export function filterMarketingRequests<T extends { status?: string }>(
  requests: T[] | null | undefined,
  statusFilter: 'all' | 'pending' | 'in_progress' | 'completed' | 'rejected'
): T[] {
  if (!requests) return [];
  if (statusFilter === 'all') return [...requests];
  return requests.filter(req => req.status === statusFilter);
}
