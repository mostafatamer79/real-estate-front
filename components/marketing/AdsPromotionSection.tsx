"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Mail, 
    Users, 
    Calendar, 
    BarChart3, 
    Plus, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle, 
    Clock, 
    Target, 
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    RefreshCw,
    Send,
    Layout
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";
import { marketingApi, MarketingRequestStatus } from '@/lib/marketing-service';
import { toast } from 'react-hot-toast';

export default function AdsPromotionSection() {
    const { t, language } = useLanguage();
    
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [view, setView] = useState<'overview' | 'history' | 'analytics'>('overview');
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

    const searchParams = useSearchParams();

    const [emailWizardData, setEmailWizardData] = useState<any>({
        category: 'offers',
        content: '',
        subject: '',
        frequency: 'weekly',
        targetRole: 'all',
        linkedResourceType: 'none',
        linkedResourceId: ''
    });

    useEffect(() => {
        const type = searchParams.get('type');
        const id = searchParams.get('id');
        if (type && id) {
            setEmailWizardData((prev: any) => ({
                ...prev,
                linkedResourceType: type,
                linkedResourceId: id,
                category: type === 'property' ? 'offers' : prev.category
            }));
            setWizardOpen(true);
        }
    }, [searchParams]);

    const [resources, setResources] = useState<{
        orders: any[],
        appointments: any[],
        offers: any[],
        properties: any[]
    }>({ orders: [], appointments: [], offers: [], properties: [] });

    useEffect(() => {
        const loadResources = async () => {
            try {
                // Fetch potential entities to promote using the unified service
                const [orders, appts, offers, props, campaignsData] = await Promise.all([
                    marketingApi.getOrders(),
                    marketingApi.getBookings(),
                    marketingApi.getOffers(),
                    marketingApi.getProperties(),
                    marketingApi.getEmailMarketing()
                ]);
                
                setResources({ 
                    orders: Array.isArray(orders) ? orders : [], 
                    appointments: Array.isArray(appts) ? appts : [], 
                    offers: Array.isArray(offers) ? offers : [],
                    properties: Array.isArray(props) ? props : []
                });
                setCampaigns(campaignsData);
            } catch (err) {
                console.error("Resource error:", err);
            }
        };
        loadResources();
    }, [refreshTrigger]);

    const handleCreateCampaign = async () => {
        setLoading(true);
        try {
            await marketingApi.createEmailMarketing({
                ...emailWizardData,
                // 'all' is the UI sentinel for "no role filter"; send null to the backend
                targetRole: emailWizardData.targetRole === 'all' ? null : emailWizardData.targetRole,
                isActive: true
            });
            toast.success(t('orders.success'));
            setWizardOpen(false);
            setWizardStep(1);
            setEmailWizardData({
                category: 'offers',
                content: '',
                subject: '',
                frequency: 'weekly',
                targetRole: 'all',
                linkedResourceType: 'none',
                linkedResourceId: ''
            });
            setRefreshTrigger(prev => prev + 1);
            setView('history');
        } catch (error) {
            toast.error(t('orders.error'));
        } finally {
            setLoading(false);
        }
    };

    const stats = [
        { label: t('marketing.stats.sent'), value: '45,200', trend: '+12%', color: 'text-blue-600' },
        { label: t('marketing.stats.openRate'), value: '24.5%', trend: '+3.2%', color: 'text-emerald-600' },
        { label: t('marketing.stats.clickRate'), value: '8.4%', trend: '-0.5%', color: 'text-purple-600' },
    ];

    return (
        <div className="space-y-12 pb-20">
            {/* Overview Grid */}
            {view === 'overview' && (
                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { 
                                id: 'campaign', 
                                icon: Send, 
                                color: 'bg-gradient-to-br from-blue-600 to-indigo-600', 
                                title: t('marketing.ads.social'), 
                                desc: t('marketing.ads.socialDesc'), 
                                badge: t('marketing.ads.manage'),
                                action: () => setWizardOpen(true) 
                            },

                            { 
                                id: 'schedule', 
                                icon: Clock, 
                                color: 'bg-gradient-to-br from-orange-400 to-pink-500', 
                                title: t('marketing.ads.campaigns'), 
                                desc: t('marketing.ads.campaignsDesc'), 
                                badge: t('marketing.ads.manage'),
                                action: () => setView('history')
                            },
                            { 
                                id: 'analytics', 
                                icon: BarChart3, 
                                color: 'bg-gradient-to-br from-slate-700 to-slate-900', 
                                title: t('marketing.ads.performance'), 
                                desc: t('marketing.stats.trend'), 
                                badge: t('marketing.ads.manage'),
                                action: () => setView('history')
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5, scale: 1.01 }}
                                onClick={item.action}
                                className="group bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col hover:border-blue-200 transition-all cursor-pointer shadow-xl shadow-slate-200/40 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg`}>
                                        <item.icon className="w-7 h-7" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.badge}
                                    </span>
                                </div>
                                <h3 className="font-black text-lg mb-3 text-slate-900 tracking-tight leading-tight">{item.title}</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed flex-1">{item.desc}</p>
                                
                                <div className="mt-8 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
                                    <span>{t('marketing.ads.manage')}</span>
                                    <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Stats Banner */}
                    <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-wrap gap-12 items-center justify-between text-white shadow-2xl shadow-blue-900/20">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                                <Mail className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black">{t('marketing.campaign.overview')}</h4>
                                <p className="text-white/40 text-xs font-bold mt-1">{t('marketing.history.desc')}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-10">
                            {stats.map((stat, i) => (
                                <div key={i} className="space-y-1">
                                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-2xl font-black">{stat.value}</span>
                                        <span className={`text-[10px] font-bold ${stat.color}`}>{stat.trend}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Campaign History View */}
            {view === 'history' && (
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setView('overview')} className="h-12 px-6 rounded-2xl font-black text-xs gap-3 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                            {t('marketing.btn.prev')}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setRefreshTrigger(prev => prev + 1)}
                            className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] border-slate-200 hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all gap-3"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('marketing.btn.refresh')}
                        </Button>
                    </div>

                    <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-2xl shadow-slate-200/60">
                        <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                            <h4 className="text-2xl font-black text-slate-900">{t('marketing.history.title')}</h4>
                            <p className="text-slate-400 text-xs font-bold mt-1">{t('marketing.ads.performance')}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('marketing.table.title')}</TableHead>
                                        <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('marketing.photo.type')}</TableHead>
                                        <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('orders.rooms')}</TableHead>
                                        <TableHead className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('marketing.table.status')}</TableHead>
                                        <TableHead className="px-10 py-6 text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className='text-center py-32'>
                                                <div className="flex flex-col items-center gap-6 opacity-20">
                                                    <div className="p-8 bg-slate-100 rounded-full">
                                                        <Mail className="w-12 h-12 text-slate-400" />
                                                    </div>
                                                    <p className="font-black text-sm uppercase tracking-[0.3em] text-slate-500">{t('marketing.noRequests')}</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : campaigns.map((camp, i) => (
                                        <TableRow key={camp.id} className="hover:bg-blue-50/20 transition-all group border-slate-50 text-center">
                                            <TableCell className="px-10 py-8">
                                                <div className="text-right">
                                                    <p className="font-black text-slate-900 text-sm mb-0.5">{camp.subject || 'Weekly Newsletter'}</p>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
                                                        {new Date(camp.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="px-10 py-8">
                                                <span className="text-slate-900 font-black text-xs uppercase tracking-widest">{
                                                    ({
                                                        offers: language === 'ar' ? 'عروض' : 'Offers',
                                                        orders: language === 'ar' ? 'طلبات' : 'Orders',
                                                        property_management: language === 'ar' ? 'إدارة أملاك' : 'Property Mgmt',
                                                    } as Record<string, string>)[camp.category] || camp.category
                                                }</span>
                                            </TableCell>
                                            <TableCell className="px-10 py-8">
                                                <span className="font-black text-slate-900 text-sm">{
                                                    ({
                                                        daily: language === 'ar' ? 'يومي' : 'Daily',
                                                        every_2_days: language === 'ar' ? 'كل يومين' : 'Every 2 Days',
                                                        weekly: language === 'ar' ? 'أسبوعي' : 'Weekly',
                                                        biweekly: language === 'ar' ? 'كل أسبوعين' : 'Bi-weekly',
                                                    } as Record<string, string>)[camp.frequency] || camp.frequency
                                                }</span>
                                            </TableCell>
                                            <TableCell className="px-10 py-8">
                                                <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border
                                                    ${camp.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                    {camp.isActive ? t('marketing.status.active') : t('marketing.status.cancelled')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="px-10 py-8 text-right">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedCampaign(camp);
                                                        setView('analytics');
                                                    }}
                                                    className="w-10 h-10 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Email Wizard Modal */}
            <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
                <DialogContent className="max-w-2xl bg-white rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl">
                    <div className="bg-slate-900 p-10 text-white">
                        <div className="flex justify-between items-center mb-8">
                            <span className="px-4 py-2 bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                {t('marketing.wizard.step' + wizardStep)}
                            </span>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4].map(s => (
                                    <div key={s} className={`h-1.5 w-8 rounded-full transition-all ${s <= wizardStep ? 'bg-blue-400' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tight text-white">
                            {t('marketing.ads.create')}
                        </DialogTitle>
                        <DialogDescription className="text-white/40 text-xs font-bold mt-2">
                            {t('marketing.campaign.plan')}
                        </DialogDescription>
                    </div>

                    <div className="p-10 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {wizardStep === 1 && (
                                <motion.div 
                                    key="step1" 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.category')}</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { id: 'offers', labelAr: 'العروض', labelEn: 'Offers' },
                                                { id: 'orders', labelAr: 'الطلبات', labelEn: 'Orders' },
                                                { id: 'property_management', labelAr: 'إدارة الأملاك', labelEn: 'Property Management' },
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setEmailWizardData({...emailWizardData, category: cat.id})}
                                                    className={`p-6 rounded-3xl border-2 transition-all text-right flex flex-col gap-2 ${
                                                        emailWizardData.category === cat.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <span className="font-black text-slate-900">{language === 'ar' ? cat.labelAr : cat.labelEn}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-4 border-t border-slate-50">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.linkResource')}</label>
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                                            {[
                                                { id: 'none', label: t('marketing.wizard.noLink') },
                                                { id: 'order', label: t('marketing.wizard.linkOrder') },
                                                { id: 'appointment', label: t('marketing.wizard.linkAppointment') },
                                                { id: 'offer', label: t('marketing.wizard.linkOffer') },
                                                { id: 'property', label: t('property.title') }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setEmailWizardData({...emailWizardData, linkedResourceType: type.id, linkedResourceId: ''})}
                                                    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                        emailWizardData.linkedResourceType === type.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
                                                    }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>

                                        {emailWizardData.linkedResourceType !== 'none' && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="text-[10px] font-black text-slate-400">{t('marketing.wizard.selectResource')}</label>
                                                <Select 
                                                    value={emailWizardData.linkedResourceId} 
                                                    onValueChange={(val) => setEmailWizardData({...emailWizardData, linkedResourceId: val})}
                                                >
                                                    <SelectTrigger className="h-12 rounded-xl border-slate-100 font-bold bg-slate-50 text-right">
                                                        <SelectValue placeholder={t('marketing.wizard.selectResource')} />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-slate-100 max-h-[200px]">
                                                        {emailWizardData.linkedResourceType === 'order' && resources.orders.map(o => (
                                                            <SelectItem key={o.id} value={o.id}>{o.description || `Order #${o.id.slice(0,8)}`}</SelectItem>
                                                        ))}
                                                        {emailWizardData.linkedResourceType === 'appointment' && resources.appointments.map(a => (
                                                            <SelectItem key={a.id} value={a.id}>{a.title || `Appointment #${a.id.slice(0,8)}`}</SelectItem>
                                                        ))}
                                                        {emailWizardData.linkedResourceType === 'offer' && resources.offers.map(off => (
                                                            <SelectItem key={off.id} value={off.id}>{off.title || `Offer #${off.id.slice(0,8)}`}</SelectItem>
                                                        ))}
                                                        {emailWizardData.linkedResourceType === 'property' && resources.properties.map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name || `Property #${p.id.slice(0,8)}`}</SelectItem>
                                                        ))}
                                                        {(emailWizardData.linkedResourceType === 'order' ? resources.orders : emailWizardData.linkedResourceType === 'appointment' ? resources.appointments : emailWizardData.linkedResourceType === 'offer' ? resources.offers : resources.properties).length === 0 && (
                                                            <div className="p-4 text-center text-xs text-slate-400">{t('marketing.noRequests')}</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-slate-50">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.audience')}</label>
                                        <Select 
                                            value={emailWizardData.targetRole} 
                                            onValueChange={(val) => setEmailWizardData({...emailWizardData, targetRole: val})}
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50 text-right">
                                                <SelectValue placeholder={language === 'ar' ? 'جميع المستخدمين' : 'All Users'} />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-slate-100">
                                                <SelectItem value="all">{language === 'ar' ? 'جميع المستخدمين' : 'All Users'}</SelectItem>
                                                <SelectItem value="user">{language === 'ar' ? 'مستفيد (مستأجر/مشتري)' : 'Beneficiary (User)'}</SelectItem>
                                                <SelectItem value="broker">{language === 'ar' ? 'وسيط عقاري' : 'Broker'}</SelectItem>
                                                <SelectItem value="owner">{language === 'ar' ? 'مالك عقار' : 'Property Owner'}</SelectItem>
                                                <SelectItem value="lawyer">{language === 'ar' ? 'محامي' : 'Lawyer'}</SelectItem>
                                                <SelectItem value="agent">{language === 'ar' ? 'وكيل' : 'Agent'}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </motion.div>
                            )}

                            {wizardStep === 2 && (
                                <motion.div 
                                    key="step2" 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.subject')}</label>
                                        <Input 
                                            placeholder={t('marketing.wizard.placeholder.subject')}
                                            className="h-14 rounded-2xl border-slate-100 font-bold bg-slate-50 text-right"
                                            value={emailWizardData.subject}
                                            onChange={(e) => setEmailWizardData({...emailWizardData, subject: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.body')}</label>
                                        <Textarea 
                                            placeholder={t('marketing.wizard.placeholder.body')}
                                            className="min-h-[150px] rounded-[2rem] border-slate-100 font-bold bg-slate-50 p-6 text-right"
                                            value={emailWizardData.content}
                                            onChange={(e) => setEmailWizardData({...emailWizardData, content: e.target.value})}
                                        />
                                    </div>
                                </motion.div>
                            )}

                            {wizardStep === 3 && (
                                <motion.div 
                                    key="step3" 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t('marketing.wizard.frequency')}</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: 'daily', labelAr: 'يومي', labelEn: 'Daily', icon: '📅' },
                                                { id: 'every_2_days', labelAr: 'كل يومين', labelEn: 'Every 2 Days', icon: '📆' },
                                                { id: 'weekly', labelAr: 'أسبوعي', labelEn: 'Weekly', icon: '🗓️' },
                                                { id: 'biweekly', labelAr: 'كل أسبوعين', labelEn: 'Bi-weekly', icon: '📊' }
                                            ].map((freq) => (
                                                <button
                                                    key={freq.id}
                                                    type="button"
                                                    onClick={() => setEmailWizardData({...emailWizardData, frequency: freq.id})}
                                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${
                                                        emailWizardData.frequency === freq.id ? 'border-blue-600 bg-blue-50/50 text-blue-600' : 'border-slate-100 hover:border-slate-200'
                                                    }`}
                                                >
                                                    <span className="text-2xl">{freq.icon}</span>
                                                    <span className="font-black text-sm">{language === 'ar' ? freq.labelAr : freq.labelEn}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {wizardStep === 4 && (
                                <motion.div 
                                    key="step4" 
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    className="space-y-8"
                                >
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] space-y-6 border border-slate-100 shadow-sm">
                                        <h4 className="font-black text-xl text-slate-900 border-b border-slate-200 pb-4">{t('marketing.wizard.review.summary')}</h4>
                                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('marketing.wizard.category')}</p>
                                                <p className="font-black text-slate-800 uppercase">{emailWizardData.category}</p>
                                            </div>
                                            <div className="space-y-1 text-left">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('marketing.wizard.audience')}</p>
                                                <p className="font-black text-slate-800">{
                                                    ({
                                                        all: language === 'ar' ? 'جميع المستخدمين' : 'All Users',
                                                        user: language === 'ar' ? 'مستفيد' : 'Beneficiary',
                                                        broker: language === 'ar' ? 'وسيط عقاري' : 'Broker',
                                                        owner: language === 'ar' ? 'مالك' : 'Owner',
                                                        lawyer: language === 'ar' ? 'محامي' : 'Lawyer',
                                                        agent: language === 'ar' ? 'وكيل' : 'Agent',
                                                    } as Record<string, string>)[emailWizardData.targetRole] || emailWizardData.targetRole
                                                }</p>
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('marketing.wizard.linkResource')}</p>
                                                <p className="font-black text-blue-600">
                                                    {emailWizardData.linkedResourceType !== 'none' ? `${emailWizardData.linkedResourceType}: ${emailWizardData.linkedResourceId}` : t('marketing.wizard.noLink')}
                                                </p>
                                            </div>
                                            <div className="space-y-1 col-span-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('marketing.wizard.subject')}</p>
                                                <p className="font-black text-slate-800">{emailWizardData.subject}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('marketing.wizard.frequency')}</p>
                                                <p className="font-black text-slate-800">{
                                                    ({
                                                        daily: language === 'ar' ? 'يومي' : 'Daily',
                                                        every_2_days: language === 'ar' ? 'كل يومين' : 'Every 2 Days',
                                                        weekly: language === 'ar' ? 'أسبوعي' : 'Weekly',
                                                        biweekly: language === 'ar' ? 'كل أسبوعين' : 'Bi-weekly',
                                                    } as Record<string, string>)[emailWizardData.frequency] || emailWizardData.frequency
                                                }</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 flex gap-4">
                            {wizardStep > 1 && (
                                <Button 
                                    variant="ghost" 
                                    className="h-16 flex-1 rounded-2xl font-black text-xs uppercase tracking-widest"
                                    onClick={() => setWizardStep(prev => prev - 1)}
                                >
                                    {t('marketing.btn.prev')}
                                </Button>
                            )}
                            <Button 
                                className={`h-16 ${wizardStep === 1 ? 'w-full' : 'flex-[2]'} rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200`}
                                onClick={() => wizardStep < 4 ? setWizardStep(prev => prev + 1) : handleCreateCampaign()}
                                disabled={loading}
                            >
                                <Send className="w-4 h-4 mr-2" />
                                {wizardStep < 4 ? t('marketing.btn.next') : t('marketing.btn.finish')}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Simulated Analytics Placeholder */}
            {view === 'analytics' && selectedCampaign && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                     <div className="flex justify-between items-center">
                        <Button variant="ghost" onClick={() => setView('history')} className="h-12 px-6 rounded-2xl font-black text-xs gap-3 hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                            {t('marketing.btn.prev')}
                        </Button>
                        <div className="text-right">
                            <h4 className="text-xl font-black text-slate-900">{selectedCampaign.subject}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedCampaign.category}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { label: t('marketing.stats.sent'), value: '2,840', trend: '+100%', color: 'text-blue-600' },
                            { label: t('marketing.stats.openRate'), value: '38.4%', trend: '+5.2%', color: 'text-emerald-600' },
                            { label: t('marketing.stats.clickRate'), value: '12.1%', trend: '+2.1%', color: 'text-purple-600' },
                            { label: t('marketing.stats.delivery'), value: '99.8%', trend: 'Optimum', color: 'text-blue-400' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">{stat.label}</p>
                                <div className="flex items-baseline gap-4">
                                    <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                                    <span className="text-[10px] font-bold text-emerald-500">{stat.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-3xl">
                        <div className="flex justify-between items-center mb-8">
                            <h4 className="text-xl font-black text-slate-900">{t('marketing.stats.trend')}</h4>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.stats.sent')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('marketing.stats.openRate')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-72 w-full bg-slate-50/50 rounded-3xl flex items-end justify-between p-10 gap-6">
                            {[60, 85, 45, 95, 75, 80, 70].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end gap-1 group h-full">
                                    <div className="flex items-end gap-1 h-full">
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            className="w-full bg-blue-500 rounded-t-xl opacity-80 group-hover:opacity-100 transition-all cursor-pointer relative"
                                        />
                                        <motion.div 
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h * 0.4}%` }}
                                            className="w-full bg-emerald-500 rounded-t-xl opacity-60 group-hover:opacity-100 transition-all cursor-pointer relative"
                                        />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 text-center mt-2">D{i+1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
