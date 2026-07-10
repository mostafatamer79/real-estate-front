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
  AlertTriangle,
  Plus,
  X,
  User,
  UserCheck,
  Check,
  SaudiRiyalIcon
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import api, { usersApi } from "@/lib/api";
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
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [savePopupOpen, setSavePopupOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceSearchTerm, setPriceSearchTerm] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const [activePanel, setActivePanel] = useState<"requests" | "pricing" | "availability">("requests");
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
  const filteredPricingServices = activeCategoryServices.filter((service) =>
    service.toLowerCase().includes(priceSearchTerm.trim().toLowerCase())
  );
  const pricedServicesCount = activeCategoryServices.filter((service) => {
    const key = makeServicePriceKey(activeServiceCategory, service);
    return Number(localServicePrices[key] || 0) > 0;
  }).length;

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
        setSavePopupOpen(true);
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
    const targetDepartment = request.targetDepartment;
    const serviceText = `${request.serviceType || ""} ${request.description || ""}`.toLowerCase();
    if (activeServiceCategory === "legal") return category === "legal" || targetDepartment === "legal";
    if (activeServiceCategory === "legal_disputes") return (category === "legal" || targetDepartment === "legal") && /(منازعة|نزاع|نزاعات|dispute)/i.test(serviceText);
    if (activeServiceCategory === "legal_contracts") return (category === "legal" || targetDepartment === "legal") && /(عقد|العقود|contracts|contract)/i.test(serviceText);
    if (activeServiceCategory === "legal_documentation") return (category === "legal" || targetDepartment === "legal") && /(توثيق|documentation|deed)/i.test(serviceText);
    if (activeServiceCategory === "legal_other") {
      return (category === "legal" || targetDepartment === "legal") && !/(منازعة|نزاع|نزاعات|dispute|عقد|العقود|contracts|contract|توثيق|documentation|deed)/i.test(serviceText);
    }
    if (activeServiceCategory === "marketing") return category === "marketing" || targetDepartment === "marketing";
    if (activeServiceCategory === "postPurchase") return category === "postPurchase" || category === "post_purchase";
    if (activeServiceCategory === "construction") return category === "construction" || targetDepartment === "construction";
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
    <div className="space-y-10 p-6 lg:p-4 sm:p-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <Settings2 className="w-3 h-3" />
            تكوين الخدمات
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-950">
            {t('admin.services_mgmt.title') === 'admin.services_mgmt.title' ? "إدارة الخدمات والتسعير" : t('admin.services_mgmt.title')}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            التحكم في ظهور الخدمات للعملاء، ضبط الأسعار، وتعديل حالات التوفر
          </p>
        </div>

        <button 
          onClick={() => setConfirmSaveOpen(true)}
          disabled={saving}
          className="bg-slate-950 text-white px-8 py-4 rounded-[1rem] text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-2xl shadow-stone-400/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ جميع التغييرات
        </button>
      </header>



      <div className="grid grid-cols-1 gap-3 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[
          { id: "requests", label: "الطلبات", desc: "عرض كامل، رد على العميل، تسعير الطلب وإرسال الفاتورة", icon: FileText, count: filteredServiceRequests.length },
          { id: "pricing", label: "تسعير المنتجات", desc: "تعديل أسعار المنتجات والخدمات الجديدة", icon: SaudiRiyalIcon, count: activeCategoryServices.length },
          { id: "availability", label: "تفعيل الخدمات", desc: "تشغيل أو تعطيل ظهور الخدمات للعملاء", icon: Settings2, count: visibleServiceCategories.length },
        ].map((panel) => {
          const Icon = panel.icon;
          const active = activePanel === panel.id;
          return (
            <button
              key={panel.id}
              type="button"
              onClick={() => setActivePanel(panel.id as "requests" | "pricing" | "availability")}
              className={`rounded-2xl border p-5 text-right transition-all ${
                active ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-stone-400/10" : "border bg-card text-slate-600 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${active ? "bg-card/10 text-white" : "bg-muted text-slate-400"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-card text-slate-950" : "bg-muted text-slate-500"}`}>
                  {panel.count}
                </span>
              </div>
              <p className="mt-4 text-sm font-black">{panel.label}</p>
              <p className={`mt-1 text-[11px] font-bold leading-5 ${active ? "text-white/60" : "text-slate-400"}`}>{panel.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <div className={`lg:col-span-2 space-y-8 ${activePanel !== "availability" ? "hidden" : ""}`}>
          <div className="flex items-center gap-3 border-b border pb-4">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">أقسام الخدمات وتوفرها</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {visibleServiceCategories.map((cat) => {
              const status = localModuleFlags[`services_${cat.id}`] || 'enabled';
              return (
                <div key={cat.id} className="p-3 sm:p-6 bg-card border border rounded-[1.25rem] shadow-sm hover:border-slate-900/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-muted text-slate-600 flex items-center justify-center border border">
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
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'enabled' ? 'bg-slate-950 text-white border-slate-950' : 'bg-muted text-slate-400 border hover:border'}`}
                    >
                      نشط
                    </button>
                    <button
                      onClick={() => handleToggleModule(cat.id, 'soon')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'soon' ? 'ring-2 ring-slate-900/5' : 'bg-muted text-slate-400 border hover:border'}`}
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
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${status === 'disabled' ? 'bg-red-500 text-white border-red-500' : 'bg-muted text-slate-400 border hover:border'}`}
                    >
                      معطل
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`lg:col-span-3 space-y-6 ${activePanel !== "pricing" ? "hidden" : ""}`}>
          <div className="rounded-[1.25rem] border border bg-card p-3 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <SaudiRiyalIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">تسعير {activeCategoryConfig.label}</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">حدد سعر كل خدمة كما سيظهر في الطلبات الجديدة والفواتير.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border bg-muted px-4 py-3 text-center">
                  <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-950">{activeCategoryServices.length}</p>
                  <p className="text-[10px] font-black text-slate-400">خدمة</p>
                </div>
                <div className="rounded-2xl border border bg-muted px-4 py-3 text-center">
                  <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-950">{pricedServicesCount}</p>
                  <p className="text-[10px] font-black text-slate-400">مسعرة</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-right sm:col-span-1">
                  <div className="flex items-start gap-2 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-[11px] font-bold leading-5">تغيير السعر يؤثر على الطلبات الجديدة فقط.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border pt-5 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:w-[95vw] sm:max-w-md">
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={priceSearchTerm}
                  onChange={(event) => setPriceSearchTerm(event.target.value)}
                  placeholder="ابحث عن خدمة لتعديل سعرها..."
                  className="h-12 w-full rounded-2xl border border bg-muted pr-11 pl-4 text-sm font-bold outline-none transition-all focus:border-slate-950 focus:bg-card"
                />
              </div>
              <button
                onClick={() => setConfirmSaveOpen(true)}
                disabled={saving}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-black disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ الأسعار
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredPricingServices.map((service, index) => {
              const key = makeServicePriceKey(activeServiceCategory, service);
              const value = localServicePrices[key] || "";
              const hasPrice = Number(value || 0) > 0;
              return (
                <div key={key} className="rounded-[1.25rem] border border bg-card p-5 shadow-sm transition-all hover:border-slate-300">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="mb-2 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-slate-400">
                        خدمة {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="line-clamp-2 text-sm font-black leading-6 text-slate-950">{service}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${hasPrice ? "bg-emerald-50 text-emerald-700" : "bg-muted text-slate-400"}`}>
                      {hasPrice ? "مسعر" : "بدون سعر"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border bg-muted p-2">
                    <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        value={value}
                        onChange={(event) => handlePriceChange(key, event.target.value)}
                        className="h-10 min-w-0 flex-1 bg-transparent text-lg font-black tabular-nums text-slate-950 outline-none placeholder:text-slate-300"
                        placeholder="0.00"
                      />
                      <span className="rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white"><SaudiRiyalSymbol iconClassName="h-4 w-4 text-white" /></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPricingServices.length === 0 && (
            <div className="rounded-[1.25rem] border border-dashed border bg-card p-12 text-center">
              <p className="text-sm font-black text-slate-400">لا توجد خدمة مطابقة للبحث</p>
            </div>
          )}
        </div>
      </div>

      <section className={`space-y-6 border-t border pt-10 ${activePanel !== "requests" ? "hidden" : ""}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
              <Wrench className="h-3 w-3" />
              إدارة طلبات الخدمات
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">طلبات {activeCategoryConfig.label}</h2>
            <p className="text-sm font-medium text-slate-500">كل طلبات هذا القسم في مكان واحد: تعديل الحالة، تسعير الطلب، إرسال الفاتورة، والرد على العميل.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-all"
            >
              <Plus className="h-4 w-4" />
              إضافة طلب خدمة
            </button>
            <button
              onClick={loadRequests}
              disabled={loadingRequests}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border bg-card px-5 text-[10px] font-black uppercase tracking-widest text-slate-600"
            >
              {loadingRequests ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
              تحديث
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-end">
          <div className="relative w-full xl:w-96">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="بحث باسم العميل، الجوال، المدينة أو الخدمة"
              className="h-12 w-full rounded-2xl border border bg-card pr-11 pl-4 text-sm font-bold outline-none focus:border-slate-950"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.25rem] border border bg-card shadow-sm">
          {loadingRequests ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">جاري تحميل الطلبات</p>
            </div>
          ) : visibleServiceRequests.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-right">
                <thead>
                  <tr className="border-b border bg-muted/70">
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
                      <tr key={request.id} className="align-top hover:bg-muted/50">
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
                            className="h-10 w-36 rounded-xl border border bg-card px-3 text-xs font-black outline-none"
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="assigned">تم التعيين</option>
                            <option value="in_progress">قيد المعالجة</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={draft.targetDepartment}
                            onChange={(event) => updateRequestDraft(request, "targetDepartment", event.target.value)}
                            className="h-10 w-36 rounded-xl border border bg-card px-3 text-xs font-black outline-none"
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
                            className="h-10 w-28 rounded-xl border border bg-card px-3 text-xs font-black outline-none"
                          />
                        </td>
                        <td className="px-5 py-4">
                          <textarea
                            value={draft.description}
                            onChange={(event) => updateRequestDraft(request, "description", event.target.value)}
                            className="h-20 w-56 resize-none rounded-xl border border bg-card px-3 py-2 text-xs font-bold leading-5 outline-none"
                          />e
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-2">
                            <input
                              type="number"
                              min="0"
                              value={invoiceDrafts[request.id] ?? draft.price}
                              onChange={(event) => setInvoiceDrafts((current) => ({ ...current, [request.id]: event.target.value }))}
                              className="h-10 w-28 rounded-xl border border bg-card px-3 text-xs font-black outline-none"
                            />
                            <button
                              disabled={saving}
                              onClick={() => sendInvoice(request)}
                              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-[9px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                            >
                              <SaudiRiyalIcon className="h-3.5 w-3.5" />
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
                              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border bg-card px-3 text-[9px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-50"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              رد على العميل
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
              className="h-10 rounded-xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 disabled:opacity-40"
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

      {showCreateModal && (
        <CreateServiceRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadRequests}
        />
      )}

      <Dialog open={confirmSaveOpen} onOpenChange={setConfirmSaveOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-[1.25rem] border border bg-card p-0 shadow-2xl" dir="rtl">
          <div className="p-7">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <DialogHeader className="space-y-2 text-right">
              <DialogTitle className="text-xl font-black text-slate-950">تأكيد حفظ التغييرات</DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-slate-500">
                سيتم حفظ أسعار وإعدادات الخدمات الحالية. الأسعار الجديدة ستؤثر على الطلبات الجديدة في المنصة.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 rounded-2xl border border bg-muted p-4">
              <div className="flex items-center justify-between text-sm font-black text-slate-700">
                <span>{activeCategoryConfig.label}</span>
                <span>{pricedServicesCount} خدمة مسعرة</span>
              </div>
            </div>
            <DialogFooter className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmSaveOpen(false)}
                className="h-12 rounded-2xl border text-xs font-black text-slate-600"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={async () => {
                  setConfirmSaveOpen(false);
                  await handleSave();
                }}
                className="h-12 rounded-2xl bg-slate-950 text-xs font-black text-white hover:bg-black disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الحفظ"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={savePopupOpen} onOpenChange={setSavePopupOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-[1.25rem] border border bg-card p-0 shadow-2xl" dir="rtl">
          <div className="p-7 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <DialogHeader className="space-y-2 text-center">
              <DialogTitle className="text-xl font-black text-slate-950">تم حفظ التغييرات</DialogTitle>
              <DialogDescription className="text-sm font-bold leading-6 text-slate-500">
                تم تحديث إعدادات الخدمات والأسعار بنجاح. ستظهر الأسعار الجديدة على الطلبات الجديدة في المنصة.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 rounded-2xl border border bg-muted p-4">
              <div className="flex items-center justify-between text-sm font-black text-slate-700">
                <span>{activeCategoryConfig.label}</span>
                <span>{pricedServicesCount} خدمة مسعرة</span>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                onClick={() => setSavePopupOpen(false)}
                className="h-12 w-full rounded-2xl bg-slate-950 text-xs font-black text-white hover:bg-black"
              >
                تم
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateServiceRequestModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateServiceRequestModal({ onClose, onSuccess }: CreateServiceRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [clientMode, setClientMode] = useState<"registered" | "anonymous">("anonymous");

  const modalServiceTypes: Record<string, string[]> = {
    postPurchase: ["الغاز", "نقل وتركيب الأثاث", "التأمين على المنزل", "الصيانة (سباكة / كهرباء)", "خدمة التنظيف", "تنسيق حدائق", "أنظمة أمنية", "أخرى"],
    legal: ["المنازعات العقارية", "العقود", "التوثيق", "استشارة قانونية", "نزاعات الملكية", "عقود البيع والإيجار", "قضايا الرهن العقاري", "مخالفات البناء", "نزع الملكية للمصلحة العامة", "مشاكل في مشاريع التطوير", "قضايا التركات العقارية", "عقد بيع", "عقد إيجار", "عقد الانتفاع العقاري", "عقد الهبة العقاري", "عقد الرهن العقاري", "عقد الاستثمار العقاري", "مراجعة العقود", "توثيق صك الملكية", "توثيق مستندات البيع", "توثيق بيانات الأطراف", "تقرير قانوني", "خدمة قانونية مخصصة", "أخرى"],
    construction: ["مقاول عظم", "تصميم هندسي", "تشطيبات", "كهرباء", "سباكة", "نجارة", "دهانات", "ألمنيوم", "إشراف هندسي", "تصميم داخلي", "أخرى"],
    marketing: ["تصوير فوتوغرافي للعقار", "حملة إعلانية (وسائل التواصل الاجتماعي)", "حملة إعلانية (إعلانات طرق/تقليدية)", "أخرى"],
    other: ["التقييم العقاري", "المسح الهندسي", "أخرى"],
  };

  const [form, setForm] = useState({
    category: "postPurchase",
    serviceType: "الغاز",
    clientName: "",
    phone: "",
    city: "الرياض",
    district: "",
    quantity: 1,
    price: 0,
    description: "",
    status: "pending",
    userId: "",
  });

  useEffect(() => {
    usersApi.findAll()
      .then((res) => setUsers(res.data || []))
      .catch((err) => console.error("Error loading users:", err))
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleCategoryChange = (category: string) => {
    const types = modalServiceTypes[category] || [];
    setForm((f) => ({
      ...f,
      category,
      serviceType: types[0] || "",
    }));
  };

  const filteredUsers = users.filter((u) => {
    const term = userSearch.toLowerCase();
    if (!term) return true;
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(term) || phone.includes(term) || email.includes(term);
  }).slice(0, 5);

  const selectRegisteredUser = (u: any) => {
    setForm((f) => ({
      ...f,
      userId: u.id,
      clientName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      phone: u.phone || u.email || "",
    }));
    setUserSearch(`${u.firstName || ""} ${u.lastName || ""}`.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.clientName.trim()) {
      toast.error("الرجاء إدخال اسم العميل");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("الرجاء إدخال رقم الجوال");
      return;
    }
    if (!form.district.trim()) {
      toast.error("الرجاء إدخال الحي");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        price: Number(form.price) || 0,
        userId: form.userId || undefined,
      };

      await api.post("/service-requests", payload);
      toast.success("تم إنشاء طلب الخدمة بنجاح");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "فشل إنشاء طلب الخدمة");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
  const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";
  const pillBtn = (active: boolean) =>
    `h-10 px-4 rounded-2xl text-xs font-black transition-all border ${
      active ? "bg-slate-950 text-white border-slate-950 shadow-sm" : "bg-card text-slate-500 border hover:border"
    }`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card w-full w-[95vw] sm:max-w-2xl rounded-[1rem] p-4 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto hide-scrollbar"
      >
        <button
          onClick={onClose}
          className="absolute left-8 top-8 p-2 text-slate-300 hover:text-slate-950 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-950">إضافة طلب خدمة جديد</h2>
            <p className="text-xs text-slate-400 font-bold">إنشاء طلب خدمة وتعيين العميل والتفاصيل المطلوبة</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
          {/* Client Selection Section */}
          <div className="bg-muted/50 p-5 rounded-2xl border border-/80 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">معلومات العميل</h3>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  اختر عميلاً مسجلاً أو أدخل بيانات عميل مجهول.
                </p>
              </div>
              <div className="flex p-1 bg-card rounded-2xl border border w-fit">
                <button
                  type="button"
                  className={pillBtn(clientMode === "registered")}
                  onClick={() => setClientMode("registered")}
                >
                  عميل مسجل
                </button>
                <button
                  type="button"
                  className={pillBtn(clientMode === "anonymous")}
                  onClick={() => {
                    setClientMode("anonymous");
                    setForm((f) => ({ ...f, userId: "", clientName: "", phone: "" }));
                    setUserSearch("");
                  }}
                >
                  عميل مجهول
                </button>
              </div>
            </div>

            {clientMode === "registered" ? (
              <div className="space-y-2">
                <label className={labelCls}>ابحث عن المستخدم</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم، البريد الإلكتروني أو الجوال..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      if (form.userId) {
                        setForm((f) => ({ ...f, userId: "", clientName: "", phone: "" }));
                      }
                    }}
                    className={inputCls}
                  />
                  {loadingUsers && (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}
                  {userSearch && !form.userId && filteredUsers.length > 0 && (
                    <div className="absolute right-0 left-0 top-full mt-2 bg-card border border rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
                      {filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => selectRegisteredUser(u)}
                          className="w-full text-right p-3 hover:bg-muted rounded-xl transition-all flex items-center justify-between group"
                        >
                          <div>
                            <div className="text-sm font-black text-slate-800">
                              {u.firstName || ""} {u.lastName || ""}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1">
                              {u.phone || u.email || "لا يوجد اتصال"}
                            </div>
                          </div>
                          <UserCheck className="w-4 h-4 text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>اسم العميل المجهول</label>
                  <input
                    type="text"
                    required
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className={inputCls}
                    placeholder=": محمد أحمد"
                  />
                </div>
                <div>
                  <label className={labelCls}>هاتف العميل</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputCls}
                    placeholder="05xxxxxxxx"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Service Classification & Type */}
          <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>تصنيف الخدمة</label>
              <select
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
              >
                <option value="postPurchase">خدمات ما بعد الشراء</option>
                <option value="legal">الخدمات القانونية</option>
                <option value="construction">البناء والمقاولات</option>
                <option value="marketing">خدمات التسويق</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>نوع الخدمة</label>
              <select
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                className="w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
              >
                {(modalServiceTypes[form.category] || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Details & Price & Quantity */}
          <div className="grid grid-cols-2 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>المدينة</label>
              <input
                type="text"
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>الحي</label>
              <input
                type="text"
                required
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className={inputCls}
                placeholder="اسم الحي"
              />
            </div>
            <div>
              <label className={labelCls}>الكمية</label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>السعر التقريبي</label>
              <input
                type="number"
                min="0"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className={inputCls}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>وصف وتفاصيل الطلب</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full h-28 bg-muted border-transparent border focus:border-slate-950 rounded-xl p-4 text-sm font-bold outline-none transition-all resize-none"
              placeholder="اكتب هنا أي تفاصيل أو ملاحظات إضافية حول الخدمة المطلوبة..."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-4 pt-4 border-t border">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-950 hover:bg-black text-white h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              إنشاء الطلب
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 border border hover:bg-muted text-slate-600 h-12 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
