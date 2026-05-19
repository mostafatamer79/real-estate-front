"use client";

import React, { useState, useEffect } from "react";
import { 
  Wrench, 
  Search, 
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
  ChevronDown,
  Eye,
  EyeOff,
  DollarSign,
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminServicesManagementPage() {
  const { t, language } = useLanguage();
  const { settings, saveSettings, isLoading, refetch } = useSettings();
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const serviceCategories = [
    { id: 'postPurchase', label: 'خدمات ما بعد الشراء', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'legal', label: 'الخدمات القانونية', icon: Scale, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'construction', label: 'خدمات البناء والمقاولات', icon: Hammer, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'marketing', label: 'خدمات التسويق', icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'other', label: 'خدمات أخرى', icon: MoreHorizontal, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

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
            {t('admin.services_mgmt.title') || "إدارة الخدمات والتسعير"}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <LayoutGrid className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-black text-slate-900">أقسام الخدمات وتوفرها</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {serviceCategories.map((cat) => {
              const status = localModuleFlags[`services_${cat.id}`] || 'enabled';
              return (
                <div key={cat.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:border-slate-900/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center border border-current/5`}>
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
            <h2 className="text-lg font-black text-slate-900">تسعير الخدمات السريع</h2>
          </div>

          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-[10px] font-bold leading-relaxed">تغيير الأسعار هنا سيؤثر فوراً على جميع الطلبات الجديدة في المنصة.</p>
            </div>

            <div className="space-y-5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {[
                { key: 'service_price_postpurchase_الغاز', label: 'سعر خدمة الغاز' },
                { key: 'service_price_postpurchase_نقل_وتركيب_الأثاث', label: 'نقل الأثاث' },
                { key: 'service_price_legal_التوثيق_ونقل_الملكية', label: 'التوثيق العقاري' },
                { key: 'service_price_legal_صياغة_ومراجعة_العقود_العقارية', label: 'صياغة العقود' },
                { key: 'service_price_marketing_تصوير_فوتوغرافي_للعقار', label: 'تصوير فوتوغرافي' },
                { key: 'service_price_construction_تصميم_هندسي', label: 'تصميم هندسي' },
              ].map((item) => (
                <div key={item.key} className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{item.label}</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={localServicePrices[item.key] || ""} 
                      onChange={(e) => handlePriceChange(item.key, e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-5 text-sm font-bold outline-none focus:border-slate-950 transition-all pr-12"
                      placeholder="0.00"
                    />
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">ر.س</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] font-black text-slate-400 text-center uppercase tracking-[0.2em] pt-4">يمكن تعديل باقي الأسعار من صفحة الإعدادات العامة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
