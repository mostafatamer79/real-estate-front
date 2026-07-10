"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Phone,
  MapPin,
  Tag,
  Send,
  RefreshCw,
  Search,
} from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

import SimpleChatModal from "@/components/chat/chat-modal";

// ─── Department name labels ─────────────────────────────────────────────────
const DEPT_LABELS: Record<string, string> = {
  marketing: 'إدارة التسويق',
  properties: 'إدارة الاملاك',
  finance: 'الإدارة المالية',
  legal: 'الإدارة القانونية',
  employees: 'إدارة الموظفين',
};

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'معلق', color: 'bg-muted text-slate-700 border', icon: Clock },
  assigned: { label: 'محجوز', color: 'bg-muted text-slate-700 border', icon: UserIcon },
  in_progress: { label: 'جارٍ التنفيذ', color: 'bg-muted text-slate-700 border', icon: RefreshCw },
  completed: { label: 'مكتمل', color: 'bg-muted text-slate-700 border', icon: CheckCircle },
  cancelled: { label: 'ملغى', color: 'bg-muted text-slate-700 border', icon: AlertCircle },
};

interface ServiceRequest {
  id: string;
  userId?: string;
  clientName: string;
  phone: string;
  city: string;
  district: string;
  serviceType: string;
  category: string;
  status: string;
  description?: string;
  createdAt: string;
  quantity: number;
  price: number;
  invoiceSent?: boolean;
  invoicePrice?: number | null;
  clientDecision?: string | null;
  invoiceNumber?: string | null;
  firstParty?: any;
  secondParty?: any;
  metadata?: any;
  departmentPrices?: Record<string, { price: number; addedBy: string; note?: string; addedAt: string }>;
  chatRoomId?: string | null;
  user?: { id: string; firstName?: string; lastName?: string; email?: string };
  adminComment?: string;
}

