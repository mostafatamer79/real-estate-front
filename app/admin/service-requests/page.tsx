"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Loader2, Save, CheckCircle2,
  MapPin, User, Phone, 
  Send, Briefcase,
  Calendar,
  ExternalLink,
  Search, Filter, Receipt, Clock,
  MessageSquare
} from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const departments = [
  { id: 'real_estate', key: 'admin.trans.dept.real_estate' },
  { id: 'marketing', key: 'admin.trans.dept.marketing' },
  { id: 'legal', key: 'admin.trans.dept.legal' },
  { id: 'finance', key: 'admin.trans.dept.finance' },
];

const STATUS_STYLES: Record<string, string> = {
  pending:      "bg-slate-100 text-slate-600",
  assigned:     "bg-slate-100 text-slate-600",
  in_progress:  "bg-slate-100 text-slate-600",
  completed:    "bg-slate-900 text-white",
  cancelled:    "bg-slate-50 text-slate-400",
  invoice_sent: "bg-slate-100 text-slate-600",
  accepted:     "bg-slate-900 text-white",
  rejected:     "bg-slate-50 text-slate-400",
};

export default function ServiceRequestsPage() {
    const { t, language } = useLanguage();
    const { token } = useAuth();
    const router = useRouter();
    const isRtl = language === 'ar';

    const handleOpenChat = async (targetUserId: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/direct`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/chat/${data.id}`);
            } else {
                toast.error(isRtl ? "فشل فتح المحادثة" : "Failed to open chat");
            }
        } catch (error) {
            console.error(error);
            toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
        }
    };
    

    // List View State
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(false);
    const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isSendingInvoice, setIsSendingInvoice] = useState(false);
    const [invoicePrice, setInvoicePrice] = useState("");
    const [invoiceMessage, setInvoiceMessage] = useState<{type:'success'|'error', text:string} | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [departmentFilter, setDepartmentFilter] = useState("all");
    const [decisionFilter, setDecisionFilter] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [editingPrice, setEditingPrice] = useState<string>("");
    const [editingDepartment, setEditingDepartment] = useState<string>("");

    // Related Info State
    const [userBookings, setUserBookings] = useState<any[]>([]);
    const [userInvoices, setUserInvoices] = useState<any[]>([]);
    const [isLoadingRelated, setIsLoadingRelated] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setIsLoadingRequests(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests?page=1&limit=500`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            if (response.ok) {
                const data = await response.json();
                // Handle both paginated response { items: [], total: 0 } and direct array
                if (data && typeof data === 'object' && Array.isArray(data.items)) {
                    setRequests(data.items);
                } else if (Array.isArray(data)) {
                    setRequests(data);
                } else {
                    setRequests([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
        } finally {
            setIsLoadingRequests(false);
        }
    }, [token]);

    const fetchRelatedInfo = useCallback(async (userId: string) => {
        if (!userId || !token) return;
        setIsLoadingRelated(true);
        try {
            const [bookingsRes, invoicesRes] = await Promise.all([
                bookingsApi.getUserBookings(userId),
                financialApi.getUserInvoices(userId)
            ]);
            setUserBookings(bookingsRes.data || []);
            setUserInvoices(invoicesRes.data || []);
        } catch (error) {
            console.error("Failed to fetch related info:", error);
            setUserBookings([]);
            setUserInvoices([]);
        } finally {
            setIsLoadingRelated(false);
        }
    }, [token]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    useEffect(() => {
        if (isDetailsOpen && selectedRequest?.userId) {
            fetchRelatedInfo(selectedRequest.userId);
        } else {
            setUserBookings([]);
            setUserInvoices([]);
        }
    }, [isDetailsOpen, selectedRequest, fetchRelatedInfo]);



    const handleSave = async () => {
        if (!token || !selectedRequest) return;
        setIsUpdatingPrice(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    price: parseFloat(editingPrice),
                    targetDepartment: editingDepartment 
                }),
            });
            if (response.ok) {
                fetchRequests();
                setIsDetailsOpen(false);
            }
        } catch (error) {
            console.error("Failed to update price:", error);
        } finally {
            setIsUpdatingPrice(false);
        }
    };

    const categories = Array.from(new Set((Array.isArray(requests) ? requests : []).map((req) => req.category).filter(Boolean)));
    const departmentsList = Array.from(new Set((Array.isArray(requests) ? requests : []).map((req) => req.targetDepartment).filter(Boolean)));
    const filteredRequests = (Array.isArray(requests) ? requests : []).filter(req => {
        const query = searchTerm.trim().toLowerCase();
        const createdAt = req.createdAt ? new Date(req.createdAt) : null;
        const derivedStatus = req.clientDecision === 'accepted' ? 'accepted' : req.status;
        const matchesSearch = !query ||
            req.clientName?.toLowerCase().includes(query) ||
            req.serviceType?.toLowerCase().includes(query) ||
            req.city?.toLowerCase().includes(query) ||
            req.district?.toLowerCase().includes(query) ||
            req.phone?.includes(searchTerm);
        const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter || req.status === statusFilter;
        const matchesCategory = categoryFilter === "all" || req.category === categoryFilter;
        const matchesDepartment = departmentFilter === "all" || req.targetDepartment === departmentFilter;
        const matchesDecision = decisionFilter === "all" || (req.clientDecision || "pending") === decisionFilter;
        const matchesFrom = !dateFrom || (createdAt && createdAt >= new Date(dateFrom));
        const matchesTo = !dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`));
        return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && matchesDecision && matchesFrom && matchesTo;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 p-6">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        {t('admin.service_requests.title')}
                    </h1>
                    <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        {t('admin.service_requests.subtitle')}
                    </p>
                </div>
            </section>

            {/* View / List mode only – form has moved to Building Management */}
            <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* List Actions */}
                        <div className="grid grid-cols-1 gap-3 px-4 md:grid-cols-4 xl:grid-cols-8">
                            <div className="relative w-full group md:col-span-2">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder={t('admin.service_requests.search_placeholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white border border-slate-100 py-3.5 pr-12 pl-6 text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 shadow-sm transition-all rounded-[1.5rem]"
                                />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]">
                                <option value="all">كل الحالات</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]">
                                <option value="all">كل التصنيفات</option>
                                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                            </select>
                            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]">
                                <option value="all">كل الإدارات</option>
                                {departmentsList.map((department) => <option key={department} value={department}>{t(`admin.trans.dept.${department}`) || department}</option>)}
                            </select>
                            <select value={decisionFilter} onChange={(e) => setDecisionFilter(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]">
                                <option value="all">قرار العميل</option>
                                <option value="pending">Pending</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]" />
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-white border border-slate-100 py-3.5 px-4 text-sm font-bold rounded-[1.5rem]" />
                            <button 
                                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setCategoryFilter("all"); setDepartmentFilter("all"); setDecisionFilter("all"); setDateFrom(""); setDateTo(""); }}
                                className="p-3.5 rounded-2xl bg-white border border-slate-100 hover:border-slate-900 transition-all text-slate-500 hover:text-slate-950 shadow-sm"
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Requests Table */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden min-h-[400px]">
                            {isLoadingRequests ? (
                                <div className="flex flex-col items-center justify-center py-32 gap-4">
                                    <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-900 animate-spin" />
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
                                </div>
                            ) : filteredRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.parties')}</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.type')}</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.status')}</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.date')}</th>
                                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.legal.headers.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredRequests.map((req) => (
                                                <motion.tr 
                                                    key={req.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="group hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all">
                                                                <User className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-900">{req.clientName}</p>
                                                                <p className="text-[11px] font-bold text-slate-400">{req.phone}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{req.serviceType}</p>
                                                            <p className="text-[11px] font-bold text-slate-400">{req.city} - {req.district}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <Badge variant="secondary" className="font-bold">
                                                            {t(`admin.trans.dept.${req.targetDepartment}`)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-6">
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
                                                                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${STATUS_STYLES[statusKey] || "bg-slate-100 text-slate-500"}`}>
                                                                    {label}
                                                                </span>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span className="text-[11px] font-bold">
                                                                {format(new Date(req.createdAt), 'dd MMMM yyyy', { locale: language === 'ar' ? ar : enUS })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedRequest(req);
                                                                setEditingPrice(req.price?.toString() || "0");
                                                                setEditingDepartment(req.targetDepartment || "");
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="p-2 rounded-xl border border-slate-100 hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 gap-6 opacity-40">
                                    <div className="p-8 rounded-[2.5rem] bg-slate-50">
                                        <Briefcase className="w-16 h-16 text-slate-200" />
                                    </div>
                                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.no_data')}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-900">{t('admin.service_requests.details_title')}</DialogTitle>
                        <DialogDescription>
                            {selectedRequest?.serviceType} - {selectedRequest?.clientName}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="py-4">
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100 p-1 rounded-xl h-auto">
                                    <TabsTrigger value="details" className="py-2 rounded-lg font-bold">{t('common.details')}</TabsTrigger>
                                    <TabsTrigger value="visits" className="py-2 rounded-lg font-bold">{t('admin.service_requests.customer_visits')}</TabsTrigger>
                                    <TabsTrigger value="invoices" className="py-2 rounded-lg font-bold">{t('admin.service_requests.customer_invoices')}</TabsTrigger>
                                </TabsList>

                                <TabsContent value="details" className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-900 shadow-sm">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900">{selectedRequest.clientName}</p>
                                                <p className="text-xs font-bold text-slate-400">{selectedRequest.phone}</p>
                                            </div>
                                        </div>
                                        {selectedRequest.userId && (
                                            <button
                                                onClick={() => handleOpenChat(selectedRequest.userId)}
                                                className="flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors gap-2 shrink-0"
                                            >
                                                <MessageSquare className="h-4 w-4" />
                                                {isRtl ? "فتح الشات" : "Open Chat"}
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.service_type')}</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedRequest.serviceType}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.target_dept')}</label>
                                            <p className="text-sm font-bold text-slate-900">{t(`admin.trans.dept.${selectedRequest.targetDepartment}`)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.location_info')}</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedRequest.city} - {selectedRequest.district}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.quantity')}</label>
                                            <p className="text-sm font-bold text-slate-900">{selectedRequest.quantity}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.target_dept')} (Admin)</label>
                                        <select 
                                            value={editingDepartment}
                                            onChange={(e) => setEditingDepartment(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all cursor-pointer appearance-none"
                                            disabled={!['postPurchase', 'other'].includes(selectedRequest.category)}
                                        >
                                            {departments.map(dept => (
                                                <option key={dept.id} value={dept.id}>{t(dept.key)}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedRequest.category === 'legal' && (selectedRequest.firstParty || selectedRequest.secondParty || selectedRequest.metadata) ? (
                                        <div className="space-y-6 pt-4 border-t border-slate-100">
                                            {selectedRequest.firstParty && (
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('disputes.firstParty')}</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الاسم</p>
                                                            <p className="text-xs font-bold text-slate-900">{selectedRequest.firstParty.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهوية</p>
                                                            <p className="text-xs font-bold text-slate-900">{selectedRequest.firstParty.idNumber}</p>
                                                        </div>
                                                        {selectedRequest.firstParty.phone && (
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الجوال</p>
                                                                <p className="text-xs font-bold text-slate-900">{selectedRequest.firstParty.phone}</p>
                                                            </div>
                                                        )}
                                                        {selectedRequest.firstParty.agent?.name && (
                                                            <div className="col-span-2 mt-1 p-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                                <p className="text-[8px] font-bold text-blue-600 mb-1">بيانات الوكيل</p>
                                                                <p className="text-[11px] font-bold text-slate-900">{selectedRequest.firstParty.agent.name}</p>
                                                                <p className="text-[9px] text-slate-500">رقم الوكالة: {selectedRequest.firstParty.agent.agencyNumber}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedRequest.secondParty && (
                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{t('disputes.secondParty')}</p>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الاسم</p>
                                                            <p className="text-xs font-bold text-slate-900">{selectedRequest.secondParty.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الهوية</p>
                                                            <p className="text-xs font-bold text-slate-900">{selectedRequest.secondParty.idNumber}</p>
                                                        </div>
                                                        {selectedRequest.secondParty.agent?.name && (
                                                            <div className="col-span-2 mt-1 p-2 bg-blue-50/50 rounded-xl border border-blue-100/50">
                                                                <p className="text-[8px] font-bold text-blue-600 mb-1">بيانات الوكيل</p>
                                                                <p className="text-[11px] font-bold text-slate-900">{selectedRequest.secondParty.agent.name}</p>
                                                                <p className="text-[9px] text-slate-500">رقم الوكالة: {selectedRequest.secondParty.agent.agencyNumber}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedRequest.metadata && (
                                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">تفاصيل إضافية</p>
                                                    <div className="space-y-3">
                                                        {selectedRequest.metadata.applicantRole && (
                                                            <div className="inline-block bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-lg mb-2">
                                                                مقدم الطلب: {
                                                                    selectedRequest.metadata.applicantRole === 'party1' ? 'الطرف الأول' : 
                                                                    selectedRequest.metadata.applicantRole === 'party2' ? 'الطرف الثاني' : 'الوكيل'
                                                                }
                                                            </div>
                                                        )}
                                                        {selectedRequest.metadata.details?.duration && (
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">المدة</p>
                                                                <p className="text-xs font-bold text-slate-900">{selectedRequest.metadata.details.duration}</p>
                                                            </div>
                                                        )}
                                                        {selectedRequest.metadata.details?.paymentAmount && (
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تفاصيل الدفع</p>
                                                                <p className="text-xs font-bold text-slate-900">{selectedRequest.metadata.details.paymentAmount}</p>
                                                            </div>
                                                        )}
                                                        {selectedRequest.description && (
                                                            <div>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.description')}</p>
                                                                <p className="text-xs font-medium text-slate-600 leading-relaxed">{selectedRequest.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : selectedRequest.description && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.description')}</label>
                                            <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl">
                                                {selectedRequest.description}
                                            </p>
                                        </div>
                                    )}

                                     <div className="space-y-4 pt-4 border-t border-slate-100">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.service_requests.price')}</label>
                                        <div className="flex gap-3">
                                            <input 
                                                type="number"
                                                value={editingPrice}
                                                onChange={(e) => setEditingPrice(e.target.value)}
                                                className="bg-slate-50 border border-slate-100 py-3 px-4 text-sm font-bold w-full outline-none focus:border-slate-900 rounded-xl transition-all"
                                                placeholder="0.00"
                                            />
                                            <div className="flex flex-col gap-3">
                                                <button 
                                                    onClick={handleSave}
                                                    disabled={isUpdatingPrice}
                                                    className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {t('admin.service_requests.save_changes')}
                                                </button>

                                                {(!selectedRequest.adminAccepted && ['postPurchase', 'other'].includes(selectedRequest.category)) && (
                                                    <button 
                                                        onClick={async () => {
                                                            if (!token || !selectedRequest) return;
                                                            setIsAccepting(true);
                                                            try {
                                                                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/accept`, {
                                                                    method: 'PUT',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`
                                                                    }
                                                                });
                                                                if (response.ok) {
                                                                    fetchRequests();
                                                                    setIsDetailsOpen(false);
                                                                }
                                                            } catch (error) {
                                                                console.error("Error accepting request:", error);
                                                            } finally {
                                                                setIsAccepting(false);
                                                            }
                                                        }}
                                                        disabled={isAccepting}
                                                        className="w-full bg-emerald-500 text-white py-4 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                        {t('admin.service_requests.accept_forward')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                     </div>

                                     {/* ===== LEGAL INVOICE SECTION ===== */}
                                     {selectedRequest.category === 'legal' && (
                                        <div className="space-y-4 pt-4 border-t-2 border-blue-100">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                                    ⚖️ {t('legal.invoice.sendBtn')}
                                                </label>
                                                {selectedRequest.invoiceSent ? (
                                                    <span className="bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1 rounded-full border border-slate-200">
                                                        ✓ {t('legal.invoice.sent')}
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full border border-slate-100">
                                                        ⏳ {t('legal.invoice.notSent')}
                                                    </span>
                                                )}
                                            </div>

                                            {selectedRequest.clientDecision && selectedRequest.clientDecision !== 'pending' && (
                                                <div className={`p-3 rounded-xl text-[11px] font-black text-center ${
                                                    selectedRequest.clientDecision === 'accepted'
                                                        ? 'bg-slate-50 text-slate-700 border border-slate-200'
                                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                }`}>
                                                    {selectedRequest.clientDecision === 'accepted'
                                                        ? `✓ ${t('legal.decision.accepted')}`
                                                        : `✗ ${t('legal.decision.rejected')}`
                                                    }
                                                </div>
                                            )}

                                            {(!selectedRequest.invoiceSent || selectedRequest.clientDecision === 'pending') && (
                                                <div className="flex gap-3">
                                                    <input
                                                        type="number"
                                                        value={invoicePrice}
                                                        onChange={(e) => setInvoicePrice(e.target.value)}
                                                        className="bg-blue-50 border border-blue-200 py-3 px-4 text-sm font-bold w-full outline-none focus:border-blue-500 rounded-xl transition-all"
                                                        placeholder={t('legal.invoice.price')}
                                                        min="0"
                                                    />
                                                    <button
                                                        onClick={async () => {
                                                            if (!token || !selectedRequest || !invoicePrice) return;
                                                            setIsSendingInvoice(true);
                                                            setInvoiceMessage(null);
                                                            try {
                                                                const res = await fetch(
                                                                    `${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/send-invoice`,
                                                                    {
                                                                        method: 'PUT',
                                                                        headers: {
                                                                            'Authorization': `Bearer ${token}`,
                                                                            'Content-Type': 'application/json',
                                                                        },
                                                                        body: JSON.stringify({ price: parseFloat(invoicePrice) }),
                                                                    }
                                                                );
                                                                if (res.ok) {
                                                                    setInvoiceMessage({ type: 'success', text: t('legal.invoice.sendSuccess') });
                                                                    fetchRequests();
                                                                    setInvoicePrice("");
                                                                } else {
                                                                    setInvoiceMessage({ type: 'error', text: t('legal.invoice.sendError') });
                                                                }
                                                            } catch {
                                                                setInvoiceMessage({ type: 'error', text: t('legal.invoice.sendError') });
                                                            } finally {
                                                                setIsSendingInvoice(false);
                                                            }
                                                        }}
                                                        disabled={isSendingInvoice || !invoicePrice}
                                                        className="bg-blue-600 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        {isSendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        {t('legal.invoice.sendBtn')}
                                                    </button>
                                                </div>
                                            )}

                                            {invoiceMessage && (
                                                <p className={`text-xs font-bold ${
                                                    invoiceMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                                                }`}>
                                                    {invoiceMessage.text}
                                                </p>
                                            )}
                                        </div>
                                     )}
                                     {/* ===== END LEGAL INVOICE SECTION ===== */}

                                     <div className="pt-2 flex items-center gap-2 text-slate-400 text-[10px] font-bold">

                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{t('admin.service_requests.date')}: {format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy - hh:mm a', { locale: language === 'ar' ? ar : enUS })}</span>
                                     </div>
                                </TabsContent>

                                <TabsContent value="visits" className="space-y-4">
                                    {isLoadingRelated ? (
                                        <div className="py-12 flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                        </div>
                                    ) : userBookings.length > 0 ? (
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {userBookings.map((booking: any) => (
                                                <div key={booking.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <Badge variant="outline" className="bg-white">{booking.type}</Badge>
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            {format(new Date(booking.createdAt), 'dd/MM/yyyy')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        {booking.visitDate ? format(new Date(booking.visitDate), 'dd MMMM - hh:mm a', { locale: language === 'ar' ? ar : enUS }) : 'Pending Schedule'}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-3">
                                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                                            booking.status === 'confirmed' ? 'bg-slate-900 text-white' :
                                                            booking.status === 'cancelled' ? 'bg-slate-50 text-slate-400' :
                                                            'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {booking.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                                            <Calendar className="w-8 h-8 opacity-50" />
                                            <p className="text-xs font-bold">{t('admin.service_requests.no_visits')}</p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="invoices" className="space-y-4">
                                    {isLoadingRelated ? (
                                        <div className="py-12 flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                        </div>
                                    ) : userInvoices.length > 0 ? (
                                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                            {userInvoices.map((invoice: any) => (
                                                <div key={invoice.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Receipt className="w-4 h-4 text-slate-400" />
                                                            <span className="font-bold text-slate-900 text-sm">#{invoice.invoiceNumber || invoice.id.substring(0,8)}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-500">{format(new Date(invoice.createdAt), 'dd MMMM yyyy')}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-slate-900"><SaudiRiyalAmount amount={invoice.amount} locale="ar-SA" /></p>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                            invoice.status === 'paid' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                            {invoice.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                                            <Receipt className="w-8 h-8 opacity-50" />
                                            <p className="text-xs font-bold">{t('admin.service_requests.no_invoices')}</p>
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
