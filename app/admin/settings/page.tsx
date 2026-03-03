"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  DollarSign, 
  Save, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles, 
  ArrowRight, 
  Info,
  History,
  Globe,
  Zap,
  ChevronDown,
  Settings2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
    const { t, language } = useLanguage();
    const [price, setPrice] = useState("");
    const [purchaseFee, setPurchaseFee] = useState("");
    const [taxPercentage, setTaxPercentage] = useState("");
    const [servicePrices, setServicePrices] = useState<Record<string, string>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({
        'construction': true,
        'legal': true,
        'marketing': true,
        'leasing': true,
        'other': true,
        'real-estate': true,
        'postPurchase': true
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const [priceRes, purchaseFeeRes, taxRes, allRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public/appointment_price`, { headers: { 'Authorization': `Bearer ${token}`} }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public/purchase_service_fee_percentage`, { headers: { 'Authorization': `Bearer ${token}`} }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings/public/tax_percentage`, { headers: { 'Authorization': `Bearer ${token}`} }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, { headers: { 'Authorization': `Bearer ${token}`} })
                ]);

                if (priceRes.ok) {
                    const data = await priceRes.json();
                    if(data.value) setPrice(data.value);
                }
                if (purchaseFeeRes.ok) {
                     const data = await purchaseFeeRes.json();
                     if(data.value) setPurchaseFee(data.value);
                }
                 if (taxRes.ok) {
                     const data = await taxRes.json();
                     if(data.value) setTaxPercentage(data.value);
                }

                if (allRes.ok) {
                    const allSettings = await allRes.json();
                    const prices: Record<string, string> = {};
                    allSettings.forEach((s: any) => {
                        if (s.key.startsWith('service_price_')) {
                            prices[s.key] = s.value;
                        }
                    });
                    setServicePrices(prices);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            
            // Save Settings
            const settingsToSave = [
                { key: 'appointment_price', value: price, description: 'Price for booking an appointment' },
                { key: 'purchase_service_fee_percentage', value: purchaseFee, description: 'Purchase Service Fee Percentage' },
                { key: 'tax_percentage', value: taxPercentage, description: 'Tax Percentage' },
                ...Object.entries(servicePrices).map(([key, value]) => ({ key, value }))
            ];

            const promises = settingsToSave.map(setting => 
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(setting)
                })
            );

            const results = await Promise.all(promises);
            const allOk = results.every(res => res.ok);

            if (allOk) {
                setMessage(t('admin.settings.updateSuccess') || "تم التحديث بنجاح");
            } else {
                setMessage(t('admin.settings.updateFail') || "فشل التحديث");
            }
        } catch (error) {
            setMessage(t('admin.settings.saveError') || "خطأ في الحفظ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
            </div>
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-[9px]">{t('admin.settings.loading')}</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-slate-900 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('admin.settings.lastUpdate')}</p>
                    <p className="text-sm font-black text-slate-900">{t('admin.settings.timeAgo')}</p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-slate-900 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('admin.settings.system')}</p>
                    <p className="text-sm font-black text-slate-900">{t('admin.settings.locale')}</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-slate-900 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('admin.settings.performance')}</p>
                    <p className="text-sm font-black text-slate-900">{t('admin.settings.perfStatus')}</p>
                  </div>
                </div>
            </div>
            {/* Header Section */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('admin.settings.title')}</h1>
                    <p className="text-slate-500 font-medium flex items-center gap-2 text-sm">
                      <Settings2 className="w-4 h-4 text-slate-400" />
                      {t('admin.settings.desc')}
                    </p>
                </div>
                
                <button 
                  onClick={handleSave}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-sm active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  {t('admin.settings.save')}
                </button>
            </section>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-12">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm bg-white"
                    >
                        <div className="p-6 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <Sparkles className="w-5 h-5 text-slate-900" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black">تسعير الخدمات</h3>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">ضبط الأسعار الافتراضية للخدمات</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-10">
                            {/* General Pricing */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-4">الإعدادات العامة</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 px-1">سعر حجز الموعد</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">ريال</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 px-1">عمولة الشراء (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={purchaseFee}
                                                onChange={(e) => setPurchaseFee(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12"
                                                placeholder="2.5"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-600 px-1">الضريبة (%)</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={taxPercentage}
                                                onChange={(e) => setTaxPercentage(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12"
                                                placeholder="15"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Service Categories */}
                            {[
                                { 
                                    category: 'postPurchase', 
                                    label: 'خدمات ما بعد الشراء', 
                                    services: ['الغاز', 'نقل وتركيب الأثاث', 'التأمين على المنزل', 'الصيانة (سباكة / كهرباء)', 'خدمة التنظيف', 'تنسيق حدائق', 'أنظمة أمنية'] 
                                },
                                { 
                                    category: 'legal', 
                                    label: 'الخدمات القانونية', 
                                    services: ['التوثيق ونقل الملكية', 'تحديث الصكوك', 'حل المنازعات العقارية', 'صياغة ومراجعة العقود العقارية', 'تقديم الاستشارات العقارية'] 
                                },
                                { 
                                    category: 'construction', 
                                    label: 'خدمات البناء والمقاولات', 
                                    services: ['مقاول عظم', 'تصميم هندسي', 'تشطيبات', 'كهرباء', 'سباكة', 'نجارة', 'دهانات', 'ألمنيوم', 'إشراف هندسي', 'تصميم داخلي'] 
                                },
                                { 
                                    category: 'marketing', 
                                    label: 'خدمات التسويق', 
                                    services: ['تصوير فوتوغرافي للعقار', 'حملة إعلانية (وسائل التواصل الاجتماعي)', 'حملة إعلانية (إعلانات طرق/تقليدية)'] 
                                },
                                { 
                                    category: 'leasing', 
                                    label: 'خدمات التأجير', 
                                    services: ['تأجير العقار', 'إدارة عقود الإيجار', 'تحصيل الإيجارات'] 
                                },
                                { 
                                    category: 'other', 
                                    label: 'خدمات أخرى', 
                                    services: ['التقييم العقاري', 'المسح الهندسي'] 
                                }
                            ].map((group) => (

                                <div key={group.category} className="space-y-4">
                                    <button 
                                        onClick={() => setCollapsedCategories(prev => ({ ...prev, [group.category]: !prev[group.category] }))}
                                        className="w-full flex items-center justify-between py-4 border-b border-slate-50 group/header"
                                    >
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] group-hover/header:text-slate-900 transition-colors">{group.label}</h4>
                                        <motion.div
                                            animate={{ rotate: collapsedCategories[group.category] ? 0 : 180 }}
                                            className="text-slate-300 group-hover/header:text-slate-900 transition-colors"
                                        >
                                            <ChevronDown className="w-4 h-4" />
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {!collapsedCategories[group.category] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 pt-2">
                                                    {group.services.map((service) => {
                                                        const key = `service_price_${group.category}_${service}`.replace(/\s+/g, '_').toLowerCase();
                                                        return (
                                                            <div key={service} className="space-y-2">
                                                                <label className="text-[11px] font-black text-slate-600 px-1">{service}</label>
                                                                <div className="relative">
                                                                    <input 
                                                                        type="number"
                                                                        value={servicePrices[key] || ""}
                                                                        onChange={(e) => setServicePrices(prev => ({ ...prev, [key]: e.target.value }))}
                                                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12"
                                                                        placeholder="السعر الافتراضي"
                                                                    />
                                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">ريال</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        <AnimatePresence>
                          {message && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="p-6 bg-slate-900 text-white flex items-center gap-4 border-t border-slate-800"
                              >
                                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                  <span className="text-xs font-black uppercase tracking-widest">{message}</span>
                              </motion.div>
                          )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                   {[
                     { title: t('admin.settings.logs'), desc: t('admin.settings.logsDesc'), icon: ShieldCheck, color: 'text-gray-600', bg: 'bg-slate-50' },
                     { title: t('admin.settings.commissions'), desc: t('admin.settings.commissionsDesc'), icon: DollarSign, color: 'text-gray-900', bg: 'bg-slate-100' }
                   ].map((item, i) => (
                     <motion.div
                       key={i}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.2 + (i * 0.1) }}
                       className="p-6 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:border-slate-900 transition-all group flex items-center justify-between cursor-pointer"
                     >
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-all`}>
                              <item.icon className="w-7 h-7" />
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900 mb-1">{item.title}</h4>
                              <p className="text-sm font-medium text-slate-400 max-w-[200px] leading-snug">{item.desc}</p>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                     </motion.div>
                   ))}
                </div>
            </div>
        </div>
    );
}
