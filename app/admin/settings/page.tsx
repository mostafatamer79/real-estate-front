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
    Plus, Trash2, Eye, BookOpen, Play, UserCheck, Info, Sliders,
    SaudiRiyalIcon
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { translations } from '@/context/translations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SaudiRiyalSymbol } from '@/components/ui/saudi-riyal';

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
    const [activeTab, setActiveTab] = useState<'pricing' | 'appearance' | 'text' | 'site_control'>('appearance');
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
        <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
                <div className="space-y-1">
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
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

            <nav className="grid w-full grid-cols-1 md:grid-cols-2 gap-3 rounded-[1.25rem] border border-/70 bg-[linear-gradient(135deg,#f8fafc_0%,#eef2f7_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] md:flex md:w-fit md:flex-wrap md:items-center">
                {[
                    { id: 'appearance', label: t('admin.settings.tab.appearance') },
                    { id: 'text', label: t('admin.settings.tab.text') },
                    { id: 'site_control', label: t('admin.settings.tab.control') },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group relative flex min-h-[44px] items-center justify-center gap-3 overflow-hidden rounded-[1.25rem] border px-5 py-4 text-sm font-black transition-all md:min-w-[180px] ${
                            activeTab === tab.id
                                ? 'border-white bg-card text-slate-950 shadow-[0_10px_30px_rgba(15,23,42,0.10)]'
                                : 'border-transparent bg-card/35 text-slate-400 hover:border-white/70 hover:bg-card/75 hover:text-slate-700'
                        }`}
                    >
                        <span className="text-sm font-black tracking-tight">{tab.label}</span>
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
                        className={`fixed top-6 ${isRtl ? 'left-4 md:left-6' : 'right-4 md:right-6'} z-[120] w-[calc(100vw-2rem)] max-w-md rounded-2xl border bg-card p-4 shadow-2xl ${messageType === 'success' ? 'border-emerald-100' : 'border-red-100'}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${messageType === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {messageType === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-950">{messageType === 'success' ? (isRtl ? "تم الحفظ" : "Saved") : (isRtl ? "تعذر الحفظ" : "Save failed")}</p>
                                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{message}</p>
                            </div>
                            <button type="button" onClick={() => setMessage("")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-muted hover:text-slate-700">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="rounded-[1rem] overflow-hidden border border shadow-xl bg-card min-h-[500px]">
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
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div onClick={() => setIsLogsModalOpen(true)} className="p-4 sm:p-8 rounded-[1rem] bg-card border border shadow-md hover:border-slate-900 transition-all group flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-muted text-slate-600 flex items-center justify-center"><History className="w-8 h-8" /></div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 mb-1">{t('admin.settings.logs')}</h4>
                                <p className="text-sm font-medium text-slate-400">{t('admin.settings.logsDesc')}</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <div onClick={() => setIsCommissionModalOpen(true)} className="p-4 sm:p-8 rounded-[1rem] bg-card border border shadow-md hover:border-slate-900 transition-all group flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-muted text-slate-900 flex items-center justify-center"><DollarSign className="w-8 h-8" /></div>
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
        <div className="p-4 sm:p-8 space-y-10">
            <div className="flex items-center gap-4 border-b border pb-6">
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
                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                        <div className="space-y-2">
                            <div className="relative">
                                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-muted border border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="0.00" />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"><SaudiRiyalSymbol iconClassName="h-3.5 w-3.5" /></span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600 px-1">عمولة الشراء (%)</label>
                            <div className="relative">
                                <input type="number" value={purchaseFee} onChange={(e) => setPurchaseFee(e.target.value)} className="w-full bg-muted border border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="2.5" />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">%</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600 px-1">الضريبة (%)</label>
                            <div className="relative">
                                <input type="number" value={taxPercentage} onChange={(e) => setTaxPercentage(e.target.value)} className="w-full bg-muted border border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-16" placeholder="15" />
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
                        <div key={group.category} className="border border rounded-3xl overflow-hidden mb-4">
                            <button
                                onClick={() => setCollapsedCategories(prev => ({ ...prev, [group.category]: !prev[group.category] }))}
                                className="w-full flex items-center justify-between p-3 sm:p-6 bg-muted hover:bg-muted transition-colors"
                            >
                                <span className="text-[11px] font-black uppercase tracking-widest">{group.label}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${collapsedCategories[group.category] ? '' : 'rotate-180'}`} />
                            </button>
                            {!collapsedCategories[group.category] && (
                                <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 bg-card">
                                    {group.services.map((service) => {
                                        const key = `service_price_${group.category}_${service}`.replace(/\s+/g, '_').toLowerCase();
                                        return (
                                            <div key={service} className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{service}</label>
                                                <div className="relative">
                                                    <input type="number" value={servicePrices[key] || ""} onChange={(e) => setServicePrices(prev => ({ ...prev, [key]: e.target.value }))} className="w-full bg-muted border border rounded-xl py-3 px-4 text-sm font-bold outline-none focus:border-slate-900 transition-all pr-12" placeholder="0.00" />
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><SaudiRiyalSymbol iconClassName="h-3 w-3" /></span>
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
        <div className="p-4 sm:p-8 space-y-10">
            <div className="flex items-center gap-4 border-b border pb-6">
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
                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                    {/* White Logo */}
                    <div className="p-3 sm:p-6 bg-slate-900 rounded-3xl border border-white/5 space-y-4">
                        <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">الشعار الأبيض (على الخلفيات الداكنة)</p>
                        <div className="flex items-center justify-center h-20">
                            {localSettings.logoWhiteUrl ? (
                                <img src={resolveAssetUrl(localSettings.logoWhiteUrl)} alt="white logo" className="max-h-full max-w-full object-contain" />
                            ) : (
                                <div className="text-white/20 text-[10px] font-black uppercase">لا يوجد شعار</div>
                            )}
                        </div>
                        <label className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-card/10 hover:bg-card/20 text-white text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all">
                            {uploadingWhite ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {uploadingWhite ? 'جارٍ الرفع...' : 'رفع الشعار الأبيض'}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0], 'white'); }} />
                        </label>
                        <input
                            type="text"
                            value={localSettings.logoWhiteUrl || ''}
                            onChange={(e) => updateSettings({ logoWhiteUrl: e.target.value })}
                            placeholder="أو أدخل رابط الشعار مباشرة..."
                            className="w-full bg-card/5 border border-white/10 rounded-xl py-2 px-4 text-[11px] font-mono text-white/60 outline-none focus:border-white/30"
                        />
                    </div>
                    {/* Black Logo */}
                    <div className="p-3 sm:p-6 bg-muted rounded-3xl border border space-y-4">
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
                            className="w-full bg-card border border rounded-xl py-2 px-4 text-[11px] font-mono text-slate-400 outline-none focus:border-slate-900"
                        />
                    </div>
                </div>

                <div className="p-3 sm:p-6 bg-card rounded-3xl border border space-y-4">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">غلاف تقارير مسح الخريطة PDF</p>
                    <div className="flex items-center justify-center h-36 rounded-2xl bg-muted overflow-hidden">
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
                        className="w-full bg-muted border border rounded-xl py-2 px-4 text-[11px] font-mono text-slate-400 outline-none focus:border-slate-900"
                    />
                    <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                        تستخدم هذه الصورة كخلفية للصفحة الأولى في تقارير مسح الخريطة، ويمكن تغييرها من الأدمن في أي وقت.
                    </p>
                </div>
                {/* Size Slider */}
                <div className="p-3 sm:p-6 bg-muted rounded-3xl border border space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">حجم الشعار في كل الصفحات</label>
                        <span className="text-xl sm:text-2xl font-black text-slate-900">{localSettings.logoHeight || 40}<span className="text-[11px] text-slate-400 ml-1">px</span></span>
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
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-900 flex items-center justify-center p-4" style={{ minHeight: `${Number(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoWhiteUrl && <img src={resolveAssetUrl(localSettings.logoWhiteUrl)} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                        <div className="rounded-2xl bg-card border border flex items-center justify-center p-4" style={{ minHeight: `${Number(localSettings.logoHeight || 40) + 32}px` }}>
                            {localSettings.logoBlackUrl && <img src={resolveAssetUrl(localSettings.logoBlackUrl)} alt="preview" style={{ height: `${localSettings.logoHeight || 40}px` }} className="object-contain w-auto" />}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Icon Size Slider */}
                <div className="p-3 sm:p-6 bg-muted rounded-3xl border border space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest">حجم أيقونات الوصول السريع (الرئيسية)</label>
                        <span className="text-xl sm:text-2xl font-black text-slate-900">{localSettings.quickActionsIconSize || '40'}<span className="text-[11px] text-slate-400 ml-1">px</span></span>
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

            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">الألوان الأساسية</h4>
                    <div className="grid grid-cols-1 gap-3 md:gap-6">
                        {[
                            { id: 'primary', label: 'اللون الأساسي', value: localSettings.primary },
                            { id: 'accent', label: 'لون التمييز', value: localSettings.accent },
                            { id: 'background', label: 'لون الخلفية', value: localSettings.background, fallback: '#f8fafc' },
                            { id: 'foreground', label: 'لون الخط العام', value: localSettings.foreground, fallback: '#0f172a' },
                            { id: 'sidebar', label: 'لون القائمة الجانبية', value: localSettings.sidebar, fallback: '#ffffff' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-3 md:gap-6 p-3 sm:p-6 bg-muted rounded-3xl border border group transition-all hover:bg-card hover:shadow-xl">
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
                    <div className="grid grid-cols-1 gap-3 md:gap-6">
                        {[
                            { id: 'cardBg', label: 'خلفية المربعات', value: (localSettings as any).cardBg || '#ffffff', fallback: '#ffffff' },
                            { id: 'cardText', label: 'لون نص المربعات', value: (localSettings as any).cardText || '#0f172a', fallback: '#0f172a' },
                            { id: 'cardBorder', label: 'لون حدود المربعات', value: (localSettings as any).cardBorder || '#e2e8f0', fallback: '#e2e8f0' },
                            { id: 'iconBg', label: 'خلفية الأيقونات', value: (localSettings as any).iconBg || '#f8fafc', fallback: '#f8fafc' },
                            { id: 'iconColor', label: 'لون الأيقونات', value: (localSettings as any).iconColor || '#0f172a', fallback: '#0f172a' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-3 md:gap-6 p-3 sm:p-6 bg-muted rounded-3xl border border group transition-all hover:bg-card hover:shadow-xl">
                                <div className="w-12 h-12 rounded-2xl shadow-inner flex-shrink-0" style={{ backgroundColor: color.value }} />
                                <div className="flex-grow">
                                    <label className="text-[11px] font-black text-slate-600 block mb-1">{color.label}</label>
                                    <input type="text" value={color.value} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-full bg-transparent border-none text-xs font-mono outline-none text-slate-400" />
                                </div>
                                <input type="color" value={colorPickerValue(color.value, color.fallback)} onChange={(e) => setThemeValue(color.id, e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent" />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-muted rounded-3xl border border space-y-3">
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
                        <div className="p-5 bg-muted rounded-3xl border border space-y-3">
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
                    <div className="grid grid-cols-1 gap-3 md:gap-6">
                        {[
                            { id: 'soonBadgeBg', label: 'خلفية الشارة', value: (localSettings as any).soonBadgeBg || '#ffffff' },
                            { id: 'soonBadgeText', label: 'لون النص', value: (localSettings as any).soonBadgeText || '#000000' },
                        ].map((color) => (
                            <div key={color.id} className="flex items-center gap-3 md:gap-6 p-3 sm:p-6 bg-muted rounded-3xl border border group transition-all hover:bg-card hover:shadow-xl">
                                <div
                                    className="h-8 px-3 rounded-xl border border shadow-inner flex items-center justify-center text-[10px] font-black uppercase tracking-widest flex-shrink-0"
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
                    <div className="space-y-4 pt-4 border-t border">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">اسم النظام (العلامة التجارية)</label>
                            <input type="text" value={localSettings.appName} onChange={(e) => updateSettings({ appName: e.target.value })} className="w-full bg-muted border border rounded-2xl py-4 px-6 text-sm font-bold outline-none focus:border-slate-900 shadow-inner" placeholder="اسم النظام..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">وصف النظام في شاشة البداية</label>
                            <input type="text" value={localSettings.description || ''} onChange={(e) => updateSettings({ description: e.target.value })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="وصف مختصر يظهر تحت الشعار..." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">حجم الخط في المنصة</label>
                                <div className="bg-muted border border rounded-2xl p-4">
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
                                    className="w-full bg-muted border border rounded-2xl py-4 px-4 text-xs font-bold outline-none focus:border-slate-900"
                                >
                                    <option value="system-ui">System UI</option>
                                    <option value="Arial">Arial</option>
                                    <option value="Tahoma">Tahoma</option>
                                    <option value="'Segoe UI'">Segoe UI</option>
                                    <option value="'Noto Sans Arabic'">Noto Sans Arabic</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">لاحقة العنوان (Badge)</label>
                                <input type="text" value={(localSettings.texts || {})['admin_badge'] || 'ADMIN'} onChange={(e) => updateSettings({ texts: { ...(localSettings.texts || {}), 'admin_badge': e.target.value } })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="ADMIN..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-600">مسمى مدير النظام</label>
                                <input type="text" value={(localSettings.texts || {})['admin_role_label'] || 'admin'} onChange={(e) => updateSettings({ texts: { ...(localSettings.texts || {}), 'admin_role_label': e.target.value } })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="مدير النظام..." />
                            </div>
                        </div>
                        <div className="space-y-2 mt-4">
                            <label className="text-[11px] font-black text-slate-600">البريد الإلكتروني للتواصل</label>
                            <input type="email" value={localSettings.contactEmail} onChange={(e) => updateSettings({ contactEmail: e.target.value })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="info@example.com" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">رقم الهاتف للتواصل</label>
                            <input type="text" value={localSettings.contactPhone} onChange={(e) => updateSettings({ contactPhone: e.target.value })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="+966..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-600">حساب X / تويتر</label>
                            <input type="text" value={localSettings.contactTwitter || ''} onChange={(e) => updateSettings({ contactTwitter: e.target.value })} className="w-full bg-muted border border rounded-2xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900" placeholder="@account أو رابط الحساب" dir="ltr" />
                        </div>
                        <div className="pt-4">
                            <label className="text-[11px] font-black text-slate-600 mb-2 block">النمط الليلي / النهاري</label>
                            <div className="flex p-1 bg-muted rounded-2xl w-fit">
                                <button onClick={() => updateSettings({ isDark: false })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${!localSettings.isDark ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-400'}`}><Sun className="w-4 h-4" /> نهاري</button>
                                <button onClick={() => updateSettings({ isDark: true })} className={`flex items-center gap-2 px-6 py-2 rounded-xl transition-all ${localSettings.isDark ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}><Moon className="w-4 h-4" /> ليلي</button>
                            </div>
                        </div>

                        <div className="pt-6">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">معاينة شكل المنصة</h4>
                            <div
                                className="p-3 sm:p-6 border space-y-5"
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
                                        backgroundColor: (localSettings as any).cardBg || '#f9fafb',
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

export const STRUCTURED_SECTIONS = [
    {
        id: 'entry_portal',
        title: '١- بوابة الدخول',
        icon: KeyRound,
        subcategories: [
            {
                id: 'welcome_screen',
                title: 'الواجهة الأولى',
                icon: Play,
                keys: ['project.name', 'header.welcome'],
                controls: [
                    { key: 'welcomeBg', label: 'درجة اللون', type: 'color', default: '#0f172a' },
                    { key: 'welcomeColor', label: 'لون النص', type: 'color', default: '#ffffff' },
                    { key: 'welcomeLogoSize', label: 'حجم اللوقو', type: 'range', min: 40, max: 220, default: '100px' },
                    { key: 'welcomeLogoDuration', label: 'مدة ظهور اللوقو واختفائه', type: 'range', min: 1, max: 10, default: '3s' }
                ]
            },
            {
                id: 'login_screen',
                title: 'تسجيل الدخول',
                icon: ShieldCheck,
                keys: ['header.login', 'auth.login_title', 'otp.title', 'chat.email', 'profile.mobile', 'profile.email'],
                controls: [
                    { key: 'loginBg', label: 'لون الخلفية', type: 'color', default: '#ffffff' },
                    { key: 'loginColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'loginFontSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '15px', '16px', '18px'], default: '15px' },
                    { key: 'loginEmailEnabled', label: 'إظهار البريد الإلكتروني', type: 'toggle', default: true },
                    { key: 'loginPhoneEnabled', label: 'إظهار رقم الجوال', type: 'toggle', default: false }
                ]
            },
            {
                id: 'customer_service',
                title: 'خدمة العملاء',
                icon: LifeBuoy,
                keys: ['header.customerService', 'footer.support', 'footer.contact_us', 'footer.contact', 'footer.newsletter'],
                controls: [
                    { key: 'csBg', label: 'لون الخلفية', type: 'color', default: '#f8fafc' },
                    { key: 'csTextColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'csFontSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'csFontFamily', label: 'نوع الخط', type: 'select', options: ['system-ui', 'Arial', 'Tahoma', "'Noto Sans Arabic'"], default: 'system-ui' },
                    { key: 'csEnabled', label: 'إظهار القسم', type: 'toggle', default: true }
                ]
            }
        ]
    },
    {
        id: 'top_bar',
        title: '٢- الشريط العلوي',
        icon: LayoutGrid,
        subcategories: [
            {
                id: 'notifications',
                title: 'الإشعارات',
                icon: Bell,
                keys: ['notification.empty', 'chat.refresh', 'chat.noResults'],
                controls: [
                    { key: 'headerNotificationColor', label: 'لون الأيقونة والنص', type: 'color', default: '#94a3b8' },
                    { key: 'headerNotificationSize', label: 'حجم الأيقونة', type: 'range', min: 14, max: 40, default: '24' },
                    { key: 'navBadgeBg', label: 'لون شارة العدد', type: 'color', default: '#ef4444' },
                    { key: 'navBadgeText', label: 'لون رقم الشارة', type: 'color', default: '#ffffff' }
                ]
            },
            {
                id: 'chat_center',
                title: 'المحادثات',
                icon: Mail,
                keys: ['chat.title', 'chat.search', 'chat.startNew', 'chat.typeMessage', 'internal.chat.centerTitle', 'internal.chat.centerSubtitle'],
                controls: [
                    { key: 'headerChatColor', label: 'لون الأيقونة والنص', type: 'color', default: '#94a3b8' },
                    { key: 'headerChatSize', label: 'حجم الأيقونة', type: 'range', min: 14, max: 40, default: '24' },
                    { key: 'chatTitleSize', label: 'حجم عناوين المحادثات', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'chatTextSize', label: 'حجم النصوص الداخلية', type: 'select', options: ['11px', '12px', '14px', '16px'], default: '12px' }
                ]
            },
            {
                id: 'user_page',
                title: 'صفحة المستخدم',
                icon: UserCheck,
                keys: ['profile.title', 'profile.accountInfo', 'profile.save', 'profile.email', 'profile.mobile', 'internal.profile.title'],
                controls: [
                    { key: 'headerProfileColor', label: 'لون الأيقونة والنص', type: 'color', default: '#cbd5e1' },
                    { key: 'headerProfileSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 32, default: '14' },
                    { key: 'profileTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' },
                    { key: 'profileTextSize', label: 'حجم النصوص', type: 'select', options: ['12px', '14px', '16px'], default: '14px' }
                ]
            }
        ]
    },
    {
        id: 'home_page',
        title: '٣- الصفحة الرئيسية',
        icon: Sparkles,
        subcategories: [
            {
                id: 'home_map',
                title: 'الخريطة التفاعلية',
                icon: Globe,
                keys: ['details.map.title', 'home.scan', 'home.scanDesc'],
                controls: [
                    { key: 'mapIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'mapIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'mapTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'mapTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_stats',
                title: 'إحصائيات العمليات',
                icon: FileText,
                keys: ['home.controlPanel', 'details.header.title', 'details.header.highlight'],
                controls: [
                    { key: 'statsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'statsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'statsTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'statsTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_ads',
                title: 'الإعلانات',
                icon: ImageIcon,
                keys: ['offers.title', 'offers.allOffers', 'offers.details', 'footer.offers'],
                controls: [
                    { key: 'adsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'adsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'adsTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'adsTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_analytics',
                title: 'التحليلات والاتجاهات',
                icon: Zap,
                keys: ['details.charts.title', 'scan.footer.update', 'scan.footer.found'],
                controls: [
                    { key: 'chartsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'chartsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'chartsTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'chartsTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_about',
                title: 'عن المنصة',
                icon: Info,
                keys: ['footer.brand_desc', 'footer.rights', 'project.name'],
                controls: [
                    { key: 'aboutIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'aboutIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'aboutTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'aboutTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_support',
                title: 'المساعدة والدعم',
                icon: LifeBuoy,
                keys: ['footer.support', 'footer.newsletter', 'footer.systems_ok'],
                controls: [
                    { key: 'supportIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'supportIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'supportTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'supportTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'home_contact',
                title: 'اتصل بنا',
                icon: Mail,
                keys: ['footer.contact', 'footer.contact_us', 'footer.address', 'footer.newsletter', 'footer.systems_ok'],
                controls: [
                    { key: 'contactIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'contactIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '16' },
                    { key: 'contactTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'contactTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            }
        ]
    },
    {
        id: 'real_estate_departments',
        title: '٤- الإدارات العقارية',
        icon: BookOpen,
        subcategories: [
            {
                id: 'dept_property',
                title: 'إدارة الأملاك',
                icon: LayoutGrid,
                keys: ['header.property_management', 'footer.management', 'pm.orders', 'pm.offers'],
                controls: [
                    { key: 'deptPropertyColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'deptPropertySize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'deptPropertyIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'deptPropertyIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'dept_marketing',
                title: 'إدارة التسويق',
                icon: Share2,
                keys: ['header.marketing_management', 'marketing.header.badge', 'marketing.header.desc', 'marketing.tab.requests'],
                controls: [
                    { key: 'deptMarketingColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'deptMarketingSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'deptMarketingIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'deptMarketingIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'dept_legal',
                title: 'الإدارة القانونية',
                icon: ShieldQuestion,
                keys: ['header.legal_management', 'footer.terms', 'footer.usage', 'footer.permits'],
                controls: [
                    { key: 'deptLegalColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'deptLegalSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'deptLegalIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'deptLegalIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'dept_finance',
                title: 'الإدارة المالية',
                icon: SaudiRiyalIcon,
                keys: ['header.financial_management', 'wallet.invoices.title', 'wallet.commission.title', 'wallet.balance.label'],
                controls: [
                    { key: 'deptFinanceColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'deptFinanceSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'deptFinanceIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'deptFinanceIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'dept_subscriptions',
                title: 'الاشتراكات والباقات',
                icon: BookOpen,
                keys: ['sub.public.quickAction', 'sub.tab.list', 'pm.subscriptions', 'internal.nav.subscriptions'],
                controls: [
                    { key: 'deptSubscriptionsColor', label: 'لون النصوص', type: 'color', default: '#0f172a' },
                    { key: 'deptSubscriptionsSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'deptSubscriptionsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'deptSubscriptionsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            }
        ]
    },
    {
        id: 'quick_access',
        title: '٥- الوصول السريع',
        icon: Smartphone,
        subcategories: [
            {
                id: 'quick_access_main',
                title: 'الوصول السريع',
                icon: Zap,
                keys: ['details.quickActions.title', 'footer.quick_links'],
                controls: [
                    { key: 'quickActionsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickActionsIconSize', label: 'حجم الأيقونة', type: 'range', min: 20, max: 72, default: '40' },
                    { key: 'quickActionsTitleColor', label: 'لون العنوان', type: 'color', default: '#cbd5e1' },
                    { key: 'quickActionsTitleSize', label: 'حجم العنوان', type: 'select', options: ['14px', '16px', '18px', '20px'], default: '16px' }
                ]
            },
            {
                id: 'quick_subscriptions',
                title: 'الاشتراكات',
                icon: BookOpen,
                keys: ['sub.public.quickAction', 'pm.subscriptions', 'internal.nav.subscriptions'],
                controls: [
                    { key: 'quickSubscriptionsColor', label: 'لون النص', type: 'color', default: '#0f172a' },
                    { key: 'quickSubscriptionsSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'quickSubscriptionsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickSubscriptionsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'quick_wallet',
                title: 'المحفظة',
                icon: DollarSign,
                keys: ['wallet.wallet', 'wallet.invoices', 'wallet.commission', 'wallet.files', 'wallet.invest'],
                controls: [
                    { key: 'quickWalletColor', label: 'لون النص', type: 'color', default: '#0f172a' },
                    { key: 'quickWalletSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'quickWalletIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickWalletIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'quick_services',
                title: 'الخدمات الإدارية',
                icon: Settings2,
                keys: ['services.title', 'services.platformServices', 'services.legal', 'services.marketing', 'services.construction', 'services.postPurchase'],
                controls: [
                    { key: 'quickServicesColor', label: 'لون النص', type: 'color', default: '#0f172a' },
                    { key: 'quickServicesSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'quickServicesIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickServicesIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'quick_offers',
                title: 'العروض',
                icon: ImageIcon,
                keys: ['action.offers', 'offers.title', 'offers.allOffers', 'offers.myOffers'],
                controls: [
                    { key: 'quickOffersColor', label: 'لون النص', type: 'color', default: '#0f172a' },
                    { key: 'quickOffersSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'quickOffersIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickOffersIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            },
            {
                id: 'quick_requests',
                title: 'الطلبات',
                icon: FileText,
                keys: ['action.requests', 'orders.title', 'orders.myOrders', 'header.myRequests', 'chat.myRequests'],
                controls: [
                    { key: 'quickRequestsColor', label: 'لون النص', type: 'color', default: '#0f172a' },
                    { key: 'quickRequestsSize', label: 'حجم الخط', type: 'select', options: ['12px', '14px', '16px', '18px'], default: '14px' },
                    { key: 'quickRequestsIconColor', label: 'لون الأيقونة', type: 'color', default: '#94a3b8' },
                    { key: 'quickRequestsIconSize', label: 'حجم الأيقونة', type: 'range', min: 12, max: 40, default: '18' }
                ]
            }
        ]
    }
];

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
    // STRUCTURED_SECTIONS is now imported from the file level.

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

    const getActiveSectionKeys = React.useCallback((sectionId: string, baseKeys: string[]) => {
        const keysSet = new Set(baseKeys);

        const prefixMap: Record<string, string[]> = {
            'welcome_screen': ['header.'],
            'login_screen': ['auth.', 'login.', 'otp.'],
            'customer_service': ['cs.'],
            'notifications': ['notification.'],
            'chat_center': ['chat.'],
            'user_page': ['profile.', 'admin.users.'],
            'home_map': ['map.'],
            'home_stats': ['chart.', 'status.', 'range.'],
            'home_ads': ['cards.'],
            'home_analytics': ['admin.dashboard.', 'admin.stats.', 'admin.scan.', 'admin.activity.'],
            'home_about': ['common.', 'admin.settings.'],
            'home_support': ['footer.'],
            'home_contact': [],
            'dept_property': ['pm.', 'details.', 'bm.'],
            'dept_marketing': ['marketing.', 'admin.marketing.'],
            'dept_legal': ['legal.', 'admin.legal.', 'admin.info_content.'],
            'dept_finance': ['wallet.commission.', 'wallet.invoices.', 'wallet.files', 'wallet.investments'],
            'dept_subscriptions': ['sub.', 'admin.packages.'],
            'quick_access_main': ['action.'],
            'quick_subscriptions': [],
            'quick_wallet': ['wallet.'],
            'quick_services': ['service.', 'admin.services_mgmt.', 'admin.service_requests.'],
            'quick_offers': ['offers.', 'offer.', 'admin.offers.'],
            'quick_requests': ['orders.', 'admin.orders.', 'admin.trans.']
        };

        const prefixes = prefixMap[sectionId] || [];

        if (prefixes.length > 0) {
            allKeys.forEach(k => {
                if (prefixes.some(p => k.startsWith(p))) {
                    keysSet.add(k);
                }
            });
        }

        return Array.from(keysSet);
    }, [allKeys]);

    const currentSectionKeys = React.useMemo(() => {
        if (!currentSubcategory) return [];
        return getActiveSectionKeys(currentSubcategory.id, currentSubcategory.keys || []);
    }, [currentSubcategory, getActiveSectionKeys]);

    return (
        <div className="p-4 sm:p-8 space-y-6">
            {/* Header section with Stats & Mode Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border-b border pb-6">
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
                    <div className="flex p-1 bg-muted rounded-2xl">
                        <button
                            onClick={() => setViewMode('structured')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                viewMode === 'structured'
                                    ? 'bg-card text-slate-900 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            التخصيص المنظم
                        </button>
                        <button
                            onClick={() => setViewMode('traditional')}
                            className={`px-4 py-2 text-xs font-black rounded-xl transition-all ${
                                viewMode === 'traditional'
                                    ? 'bg-card text-slate-900 shadow-sm'
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
                <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {/* Left Sidebar: Structured Categories & Subcategories */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[linear-gradient(180deg,#f9fafb_0%,#f8fafc_100%)] border border rounded-[1rem] p-4 space-y-4 shadow-sm">
                            <div className="rounded-[1.25rem] bg-slate-950 p-4 text-white">
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
                                            <div className="space-y-1 pl-2 border-r border mr-2">
                                                {sec.subcategories.map((sub) => {
                                                    const SubIcon = sub.icon;
                                                    const isActive = activeSection === sub.id;
                                                    return (
                                                        <button
                                                            key={sub.id}
                                                            onClick={() => setActiveSection(sub.id)}
                                                            className={`w-full flex items-center gap-2.5 text-right px-3 py-2.5 text-xs font-black rounded-xl transition-all ${
                                                                isActive
                                                                    ? 'bg-slate-900 text-white shadow-md shadow-stone-400/10'
                                                                    : 'text-slate-500 hover:bg-muted hover:text-slate-900'
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
                                <div className="bg-[linear-gradient(180deg,#f9fafb_0%,#f8fafc_100%)] border border rounded-[1rem] p-6 md:p-4 sm:p-8 space-y-6 shadow-sm">
                                    <div className="flex items-center justify-between border-b border pb-4">
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
                                    <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                                        {currentSubcategory.controls?.map((ctrl) => {
                                            const currentValue = localSettings[ctrl.key] !== undefined ? localSettings[ctrl.key] : ctrl.default;
                                            return (
                                                <div key={ctrl.key} className="space-y-2 bg-card/60 p-4 border border rounded-2xl">
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
                                                                className="w-10 h-10 border border rounded-xl cursor-pointer"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={currentValue}
                                                                onChange={(e) => updateSettings({ [ctrl.key]: e.target.value })}
                                                                className="flex-1 bg-muted border border rounded-xl py-2 px-3 text-xs font-bold font-mono text-left outline-none"
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
                                                            className="w-full bg-muted border border rounded-xl py-2.5 px-3 text-xs font-bold outline-none"
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
                                                                        : 'bg-muted'
                                                                }`}
                                                            >
                                                                <span className={`absolute top-1 left-1 w-4 h-4 bg-card rounded-full transition-all ${
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
                                    <div className="border border rounded-3xl p-3 sm:p-6 bg-card space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border pb-2">
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>معاينة حية للمكون المتأثر</span>
                                        </div>

                                        {activeSection === 'welcome_screen' && (
                                            <div
                                                className="flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl min-h-[160px] text-center transition-all"
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
                                                className="p-3 sm:p-6 rounded-2xl border transition-all text-right space-y-4"
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
                                                            className="w-full bg-muted border border rounded-xl py-2 px-3 text-xs outline-none cursor-not-allowed"
                                                        />
                                                    )}
                                                    {localSettings.loginConfig?.phoneEnabled && (
                                                        <div className="space-y-1">
                                                            <input
                                                                type="text"
                                                                placeholder="رقم الجوال..."
                                                                disabled
                                                                className="w-full bg-muted border border rounded-xl py-2 px-3 text-xs outline-none cursor-not-allowed"
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
                                                className="p-3 sm:p-6 rounded-2xl border transition-all space-y-3"
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
                                            <div className="p-3 sm:p-6 rounded-2xl border bg-muted text-slate-400 text-xs text-center font-bold">
                                                المكون نشط ومربوط بـ {currentSectionKeys.length} نصوص رئيسية.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Associated Texts Editing Section */}
                                <div className="bg-card border border rounded-[1rem] p-6 md:p-4 sm:p-8 space-y-6 shadow-sm">
                                    <div className="border-b border pb-4">
                                        <h4 className="text-base font-black text-slate-950">النصوص والمسميات المرتبطة</h4>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">تعديل نصوص الترجمة الخاصة بهذا القسم مباشرة</p>
                                    </div>

                                    <div className="space-y-6">
                                        {currentSectionKeys.map((key) => (
                                            <div key={key} className="p-3 sm:p-6 bg-muted/50 rounded-2xl border border space-y-4">
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

                                                <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">العربية</label>
                                                        <input
                                                            type="text"
                                                            value={textOverrides['ar_' + key] !== undefined ? textOverrides['ar_' + key] : (translations.ar[key as keyof typeof translations.ar] || "")}
                                                            onChange={(e) => setTextOverrides(prev => ({ ...prev, ['ar_' + key]: e.target.value }))}
                                                            className="w-full bg-card border border rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 transition-all"
                                                        />
                                                    </div>
                                                    <div dir="ltr" className="space-y-1.5 text-left">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">English</label>
                                                        <input
                                                            type="text"
                                                            value={textOverrides['en_' + key] !== undefined ? textOverrides['en_' + key] : (translations.en[key as keyof typeof translations.en] || "")}
                                                            onChange={(e) => setTextOverrides(prev => ({ ...prev, ['en_' + key]: e.target.value }))}
                                                            className="w-full bg-card border border rounded-xl py-2.5 px-4 text-xs font-bold outline-none focus:border-slate-900 transition-all text-left"
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
                <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                    {/* Categories and Subcategories Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-[linear-gradient(180deg,#f9fafb_0%,#f8fafc_100%)] border border rounded-[1.25rem] p-4 space-y-2 shadow-sm">
                            {/* Scopes selector */}
                            <div className="flex p-1 bg-muted rounded-2xl mb-4">
                                <button
                                    onClick={() => { setSelectedCategory('admin'); setSelectedSubcategory('all'); }}
                                    className={`flex-1 py-2 text-center text-[11px] font-black rounded-xl transition-all ${
                                        selectedCategory === 'admin' ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-400'
                                    }`}
                                >
                                    لوحة التحكم
                                </button>
                                <button
                                    onClick={() => { setSelectedCategory('public'); setSelectedSubcategory('all'); }}
                                    className={`flex-1 py-2 text-center text-[11px] font-black rounded-xl transition-all ${
                                        selectedCategory === 'public' ? 'bg-card text-slate-900 shadow-sm' : 'text-slate-400'
                                    }`}
                                >
                                    الموقع العام
                                </button>
                            </div>

                            <div className="rounded-[1rem] bg-slate-950 p-4 text-white mb-3">
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
                                                    : 'bg-card text-slate-500 border border hover:text-slate-950 hover:bg-muted'
                                            }`}
                                        >
                                            <span>{sub.label}</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                                isActive ? 'bg-card/20 text-white' : 'bg-muted text-slate-500'
                                            }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search Input inside Traditional mode */}
                        <div className="bg-muted border border rounded-[1.25rem] p-5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">بحث وتنقيب سريع</h4>
                            <div className="relative">
                                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-card border border rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                                    placeholder="اكتب كلمة للبحث..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Traditional Inputs Display */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-[linear-gradient(180deg,#f9fafb_0%,#f8fafc_100%)] border border rounded-[1rem] p-6 md:p-4 sm:p-8 space-y-6 shadow-sm">
                            <div className="flex flex-wrap items-center gap-2 border-b border pb-4">
                                <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-white">
                                    {selectedCategory === 'admin' ? 'الإدارة' : 'الموقع العام'}
                                </span>
                                <span className="rounded-full border border bg-card px-3 py-1 text-[11px] font-bold text-slate-500">
                                    {selectedSubcategory === 'all' ? 'كل الفئات الفرعية' : (subcategoryLabelMap[selectedSubcategory] || selectedSubcategory)}
                                </span>
                            </div>

                            {paginatedKeys.length === 0 ? (
                                <div className="min-h-[300px] flex flex-col items-center justify-center text-center p-4 sm:p-8">
                                    <Languages className="w-12 h-12 text-slate-300 mb-4 stroke-[1.5]" />
                                    <h4 className="text-base font-black text-slate-700">{t('admin.settings.noTexts') || 'لم يتم العثور على أي نصوص'}</h4>
                                    <p className="text-slate-400 text-xs mt-1">{t('admin.settings.noTextsDesc') || 'جرب تغيير كلمة البحث أو اختيار تصنيف فرعي آخر'}</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {paginatedKeys.map((key) => (
                                        <div key={key} className="p-6 md:p-4 sm:p-8 bg-card rounded-[1.25rem] border border transition-all hover:border-slate-900/20 group shadow-sm">
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black text-slate-600">
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
                                            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-5">
                                                <div className="space-y-1.5">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">العربية</label>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={textOverrides['ar_' + key] !== undefined ? textOverrides['ar_' + key] : (translations.ar[key as keyof typeof translations.ar] || "")}
                                                        onChange={(e) => setTextOverrides(prev => ({ ...prev, ['ar_' + key]: e.target.value }))}
                                                        className="w-full bg-card border border rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl focus:shadow-stone-400 transition-all"
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
                                                        className="w-full bg-card border border rounded-2xl py-3.5 px-5 text-sm font-bold outline-none focus:border-slate-900 focus:shadow-xl focus:shadow-stone-400 transition-all text-left"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border pt-6">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border text-slate-500 text-xs font-black hover:bg-muted hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
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
                                        className="flex items-center gap-1.5 h-10 px-4 rounded-xl border border text-slate-500 text-xs font-black hover:bg-muted hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
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
    const [selectedSection, setSelectedSection] = useState<string>('login_screen');
    const [query, setQuery] = useState('');

    const CONTROL_ITEMS = [
        // --- entry_portal ---
        { id: 'phone', label: 'تسجيل الدخول بالهاتف', type: 'loginMethod', subcategoryId: 'login_screen' },
        { id: 'email', label: 'تسجيل الدخول بالبريد', type: 'loginMethod', subcategoryId: 'login_screen' },
        { id: 'customer_service', label: 'خدمة العملاء (لوحة التحكم)', type: 'module', subcategoryId: 'customer_service' },
        { id: 'customerservice', label: 'خدمة العملاء (الواجهة)', type: 'section', subcategoryId: 'customer_service' },

        // --- top_bar ---
        { id: 'chat', label: 'المحادثات والرسائل', type: 'module', subcategoryId: 'chat_center' },
        { id: 'users', label: 'إدارة المستخدمين', type: 'module', subcategoryId: 'user_page' },
        { id: 'employees', label: 'إدارة الموظفين', type: 'module', subcategoryId: 'user_page' },

        // --- home_page ---
        { id: 'show_map_section', label: 'إظهار قسم الخريطة', type: 'uiFlag', subcategoryId: 'home_map' },
        { id: 'map_control', label: 'الخريطة (لوحة التحكم)', type: 'module', subcategoryId: 'home_map' },
        { id: 'scan_map', label: 'المسح والمخططات (الواجهة)', type: 'section', subcategoryId: 'home_map' },
        { id: 'map', label: 'الخريطة (التفاصيل)', type: 'detailsPart', subcategoryId: 'home_map' },

        { id: 'show_stats_cards', label: 'إظهار بطاقات الإحصائيات', type: 'uiFlag', subcategoryId: 'home_stats' },
        { id: 'internal_stats', label: 'الإحصاءات (داخل الإدارة)', type: 'module', subcategoryId: 'home_stats' },
        { id: 'operations', label: 'الإحصائيات والعمليات', type: 'module', subcategoryId: 'home_stats' },
        { id: 'stats', label: 'إحصاءات وملخصات (التفاصيل)', type: 'detailsPart', subcategoryId: 'home_stats' },

        { id: 'show_quickaction_offers', label: 'إظهار أيقونة العروض السريعة', type: 'uiFlag', subcategoryId: 'home_ads' },
        { id: 'offers', label: 'العروض العقارية (الواجهة)', type: 'section', subcategoryId: 'home_ads' },
        { id: 'offers', label: 'العروض (لوحة التحكم)', type: 'module', subcategoryId: 'home_ads' },

        { id: 'show_charts_section', label: 'إظهار الرسوم البيانية', type: 'uiFlag', subcategoryId: 'home_analytics' },
        { id: 'trends', label: 'التحليلات والاتجاهات', type: 'module', subcategoryId: 'home_analytics' },
        { id: 'charts', label: 'التحليلات والاتجاهات (التفاصيل)', type: 'detailsPart', subcategoryId: 'home_analytics' },

        { id: 'dashboard', label: 'لوحة التحكم', type: 'module', subcategoryId: 'home_about' },
        { id: 'internal', label: 'الإدارة الداخلية (الواجهة)', type: 'section', subcategoryId: 'home_about' },
        { id: 'settings', label: 'الإعدادات والتحكم', type: 'module', subcategoryId: 'home_about' },
        { id: 'details', label: 'صفحة التفاصيل (الرئيسية)', type: 'section', subcategoryId: 'home_about' },

        // --- real_estate_departments ---
        { id: 'show_quickaction_buildingmgmt', label: 'إظهار أيقونة إدارة الأملاك', type: 'uiFlag', subcategoryId: 'dept_property' },
        { id: 'buildingmanagement', label: 'إدارة الأملاك (الواجهة)', type: 'section', subcategoryId: 'dept_property' },
        { id: 'properties', label: 'إدارة الأملاك (لوحة التحكم)', type: 'module', subcategoryId: 'dept_property' },

        { id: 'marketing', label: 'التسويق (الواجهة)', type: 'section', subcategoryId: 'dept_marketing' },
        { id: 'marketing', label: 'إدارة التسويق (لوحة التحكم)', type: 'module', subcategoryId: 'dept_marketing' },
        { id: 'services_marketing', label: 'الخدمات: التسويق', type: 'module', subcategoryId: 'dept_marketing' },

        { id: 'disputes', label: 'المنازعات والقانونية (الواجهة)', type: 'section', subcategoryId: 'dept_legal' },
        { id: 'legal', label: 'الإدارة القانونية (لوحة التحكم)', type: 'module', subcategoryId: 'dept_legal' },
        { id: 'services_legal', label: 'الخدمات: القانونية', type: 'module', subcategoryId: 'dept_legal' },
        { id: 'legal_disputes', label: 'القانوني: المنازعات العقارية', type: 'module', subcategoryId: 'dept_legal' },
        { id: 'legal_contracts', label: 'القانوني: العقود', type: 'module', subcategoryId: 'dept_legal' },
        { id: 'legal_documentation', label: 'القانوني: التوثيق', type: 'module', subcategoryId: 'dept_legal' },
        { id: 'legal_other', label: 'القانوني: أخرى', type: 'module', subcategoryId: 'dept_legal' },

        { id: 'financial', label: 'التقارير المالية (الواجهة)', type: 'section', subcategoryId: 'dept_finance' },
        { id: 'finance', label: 'الإدارة المالية (لوحة التحكم)', type: 'module', subcategoryId: 'dept_finance' },

        { id: 'subscriptions', label: 'الباقات والاشتراكات (الواجهة)', type: 'section', subcategoryId: 'dept_subscriptions' },
        { id: 'subscriptions', label: 'الباقات والاشتراكات (لوحة التحكم)', type: 'module', subcategoryId: 'dept_subscriptions' },

        // --- quick_access ---
        { id: 'show_quick_actions', label: 'إظهار قسم الإجراءات السريعة', type: 'uiFlag', subcategoryId: 'quick_access_main' },
        { id: 'quick_actions', label: 'الوصول السريع (التفاصيل)', type: 'detailsPart', subcategoryId: 'quick_access_main' },

        { id: 'show_quickaction_subscriptions', label: 'إظهار أيقونة الاشتراكات والباقات', type: 'uiFlag', subcategoryId: 'quick_subscriptions' },
        { id: 'subscriptions', label: 'الاشتراكات (الواجهة)', type: 'section', subcategoryId: 'quick_subscriptions' },
        { id: 'subscriptions', label: 'الاشتراكات (لوحة التحكم)', type: 'module', subcategoryId: 'quick_subscriptions' },

        { id: 'show_quickaction_offers', label: 'إظهار أيقونة العروض السريعة', type: 'uiFlag', subcategoryId: 'quick_offers' },
        { id: 'offers', label: 'العروض العقارية (الواجهة)', type: 'section', subcategoryId: 'quick_offers' },
        { id: 'offers', label: 'العروض (لوحة التحكم)', type: 'module', subcategoryId: 'quick_offers' },

        { id: 'show_quickaction_wallet', label: 'إظهار أيقونة المحفظة', type: 'uiFlag', subcategoryId: 'quick_wallet' },
        { id: 'wallet', label: 'المحفظة المالية (الواجهة)', type: 'section', subcategoryId: 'quick_wallet' },
        { id: 'wallet', label: 'المحفظة (لوحة التحكم)', type: 'module', subcategoryId: 'quick_wallet' },
        { id: 'wallet_invoices', label: 'المحفظة: الفواتير', type: 'module', subcategoryId: 'quick_wallet' },
        { id: 'wallet_commissions', label: 'المحفظة: العمولات', type: 'module', subcategoryId: 'quick_wallet' },
        { id: 'wallet_files', label: 'المحفظة: الملفات', type: 'module', subcategoryId: 'quick_wallet' },
        { id: 'wallet_investments', label: 'المحفظة: الاستثمارات', type: 'module', subcategoryId: 'quick_wallet' },

        { id: 'show_quickaction_services', label: 'إظهار أيقونة الخدمات', type: 'uiFlag', subcategoryId: 'quick_services' },
        { id: 'services', label: 'الخدمات (الواجهة)', type: 'section', subcategoryId: 'quick_services' },
        { id: 'services_marketing', label: 'الخدمات: خدمات التسويق', type: 'module', subcategoryId: 'quick_services' },
        { id: 'services_legal', label: 'الخدمات: الخدمات القانونية', type: 'module', subcategoryId: 'quick_services' },
        { id: 'services_postPurchase', label: 'الخدمات: ما بعد الشراء', type: 'module', subcategoryId: 'quick_services' },
        { id: 'services_construction', label: 'الخدمات: البناء والمقاولات', type: 'module', subcategoryId: 'quick_services' },
        { id: 'services_other', label: 'الخدمات: أخرى', type: 'module', subcategoryId: 'quick_services' },

        { id: 'show_quickaction_orders', label: 'إظهار أيقونة الطلبات', type: 'uiFlag', subcategoryId: 'quick_requests' },
        { id: 'orders', label: 'إدارة الطلبات (الواجهة)', type: 'section', subcategoryId: 'quick_requests' },
        { id: 'orders', label: 'الطلبات (لوحة التحكم)', type: 'module', subcategoryId: 'quick_requests' },
    ];

    const currentSubcategory = STRUCTURED_SECTIONS.flatMap(s => s.subcategories).find(sub => sub.id === selectedSection);

    // Filter controls based on selection or search
    const filteredControls = CONTROL_ITEMS.filter(item => {
        if (query.trim()) {
            return item.label.toLowerCase().includes(query.trim().toLowerCase());
        }
        return item.subcategoryId === selectedSection;
    });

    const SectionRow = ({ id, label }: { id: string; label: string }) => {
        const v = (localSettings.sectionFlags || {})[id] || 'open';
        const setV = (next: 'open' | 'closed' | 'hidden') => updateSettings({ sectionFlags: { ...(localSettings.sectionFlags || {}), [id]: next } });
        return (
            <div className="rounded-[1rem] border border bg-card shadow-sm hover:border-slate-300 transition-all">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-400" /> {label}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setV('open')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${v === 'open' || (v !== 'closed' && v !== 'hidden') ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-stone-400/10' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>متاح</button>
                        <button
                            type="button"
                            onClick={() => setV('closed')}
                            className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${v === 'closed' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}
                        >
                            قريباً
                        </button>
                        <button type="button" onClick={() => setV('hidden')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${v === 'hidden' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>مخفي</button>
                    </div>
                </div>
                {v === 'closed' && (
                    <div className="px-5 pb-5 pt-0">
                        <div className="pt-4 border-t border">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.sectionMessages || {})[id] || ""}
                                onChange={(e) => updateSettings({ sectionMessages: { ...(localSettings.sectionMessages || {}), [id]: e.target.value } })}
                                className="mt-2 w-full bg-muted border border rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900 focus:bg-card shadow-inner transition-all"
                                placeholder=": قريباً، نعمل على تطوير هذا القسم..."
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
            <div className="rounded-[1rem] border border bg-card shadow-sm hover:border-slate-300 transition-all">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate flex items-center gap-2">
                            <ShieldQuestion className="w-4 h-4 text-slate-400" /> {label}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setStatus('enabled')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'enabled' ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-stone-400/10' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>متاح</button>
                        <button type="button" onClick={() => setStatus('soon')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'soon' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>قريباً</button>
                        <button type="button" onClick={() => setStatus('disabled')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'disabled' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>مخفي</button>
                    </div>
                </div>
                {status === 'soon' && (
                    <div className="px-5 pb-5 pt-0">
                        <div className="pt-4 border-t border">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.moduleMessages || {})[id] || ""}
                                onChange={(e) => updateSettings({ moduleMessages: { ...(localSettings.moduleMessages || {}), [id]: e.target.value } })}
                                className="mt-2 w-full bg-muted border border rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900 focus:bg-card shadow-inner transition-all"
                                placeholder=": قريباً، نعمل على تطوير هذه الخاصية..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const DetailsPartRow = ({ id, label }: { id: string; label: string }) => {
        const status: 'enabled' | 'soon' | 'hidden' = (localSettings.detailsPartFlags || {})[id] || 'enabled';
        const setStatus = (next: 'enabled' | 'soon' | 'hidden') => updateSettings({ detailsPartFlags: { ...(localSettings.detailsPartFlags || {}), [id]: next } });
        return (
            <div className="rounded-[1rem] border border bg-card shadow-sm hover:border-slate-300 transition-all">
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0 space-y-1">
                        <p className="text-sm font-bold text-slate-950 truncate flex items-center gap-2">
                            <Type className="w-4 h-4 text-slate-400" /> {label}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">details:{id}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => setStatus('enabled')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'enabled' ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-stone-400/10' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>متاح</button>
                        <button type="button" onClick={() => setStatus('soon')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'soon' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>قريباً</button>
                        <button type="button" onClick={() => setStatus('hidden')} className={`h-8 px-4 rounded-xl text-[11px] font-black border transition-all ${status === 'hidden' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-muted text-slate-500 border hover:bg-muted'}`}>مخفي</button>
                    </div>
                </div>
                {status === 'soon' && (
                    <div className="px-5 pb-5 pt-0">
                        <div className="pt-4 border-t border">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">رسالة "قريباً"</label>
                            <input
                                type="text"
                                value={(localSettings.detailsPartMessages || {})[id] || ''}
                                onChange={(e) => updateSettings({ detailsPartMessages: { ...(localSettings.detailsPartMessages || {}), [id]: e.target.value } })}
                                className="mt-2 w-full bg-muted border border rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-slate-900 focus:bg-card shadow-inner transition-all"
                                placeholder=": قريباً، نعمل على تطوير هذا القسم..."
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const UiFlagRow = ({ id, label }: { id: string; label: string }) => {
        return (
            <div className="rounded-[1rem] border border bg-card shadow-sm hover:border-slate-300 transition-all flex items-center justify-between px-5 py-4">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-950 truncate flex items-center gap-2">
                        <Zap className="w-4 h-4 text-slate-400" /> {label}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{id}</p>
                </div>
                <button
                    type="button"
                    onClick={() => updateSettings({ uiFlags: { ...(localSettings.uiFlags || {}), [id]: !localSettings.uiFlags[id] } })}
                    className={`w-14 h-7 rounded-full relative transition-all shrink-0 shadow-inner border border-transparent ${localSettings.uiFlags[id] ? 'bg-emerald-500 border-emerald-600' : 'bg-muted border-slate-300'}`}
                >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-card transition-all shadow-sm ${localSettings.uiFlags[id] ? 'left-8' : 'left-1'}`} />
                </button>
            </div>
        );
    };

    const LoginMethodRow = ({ id, label }: { id: string; label: string }) => {
        const methodKey = `${id}Enabled` as keyof typeof localSettings.loginConfig;
        return (
            <div className="rounded-[1rem] border border bg-card shadow-sm hover:border-slate-300 transition-all flex items-center justify-between px-5 py-4">
                <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-slate-950 truncate flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-slate-400" /> {label}
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{String(methodKey)}</p>
                </div>
                <button
                    type="button"
                    onClick={() => updateSettings({ loginConfig: { ...(localSettings.loginConfig || {}), [methodKey]: !localSettings.loginConfig[methodKey] } })}
                    className={`w-14 h-7 rounded-full relative transition-all shrink-0 shadow-inner border border-transparent ${localSettings.loginConfig[methodKey] ? 'bg-emerald-500 border-emerald-600' : 'bg-muted border-slate-300'}`}
                >
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-card transition-all shadow-sm ${localSettings.loginConfig[methodKey] ? 'left-8' : 'left-1'}`} />
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6 border-b border pb-6">
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
                        className="w-full bg-muted border border rounded-2xl py-3 pr-12 pl-6 text-sm font-bold outline-none focus:border-slate-900 focus:bg-card shadow-inner transition-all"
                        placeholder="ابحث (العروض، الطلبات...)"
                    />
                    {query && (
                        <button type="button" onClick={() => setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                {/* Sidebar Hierarchy (Same as TextTab) */}
                <div className="lg:col-span-1 space-y-4">
                    {!query && STRUCTURED_SECTIONS.filter(section => section.subcategories.some(sub => CONTROL_ITEMS.some(c => c.subcategoryId === sub.id))).map((section) => {
                        const SectionIcon = section.icon;
                        const isSectionActive = section.subcategories.some(sub => sub.id === selectedSection);

                        return (
                            <div key={section.id} className="space-y-1">
                                <div className={`flex items-center gap-2.5 px-2 py-2 ${isSectionActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                    <SectionIcon className="w-4 h-4" />
                                    <h4 className="text-xs font-black">{section.title}</h4>
                                </div>
                                <div className="space-y-1 pr-6 border-r-2 border mr-2">
                                    {section.subcategories.filter(sub => CONTROL_ITEMS.some(c => c.subcategoryId === sub.id)).map((sub) => {
                                        const SubIcon = sub.icon;
                                        const isActive = selectedSection === sub.id;
                                        return (
                                            <button
                                                key={sub.id}
                                                onClick={() => setSelectedSection(sub.id)}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-bold transition-all ${
                                                    isActive
                                                        ? 'bg-slate-900 text-white shadow-lg shadow-stone-400/10 scale-[1.02]'
                                                        : 'text-slate-500 hover:bg-muted hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <SubIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
                                                    {sub.title}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    {query && (
                        <div className="p-4 bg-muted rounded-2xl border border">
                            <p className="text-xs font-black text-slate-500">نتائج البحث عن: "{query}"</p>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <div className="rounded-[1rem] border border bg-[linear-gradient(180deg,#f9fafb_0%,#f8fafc_100%)] p-3 sm:p-6 shadow-xl space-y-8 min-h-[500px]">

                        {!query && currentSubcategory && (
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-stone-400/20">
                                    <currentSubcategory.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{currentSubcategory.title}</h2>
                                    <p className="text-xs font-bold text-slate-400 mt-1">تفعيل وتعطيل العناصر داخل هذا القسم</p>
                                </div>
                            </div>
                        )}

                        {filteredControls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900">{t('admin.settings.noItems') || 'لم يتم العثور على عناصر'}</h3>
                                <p className="text-sm font-bold text-slate-400 mt-2">{t('admin.settings.noItemsDesc') || 'لا توجد إعدادات تحكم تطابق هذا البحث أو القسم'}</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredControls.map((item, index) => {
                                    const keyStr = `${item.type}-${item.id}-${index}`;
                                    switch (item.type) {
                                        case 'section':
                                            return <SectionRow key={keyStr} id={item.id} label={item.label} />;
                                        case 'module':
                                            return <ModuleRow key={keyStr} id={item.id} label={item.label} />;
                                        case 'detailsPart':
                                            return <DetailsPartRow key={keyStr} id={item.id} label={item.label} />;
                                        case 'uiFlag':
                                            return <UiFlagRow key={keyStr} id={item.id} label={item.label} />;
                                        case 'loginMethod':
                                            return <LoginMethodRow key={keyStr} id={item.id} label={item.label} />;
                                        default:
                                            return null;
                                    }
                                })}
                            </div>
                        )}

                        {/* Quick Actions Global Settings shown only on "quick_access_main" */}
                        {currentSubcategory?.id === 'quick_access_main' && !query && (
                            <div className="mt-12 rounded-[1.25rem] border border bg-card p-3 sm:p-6 shadow-sm">
                                <h4 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Settings2 className="w-4 h-4 text-slate-400" /> إعدادات الإجراءات السريعة العامة
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-muted p-4 rounded-[1.25rem] border border">
                                        <label className="text-xs font-black text-slate-600">حجم الأيقونات (الرئيسية)</label>
                                        <span className="text-sm font-black text-slate-900 bg-card px-3 py-1.5 rounded-lg border border shadow-sm">{localSettings.quickActionsIconSize || '40'}<span className="text-[10px] text-slate-400 ml-1">px</span></span>
                                    </div>
                                    <input
                                        type="range"
                                        min={12}
                                        max={64}
                                        step={2}
                                        value={parseInt(localSettings.quickActionsIconSize || '40', 10)}
                                        onChange={(e) => updateSettings({ quickActionsIconSize: e.target.value })}
                                        className="w-full accent-slate-900 h-2 bg-muted rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                                    />
                                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase px-1">
                                        <span>12px صغير</span>
                                        <span>64px كبير</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Phone Label setting inside login_screen */}
                        {currentSubcategory?.id === 'login_screen' && !query && (
                            <div className="mt-8 rounded-2xl border border bg-card p-5 shadow-sm hover:border-slate-300 transition-all">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Type className="w-3.5 h-3.5" /> نص زر الهاتف الافتراضي
                                </label>
                                <input
                                    type="text"
                                    value={localSettings.loginConfig.phoneLabel || ""}
                                    onChange={(e) => updateSettings({ loginConfig: { ...localSettings.loginConfig, phoneLabel: e.target.value } })}
                                    className="mt-3 w-full bg-muted border border rounded-xl py-3 px-5 text-sm font-bold outline-none focus:border-slate-900 focus:bg-card transition-all shadow-inner"
                                    placeholder=": تسجيل الدخول بالهاتف"
                                />
                            </div>
                        )}
                    </div>
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-card rounded-[1rem] w-full w-[95vw] sm:max-w-2xl p-4 sm:p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">سجل التغييرات</h3>
                    <button onClick={() => onClose(false)} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {[{ user: 'Admin', action: 'تعديل الأسعار', date: 'منذ ساعتين' }].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-2xl">
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-card rounded-[1rem] w-full w-[95vw] sm:max-w-lg p-4 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black">إدارة العمولات</h3>
                    <button onClick={() => onClose(false)} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">عمولة شراء عقار (%)</label>
                        <input type="text" defaultValue="2.5" className="w-full bg-muted border border-transparent rounded-xl py-3 px-4 text-sm font-black outline-none" />
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
