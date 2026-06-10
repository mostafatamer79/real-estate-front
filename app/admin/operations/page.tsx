"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, BarChart3, CreditCard, Receipt, ShoppingBag } from "lucide-react";
import { adminApi, financialApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminOperationsPage() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes, transactionsRes] = await Promise.all([
          financialApi.getDashboardStats(),
          adminApi.getAllOrders().catch(() => ({ data: [] })),
          financialApi.getTransactions().catch(() => ({ data: [] })),
        ]);
        setStats(statsRes.data || null);
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
        setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = useMemo(
    () => [
      { label: isRtl ? "العمليات النشطة" : "Active operations", value: stats?.activeOperations ?? 0, icon: Activity },
      { label: isRtl ? "إجمالي الطلبات" : "Total orders", value: orders.length, icon: ShoppingBag },
      { label: isRtl ? "إجمالي المعاملات" : "Transactions", value: transactions.length, icon: Receipt },
      { label: isRtl ? "الإيرادات" : "Revenue", value: Number(stats?.totalRevenue || 0).toLocaleString(isRtl ? "ar-SA" : "en-US"), icon: CreditCard },
    ],
    [isRtl, orders.length, stats, transactions.length],
  );

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
          <BarChart3 className="h-3.5 w-3.5" />
          {isRtl ? "الإحصائيات والعمليات" : "Stats & Operations"}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {isRtl ? "إحصائيات وعمليات المنصة" : "Platform Stats & Operations"}
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{loading ? "..." : card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-950">{isRtl ? "آخر الطلبات" : "Recent orders"}</h2>
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 8).map((order, index) => (
              <div key={order.id || index} className="py-3 text-sm font-bold text-slate-700">
                {order.title || order.type || order.status || (isRtl ? "طلب" : "Order")}
              </div>
            ))}
            {!orders.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد طلبات" : "No orders"}</div>}
          </div>
          <Link href="/admin/orders" className="mt-4 inline-flex text-xs font-black text-slate-950 underline">
            {isRtl ? "إدارة الطلبات" : "Manage orders"}
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black text-slate-950">{isRtl ? "آخر المعاملات" : "Recent transactions"}</h2>
          <div className="divide-y divide-slate-100">
            {transactions.slice(0, 8).map((transaction, index) => (
              <div key={transaction.id || index} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="font-bold text-slate-700">{transaction.description || transaction.type || (isRtl ? "معاملة" : "Transaction")}</span>
                <span className="font-black text-slate-950">{Number(transaction.amount || 0).toLocaleString(isRtl ? "ar-SA" : "en-US")}</span>
              </div>
            ))}
            {!transactions.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد معاملات" : "No transactions"}</div>}
          </div>
          <Link href="/admin/transactions" className="mt-4 inline-flex text-xs font-black text-slate-950 underline">
            {isRtl ? "إدارة المعاملات" : "Manage transactions"}
          </Link>
        </div>
      </section>
    </div>
  );
}
