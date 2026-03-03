"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { 
    LayoutDashboard, Receipt, Banknote, CreditCard, 
    Calculator, FileText, Wallet, ArrowUpRight, 
    ArrowDownLeft, DollarSign, Briefcase, Loader2,
    TrendingUp, ShieldCheck, PieChart, Sparkles,
    ChevronLeft, MoreHorizontal, ArrowRight, Filter, Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import ServiceRequestsTable from '@/components/shared/ServiceRequestsTable';

import UserWallet from '@/components/financial/UserWallet';
import CommissionManager from '@/components/financial/CommissionManager';
import ExpensesManager from '@/components/financial/ExpensesManager';
import ReportsManager from '@/components/financial/ReportsManager';
import PaymentsManager from '@/components/financial/PaymentsManager';
import { financialApi, FinancialTransaction } from '@/lib/financial-service';
import { useLanguage } from "@/context/LanguageContext";

export default function FinancialPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("dashboard");
    const { t, language } = useLanguage();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (!['admin', 'finance', 'finance_admin', 'viewer'].includes(user.role)) {
                router.push('/');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-white pb-12 overflow-x-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Premium Header Container */}
             {/* Optimized Premium Header */}
      <section className="relative overflow-hidden mb-10 pb-10 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-8">
            <div className="space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 text-white text-[9px] font-black uppercase tracking-[0.2em]"
              >
            
              </motion.div>
              <div className="space-y-2">
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl md:text-5xl font-black tracking-tight text-blue-950"
                >
                  {t('fin.title')}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 font-bold max-w-xl text-sm leading-relaxed"
                >
                  {t('fin.header.desc')}
                </motion.p>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-6"
            >
        
            </motion.div>
          </div>
        </div>
      </section>


            <div className="max-w-7xl mx-auto px-6">
                <Tabs defaultValue="dashboard" className="w-full space-y-8" onValueChange={setActiveTab}>
                    {/* Scrollable Premium Tabs */}
                    <div className="overflow-x-auto pb-2 hide-scrollbar">
                        <TabsList className="inline-flex h-14 items-center gap-1.5 rounded-2xl bg-slate-50 border border-slate-100 p-1.5 min-w-max" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                            {[
                              { val: 'dashboard', icon: LayoutDashboard, label: t('fin.tab.dashboard') },
                              { val: 'transactions', icon: Receipt, label: t('fin.tab.transactions') },
                              { val: 'payments', icon: CreditCard, label: t('fin.tab.payments') },
                              { val: 'expenses', icon: Calculator, label: t('fin.tab.expenses') },
                               { val: 'reports', icon: FileText, label: t('fin.tab.reports') },
                               { val: 'settlements', icon: Briefcase, label: t('fin.tab.settlements') },
                               { val: 'service_requests', icon: LayoutDashboard, label: t('fin.tab.service_requests') }
                            ].map((tab) => (
                              <TabsTrigger key={tab.val} value={tab.val} className="px-5 rounded-xl h-10 gap-2.5 data-[state=active]:bg-white data-[state=active]:text-blue-950 data-[state=active]:shadow-sm font-bold text-[11px] uppercase tracking-wider transition-all duration-300 whitespace-nowrap">
                                <tab.icon className={`w-3.5 h-3.5 transition-colors ${activeTab === tab.val ? 'text-blue-950' : 'text-slate-400'}`} />
                                {tab.label}
                              </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="outline-none"
                        >
                            <TabsContent value="dashboard" className="m-0"><GeneralDashboard /></TabsContent>
                            <TabsContent value="transactions" className="m-0"><TransactionsSection /></TabsContent>
                            <TabsContent value="commissions" className="m-0">
                                <div className="space-y-8">
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
                                         <div className="bg-slate-900 p-8 rounded-[2rem] border border-blue-800 relative overflow-hidden group">
                                             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                               <PieChart className="w-20 h-20" />
                                             </div>
                                             <h4 className="text-lg font-black mb-5 flex items-center gap-3">
                                               <Sparkles className="w-4 h-4 text-slate-500" />
                                               {t('fin.commissions.distributionTitle')}
                                             </h4>
                                             <div className="space-y-3">
                                                 <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 transition-all">
                                                     <span className="font-bold text-xs opacity-60">{t('fin.commissions.brokers')}</span>
                                                     <span className="text-xl font-black">2.5%</span>
                                                 </div>
                                                 <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 transition-all">
                                                     <span className="font-bold text-xs opacity-60">{t('fin.commissions.platform')}</span>
                                                     <span className="text-xl font-black">1.0%</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-center items-center text-center group">
                                            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-5 group-hover:rotate-6 transition-all border border-slate-100">
                                              <TrendingUp className="w-8 h-8" />
                                            </div>
                                            <h4 className="text-xl font-black text-blue-950 mb-1.5">{t('fin.policy.update')}</h4>
                                            <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-xs">{t('fin.policy.desc')}</p>
                                            <Button variant="outline" className="mt-6 rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest bg-slate-950 text-white border-blue-950 hover:bg-slate-900">{t('fin.settings.edit')}</Button>
                                         </div>
                                     </div>
                                     <CommissionManager />
                                </div>
                            </TabsContent>
                            <TabsContent value="payments" className="m-0"><PaymentsManager /></TabsContent>
                            <TabsContent value="expenses" className="m-0"><ExpensesManager /></TabsContent>
                            <TabsContent value="reports" className="m-0"><ReportsManager /></TabsContent>
                            <TabsContent value="wallet" className="m-0"><UserWallet /></TabsContent>
                             <TabsContent value="settlements" className="m-0">
                                 <PlaceholderSection title={t('fin.settlements.title')} />
                             </TabsContent>
                             <TabsContent value="service_requests" className="m-0">
                                 <ServiceRequestsTable 
                                    title={t('fin.tab.service_requests')}
                                    subtitle={t('fin.transactions.desc')}
                                    department="finance"
                                 />
                             </TabsContent>
                        </motion.div>
                    </AnimatePresence>
                </Tabs>
            </div>

            {/* Navigation Floating Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/admin/dashboard')}
              className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-xl z-50 border border-white/10"
            >
              <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </motion.button>
        </div>
    );
}

function GeneralDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await financialApi.getDashboardStats();
                setStats(data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    const kpis = [
        { label: t('fin.kpi.sales'), value: stats?.totalSales || 0, icon: DollarSign, color: "text-slate-900", bg: "bg-slate-50", unit: t('fin.currency') },
        { label: t('fin.kpi.rentals'), value: stats?.totalRentals || 0, icon: Briefcase, color: "text-slate-900", bg: "bg-slate-50", unit: t('fin.currency') },
        { label: t('fin.kpi.commission'), value: stats?.totalCommission || 0, icon: Banknote, color: "text-slate-900", bg: "bg-slate-50", unit: t('fin.currency') },
        { label: t('fin.kpi.expenses'), value: stats?.totalExpenses || 0, icon: ArrowDownLeft, color: "text-slate-900", bg: "bg-slate-50", unit: t('fin.currency') },
        { label: t('fin.kpi.netProfit'), value: stats?.netProfit || 0, icon: ArrowUpRight, color: "text-slate-950", bg: "bg-slate-100", unit: t('fin.currency') },
        { label: t('fin.kpi.vat'), value: stats?.totalTax || 0, icon: Calculator, color: "text-slate-900", bg: "bg-slate-50", unit: t('fin.currency') },
    ];

    if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-50 animate-pulse" />)}
      </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="p-6 rounded-3xl bg-white border border-slate-100 hover:border-slate-300 transition-all duration-300 group"
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center transition-all duration-500 border border-slate-100`}>
                            <kpi.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{kpi.label}</p>
                            <h3 className="text-lg font-black text-slate-900 transition-colors">
                              {kpi.value.toLocaleString()} <span className="text-[10px] opacity-40 font-bold">{kpi.unit}</span>
                            </h3>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}

function TransactionsSection() {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await financialApi.getAllTransactions();
                setTransactions(data);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        load();
    }, []);

    return (
        <div className="rounded-3xl overflow-hidden border border-slate-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                   <h4 className="text-xl font-black text-slate-900">{t('fin.tab.transactions')}</h4>
                   <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{t('fin.transactions.desc')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-10 px-5 font-black text-[11px] uppercase border-slate-200 hover:bg-slate-50">{t('common.export')}</Button>
                    <Button variant="outline" className="rounded-xl h-10 px-5 font-black text-[11px] uppercase border-slate-200 hover:bg-slate-50"><Filter className="w-3.5 h-3.5 ml-2" />{t('common.filter')}</Button>
                </div>
            </div>
            <div className="overflow-x-auto hide-scrollbar">
                <Table>
                    <TableHeader className="bg-slate-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.id')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.type')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.amount')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.commission')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('fin.table.status')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('fin.table.date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50 bg-white">
                        {loading ? (
                          <TableRow><TableCell colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx, idx) => (
                                <motion.tr 
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  key={tx.id} 
                                  className="hover:bg-slate-50 transition-colors group"
                                >
                                    <TableCell className="px-8 py-5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{tx.id.slice(0, 8)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 font-black text-slate-900 text-xs">{tx.type}</TableCell>
                                    <TableCell className="px-8 py-5 font-black text-slate-900 text-sm tabular-nums">{tx.amount.toLocaleString()} <span className="text-[9px] opacity-40 font-bold">ر.س</span></TableCell>
                                    <TableCell className="px-8 py-5 font-bold text-slate-500 tabular-nums text-xs">{tx.commissionAmount} <span className="text-[9px] opacity-30 font-bold">ر.س</span></TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                            ${tx.status === 'completed' ? 'bg-slate-50 text-slate-900 border-slate-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            <div className={`w-1 h-1 rounded-full ${tx.status === 'completed' ? 'bg-slate-900' : 'bg-slate-300'} ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                                            {t('bm.status.' + tx.status)}
                                        </span>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 text-center font-bold text-slate-400 text-[10px]">
                                      {new Date(tx.transactionDate).toLocaleDateString('ar-SA')}
                                    </TableCell>
                                </motion.tr>
                            ))
                        ) : (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest opacity-30 text-[10px]">{t('fin.noData')}</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function PlaceholderSection({ title }: { title: string }) {
    const { t } = useLanguage();
    return (
        <div className="p-20 rounded-[2.5rem] bg-white flex flex-col items-center justify-center text-center border border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-6 border border-slate-100">
              <Rocket className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{title}</h4>
            <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto">{t('common.soon')}. {t('fin.soon.desc')}</p>
        </div>
    );
}
