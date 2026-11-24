"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Receipt, Banknote, CreditCard,
  Calculator, FileText, Wallet, ArrowUpRight,
  ArrowDownLeft, Briefcase, Loader2, RefreshCw,
  TrendingUp, ShieldCheck, PieChart, Sparkles,
  ChevronLeft, AlertCircle, Rocket, SaudiRiyalIcon
} from 'lucide-react';
import toast from 'react-hot-toast';

import MobileAppHeader from '@/app/src/components/MobileAppHeader';
import { SegmentedTabs, SegmentedList, SegmentedTrigger } from '@/components/ui/mobile-tabs';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { SaudiRiyalAmount } from '@/components/ui/saudi-riyal';
import { useLanguage } from '@/context/LanguageContext';
import { useSectionGuard } from '@/hooks/useSectionGuard';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

// Preserved manager components (consumed read-only)
import UserWallet from '@/components/financial/UserWallet';
import CommissionManager from '@/components/financial/CommissionManager';
import ExpensesManager from '@/components/financial/ExpensesManager';
import ReportsManager from '@/components/financial/ReportsManager';
import PaymentsManager from '@/components/financial/PaymentsManager';
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';

import { financialApi, FinancialTransaction } from '@/lib/financial-service';
import {
  FinancialTab,
  FinancialWorkspaceSummaryData,
  isValidFinancialTab,
  canUserAccessFinancial,
  resolveFinancialSummaryState,
  extractFinancialKpis,
  formatFinancialAmount,
  calculateMonthlyChartBars
} from '@/lib/redesign-chat09-financial-marketing';

import styles from './financial-standalone.module.css';

interface FinancialStandaloneProps {
  embedded?: boolean;
  initialTab?: string;
}

