"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  User as UserIcon, 
  Briefcase, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  Loader2,
  Package,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Ban,
  Trash2,
  RefreshCw,
  Plus,
  X,
  DollarSign,
  Save
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { adminSubscriptionsApi, usersApi, packagesApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Helper to normalize backend Arabic status to English
const normalizeStatus = (status: string) => {
  if (status === 'نشط') return 'active';
  if (status === 'منتهي') return 'expired';
  if (status === 'ملغي') return 'cancelled';
  if (status === 'معلق') return 'pending';
  return status;
};

function CreateSubscriptionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    userId: "",
    packageId: "",
    subscriptionType: "سنوي", // Default to Arabic enum as per backend entity
    amount: 0,
    startDate: new Date().toISOString().split('T')[0],
    paymentMethod: "بطاقة ائتمان", // Default to Arabic enum
    status: "نشط", // Default to Arabic enum
    noExpiry: false,
    notes: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, pRes] = await Promise.all([
          usersApi.findAll(),
          packagesApi.findAll()
        ]);
        setUsers(uRes.data || []);
        setPackages(pRes.data || []);
      } catch (err) {
        toast.error("خطأ في تحميل البيانات");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => 
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  ).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId) return toast.error("يرجى اختيار المستخدم");
    if (!form.packageId) return toast.error("يرجى اختيار الباقة");

    setLoading(true);
    try {
      await adminSubscriptionsApi.create(form);
      toast.success("تم إنشاء الاشتراك بنجاح");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "فشل في إنشاء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-slate-50 border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"><X className="w-5 h-5" /></button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">إنشاء اشتراك جديد</h2>
            <p className="text-xs text-slate-400 font-bold">تخصيص باقة لمستخدم بشكل يدوي</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* User Selection */}
            <div className="space-y-1 relative">
              <label className={labelCls}>المستخدم (بحث)</label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  value={userSearch} 
                  onChange={e => { setUserSearch(e.target.value); if(form.userId) setForm(f => ({...f, userId: ""})) }} 
                  className="w-full h-11 bg-slate-50 border-transparent border focus:border-slate-950 rounded-xl pr-10 pl-4 text-sm font-bold outline-none transition-all" 
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..." 
                />
              </div>
              {userSearch && !form.userId && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden">
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <button key={u.id} type="button" onClick={() => { setForm(f => ({...f, userId: u.id})); setUserSearch(`${u.firstName} ${u.lastName}`); }} className="w-full px-4 py-3 text-right hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0">
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

            {/* Package Selection */}
            <div className="space-y-1">
              <label className={labelCls}>الباقة</label>
              <select value={form.packageId} onChange={e => {
                const pkg = packages.find(p => p.id === e.target.value);
                setForm(f => ({...f, packageId: e.target.value, amount: pkg ? (f.subscriptionType === 'سنوي' ? pkg.yearlyPrice : pkg.monthlyPrice) : 0}));
              }} className={inputCls}>
                <option value="">اختر باقة...</option>
                {packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>نوع الاشتراك</label>
              <select value={form.subscriptionType} onChange={e => setForm(f => ({...f, subscriptionType: e.target.value}))} className={inputCls}>
                <option value="سنوي">سنوي</option>
                <option value="شهري">شهري</option>
                <option value="مخصص">مخصص</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>تاريخ البدء</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className={labelCls}>طريقة الدفع</label>
              <select value={form.paymentMethod} onChange={e => setForm(f => ({...f, paymentMethod: e.target.value}))} className={inputCls}>
                <option value="بطاقة ائتمان">بطاقة ائتمان</option>
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="نقدي">نقدي</option>
                <option value="مدى">مدى</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelCls}>المبلغ</label>
              <div className="relative">
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: parseFloat(e.target.value)}))} className={inputCls} />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">ر.س</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">اشتراك غير محدود (لا ينتهي)</span>
            </div>
            <button type="button" onClick={() => setForm(f => ({...f, noExpiry: !f.noExpiry}))} className={`w-10 h-5 rounded-full p-1 transition-all ${form.noExpiry ? 'bg-slate-950' : 'bg-slate-200'}`}>
              <div className={`w-3 h-3 bg-white rounded-full transition-all ${form.noExpiry ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full h-12 bg-slate-950 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ وإنشاء الاشتراك
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default function AdminSubscriptionsPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await adminSubscriptionsApi.findAll();
      if (res.data) {
        setSubscriptions(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch subscriptions", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleActivate = async (id: string) => {
    try {
      await adminSubscriptionsApi.activate(id);
      toast.success(language === 'ar' ? "تم تفعيل الاشتراك بنجاح" : "Subscription activated successfully");
      fetchSubscriptions();
    } catch (error) {
      toast.error(language === 'ar' ? "فشل تفعيل الاشتراك" : "Activation failed");
    }
  };

  const handleCancel = async (id: string) => {
    const reason = prompt(language === 'ar' ? "سبب الإلغاء:" : "Reason for cancellation:");
    if (reason === null) return;

    try {
      await adminSubscriptionsApi.cancel(id, reason);
      toast.success(language === 'ar' ? "تم إلغاء الاشتراك" : "Subscription cancelled");
      fetchSubscriptions();
    } catch (error) {
      toast.error(language === 'ar' ? "فشل إلغاء الاشتراك" : "Cancellation failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد من حذف هذا الاشتراك نهائياً؟" : "Are you sure you want to permanently delete this subscription?")) return;
    try {
      await adminSubscriptionsApi.delete(id);
      toast.success("تم حذف الاشتراك");
      fetchSubscriptions();
    } catch (err) {
      toast.error("فشل الحذف");
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const normStatus = normalizeStatus(sub.status);
    return (statusFilter === "all" || normStatus === statusFilter) &&
    (
        `${sub.user?.firstName} ${sub.user?.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        sub.managementPackage?.name?.toLowerCase().includes(search.toLowerCase()) ||
        sub.id.includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const normStatus = normalizeStatus(status);
    switch (normStatus) {
      case 'active': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">نشط</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">معلق</Badge>;
      case 'expired': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">منتهي</Badge>;
      case 'cancelled': return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">ملغي</Badge>;
      default: return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <AnimatePresence>
        {isModalOpen && <CreateSubscriptionModal onClose={() => setIsModalOpen(false)} onSuccess={fetchSubscriptions} />}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <CreditCard className="w-3 h-3" />
            إدارة الاشتراكات
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t('admin.subscriptions.title') || "إدارة اشتراكات المستخدمين"}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            متابعة الاشتراكات النشطة، تفعيل الحزم، وإدارة دورات الفوترة للمستخدمين
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 px-6 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-950/20"
          >
            <Plus className="w-4 h-4" />
            إضافة اشتراك
          </button>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث باسم المشترك أو الباقة..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-64 text-sm font-bold shadow-sm"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-bold shadow-sm"
          >
            <option value="all">كل الحالات</option>
            <option value="active">نشط</option>
            <option value="pending">معلق</option>
            <option value="expired">منتهي</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'إجمالي المشتركين', val: subscriptions.length, icon: UserIcon, bg: 'bg-slate-50', color: 'text-slate-950' },
           { label: 'اشتراكات نشطة', val: subscriptions.filter(s => normalizeStatus(s.status) === 'active').length, icon: Zap, bg: 'bg-emerald-50', color: 'text-emerald-600' },
           { label: 'بانتظار التفعيل', val: subscriptions.filter(s => normalizeStatus(s.status) === 'pending').length, icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
           { label: 'تم إلغاؤها', val: subscriptions.filter(s => normalizeStatus(s.status) === 'cancelled').length, icon: Ban, bg: 'bg-red-50', color: 'text-red-600' },
         ].map((card, i) => (
           <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            key={i} 
            className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm"
           >
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-2xl font-black ${card.color}`}>{card.val}</p>
           </motion.div>
         ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المشترك</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الباقة</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">تاريخ البدء</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">تاريخ الانتهاء</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الحالة</TableHead>
                <TableHead className="py-6 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-2" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">جاري التحميل...</span>
                  </TableCell>
                </TableRow>
              ) : filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold">لا يوجد اشتراكات مطابقة</TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-500 border border-slate-200/50">
                          {sub.user?.firstName?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-950 text-sm">{sub.user?.firstName} {sub.user?.lastName}</span>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">{sub.user?.email || 'بدون إيميل'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-black text-slate-900 text-xs">
                            {language === 'ar' ? sub.managementPackage?.name : sub.managementPackage?.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">ID: {sub.packageId?.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                        {new Date(sub.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                        {sub.noExpiry ? 'غير محدود' : (sub.endDate ? new Date(sub.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'غير محدد')}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      {getStatusBadge(sub.status)}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-left">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-950">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                          {normalizeStatus(sub.status) === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleActivate(sub.id)}
                              className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            >
                              <ShieldCheck className="w-4 h-4" /> تفعيل الاشتراك
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer">
                            <RefreshCw className="w-4 h-4" /> تعديل المدة
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="my-1 bg-slate-50" />
                          
                          <DropdownMenuItem 
                            onClick={() => handleCancel(sub.id)}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                          >
                            <Ban className="w-4 h-4" /> إلغاء الاشتراك
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleDelete(sub.id)}
                            className="rounded-xl px-3 py-2.5 text-xs font-bold gap-3 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" /> حذف نهائي
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
      </div>
    </div>
  );
}
