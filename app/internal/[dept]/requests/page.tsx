"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import SimpleChatModal from "@/components/chat/chat-modal";
import {
  canonicalDeptSlug,
  canAccessDepartment,
} from "@/lib/redesign-department-navigation";
import {
  DepartmentUser,
  DepartmentServiceRequest,
  DepartmentPriceEntry,
  validateOfferPrice,
  canManageDepartmentRequests,
  filterDepartmentRequests,
} from "@/lib/redesign-chat10-requests";
import { safeExtractParty } from "@/lib/redesign-chat10-disputes";

// ─── Department name labels ─────────────────────────────────────────────────
const DEPT_LABELS: Record<string, string> = {
  marketing: "إدارة التسويق",
  properties: "إدارة الاملاك",
  finance: "الإدارة المالية",
  financial: "الإدارة المالية",
  legal: "الإدارة القانونية",
  employees: "إدارة الموظفين",
};

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: { label: "معلق", color: "bg-muted text-foreground border-border", icon: Clock },
  assigned: { label: "محجوز", color: "bg-muted text-foreground border-border", icon: UserIcon },
  in_progress: { label: "جارٍ التنفيذ", color: "bg-muted text-foreground border-border", icon: RefreshCw },
  completed: { label: "مكتمل", color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: CheckCircle },
  cancelled: { label: "ملغى", color: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800", icon: AlertCircle },
};

