"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Wrench, 
  Search, 
  Filter,
  Settings2, 
  Palette, 
  LayoutGrid, 
  ShieldAlert, 
  Zap,
  ShoppingBag,
  Scale,
  Hammer,
  Megaphone,
  MoreHorizontal,
  FileText,
  ChevronDown,
  Eye,
  EyeOff,
  DollarSign,
  ExternalLink,
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api from "@/lib/api";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function AdminServicesManagementPage() {
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const { settings, saveSettings, isLoading, refetch } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const [requestDrafts, setRequestDrafts] = useState<Record<string, { status: string; price: string; targetDepartment: string; description: string }>>({});
  const [invoiceDrafts, setInvoiceDrafts] = useState<Record<string, string>>({});
  
  // Local state for flags and prices to allow editing before saving
  const [localModuleFlags, setLocalModuleFlags] = useState<Record<string, 'enabled' | 'soon' | 'disabled'>>({});
  const [localServicePrices, setLocalServicePrices] = useState<Record<string, string>>({});


  useEffect(() => {
    if (settings) {
      setLocalModuleFlags(settings.moduleFlags || {});
      const prices: Record<string, string> = {};
      Object.entries(settings.servicePrices || {}).forEach(([k, v]) => {
        prices[k] = String(v);
      });
      setLocalServicePrices(prices);
    }
  }, [settings]);

  const nonLegalServiceCategories = [
    { id: 'postPurchase', label: 'خدمات ما بعد الشراء', icon: ShoppingBag },
    { id: 'construction', label: 'خدمات البناء والمقاولات', icon: Hammer },
    { id: 'marketing', label: 'خدمات التسويق', icon: Megaphone },
    { id: 'other', label: 'خدمات أخرى', icon: MoreHorizontal },
  ];
  const legalServiceCategories = [
    { id: 'legal', label: 'الخدمات القانونية', icon: Scale },
    { id: "legal_disputes", label: "القانونية: المنازعات", icon: Scale },
    { id: "legal_contracts", label: "القانونية: العقود", icon: FileText },
    { id: "legal_documentation", label: "القانونية: التوثيق", icon: ShieldAlert },
    { id: "legal_other", label: "القانونية: أخرى", icon: MoreHorizontal },
  ];
  const serviceCategories = [...nonLegalServiceCategories, ...legalServiceCategories];

  const serviceTypeToCategory: Record<string, string> = {
    post_purchase: "postPurchase",
    postPurchase: "postPurchase",
    legal: "legal",
    legal_disputes: "legal_disputes",
    legal_contracts: "legal_contracts",
    legal_documentation: "legal_documentation",
    legal_other: "legal_other",
    construction: "construction",
    marketing: "marketing",
    other: "other",
  };
  const typeParam = searchParams.get("type") || "post_purchase";
  const activeServiceCategory = serviceTypeToCategory[typeParam] || "postPurchase";

  const pricingCategories = [
    ...serviceCategories,
    { id: "legal_disputes", label: "القانونية: المنازعات العقارية", icon: Scale },
    { id: "legal_contracts", label: "القانونية: العقود", icon: FileText },
    { id: "legal_documentation", label: "القانونية: التوثيق", icon: ShieldAlert },
    { id: "legal_other", label: "القانونية: أخرى", icon: MoreHorizontal },
  ];

  const servicePriceGroups: Record<string, string[]> = {
    postPurchase: ["الغاز", "نقل وتركيب الأثاث", "التأمين على المنزل", "الصيانة (سباكة / كهرباء)", "خدمة التنظيف", "تنسيق حدائق", "أنظمة أمنية", "أخرى"],
    legal: ["المنازعات العقارية", "العقود", "التوثيق", "أخرى"],
    legal_disputes: ["نزاعات الملكية", "عقود البيع والإيجار", "قضايا الرهن العقاري", "مخالفات البناء", "نزع الملكية للمصلحة العامة", "مشاكل في مشاريع التطوير", "قضايا التركات العقارية", "أخرى"],
    legal_contracts: ["عقد بيع", "عقد إيجار", "عقد الانتفاع العقاري", "عقد الهبة العقاري", "عقد الرهن العقاري", "عقد الاستثمار العقاري", "مراجعة العقود", "أخرى"],
    legal_documentation: ["توثيق", "توثيق صك الملكية", "توثيق مستندات البيع", "توثيق بيانات الأطراف", "أخرى"],
    legal_other: ["استشارة قانونية", "تقرير قانوني", "خدمة قانونية مخصصة", "أخرى"],
    construction: ["مقاول عظم", "تصميم هندسي", "تشطيبات", "كهرباء", "سباكة", "نجارة", "دهانات", "ألمنيوم", "إشراف هندسي", "تصميم داخلي", "أخرى"],
    marketing: ["تصوير فوتوغرافي للعقار", "حملة إعلانية (وسائل التواصل الاجتماعي)", "حملة إعلانية (إعلانات طرق/تقليدية)", "أخرى"],
    other: ["التقييم العقاري", "المسح الهندسي", "أخرى"],
  };

  const makeServicePriceKey = (category: string, service: string) =>
    `service_price_${category}_${service}`.replace(/\s+/g, "_").toLowerCase();

  const activeCategoryConfig = pricingCategories.find((category) => category.id === activeServiceCategory) || serviceCategories[0];
  const activeCategoryServices = servicePriceGroups[activeServiceCategory] || [];
  const legalServiceNavigationTabs = [
    { id: "legal", type: "legal", label: "الخدمات القانونية", icon: Scale },
    { id: "legal_disputes", type: "legal_disputes", label: "القانونية: المنازعات", icon: Scale },
    { id: "legal_contracts", type: "legal_contracts", label: "القانونية: العقود", icon: FileText },
    { id: "legal_documentation", type: "legal_documentation", label: "القانونية: التوثيق", icon: ShieldAlert },
    { id: "legal_other", type: "legal_other", label: "القانونية: أخرى", icon: MoreHorizontal },
  ];
  const otherServiceNavigationTabs = [
    { id: "postPurchase", type: "post_purchase", label: "خدمات ما بعد الشراء", icon: ShoppingBag },
    { id: "construction", type: "construction", label: "البناء والمقاولات", icon: Hammer },
    { id: "marketing", type: "marketing", label: "خدمات التسويق", icon: Megaphone },
    { id: "other", type: "other", label: "أخرى", icon: MoreHorizontal },
  ];
  const isLegalServicesPage = activeServiceCategory === "legal" || activeServiceCategory.startsWith("legal_");
  const serviceNavigationTabs = isLegalServicesPage ? legalServiceNavigationTabs : otherServiceNavigationTabs;
  const visibleServiceCategories = isLegalServicesPage ? legalServiceCategories : nonLegalServiceCategories;

  const requestPageSize = 8;

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await api.get("/service-requests", { params: { page: 1, limit: 200 } });
      const data = response.data;
      setRequests(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch {
      toast.error("تعذر تحميل طلبات الخدمات");
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);



  const handleToggleModule = (categoryId: string, status: 'enabled' | 'soon' | 'disabled') => {
    const key = `services_${categoryId}`;
    setLocalModuleFlags(prev => ({ ...prev, [key]: status }));
  };

  const handlePriceChange = (serviceKey: string, value: string) => {
    setLocalServicePrices(prev => ({ ...prev, [serviceKey]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const numericPrices: Record<string, number> = {};
      Object.entries(localServicePrices).forEach(([k, v]) => {
        numericPrices[k] = parseFloat(v) || 0;
      });

      const ok = await saveSettings({
        ...settings,
        moduleFlags: { ...settings.moduleFlags, ...localModuleFlags },
        servicePrices: numericPrices
      });

      if (ok) {
        toast.success("تم حفظ إعدادات الخدمات بنجاح");
        await refetch();
      }
    } catch (error) {
      toast.error("فشل في حفظ التغييرات");
    } finally {
      setSaving(false);
    }
  };

  const getRequestDraft = (request: any) => requestDrafts[request.id] || {
    status: request.status || "pending",
    price: String(request.invoicePrice || request.price || ""),
    targetDepartment: request.targetDepartment || "real_estate",
    description: request.description || "",
  };

  const updateRequestDraft = (request: any, key: string, value: string) => {
    setRequestDrafts((current) => ({
      ...current,
      [request.id]: { ...getRequestDraft(request), [key]: value },
    }));
  };

  const saveRequest = async (request: any) => {
    const draft = getRequestDraft(request);
    setSaving(true);
    try {
      await api.put(`/service-requests/${request.id}`, {
        status: draft.status,
        price: Number(draft.price || 0),
        targetDepartment: draft.targetDepartment,
        description: draft.description,
      });
      toast.success("تم تحديث طلب الخدمة");
      setRequestDrafts((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      await loadRequests();
    } catch {
      toast.error("تعذر تحديث طلب الخدمة");
    } finally {
      setSaving(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    const ok = await confirmDialog({
      title: "حذف طلب الخدمة؟",
      description: "سيتم حذف هذا الطلب من القائمة الحالية.",
      confirmLabel: "حذف الطلب",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.delete(`/service-requests/${requestId}`);
      toast.success("تم حذف طلب الخدمة");
      await loadRequests();
    } catch {
      toast.error("تعذر حذف طلب الخدمة");
    } finally {
      setSaving(false);
    }
  };

  const sendInvoice = async (request: any) => {
    const amount = Number(invoiceDrafts[request.id] || getRequestDraft(request).price || request.price || 0);
    if (!amount || amount < 0) {
      toast.error("أدخل مبلغ الفاتورة");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/service-requests/${request.id}/send-invoice`, { price: amount });
      toast.success("تم إرسال الفاتورة للعميل");
      await loadRequests();
    } catch {
      toast.error("تعذر إرسال الفاتورة");
    } finally {
      setSaving(false);
    }
  };

  const openRequestChat = async (requestId: string) => {
    setSaving(true);
    try {
      const response = await api.post(`/service-requests/${requestId}/chat`);
      const chatRoomId = response.data?.chatRoomId;
      if (chatRoomId) router.push(`/chat/${chatRoomId}`);
    } catch {
      toast.error("تعذر فتح الشات");
    } finally {
      setSaving(false);
    }
  };

  const requestMatchesActiveCategory = (request: any) => {
    const category = request.category;
    const serviceText = `${request.serviceType || ""} ${request.description || ""}`.toLowerCase();
    if (activeServiceCategory === "legal") return category === "legal";
    if (activeServiceCategory === "legal_disputes") return category === "legal" && /(منازعة|نزاع|نزاعات|dispute)/i.test(serviceText);
    if (activeServiceCategory === "legal_contracts") return category === "legal" && /(عقد|العقود|contracts|contract)/i.test(serviceText);
    if (activeServiceCategory === "legal_documentation") return category === "legal" && /(توثيق|documentation|deed)/i.test(serviceText);
    if (activeServiceCategory === "legal_other") {
      return category === "legal" && !/(منازعة|نزاع|نزاعات|dispute|عقد|العقود|contracts|contract|توثيق|documentation|deed)/i.test(serviceText);
    }
    return category === activeServiceCategory;
  };

  const filteredServiceRequests = requests.filter((request) => {
    const matchesCategory = requestMatchesActiveCategory(request);
    const term = searchTerm.trim().toLowerCase();
    if (!term) return matchesCategory;
    return matchesCategory && (
      request.clientName?.toLowerCase().includes(term) ||
      request.serviceType?.toLowerCase().includes(term) ||
      request.phone?.includes(term) ||
      request.city?.toLowerCase().includes(term)
    );
  });

  const requestTotalPages = Math.max(1, Math.ceil(filteredServiceRequests.length / requestPageSize));
  const visibleServiceRequests = filteredServiceRequests.slice((requestPage - 1) * requestPageSize, requestPage * requestPageSize);


  useEffect(() => {
    setRequestPage(1);
  }, [activeServiceCategory, searchTerm]);

  if (isLoading || !settings) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-slate-900" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">جاري تحميل إعدادات النظام...</p>
    </div>
  );

  return (
    <div className="space-y-10 p-6 lg:p-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <Settings2 className="w-3 h-3" />
            تكوين الخدمات
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t('admin.services_mgmt.title') === 'admin.services_mgmt.title' ? "إدارة الخدمات والتسعير" : t('admin.services_mgmt.title')}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            التحكم في ظهور الخدمات للعملاء، ضبط الأسعار، وتعديل حالات التوفر
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-950 text-white px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-2xl shadow-slate-950/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ جميع التغييرات
        </button>
      </header>

      <nav className="rounded-[2rem] border border-slate-100 bg-white p-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {serviceNavigationTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeServiceCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => router.push(`/admin/services?type=${tab.type}`)}
                className={`flex min-w-fit items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  active ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">أقسام الخدمات وتوفرها</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {visibleServiceCategories.map((cat) => {
              const status = localModuleFlags[`services_${cat.id}`] || 'enabled';
              return (
                <div key={cat.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-slate-900/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                      <cat.icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900">{cat.label}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: services_{cat.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleToggleModule(cat.id, 'enabled')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'enabled' ? 'bg-slate-950 text-white border-slate-950' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      نشط
                    </button>
                    <button 
                      onClick={() => handleToggleModule(cat.id, 'soon')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'soon' ? 'ring-2 ring-slate-900/5' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                      style={
                        status === 'soon'
                          ? {
                              backgroundColor: 'var(--soon-badge-bg, #ffffff)',
                              color: 'var(--soon-badge-text, #000000)',
                              borderColor: 'var(--soon-badge-bg, #ffffff)',
                            }
                          : undefined
                      }
                    >
                      قريباً
                    </button>
                    <button 
                      onClick={() => handleToggleModule(cat.id, 'disabled')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'disabled' ? 'bg-red-500 text-white border-red-500' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                    >
                      معطل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
           <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <DollarSign className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">تسعير {activeCategoryConfig.label}</h2>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold leading-relaxed">تغيير الأسعار هنا سيؤثر فوراً على جميع الطلبات الجديدة في المنصة.</p>
            </div>

            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {activeCategoryServices.map((service) => {
                const key = makeServicePriceKey(activeServiceCategory, service);
                return (
                <div key={key} className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{service}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={localServicePrices[key] || ""} 
                      onChange={(e) => handlePriceChange(key, e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-slate-950 transition-all pr-12"
                      placeholder="0.00"
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">ر.س</span>
                  </div>
                </div>
              )})}
            </div>

            <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.2em] pt-4">كل خدمة في هذا القسم لها سعر مستقل ويحفظ في إعدادات الباكند</p>
          </div>
        </div>
      </div>

      <section className="space-y-6 border-t border-slate-100 pt-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
              <Wrench className="h-3 w-3" />
              إدارة طلبات الخدمات
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">الخدمات داخل لوحة الإدارة</h2>
            <p className="text-sm font-medium text-slate-500">تصفح طلبات العملاء حسب نوع الخدمة، عدل الحالة والسعر، أرسل الفاتورة، افتح الشات أو احذف الطلب.</p>
          </div>
          <button
            onClick={loadRequests}
            disabled={loadingRequests}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-slate-600"
          >
            {loadingRequests ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
            تحديث
          </button>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
          <div className="relative w-full xl:w-96">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="بحث باسم العميل، الجوال، المدينة أو الخدمة"
              className="h-12 w-full rounded-2xl border border-slate-100 bg-white pr-11 pl-4 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          {loadingRequests ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">جاري تحميل الطلبات</p>
            </div>
          ) : visibleServiceRequests.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-right">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">العميل</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الخدمة</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الحالة</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الإدارة</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">السعر</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">ملاحظات</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الفاتورة</th>
                    <th className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {visibleServiceRequests.map((request) => {
                    const draft = getRequestDraft(request);
                    return (
                      <tr key={request.id} className="align-top hover:bg-slate-50/50">
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-900">{request.clientName || request.user?.firstName || "—"}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-400">{request.phone || request.user?.phone || request.user?.email || "—"}</p>
                          <p className="mt-1 text-[10px] font-black text-slate-300">{request.city || "—"} · {request.district || "—"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-black text-slate-900">{request.serviceType || "—"}</p>
                          <p className="mt-1 text-[11px] font-bold text-slate-400">{new Date(request.createdAt).toLocaleDateString("ar-SA")}</p>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={draft.status}
                            onChange={(event) => updateRequestDraft(request, "status", event.target.value)}
                            className="h-10 w-36 rounded-xl border border-slate-100 bg-white px-3 text-xs font-black outline-none"
                          >
                            <option value="pending">pending</option>
                            <option value="assigned">assigned</option>
                            <option value="in_progress">in_progress</option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={draft.targetDepartment}
                            onChange={(event) => updateRequestDraft(request, "targetDepartment", event.target.value)}
                            className="h-10 w-36 rounded-xl border border-slate-100 bg-white px-3 text-xs font-black outline-none"
                          >
                            <option value="real_estate">الأملاك</option>
                            <option value="marketing">التسويق</option>
                            <option value="legal">القانونية</option>
                            <option value="finance">المالية</option>
                            <option value="employees">الموظفين</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            value={draft.price}
                            onChange={(event) => updateRequestDraft(request, "price", event.target.value)}
                            className="h-10 w-28 rounded-xl border border-slate-100 bg-white px-3 text-xs font-black outline-none"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <textarea
                            value={draft.description}
                            onChange={(event) => updateRequestDraft(request, "description", event.target.value)}
                            className="h-20 w-56 resize-none rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs font-bold leading-5 outline-none"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="0"
                              value={invoiceDrafts[request.id] ?? draft.price}
                              onChange={(event) => setInvoiceDrafts((current) => ({ ...current, [request.id]: event.target.value }))}
                              className="h-10 w-28 rounded-xl border border-slate-100 bg-white px-3 text-xs font-black outline-none"
                            />
                            <button
                              disabled={saving}
                              onClick={() => sendInvoice(request)}
                              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              إرسال
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            <button
                              disabled={saving}
                              onClick={() => saveRequest(request)}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                            >
                              <Save className="h-3.5 w-3.5" />
                              حفظ
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => openRequestChat(request.id)}
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              شات
                            </button>
                            <button
                              disabled={saving}
                              onClick={() => deleteRequest(request.id)}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-red-50 px-3 text-[9px] font-black uppercase tracking-widest text-red-600 disabled:opacity-50"
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3 text-slate-300">
              <MoreHorizontal className="h-10 w-10" />
              <p className="text-xs font-black uppercase tracking-widest">لا توجد طلبات في هذا القسم</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {filteredServiceRequests.length} طلب · صفحة {requestPage} من {requestTotalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={requestPage <= 1}
              onClick={() => setRequestPage((page) => Math.max(1, page - 1))}
              className="h-10 rounded-xl border border-slate-100 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40"
            >
              السابق
            </button>
            <button
              disabled={requestPage >= requestTotalPages}
              onClick={() => setRequestPage((page) => Math.min(requestTotalPages, page + 1))}
              className="h-10 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
