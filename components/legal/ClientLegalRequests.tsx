"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  serviceRequestApi,
} from "@/lib/service-request-api";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { loginHref } from "@/lib/auth-navigation";
import toast from "react-hot-toast";
import { legalMoney as normalizePrice, legalRequestPage, legalDecisionResult, canDecideLegalInvoice, type LegalClientRequest } from "@/lib/legal-client-requests";
import {
  Scale,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FileText,
  User as UserIcon,
  MapPin,
  Calendar,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Wallet,
} from "lucide-react";
import styles from "./client-legal-requests.module.css";

interface ParsedParty {
  name: string;
  idNumber?: string;
  phone?: string;
  role?: string;
  agent?: {
    name?: string;
    agencyNumber?: string;
    idNumber?: string;
  };
}

type ClientLegalRequestItem = LegalClientRequest;

export function formatSafeDate(dateStr: unknown, isAr: boolean): string {
  if (!dateStr || (typeof dateStr !== "string" && typeof dateStr !== "number" && !(dateStr instanceof Date))) {
    return "—";
  }
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function parseParty(raw: unknown): ParsedParty | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    return trimmed ? { name: trimmed } : null;
  }
  if (typeof raw === "object") {
    const p = raw as Record<string, unknown>;
    const name =
      typeof p.name === "string" && p.name.trim()
        ? p.name.trim()
        : typeof p.clientName === "string" && p.clientName.trim()
        ? p.clientName.trim()
        : "";
    const idNumber =
      p.idNumber !== undefined && p.idNumber !== null
        ? (typeof p.idNumber === "string" || typeof p.idNumber === "number" ? String(p.idNumber).trim() : undefined)
        : undefined;
    const phone =
      typeof p.phone === "string" && p.phone.trim() ? p.phone.trim() : undefined;
    const role =
      typeof p.role === "string" && p.role.trim() ? p.role.trim() : undefined;

    let agent: ParsedParty["agent"] | undefined = undefined;
    if (p.agent && typeof p.agent === "object") {
      const a = p.agent as Record<string, unknown>;
      const agentName = typeof a.name === "string" ? a.name.trim() : undefined;
      const agencyNumber =
        a.agencyNumber !== undefined && a.agencyNumber !== null
          ? (typeof a.agencyNumber === "string" || typeof a.agencyNumber === "number" ? String(a.agencyNumber).trim() : undefined)
          : undefined;
      const agentIdNumber =
        a.idNumber !== undefined && a.idNumber !== null
          ? (typeof a.idNumber === "string" || typeof a.idNumber === "number" ? String(a.idNumber).trim() : undefined)
          : undefined;
      if (agentName || agencyNumber || agentIdNumber) {
        agent = { name: agentName, agencyNumber, idNumber: agentIdNumber };
      }
    }

    if (!name && !idNumber && !phone && !agent) return null;
    return {
      name: name || "—",
      idNumber,
      phone,
      role,
      agent,
    };
  }
  return null;
}

