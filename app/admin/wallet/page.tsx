"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, CreditCard, Download, Edit2, ExternalLink, FileText, Loader2, Percent, Plus, RefreshCw, Save, Search, Trash2, TrendingUp, Wallet, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import api, { commissionApi, financialApi } from "@/lib/api";
import { toast } from "sonner";

type WalletTab = "wallet" | "invoices" | "commissions" | "files" | "investments";

const emptyForms: Record<WalletTab, Record<string, string>> = {
  wallet: { type: "deposit", amount: "", fromUserId: "", toUserId: "", status: "completed", paymentMethod: "wallet", description: "", referenceType: "", referenceId: "" },
  invoices: { userId: "", amount: "", description: "", status: "unpaid", documentUrl: "", referenceType: "", referenceId: "" },
  commissions: { type: "sale", propertyType: "", city: "", neighborhood: "", streetName: "", planNumber: "", plotNumber: "", area: "", deedNumber: "", totalAmount: "", commissionPercentage: "", ownerName: "", ownerIdNumber: "", buyerName: "", buyerIdNumber: "", status: "draft", finalCommissionAmount: "", notes: "" },
  files: { invoiceId: "", documentUrl: "" },
  investments: { userId: "", clientName: "", phone: "", city: "", district: "", serviceType: "استثمار عقاري", quantity: "1", price: "", description: "", status: "pending" },
};

