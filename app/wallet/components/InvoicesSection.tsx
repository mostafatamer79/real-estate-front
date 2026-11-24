"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Invoice } from './types';
import InvoiceModal from '@/app/src/components/invoice';
import { apiClient } from '@/lib/client';
import { financialApi } from '@/lib/api';
import { serviceRequestApi } from '@/lib/service-request-api';
import toast from 'react-hot-toast';
import PaymentMethodsModal from '@/components/Payment/PaymentMethodsModal';
import { SaudiRiyalAmount, SaudiRiyalSymbol } from '@/components/ui/saudi-riyal';
import { geideaEnabled, useGeideaCheckout } from '@/hooks/useGeideaCheckout';
import { mapWalletInvoice } from '@/lib/wallet-invoice-data';
import {
  validateWithdrawal,
  validateTopupAmount,
  isConfirmedBalance,
  formatConfirmedBalance,
} from '@/lib/redesign-wallet-amount';
import styles from '../wallet-redesign.module.css';

export interface WalletInvoiceItem extends Partial<Invoice> {
  id: string;
  invoice?: string;
  amount?: string;
  date?: string;
  service?: string;
  status?: string;
  originalStatus?: string;
  isSubscription?: boolean;
  isSubscriptionActive?: boolean;
  subscriptionId?: string;
  isPendingDecision?: boolean;
  isUnderReview?: boolean;
  originalDecision?: string;
  raw?: Record<string, unknown>;
}

interface InvoicesSectionProps {
  invoices: WalletInvoiceItem[];
  onRefresh?: () => void;
  balance?: number | null;
  balanceStatus?: 'idle' | 'loading' | 'available' | 'stale' | 'error';
  fetchError?: string | null;
  isLoading?: boolean;
  invoicesStatus?: 'idle' | 'loading' | 'success' | 'stale' | 'error';
  subscriptionsStatus?: 'idle' | 'loading' | 'success' | 'stale' | 'error';
}

