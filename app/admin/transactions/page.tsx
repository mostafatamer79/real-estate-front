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
  Eye,
  MessageSquare,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";
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
import { SaudiRiyalIcon } from "@/components/ui/saudi-riyal-icon";

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
  const router = useRouter();
  const isRtl = language === "ar";

  const handleOpenChat = async (targetUserId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/rooms/direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/chat/${data.id}`);
      } else {
        toast.error(isRtl ? "فشل فتح المحادثة" : "Failed to open chat");
      }
    } catch (error) {
      console.error(error);
      toast.error(isRtl ? "حدث خطأ أثناء فتح المحادثة" : "Error opening chat");
    }
  };
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const label = (key: string, fallbackAr: string, fallbackEn: string) => {
    const value = t(key);
    if (value && value !== key) return value;
    return isRtl ? fallbackAr : fallbackEn;
  };

  const formatCurrency = (amount: number) => {
    const parts = new Intl.NumberFormat(isRtl ? "ar-SA" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));

    return parts;
  };

  const renderCurrency = (amount: number) => (
    <span className="inline-flex items-center gap-1">
      <span>{formatCurrency(amount)}</span>
      <SaudiRiyalIcon className="h-4 w-4 shrink-0" />
    </span>
  );

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
    setIsModalOpen(false);
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
    setIsModalOpen(true);
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
        <button
          type="button"
          onClick={() => { setEditingId(null); setForm(emptyForm); setIsModalOpen(true); }}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800 transition-colors self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          {isRtl ? "إضافة عملية" : "Add Transaction"}
        </button>
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
                    {renderCurrency(Number(tx.amount || 0))}
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
                      <button type="button" onClick={() => setViewingTransaction(tx)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-100 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300">
                        <Eye className="h-3.5 w-3.5" />
                        {isRtl ? "عرض" : "View"}
                      </button>
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

      {/* Create / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-8 py-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? (isRtl ? "تعديل عملية" : "Edit Transaction") : (isRtl ? "إضافة عملية جديدة" : "New Transaction")}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {isRtl ? "أدخل بيانات العملية المالية" : "Fill in the transaction details below"}
                </p>
              </div>
              <button onClick={resetForm} className="rounded-xl border border-slate-100 bg-white p-2 text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Type */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "النوع" : "Type"}</span>
                  <select value={form.type} onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                    {transactionTypes.map((type) => <option key={type} value={type}>{transactionTypeLabel(type)}</option>)}
                  </select>
                </div>
                {/* Amount */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "المبلغ" : "Amount"}</span>
                  <input type="number" min="0" value={form.amount} onChange={(e) => setForm((c) => ({ ...c, amount: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" />
                </div>
                {/* Status */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الحالة" : "Status"}</span>
                  <select value={form.status} onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                    {transactionStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {/* Payment Method */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "طريقة الدفع" : "Payment Method"}</span>
                  <select value={form.paymentMethod} onChange={(e) => setForm((c) => ({ ...c, paymentMethod: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                    {paymentMethods.map((m) => <option key={m || "empty"} value={m}>{m || (isRtl ? "غير محدد" : "None")}</option>)}
                  </select>
                </div>
                {/* Text fields */}
                {([
                  ["fromUserId", isRtl ? "من مستخدم ID" : "From User ID", "text"],
                  ["toUserId", isRtl ? "إلى مستخدم ID" : "To User ID", "text"],
                  ["taxAmount", isRtl ? "الضريبة" : "Tax Amount", "number"],
                  ["commissionAmount", isRtl ? "العمولة" : "Commission", "number"],
                  ["expenseCategory", isRtl ? "تصنيف المصروف" : "Expense Category", "text"],
                  ["referenceType", isRtl ? "نوع المرجع" : "Reference Type", "text"],
                  ["referenceId", isRtl ? "معرف المرجع" : "Reference ID", "text"],
                  ["description", isRtl ? "الوصف" : "Description", "text"],
                ] as [string, string, string][]).map(([key, lbl, inputType]) => (
                  <div key={key} className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{lbl}</span>
                    <input
                      type={inputType}
                      value={form[key] || ""}
                      onChange={(e) => setForm((c) => ({ ...c, [key]: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t border-slate-50 bg-slate-50/30 px-8 py-5">
              <button type="button" onClick={resetForm} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button type="button" onClick={saveTransaction} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50 hover:bg-slate-800 transition-colors">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingId ? (isRtl ? "حفظ التعديل" : "Save Changes") : (isRtl ? "إنشاء" : "Create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Transaction Details Modal */}
      {viewingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-8 py-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isRtl ? "تفاصيل العملية المالية" : "Transaction Details"}
                </h3>
                <p className="font-mono text-xs text-slate-400 mt-1">ID: {viewingTransaction.id}</p>
              </div>
              <button
                onClick={() => setViewingTransaction(null)}
                className="rounded-xl border border-slate-100 bg-white p-2 text-slate-400 hover:text-slate-900 hover:shadow-sm transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" dir={isRtl ? "rtl" : "ltr"}>
                {/* Type */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "النوع" : "Type"}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50">
                      {getTypeIcon(viewingTransaction.type)}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{transactionTypeLabel(viewingTransaction.type)}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "المبلغ" : "Amount"}</span>
                  <p className="text-sm font-black text-slate-950">
                    {renderCurrency(Number(viewingTransaction.amount || 0))}
                  </p>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الحالة" : "Status"}</span>
                  <div>{getStatusBadge(viewingTransaction.status)}</div>
                </div>

                {/* Payment Method */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "طريقة الدفع" : "Payment Method"}</span>
                  <p className="text-sm font-bold text-slate-900">{viewingTransaction.paymentMethod || (isRtl ? "غير محدد" : "None")}</p>
                </div>

                {/* From User */}
                <div className="space-y-1 sm:col-span-2 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "من" : "From"}</span>
                    {viewingTransaction.fromUser ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {viewingTransaction.fromUser.firstName} {viewingTransaction.fromUser.lastName}
                        </p>
                        <span className="block text-xs font-medium text-slate-400 font-mono">{viewingTransaction.fromUserId}</span>
                      </div>
                    ) : viewingTransaction.fromUserId ? (
                      <p className="text-sm font-mono text-slate-900">{viewingTransaction.fromUserId}</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-400">—</p>
                    )}
                  </div>
                  {viewingTransaction.fromUser && (
                    <button
                      onClick={() => handleOpenChat(viewingTransaction.fromUserId)}
                      className="flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors gap-2 shrink-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isRtl ? "فتح الشات" : "Open Chat"}
                    </button>
                  )}
                </div>

                {/* To User */}
                <div className="space-y-1 sm:col-span-2 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "إلى" : "To"}</span>
                    {viewingTransaction.toUser ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {viewingTransaction.toUser.firstName} {viewingTransaction.toUser.lastName}
                        </p>
                        <span className="block text-xs font-medium text-slate-400 font-mono">{viewingTransaction.toUserId}</span>
                      </div>
                    ) : viewingTransaction.toUserId ? (
                      <p className="text-sm font-mono text-slate-900">{viewingTransaction.toUserId}</p>
                    ) : (
                      <p className="text-sm font-bold text-slate-400">—</p>
                    )}
                  </div>
                  {viewingTransaction.toUser && (
                    <button
                      onClick={() => handleOpenChat(viewingTransaction.toUserId)}
                      className="flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 transition-colors gap-2 shrink-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isRtl ? "فتح الشات" : "Open Chat"}
                    </button>
                  )}
                </div>

                {/* Tax */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الضريبة" : "Tax"}</span>
                  <p className="text-sm font-bold text-slate-900">
                    {viewingTransaction.taxAmount != null 
                      ? renderCurrency(Number(viewingTransaction.taxAmount))
                      : "—"
                    }
                  </p>
                </div>

                {/* Commission */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "العمولة" : "Commission"}</span>
                  <p className="text-sm font-bold text-slate-900">
                    {viewingTransaction.commissionAmount != null 
                      ? renderCurrency(Number(viewingTransaction.commissionAmount))
                      : "—"
                    }
                  </p>
                </div>

                {/* Expense Category */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "تصنيف المصروف" : "Expense Category"}</span>
                  <p className="text-sm font-bold text-slate-900">{viewingTransaction.expenseCategory || "—"}</p>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "التاريخ" : "Date"}</span>
                  <p className="text-sm font-bold text-slate-900">
                    {viewingTransaction.createdAt || viewingTransaction.transactionDate 
                      ? new Date(viewingTransaction.createdAt || viewingTransaction.transactionDate).toLocaleString(isRtl ? "ar-SA" : "en-US")
                      : "—"
                    }
                  </p>
                </div>

                {/* Reference Type */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "نوع المرجع" : "Reference Type"}</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{viewingTransaction.referenceType || "—"}</p>
                </div>

                {/* Reference ID */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "معرف المرجع" : "Reference ID"}</span>
                  <p className="text-sm font-bold text-slate-900 font-mono">{viewingTransaction.referenceId || "—"}</p>
                </div>

                {/* Description */}
                <div className="sm:col-span-2 space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{isRtl ? "الوصف" : "Description"}</span>
                  <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                    {viewingTransaction.description || (isRtl ? "لا يوجد وصف" : "No description")}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-50 bg-slate-50/30 px-8 py-5 flex justify-end">
              <button
                onClick={() => setViewingTransaction(null)}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800 transition-colors"
              >
                {isRtl ? "إغلاق" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
