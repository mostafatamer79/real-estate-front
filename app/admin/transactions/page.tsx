"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  User,
  CheckCircle, 
  XCircle, 
  Clock,
  Filter
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "react-hot-toast";

export default function TransactionsPage() {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await financialApi.getTransactions();
      if (res.data) {
        setTransactions(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch transactions", error);
      toast.error(t('admin.error.fetch_failed') || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => 
    tx.id.includes(search) ||
    tx.fromUser?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.toUser?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    tx.type?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200">Completed</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">Failed</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">Cancelled</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200">Pending</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
      switch (type) {
          case 'deposit': return <ArrowDownRight className="w-4 h-4 text-green-500" />;
          case 'withdrawal': return <ArrowUpRight className="w-4 h-4 text-red-500" />;
          case 'commission': return <CheckCircle className="w-4 h-4 text-blue-500" />;
          default: return <Clock className="w-4 h-4 text-gray-500" />;
      }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 mb-2">
            {t('admin.transactions.title') || "Transactions"}
          </h1>
          <p className="text-slate-500 font-medium">
            {t('admin.transactions.desc') || "View all financial transactions"}
          </p>
        </div>
        <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
                type="text" 
                placeholder={t('admin.search') || "Search..."} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 w-full md:w-64"
             />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 font-black text-slate-900">ID</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Type</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Amount</TableHead>
              <TableHead className="py-5 font-black text-slate-900">From</TableHead>
              <TableHead className="py-5 font-black text-slate-900">To</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Status</TableHead>
              <TableHead className="py-5 font-black text-slate-900">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">Loading...</TableCell>
                </TableRow>
            ) : filteredTransactions.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">No transactions found</TableCell>
                </TableRow>
            ) : (
                filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-slate-50/50 group whitespace-nowrap">
                    <TableCell className="font-mono text-xs text-slate-500">#{tx.id.substring(0, 8)}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                {getTypeIcon(tx.type)}
                            </div>
                            <span className="font-bold text-slate-700 capitalize">
                                {t(`admin.transactions.type.${tx.type}`) || tx.type}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell className="font-black text-slate-900">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR' }).format(Number(tx.amount))}
                    </TableCell>
                    <TableCell>
                        {tx.fromUser ? (
                             <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-sm text-slate-600">{tx.fromUser.firstName} {tx.fromUser.lastName}</span>
                             </div>
                        ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>
                        {tx.toUser ? (
                             <div className="flex items-center gap-2">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="text-sm text-slate-600">{tx.toUser.firstName} {tx.toUser.lastName}</span>
                             </div>
                        ) : <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    <TableCell className="text-slate-500 text-xs">
                        {new Date(tx.createdAt || tx.transactionDate).toLocaleDateString()}
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
