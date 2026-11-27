"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import api, { subscriptionsApi } from "@/lib/api";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { useLanguage } from "@/context/LanguageContext";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import DepartmentFeaturePreviewDialog, { PreviewDepartmentKey } from "@/components/subscriptions/DepartmentFeaturePreviewDialog";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import MobileAppHeader from "@/app/src/components/MobileAppHeader";

import { getPackageDiscount, getPackagePrice, type PackageDiscountPeriod } from "@/lib/package-pricing";

import styles from "./subscription-redesign.module.css";

interface ManagementPackage {
  id: string;
  name: string;
  yearlyPrice: number;
  monthlyPrice: number;
  discount: number;
  discountPeriod?: PackageDiscountPeriod;
  description?: string;
  features?: string[];
  administrations?: string[];
  departmentPrices?: Record<string, { monthly: number; yearly: number }>;
  employeeSeatMonthlyPrice?: number;
  employeeSeatYearlyPrice?: number;
  isActive: boolean;
}

const administrationLabels: Record<string, string> = {
  "admin.dept.real_estate": "sub.dept.properties",
  "admin.dept.offers": "sub.dept.offers",
  "admin.dept.orders": "sub.dept.orders",
  "admin.dept.marketing": "sub.dept.marketing",
  "admin.dept.legal": "sub.dept.legal",
  "admin.dept.finance": "sub.dept.finance",
  "admin.dept.hr": "sub.dept.employees",
};