export default function AdminWalletPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<WalletTab>("wallet");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForms.wallet);

  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes, invoicesRes, commissionsRes, filesRes, serviceRequestsRes] = await Promise.all([
        financialApi.getDashboardStats().catch(() => ({ data: null })),
        financialApi.getTransactions().catch(() => ({ data: [] })),
        financialApi.getAllInvoices().catch(() => ({ data: [] })),
        commissionApi.findMyCommissions().catch(() => ({ data: [] })),
        financialApi.getAllFiles().catch(() => ({ data: [] })),
        api.get("/service-requests", { params: { page: 1, limit: 500 } }).catch(() => ({ data: [] })),
      ]);

      const serviceRequests = Array.isArray(serviceRequestsRes.data?.items) ? serviceRequestsRes.data.items : Array.isArray(serviceRequestsRes.data) ? serviceRequestsRes.data : [];
      setStats(statsRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setCommissions(Array.isArray(commissionsRes.data) ? commissionsRes.data : []);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setInvestments(serviceRequests.filter((item: any) => {
        const text = `${item.category || ""} ${item.serviceType || ""} ${item.description || ""}`.toLowerCase();
        return text.includes("invest") || text.includes("استثمار");
      }));
    } catch {
      toast.error("تعذر تحميل بيانات المحفظة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const nextTab = searchParams.get("tab") as WalletTab | null;
    if (nextTab && Object.keys(emptyForms).includes(nextTab)) {
      setActiveTab(nextTab);
    } else {
      setActiveTab("wallet");
    }
  }, [searchParams]);

  useEffect(() => {
    setEditingId(null);
    setForm(emptyForms[activeTab]);
  }, [activeTab]);

  const tabs = [
    ["wallet", "المحفظة", Wallet, transactions.length],
    ["invoices", "الفواتير", FileText, invoices.length],
    ["commissions", "العمولات", Percent, commissions.length],
    ["files", "الملفات والمستندات", CreditCard, files.length],
    ["investments", "الاستثمارات", TrendingUp, investments.length],
  ] as const;

  const activeItems = useMemo(() => {
    if (activeTab === "invoices") return invoices;
    if (activeTab === "commissions") return commissions;
    if (activeTab === "files") return files;
    if (activeTab === "investments") return investments;
    return transactions;
  }, [activeTab, commissions, files, investments, invoices, transactions]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  }, [activeItems, search]);

  const fields = useMemo(() => {
    if (activeTab === "wallet") return [
      ["type", "نوع العملية", "select:sale,rent,commission,tax,deposit,withdrawal,settlement,expense"],
      ["amount", "المبلغ", "number"],
      ["fromUserId", "من المستخدم", "text"],
      ["toUserId", "إلى المستخدم", "text"],
      ["status", "الحالة", "select:pending,completed,failed,cancelled"],
      ["paymentMethod", "طريقة الدفع", "select:bank,card,apple_pay,wallet,cash"],
      ["description", "الوصف", "text"],
      ["referenceType", "نوع المرجع", "text"],
      ["referenceId", "رقم المرجع", "text"],
    ];
    if (activeTab === "invoices") return [
      ["userId", "معرف المستخدم", "text"],
      ["amount", "المبلغ", "number"],
      ["status", "الحالة", "select:draft,unpaid,paid,cancelled"],
      ["description", "الوصف", "text"],
      ["documentUrl", "رابط المستند", "text"],
      ["referenceType", "نوع المرجع", "text"],
      ["referenceId", "رقم المرجع", "text"],
    ];
    if (activeTab === "commissions") return [
      ["type", "نوع العمولة", "select:sale,rent,lease,other"],
      ["propertyType", "نوع العقار", "text"],
      ["city", "المدينة", "text"],
      ["neighborhood", "الحي", "text"],
      ["streetName", "الشارع", "text"],
      ["planNumber", "رقم المخطط", "text"],
      ["plotNumber", "رقم القطعة", "text"],
      ["area", "المساحة", "number"],
      ["deedNumber", "رقم الصك", "text"],
      ["totalAmount", "إجمالي الصفقة", "number"],
      ["commissionPercentage", "نسبة العمولة", "number"],
      ["ownerName", "اسم المالك", "text"],
      ["ownerIdNumber", "هوية المالك", "text"],
      ["buyerName", "اسم المشتري", "text"],
      ["buyerIdNumber", "هوية المشتري", "text"],
      ["status", "الحالة", "select:draft,pending,under_review,approved,rejected,paid,cancelled"],
      ["finalCommissionAmount", "المبلغ النهائي", "number"],
      ["notes", "ملاحظات", "text"],
    ];
    if (activeTab === "files") return [
      ["invoiceId", "معرف الفاتورة", "text"],
      ["documentUrl", "رابط المستند", "text"],
    ];
    return [
      ["userId", "معرف المستخدم", "text"],
      ["clientName", "اسم العميل", "text"],
      ["phone", "الجوال", "text"],
      ["city", "المدينة", "text"],
      ["district", "الحي", "text"],
      ["serviceType", "نوع الاستثمار", "text"],
      ["quantity", "العدد", "number"],
      ["price", "السعر", "number"],
      ["description", "الوصف", "text"],
      ["status", "الحالة", "select:pending,assigned,in_progress,completed,cancelled"],
    ];
  }, [activeTab]);

  const setValue = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const compactPayload = () => {
    const numericKeys = new Set(["amount", "area", "totalAmount", "commissionPercentage", "finalCommissionAmount", "quantity", "price"]);
    const payload: Record<string, any> = {};
    Object.entries(form).forEach(([key, value]) => {
      if (value === "") return;
      payload[key] = numericKeys.has(key) ? Number(value) : value;
    });
    return payload;
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const payload = compactPayload();
      if (activeTab === "wallet") {
        editingId ? await financialApi.updateTransaction(editingId, payload) : await financialApi.createTransaction(payload);
      } else if (activeTab === "invoices") {
        if (editingId) await financialApi.updateInvoice(editingId, payload);
        else await financialApi.createUserInvoice(payload.userId, payload as any);
      } else if (activeTab === "commissions") {
        if (editingId) {
          await financialApi.updateCommission(editingId, {
            status: payload.status,
            finalCommissionAmount: payload.finalCommissionAmount,
            notes: payload.notes,
          });
        } else {
          await commissionApi.create({
            type: payload.type,
            propertyType: payload.propertyType,
            city: payload.city,
            neighborhood: payload.neighborhood,
            streetName: payload.streetName,
            planNumber: payload.planNumber,
            plotNumber: payload.plotNumber,
            area: payload.area,
            deedNumber: payload.deedNumber,
            totalAmount: payload.totalAmount,
            commissionPercentage: payload.commissionPercentage,
            owner: { name: payload.ownerName, idNumber: payload.ownerIdNumber, partyType: "owner" },
            buyer: { name: payload.buyerName, idNumber: payload.buyerIdNumber, partyType: "buyer" },
            notes: payload.notes,
          });
        }
      } else if (activeTab === "files") {
        if (!payload.invoiceId) throw new Error("invoiceId is required");
        await financialApi.updateInvoiceDocument(payload.invoiceId, payload.documentUrl || null);
      } else {
        if (editingId) {
          await api.put(`/service-requests/${editingId}`, payload);
        } else {
          await api.post("/service-requests", { ...payload, category: "other", serviceType: payload.serviceType || "استثمار عقاري" });
        }
      }

      toast.success(editingId ? "تم التعديل" : "تمت الإضافة");
      setEditingId(null);
      setForm(emptyForms[activeTab]);
      await loadData();
    } catch {
      toast.error("تعذر حفظ السجل. تأكد من الحقول المطلوبة.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: any) => {
    const next = { ...emptyForms[activeTab] };
    Object.keys(next).forEach((key) => {
      if (key === "ownerName") next[key] = item.owner?.name || "";
      else if (key === "ownerIdNumber") next[key] = item.owner?.idNumber || "";
      else if (key === "buyerName") next[key] = item.buyer?.name || "";
      else if (key === "buyerIdNumber") next[key] = item.buyer?.idNumber || "";
      else if (item[key] !== undefined && item[key] !== null) next[key] = String(item[key]);
    });
    if (activeTab === "files") {
      next.invoiceId = item.type === "invoice" ? item.id : "";
      next.documentUrl = item.url || "";
    }
    setEditingId(item.id);
    setForm(next);
  };

  const deleteRecord = async (item: any) => {
    if (!confirm("هل تريد حذف هذا السجل؟")) return;
    try {
      if (activeTab === "wallet") await financialApi.deleteTransaction(item.id);
      else if (activeTab === "invoices") await financialApi.deleteInvoice(item.id);
      else if (activeTab === "commissions") await financialApi.deleteCommission(item.id);
      else if (activeTab === "files") {
        if (item.type === "invoice") await financialApi.updateInvoiceDocument(item.id, null);
        else if (item.type === "commission_doc" && item.raw?.id && item.url) await financialApi.removeCommissionAttachment(item.raw.id, item.url);
        else throw new Error("Cannot delete generated file");
      } else {
        await api.delete(`/service-requests/${item.id}`);
      }
      toast.success("تم الحذف");
      await loadData();
    } catch {
      toast.error("تعذر حذف السجل");
    }
  };

  const exportTransactions = async () => {
    setExporting(true);
    try {
      const res = await financialApi.exportTransactions();
      const blob = new Blob([res.data], { type: res?.headers?.["content-type"] || "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wallet-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const statCards = [
    ["إجمالي الإيرادات", stats?.totalRevenue || 0, TrendingUp],
    ["الفواتير", invoices.length, FileText],
    ["العمولات", commissions.length, Percent],
    ["الاستثمارات", investments.length, TrendingUp],
  ] as const;

  const displayAmount = (item: any) => item.total || item.amount || item.finalCommissionAmount || item.commissionAmount || item.price || 0;
  const displayTitle = (item: any) => item.description || item.serviceType || item.commissionNumber || item.name || item.referenceId || item.id;
  const displayUser = (item: any) => item.user ? `${item.user.firstName || ""} ${item.user.lastName || ""}` : item.userId || item.toUserId || item.fromUserId || item.clientName || "—";

  return (
    <div className="space-y-8 p-6 lg:p-8" dir="rtl">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white">
            <Wallet className="h-3.5 w-3.5" />
            النظام المالي
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">إدارة المحفظة والمالية</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">كل البيانات هنا من الباكند: معاملات، فواتير، عمولات، ملفات، واستثمارات.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadData} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          <button onClick={exportTransactions} disabled={exporting} className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            تصدير
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {statCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <Icon className="h-6 w-6 text-slate-400" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{Number(value || 0).toLocaleString("ar-SA")}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {activeTab === "files" ? "ربط/تحديث مستند" : editingId ? "تعديل سجل" : "إضافة سجل"}
          </h2>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm(emptyForms[activeTab]); }} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-100 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <X className="h-4 w-4" />
              إلغاء
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {fields.map(([key, label, type]) => {
            const typeString = String(type);
            if (typeString.startsWith("select:")) {
              const options = typeString.replace("select:", "").split(",");
              return (
                <label key={key} className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                  <select value={form[key] || ""} onChange={(event) => setValue(key, event.target.value)} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950">
                    {options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              );
            }
            return (
              <label key={key} className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                <input type={typeString} value={form[key] || ""} onChange={(event) => setValue(key, event.target.value)} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950" />
              </label>
            );
          })}
          <button onClick={saveRecord} disabled={saving} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <h3 className="font-black text-slate-950">{tabs.find(([value]) => value === activeTab)?.[1]}</h3>
          <div className="relative w-full md:w-96">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث..." className="h-11 w-full rounded-xl border border-slate-100 pr-11 pl-4 text-sm font-bold outline-none focus:border-slate-950" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">السجل</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">المستخدم</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">المبلغ/النوع</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الحالة/التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-300" /></td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-xs font-black uppercase tracking-widest text-slate-300">لا توجد بيانات</td></tr>
              ) : filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-950">{displayTitle(item)}</p>
                    <p className="font-mono text-[10px] font-bold text-slate-400">#{String(item.id).slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{displayUser(item)}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700">{activeTab === "files" ? item.type : Number(displayAmount(item)).toLocaleString("ar-SA")}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700">{item.status || item.paymentStatus || item.date?.slice?.(0, 10) || item.createdAt?.slice?.(0, 10) || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600"><ExternalLink className="h-4 w-4" />فتح</a>}
                      <button onClick={() => startEdit(item)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600"><Edit2 className="h-4 w-4" />تعديل</button>
                      <button onClick={() => deleteRecord(item)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600"><Trash2 className="h-4 w-4" />حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
