"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, CheckCircle2, Send,
  User, Phone, MapPin, Calendar, Search, Filter,
  ExternalLink, Receipt, Clock, Briefcase,
  Scale, FileText, Layers, BarChart3, Settings2,
  TrendingUp, AlertCircle, CheckCircle, XCircle, Clock3, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { financialApi, bookingsApi } from "@/lib/api";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

// ─── constants ──────────────────────────────────────────────────────────────

const DISPUTE_TYPES = ["dispute", "notary", "deedUpdate", "منازعة عقارية", "منازعة قانونية", "منازعة قانوية"];
const CONTRACT_TYPES = ["contracts", "consultation", "مراجعة عقد", "توثيق"];
const SERVICE_TYPES = ["notary", "deedUpdate", "dispute", "contracts", "consultation"];

const departments = [
  { id: "real_estate", key: "admin.trans.dept.real_estate" },
  { id: "marketing",   key: "admin.trans.dept.marketing"   },
  { id: "legal",       key: "admin.trans.dept.legal"       },
  { id: "finance",     key: "admin.trans.dept.finance"     },
];

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-muted text-slate-700",
  assigned:     "bg-muted text-slate-700",
  in_progress:  "bg-muted text-slate-700",
  completed:    "bg-muted text-slate-700",
  cancelled:    "bg-muted text-slate-700",
  invoice_sent: "bg-muted text-slate-700",
  accepted:     "bg-muted text-slate-700",
  rejected:     "bg-muted text-slate-700",
};

// ─── helpers ────────────────────────────────────────────────────────────────

function filterRequests(all: any, tab: string) {
  const items = Array.isArray(all)
    ? all
    : all && typeof all === "object" && Array.isArray(all.items)
    ? all.items
    : [];

  switch (tab) {
    case "all":
      return items.filter(
        (r: any) => r.category === "legal" || r.targetDepartment === "legal"
      );
    case "disputes":
      return items.filter(
        (r: any) => (r.category === "legal" || (r.category === "other" && r.targetDepartment === "legal")) && 
               (DISPUTE_TYPES.includes(r.serviceType) || r.serviceType?.includes("منازعة"))
      );
    case "contracts":
      return items.filter(
        (r: any) => (r.category === "legal" || (r.category === "other" && r.targetDepartment === "legal")) && 
               CONTRACT_TYPES.includes(r.serviceType)
      );
    case "services":
      return items.filter((r: any) => r.category === "legal");
    case "other":
      return items.filter(
        (r: any) => r.category === "other" && 
               r.targetDepartment === "legal" && 
               !DISPUTE_TYPES.includes(r.serviceType) && 
               !r.serviceType?.includes("منازعة") &&
               !CONTRACT_TYPES.includes(r.serviceType)
      );
    default:
      return items;
  }
}

// ─── stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border shadow-sm p-5 flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── request row ────────────────────────────────────────────────────────────