const InvoicesSection: React.FC<InvoicesSectionProps> = ({
  invoices,
  onRefresh,
  balance = null,
  balanceStatus = 'available',
  fetchError = null,
  isLoading = false,
  invoicesStatus = 'idle',
  subscriptionsStatus = 'idle',
}) => {
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  const topup = useGeideaCheckout(language);

  // Modal and action states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<(ReturnType<typeof mapWalletInvoice> & { paymentStatus: "paid" | "unpaid" }) | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Balance Action Dialog States
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<WalletInvoiceItem | null>(null);

  // Synchronous pending guards & unmounted refs
  const isMountedRef = useRef(true);
  const withdrawalPendingRef = useRef(false);
  const topupPendingRef = useRef(false);
  const decisionPendingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const confirmed = isConfirmedBalance(balance) && balanceStatus === 'available';
  const isStale = isConfirmedBalance(balance) && balanceStatus === 'stale';

  const handleDecision = async (
    id: string,
    decision: 'accepted' | 'rejected',
    invoiceItem?: WalletInvoiceItem
  ) => {
    if (decisionPendingRef.current) return;
    decisionPendingRef.current = true;
    setProcessingId(id);

    try {
      await apiClient.put(`/service-requests/${id}/client-decision`, { decision });
      if (!isMountedRef.current) return;
      toast.success(
        decision === 'accepted'
          ? t('legal.decision.successAccept') || 'تم قبول الطلب بنجاح'
          : t('legal.decision.successReject') || 'تم رفض الطلب'
      );

      if (decision === 'accepted' && invoiceItem) {
        setPaymentInvoice(invoiceItem);
        setIsPaymentModalOpen(true);
      }
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || t('legal.decision.error') || 'فشل تنفيذ القرار');
    } finally {
      decisionPendingRef.current = false;
      if (isMountedRef.current) {
        setProcessingId(null);
      }
    }
  };

  const handleAddCredit = async () => {
    if (isSubmitting || topupPendingRef.current) return;

    const validation = validateTopupAmount(addAmount, 1, 10000);
    if (!validation.ok) {
      switch (validation.error) {
        case 'BELOW_MIN':
        case 'EXCEEDS_MAX':
          toast.error(
            isRtl
              ? 'أدخل مبلغاً بين 1 و 10,000 ر.س.'
              : 'Enter an amount between 1 and 10,000 SAR.'
          );
          break;
        case 'SUB_CENT':
          toast.error(
            isRtl
              ? 'المبلغ لا يقبل أجزاء الهللة (منزلتين عشريتين كحد أقصى).'
              : 'Amount cannot have sub-cent fractions (maximum 2 decimal places).'
          );
          break;
        default:
          toast.error(
            isRtl
              ? 'أدخل مبلغاً صحيحاً بين 1 و 10,000 ر.س بمنزلتين عشريتين كحد أقصى.'
              : 'Enter a valid amount between 1 and 10,000 SAR with up to two decimal places.'
          );
          break;
      }
      return;
    }

    topupPendingRef.current = true;
    setIsSubmitting(true);

    try {
      const success = await topup.pay({ walletTopupAmount: validation.amount });
      if (!isMountedRef.current) return;
      if (success) {
        toast.success(isRtl ? 'تم شحن المحفظة بنجاح' : 'Wallet topped up successfully');
        setShowAddDialog(false);
        setAddAmount('');
        onRefresh?.();
      }
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj?.response?.data?.message || (isRtl ? 'فشلت عملية الشحن' : 'Top-up failed')
      );
    } finally {
      topupPendingRef.current = false;
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleWithdrawal = async () => {
    if (isSubmitting || withdrawalPendingRef.current) return;

    // Strict guard against stale or unconfirmed balance
    if (!confirmed || balanceStatus !== 'available') {
      toast.error(
        isRtl
          ? 'الرصيد غير مؤكد حالياً؛ تم حظر السحب حتى تحديث البيانات بنجاح.'
          : 'Balance is currently unconfirmed; withdrawal is blocked until refresh succeeds.'
      );
      return;
    }

    const validation = validateWithdrawal(withdrawAmount, balance, confirmed);
    if (!validation.ok) {
      switch (validation.error) {
        case 'BALANCE_UNAVAILABLE':
          toast.error(
            isRtl
              ? 'الرصيد غير متوفر حالياً لإجراء السحب.'
              : 'Balance is currently unavailable for withdrawal.'
          );
          break;
        case 'ZERO_OR_NEGATIVE':
          toast.error(
            isRtl
              ? 'يرجى إدخال مبلغ سحب موجب أكبر من الصفر.'
              : 'Please enter a positive withdrawal amount greater than zero.'
          );
          break;
        case 'SUB_CENT':
          toast.error(
            isRtl
              ? 'المبلغ لا يقبل أجزاء الهللة (منزلتين عشريتين كحد أقصى).'
              : 'Amount cannot have sub-cent fractions (maximum 2 decimal places).'
          );
          break;
        case 'EXCEEDS_BALANCE':
          toast.error(
            isRtl
              ? 'المبلغ المطلوب يتجاوز الرصيد المؤكد المتاح.'
              : 'Requested amount exceeds confirmed available balance.'
          );
          break;
        case 'INVALID_FORMAT':
        default:
          toast.error(
            isRtl
              ? 'يرجى إدخال مبلغ صحيح (مثال: 150.50).'
              : 'Please enter a valid numeric amount (e.g. 150.50).'
          );
          break;
      }
      return;
    }

    withdrawalPendingRef.current = true;
    setIsSubmitting(true);

    try {
      await apiClient.post('/financial/withdraw', { amount: validation.amount });
      if (!isMountedRef.current) return;
      toast.success(isRtl ? 'تم تقديم طلب السحب بنجاح.' : 'Withdrawal request submitted successfully.');
      setShowWithdrawDialog(false);
      setWithdrawAmount(''); // Cleared only on authoritative server success
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      // Retain user input on failure
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(
        errorObj?.response?.data?.message ||
        (isRtl ? 'فشل طلب السحب، يرجى المحاولة لاحقاً.' : 'Withdrawal request failed. Please try again.')
      );
    } finally {
      withdrawalPendingRef.current = false;
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const handleViewInvoice = (invoiceItem: WalletInvoiceItem) => {
    const mapped = mapWalletInvoice(invoiceItem as Parameters<typeof mapWalletInvoice>[0]);
    setSelectedInvoice({ ...mapped, paymentStatus: mapped.paymentStatus === "paid" ? "paid" : "unpaid" });
    setShowInvoiceModal(true);
  };

  // Sync selectedInvoice when invoices prop updates
  useEffect(() => {
    if (selectedInvoice && invoices) {
      const updated = invoices.find((inv) => inv.id === selectedInvoice.id);
      if (updated) {
        const mapped = mapWalletInvoice(updated as Parameters<typeof mapWalletInvoice>[0]);
        setSelectedInvoice({ ...mapped, paymentStatus: mapped.paymentStatus === "paid" ? "paid" : "unpaid" });
      }
    }
  }, [invoices, selectedInvoice?.id]);

  const handleDeleteInvoice = async (
    id: string,
    isSubscription?: boolean,
    invoiceItem?: WalletInvoiceItem
  ) => {
    if (!confirm(t('common.confirmDelete') || 'هل أنت متأكد من الحذف؟')) return;

    setProcessingId(id);
    try {
      if (isSubscription) {
        await apiClient.delete(`/subscriptions/${id}`);
      } else if (
        invoiceItem?.isPendingDecision ||
        invoiceItem?.isUnderReview ||
        invoiceItem?.invoice?.startsWith('REQ-')
      ) {
        await serviceRequestApi.remove(id);
      } else {
        await financialApi.deleteInvoice(id);
      }
      if (!isMountedRef.current) return;
      toast.success(t('common.deleteSuccess') || 'تم الحذف بنجاح');
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const errorObj = err as { response?: { data?: { message?: string } } };
      toast.error(errorObj?.response?.data?.message || t('common.deleteError') || 'فشل الحذف');
    } finally {
      if (isMountedRef.current) {
        setProcessingId(null);
      }
    }
  };

  const StatusBadge = ({ invoiceItem }: { invoiceItem: WalletInvoiceItem }) => {
    const isPaid =
      invoiceItem.isSubscriptionActive ||
      invoiceItem.status === t('wallet.paid') ||
      invoiceItem.status === 'مدفوع' ||
      invoiceItem.status === 'تم الدفع';

    const isPending =
      invoiceItem.isPendingDecision && !isPaid;

    let badgeClass = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40';
    if (isPaid) {
      badgeClass = 'bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-400/40';
    } else if (invoiceItem.isUnderReview) {
      badgeClass = 'bg-slate-200/60 text-slate-700 dark:bg-white/10 dark:text-slate-300 border-slate-300/40';
    } else if (isPending) {
      badgeClass = 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-400/40';
    }

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${badgeClass}`}
      >
        {invoiceItem.status}
      </span>
    );
  };

  const ActionButtons = ({ invoiceItem }: { invoiceItem: WalletInvoiceItem }) => {
    const isPaid =
      invoiceItem.isSubscriptionActive ||
      invoiceItem.status === t('wallet.paid') ||
      invoiceItem.status === 'مدفوع' ||
      invoiceItem.status === 'تم الدفع';

    return (
      <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-bold"
          onClick={() => handleViewInvoice(invoiceItem)}
          aria-label={`${t('common.view') || 'عرض'} ${invoiceItem.invoice || ''}`}
        >
          <Eye className="w-3.5 h-3.5 ml-1" />
          {t('common.view') || 'عرض'}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-9 px-3 text-rose-600 hover:text-rose-800 hover:bg-rose-500/10 font-bold"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteInvoice(invoiceItem.id, invoiceItem.isSubscription, invoiceItem);
          }}
          disabled={processingId === invoiceItem.id}
          aria-label={`${t('common.delete') || 'حذف'} ${invoiceItem.invoice || ''}`}
        >
          {processingId === invoiceItem.id ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5 ml-1" />
              {t('common.delete') || 'حذف'}
            </>
          )}
        </Button>

        {invoiceItem.isSubscriptionActive ? (
          <span className="text-[11px] font-black text-slate-800 dark:text-slate-300 px-3 py-1.5 bg-slate-500/15 rounded-lg border border-slate-400/30">
            {isRtl ? 'نشط' : 'Active'}
          </span>
        ) : invoiceItem.isUnderReview ? (
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 px-3 py-1.5 bg-slate-100 dark:bg-white/10 rounded-lg border border-slate-200 dark:border-white/10">
            {isRtl ? 'بانتظار التسعير' : 'Under Review'}
          </span>
        ) : invoiceItem.isPendingDecision && !isPaid ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              className="h-9 px-3 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                handleDecision(invoiceItem.id, 'accepted', invoiceItem);
              }}
              disabled={processingId === invoiceItem.id}
            >
              <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
              {t('legal.decision.accept') || 'قبول'}
            </Button>
            {invoiceItem.originalDecision !== 'rejected' && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3 border-rose-300 text-rose-700 hover:bg-rose-100 dark:text-rose-300 font-bold rounded-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDecision(invoiceItem.id, 'rejected');
                }}
                disabled={processingId === invoiceItem.id}
              >
                <XCircle className="w-3.5 h-3.5 ml-1" />
                {t('legal.decision.reject') || 'رفض'}
              </Button>
            )}
          </div>
        ) : (
          !isPaid && (
            <Button
              size="sm"
              className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-400 dark:hover:bg-slate-300 dark:text-slate-950 text-white font-black rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                setPaymentInvoice(invoiceItem);
                setIsPaymentModalOpen(true);
              }}
            >
              {invoiceItem.isSubscription ? (isRtl ? 'دفع الاشتراك' : 'Pay Subscription') : (t('wallet.pay') || 'دفع')}
            </Button>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* Explicit Fetch Failure / Retry Banner */}
      {fetchError && (
        <div role="alert" className={styles.retryBanner}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400 shrink-0" />
            <p className="text-sm font-bold">{fetchError}</p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] rounded-lg bg-slate-600 dark:bg-slate-400 text-white dark:text-slate-950 font-black text-xs hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {/* Financial Balance Hero Card */}
      <section aria-labelledby="wallet-balance-heading" className={styles.balanceHero}>
        <svg className={styles.ledgerGraphic} viewBox="0 0 220 150" fill="none" aria-hidden="true" focusable="false">
          <rect className={styles.graphicFrame} x="44" y="20" width="132" height="110" rx="12" />
          <path className={styles.graphicRule} d="M64 48H156M64 69H120M64 90H105M64 111H94" />
          <path className={styles.graphicTransfer} d="M132 91H194M182 79L194 91L182 103M194 118H132M144 106L132 118L144 130" />
        </svg>
        <div className={styles.balanceLayout}>
          <div className={styles.balanceDetails}>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-200/70 dark:bg-white/10 text-slate-800 dark:text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <span id="wallet-balance-heading" className="text-slate-600 dark:text-slate-400 font-bold text-sm">
                {t('wallet.balance.label') || 'الرصيد الفعلي للمحفظة'}
              </span>

              {/* Status Indicator */}
              {confirmed ? (
                <span className={`${styles.balanceStatusBadge} ${styles.balanceStatusActive}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400" />
                  {isRtl ? 'رصيد مؤكد' : 'Confirmed'}
                </span>
              ) : isStale ? (
                <span className={`${styles.balanceStatusBadge} ${styles.balanceStatusStale}`}>
                  <AlertCircle className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  {isRtl ? 'رصيد قديم / غير مؤكد' : 'Stale / Unconfirmed'}
                </span>
              ) : (
                <span className={`${styles.balanceStatusBadge} ${styles.balanceStatusUnavailable}`}>
                  <AlertCircle className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  {isRtl ? 'غير متوفر مؤقتاً' : 'Unavailable'}
                </span>
              )}
            </div>

            {/* Balance Typography */}
            <div className="flex items-baseline gap-3">
              <h2 dir="ltr" className={styles.balanceAmountTypography}>
                {confirmed || isStale ? formatConfirmedBalance(balance, 'en-US') : '—'}
              </h2>
              <SaudiRiyalSymbol className="text-slate-700 dark:text-slate-300" iconClassName="h-5 w-5" />
            </div>

            {isStale && (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                {isRtl
                  ? 'تعذر تحديث الرصيد مؤخراً. تم حظر طلبات السحب لحين تأكيد الرصيد من الخادم.'
                  : 'Balance refresh failed. Withdrawals are blocked until confirmed by server.'}
              </p>
            )}
            {!confirmed && !isStale && !isLoading && (
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-400">
                {isRtl
                  ? 'تعذر تأكيد الرصيد من الخادم؛ تم تعطيل عمليات السحب لحماية حسابك.'
                  : 'Balance unconfirmed by server. Withdrawal is temporarily disabled.'}
              </p>
            )}
          </div>

          {/* Quick Actions (44px min controls) */}
          <div className={styles.balanceActions}>
            <button
              type="button"
              onClick={() => setShowAddDialog(true)}
              className={styles.actionBtnPrimary}
            >
              <ArrowDownCircle className="w-4 h-4" />
              <span>{t('wallet.balance.add') || 'شحن الرصيد'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWithdrawDialog(true)}
              disabled={!confirmed || (typeof balance === 'number' && balance <= 0)}
              aria-disabled={!confirmed || (typeof balance === 'number' && balance <= 0)}
              className={styles.actionBtnSecondary}
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>{t('wallet.balance.withdraw') || 'طلب سحب'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Open Financial Ledger Section */}
      <section aria-labelledby="invoices-ledger-heading" className={styles.ledgerContainer}>
        <div className="p-4 sm:p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 id="invoices-ledger-heading" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('wallet.invoices.title') || 'سجل الفواتير والمطالبات المالية'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-bold text-xs sm:text-sm mt-0.5">
                {t('wallet.invoices.manageDesc') || 'متابعة الفواتير المعتمدة وعمليات السداد للمحفظة'}
              </p>
            </div>
          </div>

          {/* Partial ledger refresh stale indicator */}
          {(invoicesStatus === 'stale' || subscriptionsStatus === 'stale') && (
            <div role="alert" className="p-3 mb-4 rounded-xl bg-slate-500/10 border border-slate-500/25 text-xs font-bold text-slate-900 dark:text-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />
                <span>
                  {invoicesStatus === 'stale' && subscriptionsStatus === 'stale'
                    ? (isRtl ? 'تعذر تحديث سجل الفواتير والاشتراكات؛ يتم عرض البيانات المحفوظة.' : 'Could not refresh invoices and subscriptions; showing cached records.')
                    : invoicesStatus === 'stale'
                      ? (isRtl ? 'تعذر تحديث الفواتير؛ يتم عرض الفواتير السابقة مع الاشتراكات المحدثة.' : 'Could not refresh invoices; showing cached invoices alongside updated subscriptions.')
                      : (isRtl ? 'تعذر تحديث الاشتراكات؛ يتم عرض الاشتراكات السابقة مع الفواتير المحدثة.' : 'Could not refresh subscriptions; showing cached subscriptions alongside updated invoices.')}
                </span>
              </div>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-600/15 dark:bg-slate-400/20 text-slate-900 dark:text-slate-200 hover:bg-slate-600/25 text-[11px] font-black transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isRtl ? 'إعادة المحاولة' : 'Retry'}</span>
                </button>
              )}
            </div>
          )}

          {/* Desktop Ledger Table (>= md) */}
          <div className="hidden md:block rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <Table className={styles.ledgerTable}>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.table.invoiceNo') || 'رقم الفاتورة'}
                    </TableHead>
                    <TableHead className="text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.table.service') || 'الخدمة'}
                    </TableHead>
                    <TableHead className="text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.table.date') || 'التاريخ'}
                    </TableHead>
                    <TableHead className="text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.table.amount') || 'المبلغ'}
                    </TableHead>
                    <TableHead className="text-center font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.table.status') || 'الحالة'}
                    </TableHead>
                    <TableHead className="text-left font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {t('wallet.commission.actions') || 'الإجراءات'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoiceItem, index) => (
                    <TableRow key={invoiceItem.id || index} className={styles.ledgerRow}>
                      <TableCell className="font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {invoiceItem.invoice || invoiceItem.id.substring(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-[220px] truncate">
                        {invoiceItem.service}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {invoiceItem.date}
                      </TableCell>
                      <TableCell className="font-black text-slate-900 dark:text-white whitespace-nowrap">
                        <SaudiRiyalAmount
                          amount={Number(String(invoiceItem.amount).replace(/,/g, '')) || 0}
                          locale={isRtl ? 'ar-SA' : 'en-US'}
                        />
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <StatusBadge invoiceItem={invoiceItem} />
                      </TableCell>
                      <TableCell className="text-left whitespace-nowrap">
                        <ActionButtons invoiceItem={invoiceItem} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Ledger Cards (< md) */}
          <div className="md:hidden space-y-3">
            {invoices.map((invoiceItem, index) => (
              <article key={invoiceItem.id || index} className={styles.mobileLedgerCard}>
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">
                      {t('wallet.table.invoiceNo') || 'رقم الفاتورة'}
                    </p>
                    <p className="font-extrabold text-slate-900 dark:text-white truncate">
                      {invoiceItem.invoice || invoiceItem.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <StatusBadge invoiceItem={invoiceItem} />
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-3 pt-2 border-t border-slate-100 dark:border-white/5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {t('wallet.table.service') || 'الخدمة'}
                    </p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {invoiceItem.service}
                    </p>
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {t('wallet.table.amount') || 'المبلغ'}
                    </p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">
                      <SaudiRiyalAmount
                        amount={Number(String(invoiceItem.amount).replace(/,/g, '')) || 0}
                        locale={isRtl ? 'ar-SA' : 'en-US'}
                      />
                    </p>
                  </div>
                  <div className="min-w-0 col-span-2">
                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {t('wallet.table.date') || 'التاريخ'}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {invoiceItem.date}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                  <ActionButtons invoiceItem={invoiceItem} />
                </div>
              </article>
            ))}

            {/* Empty State */}
            {!isLoading && invoices.length === 0 && !fetchError && (
              <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-8 text-center">
                <p className="text-sm font-black text-slate-600 dark:text-slate-400 mb-1">
                  {t('common.noData') || 'لا توجد فواتير أو حركات مالية مسجلة'}
                </p>
                <p className="text-xs text-slate-500">
                  {isRtl ? 'ستظهر هنا الفواتير المعتمدة والمطالبات المالية عند إصدارها.' : 'Approved invoices and claims will appear here once issued.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Invoice Detail Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        serviceRequest={selectedInvoice}
        onDecision={handleDecision}
        onPay={(inv) => {
          setPaymentInvoice(inv as WalletInvoiceItem);
          setIsPaymentModalOpen(true);
        }}
        isPendingDecision={selectedInvoice?.isPendingDecision as boolean | undefined}
      />

      {/* Add Balance / Top-Up Dialog */}
      <Dialog
        modal={!topup.processing}
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!topup.processing) setShowAddDialog(open);
        }}
      >
        <DialogContent
          className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('wallet.balance.addTitle') || 'إضافة رصيد للمحفظة'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <label htmlFor="topup-amount-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                {t('wallet.balance.enterAmount') || 'أدخل المبلغ (بين 1 و 10,000 ر.س)'}
              </label>
              <div className="relative">
                <Input
                  id="topup-amount-input"
                  type="text"
                  inputMode="decimal"
                  disabled={topup.processing || topup.pending || isSubmitting}
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-14 text-xl font-black rounded-xl border-2 focus-visible:ring-2 pl-12 text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <SaudiRiyalSymbol iconClassName="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t('wallet.balance.paymentMethod') || 'طريقة الدفع المتاحة'}
              </p>
              <div className="p-3.5 rounded-xl border-2 border-slate-600/40 dark:border-slate-400/40 bg-slate-500/5 flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-700 dark:text-slate-400" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {isRtl ? 'بطاقة مدى / ائتمانية' : 'Mada / Credit Card'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2.5">
            <Button
              onClick={handleAddCredit}
              disabled={!geideaEnabled || !addAmount || isSubmitting}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-400 dark:hover:bg-slate-300 text-white dark:text-slate-950 font-black text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : topup.pending ? (
                isRtl ? 'التحقق من حالة الدفع' : 'Checking payment status'
              ) : (
                t('wallet.balance.confirm') || 'تأكيد عملية الشحن'
              )}
            </Button>
            {topup.error && (
              <p role="alert" className="text-xs text-rose-600 font-bold mt-1 text-center">
                {topup.error}
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Balance Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent
          className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {t('wallet.balance.withdrawTitle') || 'طلب سحب رصيد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                {t('wallet.balance.availableForWithdraw') || 'الرصيد المؤكد المتاح للسحب'}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                  {confirmed ? formatConfirmedBalance(balance, isRtl ? 'ar-SA' : 'en-US') : '—'}
                </h3>
                <SaudiRiyalSymbol className="text-slate-600 dark:text-slate-400" iconClassName="h-4 w-4" />
              </div>
              {isStale && (
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-2">
                  {isRtl
                    ? 'الرصيد غير مؤكد حالياً؛ تم تعطيل السحب حتى يتم التحديث بنجاح.'
                    : 'Balance is unconfirmed; withdrawal is disabled until refresh succeeds.'}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="withdraw-amount-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                {t('wallet.balance.withdrawAmount') || 'المبلغ المراد سحبه'}
              </label>
              <div className="relative">
                <Input
                  id="withdraw-amount-input"
                  type="text"
                  inputMode="decimal"
                  disabled={isSubmitting || !confirmed}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="h-14 text-xl font-black rounded-xl border-2 focus-visible:ring-2 pl-12 text-slate-900 dark:text-white"
                  placeholder="0.00"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <SaudiRiyalSymbol iconClassName="h-4 w-4" />
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                {isRtl ? '* تخضع عملية التحويل للتحقق البنكي وتستغرق 24-48 ساعة عمل.' : '* Subject to bank verification and takes 24-48 business hours.'}
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2.5">
            <Button
              onClick={handleWithdrawal}
              disabled={!withdrawAmount || isSubmitting || !confirmed}
              className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-400 dark:hover:bg-slate-300 text-white dark:text-slate-950 font-black text-base"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                t('wallet.balance.confirmWithdraw') || 'تأكيد طلب السحب'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Methods Modal for invoice checkout */}
      <PaymentMethodsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={paymentInvoice?.isSubscription ? undefined : paymentInvoice?.id}
        subscriptionId={paymentInvoice?.isSubscription ? paymentInvoice?.subscriptionId : undefined}
        allowWallet={
          !['GeideaWalletTopup', 'GeideaSubscription'].includes(
            (paymentInvoice?.raw as { referenceType?: string } | undefined)?.referenceType || ''
          ) && !paymentInvoice?.isSubscription
        }
        price={parseFloat(String(paymentInvoice?.amount || '0').replace(/,/g, ''))}
        onPaymentSuccess={async () => {
          if (onRefresh) onRefresh();
          toast.success(t('payment.success') || 'تم الدفع بنجاح');
        }}
      />
    </div>
  );
};

export default InvoicesSection;