export default function FinancialStandalone({
  embedded = false,
  initialTab = 'dashboard'
}: FinancialStandaloneProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const [, startTransition] = useTransition();

  const tabParam = searchParams?.get('tab');
  const initialActive = isValidFinancialTab(tabParam)
    ? tabParam
    : (isValidFinancialTab(initialTab) ? initialTab : 'dashboard');

  const [activeTab, setActiveTab] = useState<FinancialTab>(initialActive);
  const { isOpen, message, isAdmin } = useSectionGuard('financial');

  // Verify authorization
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (!canUserAccessFinancial(user)) {
          router.push('/');
        }
      } else {
        router.replace('/login');
      }
    } catch {
      router.replace('/login');
    }
  }, [router]);

  // Handle tab change with deep linking support
  const handleTabChange = useCallback((newTab: string) => {
    if (isValidFinancialTab(newTab)) {
      setActiveTab(newTab);
      if (!embedded && typeof window !== 'undefined') {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('tab', newTab);
        startTransition(() => {
          window.history.replaceState(null, '', currentUrl.toString());
        });
      }
    }
  }, [embedded]);

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t('admin.settings.financial') || (isRtl ? 'المالية' : 'Financial')}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div
      className={styles.financialRoot}
      dir={isRtl ? 'rtl' : 'ltr'}
      data-testid="chat09-financial-standalone"
    >
      {!embedded && (
        <MobileAppHeader
          theme="light"
          title={t('admin.settings.financial') || (isRtl ? 'المالية' : 'Financial')}
        />
      )}

      {/* Architectural Hero Header */}
      {!embedded && (
        <section className={styles.heroBanner}>
          <div className={styles.heroArtworkWrapper}>
            <Image
              src="/artworks/chat09-financial-atrium.webp"
              alt="Financial Architecture"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-3">
                <div className={styles.heroBadge}>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isRtl ? 'الإدارة المالية المركزية' : 'Financial Governance'}</span>
                </div>
                <h1 className={styles.heroTitle}>
                  {t('fin.title') || (isRtl ? 'النظام المالي والعمليات' : 'Financial Operations')}
                </h1>
                <p className={styles.heroSubtitle}>
                  {t('fin.header.desc') ||
                    (isRtl
                      ? 'متابعة شاملة للإيرادات والمصروفات والعمولات والتدفقات النقدية بدقة وموثوقية.'
                      : 'Comprehensive monitoring of revenues, expenses, commissions, and cash flows.')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTabChange('reports')}
                  className="rounded-xl h-10 px-4 font-bold text-xs uppercase tracking-wider border-slate-300 hover:bg-slate-100"
                >
                  <FileText className="w-4 h-4 ml-1.5" />
                  {t('fin.tab.reports') || (isRtl ? 'التقارير' : 'Reports')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Body with Tabs */}
      <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'}>
        <SegmentedTabs value={activeTab} onValueChange={handleTabChange} className={styles.tabsContainer}>
          <div className={styles.tabsScroll}>
            <SegmentedList className={`${styles.tabsList} financial-tabs-list`}>
              <SegmentedTrigger value="dashboard" className={styles.tabTrigger}>
                <LayoutDashboard className="w-4 h-4" />
                <span>{t('fin.tab.dashboard') || (isRtl ? 'لوحة التحكم' : 'Dashboard')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="transactions" className={styles.tabTrigger}>
                <Receipt className="w-4 h-4" />
                <span>{t('fin.tab.transactions') || (isRtl ? 'المعاملات' : 'Transactions')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="commissions" className={styles.tabTrigger}>
                <Calculator className="w-4 h-4" />
                <span>{t('fin.tab.commissions') || (isRtl ? 'العمولات' : 'Commissions')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="payments" className={styles.tabTrigger}>
                <CreditCard className="w-4 h-4" />
                <span>{t('fin.tab.payments') || (isRtl ? 'المدفوعات' : 'Payments')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="expenses" className={styles.tabTrigger}>
                <Banknote className="w-4 h-4" />
                <span>{t('fin.tab.expenses') || (isRtl ? 'المصروفات' : 'Expenses')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="reports" className={styles.tabTrigger}>
                <FileText className="w-4 h-4" />
                <span>{t('fin.tab.reports') || (isRtl ? 'التقارير' : 'Reports')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="wallet" className={styles.tabTrigger}>
                <Wallet className="w-4 h-4" />
                <span>{t('fin.tab.wallet') || (isRtl ? 'المحفظة' : 'Wallet')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="settlements" className={styles.tabTrigger}>
                <ShieldCheck className="w-4 h-4" />
                <span>{t('fin.tab.settlements') || (isRtl ? 'التسويات' : 'Settlements')}</span>
              </SegmentedTrigger>
              <SegmentedTrigger value="service_requests" className={styles.tabTrigger}>
                <Briefcase className="w-4 h-4" />
                <span>{t('fin.tab.service_requests') || (isRtl ? 'طلبات الخدمات' : 'Service Requests')}</span>
              </SegmentedTrigger>
            </SegmentedList>
          </div>

          <div className="mt-6 sm:mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
                  <DashboardSection embedded={embedded} />
                </TabsContent>

                <TabsContent value="transactions" className="m-0 focus-visible:outline-none">
                  <TransactionsSection />
                </TabsContent>

                <TabsContent value="commissions" className="m-0 focus-visible:outline-none">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className={styles.panelCard}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-base font-black flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            {t('fin.commissions.distributionTitle') || (isRtl ? 'توزيع نسب السعي والعمولة' : 'Commission Distribution')}
                          </h4>
                          <PieChart className="w-5 h-5 text-slate-400" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-xs opacity-75">{t('fin.commissions.brokers') || (isRtl ? 'الوسطاء والمسوقون' : 'Brokers')}</span>
                            <span className="text-lg font-black tabular-nums">2.5%</span>
                          </div>
                          <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <span className="font-bold text-xs opacity-75">{t('fin.commissions.platform') || (isRtl ? 'حصة المنصة' : 'Platform Fee')}</span>
                            <span className="text-lg font-black tabular-nums">1.0%</span>
                          </div>
                        </div>
                      </div>

                      <div className={`${styles.panelCard} flex flex-col justify-center items-center text-center`}>
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 mb-3 border border-amber-200/50">
                          <TrendingUp className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-black mb-1">{t('fin.policy.update') || (isRtl ? 'سياسة العمولات' : 'Commission Policy')}</h4>
                        <p className="text-slate-500 font-bold text-xs max-w-xs">{t('fin.policy.desc') || (isRtl ? 'تخضع العمولات للمعايير المعتمدة من الهيئة العامة للعقار.' : 'Commissions comply with official real estate regulations.')}</p>
                      </div>
                    </div>
                    <CommissionManager />
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="m-0 focus-visible:outline-none">
                  <PaymentsManager />
                </TabsContent>

                <TabsContent value="expenses" className="m-0 focus-visible:outline-none">
                  <ExpensesManager />
                </TabsContent>

                <TabsContent value="reports" className="m-0 focus-visible:outline-none">
                  <ReportsManager />
                </TabsContent>

                <TabsContent value="wallet" className="m-0 focus-visible:outline-none">
                  <UserWallet />
                </TabsContent>

                <TabsContent value="settlements" className="m-0 focus-visible:outline-none">
                  <div className={styles.panelCard}>
                    <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 border border-slate-200 dark:border-slate-700">
                        <Rocket className="w-7 h-7" />
                      </div>
                      <h4 className="text-xl font-black mb-2">{t('fin.settlements.title') || (isRtl ? 'تسويات الحسابات البنكية' : 'Bank Settlements')}</h4>
                      <p className="text-slate-400 font-bold text-xs max-w-sm">
                        {t('common.soon') || (isRtl ? 'قريباً' : 'Coming soon')}. {t('fin.soon.desc') || (isRtl ? 'نعمل على الربط الآلي المباشر مع شبكة سداد والمدفوعات الفورية.' : 'Direct integration with payment networks in progress.')}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="service_requests" className="m-0 focus-visible:outline-none">
                  <ServiceRequestsTable
                    title={t('fin.tab.service_requests') || (isRtl ? 'طلبات الخدمات المالية' : 'Financial Service Requests')}
                    subtitle={t('fin.transactions.desc') || (isRtl ? 'سجل العمليات والطلبات المقدمة عبر الأقسام' : 'Record of operations and requests')}
                  />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </SegmentedTabs>
      </div>

      {!embedded && (
        <button
          type="button"
          onClick={() => router.push('/details')}
          aria-label={isRtl ? 'الرجوع إلى التفاصيل' : 'Back to details'}
          className={styles.floatingBackBtn}
        >
          <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

/**
 * Resilient Financial Dashboard Section
 * Handles initial loading, initial failure with Retry, and stale cache indicators.
 * Never displays false zero values when API fails.
 */
function DashboardSection({ embedded = false }: { embedded?: boolean }) {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const [stats, setStats] = useState<FinancialWorkspaceSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);

    try {
      const data = await financialApi.getWorkspaceSummary();
      setStats(data as unknown as FinancialWorkspaceSummaryData);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || (isRtl ? 'تعذر تحميل ملخص البيانات المالية' : 'Failed to load financial summary');
      setFetchError(msg);
      if (isManualRefresh) {
        toast.error(isRtl ? 'فشل تحديث البيانات، تم الاحتفاظ بالبيانات السابقة' : 'Update failed; cached data preserved');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isRtl]);

  useEffect(() => {
    fetchSummary(false);
  }, [fetchSummary]);

  const summaryState = resolveFinancialSummaryState(stats, loading, fetchError != null);

  // Initial Failure: Show clear error card with Retry. DO NOT render false zero KPIs!
  if (summaryState === 'unavailable') {
    return (
      <div className={styles.errorCard} role="alert">
        <div className={styles.errorIcon}>
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-2">
          {isRtl ? 'بيانات الملخص المالي غير متاحة حالياً' : 'Financial Summary Unavailable'}
        </h3>
        <p className="text-xs font-bold text-slate-500 max-w-md mx-auto mb-5 leading-relaxed">
          {fetchError || (isRtl
            ? 'تعذر الاتصال بخادم المعاملات المالية. يرجى التحقق من اتصال الشبكة وإعادة المحاولة.'
            : 'Could not connect to the financial service. Please check your network and retry.')}
        </p>
        <button
          type="button"
          onClick={() => fetchSummary(false)}
          className={styles.retryButton}
        >
          <RefreshCw className="w-4 h-4 ml-1.5" />
          {isRtl ? 'إعادة المحاولة الآن' : 'Retry Now'}
        </button>
      </div>
    );
  }

  // Initial Loading Skeletons
  if (summaryState === 'initial_loading') {
    return (
      <div className="space-y-6">
        <div className={styles.kpiGrid}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
          <div className="h-64 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
        </div>
      </div>
    );
  }

  // Confirmed or Stale Data available
  const isAvailable = summaryState === 'available' || summaryState === 'stale';
  const kpis = extractFinancialKpis(stats, isAvailable);

  const kpiIcons: Record<string, React.ElementType> = {
    sales: SaudiRiyalIcon,
    rentals: Briefcase,
    commission: Banknote,
    expenses: ArrowDownLeft,
    netProfit: ArrowUpRight,
    vat: Calculator,
  };

  const chartBars = calculateMonthlyChartBars(stats?.monthlyTotals);

  return (
    <div className="space-y-6">
      {/* Stale Warning Banner when background refresh failed but cached data is preserved */}
      {summaryState === 'stale' && (
        <div className={styles.staleBanner} role="status">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {isRtl
                ? 'يتم عرض بيانات مؤقتة محفوظة مسبقاً نظراً لتعذر التحديث الأخير.'
                : 'Displaying cached data. Background refresh encountered an issue.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchSummary(true)}
            disabled={refreshing}
            className="underline hover:no-underline text-xs font-black inline-flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Manual Refresh Bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">
          {isRtl ? 'مؤشرات الأداء المالي المعتمدة' : 'Confirmed Financial Indicators'}
        </p>
        <button
          type="button"
          onClick={() => fetchSummary(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors p-1"
          aria-label={isRtl ? 'تحديث البيانات' : 'Refresh data'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{isRtl ? 'تحديث' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, idx) => {
          const Icon = kpiIcons[kpi.id] || Banknote;
          const label = t(kpi.labelKey) || (isRtl ? kpi.fallbackLabelAr : kpi.fallbackLabelEn);

          return (
            <motion.div
              key={kpi.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`${styles.kpiCard} financial-kpi-card`}
            >
              <div className="flex items-center gap-3.5">
                <div className={styles.kpiIconWrapper}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={styles.kpiLabel}>{label}</p>
                  <div className={styles.kpiValue}>
                    {kpi.isAvailable && kpi.value !== null ? (
                      <SaudiRiyalAmount
                        amount={kpi.value}
                        locale={isRtl ? 'ar-SA' : 'en-US'}
                        className="font-black tabular-nums"
                        iconClassName="h-3.5 w-3.5 opacity-60 ml-1 inline"
                      />
                    ) : (
                      <span className={styles.kpiUnavailable}>
                        {isRtl ? 'غير متاح' : 'Unavailable'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Operational Sections: Monthly Chart & Invoices */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        {/* Monthly Performance Chart */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                {isRtl ? 'أداء آخر 6 أشهر' : 'Performance (Last 6 Months)'}
              </h3>
              <p className={styles.panelSubtitle}>
                {isRtl ? 'الدخل مقارنة بالمصروفات' : 'Income vs Expenses'}
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100" />
                {isRtl ? 'الدخل' : 'Income'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                {isRtl ? 'المصروفات' : 'Expenses'}
              </span>
            </div>
          </div>

          {chartBars.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end min-h-[220px] pt-4">
              {chartBars.map((bar, idx) => (
                <div key={`${bar.month}-${idx}`} className="flex flex-col items-center gap-2">
                  <div className="w-full h-36 flex items-end justify-center gap-1.5">
                    <div
                      className="w-4 rounded-t-md bg-amber-400 transition-all duration-300"
                      style={{ height: `${bar.expenseHeightPx}px` }}
                      title={`${isRtl ? 'المصروفات' : 'Expenses'}: ${bar.expenses}`}
                    />
                    <div
                      className="w-4 rounded-t-md bg-slate-900 dark:bg-slate-100 transition-all duration-300"
                      style={{ height: `${bar.incomeHeightPx}px` }}
                      title={`${isRtl ? 'الدخل' : 'Income'}: ${bar.income}`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black truncate max-w-[4rem]">{bar.month}</p>
                    <p className="text-[9px] font-bold text-slate-500 tabular-nums">
                      {formatFinancialAmount(bar.net, language as 'ar' | 'en')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-44 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
              {isRtl ? 'لا توجد بيانات مسجلة لآخر 6 أشهر' : 'No 6-month historical data recorded'}
            </div>
          )}
        </div>

        {/* Invoice Status Health */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                {isRtl ? 'حالة الفواتير' : 'Invoice Health'}
              </h3>
              <p className={styles.panelSubtitle}>
                {isRtl ? 'مؤشرات التحصيل والمديونيات' : 'Collections & Outstanding'}
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {[
              {
                label: isRtl ? 'فواتير مسددة' : 'Paid Invoices',
                count: stats?.invoiceStats?.paidCount ?? 0,
                total: stats?.invoiceStats?.paidTotal ?? 0,
                colorClass: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
              },
              {
                label: isRtl ? 'فواتير مستحقة وغير مسددة' : 'Unpaid & Outstanding',
                count: stats?.invoiceStats?.unpaidCount ?? 0,
                total: stats?.invoiceStats?.outstandingTotal ?? 0,
                colorClass: 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
              },
              {
                label: isRtl ? 'مسودات قيد الإعداد' : 'Draft Invoices',
                count: stats?.invoiceStats?.draftCount ?? 0,
                total: 0,
                colorClass: 'bg-slate-50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
              },
            ].map(row => (
              <div key={row.label} className={`rounded-xl border p-3.5 ${row.colorClass}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black">{row.label}</p>
                    <p className="text-[10px] font-bold opacity-75 mt-0.5">
                      {row.count} {isRtl ? 'فاتورة' : 'invoices'}
                    </p>
                  </div>
                  <div className="text-left font-black text-sm tabular-nums">
                    {row.total > 0 ? (
                      <SaudiRiyalAmount
                        amount={row.total}
                        locale={isRtl ? 'ar-SA' : 'en-US'}
                        className="font-black tabular-nums"
                      />
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Breakdown & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        {/* Expense Breakdown */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                {isRtl ? 'المصروفات حسب الفئة' : 'Expense Breakdown'}
              </h3>
              <p className={styles.panelSubtitle}>
                {isRtl ? 'تصنيف الإنفاق التشغيلي' : 'Operational spending'}
              </p>
            </div>
            <PieChart className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {(stats?.expenseBreakdown && stats.expenseBreakdown.length > 0) ? (
              stats.expenseBreakdown.map(item => {
                const maxExpense = Math.max(
                  ...(stats.expenseBreakdown || []).map(e => Number(e.total || 0)),
                  1
                );
                const widthPercent = Math.max((Number(item.total || 0) / maxExpense) * 100, item.total ? 10 : 0);

                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span>{item.category}</span>
                      <span className="tabular-nums font-black">
                        <SaudiRiyalAmount
                          amount={Number(item.total || 0)}
                          locale={isRtl ? 'ar-SA' : 'en-US'}
                          className="tabular-nums font-black"
                        />
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-900 dark:bg-slate-200 transition-all duration-300"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {isRtl ? 'لا توجد مصروفات مسجلة' : 'No recorded expenses'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Financial Activity */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>
                {isRtl ? 'آخر النشاطات المالية' : 'Recent Transactions'}
              </h3>
              <p className={styles.panelSubtitle}>
                {isRtl ? 'الحركات والقيود الأخيرة' : 'Latest financial ledger items'}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-slate-400" />
          </div>

          <div className="space-y-2.5">
            {(stats?.recentTransactions && stats.recentTransactions.length > 0) ? (
              stats.recentTransactions.slice(0, embedded ? 5 : 6).map(tx => (
                <div
                  key={tx.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                      {tx.type} • {tx.status}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <SaudiRiyalAmount
                      amount={Number(tx.amount || 0)}
                      locale={isRtl ? 'ar-SA' : 'en-US'}
                      className="font-black text-xs tabular-nums"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="h-32 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                {isRtl ? 'لا توجد حركات مالية حديثة' : 'No recent transactions'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Resilient Transactions Section
 * Full standalone table and mobile view with delete and retry capabilities.
 */
function TransactionsSection() {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await financialApi.getAllTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (isRtl ? 'تعذر تحميل المعاملات المالية' : 'Failed to load transactions'));
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذه المعاملة؟' : 'Are you sure you want to delete this transaction?')) {
      return;
    }
    try {
      await financialApi.deleteInvoice(id);
      setTransactions(prev => prev.filter(tx => tx.id !== id));
      toast.success(isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || (isRtl ? 'فشل الحذف' : 'Deletion failed'));
    }
  };

  return (
    <div className={styles.panelCard}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-5 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {t('fin.tab.transactions') || (isRtl ? 'المعاملات المالية' : 'Financial Transactions')}
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            {t('fin.transactions.desc') || (isRtl ? 'سجل العمليات والتحويلات المعتمدة' : 'Confirmed transaction log')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTransactions}
            disabled={loading}
            className="rounded-xl h-9 px-3 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ml-1 ${loading ? 'animate-spin' : ''}`} />
            {isRtl ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="py-12 text-center" role="alert">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={loadTransactions} className="rounded-xl">
            {isRtl ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
          <p className="text-xs font-bold text-slate-400 mt-2">{isRtl ? 'جارٍ تحميل المعاملات…' : 'Loading transactions…'}</p>
        </div>
      )}

      {/* Mobile Card View */}
      {!loading && !error && (
        <>
          <div className="md:hidden space-y-3 mt-4">
            {transactions.length > 0 ? (
              transactions.map(tx => (
                <div key={tx.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-black text-sm text-slate-900 dark:text-slate-100">{tx.type}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tx.id.slice(0, 8)}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {tx.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.amount') || (isRtl ? 'المبلغ' : 'Amount')}</p>
                      <p className="font-black text-sm tabular-nums">
                        <SaudiRiyalAmount amount={tx.amount} locale={isRtl ? 'ar-SA' : 'en-US'} />
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx.id)}
                      className="text-rose-600 hover:text-rose-800 font-bold text-xs p-1.5"
                    >
                      {t('common.delete') || (isRtl ? 'حذف' : 'Delete')}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 font-bold text-xs">
                {t('fin.noData') || (isRtl ? 'لا توجد معاملات مالية مسجلة' : 'No recorded transactions')}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">{t('fin.table.id') || 'ID'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">{t('fin.table.type') || 'Type'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">{t('fin.table.amount') || 'Amount'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider">{t('fin.table.commission') || 'Commission'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">{t('fin.table.status') || 'Status'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">{t('fin.table.date') || 'Date'}</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-wider text-center">{t('common.actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length > 0 ? (
                  transactions.map(tx => (
                    <TableRow key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="font-mono text-xs text-slate-500">{tx.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-bold text-xs">{tx.type}</TableCell>
                      <TableCell className="font-black text-xs tabular-nums">
                        <SaudiRiyalAmount amount={tx.amount} locale={isRtl ? 'ar-SA' : 'en-US'} />
                      </TableCell>
                      <TableCell className="font-bold text-xs tabular-nums text-slate-500">
                        {tx.commissionAmount ? (
                          <SaudiRiyalAmount amount={tx.commissionAmount} locale={isRtl ? 'ar-SA' : 'en-US'} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                          {tx.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500">
                        {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tx.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 h-8 px-2 text-xs"
                        >
                          {t('common.delete') || (isRtl ? 'حذف' : 'Delete')}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-bold text-xs">
                      {t('fin.noData') || (isRtl ? 'لا توجد معاملات مسجلة' : 'No recorded transactions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