export default function ClientLegalRequests() {
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const { user, token, isLoading: authLoading, isAuthenticated } = useAuth();
  const userId = user?.id;
  const actorRef = useRef(userId);
  actorRef.current = userId;
  const pageRef = useRef(1);
  const router = useRouter();
  const confirmDialog = useConfirmDialog();

  const [requests, setRequests] = useState<ClientLegalRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; text: string } | null>(null);

  const mounted = useRef(true);
  const loadSerial = useRef(0);
  const busy = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      loadSerial.current += 1;
    };
  }, []);

  // Guest or missing-user redirect guard
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !token || !userId)) {
      router.replace(loginHref("/services/legal-requests"));
    }
  }, [authLoading, isAuthenticated, token, userId, router]);

  const fetchRequests = useCallback(
    async (targetPage: number = 1): Promise<void> => {
      if (!token || !userId || !isAuthenticated) return;
      const operation = ++loadSerial.current;
      setIsLoading(true);
      setFetchError(null);

      try {
        const res = await serviceRequestApi.findAll({
          category: "legal",
          mine: true,
          page: targetPage,
          limit: 30,
        });

        if (!mounted.current || operation !== loadSerial.current) return;

        const payload = legalRequestPage(res.data);
        if (targetPage > payload.totalPages) { await fetchRequests(payload.totalPages); return; }
        if (payload.total > 0 && payload.items.length === 0) throw new Error('Inconsistent request page');
        setRequests(payload.items);
        setTotalCount(payload.total);
        setTotalPages(payload.totalPages);
        pageRef.current = targetPage;
        setPage(targetPage);
      } catch (err: unknown) {
        if (!mounted.current || operation !== loadSerial.current) return;
        const failure = err as { response?: { data?: { message?: string | string[] } } };
        const msg = failure?.response?.data?.message;
        const errText = Array.isArray(msg)
          ? msg.join("، ")
          : typeof msg === "string"
          ? msg
          : isAr
          ? "تعذر تحميل الطلبات القانونية. يُرجى إعادة المحاولة."
          : "Could not load legal requests. Please retry.";
        setFetchError(errText);
      } finally {
        if (mounted.current && operation === loadSerial.current) {
          setIsLoading(false);
        }
      }
    },
    [token, userId, isAuthenticated, isAr]
  );

  useEffect(() => {
    if (!authLoading && isAuthenticated && token && userId) {
      void fetchRequests(pageRef.current);
    }
  }, [authLoading, isAuthenticated, token, userId, fetchRequests]);

  const handleDecision = async (
    req: ClientLegalRequestItem,
    decision: "accepted" | "rejected"
  ) => {
    if (busy.current || !canDecideLegalInvoice(req, userId)) return;
    busy.current = true;
    const actorId = userId;
    setActionError(null);
    const isAccept = decision === "accepted";
    const normalizedPriceVal = normalizePrice(req.invoicePrice);
    try {
    const confirmed = await confirmDialog({
      contentClassName: styles.confirmation,
      title: isAccept
        ? isAr
          ? "تأكيد قبول الفاتورة"
          : "Confirm Invoice Acceptance"
        : isAr
        ? "تأكيد رفض الفاتورة"
        : "Confirm Invoice Rejection",
      description: isAccept
        ? isAr
          ? `هل أنت متأكد من قبول الفاتورة الصادرة بقيمة ${
              normalizedPriceVal !== null
                ? normalizedPriceVal.toLocaleString() + " ر.س"
                : "المحددة"
            } للطلب #${req.id.slice(0, 8)}؟ قبولك يعني الموافقة على القيمة الصادرة لبدء المتابعة.`
          : `Are you sure you want to accept the invoice of ${
              normalizedPriceVal !== null
                ? normalizedPriceVal.toLocaleString() + " SAR"
                : "the specified amount"
            } for request #${req.id.slice(0, 8)}? Acceptance confirms the invoice amount.`
        : isAr
        ? `هل أنت متأكد من رفض الفاتورة الصادرة للطلب #${req.id.slice(0, 8)}؟`
        : `Are you sure you want to reject the invoice for request #${req.id.slice(0, 8)}?`,
      confirmLabel: isAccept
        ? isAr
          ? "تأكيد القبول"
          : "Confirm Accept"
        : isAr
        ? "تأكيد الرفض"
        : "Confirm Reject",
      cancelLabel: isAr ? "تراجع" : "Cancel",
      destructive: !isAccept,
      closeLabel: isAr ? "إغلاق" : "Close",
    });

      if (!confirmed || !mounted.current || actorRef.current !== actorId) return;
      setActionLoading(req.id);
      const response = await api.put(`/service-requests/${encodeURIComponent(req.id)}/client-decision`, {decision});
      if (!mounted.current || actorRef.current !== actorId) return;
      const updated = legalDecisionResult(response.data, req.id, decision);
      loadSerial.current += 1;
      setIsLoading(false);
      setRequests(current => current.map(item => item.id === req.id ? updated : item));
      toast.success(isAccept ? (isAr ? 'تم قبول الفاتورة.' : 'Invoice accepted.') : (isAr ? 'تم رفض الفاتورة.' : 'Invoice rejected.'));
    } catch (error) {
      if (!mounted.current || actorRef.current !== actorId) return;
      const failure = error as {response?:{data?:{message?:string|string[]}}};
      const message = failure.response?.data?.message;
      const text = Array.isArray(message) ? message.join('، ') : typeof message === 'string' ? message :
        isAr ? 'تعذر تحديث قرار الفاتورة. يُرجى المحاولة لاحقاً.' : 'Could not update invoice decision. Please try again.';
      setActionError({id:req.id,text});
    } finally {
      busy.current = false;
      if (mounted.current) setActionLoading(null);
    }
  };

  const getDossierStatus = (req: ClientLegalRequestItem) => {
    if (req.paymentStatus === "paid") return {label:isAr ? "مدفوع" : "Paid",className:styles.statusAccepted};
    if (!req.invoiceSent) {
      if (req.status === "completed") {
        return {
          label: isAr ? "مكتمل" : "Completed",
          className: styles.statusCompleted,
        };
      }
      if (req.status === "cancelled") {
        return {
          label: isAr ? "ملغي" : "Cancelled",
          className: styles.statusRejected,
        };
      }
      return {
        label: isAr ? "قيد الدراسة والتقييم" : "Under Review",
        className: styles.statusPending,
      };
    }

    if (req.clientDecision === "accepted") {
      // Prompt Rule: Accepted means invoice accepted NEVER payment/service completed
      return {
        label: isAr ? "تم قبول الفاتورة" : "Invoice Accepted",
        className: styles.statusAccepted,
      };
    }

    if (req.clientDecision === "rejected") {
      return {
        label: isAr ? "تم رفض الفاتورة" : "Invoice Rejected",
        className: styles.statusRejected,
      };
    }

    return {
      label: isAr ? "بانتظار قرار الفاتورة" : "Awaiting Invoice Decision",
      className: styles.statusAwaitingDecision,
    };
  };

  const handlePageChange = (newPage: number) => {
    if (!busy.current && newPage >= 1 && newPage <= totalPages && newPage !== page) {
      fetchRequests(newPage);
    }
  };

  if (authLoading || !isAuthenticated || !token || !userId) return <div className={styles.page} dir={isAr ? 'rtl' : 'ltr'}><div className={styles.container} role="status">{authLoading ? (isAr ? 'جارٍ التحقق من الحساب…' : 'Checking your account…') : (isAr ? 'جارٍ التحويل لتسجيل الدخول…' : 'Redirecting to login…')}</div></div>;

  return (
    <div
      className={styles.page}
      dir={isAr ? "rtl" : "ltr"}
      aria-labelledby="dossier-page-title"
    >
      <div className={styles.container}>
        {/* Navigation Bar: Breadcrumbs & Primary Actions */}
        <nav
          className={styles.navBar}
          aria-label={isAr ? "مسار التنقل" : "Breadcrumbs"}
        >
          <ol className={styles.breadcrumbs}>
            <li className={styles.breadcrumbItem}>
              <Link href="/services" className={styles.breadcrumbLink}>
                {isAr ? "الخدمات" : "Services"}
              </Link>
            </li>
            <li aria-hidden="true" className={styles.breadcrumbSeparator}>
              {isAr ? "←" : "→"}
            </li>
            <li className={styles.breadcrumbItem}>
              <Link href="/details" className={styles.breadcrumbLink}>
                {isAr ? "التفاصيل" : "Details"}
              </Link>
            </li>
            <li aria-hidden="true" className={styles.breadcrumbSeparator}>
              {isAr ? "←" : "→"}
            </li>
            <li className={styles.breadcrumbItem}>
              <Link href="/services/legal" className={styles.breadcrumbLink}>
                {isAr ? "دليل الخدمات القانونية" : "Legal Services Catalog"}
              </Link>
            </li>
            <li aria-hidden="true" className={styles.breadcrumbSeparator}>
              {isAr ? "←" : "→"}
            </li>
            <li
              aria-current="page"
              className={styles.breadcrumbCurrent}
            >
              {isAr ? "ملف الطلبات القانونية" : "Legal Requests Dossier"}
            </li>
          </ol>

          <div className={styles.navActions}>
            <button type="button" onClick={toggleLanguage} disabled={Boolean(actionLoading)} className={styles.refreshButton} aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}>{isAr ? 'EN' : 'ع'}</button>
            <button
              type="button"
              onClick={() => fetchRequests(page)}
              disabled={isLoading || Boolean(actionLoading)}
              className={styles.refreshButton}
              aria-label={isAr ? "تحديث قائمة الطلبات" : "Refresh requests list"}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? styles.spinning : ""}`}
                aria-hidden="true"
              />
              <span>{isAr ? "تحديث" : "Refresh"}</span>
            </button>

            <Link
              href="/services/legal"
              className={styles.primaryActionButton}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? "طلب جديد" : "New Request"}</span>
            </Link>
          </div>
        </nav>

        {/* Dossier Header */}
        <header className={styles.dossierHeader}>
          <div className={styles.dossierKicker}>
            <Scale className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{isAr ? "03 / ملف المعاملات القانونية" : "03 / LEGAL DOSSIER"}</span>
          </div>
          <h1 id="dossier-page-title" className={styles.dossierTitle}>
            {isAr ? "سجل الطلبات والاستشارات القانونية" : "Legal Requests & Consultations"}
          </h1>
          <p className={styles.dossierSubtitle}>
            {isAr
              ? "متابعة شفافة لجميع استشاراتك، عقودك، والنزاعات العقارية خطوة بخطوة."
              : "Review, manage, and inspect all your legal consultations, contracts, and property disputes."}
          </p>

          <div className={styles.headerMetaRow}>
            <span className={`${styles.metaChip} ${styles.metaChipActive}`}>
              {isAr ? `إجمالي الطلبات: ${totalCount}` : `Total Requests: ${totalCount}`}
            </span>
            {totalPages > 1 && (
              <span className={styles.metaChip}>
                {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
              </span>
            )}

          </div>
        </header>

        {/* Main State Views: Loading, Error, Empty, List */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            className={styles.loadingContainer}
          >
            <RefreshCw
              className={`h-8 w-8 ${styles.spinning} text-muted-foreground`}
              aria-hidden="true"
            />
            <p className={styles.loadingText}>
              {isAr ? "جارٍ تحميل ملف الطلبات القانونية…" : "Loading legal dossier…"}
            </p>
          </div>
        )}

        {!isLoading && fetchError && (
          <div role="alert" className={styles.errorContainer}>
            <AlertCircle className="h-8 w-8" aria-hidden="true" />
            <h2 className={styles.errorTitle}>
              {isAr ? "حدث خطأ أثناء تحميل الطلبات" : "Error Loading Requests"}
            </h2>
            <p className={styles.errorText}>{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchRequests(page)}
              className={styles.retryButton}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? "إعادة المحاولة" : "Retry"}</span>
            </button>
          </div>
        )}

        {!isLoading && !fetchError && requests.length === 0 && (
          <div className={styles.emptyContainer}>
            <div className={styles.emptyIconWrapper}>
              <Scale className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className={styles.emptyTitle}>
              {isAr ? "لا توجد طلبات قانونية حالياً" : "No Legal Requests Found"}
            </h2>
            <p className={styles.emptyDescription}>
              {isAr
                ? "لم تقم بتقديم أي طلب قانوني بعد. يمكنك اختيار الخدمة القانونية المناسبة وبدء تقديم طلبك الآن."
                : "You have not submitted any legal requests yet. Select a legal service to begin your first request."}
            </p>
            <Link
              href="/services/legal"
              className={styles.primaryActionButton}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{isAr ? "اختيار خدمة قانونية جديدة" : "Choose a Legal Service"}</span>
            </Link>
          </div>
        )}

        {!isLoading && !fetchError && requests.length > 0 && (
          <div className={styles.dossierList}>
            {requests.map((req) => {
              const status = getDossierStatus(req);
              const isExpanded = expandedId === req.id;
              const normalizedPrice = normalizePrice(req.invoicePrice);
              const firstParty = parseParty(req.firstParty);
              const secondParty = parseParty(req.secondParty);

              const canMakeDecision = canDecideLegalInvoice(req, userId);

              const formattedLocation = [req.city, req.district]
                .filter((v): v is string => typeof v === "string" && Boolean(v.trim()))
                .join(" · ");

              return (
                <article
                  key={req.id}
                  className={styles.dossierEntry}
                  id={`request-${req.id}`}
                >
                  {/* Top Entry Summary Row */}
                  <div className={styles.entryHeader}>
                    <div className={styles.entryMainInfo}>
                      <div className={styles.entryRefRow}>
                        <span className={styles.entryRefNumber}>
                          #LEGAL-{req.id.slice(0, 8).toUpperCase()}
                        </span>
                        {req.category && (
                          <span className={styles.entryCategoryBadge}>
                            {req.category === "legal"
                              ? isAr
                                ? "قانوني"
                                : "Legal"
                              : req.category}
                          </span>
                        )}
                        <span
                          className={`${styles.statusBadge} ${status.className}`}
                        >
                          <span className={styles.statusDot} aria-hidden="true" />
                          <span>{status.label}</span>
                        </span>
                      </div>

                      <h2 className={styles.entryTitle}>
                        {req.serviceType ||
                          (isAr ? "خدمة واستشارة قانونية" : "Legal Service & Consultation")}
                      </h2>

                      <div className={styles.entryMetaLine}>
                        <span className={styles.metaItem}>
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                          <span>{formatSafeDate(req.createdAt, isAr)}</span>
                        </span>

                        {formattedLocation && (
                          <span className={styles.metaItem}>
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span>{formattedLocation}</span>
                          </span>
                        )}

                        {req.invoiceSent && normalizedPrice !== null && (
                          <span className={styles.metaItem}>
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span>
                              {isAr ? "قيمة الفاتورة: " : "Invoice: "}
                              {normalizedPrice.toLocaleString()} {isAr ? "ر.س" : "SAR"}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={styles.entryActions}>
                      <button
                        type="button"
                        id={`toggle-${req.id}`}
                        aria-expanded={isExpanded}
                        aria-controls={`details-${req.id}`}
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        className={styles.expandButton}
                        aria-label={
                          isExpanded
                            ? isAr
                              ? `طي تفاصيل الطلب #${req.id.slice(0, 8)}`
                              : `Collapse details for request #${req.id.slice(0, 8)}`
                            : isAr
                            ? `عرض تفاصيل الطلب #${req.id.slice(0, 8)}`
                            : `View details for request #${req.id.slice(0, 8)}`
                        }
                      >
                        <span className={styles.expandLabel}>
                          {isExpanded
                            ? isAr
                              ? "طي التفاصيل"
                              : "Collapse"
                            : isAr
                            ? "عرض التفاصيل"
                            : "View Details"}
                        </span>
                        <ChevronDown
                          className={`${styles.chevron} ${
                            isExpanded ? styles.chevronExpanded : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Accessible Expandable Details View */}
                  {isExpanded && (
                    <div
                      id={`details-${req.id}`}
                      role="region"
                      aria-labelledby={`toggle-${req.id}`}
                      className={styles.expandedContent}
                    >
                      {/* Parties Dossier Section */}
                      {(firstParty || secondParty) && (
                        <div className={styles.detailSection}>
                          <div className={styles.sectionHeader}>
                            <UserIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className={styles.sectionKicker}>
                              {isAr ? "أطراف المعاملة القانونية" : "Contracting Parties"}
                            </span>
                          </div>

                          <div className={styles.partiesGrid}>
                            {firstParty && (
                              <div className={styles.partyColumn}>
                                <span className={styles.partyRoleLabel}>
                                  {isAr ? "الطرف الأول" : "First Party"}
                                </span>
                                <h3 className={styles.partyName}>{firstParty.name}</h3>
                                <div className={styles.partyDetailsList}>
                                  {firstParty.idNumber && (
                                    <div className={styles.partyDetailItem}>
                                      <span>
                                        {isAr ? "الهوية الوطنية / السجل: " : "ID / CR: "}
                                        {firstParty.idNumber}
                                      </span>
                                    </div>
                                  )}
                                  {firstParty.phone && (
                                    <div className={styles.partyDetailItem}>
                                      <span>
                                        {isAr ? "رقم الاتصال: " : "Phone: "}
                                        {firstParty.phone}
                                      </span>
                                    </div>
                                  )}
                                  {firstParty.agent && (
                                    <div className={styles.partyAgentBox}>
                                      <p className="font-semibold mb-0.5">
                                        {isAr ? "بيانات الوكيل: " : "Agent: "}
                                        {firstParty.agent.name || "—"}
                                      </p>
                                      {firstParty.agent.agencyNumber && (
                                        <p>
                                          {isAr ? "رقم الوكالة: " : "Power of Attorney No: "}
                                          {firstParty.agent.agencyNumber}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {secondParty && (
                              <div className={styles.partyColumn}>
                                <span className={styles.partyRoleLabel}>
                                  {isAr ? "الطرف الثاني" : "Second Party"}
                                </span>
                                <h3 className={styles.partyName}>{secondParty.name}</h3>
                                <div className={styles.partyDetailsList}>
                                  {secondParty.idNumber && (
                                    <div className={styles.partyDetailItem}>
                                      <span>
                                        {isAr ? "الهوية الوطنية / السجل: " : "ID / CR: "}
                                        {secondParty.idNumber}
                                      </span>
                                    </div>
                                  )}
                                  {secondParty.phone && (
                                    <div className={styles.partyDetailItem}>
                                      <span>
                                        {isAr ? "رقم الاتصال: " : "Phone: "}
                                        {secondParty.phone}
                                      </span>
                                    </div>
                                  )}
                                  {secondParty.agent && (
                                    <div className={styles.partyAgentBox}>
                                      <p className="font-semibold mb-0.5">
                                        {isAr ? "بيانات الوكيل: " : "Agent: "}
                                        {secondParty.agent.name || "—"}
                                      </p>
                                      {secondParty.agent.agencyNumber && (
                                        <p>
                                          {isAr ? "رقم الوكالة: " : "Power of Attorney No: "}
                                          {secondParty.agent.agencyNumber}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Description / Scope Section */}
                      {req.description && (
                        <div className={styles.descriptionSection}>
                          <div className={styles.sectionHeader}>
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className={styles.sectionKicker}>
                              {isAr ? "موضوع وتفاصيل الطلب" : "Request Scope & Details"}
                            </span>
                          </div>
                          <div className={styles.descriptionBox}>
                            {req.description}
                          </div>
                        </div>
                      )}

                      {/* Financial & Invoice Statement Section */}
                      {req.invoiceSent && (
                        <div className={styles.financialSection}>
                          <div className={styles.sectionHeader}>
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className={styles.sectionKicker}>
                              {isAr ? "البيان المالي وعرض السعر" : "Financial Statement & Invoice"}
                            </span>
                          </div>

                          <div className={styles.financialRow}>
                            <div className={styles.priceDisplay}>
                              <span className={styles.priceLabel}>
                                {isAr ? "قيمة الفاتورة الصادرة" : "Issued Invoice Amount"}
                              </span>
                              <div className={styles.priceValue}>
                                {normalizedPrice !== null ? (
                                  <SaudiRiyalAmount
                                    amount={normalizedPrice}
                                    locale={isAr ? "ar-SA" : "en-US"}
                                  />
                                ) : (
                                  <span>—</span>
                                )}
                              </div>
                            </div>

                            <div className={styles.financialMeta}>
                              <span
                                className={`${styles.statusBadge} ${
                                  req.paymentStatus === "paid"
                                    ? styles.statusCompleted
                                    : styles.statusPending
                                }`}
                              >
                                {req.paymentStatus === "paid"
                                  ? isAr
                                    ? "تم السداد"
                                    : "Paid"
                                  : isAr
                                  ? "في انتظار السداد"
                                  : "Unpaid / Pending Payment"}
                              </span>

                              {req.clientDecision && (
                                <span
                                  className={`${styles.statusBadge} ${
                                    req.clientDecision === "accepted"
                                      ? styles.statusAccepted
                                      : req.clientDecision === "rejected"
                                      ? styles.statusRejected
                                      : styles.statusAwaitingDecision
                                  }`}
                                >
                                  {req.clientDecision === "accepted"
                                    ? isAr
                                      ? "تم قبول الفاتورة"
                                      : "Invoice Accepted"
                                    : req.clientDecision === "rejected"
                                    ? isAr
                                      ? "تم رفض الفاتورة"
                                      : "Invoice Rejected"
                                    : isAr
                                    ? "بانتظار قرار العميل"
                                    : "Awaiting Client Decision"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Wallet link notice */}
                          <div className={styles.walletNotice}>
                            <p className={styles.walletNoticeText}>
                              {isAr
                                ? "يمكنك متابعة حالة السداد وسجل الفواتير الصادرة عبر المحفظة الإلكترونية."
                                : "You can review issued invoice records and payment options through your wallet."}
                            </p>
                            <Link
                              href="/wallet?tab=invoices"
                              className={styles.walletLink}
                            >
                              <Wallet className="h-4 w-4" aria-hidden="true" />
                              <span>{isAr ? "فواتير المحفظة" : "Wallet Invoices"}</span>
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                          </div>

                          {/* Decision Controls (ONLY for legacy pending invoice by actual owner) */}
                          {canMakeDecision && (
                            <div className={styles.decisionControls}>
                              <span className={styles.decisionControlsTitle}>
                                {isAr ? "إجراءات قرار العميل بالفاتورة:" : "Client Invoice Decision:"}
                              </span>

                              <div className={styles.decisionButtonsGroup}>
                                <button
                                  type="button"
                                  onClick={() => handleDecision(req, "accepted")}
                                  disabled={Boolean(actionLoading)}
                                  className={styles.acceptButton}
                                  aria-label={
                                    isAr
                                      ? `تأكيد قبول فاتورة الطلب #${req.id.slice(0, 8)}`
                                      : `Accept invoice for request #${req.id.slice(0, 8)}`
                                  }
                                >
                                  {actionLoading === req.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                  )}
                                  <span>{isAr ? "قبول الفاتورة" : "Accept Invoice"}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDecision(req, "rejected")}
                                  disabled={Boolean(actionLoading)}
                                  className={styles.rejectButton}
                                  aria-label={
                                    isAr
                                      ? `تأكيد رفض فاتورة الطلب #${req.id.slice(0, 8)}`
                                      : `Reject invoice for request #${req.id.slice(0, 8)}`
                                  }
                                >
                                  {actionLoading === req.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                                  ) : (
                                    <XCircle className="h-4 w-4" aria-hidden="true" />
                                  )}
                                  <span>{isAr ? "رفض الفاتورة" : "Reject Invoice"}</span>
                                </button>
                              </div>

                              {actionError?.id === req.id && (
                                <div role="alert" className={styles.actionErrorBox}>
                                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                                  <span>{actionError.text}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Accessible Pagination Navigation */}
        {!isLoading && !fetchError && totalPages > 1 && (
          <nav
            className={styles.pagination}
            aria-label={isAr ? "تنقل الصفحات" : "Pagination"}
          >
            <button
              type="button"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isLoading || Boolean(actionLoading)}
              className={styles.paginationButton}
              aria-label={isAr ? "الصفحة السابقة" : "Previous page"}
            >
              {isAr ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{isAr ? "السابق" : "Previous"}</span>
            </button>

            <span className={styles.paginationInfo}>
              {isAr
                ? `صفحة ${page} من ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isLoading || Boolean(actionLoading)}
              className={styles.paginationButton}
              aria-label={isAr ? "الصفحة التالية" : "Next page"}
            >
              <span>{isAr ? "التالي" : "Next"}</span>
              {isAr ? (
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
