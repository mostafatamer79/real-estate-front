"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Download, Edit2, ExternalLink, FileText, Loader2, Percent, Plus, RefreshCw, Save, Search, Trash2, TrendingUp, User, Wallet, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { commissionApi, financialApi, usersApi } from "@/lib/api";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";

type WalletTab = "wallet" | "invoices" | "commissions" | "files" | "investments";

const tabMeta: Record<WalletTab, {
  badge: string;
  title: string;
  subtitle: string;
  formTitle: string;
  formDescription: string;
  canExport: boolean;
  allowInlineCreate: boolean;
  allowDelete: boolean;
  allowEdit: boolean;
}> = {
  wallet: {
    badge: "الإدارة المالية",
    title: "الفواتير",
    subtitle: "متابعة التحويلات، الفواتير، العقود، الملفات، والاستثمارات من مكان واحد.",
    formTitle: "تحويل الأرباح واستقبال الأموال",
    formDescription: "أنشئ حركة مالية جديدة أو عدل عملية موجودة.",
    canExport: true,
    allowInlineCreate: true,
    allowDelete: true,
    allowEdit: true,
  },
  invoices: {
    badge: "الفواتير",
    title: "الفواتير",
    subtitle: "اطلاع وتصفح الفواتير ومراجعة حالتها ومرفقاتها ضمن الإدارة المالية.",
    formTitle: "تصفح الفواتير",
    formDescription: "هذا القسم مخصص للاطلاع والتصفح فقط من الفواتير.",
    canExport: false,
    allowInlineCreate: false,
    allowDelete: false,
    allowEdit: false,
  },
  commissions: {
    badge: "العقود والعمولات",
    title: "عقود الوساطة والعمولات",
    subtitle: "عرض عقود الوساطة، مراجعة حالة الإتمام، وتحرير بيانات العمولة المرتبطة بها.",
    formTitle: "إصدار عقد وساطة / تحديث عمولة",
    formDescription: "حرر العقد أو العمولة وحدث الحالة النهائية والملاحظات.",
    canExport: false,
    allowInlineCreate: true,
    allowDelete: true,
    allowEdit: true,
  },
  files: {
    badge: "الملفات",
    title: "الملفات والمستندات",
    subtitle: "مراجعة الملفات والمستندات المرتبطة بالفواتير والعقود وتحديثها من نفس المكان.",
    formTitle: "إدارة الملفات والمستندات",
    formDescription: "هذا القسم مخصص للمراجعة والتحرير وفتح الملفات، وليس لإضافة سجل مالي عام.",
    canExport: false,
    allowInlineCreate: false,
    allowDelete: true,
    allowEdit: true,
  },
  investments: {
    badge: "الاستثمارات",
    title: "إعلانات وطلبات الاستثمارات",
    subtitle: "إضافة إعلانات استثمارية ومراجعة الطلبات مع القبول أو الرفض أو التعليق.",
    formTitle: "إضافة إعلان استثماري",
    formDescription: "أنشئ طلبًا أو إعلانًا استثماريًا وحدث حالته التشغيلية.",
    canExport: false,
    allowInlineCreate: true,
    allowDelete: true,
    allowEdit: true,
  },
};

const emptyForms: Record<WalletTab, Record<string, string>> = {
  wallet: { type: "deposit", amount: "", fromUserId: "", toUserId: "", status: "completed", paymentMethod: "wallet", description: "", referenceType: "", referenceId: "" },
  invoices: { userId: "", amount: "", description: "", status: "unpaid", documentUrl: "", referenceType: "", referenceId: "" },
  commissions: { type: "sale", propertyType: "", city: "", neighborhood: "", streetName: "", planNumber: "", plotNumber: "", area: "", deedNumber: "", totalAmount: "", commissionPercentage: "", ownerName: "", ownerIdNumber: "", buyerName: "", buyerIdNumber: "", status: "draft", finalCommissionAmount: "", notes: "" },
  files: { invoiceId: "", documentUrl: "" },
  investments: { userId: "", clientName: "", phone: "", city: "", district: "", serviceType: "استثمار عقاري", quantity: "1", price: "", description: "", status: "pending", rooms: "", bathrooms: "", propertyAge: "", livingRooms: "", kitchens: "", floors: "", apartments: "", buildingArea: "", length: "", width: "", streetWidth: "", direction: "", deedType: "", propertyCondition: "", furnitureStatus: "", hasGarage: "false", hasPool: "false", hasElevator: "false", hasMaidRoom: "false", hasRoof: "false", hasExternalAnnex: "false" },
};

