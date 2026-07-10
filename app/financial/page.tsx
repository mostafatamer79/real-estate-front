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
    ChevronLeft, MoreHorizontal, ArrowRight, Filter, Rocket,
    SaudiRiyalIcon
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
import { SaudiRiyalAmount, SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";

export default function FinancialPage({ embedded = false, initialTab = "dashboard" }: { embedded?: boolean; initialTab?: string } = {}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialTab || "dashboard");
    const { t, language } = useLanguage();
    const { isOpen, message, isAdmin } = useSectionGuard('financial');



    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            const departments = user.departments || [];
            const hasDept = departments.some((d: string) => d.toLowerCase() === 'finance' || d.toLowerCase() === 'financial');
            const hasPerm = (user.departmentPermissions?.finance && user.departmentPermissions.finance !== 'none') ||
                           (user.departmentPermissions?.financial && user.departmentPermissions.financial !== 'none');

            if (!['admin', 'finance', 'finance_admin', 'viewer', 'manager'].includes(user.role) && !hasDept && !hasPerm) {
                router.push('/');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    useEffect(() => {
        setActiveTab(initialTab || "dashboard");
    }, [initialTab]);

    if (!isOpen) {
        return <ComingSoonOverlay sectionName={t('admin.settings.financial') || 'المالية'} message={message} isAdmin={isAdmin} />;
    }

    return (
        <div className={`${embedded ? '' : 'min-h-screen bg-card pb-12 overflow-x-hidden'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Premium Header Container */}
             {/* Optimized Premium Header */}
      {!embedded && (
      <section className="relative overflow-hidden mb-10 pb-10 border-b border bg-card">
        <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 sm:gap-8">
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
                  className="text-sm md:text-xl sm:text-3xl font-black tracking-tight text-slate-950"
                >
                  {t('fin.title')}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-500 font-bold max-w-xl text-sm leading-relaxed"
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
      )}


            <div className={`${embedded ? '' : 'max-w-7xl mx-auto px-6'}`}>
                <Tabs value={activeTab} className="w-full space-y-8" onValueChange={setActiveTab}>
                    {/* Scrollable Premium Tabs */}
                    <div className="overflow-x-auto pb-2 hide-scrollbar">
       
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
                            <TabsContent value="dashboard" className="m-0"><GeneralDashboard embedded={embedded} /></TabsContent>
                            <TabsContent value="transactions" className="m-0"><TransactionsSection /></TabsContent>
                            <TabsContent value="commissions" className="m-0">
                                <div className="space-y-8">
                                     <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 gap-6 text-white">
                                         <div className="bg-slate-900 p-4 sm:p-8 rounded-[1.25rem] border border-blue-800 relative overflow-hidden group">
                                             <div className="absolute top-0 right-0 p-3 sm:p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                               <PieChart className="w-20 h-20" />
                                             </div>
                                             <h4 className="text-lg font-black mb-5 flex items-center gap-3">
                                               <Sparkles className="w-4 h-4 text-slate-500" />
                                               {t('fin.commissions.distributionTitle')}
                                             </h4>
                                             <div className="space-y-3">
                                                 <div className="flex justify-between items-center p-4 bg-card/5 rounded-xl border border-white/5 transition-all">
                                                     <span className="font-bold text-xs opacity-60">{t('fin.commissions.brokers')}</span>
                                                     <span className="text-xl font-black">2.5%</span>
                                                 </div>
                                                 <div className="flex justify-between items-center p-4 bg-card/5 rounded-xl border border-white/5 transition-all">
                                                     <span className="font-bold text-xs opacity-60">{t('fin.commissions.platform')}</span>
                                                     <span className="text-xl font-black">1.0%</span>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="bg-card p-4 sm:p-8 rounded-[1.25rem] border border flex flex-col justify-center items-center text-center group">
                                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-slate-400 mb-5 group-hover:rotate-6 transition-all border border">
                                              <TrendingUp className="w-8 h-8" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-950 mb-1.5">{t('fin.policy.update')}</h4>
                                            <p className="text-slate-400 font-bold text-xs leading-relaxed max-w-xs">{t('fin.policy.desc')}</p>
                                            <Button variant="outline" className="mt-6 rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest bg-slate-950 text-white border-slate-950 hover:bg-slate-900">{t('fin.settings.edit')}</Button>
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

            {!embedded && (
            /* Navigation Floating Button */
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => router.push('/details')}
              className="fixed bottom-6 left-6 w-12 h-12 rounded-full bg-slate-950 text-white flex items-center justify-center shadow-xl z-50 border border-white/10"
            >
              <ChevronLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </motion.button>
            )}
        </div>
    );
}

function GeneralDashboard({ embedded = false }: { embedded?: boolean }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { t, language } = useLanguage();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await financialApi.getWorkspaceSummary();
                setStats(data);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchStats();
    }, []);

    const kpis = [
        { label: t('fin.kpi.sales'), value: stats?.totalSales || 0, icon: SaudiRiyalIcon, color: "text-slate-900", bg: "bg-muted" },
        { label: t('fin.kpi.rentals'), value: stats?.totalRentals || 0, icon: Briefcase, color: "text-slate-900", bg: "bg-muted" },
        { label: t('fin.kpi.commission'), value: stats?.totalCommission || 0, icon: Banknote, color: "text-slate-900", bg: "bg-muted" },
        { label: t('fin.kpi.expenses'), value: stats?.totalExpenses || 0, icon: ArrowDownLeft, color: "text-slate-900", bg: "bg-muted" },
        { label: t('fin.kpi.netProfit'), value: stats?.netProfit || 0, icon: ArrowUpRight, color: "text-slate-950", bg: "bg-muted" },
        { label: t('fin.kpi.vat'), value: stats?.totalTax || 0, icon: Calculator, color: "text-slate-900", bg: "bg-muted" },
    ];

    if (loading) return (
      <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-32 rounded-3xl bg-muted animate-pulse" />)}
      </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map((kpi, idx) => (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      className="p-3 sm:p-6 rounded-3xl bg-card border border hover:border-slate-300 transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center transition-all duration-500 border border-`}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{kpi.label}</p>
                                <h3 className="text-lg font-black text-slate-900 transition-colors">
                                  <SaudiRiyalAmount amount={Number(kpi.value || 0)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} iconClassName="h-4 w-4 text-slate-400" className="text-lg font-black text-slate-900 transition-colors" />
                                </h3>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-card rounded-3xl border border p-3 sm:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">أداء آخر 6 أشهر</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Income vs expenses</p>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900" />الدخل</span>
                            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300" />المصروفات</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end min-h-[220px]">
                        {(stats?.monthlyTotals || []).slice(-6).map((item: any, idx: number) => {
                            const maxValue = Math.max(
                              ...((stats?.monthlyTotals || []).slice(-6).flatMap((m: any) => [Number(m.income || 0), Number(m.expenses || 0)])),
                              1
                            );
                            const incomeHeight = Math.max((Number(item.income || 0) / maxValue) * 140, 8);
                            const expenseHeight = Math.max((Number(item.expenses || 0) / maxValue) * 140, 8);
                            return (
                                <motion.div
                                  key={`${item.month}-${idx}`}
                                  initial={{ opacity: 0, y: 16 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="flex flex-col items-center gap-3"
                                >
                                    <div className="w-full h-40 flex items-end justify-center gap-2">
                                        <div className="w-5 rounded-t-xl bg-slate-300" style={{ height: `${expenseHeight}px` }} />
                                        <div className="w-5 rounded-t-xl bg-slate-900" style={{ height: `${incomeHeight}px` }} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[11px] font-black text-slate-900">{item.month}</p>
                                        <p className="text-[9px] font-bold text-slate-400"><SaudiRiyalAmount amount={Number(item.net || 0)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} iconClassName="h-3 w-3 text-slate-400" className="text-[9px] font-bold text-slate-400" /></p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-card rounded-3xl border border p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">حالة الفواتير</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Invoice health</p>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {[
                          { label: 'مدفوعة', count: stats?.invoiceStats?.paidCount || 0, total: stats?.invoiceStats?.paidTotal || 0, tone: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                          { label: 'غير مدفوعة', count: stats?.invoiceStats?.unpaidCount || 0, total: stats?.invoiceStats?.outstandingTotal || 0, tone: 'bg-amber-50 text-amber-700 border-amber-100' },
                          { label: 'مسودة', count: stats?.invoiceStats?.draftCount || 0, total: 0, tone: 'bg-muted text-slate-700 border' },
                        ].map((row) => (
                          <div key={row.label} className={`rounded-2xl border p-4 ${row.tone}`}>
                              <div className="flex items-center justify-between">
                                  <div>
                                      <p className="text-xs font-black">{row.label}</p>
                                      <p className="text-[10px] font-bold opacity-70 mt-1">{row.count} عنصر</p>
                                  </div>
                                  <div className="text-left">
                                      <p className="text-sm font-black tabular-nums"><SaudiRiyalAmount amount={Number(row.total || 0)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} iconClassName="h-4 w-4" className="text-sm font-black tabular-nums" /></p>
                                  </div>
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
                <div className="bg-card rounded-3xl border border p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">المصروفات حسب الفئة</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Expense breakdown</p>
                        </div>
                        <PieChart className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {(stats?.expenseBreakdown?.length ? stats.expenseBreakdown : [{ category: 'لا توجد بيانات', total: 0 }]).map((item: any) => {
                            const maxExpense = Math.max(...((stats?.expenseBreakdown || []).map((e: any) => Number(e.total || 0))), 1);
                            const width = Math.max((Number(item.total || 0) / maxExpense) * 100, item.total ? 12 : 0);
                            return (
                                <div key={item.category} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm font-black text-slate-900">
                                        <span>{item.category}</span>
                                        <span className="tabular-nums"><SaudiRiyalAmount amount={Number(item.total || 0)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} className="tabular-nums" /></span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                        <div className="h-full rounded-full bg-slate-900" style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-card rounded-3xl border border p-3 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-950">آخر النشاطات المالية</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Recent activity</p>
                        </div>
                        <Sparkles className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {(stats?.recentTransactions?.length ? stats.recentTransactions : []).slice(0, embedded ? 5 : 8).map((tx: any) => (
                            <div key={tx.id} className="rounded-2xl border border bg-muted p-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-950 truncate">{tx.description || tx.type}</p>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{tx.type} • {tx.status}</p>
                                </div>
                                <div className="text-left shrink-0">
                                    <p className="text-sm font-black text-slate-950 tabular-nums"><SaudiRiyalAmount amount={Number(tx.amount || 0)} locale={language === 'ar' ? 'ar-SA' : 'en-US'} iconClassName="h-4 w-4 text-slate-400" className="text-sm font-black text-slate-950 tabular-nums" /></p>
                                </div>
                            </div>
                        ))}
                        {!stats?.recentTransactions?.length && (
                            <div className="h-44 rounded-2xl border border-dashed border flex items-center justify-center text-sm font-bold text-slate-300">
                                لا توجد حركة مالية حديثة
                            </div>
                        )}
                    </div>
                </div>
            </div>
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
        <div className="rounded-3xl overflow-hidden border border">
            <div className="p-4 sm:p-8 border-b border flex justify-between items-center bg-card">
                <div>
                   <h4 className="text-xl font-black text-slate-900">{t('fin.tab.transactions')}</h4>
                   <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{t('fin.transactions.desc')}</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl h-10 px-5 font-black text-[11px] uppercase border hover:bg-muted">{t('common.export')}</Button>
                    <Button variant="outline" className="rounded-xl h-10 px-5 font-black text-[11px] uppercase border hover:bg-muted"><Filter className="w-3.5 h-3.5 ml-2" />{t('common.filter')}</Button>
                </div>
            </div>
            <div className="overflow-x-auto hide-scrollbar">
                <Table>
                    <TableHeader className="bg-muted" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.id')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.type')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.amount')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('fin.table.commission')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('fin.table.status')}</TableHead>
                            <TableHead className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{t('fin.table.date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-50 bg-card">
                        {loading ? (
                          <TableRow><TableCell colSpan={6} className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
                        ) : transactions.length > 0 ? (
                            transactions.map((tx, idx) => (
                                <motion.tr
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  key={tx.id}
                                  className="hover:bg-muted transition-colors group"
                                >
                                    <TableCell className="px-8 py-5">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-bold font-mono text-slate-400 group-hover:text-slate-900 transition-colors uppercase tracking-widest">{tx.id.slice(0, 8)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="px-8 py-5 font-black text-slate-900 text-xs">{tx.type}</TableCell>
                                    <TableCell className="px-8 py-5 font-black text-slate-900 text-sm tabular-nums">{tx.amount.toLocaleString()} <span className="text-[9px] opacity-40 font-bold"><SaudiRiyalSymbol iconClassName="h-3 w-3" /></span></TableCell>
                                    <TableCell className="px-8 py-5 font-bold text-slate-500 tabular-nums text-xs">{tx.commissionAmount} <span className="text-[9px] opacity-30 font-bold"><SaudiRiyalSymbol iconClassName="h-3 w-3" /></span></TableCell>
                                    <TableCell className="px-8 py-5 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border
                                            ${tx.status === 'completed' ? 'bg-muted text-slate-900 border' : 'bg-muted text-slate-400 border'}`}>
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
        <div className="p-20 rounded-[1rem] bg-card flex flex-col items-center justify-center text-center border border">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-slate-300 mb-6 border border">
              <Rocket className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-black text-slate-900 mb-2">{title}</h4>
            <p className="text-slate-400 font-bold text-xs max-w-sm mx-auto">{t('common.soon')}. {t('fin.soon.desc')}</p>
        </div>
    );
}
