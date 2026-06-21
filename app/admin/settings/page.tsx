'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2, Save, Palette, Type, DollarSign, ShieldAlert,
    ArrowRight, Loader2, History, X, ShieldCheck, Sparkles,
    ChevronDown, Moon, Sun, Search, RefreshCw, Smartphone,
    LayoutGrid, Zap, ShieldQuestion, Upload, ImageIcon,
    ChevronLeft, ChevronRight, Globe, Languages,
    Bell, FileText, Mail, Share2, LifeBuoy, KeyRound,
    Volume2, Plus, Trash2, Eye, BookOpen, Play, UserCheck, Info, Sliders
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { translations } from '@/context/translations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

type TranslationCategory = {
    id: string;
    label: string;
    prefixes: string[];
};

const ADMIN_TEXT_SECTIONS: TranslationCategory[] = [
    { id: 'admin_entry', label: 'العودة والهوية', prefixes: ['admin.nav.back_to_details', 'admin.nav.brand', 'admin.identity'] },
    { id: 'admin_dashboard', label: 'لوحة التحكم', prefixes: ['admin.nav.dashboard', 'admin.dashboard', 'cards', 'chart', 'details', 'scan'] },
    { id: 'admin_users', label: 'المستخدمين', prefixes: ['admin.nav.users', 'admin.users'] },
    { id: 'admin_subscriptions', label: 'الاشتراكات والباقات', prefixes: ['admin.nav.subscriptions', 'admin.packages', 'sub'] },
    { id: 'admin_map', label: 'الخريطة', prefixes: ['admin.nav.map', 'admin.map', 'map', 'scan'] },
    { id: 'admin_operations', label: 'الإحصائيات والعمليات', prefixes: ['admin.operations', 'admin.transactions'] },
    { id: 'admin_trends', label: 'التحليلات والاتجاهات', prefixes: ['admin.trends'] },
    { id: 'admin_customer_service', label: 'خدمة العملاء', prefixes: ['admin.nav.customer_service', 'admin.customer_service', 'cs'] },
    { id: 'admin_settings', label: 'الإعدادات والتحكم', prefixes: ['admin.nav.settings', 'admin.settings'] },
    { id: 'admin_offers', label: 'إدارة العروض', prefixes: ['admin.nav.offers', 'admin.offers', 'offers', 'offer'] },
    { id: 'admin_orders', label: 'إدارة الطلبات', prefixes: ['admin.nav.orders_mgmt', 'admin.orders', 'orders'] },
    { id: 'admin_marketing', label: 'إدارة التسويق', prefixes: ['admin.nav.marketing', 'admin.marketing', 'marketing'] },
    { id: 'admin_finance', label: 'الإدارة المالية', prefixes: ['admin.nav.wallet', 'admin.nav.transactions', 'admin.transactions', 'wallet', 'fin', 'invoice', 'payment'] },
    { id: 'admin_properties', label: 'إدارة الأملاك', prefixes: ['admin.nav.properties', 'pm', 'bm', 'property', 'unit', 'tenant'] },
    { id: 'admin_legal', label: 'الإدارة القانونية', prefixes: ['admin.nav.legal', 'admin.legal', 'legal', 'disputes'] },
    { id: 'admin_info_content', label: 'المحتوى القانوني', prefixes: ['admin.nav.info_content', 'admin.info_content', 'info'] },
    { id: 'admin_services', label: 'الخدمات', prefixes: ['admin.nav.services', 'admin.nav.services_mgmt', 'admin.services_mgmt', 'admin.service_requests', 'service'] },
];

const TRANSLATION_CATEGORIES: TranslationCategory[] = [
    { id: 'admin_all', label: 'لوحة التحكم كاملة', prefixes: [] },
    { id: 'admin_workspace', label: 'الرئيسية', prefixes: ADMIN_TEXT_SECTIONS.slice(0, 9).flatMap(section => section.prefixes) },
    { id: 'admin_departments', label: 'الإدارات', prefixes: ADMIN_TEXT_SECTIONS.slice(9, 16).flatMap(section => section.prefixes) },
    { id: 'admin_services_group', label: 'الخدمات', prefixes: ADMIN_TEXT_SECTIONS.find(section => section.id === 'admin_services')?.prefixes || [] },
    { id: 'all', label: 'كل نصوص الموقع', prefixes: [] },
    { id: 'header_footer', label: 'الهوية والروابط', prefixes: ['header', 'footer', 'project'] },
    { id: 'auth', label: 'الدخول والأمان', prefixes: ['login', 'auth', 'otp', 'profile', 'notification'] },
    { id: 'management', label: 'إدارة الأملاك', prefixes: ['pm', 'bm', 'property', 'unit', 'tenant'] },
    { id: 'services', label: 'الخدمات المالية والقانونية', prefixes: ['service', 'legal', 'marketing', 'fin', 'wallet', 'chat', 'payment', 'orders', 'offers', 'offer', 'invoice'] },
    { id: 'general', label: 'إعدادات النظام العامة', prefixes: ['common', 'status', 'range', 'pagination', 'city', 'country', 'cs', 'disputes'] },
];

const matchesTranslationPrefix = (key: string, prefix: string) => (
    key === prefix || key.startsWith(`${prefix}.`) || key.split('.')[0] === prefix
);

const ADMIN_TEXT_PREFIX_ORDER = ADMIN_TEXT_SECTIONS.flatMap(section => section.prefixes);

const getAdminTextRank = (key: string) => {
    const rank = ADMIN_TEXT_PREFIX_ORDER.findIndex(prefix => matchesTranslationPrefix(key, prefix));
    if (rank >= 0) return rank;
    if (key.startsWith('admin.nav.')) return ADMIN_TEXT_PREFIX_ORDER.length + 1;
    if (key.startsWith('admin.')) return ADMIN_TEXT_PREFIX_ORDER.length + 2;
    return ADMIN_TEXT_PREFIX_ORDER.length + 100;
};

const getAdminTextSectionLabel = (key: string) => (
    ADMIN_TEXT_SECTIONS.find(section => section.prefixes.some(prefix => matchesTranslationPrefix(key, prefix)))?.label || 'لوحة التحكم'
);

const isAdminPanelTextKey = (key: string) => (
    key.startsWith('admin.') || ADMIN_TEXT_PREFIX_ORDER.some(prefix => matchesTranslationPrefix(key, prefix))
);

// ─── Main Component ──────────────────────────────────────────────────────────