const valueLabels: Record<string, string> = {
  sale: "بيع",
  rent: "إيجار",
  lease: "عقد إيجار",
  commission: "عمولة",
  tax: "ضريبة",
  deposit: "إيداع",
  withdrawal: "سحب",
  settlement: "تسوية",
  expense: "مصروف",
  other: "أخرى",
  pending: "قيد الانتظار",
  completed: "مكتملة",
  failed: "فشلت",
  cancelled: "ملغاة",
  draft: "مسودة",
  unpaid: "غير مدفوعة",
  paid: "مدفوعة",
  under_review: "قيد المراجعة",
  approved: "مقبولة",
  rejected: "مرفوضة",
  on_hold: "معلقة",
  bank: "تحويل بنكي",
  card: "بطاقة",
  apple_pay: "Apple Pay",
  wallet: "رصيد المنصة",
  cash: "نقدي",
};

const displayValue = (value: any) => valueLabels[String(value)] || String(value || "—");

const userLabel = (user: any) => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || user?.phone || user?.id || "مستخدم";
};

function UserPicker({
  label,
  value,
  users,
  loading,
  onChange,
}: {
  label: string;
  value: string;
  users: any[];
  loading: boolean;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selectedUser = users.find((user) => user.id === value);

  useEffect(() => {
    if (selectedUser) setQuery(userLabel(selectedUser));
    else if (!value) setQuery("");
    else setQuery(value);
  }, [selectedUser, value]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((user) => {
        if (!q) return true;
        return `${user.firstName || ""} ${user.lastName || ""} ${user.phone || ""} ${user.email || ""}`.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [query, users]);

  return (
    <label className="relative space-y-1.5">
      <span className="text-xs font-black text-slate-400">{label}</span>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <input
          value={query}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange("");
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث بالاسم أو الجوال..."
          className="h-11 w-full rounded-lg border border-slate-100 bg-white pr-10 pl-10 text-sm font-bold outline-none focus:border-slate-950"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
              setOpen(true);
            }}
            className="absolute left-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-700"
            aria-label="مسح المستخدم"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
          {loading ? (
            <div className="flex h-16 items-center justify-center text-slate-300">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(user.id);
                  setQuery(userLabel(user));
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-right hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-800">{userLabel(user)}</span>
                  <span className="block truncate text-[11px] font-bold text-slate-400">{user.phone || user.email || user.id}</span>
                </span>
                <User className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-center text-xs font-black text-slate-300">لا يوجد مستخدم مطابق</div>
          )}
        </div>
      )}
    </label>
  );
}

