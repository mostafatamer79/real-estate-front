"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { loginHref } from "@/lib/auth-navigation";
import {
  providerApi,
  providerError,
  type ProviderOpportunity,
} from "@/lib/providers";
import { useLanguage } from "@/context/LanguageContext";
import ProviderRequestPanel from "@/components/providers/ProviderRequestPanel";
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Compass,
  FileText,
  ShieldCheck,
} from "lucide-react";
import styles from "./provider-requests.module.css";

const PAGE_SIZE = 30;

const categoryLabelsAr: Record<string, string> = {
  postPurchase: "خدمات ما بعد الشراء",
  legal: "الخدمات القانونية",
  construction: "خدمات البناء والمقاولات",
  marketing: "خدمات التسويق العقاري",
  other: "خدمات أخرى",
};

const categoryLabelsEn: Record<string, string> = {
  postPurchase: "Post-Purchase Services",
  legal: "Legal Services",
  construction: "Construction & Contracting",
  marketing: "Marketing Services",
  other: "Other Services",
};

function getCategoryLabel(category?: string, ar = true): string {
  if (!category) return "";
  return ar
    ? categoryLabelsAr[category] || category
    : categoryLabelsEn[category] || category;
}

function validateOpportunityList(data: unknown): {
  items: ProviderOpportunity[];
  total: number;
} {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response payload");
  }
  const d = data as { items?: unknown; total?: unknown };
  if (!Array.isArray(d.items)) {
    throw new Error("Expected items list in response");
  }
  if (typeof d.total !== "number" || !Number.isSafeInteger(d.total) || d.total < 0 || d.total < d.items.length || d.items.length > PAGE_SIZE) {
    throw new Error("Invalid total count in response");
  }
  const validItems: ProviderOpportunity[] = [];
  const ids = new Set<string>();
  for (const raw of d.items) {
    const item = raw as ProviderOpportunity | null;
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id) ||
      typeof item.serviceType !== 'string' || typeof item.city !== 'string' || typeof item.category !== 'string' ||
      typeof item.quantity !== 'number' || !Number.isFinite(item.quantity) || item.quantity < 0) throw new Error('Invalid request item');
    const selection = item.metadata?.providerSelection;
    if (selection && (typeof selection !== 'object' || typeof selection.providerId !== 'string' || !selection.providerId)) throw new Error('Invalid provider selection');
    ids.add(item.id);
    // Render only fields actually returned by the existing my-requests API.
    validItems.push({id:item.id, serviceType:item.serviceType, city:item.city, category:item.category, quantity:item.quantity,
      metadata: {providerSelection:selection || undefined}});
  }
  return { items: validItems, total: d.total };
}