function SettingsPageInner() {
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';
    const { settings, saveSettings, isLoading, refetch } = useSettings();
    const [activeTab, setActiveTab] = useState<'pricing' | 'appearance' | 'text' | 'site_control'>('pricing');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
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

    const handleSave = async () => {
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
                toast.success(isRtl ? "تم حفظ التغييرات" : "Changes saved", {
                    description: isRtl ? "تم تحديث الإعدادات بنجاح." : "Settings were updated successfully.",
                    duration: 3500,
                });
                // Trigger refetch from context to update the UI globally
                await refetch();
            } else {
                setMessageType('error');
                setMessage(t('admin.settings.updateFail') || "فشل التحديث");
                toast.error(isRtl ? "تعذر حفظ التغييرات" : "Could not save changes");
            }
        } catch (error) {
            console.error("Save error:", error);
            setMessageType('error');
            setMessage(t('admin.settings.saveError') || "خطأ في الحفظ");
            toast.error(isRtl ? "حدث خطأ أثناء الحفظ" : "Save failed");
        } finally {
            setSaving(false);
            // Hide message after 3 seconds
            setTimeout(() => setMessage(""), 3000);
        }
    };

    const handleSaveWrapper = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaveConfirmOpen(true);
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

            <nav className="grid w-full grid-cols-2 gap-3 rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:flex md:w-fit md:flex-wrap md:items-center">
                {[
                    { id: 'pricing', label: t('admin.settings.tab.pricing'), icon: DollarSign },
                    { id: 'appearance', label: t('admin.settings.tab.appearance'), icon: Palette },
                    { id: 'text', label: t('admin.settings.tab.text'), icon: Type },
                    { id: 'site_control', label: t('admin.settings.tab.control'), icon: ShieldAlert },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group relative flex min-h-[74px] items-center justify-center gap-3 overflow-hidden rounded-[1.75rem] border px-5 py-4 text-sm font-black transition-all md:min-w-[180px] ${
                            activeTab === tab.id
                                ? 'border-white bg-white text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.10)]'
                                : 'border-transparent bg-white/35 text-slate-400 hover:border-white/70 hover:bg-white/75 hover:text-slate-700'
                        }`}
                    >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all ${
                            activeTab === tab.id ? 'bg-slate-950 text-white' : 'bg-white text-slate-500 group-hover:bg-slate-100'
                        }`}>
                            <tab.icon className="h-5 w-5" />
                        </div>
                        <span className="text-base font-black tracking-tight">{tab.label}</span>
                        {activeTab === tab.id && (
                            <div className="absolute inset-x-6 bottom-0 h-1 rounded-full bg-[linear-gradient(90deg,#0f172a_0%,#64748b_100%)]" />
                        )}
                    </button>
                ))}
            </nav>

            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.98 }}
                        className={`fixed top-6 ${isRtl ? 'left-4 md:left-6' : 'right-4 md:right-6'} z-[120] w-[calc(100vw-2rem)] max-w-md rounded-2xl border bg-white p-4 shadow-2xl ${messageType === 'success' ? 'border-emerald-100' : 'border-red-100'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${messageType === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {messageType === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-950">{messageType === 'success' ? (isRtl ? "تم الحفظ" : "Saved") : (isRtl ? "تعذر الحفظ" : "Save failed")}</p>
                                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{message}</p>
                            </div>
                            <button type="button" onClick={() => setMessage("")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                        />
                    )}
                    {activeTab === 'site_control' && (
                        <SiteControlTab localSettings={localSettings} updateSettings={updateSettings} t={t} />
                    )}
                </motion.div>

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
            <ConfirmDialog
                open={isSaveConfirmOpen}
                onOpenChange={setIsSaveConfirmOpen}
                title={isRtl ? "تأكيد حفظ التغييرات" : "Confirm save changes"}
                description={isRtl ? "سيتم تطبيق التعديلات على إعدادات لوحة التحكم والنصوص. هل تريد المتابعة؟" : "Your changes will be applied to dashboard settings and text content. Continue?"}
                confirmLabel={saving ? (isRtl ? "جار الحفظ..." : "Saving...") : (isRtl ? "نعم، احفظ" : "Yes, save")}
                cancelLabel={isRtl ? "إلغاء" : "Cancel"}
                onConfirm={async () => {
                    setIsSaveConfirmOpen(false);
                    await handleSave();
                }}
                loading={saving}
            />
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
56emwst                            <div className="relative">
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
    const [uploadingCover, setUploadingCover] = React.useState(false);

    const uploadLogo = async (file: File, type: 'white' | 'black' | 'cover') => {
        const setter = type === 'white' ? setUploadingWhite : type === 'black' ? setUploadingBlack : setUploadingCover;
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
                const url = data.url || data.imageUrl || data.path || data.data?.url;
                if (url) {
                    updateSettings(type === 'white' ? { logoWhiteUrl: url } : type === 'black' ? { logoBlackUrl: url } : { reportCoverUrl: url });
                }
            }
        } catch (e) {
            console.error('Logo upload failed', e);
        } finally {
            setter(false);
        }
    };

    const resolveAssetUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3030/api').replace(/\/+$/, '').replace(/\/api$/, '');
        return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
    };

    const colorPickerValue = (value?: string, fallback = '#ffffff') => {
        if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value.trim())) return value.trim();
        return fallback;
    };

    const setThemeValue = (key: string, value: string) => updateSettings({ [key]: value } as any);

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
                                <img src={resolveAssetUrl(localSettings.logoWhiteUrl)} alt="white logo" className="max-h-full max-w-full object-contain" />
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
                                <img src={resolveAssetUrl(localSettings.logoBlackUrl)} alt="black logo" className="max-h-full max-w-full object-contain" />
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

                <div className="p-6 bg-white rounded-3xl border border-slate-100 space-y-4">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">غلاف تقارير مسح الخريطة PDF</p>
                    <div className="flex items-center justify-center h-36 rounded-2xl bg-slate-100 overflow-hidden">
                        {localSettings.reportCoverUrl ? (
                            <img src={resolveAssetUrl(localSettings.reportCoverUrl)} alt="report cover" className="h-full w-full object-cover" />
                        ) : (
                            <div className="text-slate-300 text-[10px] font-black uppercase">لا توجد صورة غلاف</div>
                        )}
                    </div>
                    <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all">
                        {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadingCover ? 'جارٍ الرفع...' : 'رفع غلاف التقرير'}
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], 'cover'); }} />
                    </label>
                    <input
                        type="text"
                        value={localSettings.reportCoverUrl || ''}
                        onChange={(e) => updateSettings({ reportCoverUrl: e.target.value })}
                        placeholder="أو أدخل رابط صورة الغلاف مباشرة..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-4 text-[11px] font-mono text-slate-400 outline-none focus:border-slate-900"
                    />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                        تستخدم هذه الصورة كخلفية للصفحة الأولى في تقارير مسح الخريطة، ويمكن تغييرها من الأدمن في أي وقت.
                    </p>
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
                        <div className="rounded-2xl bg-slate-900 flex items-center justify-center p-4" style={{ minHeight: `${Number(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoWhiteUrl && <img src={resolveAssetUrl(localSettings.logoWhiteUrl)} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                        <div className="rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-4" style={{ minHeight: `${Number(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoBlackUrl && <img src={resolveAssetUrl(localSettings.logoBlackUrl)} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Icon Size Slider */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">حجم أيقونات الوصول السريع (الرئيسية)</label>
                        <span className="text-2xl font-black text-slate-900">{localSettings.quickActionsIconSize || '40'}<span className="text-[11px] text-slate-400 ml-1">px</span></span>
                    </div>
                    <input
                        type="range"
                        min={12}
                        max={64}
                        step={2}
                        value={parseInt(localSettings.quickActionsIconSize || '40', 10)}
                        onChange={(e) => updateSettings({ quickActionsIconSize: e.target.value })}
                        className="w-full accent-slate-900 h-2"
                    />
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                        <span>12px صغير جداً</span>
                        <span>64px كبير جداً</span>
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
                            { id: 'background', label: 'لون الخلفية', value: localSettings.background, fallback: '#f8fafc' },
                            { id: 'foreground', label: 'لون الخط العام', value: localSettings.foreground, fallback: '#0f172a' },
                            { id: 'sidebar', label: 'لون القائمة الجانبية', value: localSettings.sidebar, fallback: '#ffffff' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                                <div className="w-12 h-12 rounded-2xl shadow-inner flex-shrink-0" style={{ backgroundColor: color.value as string }} />
                                <div className="flex-grow">
                                    <label className="text-[11px] font-black text-slate-600 block mb-1">{color.label}</label>
                                    <input type="text" value={color.value as string} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-full bg-transparent border-none text-xs font-mono outline-none text-slate-400" />
                                </div>
                                <input type="color" value={colorPickerValue(color.value as string, color.fallback)} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                            </div>
                        ))}
                    </div>

                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pt-6">المربعات والأيقونات</h4>
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { id: 'cardBg', label: 'خلفية المربعات', value: (localSettings as any).cardBg || '#ffffff', fallback: '#ffffff' },
                            { id: 'cardText', label: 'لون نص المربعات', value: (localSettings as any).cardText || '#0f172a', fallback: '#0f172a' },
                            { id: 'cardBorder', label: 'لون حدود المربعات', value: (localSettings as any).cardBorder || '#e2e8f0', fallback: '#e2e8f0' },
                            { id: 'iconBg', label: 'خلفية الأيقونات', value: (localSettings as any).iconBg || '#f8fafc', fallback: '#f8fafc' },
                            { id: 'iconColor', label: 'لون الأيقونات', value: (localSettings as any).iconColor || '#0f172a', fallback: '#0f172a' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-xl">
                                <div className="w-12 h-12 rounded-2xl shadow-inner flex-shrink-0" style={{ backgroundColor: color.value }} />
                                <div className="flex-grow">
                                    <label className="text-[11px] font-black text-slate-600 block mb-1">{color.label}</label>
                                    <input type="text" value={color.value} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-full bg-transparent border-none text-xs font-mono outline-none text-slate-400" />
                                </div>
                                <input type="color" value={colorPickerValue(color.value, color.fallback)} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-600">استدارة المربعات</label>
                                <span className="text-sm font-black text-slate-900">{(localSettings as any).cardRadius || '24px'}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={40}
                                step={1}
                                value={parseInt(((localSettings as any).cardRadius || '24px').replace('px', ''), 10)}
                                onChange={(e) => setThemeValue('cardRadius', `${e.target.value}px`)}
                                className="w-full accent-slate-900"
                            />
                        </div>
                        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black text-slate-600">استدارة الأزرار والحقول</label>
                                <span className="text-sm font-black text-slate-900">{(localSettings as any).buttonRadius || '16px'}</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={32}
                                step={1}
                                value={parseInt(((localSettings as any).buttonRadius || '16px').replace('px', ''), 10)}
                                onChange={(e) => setThemeValue('buttonRadius', `${e.target.value}px`)}
                                className="w-full accent-slate-900"
                            />
                        </div>
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
                                    value={colorPickerValue(color.value as string, color.id === 'soonBadgeText' ? '#000000' : '#ffffff')}
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
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">وصف النظام في شاشة البداية</label>
                            <input type="text" value={localSettings.description || ''} onChange={(e) => updateSettings({ description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="وصف مختصر يظهر تحت الشعار..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">حجم الخط في المنصة</label>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-slate-400">12px</span>
                                        <span className="text-sm font-black text-slate-900">{localSettings.fontSize || '15px'}</span>
                                        <span className="text-[10px] font-black text-slate-400">20px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={12}
                                        max={20}
                                        step={1}
                                        value={parseInt((localSettings.fontSize || '15px').replace('px', ''), 10)}
                                        onChange={(e) => setThemeValue('fontSize', `${e.target.value}px`)}
                                        className="w-full accent-slate-900"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">نوع الخط</label>
                                <select
                                    value={localSettings.fontFamily || 'system-ui'}
                                    onChange={(e) => setThemeValue('fontFamily', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-xs font-bold outline-none focus:border-slate-900"
                                >
                                    <option value="system-ui">System UI</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="'Segoe UI'">Segoe UI</option>
                                    <option value="'Noto Sans Arabic'">Noto Sans Arabic</option>
                                </select>
                            </div>
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
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">حساب X / تويتر</label>
                            <input type="text" value={localSettings.contactTwitter || ''} onChange={(e) => updateSettings({ contactTwitter: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="@account أو رابط الحساب" dir="ltr" />
                        </div>
                        <div className="pt-4">
                            <label className="text-[11px] font-black text-slate-600 mb-2 block">النمط الليلي / النهاري</label>
                            <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                                <button onClick={() => updateSettings({ isDark: false })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${!localSettings.isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}><Sun className="w-4 h-4" /> نهاري</button>
                                <button onClick={() => updateSettings({ isDark: true })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${localSettings.isDark ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}><Moon className="w-4 h-4" /> ليلي</button>
                            </div>
                        </div>

                        <div className="pt-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">معاينة شكل المنصة</h4>
                            <div
                                className="p-6 border space-y-5"
                                style={{
                                    backgroundColor: localSettings.background,
                                    color: localSettings.foreground,
                                    borderColor: (localSettings as any).cardBorder || '#e2e8f0',
                                    borderRadius: (localSettings as any).cardRadius || '24px',
                                    fontFamily: localSettings.fontFamily || 'system-ui',
                                }}
                            >
                                <div
                                    className="p-5 border shadow-sm"
                                    style={{
                                        backgroundColor: (localSettings as any).cardBg || '#ffffff',
                                        color: (localSettings as any).cardText || '#0f172a',
                                        borderColor: (localSettings as any).cardBorder || '#e2e8f0',
                                        borderRadius: (localSettings as any).cardRadius || '24px',
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 flex items-center justify-center"
                                            style={{
                                                backgroundColor: (localSettings as any).iconBg || '#f8fafc',
                                                color: (localSettings as any).iconColor || '#0f172a',
                                                borderRadius: `min(${(localSettings as any).cardRadius || '24px'}, 24px)`,
                                            }}
                                        >
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black truncate">{localSettings.appName || 'الوساطة الرقمية'}</p>
                                            <p className="text-[11px] opacity-70 font-bold truncate">{localSettings.description || 'منصة عقارية شاملة'}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-5">
                                        <button
                                            type="button"
                                            className="px-4 py-2 text-[11px] font-black text-white"
                                            style={{
                                                backgroundColor: localSettings.primary,
                                                borderRadius: (localSettings as any).buttonRadius || '16px',
                                            }}
                                        >
                                            متاح
                                        </button>
                                        <span
                                            className="px-3 py-1.5 text-[10px] font-black"
                                            style={{
                                                backgroundColor: (localSettings as any).soonBadgeBg || '#ffffff',
                                                color: (localSettings as any).soonBadgeText || '#000000',
                                                borderRadius: (localSettings as any).buttonRadius || '16px',
                                            }}
                                        >
                                            قريباً
                                        </span>
                                    </div>
                                </div>
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
    searchTerm, setSearchTerm, textOverrides, setTextOverrides, language
}: TextTabProps) {
    const [viewMode, setViewMode] = useState<'structured' | 'traditional'>('structured');
    const [activeSection, setActiveSection] = useState<string>('welcome_screen');
    const isRtl = language === 'ar';

    // Traditional search/lookup states
    const [selectedCategory, setSelectedCategory] = useState<'admin' | 'public'>('admin');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
    const [selectedKeyGroup, setSelectedKeyGroup] = useState<string>('all');
    const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 15;

    // Reset page on search or filter change in traditional mode
    useEffect(() => {
        setPage(1);
    }, [selectedCategory, selectedSubcategory, selectedKeyGroup, searchTerm]);

    // Group definition for structured editing
    const STRUCTURED_SECTIONS = [
        {
            id: 'portal',
            title: 'بوابة الدخول والتحقق',
            icon: KeyRound,
            subcategories: [
                {
                    id: 'welcome_screen',
                    title: 'الواجهة الأولى (التشغيلية)',
                    icon: Play,
                    keys: ['project.name', 'header.welcome'],
                    controls: [
                        { key: 'welcomeBg', label: 'لون الخلفية', type: 'color', default: '#0f172a' },
                        { key: 'welcomeColor', label: 'لون النص', type: 'color', default: '#ffffff' },
                        { key: 'welcomeLogoSize', label: 'حجم الشعار (بكسل)', type: 'range', min: 40, max: 200, default: '100px' },
                        { key: 'welcomeLogoDuration', label: 'مدة الظهور (ثواني)', type: 'range', min: 1, max: 10, default: '3s' }
                    ]
                },
                {
                    id: 'login_screen',
                    title: 'تسجيل الدخول والتحقق OTP',
                    icon: ShieldCheck,
                    keys: ['header.login', 'action_login', 'action_register', 'auth.login_title', 'otp.title'],
                    controls: [
                        { key: 'loginBg', label: 'لون خلفية المربع', type: 'color', default: '#ffffff' },
                        { key: 'loginColor', label: 'لون النص الرئيسي', type: 'color', default: '#0f172a' },
                        { key: 'loginFontSize', label: 'حجم خط النصوص', type: 'select', options: ['12px', '14px', '15px', '16px', '18px'], default: '15px' },
                        { key: 'loginEmailEnabled', label: 'تفعيل الدخول بالبريد الإلكتروني', type: 'toggle', default: true },
                        { key: 'loginPhoneEnabled', label: 'تفعيل الدخول برقم الهاتف', type: 'toggle', default: false }
                    ]
                }
            ]
        },
        {
            id: 'support',
            title: 'خدمة العملاء',
            icon: LifeBuoy,
            subcategories: [
                {
                    id: 'customer_service',
                    title: 'تفاصيل خدمة العملاء والدعم',
                    icon: LifeBuoy,
                    keys: ['header.customerService', 'footer.support', 'contact_support_desc'],
                    controls: [
                        { key: 'csBg', label: 'لون خلفية الدعم', type: 'color', default: '#f8fafc' },
                        { key: 'csTextColor', label: 'لون نص الدعم', type: 'color', default: '#0f172a' },
                        { key: 'csFontSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px'], default: '14px' },
                        { key: 'csFontFamily', label: 'نوع الخط', type: 'select', options: ['system-ui', 'Arial', 'Tahoma', "'Noto Sans Arabic'"], default: 'system-ui' },
                        { key: 'csEnabled', label: 'تمكين قسم خدمة العملاء', type: 'toggle', default: true }
                    ]
                }
            ]
        },
        {
            id: 'top_bar',
            title: 'الشريط العلوي للموقع',
            icon: LayoutGrid,
            subcategories: [
                {
                    id: 'notifications',
                    title: 'الإشعارات والتنبيهات',
                    icon: Bell,
                    keys: ['admin.nav.notifications', 'admin.notifications.title'],
                    controls: [
                        { key: 'navBellColor', label: 'لون جرس الإشعارات', type: 'color', default: '#64748b' },
                        { key: 'navBadgeBg', label: 'لون خلفية عدد الإشعارات', type: 'color', default: '#ef4444' },
                        { key: 'navBadgeText', label: 'لون رقم عدد الإشعارات', type: 'color', default: '#ffffff' },
                        { key: 'notificationsEnabled', label: 'تمكين الإشعارات المباشرة', type: 'toggle', default: true }
                    ]
                },
                {
                    id: 'sounds',
                    title: 'الصوت والتحذيرات',
                    icon: Volume2,
                    keys: ['admin.warning.sound_error', 'admin.warning.sound_success'],
                    controls: [
                        { key: 'alertVolume', label: 'مستوى صوت التنبيهات', type: 'range', min: 0, max: 100, default: '50' },
                        { key: 'soundEffectsEnabled', label: 'تمكين المؤثرات الصوتية', type: 'toggle', default: true },
                        { key: 'warningSoundType', label: 'نغمة التحذير', type: 'select', options: ['default', 'beep', 'soft', 'none'], default: 'default' }
                    ]
                },
                {
                    id: 'languages',
                    title: 'اللغات والاختصارات',
                    icon: Globe,
                    keys: ['admin.nav.language', 'language.active_label'],
                    controls: [
                        { key: 'defaultLanguage', label: 'اللغة الافتراضية للنظام', type: 'select', options: ['ar', 'en'], default: 'ar' },
                        { key: 'showLanguageSwitcher', label: 'إظهار مبدل اللغات في الأعلى', type: 'toggle', default: true }
                    ]
                }
            ]
        },
        {
            id: 'admin_dashboard_group',
            title: 'لوحة التحكم للمدير',
            icon: Settings2,
            subcategories: [
                {
                    id: 'sidebar',
                    title: 'القائمة الجانبية',
                    icon: LayoutGrid,
                    keys: ['admin.nav.brand', 'admin.identity.badge', 'admin.nav.dashboard', 'admin.nav.users', 'admin.nav.settings'],
                    controls: [
                        { key: 'sidebarWidth', label: 'عرض القائمة (بكسل)', type: 'range', min: 220, max: 320, default: '260px' },
                        { key: 'sidebarBg', label: 'لون الخلفية', type: 'color', default: '#0f172a' },
                        { key: 'sidebarActiveBg', label: 'لون العنصر النشط', type: 'color', default: '#1e293b' },
                        { key: 'sidebarTextSize', label: 'حجم خط العناصر', type: 'select', options: ['12px', '13px', '14px', '15px'], default: '13px' }
                    ]
                },
                {
                    id: 'system_settings',
                    title: 'إعدادات النظام والتحكم',
                    icon: Settings2,
                    keys: ['admin.nav.settings', 'admin.services_mgmt.title'],
                    controls: [
                        { key: 'settingsPrimaryColor', label: 'اللون الرئيسي للأزرار والتحديد', type: 'color', default: '#0f172a' },
                        { key: 'settingsHeadingSize', label: 'حجم العناوين الرئيسية', type: 'select', options: ['18px', '20px', '24px'], default: '20px' }
                    ]
                },
                {
                    id: 'users_mgmt',
                    title: 'إدارة المستخدمين والتحقق',
                    icon: UserCheck,
                    keys: ['admin.nav.users', 'admin.identity.manager'],
                    controls: [
                        { key: 'verifiedBadgeColor', label: 'لون شارة التحقق الأخضر', type: 'color', default: '#10b981' },
                        { key: 'userRoleLabelSize', label: 'حجم خط شارة الدور', type: 'select', options: ['10px', '11px', '12px'], default: '10px' }
                    ]
                }
            ]
        },
        {
            id: 'stats_dashboards',
            title: 'الرئيسية ولوحات العرض',
            icon: Sparkles,
            subcategories: [
                {
                    id: 'subscribers_dashboard',
                    title: 'لوحة عرض المشتركين والعملاء',
                    icon: UserCheck,
                    keys: ['admin.nav.subscriptions', 'admin.nav.transactions'],
                    controls: [
                        { key: 'subscribersCardBg', label: 'لون خلفية كرت المشتركين', type: 'color', default: '#ffffff' },
                        { key: 'subscribersTextSize', label: 'حجم الخط في الجدول', type: 'select', options: ['11px', '12px', '13px'], default: '12px' }
                    ]
                },
                {
                    id: 'property_dashboard',
                    title: 'لوحة عرض العقارات والمعلنين',
                    icon: ImageIcon,
                    keys: ['admin.nav.offers', 'admin.offers.title'],
                    controls: [
                        { key: 'propertyCardBg', label: 'لون كرت العرض', type: 'color', default: '#ffffff' },
                        { key: 'propertyPriceColor', label: 'لون نص سعر العقار', type: 'color', default: '#0f172a' }
                    ]
                }
            ]
        },
        {
            id: 'contracts_finance',
            title: 'عقود وحسابات مالية',
            icon: DollarSign,
            subcategories: [
                {
                    id: 'property_cards',
                    title: 'بطاقات العقارات والتفاصيل',
                    icon: FileText,
                    keys: ['bm.prop.age', 'bm.order.price', 'bm.order.city', 'bm.order.neighborhood'],
                    controls: [
                        { key: 'cardRadiusVal', label: 'استدارة بطاقة العقار', type: 'range', min: 8, max: 32, default: '24px' },
                        { key: 'cardBorderColor', label: 'لون إطار البطاقة', type: 'color', default: '#e2e8f0' },
                        { key: 'badgeSoonBg', label: 'خلفية شارة "قريباً"', type: 'color', default: '#ffffff' },
                        { key: 'badgeSoonText', label: 'لون نص شارة "قريباً"', type: 'color', default: '#000000' }
                    ]
                },
                {
                    id: 'wallet_finance',
                    title: 'المحفظة والعمليات والاشتراكات',
                    icon: DollarSign,
                    keys: ['admin.nav.wallet', 'wallet.invoices.title', 'wallet.commission.title'],
                    controls: [
                        { key: 'walletCardBg', label: 'خلفية كرت المحفظة', type: 'color', default: '#0f172a' },
                        { key: 'walletBalanceColor', label: 'لون الرقم المالي للمحفظة', type: 'color', default: '#10b981' }
                    ]
                }
            ]
        },
        {
            id: 'legal_builder',
            title: 'القانونية وبناء المنصة',
            icon: BookOpen,
            subcategories: [
                {
                    id: 'privacy_terms',
                    title: 'سياسة الخصوصية والشروط',
                    icon: BookOpen,
                    keys: ['admin.nav.legal', 'footer.terms', 'footer.usage', 'footer.permits'],
                    controls: [
                        { key: 'legalHeadingColor', label: 'لون عناوين البنود', type: 'color', default: '#0f172a' },
                        { key: 'legalContentSize', label: 'حجم خط بنود الشروط', type: 'select', options: ['13px', '14px', '15px', '16px'], default: '14px' }
                    ]
                },
                {
                    id: 'footer_builder',
                    title: 'الفوتر وبناء الروابط',
                    icon: LayoutGrid,
                    keys: ['footer.rights', 'footer.brand_desc', 'footer.address', 'footer.quick_links'],
                    controls: [
                        { key: 'footerBgColor', label: 'لون خلفية الفوتر', type: 'color', default: '#f8fafc' },
                        { key: 'footerTextColor', label: 'لون نصوص الفوتر', type: 'color', default: '#64748b' }
                    ]
                }
            ]
        }
    ];

    // Find the currently active subcategory config
    const currentSubcategory = STRUCTURED_SECTIONS.flatMap(s => s.subcategories).find(sub => sub.id === activeSection);

    // Traditional lookup lists
    const SUBCATEGORIES: Record<'admin' | 'public', { id: string; label: string }[]> = {
        admin: [
            { id: 'all', label: 'الكل' },
            { id: 'nav', label: 'القائمة الجانبية' },
            { id: 'dashboard', label: 'الرئيسية والملخص' },
            { id: 'users', label: 'المستخدمين' },
            { id: 'offers', label: 'العروض' },
            { id: 'orders', label: 'الطلبات' },
            { id: 'transactions', label: 'العمليات' },
            { id: 'packages', label: 'الباقات والاشتراكات' },
            { id: 'settings', label: 'إعدادات النظام' },
            { id: 'marketing', label: 'التسويق البريدي' },
            { id: 'legal', label: 'القانونية' },
            { id: 'services', label: 'الخدمات والتسعير' },
            { id: 'info_content', label: 'المحتوى القانوني' },
        ],
        public: [
            { id: 'all', label: 'الكل' },
            { id: 'header', label: 'الهوية وأعلى الصفحة' },
            { id: 'footer', label: 'أسفل الصفحة (الروابط)' },
            { id: 'home', label: 'الصفحة الرئيسية' },
            { id: 'auth', label: 'الدخول والتحقق OTP' },
            { id: 'property', label: 'تفاصيل العقارات' },
            { id: 'wallet', label: 'المحفظة والفواتير' },
            { id: 'chat', label: 'الدردشة والرسائل' },
            { id: 'common', label: 'العامة والمنوعات' },
        ]
    };

    const getTranslationKeyCategory = React.useCallback((key: string): { category: 'admin' | 'public'; subcategory: string } => {
        if (key.startsWith('admin.') || key.startsWith('offers.') || key.startsWith('offer.') || key.startsWith('orders.')) {
            if (key.startsWith('admin.nav.')) return { category: 'admin', subcategory: 'nav' };
            if (key.startsWith('admin.dashboard.') || key.startsWith('admin.stats.') || key.startsWith('admin.scan.') || key.startsWith('admin.activity.')) return { category: 'admin', subcategory: 'dashboard' };
            if (key.startsWith('admin.users.')) return { category: 'admin', subcategory: 'users' };
            if (key.startsWith('admin.offers.') || key.startsWith('admin.nav.offers') || key.startsWith('offers.') || key.startsWith('offer.')) return { category: 'admin', subcategory: 'offers' };
            if (key.startsWith('admin.orders.') || key.startsWith('admin.nav.orders_mgmt') || key.startsWith('orders.')) return { category: 'admin', subcategory: 'orders' };
            if (key.startsWith('admin.trans.')) return { category: 'admin', subcategory: 'transactions' };
            if (key.startsWith('admin.packages.')) return { category: 'admin', subcategory: 'packages' };
            if (key.startsWith('admin.settings.')) return { category: 'admin', subcategory: 'settings' };
            if (key.startsWith('admin.marketing.') || key.startsWith('marketing.')) return { category: 'admin', subcategory: 'marketing' };
            if (key.startsWith('admin.legal.')) return { category: 'admin', subcategory: 'legal' };
            if (key.startsWith('admin.services_mgmt.') || key.startsWith('admin.service_requests.') || key.startsWith('service.')) return { category: 'admin', subcategory: 'services' };
            if (key.startsWith('admin.info_content.')) return { category: 'admin', subcategory: 'info_content' };
            return { category: 'admin', subcategory: 'dashboard' };
        } else {
            if (key.startsWith('header.')) return { category: 'public', subcategory: 'header' };
            if (key.startsWith('footer.')) return { category: 'public', subcategory: 'footer' };
            if (key.startsWith('home.')) return { category: 'public', subcategory: 'home' };
            if (key.startsWith('otp.') || key.startsWith('auth.') || key.startsWith('login.')) return { category: 'public', subcategory: 'auth' };
            if (key.startsWith('pm.') || key.startsWith('details.') || key.startsWith('cards.') || key.startsWith('bm.')) return { category: 'public', subcategory: 'property' };
            if (key.startsWith('wallet.')) return { category: 'public', subcategory: 'wallet' };
            if (key.startsWith('chat.')) return { category: 'public', subcategory: 'chat' };
            return { category: 'public', subcategory: 'common' };
        }
    }, []);

    const allKeys = React.useMemo(() => {
        return Array.from(new Set([
            ...Object.keys(translations.ar),
            ...Object.keys(translations.en),
        ]));
    }, []);

    const subcategoryLabelMap = React.useMemo(() => {
        const map: Record<string, string> = {};
        Object.values(SUBCATEGORIES).flat().forEach((item) => {
            map[item.id] = item.label;
        });
        return map;
    }, []);

    const getKeyGroup = React.useCallback((key: string, subcategory: string) => {
        const parts = key.split('.');
        const raw = selectedCategory === 'admin'
            ? (key.startsWith('admin.') ? (parts[2] || parts[1] || subcategory) : (parts[1] || subcategory))
            : (parts[1] || parts[0] || subcategory);
        return raw.replace(/_/g, ' ');
    }, [selectedCategory]);

    const subcategoryCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        allKeys.forEach((key) => {
            const { category, subcategory } = getTranslationKeyCategory(key);
            if (category === selectedCategory) {
                counts[subcategory] = (counts[subcategory] || 0) + 1;
                counts['all'] = (counts['all'] || 0) + 1;
            }
        });
        return counts;
    }, [allKeys, selectedCategory, getTranslationKeyCategory]);

    const categoryScopedKeys = React.useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();
        return allKeys
            .filter((key) => {
                const { category } = getTranslationKeyCategory(key);
                if (category !== selectedCategory) return false;

                const arValue = translations.ar[key as keyof typeof translations.ar] || "";
                const enValue = translations.en[key as keyof typeof translations.en] || "";
                
                const matchesSearch = !normalizedSearch
                    || key.toLowerCase().includes(normalizedSearch)
                    || arValue.toLowerCase().includes(normalizedSearch)
                    || enValue.toLowerCase().includes(normalizedSearch);

                return matchesSearch;
            })
            .sort((a, b) => {
                const aMeta = getTranslationKeyCategory(a);
                const bMeta = getTranslationKeyCategory(b);
                if (aMeta.subcategory !== bMeta.subcategory) {
                    return (subcategoryLabelMap[aMeta.subcategory] || aMeta.subcategory).localeCompare(subcategoryLabelMap[bMeta.subcategory] || bMeta.subcategory, 'ar');
                }
                const aGroup = getKeyGroup(a, aMeta.subcategory);
                const bGroup = getKeyGroup(b, bMeta.subcategory);
                if (aGroup !== bGroup) return aGroup.localeCompare(bGroup, 'ar');
                return a.localeCompare(b);
            });
    }, [allKeys, searchTerm, selectedCategory, getTranslationKeyCategory, subcategoryLabelMap, getKeyGroup]);

    const visibleTranslationKeys = React.useMemo(() => {
        return categoryScopedKeys.filter((key) => {
            const { subcategory } = getTranslationKeyCategory(key);
            if (selectedSubcategory !== 'all' && subcategory !== selectedSubcategory) return false;
            return true;
        });
    }, [categoryScopedKeys, getTranslationKeyCategory, selectedSubcategory]);

    const groupedVisibleTranslationKeys = React.useMemo(() => {
        if (selectedKeyGroup === 'all') return visibleTranslationKeys;
        return visibleTranslationKeys.filter((key) => {
            const meta = getTranslationKeyCategory(key);
            return getKeyGroup(key, meta.subcategory) === selectedKeyGroup;
        });
    }, [visibleTranslationKeys, selectedKeyGroup, getTranslationKeyCategory, getKeyGroup]);

    const paginatedKeys = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return groupedVisibleTranslationKeys.slice(start, start + pageSize);
    }, [groupedVisibleTranslationKeys, page]);

    const totalPages = Math.ceil(groupedVisibleTranslationKeys.length / pageSize);

    // Total modified translations count
    const modifiedCount = React.useMemo(() => {
        let count = 0;
        allKeys.forEach((key) => {
            if (textOverrides['ar_' + key] !== undefined || textOverrides['en_' + key] !== undefined) {
                count++;
            }
        });
        return count;
    }, [allKeys, textOverrides]);

    return (
        <div className="p-8 space-y-6">
            {/* Header section with Stats & Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white">
                        <Languages className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">إدارة النصوص والترجمات المتكاملة</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            تعديل المسميات والرسائل وتصميم المنصة في مكان واحد
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* View Mode Toggle */}
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                        <button
                            onClick={() => setViewMode('structured')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                viewMode === 'structured'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            التخصيص المنظم
                        </button>
                        <button
                            onClick={() => setViewMode('traditional')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                viewMode === 'traditional'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            البحث التقليدي
                        </button>
                    </div>

                    {modifiedCount > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2 text-amber-700 text-xs font-black">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            لديك {modifiedCount} تعديل لم يتم حفظه بعد
                        </div>
                    )}
                </div>
            </div>

            {/* View Mode 1: Structured Management */}
            {viewMode === 'structured' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Structured Categories & Subcategories */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] border border-slate-200 rounded-[2.5rem] p-4 space-y-4 shadow-sm">
                            <div className="rounded-[1.75rem] bg-slate-950 p-4 text-white">
                                <h4 className="text-[11px] font-black">شجرة الأقسام والهوية</h4>
                                <p className="mt-1 text-[10px] font-bold text-slate-300">تصفح أقسام المنصة مباشرة لتعديلها</p>
                            </div>
                            
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                                {STRUCTURED_SECTIONS.map((sec) => {
                                    const SecIcon = sec.icon;
                                    return (
                                        <div key={sec.id} className="space-y-2">
                                            <div className="flex items-center gap-2 px-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                <SecIcon className="w-3.5 h-3.5" />
                                                <span>{sec.title}</span>
                                            </div>
                                            <div className="space-y-1 pl-2 border-r border-slate-100 mr-2">
                                                {sec.subcategories.map((sub) => {
                                                    const SubIcon = sub.icon;
                                                    const isActive = activeSection === sub.id;
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => setActiveSection(sub.id)}
                                                            className={`w-full flex items-center gap-2.5 text-right px-3 py-2.5 text-xs font-black rounded-xl transition-all ${
                                                                isActive
                                                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                            }`}
                                                        >
                                                            <SubIcon className="w-3.5 h-3.5" />
                                                            <span>{sub.title}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Controls, Customizer & Associated Texts */}
                    <div className="lg:col-span-3 space-y-6">
                        {currentSubcategory && (
                            <div className="space-y-6">
                                {/* Component Customizer & Settings Card */}
                                <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] border border-slate-200 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-slate-900/5 text-slate-900 rounded-xl">
                                                <Sliders className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-950">{currentSubcategory.title} - التحكم بالألوان والأحجام</h4>
                                                <p className="text-[10px] font-bold text-slate-400">تعديل الإعدادات والسمات المخصصة لهذا الجزء</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings Controls Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {currentSubcategory.controls?.map((ctrl) => {
                                            const currentValue = localSettings[ctrl.key] !== undefined ? localSettings[ctrl.key] : ctrl.default;
                                            return (
                                                <div key={ctrl.key} className="space-y-2 bg-white/60 p-4 border border-slate-100 rounded-2xl">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[11px] font-black text-slate-600">{ctrl.label}</label>
                                                        <span className="text-[10px] font-mono text-slate-400 font-bold">{String(currentValue)}</span>
                                                    </div>
                                                    
                                                    {ctrl.type === 'color' && (
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="color"
                                                                value={currentValue}
                                                                onChange={(e) => updateSettings({ [ctrl.key]: e.target.value })}
                                                                className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={currentValue}
                                                                onChange={(e) => updateSettings({ [ctrl.key]: e.target.value })}
                                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-bold font-mono text-left outline-none"
                                                            />
                                                        </div>
                                                    )}

                                                    {ctrl.type === 'range' && (
                                                        <input
                                                            type="range"
                                                            min={(ctrl as any).min}
                                                            max={(ctrl as any).max}
                                                            value={parseInt(String(currentValue).replace('px', '').replace('s', ''), 10) || (ctrl as any).min}
                                                            onChange={(e) => {
                                                                const suffix = ctrl.key.toLowerCase().includes('size') || ctrl.key.toLowerCase().includes('width') || ctrl.key.toLowerCase().includes('radius') ? 'px' : ctrl.key.toLowerCase().includes('duration') ? 's' : '';
                                                                updateSettings({ [ctrl.key]: `${e.target.value}${suffix}` });
                                                            }}
                                                            className="w-full accent-slate-900"
                                                        />
                                                    )}

                                                    {ctrl.type === 'select' && (
                                                        <select
                                                            value={currentValue}
                                                            onChange={(e) => updateSettings({ [ctrl.key]: e.target.value })}
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
                                                        >
                                                            {(ctrl as any).options?.map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {ctrl.type === 'toggle' && (
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (ctrl.key.startsWith('login')) {
                                                                        const nestedKey = ctrl.key.replace('login', '');
                                                                        const formattedKey = nestedKey.charAt(0).toLowerCase() + nestedKey.slice(1);
                                                                        updateSettings({
                                                                            loginConfig: {
                                                                                ...localSettings.loginConfig,
                                                                                [formattedKey]: !localSettings.loginConfig?.[formattedKey]
                                                                            }
                                                                        });
                                                                    } else {
                                                                        updateSettings({ [ctrl.key]: !currentValue });
                                                                    }
                                                                }}
                                                                className={`w-12 h-6 rounded-full transition-all relative ${
                                                                    (ctrl.key.startsWith('login') ? localSettings.loginConfig?.[ctrl.key.replace('login', '').charAt(0).toLowerCase() + ctrl.key.replace('login', '').slice(1)] : currentValue)
                                                                        ? 'bg-emerald-500'
                                                                        : 'bg-slate-200'
                                                                }`}
                                                            >
                                                                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${
                                                                    (ctrl.key.startsWith('login') ? localSettings.loginConfig?.[ctrl.key.replace('login', '').charAt(0).toLowerCase() + ctrl.key.replace('login', '').slice(1)] : currentValue)
                                                                        ? 'translate-x-6'
                                                                        : ''
                                                                }`} />
                                                            </button>
                                                            <span className="text-[10px] font-bold text-slate-500">
                                                                {(ctrl.key.startsWith('login') ? localSettings.loginConfig?.[ctrl.key.replace('login', '').charAt(0).toLowerCase() + ctrl.key.replace('login', '').slice(1)] : currentValue) ? 'نشط' : 'معطل'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Live Preview Card */}
                                    <div className="border border-slate-100 rounded-3xl p-6 bg-white space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>معاينة حية للمكون المتأثر</span>
                                        </div>

                                        {activeSection === 'welcome_screen' && (
                                            <div
                                                className="flex flex-col items-center justify-center p-8 rounded-2xl min-h-[160px] text-center transition-all"
                                                style={{
                                                    backgroundColor: localSettings.welcomeBg || '#0f172a',
                                                    color: localSettings.welcomeColor || '#ffffff',
                                                }}
                                            >
                                                <div
                                                    className="border-2 border-dashed border-white/20 rounded-full flex items-center justify-center mb-3 animate-pulse"
                                                    style={{
                                                        width: localSettings.welcomeLogoSize || '100px',
                                                        height: localSettings.welcomeLogoSize || '100px',
                                                    }}
                                                >
                                                    <Sparkles className="w-8 h-8" />
                                                </div>
                                                <h5 className="text-sm font-black">
                                                    {textOverrides['ar_project.name'] || translations.ar['project.name']}
                                                </h5>
                                                <span className="text-[9px] opacity-60 mt-1 font-bold">
                                                    عرض لمدة {localSettings.welcomeLogoDuration || '3s'}
                                                </span>
                                            </div>
                                        )}

                                        {activeSection === 'login_screen' && (
                                            <div
                                                className="p-6 rounded-2xl border transition-all text-right space-y-4"
                                                style={{
                                                    backgroundColor: localSettings.loginBg || '#ffffff',
                                                    color: localSettings.loginColor || '#0f172a',
                                                    fontSize: localSettings.loginFontSize || '15px'
                                                }}
                                            >
                                                <div className="text-right">
                                                    <h5 className="font-black text-sm">
                                                        {textOverrides['ar_auth.login_title'] || translations.ar['auth.login_title'] || 'سجل الدخول للمنصة'}
                                                    </h5>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">ادخل تفاصيلك لمتابعة العمل</p>
                                                </div>
                                                <div className="space-y-3">
                                                    {localSettings.loginConfig?.emailEnabled !== false && (
                                                        <input
                                                            type="email"
                                                            placeholder="البريد الإلكتروني..."
                                                            disabled
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none cursor-not-allowed"
                                                        />
                                                    )}
                                                    {localSettings.loginConfig?.phoneEnabled && (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                placeholder="رقم الجوال..."
                                                                disabled
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs outline-none cursor-not-allowed"
                                                            />
                                                            <span className="text-[8px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                                                                {localSettings.loginConfig?.phoneLabel || 'موقف'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black"
                                                    style={{ backgroundColor: localSettings.settingsPrimaryColor || '#0f172a' }}
                                                >
                                                    {textOverrides['ar_action_login'] || translations.ar['action_login'] || 'تسجيل الدخول'}
                                                </button>
                                            </div>
                                        )}

                                        {activeSection === 'customer_service' && (
                                            <div
                                                className="p-6 rounded-2xl border transition-all space-y-3"
                                                style={{
                                                    backgroundColor: localSettings.csBg || '#f8fafc',
                                                    color: localSettings.csTextColor || '#0f172a',
                                                    fontFamily: localSettings.csFontFamily || 'system-ui',
                                                    fontSize: localSettings.csFontSize || '14px'
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-900/5 rounded-xl flex items-center justify-center">
                                                        <LifeBuoy className="w-5 h-5 text-slate-700" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-xs">
                                                            {textOverrides['ar_header.customerService'] || translations.ar['header.customerService'] || 'خدمة العملاء'}
                                                        </h5>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">
                                                            {textOverrides['ar_contact_support_desc'] || 'نحن متواجدون لمساعدتك على مدار الساعة'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Fallback Preview */}
                                        {!['welcome_screen', 'login_screen', 'customer_service'].includes(activeSection) && (
                                            <div className="p-6 rounded-2xl border bg-slate-50 text-slate-400 text-xs text-center font-bold">
                                                المكون نشط ومربوط بـ {currentSubcategory.keys?.length} نصوص رئيسية.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Associated Texts Editing Section */}
                                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
                                    <div className="border-b border-slate-100 pb-4">
                                        <h4 className="text-base font-black text-slate-950">النصوص والمسميات المرتبطة</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">تعديل نصوص الترجمة الخاصة بهذا القسم مباشرة</p>
                                    </div>

                                    <div className="space-y-6">
                                        {currentSubcategory.keys?.map((key) => (
                                            <div key={key} className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-mono font-black text-slate-400 select-all">{key}</span>
                                                    {(textOverrides['ar_' + key] !== undefined || textOverrides['en_' + key] !== undefined) && (
                                                        <button
                                                            onClick={() => {
                                                                const n = { ...textOverrides };
                                                                delete n['ar_' + key];
                                                                delete n['en_' + key];
                                                                setTextOverrides(n);
                                                            }}
                                                            className="text-[10px] font-black text-red-500 bg-red-50 px-2.5 py-1 rounded-xl flex items-center gap-1.5 hover:bg-red-100 transition-all"
                                                        >
                                                            <RefreshCw className="w-3 h-3" />
                                                            <span>افتراضي</span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">العربية</label>
                                                        <input
                                                            type="text"
                                                            value={textOverrides['ar_' + key] !== undefined ? textOverrides['ar_' + key] : (translations.ar[key as keyof typeof translations.ar] || "")}
                                                            onChange={(e) => setTextOverrides(prev => ({ ...prev, ['ar_' + key]: e.target.value }))}
                                                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 transition-all"
                                                        />
                                                    </div>
                                                    <div dir="ltr" className="space-y-1.5 text-left">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">English</label>
                                                        <input
                                                            type="text"
                                                            value={textOverrides['en_' + key] !== undefined ? textOverrides['en_' + key] : (translations.en[key as keyof typeof translations.en] || "")}
                                                            onChange={(e) => setTextOverrides(prev => ({ ...prev, ['en_' + key]: e.target.value }))}
                                                            className="w-full bg-white border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 transition-all text-left"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Mode 2: Traditional Full List Search */}
            {viewMode === 'traditional' && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Categories and Subcategories Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] border border-slate-200 rounded-[2rem] p-4 space-y-2 shadow-sm">
                            {/* Scopes selector */}
                            <div className="flex p-1 bg-slate-100 rounded-2xl mb-4">
                                <button
                                    onClick={() => { setSelectedCategory('admin'); setSelectedSubcategory('all'); }}
                                    className={`flex-1 py-2 text-center text-[11px] font-black rounded-xl transition-all ${
                                        selectedCategory === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                    }`}
                                >
                                    لوحة التحكم
                                </button>
                                <button
                                    onClick={() => { setSelectedCategory('public'); setSelectedSubcategory('all'); }}
                                    className={`flex-1 py-2 text-center text-[11px] font-black rounded-xl transition-all ${
                                        selectedCategory === 'public' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                                    }`}
                                >
                                    الموقع العام
                                </button>
                            </div>

                            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white mb-3">
                                <h4 className="text-[11px] font-black">الفئة الفرعية</h4>
                                <p className="mt-1 text-[10px] font-bold text-slate-300">اختر الفئة لعرض مفاتيحها</p>
                            </div>
                            
                            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                                {SUBCATEGORIES[selectedCategory].map((sub) => {
                                    const count = subcategoryCounts[sub.id] || 0;
                                    const isActive = selectedSubcategory === sub.id;
                                    if (sub.id !== 'all' && count === 0) return null;
                                    return (
                                        <button
                                            key={sub.id}
                                            onClick={() => {
                                                setSelectedSubcategory(sub.id);
                                                setSelectedKeyGroup('all');
                                            }}
                                            className={`w-full flex items-center justify-between text-right px-4 py-3 text-xs font-black rounded-xl transition-all ${
                                                isActive
                                                    ? 'bg-slate-900 text-white shadow-sm'
                                                    : 'bg-white text-slate-500 border border-slate-100 hover:text-slate-950 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span>{sub.label}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search Input inside Traditional mode */}
                        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">بحث وتنقيب سريع</h4>
                            <div className="relative">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-slate-100 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                                    placeholder="اكتب كلمة للبحث..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Traditional Inputs Display */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] border border-slate-200 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                                <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white">
                                    {selectedCategory === 'admin' ? 'الإدارة' : 'الموقع العام'}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-500">
                                    {selectedSubcategory === 'all' ? 'كل الفئات الفرعية' : (subcategoryLabelMap[selectedSubcategory] || selectedSubcategory)}
                                </span>
                            </div>

                            {paginatedKeys.length === 0 ? (
                                <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                                    <Languages className="w-12 h-12 text-slate-300 mb-4 stroke-[1.5]" />
                                    <h4 className="text-base font-black text-slate-700">لم يتم العثور على أي نصوص</h4>
                                    <p className="text-slate-400 text-xs mt-1">جرب تغيير كلمة البحث أو اختيار تصنيف فرعي آخر</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {paginatedKeys.map((key) => (
                                        <div key={key} className="p-6 md:p-8 bg-white rounded-[2rem] border border-slate-200 transition-all hover:border-slate-900/20 group shadow-sm">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                                        {subcategoryLabelMap[getTranslationKeyCategory(key).subcategory] || getTranslationKeyCategory(key).subcategory}
                                                    </span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono select-all">
                                                        {key}
                                                    </span>
                                                </div>
                                                {(textOverrides['ar_' + key] !== undefined || textOverrides['en_' + key] !== undefined) && (
                                                    <button
                                                        onClick={() => {
                                                            const n = { ...textOverrides };
                                                            delete n['ar_' + key];
                                                            delete n['en_' + key];
                                                            setTextOverrides(n);
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-red-500 rounded-xl hover:bg-red-50/50 transition-all flex items-center gap-1.5 text-[10px] font-black"
                                                        title="استعادة النص الافتراضي"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                        <span>افتراضي</span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">العربية</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={textOverrides['ar_' + key] !== undefined ? textOverrides['ar_' + key] : (translations.ar[key as keyof typeof translations.ar] || "")}
                                                        onChange={(e) => setTextOverrides(prev => ({ ...prev, ['ar_' + key]: e.target.value }))}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl focus:shadow-slate-100 transition-all"
                                                    />
                                                </div>
                                                <div dir="ltr" className="space-y-1.5 text-left">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">English</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={textOverrides['en_' + key] !== undefined ? textOverrides['en_' + key] : (translations.en[key as keyof typeof translations.en] || "")}
                                                        onChange={(e) => setTextOverrides(prev => ({ ...prev, ['en_' + key]: e.target.value }))}
                                                        className="w-full bg-white border border-slate-100 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl focus:shadow-slate-100 transition-all text-left"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-100 text-slate-500 text-xs font-black hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                        <span>السابق</span>
                                    </button>

                                    <span className="text-xs font-black text-slate-500">
                                        صفحة {page} من {totalPages} (عرض {groupedVisibleTranslationKeys.length} نصوص)
                                    </span>

                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border-slate-100 text-slate-500 text-xs font-black hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
                                    >
                                        <span>التالي</span>
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



function SiteControlTab({ localSettings, updateSettings, t }: TabProps) {
    const [selectedSub, setSelectedSub] = useState<string>('all');
    const [query, setQuery] = useState('');
    const [selectedSectionGroup, setSelectedSectionGroup] = useState<string>('all');
    const [selectedModuleGroup, setSelectedModuleGroup] = useState<string>('all');

    function filterByQuery(items: { id: string; label: string; [key: string]: any }[]) {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((x) => `${x.label} ${x.id}`.toLowerCase().includes(q));
    }



    const SectionRow = ({ id, label }: { id: string; label: string }) => {
        const v = (localSettings.sectionFlags || {})[id] === 'open' ? 'open' : 'closed';
        const setV = (next: 'open' | 'closed') => updateSettings({ sectionFlags: { ...(localSettings.sectionFlags || {}), [id]: next } });
        return (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${v === 'open' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                            {v === 'open' ? 'ظاهر الآن' : 'قريباً'}
                        </span>
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
            <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                            status === 'enabled' ? 'bg-emerald-50 text-emerald-600' : status === 'soon' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {status === 'enabled' ? 'مفعل' : status === 'soon' ? 'قريباً' : 'مخفي'}
                        </span>
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
            <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate">{label}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{`details:${id}`}</p>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${
                            status === 'enabled' ? 'bg-emerald-50 text-emerald-600' : status === 'soon' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {status === 'enabled' ? 'مفعل' : status === 'soon' ? 'قريباً' : 'مخفي'}
                        </span>
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
        { id: 'wallet', label: 'المحفظة المالية (واجهة المستخدم)', group: 'الخدمات المتخصصة' },
        { id: 'orders', label: 'إدارة الطلبات (واجهة المستخدم)', group: 'الخدمات والمعاملات' },
        { id: 'offers', label: 'العروض العقارية (واجهة المستخدم)', group: 'الخدمات والمعاملات' },
        { id: 'services', label: 'الخدمات (واجهة المستخدم)', group: 'الخدمات والمعاملات' },
        { id: 'buildingmanagement', label: 'إدارة الأملاك (واجهة المستخدم)', group: 'الخدمات المتخصصة' },
        { id: 'marketing', label: 'التسويق (واجهة المستخدم)', group: 'الخدمات والمعاملات' },
        { id: 'scan_map', label: 'المسح والمخططات', group: 'الخدمات المتخصصة' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات (واجهة المستخدم)', group: 'الخدمات المتخصصة' },
        { id: 'financial', label: 'التقارير المالية (واجهة المستخدم)', group: 'الخدمات المتخصصة' },
        { id: 'disputes', label: 'المنازعات والقانونية (واجهة المستخدم)', group: 'الخدمات المتخصصة' },
        { id: 'customerservice', label: 'مركز العناية بالعملاء', group: 'الخدمات والمعاملات' },
        { id: 'internal', label: 'الإدارة الداخلية (الواجهة)', group: 'الرئيسية والتنقل' },
        { id: 'map', label: 'خريطة الموقع (الرئيسية)', group: 'الرئيسية والتنقل' },
        { id: 'details', label: 'صفحة التفاصيل (الرئيسية)', group: 'الرئيسية والتنقل' },
    ]);

    const modules = filterByQuery([
        { id: 'dashboard', label: 'لوح التحكم', group: 'الأساسيات' },
        { id: 'users', label: 'المستخدمين', group: 'الأساسيات' },
        { id: 'internal_stats', label: 'الإحصاءات (داخل الإدارة)', group: 'التشغيل اليومي' },
        { id: 'map_control', label: 'الخريطة', group: 'التشغيل اليومي' },
        { id: 'operations', label: 'الإحصائيات والعمليات', group: 'التشغيل اليومي' },
        { id: 'trends', label: 'التحليلات والاتجاهات', group: 'التشغيل اليومي' },
        { id: 'customer_service', label: 'خدمة العملاء', group: 'الأساسيات' },
        { id: 'settings', label: 'الإعدادات والتحكم', group: 'الأساسيات' },
        { id: 'chat', label: 'الدردشة', group: 'الأساسيات' },
        { id: 'service_requests', label: 'طلبات الخدمات', group: 'التشغيل اليومي' },
        { id: 'marketing', label: 'إدارة التسويق', group: 'الإدارات المتخصصة' },
        { id: 'properties', label: 'إدارة الأملاك', group: 'الإدارات المتخصصة' },
        { id: 'finance', label: 'الإدارة المالية', group: 'الإدارات المتخصصة' },
        { id: 'legal', label: 'الإدارة القانونية', group: 'الإدارات المتخصصة' },
        { id: 'employees', label: 'إدارة الموظفين', group: 'الأساسيات' },
        { id: 'offers', label: 'العروض', group: 'التشغيل اليومي' },
        { id: 'orders', label: 'الطلبات', group: 'التشغيل اليومي' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات', group: 'الإدارات المتخصصة' },
        { id: 'wallet', label: 'المحفظة', group: 'الإدارات المتخصصة' },
        { id: 'wallet_invoices', label: 'المحفظة: الفواتير', group: 'تفريعات متقدمة' },
        { id: 'wallet_commissions', label: 'المحفظة: العمولات', group: 'تفريعات متقدمة' },
        { id: 'wallet_files', label: 'المحفظة: الملفات والمستندات', group: 'تفريعات متقدمة' },
        { id: 'wallet_investments', label: 'المحفظة: الاستثمارات', group: 'تفريعات متقدمة' },
        { id: 'services_postPurchase', label: 'الخدمات: ما بعد الشراء', group: 'تفريعات متقدمة' },
        { id: 'services_legal', label: 'الخدمات: القانونية', group: 'تفريعات متقدمة' },
        { id: 'services_construction', label: 'الخدمات: البناء والمقاولات', group: 'تفريعات متقدمة' },
        { id: 'services_marketing', label: 'الخدمات: التسويق', group: 'تفريعات متقدمة' },
        { id: 'services_other', label: 'الخدمات: أخرى', group: 'تفريعات متقدمة' },
        { id: 'legal_disputes', label: 'القانوني: المنازعات العقارية', group: 'تفريعات متقدمة' },
        { id: 'legal_contracts', label: 'القانوني: العقود', group: 'تفريعات متقدمة' },
        { id: 'legal_documentation', label: 'القانوني: التوثيق', group: 'تفريعات متقدمة' },
        { id: 'legal_other', label: 'القانوني: أخرى', group: 'تفريعات متقدمة' },
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

    const subcategories = [
        { id: 'all',     label: 'عرض الكل',                  icon: LayoutGrid,    count: sections.length + modules.length + uiFlags.length + detailsParts.length + 2 },
        { id: 'sections', label: 'أقسام الموقع (المستخدم)',   icon: Globe,         count: sections.length },
        { id: 'modules',  label: 'تبويبات لوحة التحكم',       icon: ShieldQuestion, count: modules.length },
        { id: 'login',    label: 'طرق تسجيل الدخول',          icon: Smartphone,    count: 2 },
        { id: 'ui',       label: 'عناصر الواجهة',              icon: Zap,           count: uiFlags.length },
        { id: 'details',  label: 'أقسام صفحة التفاصيل',        icon: Type,          count: detailsParts.length },
    ];

    const showSection  = selectedSub === 'all' || selectedSub === 'sections';
    const showModules  = selectedSub === 'all' || selectedSub === 'modules';
    const showLogin    = selectedSub === 'all' || selectedSub === 'login';
    const showUi       = selectedSub === 'all' || selectedSub === 'ui';
    const showDetails  = selectedSub === 'all' || selectedSub === 'details';
    function groupItems(items: { group?: string; [key: string]: any }[]) {
        return Object.entries(items.reduce((acc, item) => {
            const key = item.group || 'عام';
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
        }, {} as Record<string, any[]>));
    }

    const sectionGroups = groupItems(sections);
    const moduleGroups = groupItems(modules);

    useEffect(() => {
        setSelectedSectionGroup('all');
        setSelectedModuleGroup('all');
    }, [query, selectedSub]);

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-900 rounded-2xl text-white">
                        <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">التحكم والوصول</h3>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                            تفعيل وتعطيل أقسام الموقع وميزات لوحة التحكم
                        </p>
                    </div>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pr-12 pl-6 text-sm font-bold outline-none focus:border-slate-900 transition-all"
                        placeholder="ابحث (العروض، الطلبات...)"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Subcategory Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] border border-slate-200 rounded-[2rem] p-4 space-y-1.5 sticky top-4 shadow-sm">
                        <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white mb-3">
                            <h4 className="text-[11px] font-black">الفئات الرئيسية</h4>
                            <p className="mt-1 text-[10px] font-bold text-slate-300">ترتيب هرمي: قسم رئيسي ثم مجموعة فرعية ثم العناصر</p>
                        </div>
                        {subcategories.map((sub) => {
                            const Icon = sub.icon;
                            const isActive = selectedSub === sub.id;
                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSub(sub.id)}
                                    className={`w-full flex items-center justify-between text-right px-4 py-3 rounded-[1.25rem] text-xs font-black transition-all border ${
                                        isActive
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/20'
                                            : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-100 hover:text-slate-900 hover:border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                        <div>
                                            <p>{sub.label}</p>
                                            <p className={`mt-1 text-[10px] font-bold ${isActive ? 'text-slate-200' : 'text-slate-400'}`}>عرض المجموعة</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {sub.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3 space-y-8">

                    {/* User-facing Sections */}
                    {showSection && sections.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-950">أقسام الموقع (العملاء)</h4>
                                    <p className="text-[10px] font-bold text-slate-400">{sections.length} قسم — تحكم في الظهور للمستخدمين</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                {sectionGroups.length > 1 && (
                                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4">
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Sub Sub Tabs</p>
                                            <p className="mt-1 text-xs font-bold text-slate-600">المجموعات المرتبطة داخل أقسام الموقع</p>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSectionGroup('all')}
                                                className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                                                    selectedSectionGroup === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                            >
                                                الكل ({sections.length})
                                            </button>
                                            {sectionGroups.map(([group, items]) => (
                                                <button
                                                    key={group}
                                                    type="button"
                                                    onClick={() => setSelectedSectionGroup(group)}
                                                    className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                                                        selectedSectionGroup === group ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {group} ({items.length})
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {sectionGroups.filter(([group]) => selectedSectionGroup === 'all' || selectedSectionGroup === group).map(([group, items]) => (
                                    <div key={group} className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">فئة فرعية</p>
                                                <h5 className="mt-1 text-sm font-black text-slate-900">{group}</h5>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">{items.length}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {items.map((s) => <SectionRow key={s.id} id={s.id} label={s.label} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Modules */}
                    {showModules && modules.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <ShieldQuestion className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-950">تبويبات لوحة التحكم</h4>
                                    <p className="text-[10px] font-bold text-slate-400">{modules.length} وحدة — تحكم في ظهورها داخل الإدارة</p>
                                </div>
                            </div>
                            <div className="space-y-5">
                                {moduleGroups.length > 1 && (
                                    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4">
                                        <div className="mb-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Sub Sub Tabs</p>
                                            <p className="mt-1 text-xs font-bold text-slate-600">المجموعات المرتبطة داخل تبويبات لوحة التحكم</p>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedModuleGroup('all')}
                                                className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                                                    selectedModuleGroup === 'all' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                }`}
                                            >
                                                الكل ({modules.length})
                                            </button>
                                            {moduleGroups.map(([group, items]) => (
                                                <button
                                                    key={group}
                                                    type="button"
                                                    onClick={() => setSelectedModuleGroup(group)}
                                                    className={`shrink-0 rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                                                        selectedModuleGroup === group ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {group} ({items.length})
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {moduleGroups.filter(([group]) => selectedModuleGroup === 'all' || selectedModuleGroup === group).map(([group, items]) => (
                                    <div key={group} className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
                                        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">فئة فرعية</p>
                                                <h5 className="mt-1 text-sm font-black text-slate-900">{group}</h5>
                                            </div>
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500">{items.length}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {items.map((m) => <ModuleRow key={m.id} id={m.id} label={m.label} />)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Login Methods */}
                    {showLogin && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-950">طرق تسجيل الدخول</h4>
                                    <p className="text-[10px] font-bold text-slate-400">تفعيل / تعطيل قنوات الدخول المتاحة</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { id: 'phone', label: 'رقم الجوال' },
                                    { id: 'email', label: 'البريد الإلكتروني' },
                                ].map((method) => {
                                    const methodKey = `${method.id}Enabled` as keyof typeof localSettings.loginConfig;
                                    return (
                                        <div key={method.id} className="rounded-2xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm hover:border-slate-900/10 transition-all">
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
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:border-slate-900/10 transition-all">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">شارة زر تسجيل دخول الهاتف</label>
                                    <input
                                        type="text"
                                        value={localSettings.loginConfig.phoneLabel || ""}
                                        onChange={(e) => updateSettings({ loginConfig: { ...localSettings.loginConfig, phoneLabel: e.target.value } })}
                                        className="mt-3 w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 transition-all"
                                        placeholder="مثال: تسجيل الدخول بالهاتف"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* UI Flags */}
                    {showUi && uiFlags.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-950">عناصر الواجهة العامة</h4>
                                    <p className="text-[10px] font-bold text-slate-400">إظهار أو إخفاء عناصر الصفحة الرئيسية</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {uiFlags.map((flag) => (
                                    <div key={flag.id} className="rounded-2xl border border-slate-100 bg-white p-5 flex items-center justify-between shadow-sm hover:border-slate-900/10 transition-all">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-950 truncate">{flag.label}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{flag.id}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => updateSettings({ uiFlags: { ...(localSettings.uiFlags || {}), [flag.id]: !localSettings.uiFlags[flag.id] } })}
                                            className={`w-12 h-6 rounded-full relative transition-all shrink-0 ${localSettings.uiFlags[flag.id] ? 'bg-slate-900' : 'bg-slate-200'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${localSettings.uiFlags[flag.id] ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}

                                {/* Quick Actions Icon Size inside UI section */}
                                <div className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4 shadow-sm hover:border-slate-900/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-950">حجم أيقونات الوصول السريع</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">quickActionsIconSize</p>
                                        </div>
                                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">{localSettings.quickActionsIconSize || '40'}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={12}
                                        max={64}
                                        step={2}
                                        value={parseInt(localSettings.quickActionsIconSize || '40', 10)}
                                        onChange={(e) => updateSettings({ quickActionsIconSize: e.target.value })}
                                        className="w-full accent-slate-900 h-2"
                                    />
                                    <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase">
                                        <span>12px صغير جداً</span>
                                        <span>64px كبير جداً</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Details Page Parts */}
                    {showDetails && detailsParts.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                    <Type className="w-4 h-4 text-slate-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-950">أقسام صفحة التفاصيل</h4>
                                    <p className="text-[10px] font-bold text-slate-400">تحكم في مكونات صفحة تفاصيل العقار</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {detailsParts.map((p) => <DetailsPartRow key={p.id} id={p.id} label={p.label} />)}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {sections.length === 0 && modules.length === 0 && uiFlags.length === 0 && detailsParts.length === 0 && (
                        <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-8">
                            <ShieldCheck className="w-12 h-12 text-slate-300 mb-4 stroke-[1.5]" />
                            <h4 className="text-base font-black text-slate-700">لا توجد نتائج</h4>
                            <p className="text-slate-400 text-xs mt-1">جرب تغيير كلمة البحث</p>
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
