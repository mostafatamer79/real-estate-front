"use client";

import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  serviceRequestApi,
  ServiceRequest,
  ServiceStatus,
} from "@/lib/service-request-api";
import { useLanguage } from "@/context/LanguageContext";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  SaudiRiyalIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import PullToRefresh from "@/components/shared/PullToRefresh";
import { useAuth } from "@/hooks/useAuth";
import ServiceCategoryBrowser from "@/components/providers/ServiceCategoryBrowser";
import { loadServiceRequestPages } from "@/lib/service-request-pages";
import {
  requestMatchesService,
  type ServiceSelection,
} from "@/lib/service-navigation";
import { canNavigateBack } from "@/lib/workspace-usability";
import styles from "./my-requests.module.css";
import { loginHref } from "@/lib/auth-navigation";
import { canPriceServiceRequest, requestPriceDepartment, serviceRequestInvoiceLocked, serviceRequestPriceLocked, serviceRequestPricePayload } from "@/lib/service-request-pricing";

const STAFF_ROLES = new Set([
  "admin",
  "agent",
  "manager",
  "employee",
  "marketing",
  "marketing_admin",
  "legal",
  "legal_admin",
  "finance",
  "finance_admin",
]);

const departmentLabels: Record<string, string> = {
  admin: "الإدارة",
  agent: "الوسيط",
  marketing: "التسويق",
  finance: "المالية",
  legal: "القانونية",
  properties: "الأملاك",
  employees: "الموظفين",
  real_estate: "الأملاك",
};

const departmentLabelsEn: Record<string, string> = {
  admin: "Administration",
  agent: "Broker",
  marketing: "Marketing",
  finance: "Finance",
  legal: "Legal",
  properties: "Properties",
  employees: "Staff",
  real_estate: "Properties",
};

type RequestFilter = "all" | "accepted" | "rejected";

