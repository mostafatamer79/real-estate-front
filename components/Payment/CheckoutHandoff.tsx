'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { geideaEnabled, useGeideaCheckout } from '@/hooks/useGeideaCheckout';
import { useLanguage } from '@/context/LanguageContext';
import { checkoutTarget } from '@/lib/checkout-target';
import {
  buildGuestLoginUrl,
  getTargetMetadata,
  getTargetDisplayLabel,
} from '@/lib/redesign-chat03-checkout';
import { ShieldCheck, AlertCircle, ArrowRight, Lock, Loader2 } from 'lucide-react';
import styles from '@/components/redesign/chat03/checkout.module.css';

export default function CheckoutHandoff() {
  const query = useSearchParams();
  const { language } = useLanguage();
  const { isLoading, isAuthenticated } = useAuth();
  const checkout = useGeideaCheckout(language);
  const target = checkoutTarget(new URLSearchParams(query.toString()));
  const ar = language === 'ar';
  const meta = getTargetMetadata(target);
  const targetLabel = getTargetDisplayLabel(meta.type, ar ? 'ar' : 'en');

  const pay = async () => {
    if (!target || isLoading || !isAuthenticated || !geideaEnabled || checkout.processing) return;
    if (await checkout.pay(target)) {
      window.location.assign('/wallet');
    }
  };

  return (
    <div className={styles.checkoutRoot} dir={ar ? 'rtl' : 'ltr'}>
      <section className={styles.checkoutCard} aria-labelledby="checkout-heading">
        <header className={styles.checkoutHeader}>
          <div className={styles.iconShield} aria-hidden="true">
            {target ? (
              <ShieldCheck className="w-7 h-7" />
            ) : (
              <AlertCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <h1 id="checkout-heading" className={styles.title}>
            {target
              ? ar
                ? 'الدفع الآمن عبر جيديا'
                : 'Secure Payment with Geidea'
              : ar
                ? 'رابط دفع غير صالح'
                : 'Invalid Payment Link'}
          </h1>
          <p className={styles.subtitle}>
            {target
              ? ar
                ? 'بوابة موثقة ومعتمدة لإتمام المعاملات المالية والعقارية.'
                : 'Verified and accredited gateway for financial and real estate transactions.'
              : ar
                ? 'لم يتم العثور على مرجع دفع صالح أو أن معلمات الرابط غير مطابقة.'
                : 'No valid payment reference was found or link parameters are malformed.'}
          </p>
        </header>

        {/* Invalid or Missing Target Case */}
        {!target && (
          <div className="space-y-4">
            <div
              role="alert"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-semibold"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <p>
                  {ar
                    ? 'الرابط لا يحتوي على معرف صحيح لفاتورة أو حجز أو اشتراك. يرجى فتح محفظتك أو طلبك الأصلي والمحاولة مجدداً.'
                    : 'The link does not specify a valid invoice, booking, or subscription. Please open your wallet or order to retry.'}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/wallet" className={styles.secondaryActionBtn}>
                <ArrowRight
                  className={`w-4 h-4 ${ar ? '' : 'transform rotate-180'} ml-1 shrink-0`}
                />
                <span>{ar ? 'العودة إلى المحفظة' : 'Return to Wallet'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Valid Target: Loading Auth State */}
        {target && isLoading && (
          <div className="space-y-4 text-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600 dark:text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {ar ? 'جارٍ التحقق من جلسة المستخدم…' : 'Verifying user session…'}
            </p>
          </div>
        )}

        {/* Valid Target: Guest Case (!isAuthenticated) */}
        {target && !isLoading && !isAuthenticated && (
          <div className="space-y-5">
            <div className={styles.targetSummaryBox}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {ar ? 'العملية المطلوبة' : 'Requested Action'}
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/25">
                  {targetLabel}
                </span>
              </div>
              {meta.id && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-white/10">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'الرقم المرجعي' : 'Reference ID'}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                    REF-{meta.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div
              role="alert"
              className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-white font-bold">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{ar ? 'تسجيل الدخول إلزامي للمتابعة' : 'Sign-in required to continue'}</span>
              </div>
              <p>
                {ar
                  ? 'يجب تسجيل الدخول لإتمام عملية السداد وحفظ الإيصال والبيانات المالية في حسابك.'
                  : 'You must sign in to complete payment and save the transaction receipt to your account.'}
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              <Link
                href={buildGuestLoginUrl(target)}
                className={styles.primaryActionBtn}
              >
                <Lock className="w-4 h-4 ml-1.5" />
                <span>{ar ? 'تسجيل الدخول للمتابعة' : 'Sign in to Continue'}</span>
              </Link>

              <Link href="/wallet" className={styles.secondaryActionBtn}>
                <ArrowRight
                  className={`w-4 h-4 ${ar ? '' : 'transform rotate-180'} ml-1 shrink-0`}
                />
                <span>{ar ? 'العودة إلى المحفظة' : 'Return to Wallet'}</span>
              </Link>
            </div>
          </div>
        )}

        {/* Valid Target: Authenticated Case */}
        {target && !isLoading && isAuthenticated && (
          <div className="space-y-5">
            <div className={styles.targetSummaryBox}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {ar ? 'العملية المطلوبة' : 'Requested Action'}
                </span>
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/25">
                  {targetLabel}
                </span>
              </div>
              {meta.id && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 dark:border-white/10">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {ar ? 'الرقم المرجعي' : 'Reference ID'}
                  </span>
                  <span className="text-xs font-mono font-black text-slate-800 dark:text-slate-200">
                    REF-{meta.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {!geideaEnabled && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs font-bold"
              >
                <p>
                  {ar
                    ? 'الدفع الإلكتروني عبر البطاقات غير متاح حالياً.'
                    : 'Card payments are currently unavailable.'}
                </p>
              </div>
            )}

            {checkout.error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-bold"
              >
                <p>{checkout.error}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={pay}
                disabled={
                  isLoading ||
                  !isAuthenticated ||
                  !geideaEnabled ||
                  checkout.processing
                }
                className={styles.primaryActionBtn}
              >
                {checkout.processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-1.5" />
                    <span>{ar ? 'جارٍ فتح نافذة الدفع…' : 'Opening checkout…'}</span>
                  </>
                ) : checkout.pending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin ml-1.5" />
                    <span>{ar ? 'التحقق من حالة الدفع…' : 'Checking payment status…'}</span>
                  </>
                ) : (
                  <span>{ar ? 'متابعة الدفع الآمن' : 'Continue to Payment'}</span>
                )}
              </button>

              <Link href="/wallet" className={styles.secondaryActionBtn}>
                <ArrowRight
                  className={`w-4 h-4 ${ar ? '' : 'transform rotate-180'} ml-1 shrink-0`}
                />
                <span>{ar ? 'العودة إلى المحفظة' : 'Return to Wallet'}</span>
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
