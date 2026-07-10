"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Ban, BriefcaseBusiness, Calendar, CheckCircle, CreditCard, ExternalLink, FileText, FolderOpen, History, Layers3, LockKeyhole, MessageSquare, Percent, Plus, RefreshCw, Save, Shield, Trash2, TrendingUp, Upload, User as UserIcon, Wallet } from "lucide-react";
import { toast } from "sonner";
import api, { adminSubscriptionsApi, financialApi, usersApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const formatDate = (value: any, locale: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale);
};

export default function AdminUserDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { language } = useLanguage();
  const confirmDialog = useConfirmDialog();
  const isRtl = language === "ar";
  const locale = isRtl ? "ar-SA" : "en-US";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [departmentRequests, setDepartmentRequests] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [walletTab, setWalletTab] = useState<"invoices" | "commissions" | "files" | "investments">("invoices");
  const [invoiceForm, setInvoiceForm] = useState({ amount: "", description: "", status: "unpaid", documentUrl: "" });
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [commissionEdits, setCommissionEdits] = useState<Record<string, { status: string; finalCommissionAmount: string; notes: string; attachmentUrl: string }>>({});
  const [showSubModal, setShowSubModal] = useState(false);
  const [subModalConfig, setSubModalConfig] = useState({
    type: "yearly",
    customMonths: 12,
    notes: "",
  });
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadUser = async () => {
    setLoading(true);
    try {
      const [overviewRes, walletRes, invoicesRes, commissionsRes, filesRes, subscriptionRes] = await Promise.all([
        usersApi.getOverview(params.id),
        financialApi.getUserWallet(params.id).catch(() => ({ data: null })),
        financialApi.getUserInvoices(params.id).catch(() => ({ data: [] })),
        financialApi.getUserCommissions(params.id).catch(() => ({ data: [] })),
        financialApi.getUserFiles(params.id).catch(() => ({ data: [] })),
        api.get(`/subscriptions/status?userId=${params.id}`).catch(() => ({ data: null })),
      ]);

      const nextOverview = overviewRes.data || null;
      const nextServiceRequests = Array.isArray(nextOverview?.serviceRequests) ? nextOverview.serviceRequests : [];

      setOverview(nextOverview);
      setUser(nextOverview?.user || null);
      setWallet(walletRes.data || null);
      setInvoices(Array.isArray(invoicesRes.data) ? invoicesRes.data : []);
      setCommissions(Array.isArray(commissionsRes.data) ? commissionsRes.data : []);
      setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
      setBookings(Array.isArray(nextOverview?.bookings) ? nextOverview.bookings : []);
      setOffers(Array.isArray(nextOverview?.offers) ? nextOverview.offers : []);
      setOrders(Array.isArray(nextOverview?.orders) ? nextOverview.orders : []);
      setServiceRequests(nextServiceRequests);
      setDepartmentRequests(Array.isArray(nextOverview?.departmentRequests) ? nextOverview.departmentRequests : []);
      setChats(Array.isArray(nextOverview?.chats) ? nextOverview.chats : []);
      setActivities(Array.isArray(nextOverview?.activities) ? nextOverview.activities : []);
      setSubscriptionStatus(subscriptionRes.data || null);
      setInvestments(nextServiceRequests.filter((item: any) => {
        const ownerId = item.userId || item.user?.id;
        const text = `${item.category || ""} ${item.serviceType || ""} ${item.title || ""}`.toLowerCase();
        return ownerId === params.id && (text.includes("invest") || text.includes("استثمار"));
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const currentSubscription = subscriptionStatus?.subscription;

  const userCards = useMemo(
    () => [
      { label: isRtl ? "الحالة" : "Status", value: user?.isActive === false ? (isRtl ? "مقيد" : "Restricted") : (isRtl ? "فعال" : "Active"), icon: user?.isActive === false ? LockKeyhole : CheckCircle },
      { label: isRtl ? "التحقق" : "Verification", value: user?.isVerified ? (isRtl ? "موثق" : "Verified") : (isRtl ? "معلق" : "Pending"), icon: CheckCircle },
      { label: isRtl ? "الاشتراك" : "Subscription", value: subscriptionStatus?.active ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive"), icon: CreditCard },
      { label: isRtl ? "رصيد المحفظة" : "Wallet balance", value: Number(wallet?.balance || 0).toLocaleString(locale), icon: Wallet },
      { label: isRtl ? "العروض" : "Offers", value: Number(overview?.stats?.offers || 0).toLocaleString(locale), icon: Layers3 },
      { label: isRtl ? "الخدمات" : "Services", value: Number(overview?.stats?.serviceRequests || 0).toLocaleString(locale), icon: BriefcaseBusiness },
      { label: isRtl ? "المحادثات" : "Chats", value: Number(overview?.stats?.chats || 0).toLocaleString(locale), icon: MessageSquare },
      { label: isRtl ? "السجل" : "Logs", value: Number(overview?.stats?.activities || 0).toLocaleString(locale), icon: History },
    ],
    [isRtl, locale, overview?.stats?.activities, overview?.stats?.chats, overview?.stats?.offers, overview?.stats?.serviceRequests, subscriptionStatus?.active, user?.isActive, user?.isVerified, wallet?.balance],
  );

  const resetInvoiceForm = () => {
    setInvoiceForm({ amount: "", description: "", status: "unpaid", documentUrl: "" });
    setEditingInvoiceId(null);
  };

  const saveInvoice = async () => {
    const amount = Number(invoiceForm.amount);
    if (!amount || amount < 0) {
      toast.error(isRtl ? "أدخل مبلغ الفاتورة" : "Enter invoice amount");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        amount,
        description: invoiceForm.description,
        status: invoiceForm.status,
        documentUrl: invoiceForm.documentUrl || undefined,
      };
      if (editingInvoiceId) {
        await financialApi.updateInvoice(editingInvoiceId, payload);
        toast.success(isRtl ? "تم تعديل الفاتورة" : "Invoice updated");
      } else {
        await financialApi.createUserInvoice(params.id, payload);
        toast.success(isRtl ? "تمت إضافة الفاتورة" : "Invoice added");
      }
      resetInvoiceForm();
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر حفظ الفاتورة" : "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  const editInvoice = (invoice: any) => {
    setWalletTab("invoices");
    setEditingInvoiceId(invoice.id);
    setInvoiceForm({
      amount: String(invoice.amount || invoice.total || ""),
      description: invoice.description || "",
      status: invoice.status || "unpaid",
      documentUrl: invoice.documentUrl || "",
    });
  };

  const deleteInvoice = async (id: string) => {
    const ok = await confirmDialog({
      title: isRtl ? "حذف هذه الفاتورة؟" : "Delete this invoice?",
      confirmLabel: isRtl ? "حذف" : "Delete",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await financialApi.deleteInvoice(id);
      toast.success(isRtl ? "تم حذف الفاتورة" : "Invoice deleted");
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر حذف الفاتورة" : "Failed to delete invoice");
    } finally {
      setSaving(false);
    }
  };

  const getCommissionDraft = (commission: any) => commissionEdits[commission.id] || {
    status: commission.status || "draft",
    finalCommissionAmount: String(commission.finalCommissionAmount || commission.commissionAmount || ""),
    notes: commission.notes || "",
    attachmentUrl: "",
  };

  const updateCommissionDraft = (commission: any, key: string, value: string) => {
    setCommissionEdits((current) => ({
      ...current,
      [commission.id]: { ...getCommissionDraft(commission), [key]: value },
    }));
  };

  const saveCommission = async (commission: any) => {
    const draft = getCommissionDraft(commission);
    setSaving(true);
    try {
      await financialApi.updateCommission(commission.id, {
        status: draft.status,
        finalCommissionAmount: Number(draft.finalCommissionAmount || 0),
        notes: draft.notes,
        attachmentUrl: draft.attachmentUrl || undefined,
      });
      toast.success(isRtl ? "تم تحديث العمولة" : "Commission updated");
      setCommissionEdits((current) => {
        const next = { ...current };
        delete next[commission.id];
        return next;
      });
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر تحديث العمولة" : "Failed to update commission");
    } finally {
      setSaving(false);
    }
  };

  const deleteCommission = async (id: string) => {
    const ok = await confirmDialog({
      title: isRtl ? "حذف هذه العمولة؟" : "Delete this commission?",
      confirmLabel: isRtl ? "حذف" : "Delete",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await financialApi.deleteCommission(id);
      toast.success(isRtl ? "تم حذف العمولة" : "Commission deleted");
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر حذف العمولة" : "Failed to delete commission");
    } finally {
      setSaving(false);
    }
  };

  const removeFile = async (file: any) => {
    const ok = await confirmDialog({
      title: isRtl ? "إزالة هذا المستند من السجل؟" : "Remove this document from the record?",
      confirmLabel: isRtl ? "إزالة" : "Remove",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      if (file.type === "invoice") {
        await financialApi.updateInvoiceDocument(file.id, null);
      } else if (file.type === "commission_doc" && file.raw?.id && file.url) {
        await financialApi.removeCommissionAttachment(file.raw.id, file.url);
      } else {
        toast.error(isRtl ? "هذا الملف مولد ولا يمكن حذفه من هنا" : "Generated files cannot be removed here");
        return;
      }
      toast.success(isRtl ? "تمت إزالة المستند" : "Document removed");
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر إزالة المستند" : "Failed to remove document");
    } finally {
      setSaving(false);
    }
  };

  const uploadWalletDocument = async (file: File, options: { type: "invoice" | "commission"; title: string }) => {
    setUploadingDocument(true);
    try {
      const res = await financialApi.uploadUserDocument(params.id, file, {
        title: options.title,
        type: options.type === "invoice" ? "invoice" : "commission_agreement",
        folder: "admin-wallet",
      });
      const url = res.data?.fileUrl || res.data?.data?.fileUrl;
      if (!url) throw new Error("Missing uploaded file URL");
      toast.success(isRtl ? "تم رفع المستند" : "Document uploaded");
      return url;
    } catch {
      toast.error(isRtl ? "تعذر رفع المستند" : "Failed to upload document");
      return "";
    } finally {
      setUploadingDocument(false);
    }
  };

  const updateUserActive = async (isActive: boolean) => {
    if (!user) return;
    const ok = await confirmDialog({
      title: isActive
        ? (isRtl ? "تفعيل الحساب؟" : "Activate account?")
        : (isRtl ? "تقييد الحساب؟" : "Restrict account?"),
      description: isActive
        ? (isRtl ? "سيعود المستخدم إلى وضعه الطبيعي وسيتمكن من الدخول." : "The user will regain access to the platform.")
        : (isRtl ? "سيتم تقييد دخول المستخدم إلى المنصة." : "The user will be restricted from accessing the platform."),
      confirmLabel: isActive ? (isRtl ? "تفعيل" : "Activate") : (isRtl ? "تقييد" : "Restrict"),
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: !isActive,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.put(`/user/${user.id}`, { isActive });
      toast.success(isActive ? (isRtl ? "تم تفعيل الحساب" : "Account activated") : (isRtl ? "تم تقييد الحساب" : "Account restricted"));
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر تحديث الحساب" : "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!user) return;
    const ok = await confirmDialog({
      title: isRtl ? "هل تريد حذف هذا الحساب؟ الحذف الحالي نهائي في الخادم." : "Delete this account? Current backend delete is permanent.",
      confirmLabel: isRtl ? "حذف الحساب" : "Delete account",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
      destructive: true,
    });
    if (!ok) return;
    setSaving(true);
    try {
      await api.delete(`/user/${user.id}`);
      toast.success(isRtl ? "تم حذف الحساب" : "Account deleted");
      router.push("/admin/users");
    } catch {
      toast.error(isRtl ? "تعذر حذف الحساب" : "Failed to delete account");
    } finally {
      setSaving(false);
    }
  };

  const openSubscriptionModal = () => {
    setSubModalConfig({
      type: currentSubscription?.noExpiry ? "unlimited" : "yearly",
      customMonths: 12,
      notes: "",
    });
    setShowSubModal(true);
  };

  const createFreeSubscription = async () => {
    openSubscriptionModal();
  };

  const extendSubscription = async () => {
    openSubscriptionModal();
  };

  const handleSaveSubscription = async () => {
    if (!user) return;
    setSaving(true);
    const { type, customMonths, notes } = subModalConfig;
    
    try {
      if (!currentSubscription?.id) {
        // Create new subscription
        await adminSubscriptionsApi.create({
          userId: user.id,
          subscriptionType: type === "unlimited" ? "مخصص" : (type === "yearly" ? "سنوي" : (type === "monthly" ? "شهري" : "مخصص")),
          amount: 0,
          startDate: new Date().toISOString().split("T")[0],
          paymentMethod: "نقدي",
          status: "نشط",
          noExpiry: type === "unlimited",
          customPeriodMonths: type === "custom" ? customMonths : (type === "unlimited" ? 12 : undefined),
          notes: notes || (isRtl ? "تفعيل اشتراك من لوحة الإدارة" : "Subscription activated from admin panel"),
        });
        toast.success(isRtl ? "تم تفعيل الاشتراك بنجاح" : "Subscription activated successfully");
      } else {
        // Extend / Update existing subscription
        if (type === "unlimited") {
          await adminSubscriptionsApi.update(currentSubscription.id, {
            status: "نشط",
            noExpiry: true,
            notes: notes || (isRtl ? "تعديل الاشتراك لغير محدود" : "Subscription updated to unlimited"),
          });
        } else {
          // Calculate base date to extend from
          const base = currentSubscription.endDate ? new Date(currentSubscription.endDate) : new Date();
          // If the subscription is already expired, extend from today
          const startDate = base < new Date() ? new Date() : base;
          const newEndDate = new Date(startDate);
          
          if (type === "yearly") {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
          } else if (type === "monthly") {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          } else if (type === "custom") {
            newEndDate.setMonth(newEndDate.getMonth() + customMonths);
          }
          
          await adminSubscriptionsApi.update(currentSubscription.id, {
            endDate: newEndDate.toISOString().split("T")[0],
            status: "نشط",
            noExpiry: false,
            notes: notes || (isRtl ? "تمديد الاشتراك من لوحة الإدارة" : "Subscription extended from admin panel"),
          });
        }
        toast.success(isRtl ? "تم تحديث الاشتراك بنجاح" : "Subscription updated successfully");
      }
      setShowSubModal(false);
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر حفظ الاشتراك" : "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscription?.id) return;
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!currentSubscription?.id) return;
    setSaving(true);
    try {
      await adminSubscriptionsApi.cancel(currentSubscription.id, cancelReason || "إلغاء من صفحة المستخدم");
      toast.success(isRtl ? "تم إلغاء الاشتراك" : "Subscription cancelled");
      setShowCancelModal(false);
      await loadUser();
    } catch {
      toast.error(isRtl ? "تعذر إلغاء الاشتراك" : "Failed to cancel subscription");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 rounded-xl bg-muted" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 rounded-2xl bg-muted" />)}
        </div>
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border bg-card p-10 text-center" dir={isRtl ? "rtl" : "ltr"}>
        <p className="font-black text-slate-950">{isRtl ? "المستخدم غير موجود" : "User not found"}</p>
        <Link href="/admin/users" className="mt-4 inline-flex text-sm font-black text-slate-950 underline">
          {isRtl ? "العودة للمستخدمين" : "Back to users"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <Link href="/admin/users" className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-950">
            <ArrowRight className="h-4 w-4" />
            {isRtl ? "العودة للمستخدمين" : "Back to users"}
          </Link>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-950">{user.firstName} {user.lastName}</h1>
          <p className="text-xs font-bold text-slate-400">{user.email || user.phone || user.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => updateUserActive(user.isActive === false)}
            className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest disabled:opacity-60 ${
              user.isActive === false
                ? "bg-slate-950 text-white"
                : "border border bg-card text-slate-700"
            }`}
          >
            {user.isActive === false ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
            {user.isActive === false ? (isRtl ? "تفعيل الحساب" : "Activate") : (isRtl ? "تقييد الحساب" : "Restrict")}
          </button>
          <button type="button" disabled={saving} onClick={deleteUser} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-50 px-4 text-[10px] font-black uppercase tracking-widest text-red-600">
            <Trash2 className="h-4 w-4" />
            {isRtl ? "حذف" : "Delete"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {userCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border bg-card p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-slate-950">
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
            <p className="mt-1 text-xl font-black text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
            <UserIcon className="h-5 w-5" />
            {isRtl ? "بيانات الحساب" : "Account details"}
          </h2>
          <div className="space-y-3 text-sm">
            {[
              [isRtl ? "الاسم" : "Name", `${user.firstName || ""} ${user.lastName || ""}`],
              [isRtl ? "البريد" : "Email", user.email || "—"],
              [isRtl ? "الجوال" : "Phone", user.phone || "—"],
              [isRtl ? "الدور" : "Role", user.role || "—"],
              [isRtl ? "الإدارات" : "Departments", Array.isArray(user.departments) && user.departments.length ? user.departments.join(" , ") : "—"],
              [isRtl ? "تاريخ الإنشاء" : "Created", formatDate(user.createAt, locale)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border pb-3">
                <span className="font-black text-slate-400">{label}</span>
                <span className="font-bold text-slate-950">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
            <CreditCard className="h-5 w-5" />
            {isRtl ? "الاشتراك" : "Subscription"}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border pb-3">
              <span className="font-black text-slate-400">{isRtl ? "الحالة" : "Status"}</span>
              <span className="font-bold text-slate-950">{subscriptionStatus?.active ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}</span>
            </div>
            <div className="flex items-center justify-between border-b border pb-3">
              <span className="font-black text-slate-400">{isRtl ? "ينتهي في" : "Ends at"}</span>
              <span className="font-bold text-slate-950">{currentSubscription?.noExpiry ? (isRtl ? "غير محدود" : "No expiry") : formatDate(currentSubscription?.endDate, locale)}</span>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button disabled={saving} onClick={extendSubscription} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white">
              <RefreshCw className="h-4 w-4" />
              {isRtl ? "تمديد" : "Extend"}
            </button>
            <button disabled={saving} onClick={createFreeSubscription} className="inline-flex h-10 items-center gap-2 rounded-xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-slate-700">
              <CheckCircle className="h-4 w-4" />
              {isRtl ? "اشتراك مجاني" : "Free sub"}
            </button>
            <button disabled={saving || !currentSubscription?.id} onClick={cancelSubscription} className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-50 px-4 text-[10px] font-black uppercase tracking-widest text-amber-700 disabled:opacity-50">
              <Ban className="h-4 w-4" />
              {isRtl ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-slate-950">
            <Shield className="h-5 w-5" />
            {isRtl ? "نطاق العمل" : "Scope"}
          </h2>
          <div className="space-y-3 text-sm">
            {[
              [isRtl ? "العروض المنشأة" : "Created offers", overview?.stats?.offers || 0],
              [isRtl ? "طلبات الخدمة" : "Service requests", overview?.stats?.serviceRequests || 0],
              [isRtl ? "طلبات ضمن الإدارة" : "Department requests", overview?.stats?.departmentRequests || 0],
              [isRtl ? "المحادثات" : "Chats", overview?.stats?.chats || 0],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between border-b border pb-3">
                <span className="font-black text-slate-400">{label}</span>
                <span className="font-black text-slate-950">{Number(value || 0).toLocaleString(locale)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-1 md:grid-cols-2">
        <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <Layers3 className="h-5 w-5" />
              {isRtl ? "العروض والطلبات" : "Offers & requests"}
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{isRtl ? "العروض المنشأة" : "Created offers"}</p>
              <div className="divide-y divide-slate-100">
                {offers.slice(0, 6).map((offer) => (
                  <div key={offer.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm">
                    <div>
                      <p className="font-black text-slate-900">{offer.propertyType || offer.mainCategory || offer.id}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{offer.city || "—"} · {offer.status || "draft"}</p>
                    </div>
                    <Link href={`/offers/${offer.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <ExternalLink className="h-4 w-4" />
                      {isRtl ? "فتح" : "Open"}
                    </Link>
                  </div>
                ))}
                {!offers.length && <div className="py-8 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد عروض" : "No offers"}</div>}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{isRtl ? "طلبات الخدمة" : "Service requests"}</p>
              <div className="divide-y divide-slate-100">
                {serviceRequests.slice(0, 6).map((request) => (
                  <div key={request.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm">
                    <div>
                      <p className="font-black text-slate-900">{request.serviceType || request.category || request.id}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{request.status || "pending"} · {formatDate(request.createdAt, locale)}</p>
                    </div>
                    <Link href={`/admin/service-requests?requestId=${request.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <ExternalLink className="h-4 w-4" />
                      {isRtl ? "إدارة" : "Manage"}
                    </Link>
                  </div>
                ))}
                {!serviceRequests.length && <div className="py-8 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد طلبات خدمة" : "No service requests"}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <BriefcaseBusiness className="h-5 w-5" />
              {isRtl ? "عمل الإدارة والسجل" : "Department work & logs"}
            </h2>
          </div>
          <div className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{isRtl ? "طلبات مرتبطة بإدارته" : "Department requests"}</p>
              <div className="divide-y divide-slate-100">
                {departmentRequests.slice(0, 6).map((request) => (
                  <div key={request.id} className="grid grid-cols-[1fr_auto] items-center gap-3 py-3 text-sm">
                    <div>
                      <p className="font-black text-slate-900">{request.serviceType || request.category || request.id}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{request.targetDepartment || "—"} · {request.status || "pending"}</p>
                    </div>
                    <Link href={`/admin/service-requests?requestId=${request.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-700">
                      <ExternalLink className="h-4 w-4" />
                      {isRtl ? "فتح" : "Open"}
                    </Link>
                  </div>
                ))}
                {!departmentRequests.length && <div className="py-8 text-center text-xs font-black text-slate-300">{isRtl ? "لا يوجد عمل إداري ظاهر" : "No department items"}</div>}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">{isRtl ? "السجل والنشاط" : "Activity log"}</p>
              <div className="divide-y divide-slate-100">
                {activities.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="py-3 text-sm">
                    <p className="font-black text-slate-900">{activity.title || activity.type || activity.id}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{activity.description || formatDate(activity.createdAt, locale)}</p>
                  </div>
                ))}
                {!activities.length && <div className="py-8 text-center text-xs font-black text-slate-300">{isRtl ? "لا يوجد سجل" : "No activity logs"}</div>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
          <MessageSquare className="h-5 w-5" />
          {isRtl ? "محادثات المستخدم" : "User chats"}
        </h2>
        <div className="space-y-4">
          {chats.slice(0, 8).map((chat) => (
            <div key={chat.id} className="rounded-2xl border border p-4">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-black text-slate-900">{chat.name || chat.id}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {Array.isArray(chat.participants) ? chat.participants.map((participant: any) => `${participant.firstName || ""} ${participant.lastName || ""}`.trim() || participant.email).join("، ") : "—"}
                  </p>
                </div>
                <span className="text-xs font-black text-slate-400">{formatDate(chat.createdAt, locale)}</span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {(chat.recentMessages || []).slice(0, 3).map((message: any) => (
                  <div key={message.id} className="py-2 text-sm">
                    <p className="font-black text-slate-700">{message.sender?.firstName || (isRtl ? "مستخدم" : "User")}</p>
                    <p className="mt-1 font-bold text-slate-500">{message.content}</p>
                  </div>
                ))}
                {!chat.recentMessages?.length && <div className="py-3 text-xs font-black text-slate-300">{isRtl ? "لا توجد رسائل بعد" : "No messages yet"}</div>}
              </div>
            </div>
          ))}
          {!chats.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد محادثات" : "No chats"}</div>}
        </div>
      </section>

      <section className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <Wallet className="h-5 w-5" />
              {isRtl ? "محفظة العميل" : "Client wallet"}
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-400">
              {isRtl ? "تحكم إداري في فواتيره وعمولاته ومستنداته واستثماراته" : "Admin controls for invoices, commissions, documents, and investments"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ["invoices", isRtl ? "الفواتير" : "Invoices", FileText],
              ["commissions", isRtl ? "العمولات" : "Commissions", Percent],
              ["files", isRtl ? "الملفات والمستندات" : "Files", FolderOpen],
              ["investments", isRtl ? "الاستثمارات" : "Investments", TrendingUp],
            ].map(([value, label, Icon]: any) => (
              <button
                key={value}
                onClick={() => setWalletTab(value)}
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest ${walletTab === value ? "bg-slate-950 text-white" : "border border bg-card text-slate-600"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {walletTab === "invoices" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 rounded-2xl bg-muted p-4 lg:grid-cols-5">
              <input
                type="number"
                min="0"
                value={invoiceForm.amount}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, amount: event.target.value }))}
                placeholder={isRtl ? "المبلغ" : "Amount"}
                className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none"
              />
              <input
                value={invoiceForm.description}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, description: event.target.value }))}
                placeholder={isRtl ? "وصف الفاتورة" : "Description"}
                className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none lg:col-span-2"
              />
              <select
                value={invoiceForm.status}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, status: event.target.value }))}
                className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none"
              >
                <option value="draft">{isRtl ? "مسودة" : "Draft"}</option>
                <option value="unpaid">{isRtl ? "غير مدفوعة" : "Unpaid"}</option>
                <option value="paid">{isRtl ? "مدفوعة" : "Paid"}</option>
                <option value="cancelled">{isRtl ? "ملغاة" : "Cancelled"}</option>
              </select>
              <button disabled={saving} onClick={saveInvoice} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-widest text-white">
                {editingInvoiceId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingInvoiceId ? (isRtl ? "حفظ" : "Save") : (isRtl ? "إضافة" : "Add")}
              </button>
              <input
                value={invoiceForm.documentUrl}
                onChange={(event) => setInvoiceForm((current) => ({ ...current, documentUrl: event.target.value }))}
                placeholder={isRtl ? "رابط مستند الفاتورة" : "Invoice document URL"}
                className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none lg:col-span-3"
              />
              <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                <Upload className="h-4 w-4" />
                {uploadingDocument ? (isRtl ? "جاري الرفع" : "Uploading") : (isRtl ? "رفع ملف" : "Upload")}
                <input
                  type="file"
                  className="hidden"
                  disabled={uploadingDocument}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    const url = await uploadWalletDocument(file, { type: "invoice", title: invoiceForm.description || file.name });
                    if (url) setInvoiceForm((current) => ({ ...current, documentUrl: url }));
                    event.target.value = "";
                  }}
                />
              </label>
              {editingInvoiceId && (
                <button onClick={resetInvoiceForm} className="h-11 rounded-xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {isRtl ? "إلغاء التعديل" : "Cancel edit"}
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {invoices.map((invoice, index) => (
                <div key={invoice.id || index} className="grid grid-cols-1 gap-3 py-4 text-sm lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
                  <div>
                    <p className="font-black text-slate-800">{invoice.description || invoice.id}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(invoice.createdAt, locale)} · {invoice.status || "unpaid"}</p>
                  </div>
                  <span className="font-black text-slate-950">{Number(invoice.total || invoice.amount || 0).toLocaleString(locale)}</span>
                  <button disabled={saving} onClick={() => editInvoice(invoice)} className="h-9 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    {isRtl ? "تعديل" : "Edit"}
                  </button>
                  <button disabled={saving} onClick={() => deleteInvoice(invoice.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600">
                    <Trash2 className="h-4 w-4" />
                    {isRtl ? "حذف" : "Delete"}
                  </button>
                </div>
              ))}
              {!invoices.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد فواتير" : "No invoices"}</div>}
            </div>
          </div>
        )}

        {walletTab === "commissions" && (
          <div className="divide-y divide-slate-100">
            {commissions.map((commission) => {
              const draft = getCommissionDraft(commission);
              return (
                <div key={commission.id} className="space-y-3 py-4">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-black text-slate-800">{commission.commissionNumber || commission.id}</p>
                      <p className="mt-1 text-xs font-bold text-slate-400">{commission.propertyType || "—"} · {commission.city || "—"}</p>
                    </div>
                    <p className="font-black text-slate-950">{Number(commission.finalCommissionAmount || commission.commissionAmount || 0).toLocaleString(locale)}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                    <select value={draft.status} onChange={(event) => updateCommissionDraft(commission, "status", event.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none">
                      {["draft", "pending", "under_review", "approved", "rejected", "paid", "cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <input type="number" min="0" value={draft.finalCommissionAmount} onChange={(event) => updateCommissionDraft(commission, "finalCommissionAmount", event.target.value)} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none" />
                    <input value={draft.notes} onChange={(event) => updateCommissionDraft(commission, "notes", event.target.value)} placeholder={isRtl ? "ملاحظات" : "Notes"} className="h-11 rounded-xl border border bg-card px-3 text-sm font-bold outline-none" />
                    <div className="flex gap-2">
                      <input value={draft.attachmentUrl} onChange={(event) => updateCommissionDraft(commission, "attachmentUrl", event.target.value)} placeholder={isRtl ? "رابط مستند" : "Attachment URL"} className="h-11 min-w-0 flex-1 rounded-xl border border bg-card px-3 text-sm font-bold outline-none" />
                      <label className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border bg-card px-3 text-slate-600">
                        <Upload className="h-4 w-4" />
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploadingDocument}
                          onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            const url = await uploadWalletDocument(file, { type: "commission", title: commission.commissionNumber || file.name });
                            if (url) updateCommissionDraft(commission, "attachmentUrl", url);
                            event.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button disabled={saving} onClick={() => saveCommission(commission)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-[10px] font-black uppercase tracking-widest text-white">
                        <Save className="h-4 w-4" />
                        {isRtl ? "حفظ" : "Save"}
                      </button>
                      <button disabled={saving} onClick={() => deleteCommission(commission.id)} className="inline-flex h-11 items-center justify-center rounded-xl bg-red-50 px-3 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {!commissions.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد عمولات" : "No commissions"}</div>}
          </div>
        )}

        {walletTab === "files" && (
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div key={file.id} className="grid grid-cols-1 gap-3 py-4 text-sm lg:grid-cols-[1fr_auto_auto] lg:items-center">
                <div>
                  <p className="font-black text-slate-800">{file.name || file.id}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{file.type} · {formatDate(file.date, locale)}</p>
                </div>
                {file.url && (
                  <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <ExternalLink className="h-4 w-4" />
                    {isRtl ? "فتح" : "Open"}
                  </a>
                )}
                <button disabled={saving} onClick={() => removeFile(file)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-[10px] font-black uppercase tracking-widest text-red-600">
                  <Trash2 className="h-4 w-4" />
                  {isRtl ? "إزالة" : "Remove"}
                </button>
              </div>
            ))}
            {!files.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد مستندات" : "No documents"}</div>}
          </div>
        )}

        {walletTab === "investments" && (
          <div className="divide-y divide-slate-100">
            {investments.map((investment) => (
              <div key={investment.id} className="grid grid-cols-1 gap-3 py-4 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-black text-slate-800">{investment.serviceType || investment.category || investment.id}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{investment.status || "—"} · {formatDate(investment.createdAt, locale)}</p>
                </div>
                <Link href={`/admin/service-requests?requestId=${investment.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border px-3 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  <ExternalLink className="h-4 w-4" />
                  {isRtl ? "إدارة الطلب" : "Manage"}
                </Link>
              </div>
            ))}
            {!investments.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد استثمارات" : "No investments"}</div>}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border bg-card p-3 sm:p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-950">
          <Calendar className="h-5 w-5" />
          {isRtl ? "الطلبات والحجوزات" : "Requests & bookings"}
        </h2>
        <div className="divide-y divide-slate-100">
          {orders.slice(0, 6).map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <span className="font-bold text-slate-700">{order.propertyType || order.orderType || order.id}</span>
                <p className="mt-1 text-xs font-black text-slate-400">{order.status || "pending"} · {order.city || "—"}</p>
              </div>
              <span className="font-black text-slate-950">{formatDate(order.createdAt, locale)}</span>
            </div>
          ))}
          {bookings.slice(0, 10).map((booking, index) => (
            <div key={booking.id || index} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div>
                <span className="font-bold text-slate-700">{booking.type || booking.status || booking.id}</span>
                <p className="mt-1 text-xs font-black text-slate-400">{booking.offer?.propertyType || booking.offerId || "—"}</p>
              </div>
              <span className="font-black text-slate-950">{formatDate(booking.createdAt || booking.date, locale)}</span>
            </div>
          ))}
          {!orders.length && !bookings.length && <div className="py-10 text-center text-xs font-black text-slate-300">{isRtl ? "لا توجد طلبات" : "No requests"}</div>}
        </div>
      </section>

      {/* Subscription Duration Selector Modal */}
      <Dialog open={showSubModal} onOpenChange={setShowSubModal}>
        <DialogContent className="w-[95vw] sm:max-w-md p-3 sm:p-6 rounded-3xl" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">
              {isRtl ? "إدارة الاشتراك" : "Manage Subscription"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-xs mt-1">
              {isRtl ? "تحديد مدة تفعيل الاشتراك أو تمديده للمستخدم" : "Specify the duration to activate or extend subscription for the user"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            {/* Subscription Type Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isRtl ? "نوع المدة" : "Duration Type"}
              </label>
              <select
                value={subModalConfig.type}
                onChange={(e) => setSubModalConfig(prev => ({ ...prev, type: e.target.value }))}
                className="w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all cursor-pointer"
              >
                <option value="yearly">{isRtl ? "سنوي (1 سنة)" : "Yearly (1 Year)"}</option>
                <option value="monthly">{isRtl ? "شهري (1 شهر)" : "Monthly (1 Month)"}</option>
                <option value="custom">{isRtl ? "مخصص بالشهور" : "Custom in Months"}</option>
                <option value="unlimited">{isRtl ? "غير محدود (بدون انتهاء)" : "Unlimited (No expiry)"}</option>
              </select>
            </div>

            {/* Custom Period Input */}
            {subModalConfig.type === "custom" && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {isRtl ? "عدد الأشهر" : "Number of Months"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={subModalConfig.customMonths}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setSubModalConfig(prev => ({ ...prev, customMonths: Math.max(1, val) }));
                  }}
                  className="w-full h-11 bg-muted border border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isRtl ? "ملاحظات" : "Notes"}
              </label>
              <textarea
                value={subModalConfig.notes}
                onChange={(e) => setSubModalConfig(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isRtl ? "سبب التفعيل/التمديد..." : "Reason for activation/extension..."}
                className="w-full h-20 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSubModal(false)}
              className="h-11 rounded-2xl font-bold border px-5"
            >
              {isRtl ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleSaveSubscription}
              disabled={saving}
              className="h-11 rounded-2xl font-black bg-slate-950 text-white hover:bg-black px-6"
            >
              {saving ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "حفظ التغييرات" : "Save Changes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Cancellation Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="w-[95vw] sm:max-w-md p-3 sm:p-6 rounded-3xl" dir={isRtl ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">
              {isRtl ? "إلغاء الاشتراك" : "Cancel Subscription"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-xs mt-1">
              {isRtl
                ? "هل أنت متأكد من إلغاء هذا الاشتراك؟ لن يتمكن المستخدم من استخدام الميزات المدفوعة."
                : "Are you sure you want to cancel this subscription? The user will lose access to paid features."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                {isRtl ? "سبب الإلغاء:" : "Cancellation Reason:"}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isRtl ? "اكتب سبب إلغاء الاشتراك هنا..." : "Type the cancellation reason here..."}
                className="w-full h-24 bg-muted border border focus:border-slate-950 rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              className="h-11 rounded-2xl font-bold border px-5"
            >
              {isRtl ? "تراجع" : "Go Back"}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmCancel}
              disabled={saving}
              className="h-11 rounded-2xl font-black bg-red-600 text-white hover:bg-red-700 px-6"
            >
              {saving ? (isRtl ? "جاري الإلغاء..." : "Cancelling...") : (isRtl ? "إلغاء الاشتراك" : "Cancel Subscription")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