function RequestRow({
  req,
  language,
  onOpen,
  t,
}: {
  req: any;
  language: string;
  onOpen: (req: any) => void;
  t: (k: string) => string;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border-b border hover:bg-muted/50 transition-colors group"
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{req.clientName}</p>
            <p className="text-[11px] text-slate-400 font-medium" dir="ltr">{req.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant="outline" className="font-bold text-[10px]">
          {req.serviceType}
        </Badge>
      </td>
      <td className="px-6 py-4">
        {(() => {
          let statusKey = req.status;
          let label = t(`legal.status.${req.status}`) || req.status;

          if (req.category === 'legal' || req.targetDepartment === 'legal' || req.targetDepartment === 'marketing') {
            if (req.clientDecision === 'accepted') {
              statusKey = 'accepted';
              label = t('legal.decision.accepted');
            } else if (req.clientDecision === 'rejected') {
              statusKey = 'rejected';
              label = t('legal.decision.rejected');
            } else if (req.invoiceSent) {
              statusKey = 'invoice_sent';
              label = t('legal.invoice.sent');
            }
          }

          return (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${STATUS_STYLES[statusKey] || "bg-muted text-slate-500"}`}>
              {label}
            </span>
          );
        })()}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">
            {format(new Date(req.createdAt), "dd MMM yyyy", {
              locale: language === "ar" ? ar : enUS,
            })}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onOpen(req)}
          className="p-2 rounded-xl border border hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </td>
    </motion.tr>
  );
}

// ─── table ──────────────────────────────────────────────────────────────────

function RequestsTable({
  items,
  isLoading,
  language,
  onOpen,
  t,
}: {
  items: any[];
  isLoading: boolean;
  language: string;
  onOpen: (req: any) => void;
  t: (k: string) => string;
}) {
  const [search, setSearch] = useState("");
  const filtered = items.filter(
    (r) =>
      r.clientName?.toLowerCase().includes(search.toLowerCase()) ||
      r.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.legal.search_placeholder")}
            className="w-full bg-card border border py-3 pr-11 pl-5 text-sm font-bold rounded-2xl outline-none focus:border-slate-900 transition-all"
          />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border shadow-sm overflow-hidden min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-4 border border-t-slate-900 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {t("common.loading")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
            <div className="p-6 rounded-2xl bg-muted">
              <Scale className="w-12 h-12 text-slate-200" />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {t("admin.service_requests.no_data")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-muted/60 border-b border">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("admin.legal.headers.parties")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("admin.legal.headers.type")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("admin.legal.headers.status")}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t("admin.legal.headers.actions")}
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    language={language}
                    onOpen={onOpen}
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ──────────────────────────────────────────────────────────────

export default function LegalAdminPage({ embedded = false }: { embedded?: boolean } = {}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { token } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [activeTab, setActiveTab]   = useState("dashboard");

  // details dialog
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen]     = useState(false);
  const [editingPrice, setEditingPrice]       = useState("");
  const [editingDepartment, setEditingDepartment] = useState("");
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [isAccepting, setIsAccepting]         = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [invoicePrice, setInvoicePrice]       = useState("");
  const [invoiceMessage, setInvoiceMessage]   = useState<{ type: "success" | "error"; text: string } | null>(null);

  // related info
  const [userBookings, setUserBookings]   = useState<any[]>([]);
  const [userInvoices, setUserInvoices]   = useState<any[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // ── fetch all requests ──────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests?page=1&limit=500`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && Array.isArray(data.items)) {
          setRequests(data.items);
        } else if (Array.isArray(data)) {
          setRequests(data);
        } else {
          setRequests([]);
        }
      }
    } catch (err) {
      console.error("fetch requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── fetch related info ──────────────────────────────────────────────────
  const fetchRelated = useCallback(
    async (userId: string) => {
      if (!userId || !token) return;
      setIsLoadingRelated(true);
      try {
        const [b, i] = await Promise.all([
          bookingsApi.getUserBookings(userId),
          financialApi.getUserInvoices(userId),
        ]);
        setUserBookings(b.data || []);
        setUserInvoices(i.data || []);
      } catch {
        setUserBookings([]);
        setUserInvoices([]);
      } finally {
        setIsLoadingRelated(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (isDetailsOpen && selectedRequest?.userId) {
      fetchRelated(selectedRequest.userId);
    } else {
      setUserBookings([]);
      setUserInvoices([]);
    }
  }, [isDetailsOpen, selectedRequest, fetchRelated]);

  // ── open detail ──────────────────────────────────────────────────────────
  const openDetail = (req: any) => {
    setSelectedRequest(req);
    setEditingPrice(req.price?.toString() || "0");
    setEditingDepartment(req.targetDepartment || "legal");
    setInvoiceMessage(null);
    setInvoicePrice("");
    setIsDetailsOpen(true);
  };

  // ── save price / dept ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token || !selectedRequest) return;
    setIsUpdatingPrice(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            price: parseFloat(editingPrice),
            targetDepartment: editingDepartment,
          }),
        }
      );
      fetchRequests();
      setIsDetailsOpen(false);
    } catch (err) {
      console.error("save:", err);
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // ── accept ───────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!token || !selectedRequest) return;
    setIsAccepting(true);
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/accept`,
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
      setIsDetailsOpen(false);
    } catch (err) {
      console.error("accept:", err);
    } finally {
      setIsAccepting(false);
    }
  };

  // ── send invoice ─────────────────────────────────────────────────────────
  const handleSendInvoice = async () => {
    if (!token || !selectedRequest || !invoicePrice) return;
    setIsSendingInvoice(true);
    setInvoiceMessage(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/send-invoice`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price: parseFloat(invoicePrice) }),
        }
      );
      if (res.ok) {
        toast.success(t("legal.invoice.sendSuccess"));
        fetchRequests();
        setInvoicePrice("");
        setIsDetailsOpen(false);
      } else {
        toast.error(t("legal.invoice.sendError"));
      }
    } catch {
      toast.error(t("legal.invoice.sendError"));
    } finally {
      setIsSendingInvoice(false);
    }
  };

  const handleOpenChat = async () => {
    if (!token || !selectedRequest) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/chat`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to open chat");
      const data = await res.json();
      router.push(`/chat/${data.chatRoomId}`);
    } catch {
      toast.error("تعذر فتح محادثة الطلب");
    }
  };

  // ── derived stats ────────────────────────────────────────────────────────
  const allLegal    = filterRequests(requests, "all");
  const disputes    = filterRequests(requests, "disputes");
  const contracts   = filterRequests(requests, "contracts");
  const services    = filterRequests(requests, "services");
  const other       = filterRequests(requests, "other");
  const pending     = allLegal.filter((r: any) => r.status === "pending").length;
  const completed   = allLegal.filter((r: any) => r.status === "completed").length;

  // ── tab meta ─────────────────────────────────────────────────────────────
  const tabs = [
    { id: "dashboard", label: t("admin.legal.dashboard"), icon: BarChart3  },
    { id: "all",       label: t("admin.legal.all"),       icon: Layers     },
    { id: "disputes",  label: t("admin.legal.disputes"),  icon: Scale      },
    { id: "contracts", label: t("admin.legal.contracts"), icon: FileText   },
    { id: "services",  label: t("admin.legal.services"),  icon: Settings2  },
    { id: "legal_services_manage", label: language === "ar" ? "خدمات قانونية" : "Legal Services", icon: ShieldAlert },
    { id: "other",     label: t("admin.legal.other"),     icon: Briefcase  },
  ];

  const legalServiceTabs = [
    { id: "legal-services", href: "/admin/services?type=legal", icon: ShieldAlert, label: language === "ar" ? "الخدمات القانونية" : "Legal Services" },
    { id: "legal-disputes-services", href: "/admin/services?type=legal_disputes", icon: Scale, label: language === "ar" ? "القانونية: المنازعات" : "Legal: Disputes" },
    { id: "legal-contracts-services", href: "/admin/services?type=legal_contracts", icon: FileText, label: language === "ar" ? "القانونية: العقود" : "Legal: Contracts" },
    { id: "legal-documentation-services", href: "/admin/services?type=legal_documentation", icon: ShieldAlert, label: language === "ar" ? "القانونية: التوثيق" : "Legal: Documentation" },
    { id: "legal-other-services", href: "/admin/services?type=legal_other", icon: Briefcase, label: language === "ar" ? "القانونية: أخرى" : "Legal: Other" },
  ];

  // ── tabbed data ──────────────────────────────────────────────────────────
  const tabData: Record<string, any[]> = {
    all: allLegal, disputes, contracts, services, other,
  };

  const shellClass = embedded
    ? "space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
    : "max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700";

  return (
    <div className={shellClass} dir={language === "ar" ? "rtl" : "ltr"}>
      {!embedded && (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {t('pm.legal')}
                </h1>
                <p className="text-slate-400 text-xs font-bold mt-0.5">
                  {t('admin.legal.desc')}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {t('common.refresh')}
          </button>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('admin.legal.desc')}
            </p>
            <h2 className="text-lg font-black text-slate-950">{t('pm.legal')}</h2>
          </div>
          <button
            onClick={fetchRequests}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
            {t('common.refresh')}
          </button>
        </div>
      )}

      {/* ── Tab Bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-muted p-1.5 rounded-2xl w-full overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all flex-1 justify-center ${
                isActive
                  ? "bg-card text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard label={t("admin.legal.all")}       value={allLegal.length}   icon={Layers}   color="bg-muted text-slate-700" />
              <StatCard label={t("admin.legal.disputes_short")}           value={disputes.length}   icon={Scale}    color="bg-muted text-slate-700" />
              <StatCard label={t("admin.legal.contracts_short")}             value={contracts.length}  icon={FileText} color="bg-muted text-slate-700"   />
              <StatCard label={t("admin.legal.services_short")}      value={services.length}   icon={Settings2} color="bg-muted text-slate-700" />
              <StatCard label={t("status.pending")}               value={pending}           icon={Clock3}   color="bg-muted text-slate-700"   />
              <StatCard label={t("status.completed")}              value={completed}         icon={CheckCircle} color="bg-muted text-slate-700" />
            </div>

            {/* Recent Legal Requests */}
            <div className="bg-card rounded-2xl border border shadow-sm p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                {t('admin.legal.recent_requests')}
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                </div>
              ) : allLegal.length === 0 ? (
                <div className="text-center py-12 opacity-40">
                  <Scale className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">{t('common.noData')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allLegal.slice(0, 5).map((req: any) => (
                    <div
                      key={req.id}
                      onClick={() => openDetail(req)}
                      className="flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-muted transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center shadow-sm">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{req.clientName}</p>
                          <p className="text-[10px] font-bold text-slate-400">{req.serviceType}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${STATUS_STYLES[req.status] || "bg-muted"}`}>
                          {req.status}
                        </span>
                        <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "legal_services_manage" && (
          <motion.div
            key="legal_services_manage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border bg-card p-5 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
              {legalServiceTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border bg-muted px-4 py-3 text-center text-[11px] font-black uppercase tracking-widest text-slate-600 transition-all hover:border-slate-950 hover:bg-slate-950 hover:text-white"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* List tabs: all / disputes / contracts / services / other */}
        {activeTab !== "dashboard" && activeTab !== "legal_services_manage" && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <RequestsTable
              items={tabData[activeTab] ?? []}
              isLoading={isLoading}
              language={language}
              onOpen={openDetail}
              t={t}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Details Dialog ───────────────────────────────────────────────── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">
              {t("admin.service_requests.details_title")}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.serviceType} – {selectedRequest?.clientName}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="py-4">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted p-1 rounded-xl h-auto">
                  <TabsTrigger value="details"  className="py-2 rounded-lg font-bold">{t("common.details")}</TabsTrigger>
                  <TabsTrigger value="visits"   className="py-2 rounded-lg font-bold">{t("admin.service_requests.customer_visits")}</TabsTrigger>
                  <TabsTrigger value="invoices" className="py-2 rounded-lg font-bold">{t("admin.service_requests.customer_invoices")}</TabsTrigger>
                </TabsList>

                {/* ── Details tab ──────────────────────────────────────── */}
                <TabsContent value="details" className="space-y-6">
                  {/* Client card */}
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center shadow-sm">
                      <User className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{selectedRequest.clientName}</p>
                      <p className="text-xs font-bold text-slate-400" dir="ltr">{selectedRequest.phone}</p>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: t("admin.service_requests.service_type"), value: selectedRequest.serviceType },
                      { label: t("admin.service_requests.target_dept"),  value: t(`admin.trans.dept.${selectedRequest.targetDepartment}`) },
                      { label: t("admin.service_requests.location_info"),value: `${selectedRequest.city} – ${selectedRequest.district}` },
                      { label: t("admin.service_requests.quantity"),      value: selectedRequest.quantity },
                    ].map(({ label, value }) => (
                      <div key={label} className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
                        <p className="text-sm font-bold text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Department selector */}
                  <div className="space-y-2 pt-4 border-t border">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t("admin.service_requests.target_dept")} (Admin)
                    </label>
                    <select
                      value={editingDepartment}
                      onChange={(e) => setEditingDepartment(e.target.value)}
                      className="w-full bg-muted border border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all appearance-none"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{t(d.key)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Legal party info */}
                  {selectedRequest.category === "legal" &&
                    (selectedRequest.firstParty || selectedRequest.secondParty || selectedRequest.metadata) && (
                      <div className="space-y-4 pt-4 border-t border">
                        {selectedRequest.firstParty && (
                          <div className="p-4 bg-muted rounded-xl border border">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                             {t('legal.party.first')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">الاسم</p>
                                <p className="text-xs font-bold text-slate-900">{selectedRequest.firstParty.name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">الهوية</p>
                                <p className="text-xs font-bold text-slate-900">{selectedRequest.firstParty.idNumber}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedRequest.secondParty && (
                          <div className="p-4 bg-muted rounded-xl border border">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                               {t('legal.party.second')}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">الاسم</p>
                                <p className="text-xs font-bold text-slate-900">{selectedRequest.secondParty.name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase">الهوية</p>
                                <p className="text-xs font-bold text-slate-900">{selectedRequest.secondParty.idNumber}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {selectedRequest.description && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.service_requests.description")}</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed bg-muted p-3 rounded-xl">{selectedRequest.description}</p>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Price & Save */}
                  <div className="space-y-3 pt-4 border-t border">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {t("admin.service_requests.price")}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={editingPrice}
                        onChange={(e) => setEditingPrice(e.target.value)}
                        className="bg-muted border border py-3 px-4 text-sm font-bold w-full outline-none focus:border-slate-900 rounded-xl transition-all"
                        placeholder="0.00"
                      />
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleSave}
                          disabled={isUpdatingPrice}
                          className="bg-slate-900 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                        >
                          <Save className="w-4 h-4" />
                          {t("admin.service_requests.save_changes")}
                        </button>
                        {!selectedRequest.adminAccepted &&
                          ["postPurchase", "other"].includes(selectedRequest.category) && (
                            <button
                              onClick={handleAccept}
                              disabled={isAccepting}
                              className="bg-slate-950 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                            >
                              {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              {t("admin.service_requests.accept_forward")}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Legal Invoice */}
                  {selectedRequest.category === "legal" && (
                    <div className="space-y-4 pt-4 border-t-2 border-blue-100" dir="ltr">
                      <div className="flex items-center justify-between"dir="rtl">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          ⚖️ {t("legal.invoice.sendBtn")}
                        </label>
                        {selectedRequest.invoiceSent ? (
                          <span className="bg-muted text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">
                            ✓ {t("legal.invoice.sent")}
                          </span>
                        ) : (
                          <span className="bg-muted text-slate-700 text-[10px] font-black px-3 py-1 rounded-full">
                            ⏳ {t("legal.invoice.notSent")}
                          </span>
                        )}
                      </div>

                      {selectedRequest.clientDecision && selectedRequest.clientDecision !== "pending" && (
                        <div className="space-y-3">
                          <div className={`p-4 rounded-2xl text-xs font-black flex items-center justify-between ${
                            selectedRequest.clientDecision === "accepted"
                              ? "bg-muted text-slate-700 border border"
                              : "bg-muted text-slate-700 border border"
                          }`}>
                            <div className="flex items-center gap-2">
                              {selectedRequest.clientDecision === "accepted" ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span>
                                {selectedRequest.clientDecision === "accepted"
                                  ? t("legal.decision.accepted")
                                  : t("legal.decision.rejected")}
                              </span>
                            </div>

                            {selectedRequest.clientDecision === "accepted" && (
                              <div className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                                selectedRequest.paymentStatus === "paid"
                                  ? "bg-slate-950 text-white border-slate-950"
                                  : "bg-muted text-slate-700 border"
                              }`}>
                                <Receipt className="w-3 h-3" />
                                <span className="text-[10px] uppercase">
                                  {selectedRequest.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {!selectedRequest.invoiceSent && (
                        <div className="flex gap-3">
                          <input
                            type="number"
                            value={invoicePrice}
                            onChange={(e) => setInvoicePrice(e.target.value)}
                            placeholder={t("legal.invoice.price")}
                            className="bg-muted border border py-3 px-4 text-sm font-bold w-full outline-none focus:border-slate-500 rounded-xl transition-all"
                          />
                          <button
                            onClick={handleSendInvoice}
                            disabled={isSendingInvoice || !invoicePrice}
                            className="bg-slate-950 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                          >
                            {isSendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {t("legal.invoice.sendBtn")}
                          </button>
                        </div>
                      )}

                      {invoiceMessage && (
                        <p className={`text-xs font-bold ${invoiceMessage.type === "success" ? "text-slate-700" : "text-slate-500"}`}>
                          {invoiceMessage.text}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {t("admin.service_requests.date")}:{" "}
                        {format(new Date(selectedRequest.createdAt), "dd MMMM yyyy – hh:mm a", {
                          locale: language === "ar" ? ar : enUS,
                        })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-700 hover:bg-muted"
                    >
                      <Send className="h-4 w-4" />
                      فتح الشات
                    </button>
                  </div>
                </TabsContent>

                {/* ── Visits tab ───────────────────────────────────────── */}
                <TabsContent value="visits" className="space-y-4">
                  {isLoadingRelated ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                  ) : userBookings.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {userBookings.map((booking: any) => (
                        <div key={booking.id} className="p-4 bg-muted rounded-xl border border">
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="bg-card">{booking.type}</Badge>
                            <span className="text-xs text-slate-400 font-medium">
                              {format(new Date(booking.createdAt), "dd/MM/yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {booking.visitDate
                              ? format(new Date(booking.visitDate), "dd MMM – hh:mm a", { locale: language === "ar" ? ar : enUS })
                              : "Pending"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2 opacity-40">
                      <Calendar className="w-8 h-8" />
                      <p className="text-xs font-bold">{t("admin.service_requests.no_visits")}</p>
                    </div>
                  )}
                </TabsContent>

                {/* ── Invoices tab ─────────────────────────────────────── */}
                <TabsContent value="invoices" className="space-y-4">
                  {isLoadingRelated ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
                    </div>
                  ) : userInvoices.length > 0 ? (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {userInvoices.map((inv: any) => (
                        <div key={inv.id} className="p-4 bg-muted rounded-xl border border flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Receipt className="w-4 h-4 text-slate-400" />
                              <span className="font-bold text-slate-900 text-sm">
                                #{inv.invoiceNumber || inv.id.substring(0, 8)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {format(new Date(inv.createdAt), "dd MMMM yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-slate-900"><SaudiRiyalAmount amount={inv.amount} locale="ar-SA" /></p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === "paid" ? "bg-muted text-slate-700" : "bg-muted text-slate-700"
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2 opacity-40">
                      <Receipt className="w-8 h-8" />
                      <p className="text-xs font-bold">{t("admin.service_requests.no_invoices")}</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