// ─── Request Card ───────────────────────────────────────────────────────────
function RequestCard({ 
  request, 
  onCommentSent,
  onOpenChat,
  deptSlug,
}: { 
  request: ServiceRequest; 
  onCommentSent: () => void;
  onOpenChat: (req: ServiceRequest) => void;
  deptSlug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offerPrice, setOfferPrice] = useState<string>("");
  const [offerNote, setOfferNote] = useState<string>("");
  const [savingOffer, setSavingOffer] = useState(false);

  const statusCfg = STATUS_LABELS[request.status] ?? STATUS_LABELS['pending'];
  const StatusIcon = statusCfg.icon;

  const parseLocaleNumber = (value: string) => {
    const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
    const easternArabicIndic = "۰۱۲۳۴۵۶۷۸۹";
    const normalized = (value || "")
      .trim()
      .replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)))
      .replace(/[۰-۹]/g, (d) => String(easternArabicIndic.indexOf(d)))
      .replace(/,/g, "."); // just in case
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  };

  const existingOffer = request.departmentPrices?.[deptSlug];

  useEffect(() => {
    if (existingOffer) {
      setOfferPrice(existingOffer.price ? String(existingOffer.price) : "");
      setOfferNote(existingOffer.note || "");
    } else {
      setOfferPrice("");
      setOfferNote("");
    }
  }, [existingOffer]);

  const otherDeptOffers = React.useMemo(() => {
    if (!request.departmentPrices) return [];
    return Object.entries(request.departmentPrices)
      .filter(([key]) => key !== deptSlug && !key.endsWith('_history'))
      .map(([key, val]: [string, any]) => ({
        deptKey: key,
        ...val
      }));
  }, [request.departmentPrices, deptSlug]);

  const handleSaveOffer = async () => {
    const numericPrice = parseLocaleNumber(offerPrice);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("يرجى إدخال سعر صحيح (: 250)");
      return;
    }
    setSavingOffer(true);
    try {
      await api.put(`/service-requests/${request.id}/department-price`, { price: numericPrice, note: offerNote || undefined, deptSlug });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
      onCommentSent();
    } catch (err) {
      console.error(err);
      alert('فشل حفظ العرض، حاول لاحقاً');
    } finally {
      setSavingOffer(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      dir="rtl"
      className="bg-card rounded-2xl border border overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-right group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="font-black text-sm text-slate-950">{request.serviceType}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              {request.clientName} · {request.city} · {new Date(request.createdAt).toLocaleDateString('ar-SA')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black border ${statusCfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {statusCfg.label}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border px-5 py-5 space-y-5">
              {/* Actions row */}
              <div className="border-b border pb-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {existingOffer ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        تم تقديم عرض سعر القسم وهو مقفل ومؤكد
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-muted text-slate-700 border border">
                        بانتظار عرض سعر من القسم
                      </span>
                    )}
                    {request.clientDecision && (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black bg-muted text-slate-700 border border">
                        قرار العميل: {String(request.clientDecision).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(request)}
                      disabled={!request.chatRoomId}
                      className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted text-slate-700 rounded-xl text-xs font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title={request.chatRoomId ? "فتح المحادثة" : "العميل هو من يبدأ المحادثة"}
                    >
                      <MessageSquare className="w-4 h-4" />
                      فتح محادثة
                    </button>
                    {!request.chatRoomId && (
                      <span className="text-[10px] font-bold text-slate-400">العميل يبدأ المحادثة</span>
                    )}
                  </div>
                </div>

                {/* Other departments' offers list */}
                {otherDeptOffers.length > 0 && (
                  <div className="bg-muted border border rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      عروض الأسعار من الأقسام الأخرى
                    </p>
                    <div className="space-y-2">
                      {otherDeptOffers.map((off: any, idx: number) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-card border border rounded-xl text-xs text-slate-600 shadow-sm">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-muted text-slate-500 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-bold text-slate-900">
                                {DEPT_LABELS[off.deptKey] || off.deptKey}: <span className="font-black text-emerald-600"><SaudiRiyalAmount amount={off.price} locale="ar-SA" iconClassName="h-3 w-3 text-emerald-600" /></span>
                              </p>
                              {off.note && (
                                <p className="text-slate-400 mt-0.5">الملاحظة: {off.note}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {off.addedAt ? new Date(off.addedAt).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'سابق'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Form to submit an offer */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end bg-muted p-4 border border rounded-2xl">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {existingOffer ? "سعر العرض المقدم للمكتب (مغلق ومقفل)" : "سعر العرض الجديد"}
                    </p>
                    <input
                      value={offerPrice}
                      onChange={(e) => setOfferPrice(e.target.value)}
                      disabled={!!existingOffer}
                      inputMode="decimal"
                      placeholder=": 250"
                      className="w-full h-11 bg-card border border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all text-slate-700 placeholder:text-slate-300 disabled:opacity-65 disabled:bg-muted/50 disabled:cursor-not-allowed"
                    />
                    <p className="text-[10px] font-bold text-slate-400">
                      {existingOffer ? "تم تقديم عرض القسم مسبقاً وقفله بنجاح." : "بمجرد تقديم هذا العرض سيتم قفله تلقائياً ولن تتمكن من تعديله مجدداً."}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {existingOffer ? "الملاحظة (مغلقة)" : "ملاحظة العرض الجديد (اختياري)"}
                    </p>
                    <input
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      disabled={!!existingOffer}
                      placeholder=": يشمل رسوم المعاملة..."
                      className="w-full h-11 bg-card border border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all text-slate-700 placeholder:text-slate-300 disabled:opacity-65 disabled:bg-muted/50 disabled:cursor-not-allowed"
                    />
                  </div>
                  {!existingOffer && (
                    <button
                      onClick={handleSaveOffer}
                      disabled={savingOffer || !offerPrice.trim()}
                      className="h-11 px-5 rounded-xl bg-slate-950 text-white text-xs font-black hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {savingOffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      إرسال العرض
                    </button>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">العميل</p>
                  <p className="text-sm font-bold text-slate-700">{request.clientName}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهاتف</p>
                  <p className="text-sm font-bold text-slate-700 dir-ltr text-right" dir="ltr">{request.phone}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الموقع</p>
                  <p className="text-sm font-bold text-slate-700">{request.city}، {request.district}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الكمية</p>
                  <p className="text-sm font-bold text-slate-700">{request.quantity}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">السعر</p>
                  <p className="text-sm font-bold text-slate-700"><SaudiRiyalAmount amount={request.price} locale="ar-SA" /></p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">رقم الطلب</p>
                  <p className="text-[10px] font-bold text-slate-400 font-mono">{request.id.substring(0, 12)}…</p>
                </div>
              </div>

              {/* Description */}
              {request.description && (
                <div className="p-3 bg-muted rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">الوصف</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{request.description}</p>
                </div>
              )}

              {/* Legal parties (more details) */}
              {(request.category === "legal") && (request.firstParty || request.secondParty || request.metadata) && (
                <div className="p-4 bg-muted rounded-2xl space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تفاصيل إضافية</p>
                  {request.firstParty && (
                    <div className="text-sm text-slate-700">
                      <span className="font-black">الطرف الأول: </span>
                      <span className="font-bold">{request.firstParty?.name || "-"}</span>
                    </div>
                  )}
                  {request.secondParty && (
                    <div className="text-sm text-slate-700">
                      <span className="font-black">الطرف الثاني: </span>
                      <span className="font-bold">{request.secondParty?.name || "-"}</span>
                    </div>
                  )}
                  {request.metadata?.type && (
                    <div className="text-sm text-slate-700">
                      <span className="font-black">النوع: </span>
                      <span className="font-bold">{String(request.metadata.type)}</span>
                    </div>
                  )}
                </div>
              )}

              {success && (
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" />
                  تم حفظ العرض بنجاح
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
  const dept = params.dept as string;
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Chat state
  const [user, setUser] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [activeChatReq, setActiveChatReq] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      window.location.href = '/login';
      return;
    }
    const parsed = JSON.parse(stored);
    setUser(parsed);

    const departments = Array.isArray(parsed.departments) ? parsed.departments : [];
    const role = parsed.role;
    const allowedByRole: Record<string, string[]> = {
      admin: ['marketing', 'properties', 'finance', 'legal', 'employees'],
      marketing: ['marketing'],
      marketing_admin: ['marketing'],
      finance: ['finance'],
      finance_admin: ['finance'],
      legal: ['legal'],
      legal_admin: ['legal'],
      user: ['properties'],
      broker: ['properties'],
      agent: ['properties'],
      owner: ['properties'],
    };
    const allowed = new Set([...(allowedByRole[role] || []), ...departments]);
    if (!allowed.has(dept)) {
      const fallback = departments[0] || (role === 'admin' ? 'marketing' : 'properties');
      window.location.href = `/internal/${fallback}`;
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Don't block fetching on `user` state; it may not be set on first render.
      // Auth is handled by the API client (token) and the backend.
      const res = await api.get(`/service-requests/by-department/${dept}`);
      const data = res.data;
      setRequests(Array.isArray(data) ? data : (data?.items || data?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dept]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleOpenChat = async (req: ServiceRequest) => {
    if (!user) return;
    if (!req.chatRoomId) return; // Client must start it first
    setChatRoomId(req.chatRoomId);
    setActiveChatReq(req);
    setIsChatOpen(true);
  };

  const filtered = requests.filter(r =>
    r.clientName.toLowerCase().includes(search.toLowerCase()) ||
    r.serviceType.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-950">طلبات الخدمات</h1>
          <p className="text-slate-400 text-xs font-bold">{DEPT_LABELS[dept] ?? dept}</p>
        </div>
        <button
          onClick={fetchRequests}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted hover:bg-muted transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'الكل', value: counts.all, color: 'bg-slate-950 text-white' },
          { label: 'معلقة', value: counts.pending, color: 'bg-muted text-slate-700' },
          { label: 'جارية', value: counts.inProgress, color: 'bg-muted text-slate-700' },
          { label: 'مكتملة', value: counts.completed, color: 'bg-muted text-slate-700' },
        ].map(chip => (
          <div key={chip.label} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-black ${chip.color}`}>
            {chip.label}
            <span className="opacity-70">{chip.value}</span>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم، الخدمة، أو المدينة..."
          className="w-full h-11 bg-card border border rounded-2xl pr-10 pl-4 text-sm font-bold outline-none focus:border-slate-950 transition-all"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border py-20 flex flex-col items-center gap-4 opacity-30">
          <MessageSquare className="w-12 h-12 text-slate-400" />
          <p className="font-black text-sm text-slate-500">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestCard 
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
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
          otherUserName={activeChatReq.clientName}
        />
      )}

      {/* Chat is opened only if the client already started it */}
    </div>
  );
}