export default function AdminWalletPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const confirmDialog = useConfirmDialog();
  const [activeTab, setActiveTab] = useState<WalletTab>("wallet");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForms.wallet);

  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, txRes, invoicesRes, commissionsRes, filesRes, serviceRequestsRes, usersRes] = await Promise.all([
        financialApi.getDashboardStats().catch(() => ({ data: null })),
        financialApi.getTransactions().catch(() => ({ data: [] })),
        financialApi.getAllInvoices().catch(() => ({ data: [] })),
        commissionApi.findMyCommissions().catch(() => ({ data: [] })),
        financialApi.getAllFiles().catch(() => ({ data: [] })),
        api.get("/service-requests", { params: { page: 1, limit: 500 } }).catch(() => ({ data: [] })),
        usersApi.findAll().catch(() => ({ data: [] })),
      ]);

      const serviceRequests = Array.isArray(serviceRequestsRes.data?.items) ? serviceRequestsRes.data.items : Array.isArray(serviceRequestsRes.data) ? serviceRequestsRes.data : [];
      setStats(statsRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setCommissions(Array.isArray(commissionsRes.data) ? commissionsRes.data : []);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setInvestments(serviceRequests.filter((item: any) => {
        const text = `${item.category || ""} ${item.serviceType || ""} ${item.description || ""}`.toLowerCase();
        return text.includes("invest") || text.includes("استثمار");
      }));
    } catch {
      toast.error("تعذر تحميل بيانات الإدارة المالية");
    } finally {
      setLoading(false);
      setLoadingUsers(false);
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
    setSearch("");
    setStatusFilter("all");
    setShowForm(false);
  }, [activeTab]);

  const tabs = [
    ["wallet", "لوحة مالية", Wallet, transactions.length],
    ["invoices", "الفواتير", FileText, invoices.length],
    ["commissions", "العقود والعمولات", Percent, commissions.length],
    ["files", "الملفات والمستندات", CreditCard, files.length],
    ["investments", "الاستثمارات", TrendingUp, investments.length],
  ] as const;

  const currentTabMeta = tabMeta[activeTab];

  function displayStatus(item: any) {
    return item.status || item.paymentStatus || item.date?.slice?.(0, 10) || item.createdAt?.slice?.(0, 10) || "—";
  }

  const activeItems = useMemo(() => {
    if (activeTab === "invoices") return invoices;
    if (activeTab === "commissions") return commissions;
    if (activeTab === "files") return files;
    if (activeTab === "investments") return investments;
    return transactions;
  }, [activeTab, commissions, files, investments, invoices, transactions]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      const status = displayStatus(item);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch = !q || JSON.stringify(item).toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [activeItems, search, statusFilter]);

  const statusOptions = useMemo(() => {
    const statuses = Array.from(new Set(activeItems.map((item) => displayStatus(item)).filter(Boolean)));
    return ["all", ...statuses];
  }, [activeItems]);

  const fields = useMemo(() => {
    if (activeTab === "wallet") return [
      ["type", "نوع العملية", "select:sale,rent,commission,tax,deposit,withdrawal,settlement,expense"],
      ["amount", "المبلغ", "number"],
      ["fromUserId", "من مستخدم", "user"],
      ["toUserId", "إلى مستخدم", "user"],
      ["status", "الحالة", "select:pending,completed,failed,cancelled"],
      ["paymentMethod", "طريقة الدفع", "select:bank,card,apple_pay,wallet,cash"],
      ["description", "الوصف", "text"],
      ["referenceType", "نوع المرجع", "text"],
      ["referenceId", "رقم المرجع", "text"],
    ];
    if (activeTab === "invoices") return [
      ["userId", "المستخدم", "user"],
      ["amount", "المبلغ", "number"],
      ["status", "الحالة", "select:draft,unpaid,paid,cancelled"],
      ["description", "الوصف", "text"],
      ["documentUrl", "رابط المستند", "text"],
      ["referenceType", "نوع المرجع", "text"],
      ["referenceId", "رقم المرجع", "text"],
    ];
    if (activeTab === "commissions") return [
      ["type", "نوع العقد", "select:sale,rent,lease,other"],
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
      ["finalCommissionAmount", "العمولة المستحقة", "number"],
      ["notes", "ملاحظات", "text"],
    ];
    if (activeTab === "files") return [
      ["invoiceId", "معرف الفاتورة", "text"],
      ["documentUrl", "رابط المستند", "text"],
    ];
    return [
      ["userId", "المستخدم", "user"],
      ["clientName", "اسم العميل", "text"],
      ["phone", "الجوال", "text"],
      ["city", "المدينة", "text"],
      ["district", "الحي", "text"],
      ["serviceType", "نوع الاستثمار", "text"],
      ["quantity", "العدد", "number"],
      ["price", "السعر", "number"],
      ["description", "الوصف", "text"],
      ["status", "الحالة", "select:pending,approved,rejected,on_hold,completed,cancelled"],
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
        const metadata = {
          rooms: payload.rooms, bathrooms: payload.bathrooms, propertyAge: payload.propertyAge, livingRooms: payload.livingRooms, kitchens: payload.kitchens, floors: payload.floors, apartments: payload.apartments, buildingArea: payload.buildingArea, length: payload.length, width: payload.width, streetWidth: payload.streetWidth, direction: payload.direction, deedType: payload.deedType, propertyCondition: payload.propertyCondition, furnitureStatus: payload.furnitureStatus, hasGarage: payload.hasGarage === 'true', hasPool: payload.hasPool === 'true', hasElevator: payload.hasElevator === 'true', hasMaidRoom: payload.hasMaidRoom === 'true', hasRoof: payload.hasRoof === 'true', hasExternalAnnex: payload.hasExternalAnnex === 'true'
        };
        const requestPayload: Record<string, any> = { ...payload, metadata };
        ['rooms', 'bathrooms', 'propertyAge', 'livingRooms', 'kitchens', 'floors', 'apartments', 'buildingArea', 'length', 'width', 'streetWidth', 'direction', 'deedType', 'propertyCondition', 'furnitureStatus', 'hasGarage', 'hasPool', 'hasElevator', 'hasMaidRoom', 'hasRoof', 'hasExternalAnnex'].forEach(k => delete requestPayload[k]);

        if (editingId) {
          await api.put(`/service-requests/${editingId}`, requestPayload);
        } else {
          await api.post("/service-requests", { ...requestPayload, category: "other", serviceType: payload.serviceType || "استثمار عقاري" });
        }
      }

      toast.success(editingId ? "تم التعديل" : "تمت الإضافة");
      setEditingId(null);
      setForm(emptyForms[activeTab]);
      setShowForm(false);
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
      else if (activeTab === "investments" && ["rooms", "bathrooms", "propertyAge", "livingRooms", "kitchens", "floors", "apartments", "buildingArea", "length", "width", "streetWidth", "direction", "deedType", "propertyCondition", "furnitureStatus"].includes(key)) {
        next[key] = String(item.metadata?.[key] || "");
      }
      else if (activeTab === "investments" && ["hasGarage", "hasPool", "hasElevator", "hasMaidRoom", "hasRoof", "hasExternalAnnex"].includes(key)) {
        next[key] = item.metadata?.[key] ? "true" : "false";
      }
      else if (item[key] !== undefined && item[key] !== null) next[key] = String(item[key]);
    });
    if (activeTab === "files") {
      next.invoiceId = item.type === "invoice" ? item.id : "";
      next.documentUrl = item.url || "";
    }
    setEditingId(item.id);
    setForm(next);
    setShowForm(true);
  };

  const updateItemStatus = async (item: any, status: string) => {
    try {
      if (activeTab === "commissions") {
        await financialApi.updateCommission(item.id, {
          status,
          finalCommissionAmount: item.finalCommissionAmount,
          notes: item.notes,
        });
      } else if (activeTab === "investments") {
        await api.put(`/service-requests/${item.id}`, { status });
      } else if (activeTab === "invoices") {
        await financialApi.updateInvoice(item.id, { status });
      } else {
        return;
      }
      toast.success("تم تحديث الحالة");
      await loadData();
    } catch {
      toast.error("تعذر تحديث الحالة");
    }
  };

  const deleteRecord = async (item: any) => {
    const ok = await confirmDialog({
      title: "هل تريد حذف هذا السجل؟",
      description: "سيتم حذف السجل أو الملف من القسم الحالي.",
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
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

  const statCards = useMemo(() => {
    if (activeTab === "invoices") {
      return [
        ["إجمالي الفواتير", invoices.length, FileText],
        ["غير المدفوعة", invoices.filter((item) => item.status === "unpaid").length, FileText],
        ["المدفوعة", invoices.filter((item) => item.status === "paid").length, FileText],
        ["المسودة", invoices.filter((item) => item.status === "draft").length, FileText],
      ] as const;
    }
    if (activeTab === "commissions") {
      return [
        ["العقود", commissions.length, Percent],
        ["بانتظار المراجعة", commissions.filter((item) => ["pending", "under_review"].includes(item.status)).length, Percent],
        ["تم السداد", commissions.filter((item) => item.status === "paid").length, Percent],
        ["المرفوضة", commissions.filter((item) => item.status === "rejected").length, Percent],
      ] as const;
    }
    if (activeTab === "files") {
      return [
        ["إجمالي الملفات", files.length, CreditCard],
        ["ملفات الفواتير", files.filter((item) => item.type === "invoice").length, FileText],
        ["مرفقات العمولات", files.filter((item) => item.type === "commission_doc").length, Percent],
        ["روابط خارجية", files.filter((item) => item.url).length, ExternalLink],
      ] as const;
    }
    if (activeTab === "investments") {
      return [
        ["الإعلانات والطلبات", investments.length, TrendingUp],
        ["قيد الانتظار", investments.filter((item) => item.status === "pending").length, TrendingUp],
        ["مقبولة", investments.filter((item) => ["approved", "completed"].includes(item.status)).length, TrendingUp],
        ["معلقة/مرفوضة", investments.filter((item) => ["on_hold", "rejected", "cancelled"].includes(item.status)).length, TrendingUp],
      ] as const;
    }
    return [
      ["إجمالي الإيرادات", stats?.totalRevenue || 0, TrendingUp],
      ["الفواتير", invoices.length, FileText],
      ["العقود والعمولات", commissions.length, Percent],
      ["الاستثمارات", investments.length, TrendingUp],
    ] as const;
  }, [activeTab, commissions, files, investments, invoices, stats?.totalRevenue]);

  const userById = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const displayAmount = (item: any) => item.total || item.amount || item.finalCommissionAmount || item.commissionAmount || item.price || 0;
  const displayTitle = (item: any) => {
    if (activeTab === "commissions") {
      return item.commissionNumber || `${displayValue(item.type || "contract")} - ${item.propertyType || "وساطة"}`;
    }
    if (activeTab === "files") {
      return item.title || item.name || item.description || item.referenceId || item.id;
    }
    return item.description || item.serviceType || item.commissionNumber || item.name || displayValue(item.type) || item.referenceId || item.id;
  };
  const displayUser = (item: any) => {
    if (item.user) return userLabel(item.user);
    const ids = [item.userId, item.toUserId, item.fromUserId].filter(Boolean);
    const names = ids.map((id) => userById.get(id)).filter(Boolean).map(userLabel);
    if (names.length > 0) return names.join(" ← ");
    return item.clientName || ids[0] || "—";
  };
  const getStatusTone = (status: string) => {
    if (["paid", "approved", "completed"].includes(status)) return "bg-emerald-50 text-emerald-700";
    if (["pending", "under_review", "draft", "unpaid"].includes(status)) return "bg-amber-50 text-amber-700";
    if (["rejected", "cancelled", "failed"].includes(status)) return "bg-red-50 text-red-600";
    if (["on_hold"].includes(status)) return "bg-slate-100 text-slate-600";
    return "bg-slate-100 text-slate-600";
  };

  const openTab = (tab: WalletTab) => {
    setActiveTab(tab);
    router.push(`/admin/wallet?tab=${tab}`);
  };

  const beginCreate = () => {
    setEditingId(null);
    setForm(emptyForms[activeTab]);
    setShowForm(true);
  };

  const cancelForm = () => {
    setEditingId(null);
    setForm(emptyForms[activeTab]);
    setShowForm(false);
  };

  const showEditor = showForm || !!editingId;

  return (
    <div className="space-y-6 p-6 lg:p-8" dir="rtl">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-black text-white">
            <Wallet className="h-3.5 w-3.5" />
            {currentTabMeta.badge}
          </div>
          <h1 className="mt-3 text-3xl font-black text-slate-950">{currentTabMeta.title}</h1>
          <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">{currentTabMeta.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentTabMeta.allowInlineCreate && (
            <button onClick={beginCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black text-white">
              <Plus className="h-4 w-4" />
              {activeTab === "invoices" ? "إصدار فاتورة" : activeTab === "commissions" ? "إصدار عقد" : activeTab === "investments" ? "إعلان استثماري" : "إضافة عملية"}
            </button>
          )}
          <button onClick={loadData} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </button>
          {currentTabMeta.canExport && (
            <button onClick={exportTransactions} disabled={exporting} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 disabled:opacity-50">
              {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              تصدير
            </button>
          )}
        </div>
      </header>


      <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {statCards.map(([label, value, Icon]) => (
          <div key={label} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Icon className="h-5 w-5 text-slate-400" />
              <CheckCircle2 className="h-4 w-4 text-slate-200" />
            </div>
            <p className="mt-4 text-xs font-black text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{Number(value || 0).toLocaleString("ar-SA")}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? "تعديل السجل الحالي" : currentTabMeta.formTitle}
            </h2>
            {showEditor && (
              <button onClick={cancelForm} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-100 px-4 text-xs font-black text-slate-500">
                <X className="h-4 w-4" />
                إلغاء
              </button>
            )}
          </div>
          <p className="text-sm font-bold text-slate-500">{currentTabMeta.formDescription}</p>
        </div>
        {showEditor && currentTabMeta.allowInlineCreate ? (
          <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50/70 p-4 md:grid-cols-2 xl:grid-cols-4">
            {fields.map(([key, label, type]) => {
              const typeString = String(type);
              if (typeString === "user") {
                return (
                  <UserPicker
                    key={key}
                    label={label}
                    value={form[key] || ""}
                    users={users}
                    loading={loadingUsers}
                    onChange={(value) => setValue(key, value)}
                  />
                );
              }
              if (typeString.startsWith("select:")) {
                const options = typeString.replace("select:", "").split(",");
                return (
                  <label key={key} className="space-y-1.5">
                    <span className="text-xs font-black text-slate-400">{label}</span>
                    <select value={form[key] || ""} onChange={(event) => setValue(key, event.target.value)} className="h-11 w-full rounded-lg border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950">
                      {options.map((option) => <option key={option} value={option}>{displayValue(option)}</option>)}
                    </select>
                  </label>
                );
              }
              return (
                <label key={key} className="space-y-1.5">
                  <span className="text-xs font-black text-slate-400">{label}</span>
                  <input type={typeString} value={form[key] || ""} onChange={(event) => setValue(key, event.target.value)} className="h-11 w-full rounded-lg border border-slate-100 bg-white px-3 text-sm font-bold outline-none focus:border-slate-950" />
                </label>
              );
            })}
            
            {activeTab === 'investments' && (
              <div className="col-span-1 md:col-span-2 xl:col-span-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4 my-2 text-right">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4">
                  مواصفات العقار للاستثمار
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد الصالات</label>
                    <input type="number" value={form.livingRooms || ''} onChange={(e) => setValue('livingRooms', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد المطابخ</label>
                    <input type="number" value={form.kitchens || ''} onChange={(e) => setValue('kitchens', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد الأدوار</label>
                    <input type="number" value={form.floors || ''} onChange={(e) => setValue('floors', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد الشقق</label>
                    <input type="number" value={form.apartments || ''} onChange={(e) => setValue('apartments', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد الغرف</label>
                    <input type="number" value={form.rooms || ''} onChange={(e) => setValue('rooms', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عدد الحمامات</label>
                    <input type="number" value={form.bathrooms || ''} onChange={(e) => setValue('bathrooms', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عمر العقار</label>
                    <input type="text" value={form.propertyAge || ''} onChange={(e) => setValue('propertyAge', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="جديد" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">مساحة البناء</label>
                    <input type="number" value={form.buildingArea || ''} onChange={(e) => setValue('buildingArea', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">الطول</label>
                    <input type="number" value={form.length || ''} onChange={(e) => setValue('length', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">العرض</label>
                    <input type="number" value={form.width || ''} onChange={(e) => setValue('width', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">عرض الشارع</label>
                    <input type="number" value={form.streetWidth || ''} onChange={(e) => setValue('streetWidth', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors" placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">الواجهة</label>
                    <select value={form.direction || ''} onChange={(e) => setValue('direction', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">الكل</option>
                      <option value="شمالي">شمالي</option>
                      <option value="جنوبي">جنوبي</option>
                      <option value="شرقي">شرقي</option>
                      <option value="غربي">غربي</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">نوع الصك</label>
                    <select value={form.deedType || ''} onChange={(e) => setValue('deedType', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">الكل</option>
                      <option value="إلكتروني">إلكتروني</option>
                      <option value="ورقي">ورقي</option>
                      <option value="مشاع">مشاع</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">حالة العقار</label>
                    <select value={form.propertyCondition || ''} onChange={(e) => setValue('propertyCondition', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">الكل</option>
                      <option value="جديد">جديد</option>
                      <option value="ممتاز">ممتاز</option>
                      <option value="جيد">جيد</option>
                      <option value="يحتاج صيانة">يحتاج صيانة</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">التأثيث</label>
                    <select value={form.furnitureStatus || ''} onChange={(e) => setValue('furnitureStatus', e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none focus:border-slate-950 transition-colors">
                      <option value="">الكل</option>
                      <option value="مؤثث">مؤثث</option>
                      <option value="شبه مؤثث">شبه مؤثث</option>
                      <option value="غير مؤثث">غير مؤثث</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  {[
                    { key: 'hasGarage', label: 'كراج' },
                    { key: 'hasPool', label: 'مسبح' },
                    { key: 'hasElevator', label: 'مصعد' },
                    { key: 'hasMaidRoom', label: 'غرفة خادمة' },
                    { key: 'hasRoof', label: 'سطح' },
                    { key: 'hasExternalAnnex', label: 'ملحق خارجي' }
                  ].map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form[f.key] === 'true'}
                        onChange={(e) => setValue(f.key, e.target.checked ? 'true' : 'false')}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 border-slate-300"
                      />
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button onClick={saveRecord} disabled={saving} className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black text-white disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {activeTab === "investments" ? "حفظ الإعلان" : activeTab === "invoices" ? "إصدار الفاتورة" : activeTab === "commissions" ? "حفظ العقد" : "حفظ"}
            </button>
          </div>
        ) : activeTab === "files" ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
            افتح أي ملف من الجدول أو استخدم التعديل لتحديث الرابط أو المستندات المرتبطة.
          </div>
        ) : activeTab === "invoices" ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
            الفواتير هنا للعرض والتصفح داخل الإدارة المالية. استخدم البحث أو فلتر الحالة للوصول للفاتورة المطلوبة.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-bold text-slate-500">استخدم زر الإضافة أعلى الصفحة لإنشاء سجل جديد، أو عدل أي سجل من الجدول.</p>
            {currentTabMeta.allowInlineCreate && (
              <button onClick={beginCreate} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black text-white">
                <Plus className="h-4 w-4" />
                بدء الإضافة
              </button>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-50 p-5 md:flex-row md:items-center md:justify-between">
          <h3 className="font-black text-slate-950">{tabs.find(([value]) => value === activeTab)?.[1]}</h3>
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-100 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-slate-950">
              {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "كل الحالات" : displayValue(status)}</option>)}
            </select>
            <div className="relative w-full md:w-80">
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث..." className="h-10 w-full rounded-lg border border-slate-100 pr-11 pl-4 text-sm font-bold outline-none focus:border-slate-950" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">السجل</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">المستخدم</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">المبلغ/النوع</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">الحالة/التفاصيل</th>
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
                    {activeTab === "commissions" && (
                      <p className="mt-1 text-[11px] font-bold text-slate-500">
                        {item.owner?.name || "—"} ← مالك | {item.buyer?.name || "—"} ← مشتري
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-600">{displayUser(item)}</td>
                  <td className="px-6 py-4 text-xs font-black text-slate-700">
                    {activeTab === "files" ? (item.type === "invoice" ? "مستند فاتورة" : "مرفق عقد/عمولة") : Number(displayAmount(item)).toLocaleString("ar-SA")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2 text-xs font-black text-slate-700">
                      <span className={`inline-flex rounded-full px-2.5 py-1 ${getStatusTone(displayStatus(item))}`}>
                        {displayValue(displayStatus(item))}
                      </span>
                      {activeTab === "commissions" && (
                        <p className="text-[11px] font-bold text-slate-500">
                          {item.finalCommissionAmount ? `العمولة المستحقة: ${Number(item.finalCommissionAmount).toLocaleString("ar-SA")}` : "لم تحدد العمولة النهائية بعد"}
                        </p>
                      )}
                      {activeTab === "files" && item.createdAt && (
                        <p className="text-[11px] font-bold text-slate-500">{item.createdAt.slice(0, 10)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-100 px-3 text-[10px] font-black text-slate-600"><ExternalLink className="h-4 w-4" />فتح</a>}
                      {currentTabMeta.allowEdit && <button onClick={() => startEdit(item)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-100 px-3 text-[10px] font-black text-slate-600"><Edit2 className="h-4 w-4" />تعديل</button>}
                      {activeTab === "investments" && (
                        <>
                          <button onClick={() => updateItemStatus(item, "approved")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[10px] font-black text-emerald-700">قبول</button>
                          <button onClick={() => updateItemStatus(item, "on_hold")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-[10px] font-black text-slate-700">تعليق</button>
                          <button onClick={() => updateItemStatus(item, "rejected")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-[10px] font-black text-red-600">رفض</button>
                        </>
                      )}
                      {activeTab === "commissions" && (
                        <>
                          <button onClick={() => updateItemStatus(item, "under_review")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-50 px-3 text-[10px] font-black text-amber-700">مراجعة</button>
                          <button onClick={() => updateItemStatus(item, "paid")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[10px] font-black text-emerald-700">تم التسليم</button>
                        </>
                      )}
                      {activeTab === "invoices" && currentTabMeta.allowEdit && item.status !== "paid" && (
                        <button onClick={() => updateItemStatus(item, "paid")} className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-50 px-3 text-[10px] font-black text-emerald-700">تعليم كمدفوعة</button>
                      )}
                      {currentTabMeta.allowDelete && <button onClick={() => deleteRecord(item)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-50 px-3 text-[10px] font-black text-red-600"><Trash2 className="h-4 w-4" />حذف</button>}
                      {!item.url && !currentTabMeta.allowEdit && !currentTabMeta.allowDelete && (
                        <span className="inline-flex h-9 items-center rounded-lg bg-slate-50 px-3 text-[10px] font-black text-slate-400">اطلاع فقط</span>
                      )}
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