export default function ProviderRequestsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const hasUser = Boolean(user?.id);
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const ar = language === "ar";

  const [items, setItems] = useState<ProviderOpportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const mountedRef = useRef(true);
  const reqSequenceRef = useRef(0);

  // Sync document title cleanly without inventing metadata
  useEffect(() => {
    document.title = ar
      ? "متابعة طلبات الخدمات | المنصة العقارية"
      : "Track Service Requests | Real Estate Platform";
  }, [ar]);

  // Unmount safety guard
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      reqSequenceRef.current += 1;
    };
  }, []);

  const loadRequests = useCallback(
    async (targetPage: number, isRefresh = false) => {
      if (!isAuthenticated || !hasUser) return;
      const currentReqId = ++reqSequenceRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const response = await providerApi.myRequests(targetPage);
        if (!mountedRef.current || currentReqId !== reqSequenceRef.current) return;

        const validated = validateOpportunityList(response.data);
        const lastPage = Math.max(1, Math.ceil(validated.total / PAGE_SIZE));
        if (targetPage > lastPage) { setPage(lastPage); return; }
        if (validated.total > 0 && validated.items.length === 0) throw new Error("Inconsistent request page");
        setItems(validated.items);
        setTotal(validated.total);
      } catch (err) {
        if (!mountedRef.current || currentReqId !== reqSequenceRef.current) return;
        setError(
          providerError(
            err,
            ar
              ? "تعذر تحميل طلبات الخدمات. يرجى المحاولة مرة أخرى."
              : "Could not load service requests. Please try again.",
          ),
        );
      } finally {
        if (mountedRef.current && currentReqId === reqSequenceRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [ar, isAuthenticated, hasUser],
  );

  // Auth check & redirect guard: don't spin indefinitely for unauthenticated users
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !hasUser) {
      router.replace(loginHref("/services/provider-requests"));
      return;
    }
    void loadRequests(page);
  }, [page, authLoading, isAuthenticated, hasUser, router, loadRequests]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isBusy = loading || refreshing;

  // Initial Auth Loading State
  if (authLoading) {
    return (
      <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
        <div className={styles.ambientGrid} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.skeletonStream} role="status">
            <div className={styles.skeletonArticle}>
              <div
                className={`${styles.skeletonLine} ${styles.skeletonLineTitle}`}
              />
              <div
                className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
              />
              <div className={styles.skeletonBlock} />
            </div>
            <span className="sr-only">
              {ar ? "جاري التحقق من الصلاحيات…" : "Checking authentication…"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Absent user redirecting state (no infinite spinner)
  if (!isAuthenticated || !hasUser) {
    return (
      <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
        <div className={styles.ambientGrid} aria-hidden="true" />
        <div className={styles.container}>
          <div className={styles.emptyState} role="status">
            <p className={styles.emptyText}>
              {ar
                ? "جاري تحويلك إلى صفحة تسجيل الدخول…"
                : "Redirecting to login…"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} dir={ar ? "rtl" : "ltr"}>
      <div className={styles.ambientGrid} aria-hidden="true" />

      <div className={styles.container}>
        {/* In-page Static Navigation */}
        <nav
          className={styles.staticNav}
          aria-label={ar ? "التنقل داخل الصفحة" : "In-page navigation"}
        >
          <div className={styles.navBreadcrumb}>
            <Link href="/details" className={styles.breadcrumbSegment}>
              {ar ? "لوحة التفاصيل" : "Details Hub"}
            </Link>
            <span className={styles.breadcrumbSep} aria-hidden="true">
              /
            </span>
            <Link href="/services" className={styles.breadcrumbSegment}>
              {ar ? "دليل الخدمات" : "Services"}
            </Link>
            <span className={styles.breadcrumbSep} aria-hidden="true">
              /
            </span>
            <span
              className={styles.breadcrumbCurrent}
              aria-current="page"
            >
              {ar ? "متابعة طلبات الخدمات" : "Track Requests"}
            </span>
          </div>

          <div className={styles.navActions}>
            <button
              type="button"
              onClick={toggleLanguage}
              className={styles.navButton}
              aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}
            >
              {ar ? "English" : "العربية"}
            </button>
            <Link href="/services" className={styles.navButton}>
              {ar ? "دليل الخدمات" : "Services"}
            </Link>
            <Link
              href="/services"
              className={`${styles.navButton} ${styles.navButtonPrimary}`}
            >
              {ar ? "طلب خدمة جديدة" : "New Request"}
            </Link>
          </div>
        </nav>

        {/* Editorial Hero Section */}
        <header className={styles.heroSection}>
          <div className={styles.heroContent}>
            <span className={styles.heroKicker}>
              <span className={styles.heroKickerDot} aria-hidden="true" />
              {ar ? "سجل العمليات والطلبات" : "Operations & Requests Registry"}
            </span>
            <h1 className={styles.heroTitle}>
              {ar ? "متابعة طلبات الخدمات" : "Track Service Requests"}
            </h1>
            <p className={styles.heroSubtitle}>
              {ar
                ? "تابع عروض الخدمات المرتبطة بطلباتك، وراجع العرض الذي عيّنته الإدارة وحالة الفاتورة والتواصل."
                : "Track quotes for your requests, the provider assigned by administration, invoices and available contact details."}
            </p>
          </div>

          <div
            className={styles.heroStatsStrip}
            aria-label={ar ? "إحصائيات السجل" : "Registry statistics"}
          >
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                {ar ? "إجمالي الطلبات" : "Total Requests"}
              </span>
              <span className={`${styles.statValue} ${styles.statValueGold}`}>
                {total.toLocaleString(ar ? "ar-SA" : "en-US")}
              </span>
            </div>
            <div className={styles.statDivider} aria-hidden="true" />
            <div className={styles.statItem}>
              <span className={styles.statLabel}>
                {ar ? "الصفحة الحالية" : "Current Page"}
              </span>
              <span className={styles.statValue}>
                {page} <span className="text-xs font-normal text-muted-foreground">/ {totalPages}</span>
              </span>
            </div>

          </div>
        </header>

        {/* Asymmetric Desktop Layout */}
        <div className={styles.layoutGrid}>
          {/* Dominant Stream: Operational Requests */}
          <section
            className={styles.requestStream}
            aria-label={ar ? "قائمة طلبات الخدمات" : "Service requests list"}
          >
            {error ? (
              <div className={styles.errorState} role="alert">
                <div className={styles.errorHeader}>
                  <AlertCircle className="h-5 w-5" aria-hidden="true" />
                  <span>{ar ? "حدث خطأ أثناء تحميل الطلبات" : "Error loading requests"}</span>
                </div>
                <p className={styles.errorText}>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadRequests(page)}
                  className={styles.retryButton}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  <span>{ar ? "إعادة المحاولة" : "Retry"}</span>
                </button>
              </div>
            ) : loading ? (
              <div className={styles.skeletonStream} role="status">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className={styles.skeletonArticle}>
                    <div
                      className={`${styles.skeletonLine} ${styles.skeletonLineTitle}`}
                    />
                    <div
                      className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}
                    />
                    <div className={styles.skeletonBlock} />
                  </div>
                ))}
                <span className="sr-only">
                  {ar ? "جاري تحميل الطلبات…" : "Loading requests…"}
                </span>
              </div>
            ) : items.length === 0 ? (
              <div
                className={styles.emptyState}
                aria-label={ar ? "لا توجد طلبات" : "No requests"}
              >
                <div className={styles.emptyIconBadge}>
                  <FileText className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className={styles.emptyTitle}>
                  {ar
                    ? "لا توجد طلبات خدمات مسجلة حتى الآن"
                    : "No service requests recorded yet"}
                </h2>
                <p className={styles.emptyText}>
                  {ar
                    ? "لم تقم بتقديم أي طلب خدمة بعد. يمكنك استعراض دليل الخدمات المتاح واختيار الخدمة المناسبة للبدء في استلام عروض المزودين."
                    : "You have not submitted any service requests yet. Browse our service catalog to submit a request and start receiving provider quotes."}
                </p>
                <div className={styles.emptyActions}>
                  <Link
                    href="/services"
                    className={`${styles.navButton} ${styles.navButtonPrimary}`}
                  >
                    {ar ? "استعراض دليل الخدمات" : "Browse Services Catalog"}
                  </Link>

                </div>
              </div>
            ) : (
              <>
                {items.map((item, idx) => {
                  const categoryLabel = getCategoryLabel(
                    item.serviceCategory || item.category,
                    ar,
                  );
                  const itemIndex = (page - 1) * PAGE_SIZE + idx + 1;

                  return (
                    <article
                      key={item.id}
                      className={styles.requestArticle}
                      aria-labelledby={`req-title-${item.id}`}
                    >
                      <header className={styles.articleTopBar}>
                        <div className={styles.articleLeadingMeta}>
                          <span className={styles.indexPill}>
                            #{String(itemIndex).padStart(2, "0")}
                          </span>
                          <span
                            className={styles.requestIdBadge}
                            title={item.id}
                          >
                            {ar ? "طلب #" : "Req #"}
                            {item.id}
                          </span>
                          {categoryLabel && (
                            <span className={styles.categoryBadge}>
                              <Layers
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              {categoryLabel}
                            </span>
                          )}
                        </div>

                        {item.metadata?.providerSelection ? (
                          <span className={styles.assignedStatusBadge}>
                            <CheckCircle2
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {ar
                              ? "تم اعتماد عرض مزود"
                              : "Provider offer assigned"}
                          </span>
                        ) : (
                          <span className={styles.pendingOffersBadge}>
                            <Clock
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {ar
                              ? "لم يُعيّن مزود بعد"
                              : "No provider assigned"}
                          </span>
                        )}
                      </header>

                      <div className={styles.articleTitleBlock}>
                        <h2
                          id={`req-title-${item.id}`}
                          className={styles.articleHeading}
                        >
                          {item.serviceType}
                        </h2>

                        <div className={styles.articleSpecsRow}>
                          <span className={styles.specChip}>
                            <MapPin
                              className={`h-4 w-4 ${styles.specChipIcon}`}
                              aria-hidden="true"
                            />
                            <span>
                              {item.city}
                              {item.district ? ` · ${item.district}` : ""}
                            </span>
                          </span>

                          {typeof item.quantity === "number" &&
                            item.quantity > 0 && (
                              <span className={styles.specChip}>
                                <span
                                  className={styles.specChipIcon}
                                  aria-hidden="true"
                                >
                                  #
                                </span>
                                <span>
                                  {ar ? "الكمية:" : "Quantity:"} {item.quantity}
                                </span>
                              </span>
                            )}


                        </div>
                      </div>

                      <div className={styles.panelWrapper}>
                        <ProviderRequestPanel requestId={item.id} />
                      </div>
                    </article>
                  );
                })}

                {/* Pagination Controls */}
                <nav
                  className={styles.paginationNav}
                  aria-label={ar ? "صفحات الطلبات" : "Requests pagination"}
                >
                  <div className={styles.paginationInfo}>
                    <span>{ar ? "الصفحة" : "Page"}</span>
                    <span className={styles.paginationCurrent}>{page}</span>
                    <span>{ar ? "من" : "of"}</span>
                    <span className={styles.paginationCurrent}>
                      {totalPages}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({total.toLocaleString(ar ? "ar-SA" : "en-US")}{" "}
                      {ar ? "طلب مسجل" : "total requests"})
                    </span>
                  </div>

                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      disabled={page <= 1 || isBusy}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={styles.paginationButton}
                      aria-label={ar ? "الصفحة السابقة" : "Previous page"}
                    >
                      {ar ? "السابق" : "Previous"}
                    </button>

                    <button
                      type="button"
                      disabled={page >= totalPages || isBusy}
                      onClick={() => setPage((p) => p + 1)}
                      className={styles.paginationButton}
                      aria-label={ar ? "الصفحة التالية" : "Next page"}
                    >
                      {ar ? "التالي" : "Next"}
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void loadRequests(page, true)}
                      className={styles.paginationButton}
                      aria-label={ar ? "تحديث السجل" : "Refresh list"}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${refreshing ? styles.spin : ""}`}
                        aria-hidden="true"
                      />
                      <span>
                        {refreshing
                          ? ar
                            ? "جاري التحديث…"
                            : "Refreshing…"
                          : ar
                            ? "تحديث"
                            : "Refresh"}
                      </span>
                    </button>
                  </div>
                </nav>
              </>
            )}
          </section>

          {/* Context Rail (Asymmetric Operational Context) */}
          <aside
            className={styles.contextRail}
            aria-label={
              ar ? "معلومات وإجراءات مساندة" : "Operational context & actions"
            }
          >
            {/* Quick Actions Card */}
            <div className={styles.railCard}>
              <h2 className={styles.railCardTitle}>
                <Compass className={`h-4 w-4 ${styles.railCardIcon}`} aria-hidden="true" />
                <span>{ar ? "إجراءات وروابط سريعة" : "Quick Actions"}</span>
              </h2>

              <div className={styles.railActionsList}>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void loadRequests(page, true)}
                  className={styles.railActionButton}
                >
                  <span>{ar ? "تحديث السجل الآن" : "Refresh Registry"}</span>
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? styles.spin : ""}`}
                    aria-hidden="true"
                  />
                </button>

                <Link href="/services" className={styles.railActionButton}>
                  <span>{ar ? "دليل الخدمات الكامل" : "Services Catalog"}</span>
                  <span aria-hidden="true">→</span>
                </Link>



                <Link href="/details" className={styles.railActionButton}>
                  <span>{ar ? "لوحة مؤشرات التفاصيل" : "Market Details Hub"}</span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link href="/wallet?tab=invoices" className={styles.railActionButton}>
                  <span>{ar ? "سجل الفواتير والدفع" : "Invoices & Payment"}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Protocol Guide Card */}
            <details className={`${styles.railCard} ${styles.guide}`}>
              <summary className={styles.railCardTitle}>
                <ShieldCheck
                  className={`h-4 w-4 ${styles.railCardIcon}`}
                  aria-hidden="true"
                />
                <span>
                  {ar ? "خطوات متابعة وتنفيذ الطلب" : "Request Protocol Guide"}
                </span>
              </summary>

              <ol className={styles.railStepsList}>
                <li className={styles.railStepItem}>
                  <span className={styles.railStepNum}>1</span>
                  <span>
                    {ar
                      ? "استقبال العروض: يراجع مزودو الخدمة تفاصيل طلبك ويقدمون عروضهم التنافسية."
                      : "Provider quotes: View the offers received for your request."}
                  </span>
                </li>
                <li className={styles.railStepItem}>
                  <span className={styles.railStepNum}>2</span>
                  <span>
                    {ar
                      ? "المفاضلة والاعتماد: تراجع الإدارة العروض وتعيّن المزود، ثم تظهر الفاتورة المتاحة للدفع في محفظتك."
                      : "Assignment: Administration reviews quotes and assigns a provider. Available invoices appear in your wallet."}
                  </span>
                </li>
                <li className={styles.railStepItem}>
                  <span className={styles.railStepNum}>3</span>
                  <span>
                    {ar
                      ? "سداد الفاتورة والتنفيذ: تابع سداد الفاتورة وتفاصيل التواصل التي يتيحها النظام بعد تحقق شروط الطلب."
                      : "Payment and contact: Follow invoice payment and the contact details made available for your request."}
                  </span>
                </li>
              </ol>
            </details>
          </aside>
        </div>
      </div>
    </div>
  );
}