const ALL_ADMINISTRATIONS = Object.keys(administrationLabels);
const departmentPreviewMap: Record<string, PreviewDepartmentKey> = {
  "admin.dept.real_estate": "properties",
  "admin.dept.offers": "offers",
  "admin.dept.orders": "orders",
  "admin.dept.marketing": "marketing",
  "admin.dept.legal": "legal",
  "admin.dept.finance": "finance",
  "admin.dept.hr": "employees",
};

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const isRtl = language === "ar";
  const { isOpen, message, isAdmin } = useSectionGuard("subscriptions");

  const [impersonatedByAdmin, setImpersonatedByAdmin] = useState<{ id?: string; name?: string; email?: string } | null>(null);
  const [packages, setPackages] = useState<ManagementPackage[]>([]);
  const [packagesError, setPackagesError] = useState<boolean>(false);
  const [subscriptions, setSubscriptions] = useState<Array<{
    id: string;
    subscriptionType: string;
    startDate: string;
    amount?: number;
    status: string;
    managementPackage?: { name?: string } | null;
    notes?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"شهري" | "سنوي">("شهري");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDepartment, setPreviewDepartment] = useState<PreviewDepartmentKey>("properties");
  const [previewPackage, setPreviewPackage] = useState<ManagementPackage | null>(null);

  useEffect(() => {
    const syncImpersonation = () => {
      try {
        const rawAdmin = localStorage.getItem("impersonatedByAdmin");
        setImpersonatedByAdmin(rawAdmin ? JSON.parse(rawAdmin) : null);
      } catch {
        setImpersonatedByAdmin(null);
      }
    };

    syncImpersonation();
    window.addEventListener("auth-change", syncImpersonation);
    window.addEventListener("storage", syncImpersonation);
    return () => {
      window.removeEventListener("auth-change", syncImpersonation);
      window.removeEventListener("storage", syncImpersonation);
    };
  }, []);

  const handleReturnToAdmin = () => {
    const rawSession = localStorage.getItem("adminImpersonationSession");
    if (!rawSession) return;

    try {
      const session = JSON.parse(rawSession);
      if (session.token) localStorage.setItem("token", session.token);
      else localStorage.removeItem("token");

      if (session.refreshToken) localStorage.setItem("refreshToken", session.refreshToken);
      else localStorage.removeItem("refreshToken");

      if (session.user) localStorage.setItem("user", session.user);
      else localStorage.removeItem("user");

      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      setImpersonatedByAdmin(null);
      window.dispatchEvent(new Event("auth-change"));
      router.push(session.returnTo || "/admin/users");
    } catch {
      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      setImpersonatedByAdmin(null);
      router.push("/admin/users");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setPackagesError(false);

    try {
      const [packagesRes, mySubsRes] = await Promise.allSettled([
        api.get("/management-packages"),
        subscriptionsApi.findMySubscriptions(),
      ]);

      if (packagesRes.status === "fulfilled") {
        const activePkgs = (Array.isArray(packagesRes.value?.data) ? packagesRes.value.data : []).filter(
          (pkg: ManagementPackage) => pkg.isActive
        );
        setPackages(activePkgs);
        setPackagesError(false);
      } else {
        setPackages([]);
        setPackagesError(true);
      }

      if (mySubsRes.status === "fulfilled") {
        setSubscriptions(Array.isArray(mySubsRes.value?.data) ? mySubsRes.value.data : []);
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error("Failed to load public subscriptions:", error);
      toast.error(t("sub.public.loadError") || "تعذر تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);
  const periodLabel = subscriptionType === "سنوي" ? (isRtl ? "سنوي" : "Yearly") : (isRtl ? "شهري" : "Monthly");

  const computedAmount = useMemo((): number | null => {
    if (!selectedPackage) return null;
    return getPackagePrice(selectedPackage, subscriptionType);
  }, [selectedPackage, subscriptionType]);

  const isSubmitDisabled = useMemo(() => {
    if (creating) return true;
    if (loading) return true;
    return !selectedPackageId || !selectedPackage || computedAmount === null;
  }, [creating, loading, selectedPackageId, selectedPackage, computedAmount]);

  const handleCreate = async () => {
    if (creating) return; // Mutex!

    if (!selectedPackageId || !selectedPackage) {
      toast.error(t("sub.public.selectPackageFirst") || "اختر باقة أولاً");
      return;
    }
    if (computedAmount === null) {
      toast.error(isRtl ? "تعذر تحديد سعر الباقة" : "Unable to determine package price");
      return;
    }

    setCreating(true);
    try {
      const response = await subscriptionsApi.create({
        packageId: selectedPackageId,
        subscriptionType,
        amount: computedAmount,
        startDate,
        paymentMethod: "مدى",
        notes: notes || undefined,
      });
      toast.success(t("sub.public.createdRedirect") || (isRtl ? "تم إنشاء الاشتراك بنجاح" : "Subscription created successfully"));
      if (Number(response.data?.amount || 0) <= 0 && response.data?.status === "نشط") {
        router.push("/department-hub");
      } else {
        router.push(`/wallet?subscription=${response.data?.id}`);
      }
    } catch (error: unknown) {
      console.error("Error creating department subscription:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message || t("sub.toast.error") || (isRtl ? "حدث خطأ أثناء إنشاء الاشتراك" : "Error creating subscription"));
    } finally {
      setCreating(false);
    }
  };

  const openDepartmentPreview = (department: PreviewDepartmentKey, pkg?: ManagementPackage) => {
    setPreviewDepartment(department);
    setPreviewPackage(pkg || selectedPackage || null);
    setPreviewOpen(true);
  };

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={isRtl ? "إدارة الاشتراكات" : "Subscriptions Management"} message={message} isAdmin={isAdmin} />;
  }

  return (
    <div className={styles.subscriptionPage} dir={isRtl ? "rtl" : "ltr"}>
      <MobileAppHeader theme="light" title={isRtl ? "إدارة الاشتراكات" : "Subscriptions Management"} />

      {/* Admin Impersonation Bar */}
      {impersonatedByAdmin && (
        <aside
          role="status"
          aria-label={isRtl ? "جلسة تسجيل دخول تجريبي" : "Admin impersonation session"}
          className="relative z-20 flex items-center justify-between border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <span>
            {isRtl ? "جلسة استعراض تجريبي للمستخدم: " : "Admin view session for user: "}
            <strong>{impersonatedByAdmin.name || impersonatedByAdmin.email || impersonatedByAdmin.id}</strong>
          </span>
          <button
            type="button"
            onClick={handleReturnToAdmin}
            className="rounded-lg border border-amber-400 bg-card px-3 py-1 font-black text-amber-900 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900 dark:text-amber-100"
          >
            {isRtl ? "العودة للوحة الإدارة" : "Return to Admin"}
          </button>
        </aside>
      )}

      {/* Ambient background with architectural tone */}
      <div className={styles.ambientBackground} aria-hidden="true">
        <div className={styles.ambientGlow} />
      </div>

      <main className={styles.shell}>
        {/* Desktop Top Nav with Back affordance */}
        <nav className={styles.topNav} aria-label={isRtl ? "التنقل العلوي" : "Top navigation"}>
          <button
            type="button"
            onClick={() => router.back()}
            className={styles.backButton}
            aria-label={t("common.back") || (isRtl ? "رجوع" : "Back")}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span>{t("common.back") || (isRtl ? "رجوع" : "Back")}</span>
          </button>
        </nav>

        {/* Editorial Hero */}
        <header className={styles.heroSection}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className={styles.heroEyebrow}>
                <span className={styles.heroEyebrowRule} aria-hidden="true" />
                <span>{isRtl ? "إدارة الاشتراكات" : "Subscriptions Management"}</span>
              </div>
              <h1 className={styles.heroTitle}>
                {t("sub.public.packagesTitle") || (isRtl ? "باقات الاشتراكات المؤسسية" : "Enterprise Subscription Packages")}
              </h1>
              <p className={styles.heroDescription}>
                {isRtl
                  ? "اختر إحدى الباقات الإدارية المتكاملة لأعمالك العقارية مع تفعيل فوري للإدارات المختارة."
                  : "Choose one of the integrated packages tailored to your real estate business with instant access."}
              </p>
            </div>

            {/* Architectural Artwork */}
            <div className="hidden lg:block w-52 h-32 relative shrink-0 opacity-80" aria-hidden="true">
              <Image
                src="/artworks/chat05-subscriptions-arch.svg"
                alt=""
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </header>

        {/* Workspace 2-Column Grid */}
        <div className={styles.workspaceGrid}>
          {/* Main selection panel */}
          <section className={styles.panel} aria-label={isRtl ? "الباقات المتاحة" : "Available Packages"}>
            <div className={styles.panelHeading}>
              <Building2 className={`${styles.panelHeadingIcon} h-5 w-5`} aria-hidden="true" />
              <h2 className={styles.panelTitle}>
                {t("sub.public.packagesTitle") || (isRtl ? "الباقات الإدارية" : "Management Packages")}
              </h2>
            </div>
            <p className={styles.panelHint}>
              {isRtl ? "تتضمن كل باقة مجموعة محددة من الإدارات والصلاحيات المدمجة." : "Each package bundles specific departments and pre-configured access."}
            </p>

            {loading ? (
              <div className={styles.statusBlock}>
                <div className={styles.statusLoadingLabel}>{isRtl ? "جاري تحميل الباقات..." : "Loading packages..."}</div>
                <div className={styles.statusLoadingBar} />
              </div>
            ) : packagesError ? (
              <div className={styles.statusBlock}>
                <div className={styles.statusErrorBlock}>
                  <span className={styles.statusErrorLabel}>{isRtl ? "تعذر تحميل الباقات الجاهزة" : "Failed to load packages"}</span>
                  <button type="button" onClick={fetchData} className={styles.retryButton}>
                    <RotateCcw className="h-4 w-4" />
                    <span>{isRtl ? "إعادة المحاولة" : "Retry"}</span>
                  </button>
                </div>
              </div>
            ) : packages.length === 0 ? (
              <div className={styles.statusBlock}>
                <p className={styles.statusEmptyLabel}>{t("sub.public.emptyPackages") || (isRtl ? "لا توجد باقات متاحة حالياً" : "No packages available")}</p>
              </div>
            ) : (
              <div className={styles.packageGrid}>
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  const finalPrice = getPackagePrice(pkg, subscriptionType);
                  const discount = getPackageDiscount(pkg, subscriptionType);

                  return (
                    <div
                      key={pkg.id}
                      className={`${styles.packageCard} ${isSelected ? styles.isSelected : ""}`}
                    >
                      <Building2 className="brand-watermark" aria-hidden="true" />
                      {isSelected && (
                        <div className={styles.packageSelectedBadge}>
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{isRtl ? "محدد" : "Selected"}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        className={styles.packageSelectButton}
                        onClick={() => {
                          setSelectedPackageId(pkg.id);
                        }}
                        aria-pressed={isSelected}
                        aria-label={`${pkg.name} - ${finalPrice} ريال`}
                      />

                      <h3 className={styles.packageName}>{pkg.name}</h3>
                      <p className={styles.packageDescription}>
                        {pkg.description || t("sub.public.packageFallbackDesc") || (isRtl ? "باقة إدارية متكاملة" : "Integrated management package")}
                      </p>

                      <div className={styles.packageChipRow}>
                        {(pkg.administrations || []).map((adminKey) => {
                          const previewKey = departmentPreviewMap[adminKey];
                          return previewKey ? (
                            <button
                              key={adminKey}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDepartmentPreview(previewKey, pkg);
                              }}
                              className={styles.departmentChip}
                            >
                              <Eye className="h-3 w-3" />
                              <span>{t(administrationLabels[adminKey] || adminKey)}</span>
                            </button>
                          ) : (
                            <span key={adminKey} className={`${styles.departmentChip} ${styles.departmentChipStatic}`}>
                              {t(administrationLabels[adminKey] || adminKey)}
                            </span>
                          );
                        })}
                      </div>

                      <div className={styles.packagePriceRow}>
                        <div className={styles.packagePrice}>
                          <SaudiRiyalAmount amount={finalPrice} locale="ar-SA" />
                        </div>
                        <span className={styles.packagePricePeriod}>
                          / {subscriptionType === "سنوي" ? (isRtl ? "سنوياً" : "year") : (isRtl ? "شهرياً" : "month")}
                        </span>
                        {discount > 0 && (
                          <span className={styles.packageDiscountBadge}>
                            {t("sub.public.discount") || (isRtl ? "خصم" : "Discount")} {discount}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Details & Quote Summary Panel */}
          <aside className={styles.panel} aria-label={t("sub.public.detailsTitle") || (isRtl ? "تفاصيل الاشتراك والقيمة" : "Subscription Details & Quote")}>
            <div className={styles.panelHeading}>
              <CreditCard className={`${styles.panelHeadingIcon} h-5 w-5`} aria-hidden="true" />
              <h2 className={styles.panelTitle}>{t("sub.public.detailsTitle") || (isRtl ? "تفاصيل الاشتراك" : "Subscription Details")}</h2>
            </div>

            {/* Duration switch */}
            <div className={styles.detailsField}>
              <label className={styles.fieldLabel}>{t("sub.public.duration") || (isRtl ? "مدة الفاتورة" : "Billing Period")}</label>
              <div className={styles.durationGroup} role="group" aria-label={isRtl ? "مدة الفاتورة" : "Billing period"}>
                {(["شهري", "سنوي"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubscriptionType(type)}
                    className={styles.durationButton}
                    aria-pressed={subscriptionType === type}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Date */}
            <div className={styles.detailsField}>
              <label htmlFor="sub-start-date" className={styles.fieldLabel}>
                {t("sub.field.startDate") || (isRtl ? "تاريخ بداية الاشتراك" : "Start Date")}
              </label>
              <input
                id="sub-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={styles.fieldInput}
              />
            </div>

            {/* Notes */}
            <div className={styles.detailsField}>
              <label htmlFor="sub-notes" className={styles.fieldLabel}>
                {t("sub.field.notes") || (isRtl ? "ملاحظات إضافية" : "Additional Notes")}
              </label>
              <textarea
                id="sub-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.fieldTextarea}
                placeholder={t("sub.public.notesPlaceholder") || (isRtl ? "أية تعليمات أو متطلبات خاصة..." : "Special instructions or notes...")}
              />
            </div>

            {/* Quote summary section */}
            <div className={styles.quoteSection}>
              <div className={styles.quoteSelectionLine}>
                <span className={styles.quoteSelectionTitle}>
                  {selectedPackage?.name || t("sub.public.selectFromList") || (isRtl ? "اختر باقة" : "Select a package")}
                </span>
                <span className={styles.quotePeriodTag}>{periodLabel}</span>
              </div>

              {/* Selection chips */}
              <div className={styles.quoteSelectionChips}>
                {(selectedPackage?.administrations || []).map((adminKey) => (
                  <span key={adminKey} className={styles.quoteSelectionChip}>
                    {t(administrationLabels[adminKey] || adminKey)}
                  </span>
                ))}
              </div>

              {/* Total Row */}
              <div className={styles.quoteTotalRow}>
                <span className={styles.quoteTotalLabel}>{t("sub.public.total") || (isRtl ? "الإجمالي المتوقع" : "Estimated Total")}</span>
                {computedAmount === null ? (
                  <span className={styles.quoteTotalValueUnknown}>{isRtl ? "غير متاح" : "Unavailable"}</span>
                ) : (
                  <span className={styles.quoteTotalValue}>
                    <SaudiRiyalAmount amount={computedAmount} locale="ar-SA" />
                  </span>
                )}
              </div>

              <p className={styles.quoteFootnote}>
                {t("sub.public.afterPayment") || (isRtl ? "يتم تفعيل الصلاحيات فور تأكيد الدفع عبر بوابة الدفع الإلكتروني أو المحفظة." : "Access is activated upon payment confirmation through the portal or wallet.")}
              </p>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isSubmitDisabled}
                className={styles.submitButton}
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                <span>{t("sub.public.submit") || (isRtl ? "متابعة للدفع والتأكيد" : "Proceed to Payment")}</span>
              </button>

              {/* Explicit feedback why disabled */}
              {isSubmitDisabled && !creating && !loading && (
                <div className={styles.submitHint} role="status">
                  {!selectedPackageId && (isRtl ? "• يرجى اختيار إحدى الباقات للمتابعة" : "• Please select a package to continue")}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Previous Subscriptions Section */}
        <section className={`${styles.panel} ${styles.previousSection}`} aria-label={t("sub.public.previousSubscriptions") || (isRtl ? "الاشتراكات السابقة" : "Previous Subscriptions")}>
          <div className={styles.panelHeading}>
            <CreditCard className={`${styles.panelHeadingIcon} h-5 w-5`} aria-hidden="true" />
            <h2 className={styles.panelTitle}>{t("sub.public.previousSubscriptions") || (isRtl ? "الاشتراكات السابقة" : "Previous Subscriptions")}</h2>
          </div>

          {subscriptions.length === 0 ? (
            <div className={styles.statusBlock}>
              <p className={styles.statusEmptyLabel}>{t("sub.public.noPreviousSubscriptions") || (isRtl ? "لا توجد اشتراكات سابقة مسجلة" : "No previous subscriptions recorded")}</p>
            </div>
          ) : (
            <div className={styles.previousList}>
              {subscriptions.map((sub) => (
                <div key={sub.id} className={styles.previousRow}>
                  <div>
                    <div className={styles.previousName}>
                      {sub.managementPackage?.name || sub.notes || (isRtl ? "اشتراك إدارة" : "Department subscription")}
                    </div>
                    <div className={styles.previousMeta}>
                      <span>{sub.subscriptionType}</span>
                      <span>•</span>
                      <span>{new Date(sub.startDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US")}</span>
                      <span>•</span>
                      <SaudiRiyalAmount amount={Number(sub.amount || 0)} locale="ar-SA" iconClassName="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={styles.previousStatus}>{sub.status}</span>
                    <button
                      type="button"
                      onClick={() => router.push(`/wallet?subscription=${sub.id}`)}
                      className={styles.previousWalletButton}
                    >
                      {t("sub.public.viewInWallet") || (isRtl ? "عرض في المحفظة" : "View in Wallet")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <DepartmentFeaturePreviewDialog
        key={`${previewOpen ? "open" : "closed"}-${previewPackage?.id || "all"}-${previewDepartment}`}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        initialDepartment={previewDepartment}
        packageName={previewPackage?.name}
        packageFeatures={previewPackage?.features}
        packageAdministrations={previewPackage?.administrations}
      />
    </div>
  );
}
