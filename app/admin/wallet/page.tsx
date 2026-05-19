"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { financialApi } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

export default function AdminWalletPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transRes, statsRes] = await Promise.all([
        financialApi.getTransactions(),
        financialApi.getDashboardStats()
      ]);
      
      if (transRes.data) setTransactions(transRes.data);
      if (statsRes.data) setStats(statsRes.data);
    } catch (error) {
      console.error("Failed to fetch financial data", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    (typeFilter === "all" || tx.type === typeFilter) &&
    (
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        tx.referenceId?.includes(search) ||
        tx.id.includes(search)
    )
  );

  const exportTransactionsFromBackend = async () => {
    try {
      setExporting(true);
      const res = await financialApi.exportTransactions({
        type: typeFilter,
        search: search || undefined,
      });

      const contentType = res?.headers?.["content-type"] || "text/csv;charset=utf-8";
      const blob = new Blob([res.data], { type: contentType });

      const contentDisposition: string | undefined = res?.headers?.["content-disposition"];
      const match = contentDisposition?.match(/filename=\"?([^\";]+)\"?/i);
      const filenameFromHeader = match?.[1];
      const datePart = new Date().toISOString().slice(0, 10);
      const fallbackFilename = `wallet-transactions-${datePart}.csv`;
      const filename = filenameFromHeader || fallbackFilename;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export transactions", error);
      toast.error(t("admin.error.export_failed") || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'paid': 
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200">مدفوع</Badge>;
      case 'pending': 
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200">معلق</Badge>;
      case 'failed': 
      case 'rejected': 
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">مرفوض</Badge>;
      default: 
        return <Badge className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  const statCards = [
    { label: 'إجمالي الإيرادات', value: stats?.totalRevenue || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'العمولات المستحقة', value: stats?.pendingCommissions || 0, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'عمليات اليوم', value: stats?.todayTransactions || 0, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'المعاملات المعلقة', value: stats?.pendingTransactions || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <Wallet className="w-3 h-3" />
            النظام المالي
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">
            {t('admin.wallet.title') || "إدارة المحفظة والمالية"}
          </h1>
          <p className="text-slate-500 font-medium text-sm">
            {t('admin.wallet.desc') || "مراقبة جميع التدفقات المالية، العمولات، والفواتير في المنصة"}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            type="button"
            onClick={fetchData}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            title={t("admin.common.refresh") || "Refresh"}
            aria-label={t("admin.common.refresh") || "Refresh"}
          >
            <RefreshCw className="w-5 h-5 text-slate-400" />
          </button>
          <button
            type="button"
            onClick={exportTransactionsFromBackend}
            className="p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || exporting || filteredTransactions.length === 0}
            title={t("admin.wallet.export") || "Export"}
            aria-label={t("admin.wallet.export") || "Export"}
          >
            {exporting ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Download className="w-5 h-5 text-slate-400" />}
          </button>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث في المعاملات..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-64 text-sm font-bold shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={card.label}
            className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col justify-between h-40"
          >
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
              <p className={`text-2xl font-black text-slate-950`}>
                {typeof card.value === 'number' ? new Intl.NumberFormat('ar-SA').format(card.value) : card.value}
                {typeof card.value === 'number' && <span className="text-xs font-bold text-slate-400 mr-1 uppercase">ر.س</span>}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-black text-slate-950 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-400" />
            سجل العمليات المالية
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setTypeFilter('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'all' ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}>الكل</button>
            <button onClick={() => setTypeFilter('payment')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'payment' ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}>مدفوعات</button>
            <button onClick={() => setTypeFilter('payout')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'payout' ? 'bg-slate-950 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200'}`}>سحوبات</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المعاملة</TableHead>
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المستخدم</TableHead>
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">المبلغ</TableHead>
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الطريقة</TableHead>
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest">الحالة</TableHead>
                <TableHead className="py-5 px-6 font-black text-slate-900 text-[10px] uppercase tracking-widest text-left">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-bold">لا توجد معاملات مالية مسجلة</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} className="hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-xs">{tx.description || 'عملية غير مصنفة'}</span>
                        <span className="font-mono text-[9px] text-slate-400 uppercase tracking-tighter">REF: {tx.referenceId || tx.id.substring(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                          {tx.user?.firstName?.[0] || <User className="w-4 h-4" />}
                        </div>
                        <span className="font-bold text-slate-700 text-xs">{tx.user?.firstName} {tx.user?.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-1">
                        <span className={`font-black text-sm ${tx.type === 'payment' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.type === 'payment' ? '+' : '-'}{new Intl.NumberFormat('ar-SA').format(tx.amount)}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">ر.س</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                        <CreditCard className="w-3.5 h-3.5" />
                        {tx.paymentMethod || 'محفظة'}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      {getStatusBadge(tx.status)}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-left font-mono text-[10px] text-slate-400 font-bold">
                      {new Date(tx.createdAt).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
