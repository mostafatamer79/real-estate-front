'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings2, Save, Palette, Type, DollarSign, ShieldAlert, 
    ArrowRight, Loader2, History, X, ShieldCheck, Sparkles, 
    ChevronDown, Moon, Sun, Search, RefreshCw, Smartphone, 
    LayoutGrid, Zap, ShieldQuestion, Upload, ImageIcon
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { translations } from '@/context/translations';
import { toast } from 'sonner';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface TabProps {
    localSettings: any;
    updateSettings: (updates: any) => void;
    t: (key: string) => string;
}

interface PricingTabProps extends TabProps {
    price: string;
    setPrice: (v: string) => void;
    purchaseFee: string;
    setPurchaseFee: (v: string) => void;
    taxPercentage: string;
    setTaxPercentage: (v: string) => void;
    servicePrices: Record<string, string>;
    setServicePrices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    collapsedCategories: Record<string, boolean>;
    setCollapsedCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

interface TextTabProps extends TabProps {
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    textOverrides: Record<string, string>;
    setTextOverrides: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    language: string;
}

const TRANSLATION_CATEGORIES = [
    { id: 'all', label: 'الكل', prefixes: [] },
    { id: 'header_footer', label: 'الهوية والروابط', prefixes: ['header', 'footer', 'project'] },
    { id: 'auth', label: 'الدخول والأمان', prefixes: ['login', 'auth', 'otp', 'profile', 'notification'] },
    { id: 'dashboard', label: 'لوحة التحكم', prefixes: ['home', 'cards', 'action', 'map', 'chart', 'details', 'scan'] },
    { id: 'management', label: 'إدارة الأملاك', prefixes: ['pm', 'bm', 'property', 'unit', 'tenant'] },
    { id: 'services', label: 'الخدمات المالية والقانونية', prefixes: ['service', 'legal', 'marketing', 'fin', 'wallet', 'chat', 'payment', 'orders', 'offers', 'offer', 'invoice'] },
    { id: 'general', label: 'إعدادات النظام العامة', prefixes: ['common', 'status', 'range', 'pagination', 'city', 'country', 'cs', 'disputes'] },
];

// ─── Main Component ──────────────────────────────────────────────────────────

function SettingsPageInner() {
    const { t, language } = useLanguage();
    const { settings, saveSettings, isLoading, refetch } = useSettings();
    const [activeTab, setActiveTab] = useState<'pricing' | 'appearance' | 'text' | 'site_control'>('pricing');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [searchTerm, setSearchTerm] = useState("");
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [isCommissionModalOpen, setIsCommissionModalOpen] = useState(false);

    // Form states
    const [price, setPrice] = useState("");
    const [purchaseFee, setPurchaseFee] = useState("");
    const [taxPercentage, setTaxPercentage] = useState("");
    const [servicePrices, setServicePrices] = useState<Record<string, string>>({});
    const [textOverrides, setTextOverrides] = useState<Record<string, string>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [selectedTranslationCategory, setSelectedTranslationCategory] = useState('all');

    // Local settings sync
    const [localSettings, setLocalSettings] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && settings) {
            setPrice(settings.appointmentPrice.toString());
            setPurchaseFee(settings.purchaseFeePercentage.toString());
            setTaxPercentage(settings.taxPercentage.toString());
            setTextOverrides(settings.textOverrides || {});
            
            // Re-map nested objects to ensure clean state
            setLocalSettings({
                ...settings,
                sectionFlags: { ...settings.sectionFlags },
                sectionMessages: { ...settings.sectionMessages },
                moduleFlags: { ...(settings as any).moduleFlags },
                moduleMessages: { ...(settings as any).moduleMessages },
                loginConfig: { ...settings.loginConfig },
                uiFlags: { ...settings.uiFlags },
                texts: { ...settings.textOverrides }
            });
            
            const initialPrices: Record<string, string> = {};
            Object.entries(settings.servicePrices || {}).forEach(([k, v]) => {
                initialPrices[k] = (v as any).toString();
            });
            setServicePrices(initialPrices);
        }
    }, [isLoading, settings]);

    const updateSettings = (updates: any) => {
        setLocalSettings((prev: any) => ({ ...prev, ...updates }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        try {
            const numericServicePrices: Record<string, number> = {};
            Object.entries(servicePrices).forEach(([k, v]) => {
                numericServicePrices[k] = parseFloat(v) || 0;
            });

            const ok = await saveSettings({
                ...localSettings,
                appointmentPrice: parseFloat(price) || 0,
                purchaseFeePercentage: parseFloat(purchaseFee) || 2.5,
                taxPercentage: parseFloat(taxPercentage) || 15,
                servicePrices: numericServicePrices,
                textOverrides: { ...textOverrides, ...(localSettings.texts || {}) },
            });

            if (ok) {
                setMessageType('success');
                setMessage(t('admin.settings.updateSuccess') || "تم التحديث بنجاح");
                toast.success("تم تحديث الإعدادات بنجاح");
                // Trigger refetch from context to update the UI globally
                await refetch();
            } else {
                setMessageType('error');
                setMessage(t('admin.settings.updateFail') || "فشل التحديث");
            }
        } catch (error) {
            console.error("Save error:", error);
            setMessageType('error');
            setMessage(t('admin.settings.saveError') || "خطأ في الحفظ");
        } finally {
            setSaving(false);
            // Hide message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleSaveWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        await handleSave(e);
    };

    if (isLoading || !localSettings) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-slate-900 animate-spin" />
            <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-[9px]">{t('admin.settings.loading')}</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Settings2 className="w-8 h-8" />
                        {t('admin.settings.title')}
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">{t('admin.settings.desc')}</p>
                </div>
                <button onClick={handleSaveWrapper} disabled={saving} className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {t('admin.settings.save')}
                </button>
            </header>

            <nav className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-3xl w-fit">
                {[
                    { id: 'pricing', label: t('admin.settings.tab.pricing'), icon: DollarSign },
                    { id: 'appearance', label: t('admin.settings.tab.appearance'), icon: Palette },
                    { id: 'text', label: t('admin.settings.tab.text'), icon: Type },
                    { id: 'site_control', label: t('admin.settings.tab.control'), icon: ShieldAlert },
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </nav>
            
            <main className="rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl bg-white min-h-[500px]">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {activeTab === 'pricing' && (
                        <PricingTab 
                            localSettings={localSettings} updateSettings={updateSettings} t={t} 
                            price={price} setPrice={setPrice} 
                            purchaseFee={purchaseFee} setPurchaseFee={setPurchaseFee}
                            taxPercentage={taxPercentage} setTaxPercentage={setTaxPercentage}
                            servicePrices={servicePrices} setServicePrices={setServicePrices}
                            collapsedCategories={collapsedCategories} setCollapsedCategories={setCollapsedCategories}
                        />
                    )}
                    {activeTab === 'appearance' && (
                        <AppearanceTab localSettings={localSettings} updateSettings={updateSettings} t={t} />
                    )}
                    {activeTab === 'text' && (
                        <TextTab 
                            localSettings={localSettings} updateSettings={updateSettings} t={t}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            textOverrides={textOverrides} setTextOverrides={setTextOverrides}
                            language={language}
                            selectedCategory={selectedTranslationCategory}
                            setSelectedCategory={setSelectedTranslationCategory}
                        />
                    )}
                    {activeTab === 'site_control' && (
                        <SiteControlTab localSettings={localSettings} updateSettings={updateSettings} t={t} />
                    )}
                </motion.div>
                
                <AnimatePresence>
                    {message && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`${messageType === 'success' ? 'bg-emerald-500' : 'bg-red-500'} text-white p-6 flex items-center justify-center gap-3`}>
                            {messageType === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            <span className="text-xs font-black uppercase tracking-widest">{message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {activeTab === 'pricing' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div onClick={() => setIsLogsModalOpen(true)} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-md hover:border-slate-900 transition-all group flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center"><History className="w-8 h-8" /></div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 mb-1">{t('admin.settings.logs')}</h4>
                                <p className="text-sm font-medium text-slate-400">{t('admin.settings.logsDesc')}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div onClick={() => setIsCommissionModalOpen(true)} className="p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-md hover:border-slate-900 transition-all group flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center"><DollarSign className="w-8 h-8" /></div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 mb-1">{t('admin.settings.commissions')}</h4>
                                <p className="text-sm font-medium text-slate-400">{t('admin.settings.commissionsDesc')}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            )}

            <LogsModal isOpen={isLogsModalOpen} onClose={setIsLogsModalOpen} />
            <CommissionModal isOpen={isCommissionModalOpen} onClose={setIsCommissionModalOpen} />
        </div>
    );
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function PricingTab({ 
    localSettings, updateSettings, t, 
    price, setPrice, purchaseFee, setPurchaseFee, taxPercentage, setTaxPercentage,
    servicePrices, setServicePrices, collapsedCategories, setCollapsedCategories
}: PricingTabProps) {
    return (
        <div className="p-8 space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="p-3 bg-slate-900 rounded-2xl text-white">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black">تسعير الخدمات</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">ضبط الأسعار والعمولات والضرائب</p>
                </div>
            </div>

            <div className="space-y-10">
                <div className="space-y-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الإعدادات المالية العامة</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600 px-1">سعر حجز الموعد</label>
                            <div className="relative">
                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="0.00" />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">ريال</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600 px-1">عمولة الشراء (%)</label>
                            <div className="relative">
                                <input type="number" value={purchaseFee} onChange={(e) => setPurchaseFee(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="2.5" />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600 px-1">الضريبة (%)</label>
                            <div className="relative">
                                <input type="number" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="15" />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">أسعار الخدمات التفصيلية</h4>
                    {[
                        { category: 'postPurchase', label: 'خدمات ما بعد الشراء', services: ['الغاز', 'نقل وتركيب الأثاث', 'التأمين على المنزل', 'الصيانة (سباكة / كهرباء)', 'خدمة التنظيف', 'تنسيق حدائق', 'أنظمة أمنية'] },
                        { category: 'legal', label: 'الخدمات القانونية', services: ['التوثيق ونقل الملكية', 'تحديث الصكوك', 'حل المنازعات العقارية', 'صياغة ومراجعة العقود العقارية', 'تقديم الاستشارات العقارية'] },
                        { category: 'construction', label: 'خدمات البناء والمقاولات', services: ['مقاول عظم', 'تصميم هندسي', 'تشطيبات', 'كهرباء', 'سباكة', 'نجارة', 'دهانات', 'ألمنيوم', 'إشراف هندسي', 'تصميم داخلي'] },
                        { category: 'marketing', label: 'خدمات التسويق', services: ['تصوير فوتوغرافي للعقار', 'حملة إعلانية (وسائل التواصل الاجتماعي)', 'حملة إعلانية (إعلانات طرق/تقليدية)'] }
                    ].map((group) => (
                        <div key={group.category} className="border border-slate-100 rounded-3xl overflow-hidden mb-4">
                            <button 
                                onClick={() => setCollapsedCategories(prev => ({ ...prev, [group.category]: !prev[group.category] }))}
                                className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors"
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">{group.label}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${collapsedCategories[group.category] ? '' : 'rotate-180'}`} />
                            </button>
                            {!collapsedCategories[group.category] && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
                                    {group.services.map((service) => {
                                        const key = `service_price_${group.category}_${service}`.replace(/\s+/g, '_').toLowerCase();
                                        return (
                                            <div key={service} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{service}</label>
                                                <div className="relative">
                                                    <input type="number" value={servicePrices[key] || ""} onChange={(e) => setServicePrices(prev => ({ ...prev, [key]: e.target.value }))} className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12" placeholder="0.00" />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">ريال</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function AppearanceTab({ localSettings, updateSettings, t }: TabProps) {
    const [uploadingWhite, setUploadingWhite] = React.useState(false);
    const [uploadingBlack, setUploadingBlack] = React.useState(false);

    const uploadLogo = async (file: File, type: 'white' | 'black') => {
        const setter = type === 'white' ? setUploadingWhite : setUploadingBlack;
        setter(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/user/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                const url = data.url || data.imageUrl || data.path;
                if (url) {
                    updateSettings(type === 'white' ? { logoWhiteUrl: url } : { logoBlackUrl: url });
                }
            }
        } catch (e) {
            console.error('Logo upload failed', e);
        } finally {
            setter(false);
        }
    };

    return (
        <div className="p-8 space-y-10">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="p-3 bg-slate-900 rounded-2xl text-white">
                    <Palette className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black">هوية النظام</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">تخصيص الألوان والسمات البصرية</p>
                </div>
            </div>

            {/* ── Logo Management ── */}
            <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" /> إدارة الشعار
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* White Logo */}
                    <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
                        <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">الشعار الأبيض (على الخلفيات الداكنة)</p>
                        <div className="flex items-center justify-center h-20">
                            {localSettings.logoWhiteUrl ? (
                                <img src={localSettings.logoWhiteUrl} alt="white logo" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-white/20 text-[10px] font-black uppercase">لا يوجد شعار</div>
                            )}
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all">
                            {uploadingWhite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploadingWhite ? 'جارٍ الرفع...' : 'رفع الشعار الأبيض'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], 'white'); }} />
                        </label>
                        <input
                            type="text"
                            value={localSettings.logoWhiteUrl || ''}
                            onChange={(e) => updateSettings({ logoWhiteUrl: e.target.value })}
                            placeholder="أو أدخل رابط الشعار مباشرة..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-[11px] font-mono text-white/60 outline-none focus:border-white/30"
                        />
                    </div>
                    {/* Black Logo */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">الشعار الأسود (على الخلفيات الفاتحة)</p>
                        <div className="flex items-center justify-center h-20">
                            {localSettings.logoBlackUrl ? (
                                <img src={localSettings.logoBlackUrl} alt="black logo" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-slate-300 text-[10px] font-black uppercase">لا يوجد شعار</div>
                            )}
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all">
                            {uploadingBlack ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploadingBlack ? 'جارٍ الرفع...' : 'رفع الشعار الأسود'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], 'black'); }} />
                        </label>
                        <input
                            type="text"
                            value={localSettings.logoBlackUrl || ''}
                            onChange={(e) => updateSettings({ logoBlackUrl: e.target.value })}
                            placeholder="أو أدخل رابط الشعار مباشرة..."
                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-[11px] font-mono text-slate-400 outline-none focus:border-slate-900"
                        />
                    </div>
                </div>
                {/* Size Slider */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">حجم الشعار في كل الصفحات</label>
                        <span className="text-2xl font-black text-slate-900">{localSettings.logoHeight || 40}<span className="text-[11px] text-slate-400 ml-1">px</span></span>
                    </div>
                    <input
                        type="range"
                        min={24}
                        max={120}
                        step={2}
                        value={localSettings.logoHeight || 40}
                        onChange={(e) => updateSettings({ logoHeight: parseInt(e.target.value) })}
                        className="w-full accent-slate-900 h-2"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                        <span>24px صغير</span>
                        <span>كبير 120px</span>
                    </div>
                    {/* Live preview */}
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-900 flex items-center justify-center p-4" style={{ minHeight: `${(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoWhiteUrl && <img src={localSettings.logoWhiteUrl} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-4" style={{ minHeight: `${(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoBlackUrl && <img src={localSettings.logoBlackUrl} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الألوان الأساسية</h4>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { id: 'primary', label: 'اللون الأساسي', value: localSettings.primary },
                            { id: 'accent', label: 'لون التمييز', value: localSettings.accent },
                            { id: 'background', label: 'لون الخلفية', value: localSettings.background }
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                                <div className="w-12 h-12 rounded-2xl shadow-inner flex-shrink-0" style={{ backgroundColor: color.value as string }} />
                                <div className="flex-grow">
                                    <label className="text-[11px] font-black text-slate-600 block mb-1">{color.label}</label>
                                    <input type="text" value={color.value as string} onChange={(e) => updateSettings({ [color.id]: e.target.value })} className="w-full bg-transparent border-none text-xs font-mono outline-none text-slate-400" />
                                </div>
                                <input type="color" value={color.value as string} onChange={(e) => updateSettings({ [color.id]: e.target.value })} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                            </div>
                        ))}
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pt-6">شارة "قريباً"</h4>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { id: 'soonBadgeBg', label: 'خلفية الشارة', value: (localSettings as any).soonBadgeBg || '#ffffff' },
                            { id: 'soonBadgeText', label: 'لون النص', value: (localSettings as any).soonBadgeText || '#000000' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                                <div
                                    className="h-8 px-3 rounded-xl border border-slate-100 shadow-inner flex items-center justify-center text-[10px] font-black uppercase tracking-widest flex-shrink-0"
                                    style={{
                                        backgroundColor: (localSettings as any).soonBadgeBg || '#ffffff',
                                        color: (localSettings as any).soonBadgeText || '#000000',
                                    }}
                                >
                                    قريباً
                                </div>
                                <div className="flex-grow">
                                    <label className="text-[11px] font-black text-slate-600 block mb-1">{color.label}</label>
                                    <input
                                        type="text"
                                        value={color.value as string}
                                        onChange={(e) => updateSettings({ [color.id]: e.target.value } as any)}
                                        className="w-full bg-transparent border-none text-xs font-mono outline-none text-slate-400"
                                    />
                                </div>
                                <input
                                    type="color"
                                    value={color.value as string}
                                    onChange={(e) => updateSettings({ [color.id]: e.target.value } as any)}
                                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">العلامة التجارية والخط</h4>
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">اسم النظام (العلامة التجارية)</label>
                            <input type="text" value={localSettings.appName} onChange={(e) => updateSettings({ appName: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 shadow-inner" placeholder="اسم النظام..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">لاحقة العنوان (Badge)</label>
                                <input type="text" value={(localSettings.texts || {})['admin_badge'] || 'ADMIN'} onChange={(e) => updateSettings({ texts: { ...(localSettings.texts || {}), 'admin_badge': e.target.value } })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="ADMIN..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">مسمى مدير النظام</label>
                                <input type="text" value={(localSettings.texts || {})['admin_role_label'] || 'admin'} onChange={(e) => updateSettings({ texts: { ...(localSettings.texts || {}), 'admin_role_label': e.target.value } })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="مدير النظام..." />
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-[11px] font-black text-slate-600">البريد الإلكتروني للتواصل</label>
                            <input type="email" value={localSettings.contactEmail} onChange={(e) => updateSettings({ contactEmail: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="info@example.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">رقم الهاتف للتواصل</label>
                            <input type="text" value={localSettings.contactPhone} onChange={(e) => updateSettings({ contactPhone: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="+966..." />
                        </div>
                        <div className="pt-4">
                            <label className="text-[11px] font-black text-slate-600 mb-2 block">النمط الليلي / النهاري</label>
                            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                                <button onClick={() => updateSettings({ isDark: false })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${!localSettings.isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Sun className="w-4 h-4" /> نهاري</button>
                                <button onClick={() => updateSettings({ isDark: true })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${localSettings.isDark ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}><Moon className="w-4 h-4" /> ليلي</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TextTab({ 
    localSettings, updateSettings, t, 
    searchTerm, setSearchTerm, textOverrides, setTextOverrides, language,
    selectedCategory, setSelectedCategory
}: TextTabProps & { selectedCategory: string, setSelectedCategory: (v: string) => void }) {
    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white"><Type className="w-6 h-6" /></div>
                    <div>
                        <h3 className="text-xl font-black">نصوص النظام</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">تعديل المسميات والرسائل في التطبيق</p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pr-12 pl-6 text-sm font-bold outline-none focus:border-slate-900" placeholder="ابحث عن نص..." />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                <div className="lg:col-span-1 space-y-6">
                    {/* Category Selector */}
                    <div className="bg-slate-50 rounded-[2rem] p-4 border border-slate-100 space-y-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-4">أقسام الصفحات</h4>
                        {TRANSLATION_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full text-right px-4 py-3 rounded-2xl text-[11px] font-black transition-all ${selectedCategory === cat.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">عناصر الهوية والرسائل العامة</h4>
                        <div className="space-y-4">
                            {[
                                { key: 'coming_soon_global', label: 'رسالة "قريباً" الشاملة' },
                                { key: 'action_login', label: 'نص زر الدخول' },
                                { key: 'action_register', label: 'نص زر التسجيل' },
                                { key: 'contact_support_desc', label: 'وصف خدمة العملاء' }
                            ].map(item => (
                                <div key={item.key} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 px-1">{item.label}</label>
                                    <input 
                                        type="text" 
                                        value={(localSettings.texts || {})[item.key] || ''} 
                                        onChange={(e) => updateSettings({ texts: { ...(localSettings.texts || {}), [item.key]: e.target.value } })} 
                                        className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-[11px] font-black outline-none focus:ring-2 focus:ring-slate-900/5 transition-all" 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden">
                        <div className="max-h-[800px] overflow-y-auto pr-2 custom-scrollbar p-8 space-y-6">
                            {Object.keys(translations.ar)
                                .filter(key => {
                                    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) || translations.ar[key].includes(searchTerm);
                                    if (!matchesSearch) return false;
                                    
                                    if (selectedCategory === 'all') return true;
                                    const cat = TRANSLATION_CATEGORIES.find(c => c.id === selectedCategory);
                                    if (!cat) return true;
                                    
                                    const prefix = key.split('.')[0];
                                    return cat.prefixes.includes(prefix);
                                })
                                .map((key) => (
                                <div key={key} className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100/50 transition-all hover:border-slate-900/20 group">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-slate-900/20" />
                                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest font-mono">{key}</span>
                                        </div>
                                        <button 
                                            onClick={() => { const n = { ...textOverrides }; delete n['ar_' + key]; delete n['en_' + key]; setTextOverrides(n); }} 
                                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 transition-all"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase px-1">العربية</label>
                                            <input 
                                                type="text" 
                                                value={textOverrides['ar_' + key] !== undefined ? textOverrides['ar_' + key] : translations.ar[key as keyof typeof translations.ar]} 
                                                onChange={(e) => setTextOverrides(prev => ({ ...prev, ['ar_' + key]: e.target.value }))} 
                                                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl transition-all" 
                                            />
                                        </div>
                                        <div dir="ltr" className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase px-1">English</label>
                                            <input 
                                                type="text" 
                                                value={textOverrides['en_' + key] !== undefined ? textOverrides['en_' + key] : (translations.en[key as keyof typeof translations.en] || "")} 
                                                onChange={(e) => setTextOverrides(prev => ({ ...prev, ['en_' + key]: e.target.value }))} 
                                                className="w-full bg-white border border-slate-100 rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SiteControlTabLegacy({ localSettings, updateSettings, t }: TabProps) {
    return (
        <div className="p-8 space-y-12">
            <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                <div className="p-3 bg-slate-900 rounded-2xl text-white"><ShieldAlert className="w-6 h-6" /></div>
                <div>
                    <h3 className="text-xl font-black">التحكم بالموقع</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">إدارة توفر الأقسام وتنبيهات القريب</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><LayoutGrid className="w-3 h-3" /> توفر الأقسام</h4>
                    <div className="space-y-4">
                        {[
                            { id: 'wallet', label: 'المحفظة المالية (واجهة المستخدم)' },
                            { id: 'orders', label: 'إدارة الطلبات (واجهة المستخدم)' },
                            { id: 'offers', label: 'العروض العقارية (واجهة المستخدم)' },
                            { id: 'services', label: 'الخدمات (واجهة المستخدم)' },
                            { id: 'buildingmanagement', label: 'إدارة الأملاك (واجهة المستخدم)' },
                            { id: 'marketing', label: 'التسويق (واجهة المستخدم)' },
                            { id: 'scan_map', label: 'المسح والمخططات' },
                            { id: 'subscriptions', label: 'الباقات والاشتراكات (واجهة المستخدم)' },
                            { id: 'financial', label: 'التقارير المالية (واجهة المستخدم)' },
                            { id: 'disputes', label: 'المنازعات والقانونية (واجهة المستخدم)' },
                            { id: 'customerservice', label: 'مركز العناية بالعملاء' },
                            { id: 'internal', label: 'الإدارة الداخلية (الواجهة)' },
                            { id: 'map', label: 'خريطة الموقع (الرئيسية)' },
                            { id: 'details', label: 'صفحة التفاصيل (الرئيسية)' },
                        ].map(section => {
                            const sectionKey = section.id;
                            return (
                            <div key={section.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">{section.label}</span>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[9px] font-black uppercase ${(localSettings.sectionFlags || {})[sectionKey] === 'open' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {(localSettings.sectionFlags || {})[sectionKey] === 'open' ? 'متاح' : 'قريباً'}
                                        </span>
                                        <button 
                                            onClick={() => updateSettings({ sectionFlags: { ...(localSettings.sectionFlags || {}), [sectionKey]: (localSettings.sectionFlags || {})[sectionKey] === 'open' ? 'closed' : 'open' } })}
                                            className={`w-12 h-6 rounded-full relative transition-all ${(localSettings.sectionFlags || {})[sectionKey] === 'open' ? 'bg-slate-900' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${(localSettings.sectionFlags || {})[sectionKey] === 'open' ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                                {(localSettings.sectionFlags || {})[sectionKey] === 'closed' && (
                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase">رسالة "قريباً"</label>
                                        <input 
                                            type="text"
                                            value={(localSettings.sectionMessages || {})[sectionKey] || ""}
                                            onChange={(e) => updateSettings({ sectionMessages: { ...(localSettings.sectionMessages || {}), [sectionKey]: e.target.value } })}
                                            className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                            placeholder="مثال: الخدمة ستتوفر قريباً..."
                                        />
                                    </div>
                                )}
                            </div>
                        )})}
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-12"><ShieldQuestion className="w-3 h-3" /> التبويبات (تمكين/قريباً/إزالة)</h4>
                    <div className="space-y-4">
                        {[
                            { id: 'internal_stats', label: 'الإحصاءات (داخل الإدارة)' },
                            { id: 'chat', label: 'الدردشة' },
                            { id: 'service_requests', label: 'طلبات الخدمات' },
                            { id: 'marketing', label: 'إدارة التسويق' },
                            { id: 'properties', label: 'إدارة الأملاك' },
                            { id: 'finance', label: 'الإدارة المالية' },
                            { id: 'legal', label: 'الإدارة القانونية' },
                            { id: 'employees', label: 'إدارة الموظفين' },
                            { id: 'offers', label: 'العروض' },
                            { id: 'orders', label: 'الطلبات' },
                            { id: 'subscriptions', label: 'الباقات والاشتراكات' },
                            { id: 'services_postPurchase', label: 'الخدمات: ما بعد الشراء' },
                            { id: 'services_legal', label: 'الخدمات: القانونية' },
                            { id: 'services_construction', label: 'الخدمات: البناء والمقاولات' },
                            { id: 'services_marketing', label: 'الخدمات: التسويق' },
                            { id: 'services_other', label: 'الخدمات: أخرى' },
                            { id: 'legal_disputes', label: 'القانوني: المنازعات العقارية' },
                            { id: 'legal_contracts', label: 'القانوني: العقود' },
                            { id: 'legal_documentation', label: 'القانوني: التوثيق' },
                            { id: 'legal_other', label: 'القانوني: أخرى' },
                        ].map((m) => {
                            const status: 'enabled' | 'soon' | 'disabled' = (localSettings.moduleFlags || {})[m.id] || 'enabled';
                            const setStatus = (nextStatus: 'enabled' | 'soon' | 'disabled') => {
                                updateSettings({
                                    moduleFlags: { ...(localSettings.moduleFlags || {}), [m.id]: nextStatus },
                                });
                            };
                            return (
                                <div key={m.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm font-bold">{m.label}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setStatus('enabled')}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${status === 'enabled' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
                                            >
                                                متاح
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setStatus('soon')}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${status === 'soon' ? 'ring-2 ring-slate-900/5' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
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
                                                type="button"
                                                onClick={() => setStatus('disabled')}
                                                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${status === 'disabled' ? 'bg-slate-200 text-slate-700 border-slate-200' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}
                                            >
                                                إزالة
                                            </button>
                                        </div>
                                    </div>
                                    {status === 'soon' && (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase">رسالة "قريباً"</label>
                                            <input
                                                type="text"
                                                value={(localSettings.moduleMessages || {})[m.id] || ""}
                                                onChange={(e) =>
                                                    updateSettings({
                                                        moduleMessages: { ...(localSettings.moduleMessages || {}), [m.id]: e.target.value },
                                                    })
                                                }
                                                className="w-full bg-white border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                                placeholder="مثال: قريباً..."
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Smartphone className="w-3 h-3" /> طرق تسجيل الدخول</h4>
                    <div className="space-y-4">
                        {[
                            { id: 'phone', label: 'الجوال' },
                            { id: 'email', label: 'البريد الإلكتروني' }
                        ].map(method => {
                            const methodKey = `${method.id}Enabled` as keyof typeof localSettings.loginConfig;
                            return (
                            <div key={method.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-bold">{method.label}</span>
                                <button 
                                    onClick={() => updateSettings({ loginConfig: { ...(localSettings.loginConfig || {}), [methodKey]: !localSettings.loginConfig[methodKey] } })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${localSettings.loginConfig[methodKey] ? 'bg-slate-900' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.loginConfig[methodKey] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        )})}
                        <div className="space-y-2 pt-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase">شارة تسجيل دخول الهاتف</label>
                             <input 
                                 type="text"
                                 value={localSettings.loginConfig.phoneLabel || ""}
                                 onChange={(e) => updateSettings({ loginConfig: { ...localSettings.loginConfig, phoneLabel: e.target.value } })}
                                 className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                 placeholder="مثال: قريباً..."
                             />
                        </div>
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 mt-12"><Zap className="w-3 h-3" /> ظهور عناصر الواجهة</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'show_map_section', label: 'قسم الخريطة' },
                            { id: 'show_stats_cards', label: 'بطاقات الإحصائيات' },
                            { id: 'show_charts_section', label: 'الرسوم البيانية' },
                            { id: 'show_quick_actions', label: 'الإجراءات السريعة' },
                            { id: 'show_quickaction_buildingmgmt', label: 'أيقونة إدارة الأملاك' },
                            { id: 'show_quickaction_wallet', label: 'أيقونة المحفظة' },
                            { id: 'show_quickaction_services', label: 'أيقونة الخدمات' },
                            { id: 'show_quickaction_offers', label: 'أيقونة العروض' },
                            { id: 'show_quickaction_orders', label: 'أيقونة الطلبات' },
                        ].map(flag => (
                            <div key={flag.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <span className="text-sm font-bold">{flag.label}</span>
                                <button 
                                    onClick={() => updateSettings({ uiFlags: { ...(localSettings.uiFlags || {}), [flag.id]: !localSettings.uiFlags[flag.id] } })}
                                    className={`w-12 h-6 rounded-full relative transition-all ${localSettings.uiFlags[flag.id] ? 'bg-slate-900' : 'bg-slate-200'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.uiFlags[flag.id] ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SiteControlTab({ localSettings, updateSettings, t }: TabProps) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState<{ sections: boolean; modules: boolean; login: boolean; ui: boolean }>({
        sections: true,
        modules: true,
        login: false,
        ui: false,
    });

    const filterByQuery = <T extends { id: string; label: string }>(items: T[]) => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((x) => `${x.label} ${x.id}`.toLowerCase().includes(q));
    };

    const SectionHeader = ({ id, title, icon: Icon, count }: { id: keyof typeof open; title: string; icon: any; count?: number }) => (
        <button
            type="button"
            onClick={() => setOpen((p) => ({ ...p, [id]: !p[id] }))}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors"
        >
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900">
                    <Icon className="w-4 h-4" />
                </div>
                <div className="text-right">
                    <p className="text-sm font-black text-slate-950">{title}</p>
                    {typeof count === 'number' && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{count} عنصر</p>
                    )}
                </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open[id] ? 'rotate-180' : ''}`} />
        </button>
    );

    const SectionRow = ({ id, label }: { id: string; label: string }) => {
        const v = (localSettings.sectionFlags || {})[id] === 'open' ? 'open' : 'closed';
        const setV = (next: 'open' | 'closed') => updateSettings({ sectionFlags: { ...(localSettings.sectionFlags || {}), [id]: next } });
        return (
            <div className="rounded-2xl border border-slate-100 bg-white">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setV('open')} className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${v === 'open' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>متاح</button>
                        <button
                            type="button"
                            onClick={() => setV('closed')}
                            className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${
                                v === 'closed' ? 'ring-2 ring-slate-900/5' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
                            style={
                                v === 'closed'
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
                    </div>
                </div>
                {v === 'closed' && (
                    <div className="px-4 pb-4 pt-0">
                        <div className="pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.sectionMessages || {})[id] || ""}
                                onChange={(e) => updateSettings({ sectionMessages: { ...(localSettings.sectionMessages || {}), [id]: e.target.value } })}
                                className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                placeholder="مثال: قريباً..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const ModuleRow = ({ id, label }: { id: string; label: string }) => {
        const status: 'enabled' | 'soon' | 'disabled' = (localSettings.moduleFlags || {})[id] || 'enabled';
        const setStatus = (next: 'enabled' | 'soon' | 'disabled') => updateSettings({ moduleFlags: { ...(localSettings.moduleFlags || {}), [id]: next } });
        return (
            <div className="rounded-2xl border border-slate-100 bg-white">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setStatus('enabled')} className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${status === 'enabled' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>متاح</button>
                        <button
                            type="button"
                            onClick={() => setStatus('soon')}
                            className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${
                                status === 'soon' ? 'ring-2 ring-slate-900/5' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
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
                        <button type="button" onClick={() => setStatus('disabled')} className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${status === 'disabled' ? 'bg-slate-200 text-slate-700 border-slate-200' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>إزالة</button>
                    </div>
                </div>
                {status === 'soon' && (
                    <div className="px-4 pb-4 pt-0">
                        <div className="pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.moduleMessages || {})[id] || ""}
                                onChange={(e) => updateSettings({ moduleMessages: { ...(localSettings.moduleMessages || {}), [id]: e.target.value } })}
                                className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                placeholder="مثال: قريباً..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const DetailsPartRow = ({ id, label }: { id: string; label: string }) => {
        const status: 'enabled' | 'soon' | 'hidden' = (localSettings.detailsPartFlags || {})[id] || 'enabled';
        const setStatus = (next: 'enabled' | 'soon' | 'hidden') =>
            updateSettings({ detailsPartFlags: { ...(localSettings.detailsPartFlags || {}), [id]: next } });
        return (
            <div className="rounded-2xl border border-slate-100 bg-white">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{`details:${id}`}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => setStatus('enabled')}
                            className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${
                                status === 'enabled'
                                    ? 'bg-slate-900 text-white border-slate-900'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            متاح
                        </button>
                        <button
                            type="button"
                            onClick={() => setStatus('soon')}
                            className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${
                                status === 'soon' ? 'ring-2 ring-slate-900/5' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
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
                            type="button"
                            onClick={() => setStatus('hidden')}
                            className={`h-8 px-3 rounded-xl text-[10px] font-black border transition-colors ${
                                status === 'hidden'
                                    ? 'bg-slate-200 text-slate-700 border-slate-200'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                            }`}
                        >
                            إزالة
                        </button>
                    </div>
                </div>
                {status === 'soon' && (
                    <div className="px-4 pb-4 pt-0">
                        <div className="pt-3 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.detailsPartMessages || {})[id] || ''}
                                onChange={(e) =>
                                    updateSettings({
                                        detailsPartMessages: { ...(localSettings.detailsPartMessages || {}), [id]: e.target.value },
                                    })
                                }
                                className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                placeholder="مثال: قريباً..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const sections = filterByQuery([
        { id: 'wallet', label: 'المحفظة المالية (واجهة المستخدم)' },
        { id: 'orders', label: 'إدارة الطلبات (واجهة المستخدم)' },
        { id: 'offers', label: 'العروض العقارية (واجهة المستخدم)' },
        { id: 'services', label: 'الخدمات (واجهة المستخدم)' },
        { id: 'buildingmanagement', label: 'إدارة الأملاك (واجهة المستخدم)' },
        { id: 'marketing', label: 'التسويق (واجهة المستخدم)' },
        { id: 'scan_map', label: 'المسح والمخططات' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات (واجهة المستخدم)' },
        { id: 'financial', label: 'التقارير المالية (واجهة المستخدم)' },
        { id: 'disputes', label: 'المنازعات والقانونية (واجهة المستخدم)' },
        { id: 'customerservice', label: 'مركز العناية بالعملاء' },
        { id: 'internal', label: 'الإدارة الداخلية (الواجهة)' },
        { id: 'map', label: 'خريطة الموقع (الرئيسية)' },
        { id: 'details', label: 'صفحة التفاصيل (الرئيسية)' },
    ]);

    const modules = filterByQuery([
        { id: 'internal_stats', label: 'الإحصاءات (داخل الإدارة)' },
        { id: 'chat', label: 'الدردشة' },
        { id: 'service_requests', label: 'طلبات الخدمات' },
        { id: 'marketing', label: 'إدارة التسويق' },
        { id: 'properties', label: 'إدارة الأملاك' },
        { id: 'finance', label: 'الإدارة المالية' },
        { id: 'legal', label: 'الإدارة القانونية' },
        { id: 'employees', label: 'إدارة الموظفين' },
        { id: 'offers', label: 'العروض' },
        { id: 'orders', label: 'الطلبات' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات' },
        { id: 'services_postPurchase', label: 'الخدمات: ما بعد الشراء' },
        { id: 'services_legal', label: 'الخدمات: القانونية' },
        { id: 'services_construction', label: 'الخدمات: البناء والمقاولات' },
        { id: 'services_marketing', label: 'الخدمات: التسويق' },
        { id: 'services_other', label: 'الخدمات: أخرى' },
        { id: 'legal_disputes', label: 'القانوني: المنازعات العقارية' },
        { id: 'legal_contracts', label: 'القانوني: العقود' },
        { id: 'legal_documentation', label: 'القانوني: التوثيق' },
        { id: 'legal_other', label: 'القانوني: أخرى' },
    ]);

    const uiFlags = filterByQuery([
        { id: 'show_map_section', label: 'قسم الخريطة' },
        { id: 'show_stats_cards', label: 'بطاقات الإحصائيات' },
        { id: 'show_charts_section', label: 'الرسوم البيانية' },
        { id: 'show_quick_actions', label: 'الإجراءات السريعة' },
        { id: 'show_quickaction_buildingmgmt', label: 'أيقونة إدارة الأملاك' },
        { id: 'show_quickaction_wallet', label: 'أيقونة المحفظة' },
        { id: 'show_quickaction_services', label: 'أيقونة الخدمات' },
        { id: 'show_quickaction_offers', label: 'أيقونة العروض' },
        { id: 'show_quickaction_orders', label: 'أيقونة الطلبات' },
    ]);

    const detailsParts = filterByQuery([
        { id: 'map', label: 'الخريطة التفاعلية (التفاصيل)' },
        { id: 'stats', label: 'إحصاءات وملخصات (التفاصيل)' },
        { id: 'charts', label: 'التحليلات والاتجاهات (التفاصيل)' },
        { id: 'quick_actions', label: 'الوصول السريع (التفاصيل)' },
    ]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-900 rounded-2xl text-white"><ShieldAlert className="w-6 h-6" /></div>
                <div className="flex-1">
                    <h3 className="text-xl font-black">التحكم بالموقع</h3>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">ابحث ثم عدل الحالة</p>
                </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                    placeholder="ابحث عن (العروض، الطلبات، التوثيق...)"
                />
                {query && (
                    <button type="button" onClick={() => setQuery('')} className="w-8 h-8 rounded-xl hover:bg-white flex items-center justify-center">
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <SectionHeader id="sections" title="الأقسام (واجهة المستخدم)" icon={LayoutGrid} count={sections.length} />
                    {open.sections && <div className="space-y-3">{sections.map((s) => <SectionRow key={s.id} id={s.id} label={s.label} />)}</div>}
                </div>

                <div className="space-y-3">
                    <SectionHeader id="modules" title="التبويبات (داخل الإدارة)" icon={ShieldQuestion} count={modules.length} />
                    {open.modules && <div className="space-y-3">{modules.map((m) => <ModuleRow key={m.id} id={m.id} label={m.label} />)}</div>}
                </div>

                <div className="space-y-3">
                    <SectionHeader id="login" title="طرق تسجيل الدخول" icon={Smartphone} />
                    {open.login && (
                        <div className="space-y-3">
                            {[
                                { id: 'phone', label: 'الجوال' },
                                { id: 'email', label: 'البريد الإلكتروني' },
                            ].map((method) => {
                                const methodKey = `${method.id}Enabled` as keyof typeof localSettings.loginConfig;
                                return (
                                    <div key={method.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-950">{method.label}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{String(methodKey)}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateSettings({ loginConfig: { ...(localSettings.loginConfig || {}), [methodKey]: !localSettings.loginConfig[methodKey] } })}
                                            className={`w-12 h-6 rounded-full relative transition-all ${localSettings.loginConfig[methodKey] ? 'bg-slate-900' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.loginConfig[methodKey] ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                );
                            })}

                            <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">شارة تسجيل دخول الهاتف</label>
                                <input
                                    type="text"
                                    value={localSettings.loginConfig.phoneLabel || ""}
                                    onChange={(e) => updateSettings({ loginConfig: { ...localSettings.loginConfig, phoneLabel: e.target.value } })}
                                    className="mt-2 w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 shadow-sm"
                                    placeholder="مثال: قريباً..."
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <SectionHeader id="ui" title="عناصر الواجهة" icon={Zap} count={uiFlags.length + detailsParts.length} />
                    {open.ui && (
                        <div className="space-y-3">
                            {uiFlags.map((flag) => (
                                <div key={flag.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 flex items-center justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-950 truncate">{flag.label}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{flag.id}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => updateSettings({ uiFlags: { ...(localSettings.uiFlags || {}), [flag.id]: !localSettings.uiFlags[flag.id] } })}
                                        className={`w-12 h-6 rounded-full relative transition-all ${localSettings.uiFlags[flag.id] ? 'bg-slate-900' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.uiFlags[flag.id] ? 'left-7' : 'left-1'}`} />
                                    </button>
                                </div>
                            ))}

                            <div className="pt-2 border-t border-slate-200">
                                <div className="text-xs font-black text-slate-600 mb-2">أقسام صفحة التفاصيل</div>
                                <div className="space-y-3">
                                    {detailsParts.map((p) => (
                                        <DetailsPartRow key={p.id} id={p.id} label={p.label} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LogsModal({ isOpen, onClose }: { isOpen: boolean, onClose: (v: boolean) => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => onClose(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">سجل التغييرات</h3>
                    <button onClick={() => onClose(false)} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {[{ user: 'Admin', action: 'تعديل الأسعار', date: 'منذ ساعتين' }].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div>
                                <p className="text-xs font-black">{log.action}</p>
                                <p className="text-[10px] text-slate-400">{log.user}</p>
                            </div>
                            <span className="text-[9px] font-black">{log.date}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}

function CommissionModal({ isOpen, onClose }: { isOpen: boolean, onClose: (v: boolean) => void }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div onClick={() => onClose(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">إدارة العمولات</h3>
                    <button onClick={() => onClose(false)} className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">عمولة شراء عقار (%)</label>
                        <input type="text" defaultValue="2.5" className="w-full bg-slate-50 border border-transparent rounded-xl py-3 px-4 text-sm font-black outline-none" />
                    </div>
                    <button onClick={() => onClose(false)} className="w-full h-12 bg-slate-900 text-white rounded-xl font-black text-sm">حفظ التغييرات</button>
                </div>
            </motion.div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
            <SettingsPageInner />
        </Suspense>
    );
}
