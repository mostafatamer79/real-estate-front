"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MobileAppHeader from '@/app/src/components/MobileAppHeader';
import { WalletTab, Commission } from './components/types';
import WalletTabs from './components/WalletSidebar';
import CommissionForm from './components/CommissionForm';
import CommissionList from './components/CommissionList';
import CommissionRequestModal from './components/CommissionRequestModal';
import InvoicesSection, { WalletInvoiceItem } from './components/InvoicesSection';
import WalletActivity, { type WalletEntry } from './components/WalletActivity';
import FilesSection from './components/FilesSection';
import InvestmentSection from './components/InvestmentSection';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { financialApi } from '@/lib/api';
import { apiClient } from '@/lib/client';
import { useSectionGuard } from '@/hooks/useSectionGuard';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './wallet-redesign.module.css';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { hapticTick } from '@/lib/haptics';

export type BalanceStatus = 'idle' | 'loading' | 'available' | 'stale' | 'error';
export type SectionFetchStatus = 'idle' | 'loading' | 'success' | 'stale' | 'error';

const WalletPage = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { isOpen, message, isAdmin } = useSectionGuard('wallet');
  const isRtl = language === 'ar';

  const getFirstAvailableTab = useCallback((): WalletTab => {
    const order: { id: WalletTab; key: string }[] = [
      { id: 'invoices', key: 'wallet_invoices' },
      { id: 'commission', key: 'wallet_commissions' },
      { id: 'files', key: 'wallet_files' },
      { id: 'invest', key: 'wallet_investments' },
    ];
    for (const item of order) {
      const flag = settings.moduleFlags[item.key];
      if (flag !== 'soon' && flag !== 'disabled') {
        return item.id;
      }
    }
    return 'invoices';
  }, [settings.moduleFlags]);

  const [activeTab, setActiveTab] = useState<WalletTab>(getFirstAvailableTab());
  const [isCommissionFormOpen, setIsCommissionFormOpen] = useState(false);
  const [invoicesData, setInvoicesData] = useState<WalletInvoiceItem[]>([]);
  const [subscriptionsData, setSubscriptionsData] = useState<WalletInvoiceItem[]>([]);
  const [invoicesStatus, setInvoicesStatus] = useState<SectionFetchStatus>('idle');
  const [subscriptionsStatus, setSubscriptionsStatus] = useState<SectionFetchStatus>('idle');
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [commissionsStatus, setCommissionsStatus] = useState<SectionFetchStatus>('idle');
  const [commissionsError, setCommissionsError] = useState<string | null>(null);
  const [files, setFiles] = useState<unknown[]>([]);
  const [filesStatus, setFilesStatus] = useState<SectionFetchStatus>('idle');
  const [filesError, setFilesError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<BalanceStatus>('idle');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [walletEntries, setWalletEntries] = useState<WalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [trackingCommission, setTrackingCommission] = useState<Commission | null>(null);

  const fetchIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const balanceRef = useRef<number | null>(null);
  const invoicesDataRef = useRef<WalletInvoiceItem[]>([]);
  const subscriptionsDataRef = useRef<WalletInvoiceItem[]>([]);
  const commissionsRef = useRef<Commission[]>([]);
  const filesRef = useRef<unknown[]>([]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => { balanceRef.current = balance; }, [balance]);
  useEffect(() => { invoicesDataRef.current = invoicesData; }, [invoicesData]);
  useEffect(() => { subscriptionsDataRef.current = subscriptionsData; }, [subscriptionsData]);
  useEffect(() => { commissionsRef.current = commissions; }, [commissions]);
  useEffect(() => { filesRef.current = files; }, [files]);

  const combinedInvoices = useMemo(() => {
    return [...subscriptionsData, ...invoicesData];
  }, [subscriptionsData, invoicesData]);

  // Ensure active tab updates when settings module flags change
  useEffect(() => {
    const flagKey = `wallet_${
      activeTab === 'commission' ? 'commissions' : activeTab === 'invest' ? 'investments' : activeTab
    }`;
    const flag = settings.moduleFlags[flagKey];
    if (flag === 'soon' || flag === 'disabled') {
      setActiveTab(getFirstAvailableTab());
    }
  }, [activeTab, getFirstAvailableTab, settings.moduleFlags]);

  const fetchData = useCallback(async () => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    setFetchError(null);
    setBalanceStatus((prev) => (prev === 'available' ? 'loading' : prev === 'stale' ? 'loading' : 'loading'));
    setInvoicesStatus((prev) => (prev === 'success' || prev === 'stale' ? 'loading' : 'loading'));
    setSubscriptionsStatus((prev) => (prev === 'success' || prev === 'stale' ? 'loading' : 'loading'));
    setCommissionsStatus((prev) => (prev === 'success' || prev === 'stale' ? 'loading' : 'loading'));
    setFilesStatus((prev) => (prev === 'success' || prev === 'stale' ? 'loading' : 'loading'));

    try {
      const [invoicesRes, commissionsRes, filesRes, subscriptionsRes, walletRes] =
        await Promise.allSettled([
          financialApi.getInvoices(),
          financialApi.getCommissions(),
          financialApi.getFiles(),
          apiClient.get('/subscriptions/my'),
          financialApi.getWallet(),
        ]);

      if (!isMountedRef.current || currentFetchId !== fetchIdRef.current) return;

      let hadCriticalFailure = false;

      // 1. Process Wallet Balance
      if (walletRes.status === 'fulfilled' && walletRes.value?.data) {
        const rawBalance = walletRes.value.data.balance;
        if (typeof rawBalance === 'number' && Number.isFinite(rawBalance)) {
          setBalance(rawBalance);
          setBalanceStatus('available');
        } else {
          setBalance(null);
          setBalanceStatus('error');
          hadCriticalFailure = true;
        }
        if (Array.isArray(walletRes.value.data.transactions)) {
          setWalletEntries(walletRes.value.data.transactions);
        }
      } else {
        hadCriticalFailure = true;
        // Do NOT substitute zero on error; preserve previous confirmed balance as explicitly stale,
        // marking freshness unavailable and blocking withdrawal until fresh confirmation
        if (balanceRef.current !== null && typeof balanceRef.current === 'number') {
          setBalanceStatus('stale');
        } else {
          setBalance(null);
          setBalanceStatus('error');
        }
      }

      // 2. Process Invoices independently
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value?.data) {
        const invArray = Array.isArray(invoicesRes.value.data) ? invoicesRes.value.data : [];
        const mapped = invArray
          .filter((inv: { referenceType?: string }) => inv.referenceType !== 'GeideaSubscription')
          .map((inv: {
            id: string;
            status: string;
            total: number | string;
            createdAt?: string;
            description?: string;
            [key: string]: unknown;
          }) => ({
            status: inv.status === 'paid' ? t('wallet.paid') || 'مدفوع' : t('wallet.pay') || 'دفع',
            amount: Number(inv.total).toLocaleString(),
            date: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('en-CA') : '',
            service: inv.description || t('wallet.service.default') || 'خدمة منصة',
            invoice: inv.id.substring(0, 8).toUpperCase(),
            originalStatus: inv.status,
            id: inv.id,
            isPendingDecision: false,
            raw: inv,
          }));
        setInvoicesData(mapped);
        setInvoicesStatus('success');
      } else {
        hadCriticalFailure = true;
        // Retain prior cached invoices independently
        setInvoicesStatus(invoicesDataRef.current.length > 0 ? 'stale' : 'error');
      }

      // Process Subscriptions independently
      if (subscriptionsRes.status === 'fulfilled' && subscriptionsRes.value?.data) {
        const subscriptionItems = Array.isArray(subscriptionsRes.value.data)
          ? subscriptionsRes.value.data
          : [];
        const mappedSubs: WalletInvoiceItem[] = subscriptionItems.map((sub: {
          id: string | number;
          status: string;
          amount?: number | string;
          createdAt?: string;
          departmentSlug?: string;
          managementPackage?: { name?: string };
          [key: string]: unknown;
        }) => ({
          status: sub.status,
          amount: Number(sub.amount || 0).toLocaleString(),
          date: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString('en-CA') : '',
          service: `اشتراك ${sub.managementPackage?.name || sub.departmentSlug || ''}`.trim(),
          invoice: `SUB-${String(sub.id).substring(0, 5).toUpperCase()}`,
          originalStatus: sub.status,
          id: String(sub.id),
          isSubscription: true,
          isSubscriptionActive: sub.status === 'نشط',
          subscriptionId: String(sub.id),
          raw: sub,
        }));
        setSubscriptionsData(mappedSubs);
        setSubscriptionsStatus('success');
      } else {
        hadCriticalFailure = true;
        // Retain prior cached subscriptions independently
        setSubscriptionsStatus(subscriptionsDataRef.current.length > 0 ? 'stale' : 'error');
      }

      // 3. Process Commissions
      if (commissionsRes.status === 'fulfilled' && commissionsRes.value?.data) {
        setCommissions(
          Array.isArray(commissionsRes.value.data) ? commissionsRes.value.data : []
        );
        setCommissionsStatus('success');
        setCommissionsError(null);
      } else {
        hadCriticalFailure = true;
        setCommissionsStatus(commissionsRef.current.length > 0 ? 'stale' : 'error');
        setCommissionsError(
          isRtl
            ? 'تعذر تحميل بيانات العمولات والسعي من الخادم. يرجى إعادة المحاولة.'
            : 'Could not load commission data from server. Please retry.'
        );
      }

      // 4. Process Files
      if (filesRes.status === 'fulfilled' && filesRes.value?.data) {
        setFiles(Array.isArray(filesRes.value.data) ? filesRes.value.data : []);
        setFilesStatus('success');
        setFilesError(null);
      } else {
        hadCriticalFailure = true;
        setFilesStatus(filesRef.current.length > 0 ? 'stale' : 'error');
        setFilesError(
          isRtl
            ? 'تعذر تحميل ملفات ومستندات المحفظة من الخادم. يرجى إعادة المحاولة.'
            : 'Could not load wallet documents and files from server. Please retry.'
        );
      }

      if (hadCriticalFailure) {
        setFetchError(
          isRtl
            ? 'تعذر تحديث بعض البيانات المالية. يرجى التحقق وإعادة المحاولة.'
            : 'Some financial data could not be refreshed. Please retry.'
        );
      }
    } catch {
      if (!isMountedRef.current || currentFetchId !== fetchIdRef.current) return;
      setFetchError(
        isRtl
          ? 'حدث خطأ أثناء تحميل بيانات المحفظة. يرجى إعادة المحاولة.'
          : 'An error occurred while loading wallet data. Please retry.'
      );
      if (balanceRef.current !== null && typeof balanceRef.current === 'number') {
        setBalanceStatus('stale');
      } else {
        setBalance(null);
        setBalanceStatus('error');
      }
      setInvoicesStatus(invoicesDataRef.current.length > 0 ? 'stale' : 'error');
      setSubscriptionsStatus(subscriptionsDataRef.current.length > 0 ? 'stale' : 'error');
      setCommissionsStatus(commissionsRef.current.length > 0 ? 'stale' : 'error');
      setFilesStatus(filesRef.current.length > 0 ? 'stale' : 'error');
    } finally {
      if (isMountedRef.current && currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [isRtl, t]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [fetchData, isOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const tab = new URLSearchParams(window.location.search).get('tab') as WalletTab | null;
    if (tab && ['invoices', 'commission', 'files', 'invest'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const handleTabChange = (tab: WalletTab) => {
    hapticTick();
    setActiveTab(tab);
    if (tab !== 'commission') {
      setIsCommissionFormOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t('wallet.wallet') || 'المحفظة'}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div
      className={`${styles.walletRoot} w-full min-h-dvh-safe relative overflow-x-hidden`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <MobileAppHeader theme={settings.isDark ? "dark" : "light"} title={t('action.wallet') || 'المحفظة'} />

      {/* Loading Skeleton */}
      {isLoading && balance === null && combinedInvoices.length === 0 && (
        <div className="w-full max-w-[1600px] mx-auto relative z-10 px-4 pt-16 pb-32">
          <div className="space-y-6">
            <div className="h-10 w-48 rounded-xl bg-slate-200/80 dark:bg-white/10 animate-pulse" />
            <div className="h-44 w-full rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
            <div className="h-64 w-full rounded-2xl bg-slate-200/60 dark:bg-white/5 animate-pulse" />
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      {(!isLoading || balance !== null || combinedInvoices.length > 0) && (
        <Tabs
          value={activeTab}
          onValueChange={(tab) => handleTabChange(tab as WalletTab)}
          activationMode="manual"
          dir={isRtl ? 'rtl' : 'ltr'}
          className="relative z-10 mx-auto w-full min-w-0 max-w-[1360px] px-3 pb-8 pt-3 sm:px-6 md:pt-6"
        >
          <WalletTabs />
          <main>
            <TabsContent value={activeTab} className={styles.workspace}>
              {activeTab === 'invoices' && (
                <>
                  <InvoicesSection
                    invoices={combinedInvoices}
                    onRefresh={fetchData}
                    balance={balance}
                    balanceStatus={balanceStatus}
                    fetchError={fetchError}
                    isLoading={isLoading}
                    invoicesStatus={invoicesStatus}
                    subscriptionsStatus={subscriptionsStatus}
                  />
                  <WalletActivity entries={walletEntries} />
                </>
              )}

              {activeTab === 'commission' &&
                (isCommissionFormOpen ? (
                  <CommissionForm
                    onClose={() => {
                      setIsCommissionFormOpen(false);
                      fetchData();
                    }}
                    onSuccess={() => {
                      setIsCommissionFormOpen(false);
                      fetchData();
                    }}
                  />
                ) : commissionsStatus === 'error' && commissions.length === 0 ? (
                  <div role="alert" className={styles.sectionErrorCard}>
                    <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                      {isRtl ? 'تعذر تحميل بيانات العمولات والسعي' : 'Failed to load commissions'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-5 max-w-md mx-auto">
                      {commissionsError || (isRtl ? 'حدث خطأ أثناء الاتصال بالخادم. يرجى إعادة المحاولة.' : 'A network error occurred. Please retry.')}
                    </p>
                    <button
                      type="button"
                      onClick={fetchData}
                      className={styles.retryButton}
                    >
                      <RefreshCw className="w-4 h-4 ml-1.5" />
                      <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {commissionsStatus === 'stale' && (
                      <div role="alert" className={styles.sectionWarningBanner}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                            {isRtl ? 'البيانات المعروضة سابقة؛ تعذر التحديث الأخير من الخادم.' : 'Displayed data is cached; latest server refresh failed.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={fetchData}
                          className={styles.retryButton}
                        >
                          <RefreshCw className="w-3.5 h-3.5 ml-1" />
                          <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                        </button>
                      </div>
                    )}
                    <CommissionList
                      commissions={commissions}
                      onRefresh={fetchData}
                      onNewRequest={() => setIsCommissionFormOpen(true)}
                      onTrackRequest={(commission) => setTrackingCommission(commission)}
                    />
                  </>
                ))}

              {activeTab === 'files' &&
                (filesStatus === 'error' && files.length === 0 ? (
                  <div role="alert" className={styles.sectionErrorCard}>
                    <AlertCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto mb-3" />
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1.5">
                      {isRtl ? 'تعذر تحميل ملفات ومستندات المحفظة' : 'Failed to load wallet files'}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mb-5 max-w-md mx-auto">
                      {filesError || (isRtl ? 'حدث خطأ أثناء جلب الملفات. يرجى إعادة المحاولة.' : 'An error occurred fetching files. Please retry.')}
                    </p>
                    <button
                      type="button"
                      onClick={fetchData}
                      className={styles.retryButton}
                    >
                      <RefreshCw className="w-4 h-4 ml-1.5" />
                      <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {filesStatus === 'stale' && (
                      <div role="alert" className={styles.sectionWarningBanner}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-200">
                            {isRtl ? 'قائمة الملفات المعروضة سابقة؛ تعذر التحديث الأخير من الخادم.' : 'Displayed file list is cached; latest server refresh failed.'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={fetchData}
                          className={styles.retryButton}
                        >
                          <RefreshCw className="w-3.5 h-3.5 ml-1" />
                          <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                        </button>
                      </div>
                    )}
                    <FilesSection files={files} />
                  </>
                ))}

              {activeTab === 'invest' && <InvestmentSection />}
            </TabsContent>
          </main>
        </Tabs>
      )}

      <CommissionRequestModal
        open={!!trackingCommission}
        onOpenChange={(open) => !open && setTrackingCommission(null)}
        requestNumber={trackingCommission?.commissionNumber || ''}
        requestDate={
          trackingCommission?.createdAt
            ? new Date(trackingCommission.createdAt).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')
            : ''
        }
        requestStatus={(trackingCommission?.status as 'pending' | 'approved' | 'rejected' | 'in_progress') || 'pending'}
      />
    </div>
  );
};

export default WalletPage;