export default function MyServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, { price: string; note: string; deptSlug: string }>>({});
  const [search, setSearch] = useState("");
  const [requestFilter, setRequestFilter] = useState<RequestFilter>("all");
  const [serviceSelection, setServiceSelection] = useState<ServiceSelection>({});
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const confirmDialog = useConfirmDialog();

  const role = String(user?.role || "");
  const isAdmin = role === "admin";
  const canManageRequests = isAuthenticated && STAFF_ROLES.has(role);
  const mounted = useRef(true);
  const loadSerial = useRef(0);
  const busy = useRef(false);
  const [actionError, setActionError] = useState<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; loadSerial.current += 1; };
  }, []);
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !user)) router.replace(loginHref('/services/my-requests'));
  }, [authLoading, isAuthenticated, user, router]);
  useEffect(() => { setActionError(null); }, [selectedRequest?.id]);
  const errorMessage = (error: unknown, fallback: string) => {
    const failure = error as { response?: { data?: { message?: string | string[] } } };
    const message = failure?.response?.data?.message;
    return Array.isArray(message) ? message.join('، ') : typeof message === 'string' ? message : fallback;
  };
  const updatedRequest = (value: ServiceRequest, id: string) => {
    if (!value || value.id !== id || typeof value.status !== 'string') throw new Error('Invalid request response');
    return value;
  };
  const departmentTitle = (request: ServiceRequest) => {
    const slug = requestPriceDepartment(request);
    return (isAr ? departmentLabels : departmentLabelsEn)[slug] || slug;
  };

  const fetchRequests = useCallback(async () => {
    if (!canManageRequests) return;
    const operation = ++loadSerial.current;
    try {
      setLoading(true);
      setFetchError(null);
      const items = await loadServiceRequestPages((params) => {
        if (!mounted.current || operation !== loadSerial.current) throw new Error('Stale request');
        return serviceRequestApi.findAll(params);
      });
      if (!mounted.current || operation !== loadSerial.current) return;
      setRequests(items);
    } catch (error) {
      if (!mounted.current || operation !== loadSerial.current) return;
      console.error("Error fetching service requests:", error);
      const msg = isAr ? "تعذر تحميل الطلبات" : "Could not load requests";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      if (mounted.current && operation === loadSerial.current) setLoading(false);
    }
  }, [isAr, canManageRequests]);

  useEffect(() => {
    if (authLoading) return;
    if (!canManageRequests) {
      setLoading(false);
      return;
    }
    void fetchRequests();
  }, [authLoading, canManageRequests, fetchRequests]);

  const getDraft = (request: ServiceRequest) =>
    priceDrafts[request.id] || {
      price: request.price !== undefined && request.price !== null ? String(request.price) : "",
      note: "",
      deptSlug: requestPriceDepartment(request),
    };

  const updateDraft = (request: ServiceRequest, key: "price" | "note" | "deptSlug", value: string) => {
    setPriceDrafts((current) => ({
      ...current,
      [request.id]: { ...getDraft(request), [key]: value },
    }));
  };

  const submitPrice = async (request: ServiceRequest) => {
    if (busy.current) return;
    setActionError(null);
    if (!canPriceServiceRequest(user, request) || serviceRequestPriceLocked(request)) {
      setActionError(isAr ? 'لا يمكن تسعير هذا الطلب: تحقق من صلاحية القسم وحالة الفاتورة.' : 'This request cannot be priced: check department access and invoice status.');
      return;
    }
    let payload: ReturnType<typeof serviceRequestPricePayload>;
    try { payload = serviceRequestPricePayload(request, getDraft(request).price, getDraft(request).note); }
    catch {
      setActionError(isAr ? 'أدخل مبلغاً من 0.01 إلى 9,999,999,999.99 ريال وبمنزلتين عشريتين كحد أقصى.' : 'Enter an amount from SAR 0.01 to 9,999,999,999.99 with at most two decimal places.');
      return;
    }
    busy.current = true;
    try {
      const amount = new Intl.NumberFormat(isAr ? 'ar-SA' : 'en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(payload.price);
      const confirmed = await confirmDialog({
        contentClassName: styles.requestConfirm,
        closeLabel: isAr ? "إغلاق" : "Close",
        title: request.userId ? (isAr ? 'إنشاء فاتورة للعميل؟' : 'Create client invoice?') : (isAr ? 'تأكيد إرسال السعر؟' : 'Confirm price submission?'),
        description: `${request.serviceType} · ${departmentTitle(request)} · ${amount}. ` + (request.userId
          ? (isAr ? 'سيُنشئ الإرسال فاتورة في محفظة العميل ويقفل تعديل السعر.' : 'Submitting creates an invoice in the client wallet and locks price editing.')
          : (isAr ? 'سيُحفظ السعر ويُقفل تعديله. لا يوجد حساب عميل مرتبط لعرض الفاتورة في محفظته.' : 'The price will be saved and locked. No client account is linked for a wallet invoice.')),
        confirmLabel: isAr ? 'تأكيد الإرسال' : 'Confirm submission',
        cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      });
      if (!confirmed || !mounted.current) return;
      setSavingId(request.id);
      const response = await serviceRequestApi.addDepartmentPrice(request.id, payload);
      if (!mounted.current) return;
      setSelectedRequest(updatedRequest(response.data, request.id));
      toast.success(request.userId ? (isAr ? 'تم إرسال السعر وإنشاء الفاتورة في محفظة العميل.' : 'Price submitted and invoice created in the client wallet.') : (isAr ? 'تم حفظ السعر.' : 'Price saved.'));
      await fetchRequests();
    } catch (error) {
      if (mounted.current) setActionError(errorMessage(error, isAr ? 'تعذر إرسال السعر. حاول مرة أخرى.' : 'Could not submit the price. Try again.'));
    } finally {
      busy.current = false;
      if (mounted.current) setSavingId(null);
    }
  };

  const confirmOffer = async (request: ServiceRequest, deptSlug: string) => {
    if (!isAdmin || busy.current || serviceRequestInvoiceLocked(request)) return;
    busy.current = true;
    setActionError(null);
    try {
      const ok = await confirmDialog({
        contentClassName: styles.requestConfirm,
        closeLabel: isAr ? "إغلاق" : "Close",
        title: isAr ? 'اعتماد السعر؟' : 'Approve price offer?',
        description: request.userId
          ? (isAr ? 'بعد الاعتماد ستظهر الفاتورة للعميل في المحفظة للدفع.' : 'After approval, the invoice will appear in the client wallet for payment.')
          : (isAr ? 'سيُعتمد السعر. لا يوجد حساب عميل مرتبط لعرض فاتورة في المحفظة.' : 'The price will be approved. No client account is linked for a wallet invoice.'),
        confirmLabel: isAr ? 'تأكيد الاعتماد' : 'Confirm approval',
        cancelLabel: isAr ? 'إلغاء' : 'Cancel',
      });
      if (!ok || !mounted.current) return;
      setSavingId(request.id);
      const response = await serviceRequestApi.acceptDepartmentOffer(request.id, deptSlug);
      if (!mounted.current) return;
      setSelectedRequest(updatedRequest(response.data, request.id));
      toast.success(isAr ? 'تم اعتماد السعر.' : 'Price approved.');
      await fetchRequests();
    } catch (error) {
      if (mounted.current) setActionError(errorMessage(error, isAr ? 'تعذر اعتماد السعر.' : 'Could not approve price.'));
    } finally {
      busy.current = false;
      if (mounted.current) setSavingId(null);
    }
  };

  const openChat = async (requestId: string) => {
    if (busy.current) return;
    busy.current = true;
    setActionError(null);
    setSavingId(requestId);
    try {
      const response = await serviceRequestApi.getOrCreateChat(requestId);
      if (!mounted.current) return;
      const roomId = response.data?.chatRoomId;
      if (typeof roomId !== 'string' || !roomId) throw new Error('Invalid chat response');
      router.push(`/chat?roomId=${encodeURIComponent(roomId)}`);
    } catch (error) {
      if (mounted.current) setActionError(errorMessage(error, isAr ? 'تعذر فتح المحادثة.' : 'Could not open chat.'));
    } finally {
      busy.current = false;
      if (mounted.current) setSavingId(null);
    }
  };

  const handleBack = () => {
    if (
      typeof window !== "undefined" &&
      canNavigateBack(window.location.href, window.history.length, document.referrer)
    ) {
      router.back();
    } else {
      router.push("/services");
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (request: ServiceRequest) => {
    if (request.paymentStatus === 'paid') return <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>{isAr ? 'مدفوع' : 'Paid'}</span>;
    if (request.adminAccepted || request.clientDecision === "accepted") {
      return (
        <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
          <Check className="h-3 w-3" />
          {request.userId ? (isAr ? 'الفاتورة جاهزة في المحفظة' : 'Invoice ready in wallet') : (isAr ? 'تم حفظ السعر' : 'Price saved')}
        </span>
      );
    }
    if (Object.keys(request.departmentPrices || {}).length > 0) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
          <Clock className="h-3 w-3" />
          {isAr ? "بانتظار اعتماد الإدارة" : "Pending Admin Review"}
        </span>
      );
    }
    switch (request.status) {
      case ServiceStatus.PENDING:
        return (
          <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>
            <Clock className="h-3 w-3" />
            {isAr ? "قيد المراجعة" : "Under Review"}
          </span>
        );
      case ServiceStatus.IN_PROGRESS:
        return (
          <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>
            <Clock className="h-3 w-3" />
            {isAr ? "قيد المعالجة" : "In Progress"}
          </span>
        );
      case ServiceStatus.COMPLETED:
        return (
          <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
            <Check className="h-3 w-3" />
            {isAr ? "مكتمل" : "Completed"}
          </span>
        );
      case ServiceStatus.CANCELLED:
        return (
          <span className={`${styles.statusBadge} ${styles.statusDanger}`}>
            <AlertCircle className="h-3 w-3" />
            {isAr ? "ملغي" : "Cancelled"}
          </span>
        );
      default:
        return (
          <span className={`${styles.statusBadge} ${styles.statusNeutral}`}>
            {request.status}
          </span>
        );
    }
  };

  const isAcceptedRequest = (request: ServiceRequest) =>
    Boolean(
      request.adminAccepted ||
        request.clientDecision === "accepted" ||
        request.status === ServiceStatus.COMPLETED
    );

  const isRejectedRequest = (request: ServiceRequest) =>
    Boolean(
      request.clientDecision === "rejected" ||
        request.status === ServiceStatus.CANCELLED
    );

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (requestFilter === "accepted" && !isAcceptedRequest(request)) return false;
      if (requestFilter === "rejected" && !isRejectedRequest(request)) return false;
      if (!requestMatchesService(request, serviceSelection))
        return false;
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return [
        request.serviceType,
        request.clientName,
        request.phone,
        request.city,
        request.district,
        request.category,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  }, [requests, requestFilter, serviceSelection, search]);

  if (authLoading || loading || !user || !isAuthenticated) {
    return (
      <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <nav
            className={styles.staticNav}
            aria-label={isAr ? "التنقل الداخلي" : "In-page navigation"}
          >
            <div className={styles.navBreadcrumb}>
              <span className={styles.breadcrumbSegment}>
                {isAr ? "الخدمات" : "Services"}
              </span>
              <span aria-hidden="true">/</span>
              <span className={styles.breadcrumbCurrent}>
                {isAr ? "سجل طلبات الخدمات" : "Service Requests Register"}
              </span>
            </div>
            <div className={styles.navActions}>
              <button
                type="button"
                onClick={toggleLanguage}
                className={`${styles.navButton} ${styles.languageToggle}`}
                aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              >
                {isAr ? "EN" : "ع"}
              </button>
            </div>
          </nav>
          <div className={styles.loadingState}>
            <Loader2 className={styles.loadingSpinner} />
            <span>{isAr ? "جاري تحميل طلبات الخدمات..." : "Loading service requests..."}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!canManageRequests) {
    return (
      <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <nav
            className={styles.staticNav}
            aria-label={isAr ? "التنقل الداخلي" : "In-page navigation"}
          >
            <div className={styles.navBreadcrumb}>
              <span className={styles.breadcrumbSegment}>
                {isAr ? "الخدمات" : "Services"}
              </span>
              <span aria-hidden="true">/</span>
              <span className={styles.breadcrumbCurrent}>
                {isAr ? "طلبات الخدمات" : "Service Requests"}
              </span>
            </div>
            <div className={styles.navActions}>
              <button
                type="button"
                onClick={toggleLanguage}
                className={`${styles.navButton} ${styles.languageToggle}`}
                aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              >
                {isAr ? "EN" : "ع"}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className={styles.navButton}
                aria-label={isAr ? "رجوع" : "Back"}
              >
                <ArrowLeft className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
                <span>{isAr ? "رجوع" : "Back"}</span>
              </button>
            </div>
          </nav>

          <div className={styles.nonStaffContainer}>
            <div className={styles.nonStaffIcon}>
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className={styles.nonStaffTitle}>
              {isAr
                ? "هذه الصفحة للإدارة والفريق فقط"
                : "This page is for administration and staff only"}
            </h1>
            <p className={styles.nonStaffText}>
              {isAr
                ? "تابع طلباتك وعروض مقدمي الخدمات من صفحة المتابعة، والفواتير المتاحة للدفع من المحفظة."
                : "Track your requests and provider quotes on the tracking page, and available invoices in your wallet."}
            </p>
            <Link href="/services/provider-requests" className={styles.walletActionBtn}>
              {isAr ? "متابعة طلباتي وعروض الخدمات" : "Track my service requests"}
            </Link>
            <Link href="/services/legal-requests" className={styles.clientSecondaryLink}>
              {isAr ? "طلباتي القانونية" : "My legal requests"}
            </Link>
            <Link href="/wallet" className={styles.walletActionBtn}>
              {isAr ? "الذهاب إلى المحفظة" : "Go to Wallet"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRequest) {
    const draft = getDraft(selectedRequest);
    const offers = selectedRequest.departmentPrices || {};
    const targetDept = requestPriceDepartment(selectedRequest);
    const acceptedOffer = selectedRequest.metadata?.acceptedOffer || (selectedRequest.invoiceSent && offers[targetDept] ? { dept: targetDept, ...offers[targetDept] } : null);
    const pricingDisabled = serviceRequestPriceLocked(selectedRequest) || !canPriceServiceRequest(user, selectedRequest);
    const deptName = departmentTitle(selectedRequest);

    return (
      <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <nav
            className={styles.staticNav}
            aria-label={isAr ? "التنقل الداخلي" : "In-page navigation"}
          >
            <div className={styles.navBreadcrumb}>
              <span className={styles.breadcrumbSegment}>
                {isAr ? "سجل الطلبات" : "Requests Register"}
              </span>
              <span aria-hidden="true">/</span>
              <span className={styles.breadcrumbCurrent}>
                #{selectedRequest.id.substring(0, 8)}
              </span>
            </div>
            <div className={styles.navActions}>
              <button
                type="button"
                onClick={toggleLanguage}
                className={`${styles.navButton} ${styles.languageToggle}`}
                aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              >
                {isAr ? "EN" : "ع"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className={styles.navButton}
                aria-label={isAr ? "العودة للطلبات" : "Back to requests"}
              >
                <ArrowLeft className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
                <span>{isAr ? "العودة للطلبات" : "Back to Requests"}</span>
              </button>
            </div>
          </nav>

          {actionError && <div role="alert" className={styles.actionError}>{actionError}</div>}
          <section className={styles.detailCard} aria-labelledby="detail-title">
            <div className={styles.detailHeader}>
              <div className={styles.detailHeaderTop}>
                <div className={styles.detailHeaderMain}>
                  <div className={styles.detailIconWrap}>
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 id="detail-title" className={styles.detailTitle}>
                      {selectedRequest.serviceType || (isAr ? "طلب خدمة" : "Service Request")}
                    </h1>
                    <p className={styles.detailSubtitle}>
                      #{selectedRequest.id.substring(0, 8)} · {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                </div>
                <div className={styles.detailActions}>
                  {getStatusBadge(selectedRequest)}
                  <button
                    type="button"
                    className={styles.chatButton}
                    onClick={() => openChat(selectedRequest.id)}
                    disabled={savingId === selectedRequest.id}
                    aria-label={isAr ? "محادثة الطلب" : "Request chat"}
                  >
                    {savingId === selectedRequest.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MessageSquare className="h-4 w-4" />
                    )}
                    <span>{isAr ? "محادثة الطلب" : "Request Chat"}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.dossierSection}>
                <div className={styles.tilesGrid}>
                  <div className={styles.infoTile}>
                    <div className={styles.tileLabel}>{isAr ? "العميل" : "Client"}</div>
                    <div className={styles.tileValue}>
                      {selectedRequest.clientName || selectedRequest.user?.firstName || "-"}
                    </div>
                  </div>
                  <div className={styles.infoTile}>
                    <div className={styles.tileLabel}>{isAr ? "الجوال" : "Phone"}</div>
                    <div className={styles.tileValue} dir="ltr">
                      {selectedRequest.phone || selectedRequest.user?.phone || "-"}
                    </div>
                  </div>
                  <div className={styles.infoTile}>
                    <div className={styles.tileLabel}>{isAr ? "الموقع" : "Location"}</div>
                    <div className={styles.tileValue}>
                      {selectedRequest.city || selectedRequest.district
                        ? `${selectedRequest.city || "-"}، ${selectedRequest.district || "-"}`
                        : "-"}
                    </div>
                  </div>
                  <div className={styles.infoTile}>
                    <div className={styles.tileLabel}>{isAr ? "القسم" : "Department"}</div>
                    <div className={styles.tileValue}>{deptName}</div>
                  </div>
                </div>

                <div className={styles.descriptionBox}>
                  <div className={styles.descriptionLabel}>
                    {isAr ? "وصف الطلب" : "Request Description"}
                  </div>
                  <p className={styles.descriptionText}>
                    {selectedRequest.description || (isAr ? "لا يوجد وصف مدخل" : "No description provided")}
                  </p>
                </div>
              </div>

              <div className={styles.operationsSection}>
                <div className={styles.opPanel}>
                  <h2 className={styles.opPanelTitle}>
                    <SaudiRiyalIcon className="h-4 w-4" />
                    <span>{isAr ? 'إرسال السعر' : 'Submit price'}</span>
                  </h2>
                  {pricingDisabled && <p className={styles.pricingNotice}>{serviceRequestPriceLocked(selectedRequest) ? (isAr ? 'السعر مقفل بعد الإرسال أو الاعتماد.' : 'Pricing is locked after submission or approval.') : (isAr ? 'لا تملك صلاحية تسعير قسم هذا الطلب.' : 'You do not have permission to price this request department.')}</p>}
                  <div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="offer-price">
                        {isAr ? "السعر (ر.س)" : "Price (SAR)"}
                      </label>
                      <input
                        id="offer-price"
                        type="number"
                        min="0.01"
                        max="9999999999.99"
                        step="0.01"
                        disabled={pricingDisabled || savingId === selectedRequest.id}
                        value={draft.price}
                        onChange={(event) => updateDraft(selectedRequest, "price", event.target.value)}
                        className={styles.fieldInput}
                        placeholder={isAr ? "أدخل السعر" : "Enter price"}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="offer-dept">
                        {isAr ? 'قسم الطلب' : 'Request department'}
                      </label>
                      <input
                        id="offer-dept"
                        value={departmentTitle(selectedRequest)}
                        readOnly
                        className={styles.fieldInput}
                        dir="ltr"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="offer-note">
                        {isAr ? 'ملاحظة عن السعر' : 'Pricing note'}
                      </label>
                      <textarea
                        id="offer-note"
                        disabled={pricingDisabled || savingId === selectedRequest.id}
                        value={draft.note}
                        onChange={(event) => updateDraft(selectedRequest, "note", event.target.value)}
                        className={styles.fieldTextarea}
                        placeholder={isAr ? 'ملاحظة عن السعر...' : 'Pricing note...'}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.submitBtn}
                      disabled={pricingDisabled || savingId === selectedRequest.id}
                      onClick={() => submitPrice(selectedRequest)}
                    >
                      {savingId === selectedRequest.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SaudiRiyalIcon className="h-4 w-4" />
                      )}
                      <span>{isAr ? "إرسال السعر" : "Submit Price"}</span>
                    </button>
                  </div>
                </div>

                <div className={styles.opPanel}>
                  <h2 className={styles.opPanelTitle}>
                    <span>{isAr ? "عروض الأسعار المقدمة" : "Submitted Price Offers"}</span>
                  </h2>
                  <div>
                    {Object.entries(offers).map(([dept, offer]) => {
                      const isAccepted = acceptedOffer?.dept === dept;
                      const deptTitle = isAr
                        ? departmentLabels[dept] || dept
                        : departmentLabelsEn[dept] || dept;
                      return (
                        <div
                          key={dept}
                          className={`${styles.offerItem} ${
                            isAccepted ? styles.offerItemAccepted : ""
                          }`}
                        >
                          <div className={styles.offerHeader}>
                            <div>
                              <div className={styles.offerDept}>{deptTitle}</div>
                              <div className={styles.offerNote}>
                                {offer.note || (isAr ? "بدون ملاحظات" : "No notes")}
                              </div>
                            </div>
                            <div className={styles.offerPrice}>
                              <SaudiRiyalAmount
                                amount={offer.price}
                                locale={isAr ? "ar-SA" : "en-US"}
                              />
                            </div>
                          </div>
                          {isAdmin && !acceptedOffer && !serviceRequestInvoiceLocked(selectedRequest) && (
                            <button
                              type="button"
                              className={styles.approveBtn}
                              disabled={savingId === selectedRequest.id}
                              onClick={() => confirmOffer(selectedRequest, dept)}
                            >
                              <Check className="h-4 w-4" />
                              <span>{selectedRequest.userId ? (isAr ? 'اعتماد وإرسال الفاتورة' : 'Approve & send invoice') : (isAr ? 'اعتماد السعر' : 'Approve price')}</span>
                            </button>
                          )}
                          {isAccepted && (
                            <div className={styles.acceptedOfferNote}>
                              <Check className="h-3.5 w-3.5" />
                              <span>{selectedRequest.userId ? (isAr ? 'تم اعتماد السعر وإرساله للمحفظة' : 'Price approved and sent to wallet') : (isAr ? 'تم اعتماد السعر' : 'Price approved')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {Object.keys(offers).length === 0 && (
                      <div className={styles.emptyState}>
                        <p className={styles.emptyDesc}>
                          {isAr ? "لا توجد أسعار مرسلة بعد" : "No price offers submitted yet"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={fetchRequests}>
      <div className={styles.page} dir={isAr ? "rtl" : "ltr"}>
        <div className={styles.container}>
          <nav
            className={styles.staticNav}
            aria-label={isAr ? "التنقل الداخلي" : "In-page navigation"}
          >
            <div className={styles.navBreadcrumb}>
              <span className={styles.breadcrumbSegment}>
                {isAr ? "الخدمات" : "Services"}
              </span>
              <span aria-hidden="true">/</span>
              <span className={styles.breadcrumbCurrent}>
                {isAr ? "سجل طلبات الخدمات" : "Service Requests Register"}
              </span>
            </div>
            <div className={styles.navActions}>
              <button
                type="button"
                onClick={toggleLanguage}
                className={`${styles.navButton} ${styles.languageToggle}`}
                aria-label={isAr ? "Switch to English" : "التبديل إلى العربية"}
              >
                {isAr ? "EN" : "ع"}
              </button>
              <button
                type="button"
                onClick={handleBack}
                className={styles.navButton}
                aria-label={isAr ? "رجوع" : "Back"}
              >
                <ArrowLeft className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
                <span>{isAr ? "رجوع" : "Back"}</span>
              </button>
            </div>
          </nav>

          <header className={styles.headerSection}>
            <div className={styles.headerRow}>
              <div className={styles.headerMain}>
                <span className={styles.kicker}>
                  {isAr ? "سجل الطلبات التشغيلية" : "Operational Requests Console"}
                </span>
                <h1 className={styles.pageTitle}>
                  {isAdmin
                    ? (isAr ? "إدارة طلبات الخدمات" : "Manage Service Requests")
                    : (isAr ? "متابعة طلبات الخدمات" : "Service Requests")}
                </h1>
                <p className={styles.pageSubtitle}>
                  {isAr
                    ? "متابعة طلبات الخدمات، وإرسال أسعار الأقسام المصرّح بها، وتتبع حالة الفاتورة."
                    : "Track service requests, submit authorized department prices, and follow invoice status."}
                </p>
                <div className={styles.headerMeta}>
                  <span className={styles.roleChip}>
                    {isAdmin ? (isAr ? "لوحة المشرف" : "Admin Panel") : (isAr ? "متابعة العمليات" : "Operations")}
                  </span>
                  <span className={styles.registerCount}>{requests.length.toLocaleString(isAr ? 'ar-SA' : 'en-US')} {isAr ? 'طلب في السجل' : 'requests in the register'}</span>
                </div>
              </div>

              <div className={styles.controlsBar}>
                <div className={styles.searchWrapper}>
                  <Search className={styles.searchIcon} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={styles.searchInput}
                    placeholder={isAr ? "بحث في الطلبات..." : "Search requests..."}
                    aria-label={isAr ? "بحث في الطلبات" : "Search requests"}
                  />
                </div>
                <button
                  type="button"
                  className={styles.refreshButton}
                  onClick={fetchRequests}
                  aria-label={isAr ? "تحديث الطلبات" : "Refresh requests"}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{isAr ? "تحديث" : "Refresh"}</span>
                </button>
              </div>
            </div>
          </header>

          {fetchError ? (
            <div className={styles.errorState} role="alert">
              <AlertCircle className={styles.errorIcon} />
              <div className={styles.errorTitle}>
                {isAr ? "خطأ في تحميل البيانات" : "Data Loading Error"}
              </div>
              <div className={styles.errorDesc}>{fetchError}</div>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={fetchRequests}
              >
                <RefreshCw className="h-4 w-4" />
                <span>{isAr ? "إعادة المحاولة" : "Retry"}</span>
              </button>
            </div>
          ) : (
            <>
              <nav className={styles.tabsNav} aria-label={isAr ? "تصفية حالة الطلبات" : "Request status filters"}>
                {([
                  { id: "all", label: isAr ? "كل الخدمات" : "All Services", count: requests.length },
                  {
                    id: "accepted",
                    label: isAr ? "الخدمات المقبولة" : "Accepted Services",
                    count: requests.filter(isAcceptedRequest).length,
                  },
                  {
                    id: "rejected",
                    label: isAr ? "الخدمات المرفوضة" : "Rejected Services",
                    count: requests.filter(isRejectedRequest).length,
                  },
                ] as const).map((tab) => {
                  const active = requestFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRequestFilter(tab.id)}
                      className={`${styles.tabButton} ${active ? styles.tabButtonActive : ""}`}
                      aria-pressed={active}
                    >
                      <span>{tab.label}</span>
                      <span className={styles.tabCount}>{tab.count}</span>
                    </button>
                  );
                })}
              </nav>

              <div className={styles.categoryBrowserContainer}>
                <ServiceCategoryBrowser
                  value={serviceSelection}
                  onChange={setServiceSelection}
                />
              </div>

              {filteredRequests.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock className={styles.emptyIcon} />
                  <div className={styles.emptyTitle}>
                    {isAr ? "لا توجد خدمات مطابقة" : "No matching requests"}
                  </div>
                  <p className={styles.emptyDesc}>
                    {isAr
                      ? "لم يتم العثور على طلبات ضمن هذا التصنيف أو معايير البحث المحددة."
                      : "No requests found for this category or the specified search criteria."}
                  </p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 900px) */}
                  <div className={styles.registerCard}>
                    <div className={styles.tableContainer}>
                      <table className={styles.registerTable}>
                        <thead>
                          <tr>
                            <th scope="col">{isAr ? "نوع الخدمة" : "Service Type"}</th>
                            <th scope="col">{isAr ? "العميل والتواصل" : "Client & Contact"}</th>
                            <th scope="col">{isAr ? "الموقع" : "Location"}</th>
                            <th scope="col">{isAr ? "التاريخ" : "Date"}</th>
                            <th scope="col">{isAr ? "الحالة" : "Status"}</th>
                            <th scope="col">{isAr ? "العروض" : "Offers"}</th>
                            <th scope="col">{isAr ? "السعر" : "Price"}</th>
                            <th scope="col"><span className="sr-only">{isAr ? "الإجراءات" : "Actions"}</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((request) => {
                            const offersCount = Object.keys(request.departmentPrices || {}).length;
                            const displayPrice = request.price !== undefined && request.price !== null ? request.price : 0;
                            return (
                              <tr
                                key={request.id}
                                className={styles.registerRow}
                                onClick={() => setSelectedRequest(request)}
                                tabIndex={0}
                                role="button"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setSelectedRequest(request);
                                  }
                                }}
                                aria-label={`${request.serviceType || "طلب"} - #${request.id.substring(0, 8)}`}
                              >
                                <td className={styles.registerCell}>
                                  <div className={styles.servicePrimary}>
                                    {request.serviceType || (isAr ? "طلب خدمة" : "Service Request")}
                                  </div>
                                  <div className={styles.serviceSub}>
                                    #{request.id.substring(0, 8)}
                                  </div>
                                </td>
                                <td className={styles.registerCell}>
                                  <div className={styles.clientName}>
                                    {request.clientName || request.user?.firstName || (isAr ? "عميل" : "Client")}
                                  </div>
                                  <div className={styles.clientContact} dir="ltr">
                                    {request.phone || request.user?.phone || "-"}
                                  </div>
                                </td>
                                <td className={styles.registerCell}>
                                  <div>
                                    {request.city || request.district
                                      ? `${request.city || "-"}، ${request.district || "-"}`
                                      : "-"}
                                  </div>
                                </td>
                                <td className={styles.registerCell}>
                                  <div>{formatDate(request.createdAt)}</div>
                                </td>
                                <td className={styles.registerCell}>
                                  {getStatusBadge(request)}
                                </td>
                                <td className={styles.registerCell}>
                                  <span className={styles.tabCount}>{offersCount}</span>
                                </td>
                                <td className={styles.registerCell}>
                                  <span className={styles.priceDisplay}>
                                    <SaudiRiyalAmount
                                      amount={displayPrice}
                                      locale={isAr ? "ar-SA" : "en-US"}
                                    />
                                  </span>
                                </td>
                                <td className={styles.registerCell}>
                                  <span className={styles.rowActionLink}>
                                    <span>{isAr ? "عرض" : "View"}</span>
                                    <ChevronRight
                                      className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                                    />
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile / Tablet Card View (< 900px) */}
                  <div className={styles.mobileCardList}>
                    {filteredRequests.map((request) => {
                      const offersCount = Object.keys(request.departmentPrices || {}).length;
                      const displayPrice = request.price !== undefined && request.price !== null ? request.price : 0;
                      return (
                        <div
                          key={request.id}
                          className={styles.mobileCard}
                          onClick={() => setSelectedRequest(request)}
                          tabIndex={0}
                          role="button"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedRequest(request);
                            }
                          }}
                          aria-label={`${request.serviceType || "طلب"} - #${request.id.substring(0, 8)}`}
                        >
                          <div className={styles.mobileCardTop}>
                            <div className={styles.mobileCardService}>
                              {request.serviceType || (isAr ? "طلب خدمة" : "Service Request")}
                            </div>
                            {getStatusBadge(request)}
                          </div>
                          <div className={styles.mobileCardMeta}>
                            <span>#{request.id.substring(0, 8)}</span>
                            <span>·</span>
                            <span>{formatDate(request.createdAt)}</span>
                            {(request.city || request.district) && (
                              <>
                                <span>·</span>
                                <span>{`${request.city || "-"}، ${request.district || "-"}`}</span>
                              </>
                            )}
                          </div>
                          <div className={styles.mobileCardClient}>
                            {request.clientName || request.user?.firstName || (isAr ? "عميل" : "Client")} · {request.phone || request.user?.phone || "-"}
                          </div>
                          <div className={styles.mobileCardBottom}>
                            <div className={styles.mobileCardMetric}>
                              <span className={styles.mobileCardMetricLabel}>
                                {isAr ? "العروض" : "Offers"}
                              </span>
                              <span className={styles.mobileCardMetricValue}>
                                {offersCount}
                              </span>
                            </div>
                            <div className={styles.mobileCardMetric}>
                              <span className={styles.mobileCardMetricLabel}>
                                {isAr ? "السعر الحالي" : "Current Price"}
                              </span>
                              <span className={styles.mobileCardMetricValue}>
                                <SaudiRiyalAmount
                                  amount={displayPrice}
                                  locale={isAr ? "ar-SA" : "en-US"}
                                />
                              </span>
                            </div>
                            <span className={styles.rowActionLink}>
                              <span>{isAr ? "التفاصيل" : "Details"}</span>
                              <ChevronRight
                                className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`}
                              />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
