"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, User, Calendar, 
  ExternalLink, Search, Filter,
  Briefcase, Mail, Phone, MapPin, X, CheckCircle,
  AlertCircle, CheckCircle2, MessageSquare, Trash2, Save
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { SaudiRiyalAmount, SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";

interface ServiceRequestsTableProps {
  title?: string;
  subtitle?: string;
  department?: 'marketing' | 'legal' | 'real_estate' | 'finance';
}


export default function ServiceRequestsTable({ title, subtitle, department }: ServiceRequestsTableProps) {

    const router = useRouter();
    const { t, language } = useLanguage();
    const { token } = useAuth();
    const confirmDialog = useConfirmDialog();
    
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    // Pricing & Invoicing State
    const [invoicePrice, setInvoicePrice] = useState("");
    const [isSendingInvoice, setIsSendingInvoice] = useState(false);
    const [invoiceMessage, setInvoiceMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [statusValue, setStatusValue] = useState("pending");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
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
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleSendInvoice = async () => {
        if (!token || !selectedRequest || !invoicePrice) return;
        
        setIsSendingInvoice(true);
        setInvoiceMessage(null);
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/send-invoice`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ price: parseFloat(invoicePrice) })
            });

            if (res.ok) {
                setInvoiceMessage({ type: 'success', text: 'تم إرسال الفاتورة بنجاح' });
                fetchRequests();
                // Optionally update the selected request locally so the UI updates without closing the modal
                setSelectedRequest({ ...selectedRequest, invoiceSent: true, price: invoicePrice });
                setInvoicePrice("");
            } else {
                setInvoiceMessage({ type: 'error', text: 'حدث خطأ أثناء إرسال الفاتورة' });
            }
        } catch (error) {
            setInvoiceMessage({ type: 'error', text: 'حدث خطأ أثناء إرسال الفاتورة' });
        } finally {
            setIsSendingInvoice(false);
        }
    };

    const openDetails = (req: any) => {
        setSelectedRequest(req);
        setStatusValue(req.status || "pending");
        setInvoicePrice(req.invoicePrice || req.price || "");
        setInvoiceMessage(null);
        setIsDetailsOpen(true);
    };

    const handleUpdateStatus = async () => {
        if (!token || !selectedRequest) return;
        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: statusValue })
            });
            if (!res.ok) throw new Error('Failed to update status');
            await fetchRequests();
            setSelectedRequest({ ...selectedRequest, status: statusValue });
            setInvoiceMessage({ type: 'success', text: 'تم تحديث حالة الطلب' });
        } catch {
            setInvoiceMessage({ type: 'error', text: 'تعذر تحديث حالة الطلب' });
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !selectedRequest) return;
        const ok = await confirmDialog({
            title: 'هل تريد حذف هذا الطلب؟',
            confirmLabel: 'حذف',
            cancelLabel: 'إلغاء',
            destructive: true,
        });
        if (!ok) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete request');
            await fetchRequests();
            setIsDetailsOpen(false);
            setSelectedRequest(null);
        } catch {
            setInvoiceMessage({ type: 'error', text: 'تعذر حذف الطلب' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleOpenChat = async () => {
        if (!token || !selectedRequest) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests/${selectedRequest.id}/chat`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to open chat');
            const data = await res.json();
            router.push(`/chat/${data.chatRoomId}`);
        } catch {
            setInvoiceMessage({ type: 'error', text: 'تعذر فتح محادثة الطلب' });
        }
    };

    const filteredRequests = (Array.isArray(requests) ? requests : []).filter(req => {
        const matchesSearch = 
            req.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            req.phone?.includes(searchQuery);
        
        const matchesDepartment = !department || req.targetDepartment === department;
        
        return matchesSearch && matchesDepartment;
    });


    return (
        <div className="space-y-6">
            {(title || subtitle) && (
                <div className="px-4 space-y-1">
                    {title && <h2 className="text-2xl font-black text-slate-900">{title}</h2>}
                    {subtitle && (
                        <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            {subtitle}
                        </p>
                    )}
                </div>
            )}

            {/* List Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-4">
                <div className="relative w-full md:w-96 group">
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors`} />
                    <input 
                        type="text"
                        placeholder={t('admin.trans.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`bg-card border border py-3.5 ${language === 'ar' ? 'pr-12 pl-6' : 'pl-12 pr-6'} text-sm font-bold w-full outline-none hover:border-slate-300 focus:border-slate-900 shadow-sm transition-all rounded-[1rem]`}
                    />
                </div>
                <button 
                    onClick={fetchRequests}
                    className="p-3.5 rounded-2xl bg-card border border hover:border-slate-900 transition-all text-slate-500 hover:text-slate-950 shadow-sm"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Requests Table */}
            <div className="bg-card rounded-[1rem] border border shadow-xl shadow-stone-400 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border border-t-slate-900 animate-spin" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('common.loading')}</p>
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
                            <thead>
                                <tr className="bg-muted/50 border-b border">
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.parties')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.type')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.legal.headers.status')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.table.date')}</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('admin.legal.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRequests.map((req) => (
                                    <motion.tr 
                                        key={req.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="group hover:bg-muted/50 transition-colors"
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-all">
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
                                            {(() => {
                                                let label = t(`legal.status.${req.status}`) || (req.paymentStatus === 'PAID' ? t('admin.trans.paid') : t('admin.trans.unpaid'));
                                                let variantClass = req.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600';

                                                if (req.category === 'legal' || req.targetDepartment === 'legal' || req.targetDepartment === 'marketing') {
                                                    if (req.clientDecision === 'accepted') {
                                                        label = t('legal.decision.accepted');
                                                        variantClass = 'bg-emerald-100 text-emerald-700';
                                                    } else if (req.clientDecision === 'rejected') {
                                                        label = t('legal.decision.rejected');
                                                        variantClass = 'bg-rose-100 text-rose-700';
                                                    } else if (req.invoiceSent) {
                                                        label = t('legal.invoice.sent');
                                                        variantClass = 'bg-blue-100 text-blue-700';
                                                    }
                                                }

                                                return (
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${variantClass}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[11px] font-bold">
                                                    {format(new Date(req.createdAt), 'dd MMMM yyyy', { locale: language === 'ar' ? ar : undefined })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <button 
                                                onClick={() => openDetails(req)}
                                                className="p-2 rounded-xl border border hover:border-slate-900 hover:bg-slate-900 hover:text-white transition-all text-slate-400"
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
                        <div className="p-8 rounded-[1rem] bg-muted">
                            <Briefcase className="w-16 h-16 text-slate-200" />
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{t('common.noData')}</p>
                    </div>
                )}
             </div>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="w-[95vw] sm:max-w-2xl bg-card rounded-[1rem] border-none shadow-2xl p-0 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <DialogHeader className="p-8 bg-slate-950 text-white flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-black">{selectedRequest?.serviceType}</DialogTitle>
                            <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">
                                {t(`admin.service_requests.category.${selectedRequest?.category}`) || selectedRequest?.category}
                            </p>

                        </div>
                    </DialogHeader>

                    {selectedRequest && (
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العميل</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-slate-900">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-slate-900">{selectedRequest.clientName}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الهاتف</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-slate-900">
                                                <Phone className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-slate-900">{selectedRequest.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الموقع</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-slate-900">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-slate-900">{selectedRequest.city}, {selectedRequest.district}</span>
                                        </div>
                                    </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المبلغ والدفع</label>
                                        
                                        {((department === 'marketing' || department === 'legal') && !selectedRequest.invoiceSent) ? (
                                            <div className="space-y-3 pt-2">
                                                <div className="flex flex-col gap-2">
                                                    <div className="relative">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            placeholder="0.00"
                                                            value={invoicePrice}
                                                            onChange={(e) => { 
                                                                setInvoiceMessage(null); 
                                                                setInvoicePrice(e.target.value); 
                                                            }}
                                                            className="w-full bg-muted border border rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                                                        />
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><SaudiRiyalSymbol iconClassName="h-3.5 w-3.5" /></span>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={handleSendInvoice} 
                                                        disabled={isSendingInvoice || !invoicePrice} 
                                                        className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-lg disabled:opacity-50"
                                                    >
                                                        {isSendingInvoice ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span>إرسال الفاتورة للعميل</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {invoiceMessage && (
                                                    <div className={`p-3 text-xs font-bold rounded-xl flex items-center gap-2 ${
                                                        invoiceMessage?.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {invoiceMessage?.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                                        {invoiceMessage.text}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                     selectedRequest.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    <CheckCircle className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">
                                                        <SaudiRiyalAmount amount={selectedRequest.price || selectedRequest.invoicePrice || 0} locale="ar-SA" />
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        {selectedRequest.paymentStatus === 'PAID' ? 'تم الدفع' : selectedRequest.invoiceSent ? 'بانتظار الدفع' : 'قيد المراجعة'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الطلب</label>
                                        <select
                                            value={statusValue}
                                            onChange={(e) => setStatusValue(e.target.value)}
                                            className="w-full bg-muted border border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900"
                                        >
                                            <option value="pending">قيد الانتظار</option>
                                            <option value="assigned">تم التعيين</option>
                                            <option value="in_progress">قيد المعالجة</option>
                                            <option value="completed">مكتمل</option>
                                            <option value="cancelled">ملغي</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleUpdateStatus}
                                        disabled={isUpdatingStatus}
                                        className="self-end bg-slate-950 text-white py-3 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        حفظ الحالة
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleOpenChat}
                                        className="bg-muted text-slate-700 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-muted transition-all flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        فتح الشات
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-red-50 text-red-600 py-3 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        حذف الطلب
                                    </button>
                                </div>
                            </div>

                            {selectedRequest.description && (
                                <div className="space-y-2 pt-6 border-t border">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التفاصيل</label>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-muted p-4 rounded-2xl">{selectedRequest.description}</p>
                                </div>
                            )}

                             <div className="pt-6 border-t border flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>تاريخ الطلب: {format(new Date(selectedRequest.createdAt), 'dd MMMM yyyy', { locale: ar })}</span>
                                </div>
                                <div className="font-black text-slate-900 text-lg">
                                    <SaudiRiyalAmount amount={selectedRequest.price} locale="ar-SA" iconClassName="h-3 w-3 text-slate-400" />
                                </div>
                             </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