// ─── Request Card ───────────────────────────────────────────────────────────
function RequestCard({
  request,
  onCommentSent,
  onOpenChat,
  deptSlug,
  canManage,
}: {
  request: DepartmentServiceRequest;
  onCommentSent: () => void;
  onOpenChat: (req: DepartmentServiceRequest) => void;
  deptSlug: string;
  canManage: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [offerNote, setOfferNote] = useState<string>("");
  const [savingOffer, setSavingOffer] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);

  const statusCfg = STATUS_LABELS[request.status] ?? STATUS_LABELS["pending"];
  const StatusIcon = statusCfg.icon;

  const canonical = canonicalDeptSlug(deptSlug) || deptSlug;
  const existingOffer: DepartmentPriceEntry | undefined =
    request.departmentPrices?.[deptSlug] || request.departmentPrices?.[canonical];

  useEffect(() => {
    if (existingOffer) {
      setOfferPrice(
        existingOffer.price !== undefined && existingOffer.price !== null
          ? String(existingOffer.price)
          : ""
      );
      setOfferNote(existingOffer.note || "");
    } else {
      setOfferPrice("");
      setOfferNote("");
    }
    setOfferError(null);
  }, [existingOffer]);

  const otherDeptOffers = useMemo(() => {
    if (!request.departmentPrices) return [];
    return Object.entries(request.departmentPrices)
      .filter(([key]) => key !== deptSlug && key !== canonical && !key.endsWith("_history"))
      .map(([key, val]) => ({
        deptKey: key,
        ...(val as DepartmentPriceEntry),
      }));
  }, [request.departmentPrices, deptSlug, canonical]);

  const handleSaveOffer = async () => {
    if (!canManage) return;
    setOfferError(null);

    const validation = validateOfferPrice(offerPrice);
    if (!validation.valid) {
      setOfferError(validation.error || "يرجى إدخال مبلغ صحيح");
      return;
    }

    setSavingOffer(true);
    try {
      await api.put(`/service-requests/${request.id}/department-price`, {
        price: validation.price,
        note: offerNote.trim() || undefined,
        deptSlug: canonical,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onCommentSent();
    } catch (err) {
      console.error("Failed to save offer:", err);
      setOfferError("فشل حفظ العرض على الخادم. يرجى المحاولة مرة أخرى.");
    } finally {
      setSavingOffer(false);
    }
  };

  const firstParty = safeExtractParty(request.firstParty);
  const secondParty = safeExtractParty(request.secondParty);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      dir="rtl"
      className="calm-panel bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full flex items-center justify-between px-5 py-4 text-right group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-center gap-4">
          <div className="calm-icon w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-black text-sm text-foreground">{request.serviceType}</p>
            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">
              {request.clientName} · {request.city} ·{" "}
              {request.createdAt ? new Date(request.createdAt).toLocaleDateString("ar-SA") : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border ${statusCfg.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-5 space-y-5">
              {/* Actions row */}
              <div className="border-b border-border pb-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {existingOffer ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        تم إرسال السعر للعميل وظهر في محفظته
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-muted text-muted-foreground border border-border">
                        بانتظار عرض سعر من القسم
                      </span>
                    )}
                    {request.clientDecision && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-muted text-foreground border border-border">
                        قرار العميل: {String(request.clientDecision).toLowerCase()}
                      </span>
                    )}
                    {!canManage && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        وضع العرض فقط (غير مصرح بتقديم عروض)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenChat(request)}
                      disabled={!request.chatRoomId}
                      className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-border"
                      title={request.chatRoomId ? "فتح المحادثة" : "العميل هو من يبدأ المحادثة"}
                    >
                      <MessageSquare className="w-4 h-4" />
                      فتح محادثة
                    </button>
                    {!request.chatRoomId && (
                      <span className="text-[10px] font-bold text-muted-foreground">
                        العميل يبدأ المحادثة
                      </span>
                    )}
                  </div>
                </div>

                {/* Other departments' offers list */}
                {otherDeptOffers.length > 0 && (
                  <div className="calm-panel bg-muted/40 border border-border rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      عروض الأسعار من الأقسام الأخرى
                    </p>
                    <div className="space-y-2">
                      {otherDeptOffers.map((off, idx) => (
                        <div
                          key={off.deptKey || idx}
                          className="calm-panel flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-card border border-border rounded-xl text-xs shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-foreground">
                                {DEPT_LABELS[off.deptKey] || off.deptKey}:{" "}
                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                  <SaudiRiyalAmount
                                    amount={off.price}
                                    locale="ar-SA"
                                    iconClassName="h-3 w-3 text-emerald-600 dark:text-emerald-400"
                                  />
                                </span>
                              </p>
                              {off.note && (
                                <p className="text-muted-foreground mt-0.5">
                                  الملاحظة: {off.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-bold">
                            {off.addedAt
                              ? new Date(off.addedAt).toLocaleDateString("ar-SA", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "سابق"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inline Offer Error Alert */}
                {offerError && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-bold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{offerError}</span>
                  </div>
                )}

                {/* Form to submit an offer */}
                <div className="calm-panel flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-muted/40 p-4 border border-border rounded-2xl">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {existingOffer
                        ? "سعر العرض المقدم للمكتب (مغلق ومقفل)"
                        : "سعر العرض الجديد (ر.س)"}
                    </p>
                    <input
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      disabled={!canManage || !!existingOffer}
                      inputMode="decimal"
                      placeholder="مثال: 250"
                      className="w-full h-11 bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 text-sm font-bold outline-none transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-65 disabled:bg-muted/50 disabled:cursor-not-allowed"
                    />
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {existingOffer
                        ? "تم إرسال السعر للعميل وأصبح جاهزاً للدفع من المحفظة."
                        : "بمجرد إرسال السعر سيتم قفله تلقائياً ولن تتمكن من تعديله مجدداً."}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {existingOffer ? "الملاحظة (مغلقة)" : "ملاحظة العرض الجديد (اختياري)"}
                    </p>
                    <input
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      disabled={!canManage || !!existingOffer}
                      placeholder="مثال: يشمل رسوم المعاملة..."
                      className="w-full h-11 bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 text-sm font-bold outline-none transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-65 disabled:bg-muted/50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!existingOffer && (
                    <button
                      type="button"
                      onClick={handleSaveOffer}
                      disabled={!canManage || savingOffer || !offerPrice.trim()}
                      className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shrink-0"
                    >
                      {savingOffer ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      إرسال العرض
                    </button>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    العميل
                  </p>
                  <p className="text-sm font-bold text-foreground">{request.clientName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    الهاتف
                  </p>
                  <p className="text-sm font-bold text-foreground text-right" dir="ltr">
                    {request.phone}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    الموقع
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {request.city}
                    {request.district ? `، ${request.district}` : ""}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    الكمية
                  </p>
                  <p className="text-sm font-bold text-foreground">{request.quantity}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    السعر
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    <SaudiRiyalAmount amount={request.price} locale="ar-SA" />
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                    رقم الطلب
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground font-mono">
                    {request.id.substring(0, 12)}…
                  </p>
                </div>
              </div>

              {/* Complete Description (kept fully accessible) */}
              {request.description && (
                <div className="p-3.5 bg-muted/50 border border-border rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                    الوصف الكامل للطلب
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {request.description}
                  </p>
                </div>
              )}

              {/* Legal parties & metadata */}
              {request.category === "legal" &&
                Boolean(request.firstParty || request.secondParty || request.metadata) && (
                  <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2.5">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      بيانات الأطراف والخدمة القانونية
                    </p>
                    {Boolean(request.firstParty) && (
                      <div className="text-xs text-foreground">
                        <span className="font-black text-muted-foreground">الطرف الأول: </span>
                        <span className="font-bold">{firstParty.name}</span>
                      </div>
                    )}
                    {Boolean(request.secondParty) && (
                      <div className="text-xs text-foreground">
                        <span className="font-black text-muted-foreground">الطرف الثاني: </span>
                        <span className="font-bold">{secondParty.name}</span>
                      </div>
                    )}
                    {request.metadata && typeof request.metadata === "object" && (
                      <div className="text-xs text-foreground">
                        <span className="font-black text-muted-foreground">النوع: </span>
                        <span className="font-bold">
                          {String(
                            (request.metadata as Record<string, unknown>).type ||
                              (request.metadata as Record<string, unknown>).serviceType ||
                              "—"
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              {success && (
                <p
                  role="status"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  تم حفظ العرض بنجاح وإرساله للعميل.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Requests Page ─────────────────────────────────────────────────────
export default function DepartmentRequests() {
  const params = useParams();
  const router = useRouter();
  const rawDept = (params?.dept as string) || "properties";
  const dept = canonicalDeptSlug(rawDept) || rawDept;

  const [requests, setRequests] = useState<DepartmentServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Chat & User state
  const [user, setUser] = useState<DepartmentUser | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [activeChatReq, setActiveChatReq] = useState<DepartmentServiceRequest | null>(null);

  const reqIdRef = useRef(0);

  // Department Authorization Check
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) {
        router.replace("/login");
        return;
      }
      const parsed: DepartmentUser = JSON.parse(stored);
      setUser(parsed);

      if (!canAccessDepartment(parsed, dept)) {
        const rawDepts = Array.isArray(parsed.departments) ? parsed.departments : [];
        const fallback = rawDepts[0] || (parsed.role === "admin" ? "properties" : "");
        if (fallback) {
          router.replace(`/internal/${canonicalDeptSlug(fallback) || fallback}/requests`);
        } else {
          router.replace("/");
        }
      }
    } catch {
      router.replace("/login");
    }
  }, [dept, router]);

  // Fetch requests with race-condition prevention and recoverable error states
  const fetchRequests = useCallback(async () => {
    const currentId = ++reqIdRef.current;
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.get(`/service-requests/by-department/${dept}`);
      if (reqIdRef.current !== currentId) return; // Stale request discarded
      const data = res?.data;
      const list = Array.isArray(data) ? data : data?.items || data?.data || [];
      setRequests(list);
    } catch (err) {
      if (reqIdRef.current !== currentId) return; // Stale error discarded
      console.error("Failed to fetch department requests:", err);
      setErrorMessage("تعذر تحميل طلبات هذا القسم حالياً. يرجى إعادة المحاولة.");
    } finally {
      if (reqIdRef.current === currentId) {
        setLoading(false);
      }
    }
  }, [dept]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenChat = (req: DepartmentServiceRequest) => {
    if (!user || !req.chatRoomId) return;
    setChatRoomId(req.chatRoomId);
    setActiveChatReq(req);
    setIsChatOpen(true);
  };

  const canManage = canManageDepartmentRequests(user, dept);

  const displayRequests = filterDepartmentRequests(
    requests,
    search,
    showOnlyMine,
    user?.id
  );

  const counts = {
    all: requests.length,
    mine: user?.id ? requests.filter((r) => r.assignedAgentId === user.id).length : 0,
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in_progress" || r.status === "inProgress").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            طلبات الخدمات
          </h1>
          <p className="text-muted-foreground text-xs font-bold">
            {DEPT_LABELS[dept] ?? dept}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnlyMine(!showOnlyMine)}
            className={`h-9 px-4 flex items-center justify-center rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-border ${
              showOnlyMine
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {showOnlyMine ? "عرض كل الطلبات" : "الطلبات المسندة لي"}
          </button>
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            aria-label="تحديث الطلبات"
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors border border-border"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "الكل", value: counts.all, color: "bg-primary text-primary-foreground" },
          { label: "معلقة", value: counts.pending, color: "bg-muted text-foreground border border-border" },
          { label: "جارية", value: counts.inProgress, color: "bg-muted text-foreground border border-border" },
          { label: "مكتملة", value: counts.completed, color: "bg-muted text-foreground border border-border" },
        ].map((chip) => (
          <div
            key={chip.label}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black ${chip.color}`}
          >
            {chip.label}
            <span className="opacity-75">{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم، نوع الخدمة، المدينة، أو الوصف..."
          className="w-full h-11 bg-card border border-border rounded-2xl pr-10 pl-4 text-sm font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
        />
      </div>

      {/* Recoverable Error Banner */}
      {errorMessage ? (
        <div
          role="alert"
          className="calm-panel p-8 rounded-2xl bg-destructive/10 border border-destructive/20 text-center space-y-4"
        >
          <div className="w-12 h-12 mx-auto rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-base text-foreground">{errorMessage}</p>
            <p className="text-xs text-muted-foreground">
              فشل الاتصال بخدمة الطلبات. يرجى التحقق من الاتصال وإعادة المحاولة.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRequests}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs gap-2 inline-flex items-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            إعادة المحاولة
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/60 rounded-2xl animate-pulse border border-border/50" />
          ))}
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="calm-panel bg-card rounded-2xl border border-border py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-2">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-black text-base text-foreground">لا توجد طلبات</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            {search || showOnlyMine
              ? "لم يتم العثور على طلبات تطابق معايير البحث المحددة."
              : "لم يتم تقديم أي طلبات جديدة في هذا القسم حتى الآن."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayRequests.map((req) => (
            <RequestCard
              canManage={canManage}
              key={req.id}
              request={req}
              onCommentSent={fetchRequests}
              onOpenChat={handleOpenChat}
              deptSlug={dept}
            />
          ))}
        </div>
      )}

      {/* Chat Modal */}
      {isChatOpen && chatRoomId && user && activeChatReq && (
        <SimpleChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          roomId={chatRoomId}
          userId={user.id || ""}
          userName={`${user.firstName || ""} ${user.lastName || ""}`.trim() || "موظف القسم"}
          readOnly={!canManage}
          otherUserName={activeChatReq.clientName}
        />
      )}
    </div>
  );
}
