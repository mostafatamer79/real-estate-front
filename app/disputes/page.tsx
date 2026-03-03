"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { legalServicesApi, LegalDispute } from "@/lib/legal-services";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, User, FileText, Gavel, 
  ArrowRight, ChevronDown, Search, Filter,
  ShieldAlert, Sparkles, Scale, Info,
  MoreHorizontal, ChevronLeft, ShieldCheck
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';
import LegalRequestFlow from '@/components/legal/LegalRequestFlow';
import { PlusCircle } from "lucide-react";


export default function DisputesPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [disputes, setDisputes] = useState<LegalDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (!['admin', 'legal', 'legal_admin', 'viewer'].includes(user.role)) {
        router.push('/');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await legalServicesApi.getLegalDisputes();
        if (Array.isArray(res)) setDisputes(res);
        else if (res && Array.isArray(res.data)) setDisputes(res.data);
        else setDisputes([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'text-blue-950 bg-slate-50', ring: 'ring-slate-100', dot: 'bg-slate-900' };
      case 'inProgress': return { color: 'text-blue-950 bg-slate-100', ring: 'ring-blue-100', dot: 'bg-slate-950' };
      case 'pending': return { color: 'text-slate-400 bg-slate-50', ring: 'ring-slate-100', dot: 'bg-slate-400' };
      case 'cancelled': return { color: 'text-slate-400 bg-slate-50', ring: 'ring-slate-100', dot: 'bg-slate-400' };
      default: return { color: 'text-blue-950 bg-slate-50', ring: 'ring-slate-100', dot: 'bg-slate-900' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return t('pm.legal.status.completed');
      case 'inProgress': return t('pm.legal.status.review');
      case 'pending': return t('pm.legal.status.pending');
      case 'cancelled': return t('bm.status.cancelled');
      default: return status;
    }
  };

  const filteredDisputes = disputes.filter(dispute => 
    dispute.disputeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dispute.disputeType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Premium Header Container */}
      <section className="relative overflow-hidden mb-12 p-8 md:p-12 rounded-b-[3rem] bg-slate-950 text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-600 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-900 rounded-full blur-[100px]" />
        </div>
          <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-3">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20 text-[9px] font-black uppercase tracking-[0.2em]"
                      >
                        <ShieldAlert className="w-3 h-3 text-slate-300" />
                        Legal Protection
                      </motion.div>
                      <motion.h1 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-2xl md:text-4xl font-black tracking-tight leading-tight"
                      >
                          {t('disputes.title')}
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/50 font-medium max-w-xl text-sm md:text-base leading-relaxed"
                      >
                        {t('bm.disputes.title')}: {t('disputes.tab.disputes')}, {t('disputes.tab.service_requests')}، المتابعة القانونية، وفض الخلافات بمهنية وشفافية تامة.
                      </motion.p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <div className="glass p-6 rounded-[2rem] bg-white/10 border-white/10 text-center min-w-[160px]">
                          <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-1">قضايا تحت المراجعة</p>
                          <p className="text-3xl font-black tabular-nums">{disputes.filter(d => d.status === 'inProgress').length}</p>
                          <div className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/30">تتطلب تدخل سريع</div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        <Tabs defaultValue="disputes" className="w-full space-y-10" onValueChange={(v) => console.log(v)}>
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-16 items-center justify-center rounded-2xl bg-white border border-slate-100 p-1.5 shadow-xl shadow-slate-100/50">
              <TabsTrigger value="disputes" className="px-8 rounded-xl h-12 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs transition-all">
                <Gavel className="w-4 h-4" />
                {t('disputes.tab.disputes')}
              </TabsTrigger>
              <TabsTrigger value="service_requests" className="px-8 rounded-xl h-12 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs transition-all">
                <Scale className="w-4 h-4" />
                {t('disputes.tab.service_requests')}
              </TabsTrigger>
              <TabsTrigger value="new_request" className="px-8 rounded-xl h-12 gap-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-xs transition-all">
                <PlusCircle className="w-4 h-4" />
                طلب جديد
              </TabsTrigger>
            </TabsList>

          </div>

          <TabsContent value="disputes" className="m-0 space-y-10">
            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-80 group">
                    <Search className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors`} />
                    <input 
                        placeholder="ابحث عن قضية..."
                        className="h-12 w-full rounded-xl border border-slate-100 bg-white px-12 text-sm font-bold focus:border-slate-900 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                  <Button variant="outline" className="flex-1 md:flex-none h-12 px-6 rounded-xl border-slate-100 font-bold text-xs uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" />
                    تصفية
                  </Button>
                </div>
            </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-80 rounded-[3rem] bg-slate-50/50 animate-pulse" />)}
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 glass rounded-[3rem] border-2 border-dashed border-slate-200 bg-white/30 text-center">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-8">
                  <Gavel className="w-12 h-12 text-slate-200" />
              </div>
              <p className="text-xl font-black uppercase tracking-widest opacity-40">{t('disputes.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredDisputes.map((dispute, idx) => {
                const status = getStatusConfig(dispute.status);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={dispute.id} 
                    className="bg-white border border-slate-100 rounded-[2rem] group hover:border-slate-900 transition-all duration-300 overflow-hidden"
                  >
                    <div className="p-8 space-y-6">
                      {/* Card Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-3">
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${status.color} ${status.ring.replace('ring-', 'border-')}`}>
                            <div className={`w-1 h-1 rounded-full ${status.dot} ${dispute.status === 'inProgress' ? 'animate-pulse' : ''}`} />
                            {getStatusLabel(dispute.status)}
                          </div>
                          <h3 className="text-xl font-black text-blue-950 group-hover:text-blue-900 transition-colors leading-[1.3]">
                            {dispute.disputeType}
                          </h3>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl group-hover:rotate-6 transition-transform border border-slate-100">
                          <Gavel className="w-5 h-5 text-slate-400" />
                        </div>
                      </div>

                      {/* Details Info */}
                      <div className="grid grid-cols-1 gap-3 pt-6 border-t border-slate-50">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                             <div className="w-9 h-9 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black text-[10px]">A</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('disputes.firstParty')}</p>
                               <p className="text-xs font-bold text-blue-950">{typeof dispute.firstParty === 'object' ? (dispute.firstParty as any).name : dispute.firstParty}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-200 text-slate-900 flex items-center justify-center font-black text-[10px]">B</div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('disputes.secondParty')}</p>
                               <p className="text-xs font-bold text-blue-950">{typeof dispute.secondParty === 'object' ? (dispute.secondParty as any).name : dispute.secondParty}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest pt-2">
                         <div className="flex items-center gap-2">
                           <Calendar className="w-3.5 h-3.5" />
                           {new Date(dispute.createdAt).toLocaleDateString('ar-SA')}
                         </div>
                         <div className="font-mono bg-slate-100 px-3 py-1 rounded-lg">
                           #{dispute.disputeNumber}
                         </div>
                      </div>

                      {/* Action Button */}
                      <Button className="w-full h-12 bg-slate-950 hover:bg-slate-900 text-white rounded-xl font-bold tracking-widest text-[10px] uppercase gap-2 mt-2 transition-all shadow-lg shadow-blue-900/10">
                        {t('disputes.details')}
                        <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </TabsContent>

      <TabsContent value="service_requests" className="m-0">
         <ServiceRequestsTable 
            title={t('disputes.tab.service_requests')}
            subtitle="إدارة طلبات المراجعة القانونية والاستشارات"
            department="legal"
         />
      </TabsContent>

      <TabsContent value="new_request" className="m-0">
         <div className="bg-slate-950 rounded-[3rem] border border-slate-800 p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/10 blur-3xl -mr-32 -mt-32 opacity-50" />
           <div className="text-center mb-10 relative z-10">
             <h2 className="text-2xl font-black text-white mb-2">تقديم طلب جديد</h2>
             <p className="text-slate-400 text-sm font-bold">اختر نوع الخدمة واملأ التفاصيل المطلوبة</p>
           </div>
           <div className="relative z-10">
             <LegalRequestFlow onSuccessRedirect="/disputes" />
           </div>
         </div>
      </TabsContent>

    </Tabs>


      </div>

      {/* Navigation Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push('/admin/dashboard')}
        className="fixed bottom-8 left-8 w-16 h-16 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-2xl z-50 group border border-white/10"
      >
        <div className="absolute inset-0 bg-slate-600 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 -z-10" />
        <ChevronLeft className={`w-8 h-8 ${language === 'ar' ? 'rotate-180' : ''}`} />
      </motion.button>
    </div>
  );
}
