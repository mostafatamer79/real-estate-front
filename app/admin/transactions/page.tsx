"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Edit2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  User,
  X,
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
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";

const transactionTypes = ["sale", "rent", "commission", "tax", "deposit", "withdrawal", "settlement", "expense"];
const transactionStatuses = ["pending", "completed", "failed", "cancelled"];
const paymentMethods = ["", "bank", "card", "apple_pay", "wallet", "cash"];

const emptyForm = {
  type: "sale",
  amount: "",
  status: "completed",
  fromUserId: "",
  toUserId: "",
  taxAmount: "",
  commissionAmount: "",
  paymentMethod: "",
  expenseCategory: "",
  referenceType: "",
  referenceId: "",
  description: "",
};

export default function TransactionsPage() {
  const { t, language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const isRtl = language === "ar";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const label = (key: string, fallbackAr: string, fallbackEn: string) => {
    const value = t(key);
    if (value && value !== key) return value;
    return isRtl ? fallbackAr : fallbackEn;
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await financialApi.getTransactions();
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
      toast.error(isRtl ? "فشل تحميل العمليات" : "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      const haystack = [
        tx.id,
        tx.type,
        tx.status,
        tx.amount,
        tx.fromUserId,
        tx.toUserId,
        tx.referenceType,
        tx.referenceId,
        tx.description,
        tx.fromUser?.firstName,
        tx.fromUser?.lastName,
        tx.toUser?.firstName,
        tx.toUser?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const createdAt = tx.createdAt || tx.transactionDate ? new Date(tx.createdAt || tx.transactionDate) : null;
      const amount = Number(tx.amount || 0);
      const matchesSearch = !query || haystack.includes(query);
      const matchesType = typeFilter === "all" || tx.type === typeFilter;
      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      const matchesPayment = paymentMethodFilter === "all" || (tx.paymentMethod || "") === paymentMethodFilter;
      const matchesFrom = !dateFrom || (createdAt && createdAt >= new Date(dateFrom));
      const matchesTo = !dateTo || (createdAt && createdAt <= new Date(`${dateTo}T23:59:59`));
      const matchesMin = !minAmount || amount >= Number(minAmount);
      const matchesMax = !maxAmount || amount <= Number(maxAmount);
      return matchesSearch && matchesType && matchesStatus && matchesPayment && matchesFrom && matchesTo && matchesMin && matchesMax;
    });
  }, [search, transactions, typeFilter, statusFilter, paymentMethodFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-700 hover:bg-green-100",
      failed: "bg-red-100 text-red-700 hover:bg-red-100",
      cancelled: "bg-slate-100 text-slate-700 hover:bg-slate-100",
      pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    };
    return <Badge className={styles[status] || styles.pending}>{status || "pending"}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    if (type === "deposit" || type === "sale" || type === "rent") return <ArrowDownRight className="h-4 w-4 text-green-500" />;
    if (type === "withdrawal" || type === "expense" || type === "tax") return <ArrowUpRight className="h-4 w-4 text-red-500" />;
    if (type === "commission") return <CheckCircle className="h-4 w-4 text-blue-500" />;
    return <Clock className="h-4 w-4 text-slate-500" />;
  };

  const transactionTypeLabel = (type: string) => {
    const value = t(`admin.transactions.type.${type}`);
    if (value && value !== `admin.transactions.type.${type}`) return value;
    const ar: Record<string, string> = {
      sale: "بيع",
      rent: "إيجار",
      commission: "عمولة",
      tax: "ضريبة",
      deposit: "إيداع",
      withdrawal: "سحب",
      settlement: "تسوية",
      expense: "مصروف",
    };
    return isRtl ? (ar[type] || type) : type.replace("_", " ");
  };

  const normalizePayload = () => {
    const payload: Record<string, any> = {
      type: form.type,
      amount: Number(form.amount),
      status: form.status,
    };
    ["fromUserId", "toUserId", "paymentMethod", "expenseCategory", "referenceType", "referenceId", "description"].forEach((key) => {
      if (form[key]?.trim()) payload[key] = form[key].trim();
    });
    if (form.taxAmount) payload.taxAmount = Number(form.taxAmount);
    if (form.commissionAmount) payload.commissionAmount = Number(form.commissionAmount);
    return payload;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveTransaction = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error(isRtl ? "أدخل مبلغ صحيح" : "Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const payload = normalizePayload();
      if (editingId) {
        await financialApi.updateTransaction(editingId, payload);
        toast.success(isRtl ? "تم تحديث العملية" : "Transaction updated");
      } else {
        await financialApi.createTransaction(payload);
        toast.success(isRtl ? "تم إنشاء العملية" : "Transaction created");
      }
      resetForm();
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isRtl ? "تعذر حفظ العملية" : "Failed to save transaction"));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tx: any) => {
    setEditingId(tx.id);
    setForm({
      type: tx.type || "sale",
      amount: tx.amount != null ? String(tx.amount) : "",
      status: tx.status || "completed",
      fromUserId: tx.fromUserId || "",
      toUserId: tx.toUserId || "",
      taxAmount: tx.taxAmount != null ? String(tx.taxAmount) : "",
      commissionAmount: tx.commissionAmount != null ? String(tx.commissionAmount) : "",
      paymentMethod: tx.paymentMethod || "",
      expenseCategory: tx.expenseCategory || "",
      referenceType: tx.referenceType || "",
      referenceId: tx.referenceId || "",
      description: tx.description || "",
    });
  };

  const deleteTransaction = async (id: string) => {
    const ok = await confirmDialog({
      title: isRtl ? "هل تريد حذف هذه العملية؟" : "Delete this transaction?",
      description: isRtl ? "سيتم حذف العملية نهائيًا من السجل المالي." : "This transaction will be permanently removed from the financial log.",
      confirmLabel: isRtl ? "حذف" : "Delete",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await financialApi.deleteTransaction(id);
      toast.success(isRtl ? "تم حذف العملية" : "Transaction deleted");
      if (editingId === id) resetForm();
      await fetchTransactions();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || (isRtl ? "تعذر حذف العملية" : "Failed to delete transaction"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-950">
            {label("admin.transactions.title", "إدارة العمليات", "Transactions Management")}
          </h1>
          <p className="font-medium text-slate-500">
            {label("admin.transactions.desc", "إنشاء وتعديل وحذف العمليات المالية", "Create, update and delete financial transactions")}
          </p>
        </div>
        <div className="grid w-full gap-3 md:max-w-5xl md:grid-cols-4 xl:grid-cols-7">
        <div className="relative md:col-span-2">
          <Search className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${isRtl ? "right-4" : "left-4"}`} />
          <input
            type="text"
            placeholder={t("admin.search") || (isRtl ? "بحث" : "Search")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className={`h-12 w-full rounded-2xl border border-slate-200 bg-white px-11 text-sm font-bold outline-none focus:border-slate-950`}
          />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold">
          <option value="all">{isRtl ? "كل الأنواع" : "All types"}</option>
          {transactionTypes.map((type) => <option key={type} value={type}>{transactionTypeLabel(type)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold">
          <option value="all">{isRtl ? "كل الحالات" : "All statuses"}</option>
          {transactionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold">
          <option value="all">{isRtl ? "كل طرق الدفع" : "All payments"}</option>
          {paymentMethods.filter(Boolean).map((method) => <option key={method} value={method}>{method}</option>)}
          <option value="">{isRtl ? "غير محدد" : "None"}</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold" />
        <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder={isRtl ? "أقل مبلغ" : "Min"} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold" />
        <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} placeholder={isRtl ? "أعلى مبلغ" : "Max"} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold" />
        <button type="button" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setPaymentMethodFilter("all"); setDateFrom(""); setDateTo(""); setMinAmount(""); setMaxAmount(""); }} className="h-12 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black">
          {isRtl ? "مسح" : "Clear"}
        </button>
        </div>
      </div>

      <section className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? (isRtl ? "تعديل عملية" : "Edit transaction") : (isRtl ? "إضافة عملية" : "Create transaction")}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-100 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-slate-300"
            >
              <X className="h-4 w-4" />
              {isRtl ? "إلغاء التعديل" : "Cancel edit"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "النوع" : "Type"}</span>
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950">
              {transactionTypes.map((type) => <option key={type} value={type}>{transactionTypeLabel(type)}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "المبلغ" : "Amount"}</span>
            <input type="number" min="0" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950" />
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الحالة" : "Status"}</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950">
              {transactionStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "طريقة الدفع" : "Payment method"}</span>
            <select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950">
              {paymentMethods.map((method) => <option key={method || "empty"} value={method}>{method || (isRtl ? "غير محدد" : "None")}</option>)}
            </select>
          </label>
          {[
            ["fromUserId", isRtl ? "من مستخدم ID" : "From user ID"],
            ["toUserId", isRtl ? "إلى مستخدم ID" : "To user ID"],
            ["taxAmount", isRtl ? "الضريبة" : "Tax"],
            ["commissionAmount", isRtl ? "العمولة" : "Commission"],
            ["expenseCategory", isRtl ? "تصنيف المصروف" : "Expense category"],
            ["referenceType", isRtl ? "نوع المرجع" : "Reference type"],
            ["referenceId", isRtl ? "معرف المرجع" : "Reference ID"],
            ["description", isRtl ? "الوصف" : "Description"],
          ].map(([key, text]) => (
            <label key={key} className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{text}</span>
              <input
                type={key === "taxAmount" || key === "commissionAmount" ? "number" : "text"}
                value={form[key] || ""}
                onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950"
              />
            </label>
          ))}
          <button
            type="button"
            onClick={saveTransaction}
            disabled={saving}
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? (isRtl ? "حفظ التعديل" : "Save changes") : (isRtl ? "إضافة" : "Create")}
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "المعرف" : "ID"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "النوع" : "Type"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "المبلغ" : "Amount"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "من" : "From"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "إلى" : "To"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "الحالة" : "Status"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "التاريخ" : "Date"}</TableHead>
              <TableHead className="py-5 font-black text-slate-900">{isRtl ? "إجراءات" : "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-300" />
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-slate-500">
                  {isRtl ? "لا توجد عمليات" : "No transactions found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="whitespace-nowrap hover:bg-slate-50/50">
                  <TableCell className="font-mono text-xs text-slate-500">#{String(tx.id).substring(0, 8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50">
                        {getTypeIcon(tx.type)}
                      </div>
                      <span className="font-bold capitalize text-slate-700">{transactionTypeLabel(tx.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-slate-900">
                    {new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US", { style: "currency", currency: "SAR" }).format(Number(tx.amount || 0))}
                  </TableCell>
                  <TableCell>
                    {tx.fromUser ? (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-sm text-slate-600">{tx.fromUser.firstName} {tx.fromUser.lastName}</span>
                      </div>
                    ) : tx.fromUserId ? <span className="font-mono text-xs text-slate-500">{tx.fromUserId.slice(0, 8)}</span> : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell>
                    {tx.toUser ? (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-sm text-slate-600">{tx.toUser.firstName} {tx.toUser.lastName}</span>
                      </div>
                    ) : tx.toUserId ? <span className="font-mono text-xs text-slate-500">{tx.toUserId.slice(0, 8)}</span> : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {tx.createdAt || tx.transactionDate ? new Date(tx.createdAt || tx.transactionDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => startEdit(tx)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">
                        <Edit2 className="h-3.5 w-3.5" />
                        {isRtl ? "تعديل" : "Edit"}
                      </button>
                      <button type="button" onClick={() => deleteTransaction(tx.id)} disabled={saving} className="inline-flex h-9 items-center gap-2 rounded-xl bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-100 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                        {isRtl ? "حذف" : "Delete"}
                      </button>
                    </div>
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
