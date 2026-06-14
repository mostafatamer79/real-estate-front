"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  MapPin, 
  User as UserIcon, 
  Filter,
  FileText,
  Eye,
  EyeOff,
  Pause,
  Play,
  Trash2,
  Edit2,
  MoreVertical,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Building2,
  DollarSign,
  Save,
  Tag,
  Flag
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import api, { offersApi, usersApi, type OfferReport } from "@/lib/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { Pagination } from "../../src/components/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function CreateOfferModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [form, setForm] = useState({
    userId: "",
    clientName: "",
    clientPhone: "",
    propertyType: "فيلا",
    price: 0,
    area: 1,
    city: "الرياض",
    neighborhood: "",
    propertyAge: "جديد",
    direction: "شمال",
    deedType: "صك إلكتروني",
    propertyCondition: "ممتاز",
    status: "published",
    dealType: "بيع"
  });

  useEffect(() => {
    usersApi.findAll().then(res => setUsers(res.data || [])).finally(() => setLoadingUsers(false));
  }, []);

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // if (!form.userId) return toast.error("يرجى اختيار المعلن"); // Allow anonymous
    if (!form.neighborhood) return toast.error("يرجى إدخال الحي");

    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.userId) delete payload.userId; // avoid backend UUID validation on empty string
      await offersApi.create(payload);
      toast.success("تم إنشاء العرض بنجاح");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل إنشاء العرض");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-slate-50 border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">إضافة عرض عقاري جديد</h2>
            <p className="text-xs text-slate-400 font-bold">إنشاء عرض وتخصيصه لمستخدم معين أو تركه مجهولاً</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
             {/* User Selection */}
             <div className="space-y-1 relative">
              <label className={labelCls}>المعلن (اختياري)</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={userSearch} 
                  onChange={e => { setUserSearch(e.target.value); if(form.userId) setForm(f => ({...f, userId: ""})) }} 
                  className="w-full h-11 bg-slate-50 border-transparent border focus:border-slate-950 rounded-xl pr-10 pl-4 text-sm font-bold outline-none transition-all" 
                  placeholder="ابحث بالاسم أو اترك فارغاً للمجهول..." 
                />
              </div>
              {userSearch && !form.userId && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <button key={u.id} type="button" onClick={() => { setForm(f => ({...f, userId: u.id, clientName: "", clientPhone: ""})); setUserSearch(`${u.firstName} ${u.lastName}`); }} className="w-full px-4 py-3 text-right hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-950">{u.firstName} {u.lastName}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{u.email}</span>
                      </div>
                      <CheckCircle className={`w-4 h-4 ${form.userId === u.id ? 'text-emerald-500' : 'text-slate-100'}`} />
                    </button>
                  )) : <div className="p-4 text-center text-[10px] font-bold text-slate-400">لا يوجد نتائج</div>}
                </div>
              )}
            </div>
            {!form.userId ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>اسم العميل</label>
                  <input value={form.clientName} onChange={e => setForm(f => ({...f, clientName: e.target.value}))} className={inputCls} placeholder="اسم العميل..." />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>هاتف العميل</label>
                  <input value={form.clientPhone} onChange={e => setForm(f => ({...f, clientPhone: e.target.value}))} className={inputCls} placeholder="05xxxxxxxx" />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className={labelCls}>نوع العقار</label>
                <select value={form.propertyType} onChange={e => setForm(f => ({...f, propertyType: e.target.value}))} className={inputCls}>
                  <option value="فيلا">فيلا</option>
                  <option value="شقة">شقة</option>
                  <option value="أرض">أرض</option>
                  <option value="عمارة">عمارة</option>
                  <option value="محل">محل</option>
                </select>
              </div>
            )}
          </div>

          {form.userId && (
            <div className="grid grid-cols-1">
              <div className="space-y-1">
                <label className={labelCls}>نوع العقار</label>
                <select value={form.propertyType} onChange={e => setForm(f => ({...f, propertyType: e.target.value}))} className={inputCls}>
                  <option value="فيلا">فيلا</option>
                  <option value="شقة">شقة</option>
                  <option value="أرض">أرض</option>
                  <option value="عمارة">عمارة</option>
                  <option value="محل">محل</option>
                </select>
              </div>
            </div>
          )}
          {/* Always show rest of fields */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>المدينة</label>
              <input value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>الحي</label>
              <input value={form.neighborhood} onChange={e => setForm(f => ({...f, neighborhood: e.target.value}))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>المساحة</label>
              <div className="relative">
                <input type="number" value={form.area} onChange={e => setForm(f => ({...f, area: parseFloat(e.target.value)}))} className={inputCls} />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">م²</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>السعر</label>
              <div className="relative">
                <input type="number" value={form.price} onChange={e => setForm(f => ({...f, price: parseFloat(e.target.value)}))} className={inputCls} />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">ر.س</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>نوع الصفقة</label>
              <select value={form.dealType} onChange={e => setForm(f => ({...f, dealType: e.target.value}))} className={inputCls}>
                <option value="بيع">بيع</option>
                <option value="إيجار">إيجار</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>عمر العقار</label>
              <input value={form.propertyAge} onChange={e => setForm(f => ({...f, propertyAge: e.target.value}))} className={inputCls} placeholder="مثال: جديد، 5 سنوات..." />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>الحالة</label>
              <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className={inputCls}>
                <option value="published">منشور</option>
                <option value="draft">مسودة</option>
                <option value="sold">تم البيع</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4 shadow-xl shadow-slate-950/20">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            نشر العرض الآن
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminOffersPage() {
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [reports, setReports] = useState<OfferReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await offersApi.findAll();
      if (res.data) {
        setOffers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch offers", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const res = await offersApi.getReports(reportStatusFilter);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch offer reports", error);
      toast.error("فشل تحميل بلاغات العروض");
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [reportStatusFilter]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await offersApi.adminUpdateStatus(id, status);
      toast.success(t('admin.success.update') || "Updated successfully");
      fetchOffers();
    } catch (error) {
      toast.error(t('admin.error.update_failed') || "Update failed");
    }
  };

  const handleSetActive = async (id: string, isActive: boolean) => {
    try {
      await offersApi.setActive(id, isActive);
      toast.success(t('admin.success.update') || "Updated successfully");
      fetchOffers();
    } catch (error) {
      toast.error(t('admin.error.update_failed') || "Update failed");
    }
  };

  const handleDelete = async (id: string, hard: boolean = false) => {
    const confirmMsg = hard 
      ? (language === 'ar' ? 'هل أنت متأكد من الحذف النهائي؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure about permanent deletion? This cannot be undone.')
      : (language === 'ar' ? 'هل أنت متأكد من حذف هذا العرض؟' : 'Are you sure you want to delete this offer?');
    
    const ok = await confirmDialog({
      title: confirmMsg,
      confirmLabel: language === "ar" ? "تأكيد" : "Confirm",
      cancelLabel: language === "ar" ? "إلغاء" : "Cancel",
      destructive: hard,
    });
    if (!ok) return;

    try {
      if (hard) {
        await offersApi.delete(id);
      } else {
        await offersApi.remove(id);
      }
      toast.success(t('admin.success.delete') || "Deleted successfully");
      fetchOffers();
    } catch (error) {
      toast.error(t('admin.error.delete_failed') || "Deletion failed");
    }
  };

  const handleReportAction = async (reportId: string, action: 'reviewed' | 'dismissed' | 'stop') => {
    const stopOffer = action === 'stop';
    if (stopOffer) {
      const ok = await confirmDialog({
        title: "هل تريد إيقاف هذا العرض بسبب البلاغ؟",
        description: "سيتم إيقاف العرض وإغلاق ظهوره في الواجهة العامة.",
        confirmLabel: "إيقاف العرض",
        cancelLabel: "إلغاء",
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      await offersApi.updateReport(reportId, {
        status: action === 'stop' ? 'resolved' : action,
        stopOffer,
      });
      toast.success("تم تحديث البلاغ");
      fetchReports();
      if (stopOffer) fetchOffers();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "فشل تحديث البلاغ");
    }
  };

  const propertyTypes = Array.from(new Set(offers.map((offer) => offer.propertyType).filter(Boolean)));
  const filteredOffers = offers.filter(offer => {
    const createdAt = offer.createdAt ? new Date(offer.createdAt) : null;
    const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
    const matchesType = propertyTypeFilter === "all" || offer.propertyType === propertyTypeFilter;
    const matchesActive =
      activeFilter === "all" ||
      (activeFilter === "visible" && offer.isActive) ||
      (activeFilter === "hidden" && !offer.isActive);
    const matchesFrom = !dateFrom || (createdAt && createdAt >= new Date(dateFrom));
    const matchesTo = !dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`));
    const matchesSearch =
        offer.propertyType?.toLowerCase().includes(search.toLowerCase()) ||
        offer.city?.toLowerCase().includes(search.toLowerCase()) ||
        offer.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
        offer.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        offer.id.includes(search);
    return matchesStatus && matchesType && matchesActive && matchesFrom && matchesTo && matchesSearch;
  });
  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);
  const paginatedOffers = filteredOffers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">منشور</Badge>;
      case 'paused': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">متوقف</Badge>;
      case 'draft': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">مسودة</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">مرفوض</Badge>;
      case 'sold': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">تم البيع</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  const getReportReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: "إعلان مكرر أو بريد عشوائي",
      fake: "معلومات غير صحيحة",
      fraud: "احتيال أو محاولة نصب",
      offensive: "محتوى مسيء أو غير لائق",
      wrong_category: "تصنيف خاطئ",
      other: "سبب آخر",
    };
    return labels[reason] || reason;
  };

  const getReportStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">جديد</Badge>;
      case 'reviewed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">تمت المراجعة</Badge>;
      case 'resolved': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">تم الإجراء</Badge>;
      case 'dismissed': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">مرفوض</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <AnimatePresence>
        {isModalOpen && <CreateOfferModal onClose={() => setIsModalOpen(false)} onSuccess={fetchOffers} />}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <Tag className="w-3 h-3" />
            إدارة المحتوى
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t('admin.offers.title') || "إدارة العروض العقارية"}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            عرض وتعديل والتحكم في جميع العروض المنشورة في المنصة
          </p>
        </div>
        
        <div className="grid w-full gap-3 md:w-auto md:grid-cols-4 xl:grid-cols-7">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-950/20"
          >
            <Plus className="w-4 h-4" />
            إضافة عرض
          </button>
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder={t('admin.search') || "بحث..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-64 text-sm font-bold shadow-sm transition-all"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-bold shadow-sm cursor-pointer"
          >
            <option value="all">كل الحالات</option>
            <option value="published">منشور</option>
            <option value="paused">متوقف</option>
            <option value="draft">مسودة</option>
            <option value="sold">تم البيع</option>
          </select>
          <select value={propertyTypeFilter} onChange={(e) => setPropertyTypeFilter(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-bold shadow-sm">
            <option value="all">كل الأنواع</option>
            {propertyTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-bold shadow-sm">
            <option value="all">كل الظهور</option>
            <option value="visible">ظاهر</option>
            <option value="hidden">مخفي</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm" />
          <button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); setPropertyTypeFilter("all"); setActiveFilter("all"); setDateFrom(""); setDateTo(""); }} className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm font-black shadow-sm">
            مسح
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي العروض</p>
            <p className="text-3xl font-black text-slate-950 tabular-nums">{offers.length}</p>
         </div>
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">عروض نشطة</p>
            <p className="text-3xl font-black text-emerald-600 tabular-nums">{offers.filter(o => o.status === 'published' || o.status === 'active').length}</p>
         </div>
         <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">بانتظار المراجعة</p>
            <p className="text-3xl font-black text-amber-600 tabular-nums">{offers.filter(o => o.status === 'draft').length}</p>
         </div>
         <div className="p-6 bg-white border border-red-100 rounded-3xl shadow-sm">
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">بلاغات العروض</p>
            <p className="text-3xl font-black text-red-600 tabular-nums">{reports.length}</p>
         </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">بلاغات العروض</h2>
              <p className="text-xs font-bold text-slate-400">مراجعة البلاغات واتخاذ إجراء على العرض عند الحاجة</p>
            </div>
          </div>
          <select
            value={reportStatusFilter}
            onChange={(e) => setReportStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm"
          >
            <option value="pending">بلاغات جديدة</option>
            <option value="reviewed">تمت المراجعة</option>
            <option value="resolved">تم الإجراء</option>
            <option value="dismissed">مرفوضة</option>
            <option value="all">كل البلاغات</option>
          </select>
        </div>

        {reportsLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 py-10 text-center text-sm font-bold text-slate-400">
            لا توجد بلاغات في هذه الحالة
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="rounded-3xl border border-slate-100 bg-slate-50/60 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getReportStatusBadge(report.status)}
                      <span className="text-[10px] font-black text-slate-400">{new Date(report.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <h3 className="text-sm font-black text-slate-950 truncate">
                      {report.offer?.propertyType || "عرض عقاري"} - {report.offer?.city || "بدون مدينة"}
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">
                      السبب: {getReportReasonLabel(report.reason)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.open(`/offers/${report.offerId}`, '_blank')}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-black hover:bg-slate-100"
                  >
                    عرض
                  </button>
                </div>

                {report.message && (
                  <div className="rounded-2xl bg-white border border-slate-100 p-3 text-sm font-bold text-slate-600 leading-relaxed">
                    {report.message}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-500">
                  <span>المبلغ: {report.reporter ? `${report.reporter.firstName || ''} ${report.reporter.lastName || ''}`.trim() || report.reporter.email || 'مستخدم' : 'مستخدم غير معروف'}</span>
                  <span className="font-mono">#{report.id.slice(0, 8)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleReportAction(report.id, 'reviewed')}
                    className="h-10 px-4 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-black hover:bg-blue-100"
                  >
                    تمت المراجعة
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportAction(report.id, 'stop')}
                    className="h-10 px-4 rounded-xl bg-red-600 text-white text-[11px] font-black hover:bg-red-700"
                  >
                    إيقاف العرض
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReportAction(report.id, 'dismissed')}
                    className="h-10 px-4 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-black hover:bg-slate-100"
                  >
                    رفض البلاغ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">العرض</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المعلن</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الموقع</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">السعر</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الحالة</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري تحميل البيانات...</p>
                        </div>
                      </TableCell>
                  </TableRow>
              ) : filteredOffers.length === 0 ? (
                  <TableRow>
                      <TableCell colSpan={6} className="text-center py-20">
                        <div className="flex flex-col items-center gap-3">
                          <AlertCircle className="w-12 h-12 text-slate-200" />
                          <p className="text-sm font-bold text-slate-400">لا توجد عروض تطابق بحثك</p>
                        </div>
                      </TableCell>
                  </TableRow>
              ) : (
                  paginatedOffers.map((offer) => (
                  <TableRow key={offer.id} className="hover:bg-slate-50/50 group transition-colors">
                      <TableCell className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm">{offer.propertyType}</span>
                          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tighter">ID: {offer.id.substring(0, 8)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs border border-slate-200/50">
                                  {offer.user?.firstName?.[0] || <UserIcon className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-xs">{offer.user?.firstName} {offer.user?.lastName}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{offer.user?.role}</span>
                              </div>
                          </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                          <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-slate-900 text-xs">{offer.city} - {offer.neighborhood}</span>
                          </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-950 text-sm">
                              {new Intl.NumberFormat('ar-SA').format(offer.price)}
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">ريال سعودي</span>
                          </div>
                      </TableCell>
                      <TableCell className="px-6 py-5">
                        {getStatusBadge(offer.status)}
                      </TableCell>
                      <TableCell className="px-6 py-5 text-left">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-950">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                            <DropdownMenuItem 
                              onClick={() => window.open(`/offers/${offer.id}`, '_blank')}
                              className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> معاينة العرض
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer">
                              <Edit2 className="w-4 h-4" /> تعديل البيانات
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            
                            {offer.status === 'published' || offer.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(offer.id, 'paused')}
                                className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <Pause className="w-4 h-4" /> إيقاف مؤقت
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleUpdateStatus(offer.id, 'published')}
                                className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              >
                                <Play className="w-4 h-4" /> تفعيل العرض
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleSetActive(offer.id, !offer.isActive)}
                              className={`rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer ${
                                offer.isActive
                                  ? "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
                                  : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              }`}
                            >
                              {offer.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {offer.isActive ? "إخفاء العرض" : "إظهار العرض"}
                            </DropdownMenuItem>

                            <DropdownMenuItem 
                              onClick={() => handleDelete(offer.id)}
                              className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" /> حذف (أرشفة)
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => handleDelete(offer.id, true)}
                              className="rounded-xl px-3 py-2.5 text-[10px] font-black gap-3 cursor-pointer text-red-700 uppercase tracking-tighter"
                            >
                              حذف نهائي من النظام
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                  </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredOffers.length}
          itemsLabel="عرض"
        />
      </div>
    </div>
  );
}
