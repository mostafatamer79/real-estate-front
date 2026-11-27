"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  PackageCheck,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { loginHref } from "@/lib/auth-navigation";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import MobileAppHeader from "@/app/src/components/MobileAppHeader";

import styles from "@/components/redesign/chat05/renew-subscription.module.css";

type SubscriptionStatus = {
  active: boolean;
  daysLeft?: number;
  noExpiry?: boolean;
  subscription?: {
    id?: string;
    endDate?: string;
    startDate?: string;
    managementPackage?: { name?: string } | null;
    amount?: number;
    subscriptionType?: string;
    status?: string;
    notes?: string;
  } | null;
};

export default function RenewSubscriptionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const locale = isRtl ? "ar-SA" : "en-US";

  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const loadStatus = useCallback(async () => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!stored) {
      router.push(loginHref("/internal/renew-subscription"));
      return;
    }

    setLoading(true);
    setFetchError(false);
    try {
      const res = await api.get("/subscriptions/status");
      setStatus(res.data || null);
      setFetchError(false);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { status?: number } };
      if (errorResponse?.response?.status === 401) {
        router.push(loginHref("/internal/renew-subscription"));
        return;
      }
      setFetchError(true);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const currentSub = status?.subscription;
  const isPendingPayment =
    !status?.active &&
    Boolean(
      currentSub?.id &&
        (currentSub.status === "معلق" ||
          currentSub.status === "في انتظار الدفع" ||
          currentSub.status === "pending")
    );

  const statusCopy = useMemo(() => {
    if (fetchError) {
      return {
        title: isRtl ? "تعذر تحميل حالة الاشتراك" : "Failed to load subscription status",
        desc: isRtl
          ? "حدث خطأ أثناء جلب بيانات الاشتراك الحالية من الخادم. يرجى إعادة المحاولة."
          : "An error occurred while fetching your current subscription details. Please retry.",
        tone: "error",
      };
    }
    if (!status) {
      return {
        title: isRtl ? "حالة الاشتراك غير متاحة" : "Subscription status unavailable",
        desc: isRtl
          ? "يمكنك اختيار إحدى الباقات الجاهزة المناسبة لمنشأتك."
          : "Choose a ready-made package for your organization.",
        tone: "neutral",
      };
    }
    if (status.active) {
      return {
        title: isRtl ? "اشتراكك نشط حالياً" : "Your subscription is currently active",
        desc: status.noExpiry
          ? isRtl
            ? "هذا الاشتراك غير محدود ولا يتطلب تجديداً دورياً."
            : "This subscription is unlimited and requires no scheduled renewal."
          : isRtl
          ? `متبقي ${status.daysLeft ?? 0} يوم على انتهاء الاشتراك الحالي.`
          : `${status.daysLeft ?? 0} days remaining on your active subscription period.`,
        tone: "active",
      };
    }
    if (isPendingPayment) {
      return {
        title: isRtl ? "طلب اشتراك بانتظار السداد" : "Subscription awaiting payment",
        desc: isRtl
          ? "لديك اشتراك تم إنشاؤه مسبقاً وبانتظار تأكيد السداد عبر المحفظة أو الدفع الإلكتروني."
          : "You have a pending subscription order waiting for payment completion.",
        tone: "pending",
      };
    }
    return {
      title: isRtl ? "الاشتراك غير نشط" : "Subscription inactive",
      desc: isRtl
        ? "فعّل أو جدد اشتراكك لاستعادة الوصول المباشر إلى الإدارات والصلاحيات الداخلية."
        : "Activate or renew your subscription to regain access to internal enterprise departments.",
      tone: "expired",
    };
  }, [fetchError, isPendingPayment, isRtl, status]);

  const lastEndDate = currentSub?.endDate
    ? new Date(currentSub.endDate).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const lastStartDate = currentSub?.startDate
    ? new Date(currentSub.startDate).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const actionCards = [
    {
      id: "packages",
      title: isRtl ? "اختيار باقة جاهزة" : "Choose Ready Package",
      desc: isRtl
        ? "باقات إدارية متكاملة تتضمن مجموعة جاهزة من الإدارات بأسعار شهرية وسنوية مخفضة."
        : "Pre-configured department bundles with discounted monthly and yearly rates.",
      icon: PackageCheck,
      action: () => router.push("/subscriptions/new"),
      cta: isRtl ? "عرض الباقات" : "View packages",
    },
    {
      id: "wallet",
      title: isRtl ? "المحفظة والفواتير" : "Wallet & Invoices",
      desc: isRtl
        ? "راجع سجل الفواتير والمبالغ المستحقة وادفع الاشتراكات المعلقة عبر المحفظة."
        : "Review billing ledger, invoices, and settle pending subscriptions from wallet.",
      icon: Wallet,
      action: () => router.push("/wallet"),
      cta: isRtl ? "فتح المحفظة" : "Open wallet",
    },
  ];

  if (loading) {
    return (
      <div className={styles.renewPage} dir={isRtl ? "rtl" : "ltr"}>
        <MobileAppHeader theme="light" title={isRtl ? "تجديد الاشتراك" : "Renew Subscription"} />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingPanel} role="status">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{isRtl ? "جاري تحميل بيانات الاشتراك..." : "Loading subscription details..."}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.renewPage} dir={isRtl ? "rtl" : "ltr"}>
      <MobileAppHeader theme="light" title={isRtl ? "تجديد الاشتراك" : "Renew Subscription"} />

      <div className={styles.ambientBackground} aria-hidden="true">
        <div className={styles.ambientGlow} />
      </div>

      <main className={styles.shell}>
        {/* Top bar with back affordance and category tag */}
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={() => router.push("/internal")}
            className={styles.backButton}
            aria-label={isRtl ? "العودة للإدارات الداخلية" : "Back to internal departments"}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>{isRtl ? "العودة للإدارات" : "Back to internal"}</span>
          </button>
          <div className={styles.categoryBadge} aria-label={isRtl ? "حالة الاشتراك" : "Subscription status"}>
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isRtl ? "إدارة الاشتراك" : "Subscription Management"}</span>
          </div>
        </div>

        {/* Error / Retry Banner */}
        {fetchError && (
          <section className={styles.errorBanner} role="alert">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
              <h2 className={styles.errorTitle}>{statusCopy.title}</h2>
            </div>
            <p className={styles.errorDesc}>{statusCopy.desc}</p>
            <button
              type="button"
              onClick={loadStatus}
              className={styles.retryButton}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
            </button>
          </section>
        )}

        {/* Hero Section with Status & Real Data */}
        <section className={styles.heroSection} aria-label={isRtl ? "تفاصيل حالة الاشتراك الحالي" : "Subscription status overview"}>
          <div className="flex items-center justify-between gap-4">
            <div className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowRule} aria-hidden="true" />
            <span>{isRtl ? "الاشتراكات والتراخيص" : "Subscriptions & Licensing"}</span>
            </div>
            <div className="hidden sm:block w-36 h-20 relative shrink-0 opacity-80" aria-hidden="true">
              <Image
                src="/artworks/chat05-subscriptions-arch.svg"
                alt=""
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>{statusCopy.title}</h1>
              <p className={styles.heroDescription}>{statusCopy.desc}</p>

              {/* Action Buttons */}
              <div className={styles.heroActions}>
                {isPendingPayment && currentSub?.id ? (
                  <button
                    type="button"
                    onClick={() => router.push(`/wallet?subscription=${currentSub.id}`)}
                    className={styles.primaryAction}
                  >
                    <CreditCard className="h-4 w-4" aria-hidden="true" />
                    <span>{isRtl ? "سداد الاشتراك الآن" : "Pay Subscription Now"}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/subscriptions/new")}
                    className={styles.primaryAction}
                  >
                    <PackageCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{status?.active ? (isRtl ? "ترقية أو تغيير الاشتراك" : "Upgrade / Change") : (isRtl ? "اختيار اشتراك جديد" : "Select Subscription")}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => router.push("/wallet")}
                  className={styles.secondaryAction}
                >
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  <span>{isRtl ? "المحفظة والفواتير" : "Wallet & Invoices"}</span>
                </button>
              </div>
            </div>

            {/* Real Data Status Card */}
            <div className={styles.statusCard}>
              <div className={styles.statusCardHeader}>
                <div>
                  <span className={styles.statusCardTitle}>{isRtl ? "الحالة الحالية" : "Current Status"}</span>
                  <div className={styles.statusCardState}>
                    {status?.active
                      ? isRtl
                        ? "نشط ومفعل"
                        : "Active"
                      : isPendingPayment
                      ? isRtl
                        ? "في انتظار الدفع"
                        : "Pending Payment"
                      : isRtl
                      ? "غير نشط"
                      : "Inactive"}
                  </div>
                </div>

                <div
                  className={`${styles.statusIcon} ${
                    status?.active
                      ? styles.statusIconActive
                      : isPendingPayment
                      ? styles.statusIconPending
                      : styles.statusIconInactive
                  }`}
                  aria-hidden="true"
                >
                  {status?.active ? (
                    <CheckCircle2 className="h-7 w-7" />
                  ) : isPendingPayment ? (
                    <Clock className="h-7 w-7" />
                  ) : (
                    <ShieldCheck className="h-7 w-7" />
                  )}
                </div>
              </div>

              {/* Status Details List with Real authoritative values */}
              <div className={styles.statusDetailsList}>
                <div className={styles.statusDetailRow}>
                  <span className={styles.statusDetailLabel}>{isRtl ? "الباقة / النمط" : "Package / Plan"}</span>
                  <span className={styles.statusDetailValue}>
                    {currentSub?.managementPackage?.name ||
                      currentSub?.notes ||
                      (status?.active ? (isRtl ? "اشتراك نشط" : "Active Subscription") : isRtl ? "غير محدد" : "Not set")}
                  </span>
                </div>

                <div className={styles.statusDetailRow}>
                  <span className={styles.statusDetailLabel}>{isRtl ? "نوع الفاتورة" : "Billing Period"}</span>
                  <span className={styles.statusDetailValue}>{currentSub?.subscriptionType || "-"}</span>
                </div>

                <div className={styles.statusDetailRow}>
                  <span className={styles.statusDetailLabel}>{isRtl ? "قيمة الاشتراك" : "Amount"}</span>
                  <span className={styles.statusDetailValue}>
                    {currentSub?.amount !== undefined && currentSub?.amount !== null ? (
                      <SaudiRiyalAmount amount={Number(currentSub.amount)} locale={locale} />
                    ) : (
                      "-"
                    )}
                  </span>
                </div>

                {lastStartDate && (
                  <div className={styles.statusDetailRow}>
                    <span className={styles.statusDetailLabel}>{isRtl ? "تاريخ البداية" : "Start Date"}</span>
                    <span className={styles.statusDetailValue}>{lastStartDate}</span>
                  </div>
                )}

                <div className={styles.statusDetailRow}>
                  <span className={styles.statusDetailLabel}>{isRtl ? "تاريخ الانتهاء" : "Expiry Date"}</span>
                  <span className={styles.statusDetailValue}>
                    {status?.noExpiry
                      ? isRtl
                        ? "غير محدود"
                        : "No expiry"
                      : lastEndDate || (isRtl ? "غير محدد" : "Not set")}
                  </span>
                </div>

                {status?.active && !status?.noExpiry && status?.daysLeft !== undefined && (
                  <div className={styles.statusDetailRow}>
                    <span className={styles.statusDetailLabel}>{isRtl ? "الأيام المتبقية" : "Days Remaining"}</span>
                    <span className={styles.statusDetailValue}>
                      {status.daysLeft} {isRtl ? "يوم" : "days"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Action Navigation Cards */}
        <section className={styles.cardsGrid} aria-label={isRtl ? "خيارات تجديد وتعديل الاشتراك" : "Renewal and subscription options"}>
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.action}
                className={styles.actionCard}
              >
                <div className={styles.actionCardHeader}>
                  <div className={styles.actionCardIcon} aria-hidden="true">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={styles.actionCardCta}>{card.cta}</span>
                </div>
                <h2 className={styles.actionCardTitle}>{card.title}</h2>
                <p className={styles.actionCardDesc}>{card.desc}</p>
              </button>
            );
          })}
        </section>

        {/* Department Preview Quick Banner */}
        <section className={styles.previewBanner}>
          <div className={styles.previewBannerInfo}>
            <div className={styles.previewBannerIcon} aria-hidden="true">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className={styles.previewBannerTitle}>
                {isRtl ? "ترغب في معاينة تفاصيل الإدارات والخصائص قبل التجديد؟" : "Want to preview departments before renewing?"}
              </h3>
              <p className={styles.previewBannerSub}>
                {isRtl
                  ? "يمكنك استعراض كافة الإدارات (العقارات، العروض، الطلبات، التسويق، الشؤون القانونية، المالية، والموظفين) وخصائصها مباشرة."
                  : "Explore all departments and features in detail from the subscription selection page."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/subscriptions/new")}
            className={styles.secondaryAction}
          >
            {isRtl ? "فتح صفحة الاشتراكات" : "Open Subscriptions Page"}
          </button>
        </section>
      </main>
    </div>
  );
}
