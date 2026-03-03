"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, Megaphone, ClipboardList, 
  Sparkles, Info, LayoutDashboard
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';

// Import Modular Components
import PhotographyFlow from '@/components/marketing/PhotographyFlow';
import AdsPromotionSection from '@/components/marketing/AdsPromotionSection';
import WorkflowSection from '@/components/marketing/WorkflowSection';

export default function MarketingPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("advertising");
    const { t, language } = useLanguage();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (!['admin', 'marketing', 'marketing_admin', 'viewer'].includes(user.role)) {
                router.push('/');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <Toaster position="top-center" />
            
            {/* Optimized Premium Header - GLASSMORPHISM */}
            <section className="relative overflow-hidden mb-12 pb-12 border-b border-white/20 bg-white/50 backdrop-blur-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-slate-50/50 to-purple-50/50 opacity-50 pointer-events-none" />
                <div className="max-w-7xl mx-auto px-6 pt-12 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="space-y-4">
                            <motion.div 
                               initial={{ opacity: 0, scale: 0.9 }}
                               animate={{ opacity: 1, scale: 1 }}
                               className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-900/10"
                            >
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                                <span>{t('marketing.header.badge')}</span>
                            </motion.div>
                            <div className="space-y-2">
                                <motion.h1 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900"
                                >
                                    {t('marketing.title')}
                                </motion.h1>
                                <motion.p 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: 0.2 }}
                                  className="text-slate-500 font-bold max-w-xl text-sm leading-relaxed"
                                >
                                  {t('marketing.header.desc')}
                                </motion.p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toast.success(t('marketing.header.badge'), {
                                    icon: '✨',
                                    duration: 4000,
                                })}
                                className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl shadow-slate-100 text-slate-900 hover:text-blue-600 transition-colors border border-white/50"
                            >
                                <Info className="w-6 h-6" />
                            </motion.button>
                        </div>
                    </div>
                </div>
            </section>


            <div className="max-w-7xl mx-auto px-6">
                <Tabs defaultValue="advertising" className="w-full space-y-10" onValueChange={setActiveTab} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="flex flex-col items-center gap-6">
                        <TabsList className="inline-flex h-20 items-center justify-center rounded-[2rem] bg-white border border-slate-100 p-2 w-full max-w-3xl shadow-xl shadow-slate-100/50">
                            <TabsTrigger value="advertising" className="flex-1 rounded-[1.5rem] h-16 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs transition-all duration-300">
                                <span>{t('marketing.tab.ads')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="photography" className="flex-1 rounded-[1.5rem] h-16 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs transition-all duration-300">
                                <span>{t('marketing.tab.photography')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="flex-1 rounded-[1.5rem] h-16 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs transition-all duration-300">
                                <span>{t('marketing.tab.requests')}</span>
                            </TabsTrigger>
                            <TabsTrigger value="general_requests" className="flex-1 rounded-[1.5rem] h-16 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg font-black text-xs transition-all duration-300">
                                <span>{t('marketing.tab.general_requests')}</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <TabsContent value="photography" className="outline-none m-0">
                                <PhotographyFlow />
                            </TabsContent>
                            <TabsContent value="advertising" className="outline-none m-0">
                                <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" /></div>}>
                                    <AdsPromotionSection />
                                </Suspense>
                            </TabsContent>
                            <TabsContent value="requests" className="outline-none m-0">
                                <WorkflowSection />
                            </TabsContent>
                            <TabsContent value="general_requests" className="outline-none m-0">
                                <ServiceRequestsTable 
                                    title={t('marketing.tab.general_requests')}
                                    subtitle={t('marketing.history.desc')}
                                    department="marketing"
                                />

                            </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>
            
        </div>
    );
}
