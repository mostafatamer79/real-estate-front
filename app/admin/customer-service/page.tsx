"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import {
  customerServiceFaqApi,
  customerServiceFeedbackApi,
  customerServiceFaqCategoryApi,
  type CustomerServiceFaq,
  type CustomerServiceFeedback,
  type CustomerServiceFaqCategory,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { CheckCircle2, Plus, RefreshCcw, Trash2, Pencil, FolderPlus, MessageCircleQuestion, ChevronUp, ChevronDown, GripVertical, Send, Mail, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AdminOpinionsPage from "../opinions/page";

type TabKey = "faqs" | "feedback" | "opinions" | "chat";

export default function AdminCustomerServicePage() {
  const { language, t } = useLanguage();
  const { settings } = useSettings();
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

  const [tab, setTab] = useState<TabKey>("faqs");

  const [categories, setCategories] = useState<CustomerServiceFaqCategory[]>([]);
  const [faqs, setFaqs] = useState<CustomerServiceFaq[]>([]);
  const [feedback, setFeedback] = useState<CustomerServiceFeedback[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingFeedbackId, setReplyingFeedbackId] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Category form
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ nameAr: "", nameEn: "", sortOrder: 0 });
  const [savingCategory, setSavingCategory] = useState(false);

  // FAQ form
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [faqForm, setFaqForm] = useState({
    questionAr: "",
    answerAr: "",
    questionEn: "",
    answerEn: "",
    sortOrder: 0,
  });
  const [savingFaq, setSavingFaq] = useState(false);

  // Confirm dialogs state
  const [confirm, setConfirm] = useState<
    | { type: "deleteCategory"; id: string; title: string; desc: string }
    | { type: "deleteFaq"; id: string; title: string; desc: string }
    | { type: "deleteFeedback"; id: string; title: string; desc: string }
    | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await customerServiceFaqCategoryApi.list();
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data);
      if (!selectedCategoryId && data.length > 0) setSelectedCategoryId(data[0].id);
      if (selectedCategoryId && !data.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(data[0]?.id ?? null);
      }
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadFaqs = async () => {
    setLoadingFaqs(true);
    try {
      const res = await customerServiceFaqApi.list();
      setFaqs(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const loadFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await customerServiceFeedbackApi.list();
      setFeedback(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoadingFeedback(false);
    }
  };

  const moveInArray = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const persistCategoryOrder = async (next: CustomerServiceFaqCategory[]) => {
    setCategories(next);
    try {
      const ids = next.map((c) => c.id);
      const res = await customerServiceFaqCategoryApi.reorder(ids);
      setCategories(Array.isArray(res.data) ? res.data : next);
    } catch {
      await loadCategories();
    }
  };

  const persistFaqOrder = async (categoryId: string, nextFaqsForCategory: CustomerServiceFaq[]) => {
    // Update global faqs state with next ordering for this category
    setFaqs((prev) => {
      const other = prev.filter((f) => f.categoryId !== categoryId);
      return [...other, ...nextFaqsForCategory];
    });
    try {
      const ids = nextFaqsForCategory.map((f) => f.id);
      const res = await customerServiceFaqApi.reorder(categoryId, ids);
      const data = Array.isArray(res.data) ? res.data : [];
      if (data.length > 0) setFaqs(data);
      else await loadFaqs();
    } catch {
      await loadFaqs();
    }
  };

  useEffect(() => {
    loadCategories();
    loadFaqs();
    loadFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCategoryForm = () => {
    setEditingCategoryId(null);
    setCategoryForm({ nameAr: "", nameEn: "", sortOrder: 0 });
  };

  const resetFaqForm = () => {
    setEditingFaqId(null);
    setFaqForm({ 
      questionAr: "", 
      answerAr: "", 
      questionEn: "", 
      answerEn: "", 
      sortOrder: 0,
    });
  };

  const nextSortOrder = (items: Array<{ sortOrder?: number | null }>) => {
    if (!items || items.length === 0) return 0;
    const max = Math.max(...items.map((x) => Number(x.sortOrder ?? 0)));
    return Number.isFinite(max) ? max + 1 : items.length;
  };

  const nextFaqSortOrderForCategory = (categoryId: string) => {
    const list = faqs.filter((f) => f.categoryId === categoryId);
    return nextSortOrder(list);
  };

  const startEditCategory = (cat: CustomerServiceFaqCategory) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({
      nameAr: cat.nameAr,
      nameEn: cat.nameEn,
      sortOrder: cat.sortOrder ?? 0,
    });
  };

  const submitCategory = async () => {
    setSavingCategory(true);
    try {
      if (editingCategoryId) {
        await customerServiceFaqCategoryApi.update(editingCategoryId, categoryForm);
      } else {
        const res = await customerServiceFaqCategoryApi.create({ ...categoryForm, sortOrder: nextSortOrder(categories) });
        setSelectedCategoryId(res.data?.id ?? selectedCategoryId);
      }
      await loadCategories();
      resetCategoryForm();
    } finally {
      setSavingCategory(false);
    }
  };

  const startAddFaqForCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    resetFaqForm();
  };

  const startEditFaq = (faq: CustomerServiceFaq) => {
    if (faq.categoryId) setSelectedCategoryId(faq.categoryId);
    setEditingFaqId(faq.id);
    setFaqForm({
      questionAr: faq.questionAr,
      answerAr: faq.answerAr,
      questionEn: faq.questionEn,
      answerEn: faq.answerEn,
      sortOrder: faq.sortOrder ?? 0,
    });
  };

  const submitFaq = async () => {
    if (!selectedCategoryId) return;
    setSavingFaq(true);
    try {
      const payload = {
        ...faqForm,
        categoryId: selectedCategoryId,
        color: null,
        fontSize: null,
      };
      if (editingFaqId) {
        await customerServiceFaqApi.update(editingFaqId, payload as any);
      } else {
        await customerServiceFaqApi.create({
          ...payload,
          sortOrder: nextFaqSortOrderForCategory(selectedCategoryId),
          // backend will fill categoryAr/categoryEn from categoryId
          categoryAr: "",
          categoryEn: "",
        } as any);
      }
      await loadFaqs();
      resetFaqForm();
    } finally {
      setSavingFaq(false);
    }
  };

  const faqsByCategory = useMemo(() => {
    const map = new Map<string, CustomerServiceFaq[]>();
    for (const f of faqs) {
      const key = f.categoryId ?? "uncategorized";
      const arr = map.get(key) || [];
      arr.push(f);
      map.set(key, arr);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      map.set(k, arr);
    }
    return map;
  }, [faqs]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || null;
  const selectedFaqs = selectedCategoryId ? faqsByCategory.get(selectedCategoryId) || [] : [];

  // DnD state (categories + faqs)
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [dragFaqId, setDragFaqId] = useState<string | null>(null);

  const updateFeedbackStatus = async (id: string, status: "new" | "resolved") => {
    await customerServiceFeedbackApi.updateStatus(id, status);
    await loadFeedback();
  };

  const submitAdminReply = async (id: string) => {
    const reply = (replyDrafts[id] || "").trim();
    if (!reply) return;
    setReplyingFeedbackId(id);
    try {
      await customerServiceFeedbackApi.replyAsAdmin(id, reply);
      setReplyDrafts((current) => ({ ...current, [id]: "" }));
      await loadFeedback();
    } finally {
      setReplyingFeedbackId(null);
    }
  };

  const statusLabel = (status: CustomerServiceFeedback["status"]) => {
    if (status === "resolved") return t("admin.customer_service.resolved") || (isRtl ? "تم الحل" : "resolved");
    if (status === "replied") return isRtl ? "تم الرد" : "replied";
    if (status === "customer_replied") return isRtl ? "رد العميل" : "customer replied";
    return t("admin.customer_service.new") || (isRtl ? "جديد" : "new");
  };

  const statusClass = (status: CustomerServiceFeedback["status"]) => {
    if (status === "resolved") return "text-slate-600";
    if (status === "replied") return "text-slate-600";
    if (status === "customer_replied") return "text-slate-600";
    return "text-slate-600";
  };

  const resetDefaults = async () => {
    const ok = await confirmDialog({
      title: isRtl
        ? "سيتم استبدال التصنيفات والأسئلة بالافتراضي. متابعة؟"
        : "This will replace categories and FAQs with defaults. Continue?",
      confirmLabel: isRtl ? "متابعة" : "Continue",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
    });
    if (!ok) return;
    await customerServiceFaqApi.resetDefaults();
    await loadCategories();
    await loadFaqs();
    resetCategoryForm();
    resetFaqForm();
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === "deleteCategory") {
        await customerServiceFaqCategoryApi.remove(confirm.id);
        await loadCategories();
        await loadFaqs();
        if (selectedCategoryId === confirm.id) setSelectedCategoryId(null);
      }
      if (confirm.type === "deleteFaq") {
        await customerServiceFaqApi.remove(confirm.id);
        await loadFaqs();
        if (editingFaqId === confirm.id) resetFaqForm();
      }
      if (confirm.type === "deleteFeedback") {
        await customerServiceFeedbackApi.remove(confirm.id);
        await loadFeedback();
      }
    } finally {
      setConfirmLoading(false);
      setConfirm(null);
    }
  };

  return (
    <div 
      className="p-6 lg:p-4 sm:p-8 min-h-screen space-y-8" 
      dir={isRtl ? "rtl" : "ltr"}
      style={{
        backgroundColor: settings.csBg || undefined,
        color: settings.csTextColor || undefined,
        fontFamily: settings.csFontFamily || undefined,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-white text-[9px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: settings.csTextColor || '#0f172a',
              color: settings.csBg || '#ffffff',
            }}
          >
            <MessageCircleQuestion className="w-3 h-3" />
            {t("admin.customer_service.title") || (isRtl ? "خدمة العملاء" : "Customer Service")}
          </div>
          <h1 
            className="text-xl sm:text-2xl font-black tracking-tight"
            style={{
              color: settings.csTextColor || undefined,
              fontSize: settings.csFontSize ? `${parseInt(settings.csFontSize) + 8}px` : undefined,
            }}
          >
            {t("admin.customer_service.subtitle") || (isRtl ? "إدارة التصنيفات والأسئلة والرسائل" : "Manage Categories, FAQs & Feedback")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            type="button" 
            variant={tab === "faqs" ? "default" : "outline"} 
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
            onClick={() => setTab("faqs")}
            style={{
              backgroundColor: tab === "faqs" ? (settings.csTextColor || undefined) : undefined,
              color: tab === "faqs" ? (settings.csBg || undefined) : undefined,
              fontFamily: settings.csFontFamily || undefined,
            }}
          >
            {t("admin.customer_service.tabs.faqs") || (isRtl ? "الأسئلة" : "FAQs")}
          </Button>
          <Button 
            type="button" 
            variant={tab === "feedback" ? "default" : "outline"} 
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
            onClick={() => setTab("feedback")}
            style={{
              backgroundColor: tab === "feedback" ? (settings.csTextColor || undefined) : undefined,
              color: tab === "feedback" ? (settings.csBg || undefined) : undefined,
              fontFamily: settings.csFontFamily || undefined,
            }}
          >
            {t("admin.customer_service.tabs.feedback") || (isRtl ? "الاستفسارات" : "Inquiries")}
          </Button>
          <Button 
            type="button" 
            variant={tab === "opinions" ? "default" : "outline"} 
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
            onClick={() => setTab("opinions")}
            style={{
              backgroundColor: tab === "opinions" ? (settings.csTextColor || undefined) : undefined,
              color: tab === "opinions" ? (settings.csBg || undefined) : undefined,
              fontFamily: settings.csFontFamily || undefined,
            }}
          >
            {isRtl ? "آراء العملاء" : "Client Opinions"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
            onClick={() => router.push("/internal/chat")}
            style={{
              fontFamily: settings.csFontFamily || undefined,
            }}
          >
            {isRtl ? "الرسائل والمحادثات" : "Messages & Chats"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
            onClick={resetDefaults}
            style={{
              fontFamily: settings.csFontFamily || undefined,
            }}
          >
            {t("admin.customer_service.loadDefaults") || (isRtl ? "تحميل الافتراضي" : "Load defaults")}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="h-9 rounded-xl" 
            onClick={() => { loadCategories(); loadFaqs(); loadFeedback(); }}
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {tab === "faqs" && (
        <div className="grid grid-cols-1 xl:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Categories */}
          <Card 
            className="xl:col-span-1 border"
            style={{
              backgroundColor: settings.csCardBg || undefined,
              color: settings.csTextColor || undefined,
            }}
          >
            <CardContent className="p-3 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-slate-950" style={{ color: settings.csTextColor || undefined }}>{t("admin.customer_service.categories") || (isRtl ? "التصنيفات" : "Categories")}</div>
                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadCategories} disabled={loadingCategories}>
                  <RefreshCcw className={`w-4 h-4 ${loadingCategories ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-black text-slate-600" style={{ color: settings.csTextColor || undefined }}>
                  {editingCategoryId ? (t("admin.customer_service.editCategory") || (isRtl ? "تعديل تصنيف" : "Edit category")) : (t("admin.customer_service.addCategory") || (isRtl ? "إضافة تصنيف" : "Add category"))}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Name (AR)</Label>
                    <Input 
                      value={categoryForm.nameAr} 
                      onChange={(e) => setCategoryForm((p) => ({ ...p, nameAr: e.target.value }))}
                      style={{
                        color: settings.csTextColor || undefined,
                        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                        fontFamily: settings.csFontFamily || undefined,
                        backgroundColor: settings.csBg || undefined,
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Name (EN)</Label>
                    <Input 
                      value={categoryForm.nameEn} 
                      onChange={(e) => setCategoryForm((p) => ({ ...p, nameEn: e.target.value }))} 
                      dir="ltr"
                      style={{
                        color: settings.csTextColor || undefined,
                        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                        fontFamily: settings.csFontFamily || undefined,
                        backgroundColor: settings.csBg || undefined,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
                    onClick={submitCategory}
                    disabled={savingCategory || !categoryForm.nameAr.trim() || !categoryForm.nameEn.trim()}
                    style={{
                      backgroundColor: settings.csTextColor || '#0f172a',
                      color: settings.csBg || '#ffffff',
                      fontFamily: settings.csFontFamily || undefined,
                    }}
                  >
                    {savingCategory ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingCategoryId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                    {!savingCategory && !editingCategoryId && <FolderPlus className="w-4 h-4 ml-2" />}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
                    onClick={resetCategoryForm}
                    style={{
                      fontFamily: settings.csFontFamily || undefined,
                    }}
                  >
                    {t("common.clear") || (isRtl ? "تفريغ" : "Clear")}
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t border space-y-2">
                {categories.length === 0 ? (
                  <div className="text-sm font-medium text-slate-500">{isRtl ? "لا يوجد تصنيفات." : "No categories yet."}</div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((c, idx) => {
                      const active = c.id === selectedCategoryId;
                      return (
                        <div 
                          key={c.id} 
                          className={`rounded-xl border p-3`}
                          style={{
                            borderColor: active ? (settings.csTextColor || '#0f172a') : '#e2e8f0',
                            backgroundColor: active ? (settings.csBg || '#f8fafc') : '#f9fafb',
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div
                              className="flex-1 min-w-0 flex items-start gap-2"
                              draggable
                              onDragStart={() => setDragCategoryId(c.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={async () => {
                                if (!dragCategoryId || dragCategoryId === c.id) return;
                                const from = categories.findIndex((x) => x.id === dragCategoryId);
                                const to = categories.findIndex((x) => x.id === c.id);
                                if (from === -1 || to === -1) return;
                                const next = moveInArray(categories, from, to);
                                setDragCategoryId(null);
                                await persistCategoryOrder(next);
                              }}
                            >
                              <div className="mt-1 text-slate-400 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <button type="button" className="flex-1 text-start" onClick={() => setSelectedCategoryId(c.id)}>
                                <div className="flex items-center gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div 
                                      className="text-sm font-black"
                                      style={{
                                        color: settings.csTextColor || undefined,
                                        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                        fontFamily: settings.csFontFamily || undefined,
                                      }}
                                    >
                                      {c.nameAr}
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-400" dir="ltr">
                                      {c.nameEn}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-600 bg-card border border px-2 py-0.5 rounded-full">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {isRtl ? "اسحب لتغيير الترتيب" : "Drag to reorder"}
                                </div>
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={async () => {
                                  const idx = categories.findIndex((x) => x.id === c.id);
                                  const next = moveInArray(categories, idx, idx - 1);
                                  await persistCategoryOrder(next);
                                }}
                                title={isRtl ? "لأعلى" : "Move up"}
                              >
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={async () => {
                                  const idx = categories.findIndex((x) => x.id === c.id);
                                  const next = moveInArray(categories, idx, idx + 1);
                                  await persistCategoryOrder(next);
                                }}
                                title={isRtl ? "لأسفل" : "Move down"}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => startAddFaqForCategory(c.id)} title={isRtl ? "إضافة سؤال" : "Add question"}>
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => startEditCategory(c)} title={isRtl ? "تعديل" : "Edit"}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-8 w-8 p-0 rounded-lg"
                                onClick={() =>
                                  setConfirm({
                                    type: "deleteCategory",
                                    id: c.id,
                                    title: t("admin.customer_service.confirmDeleteCategoryTitle") || (isRtl ? "حذف التصنيف" : "Delete category"),
                                    desc: t("admin.customer_service.confirmDeleteCategoryDesc") || (isRtl ? "سيتم حذف التصنيف. الأسئلة المرتبطة ستبقى بدون تصنيف." : "The category will be deleted. Related FAQs will remain uncategorized."),
                                  })
                                }
                                title={isRtl ? "حذف" : "Delete"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card 
            className="xl:col-span-2 border"
            style={{
              backgroundColor: settings.csCardBg || undefined,
              color: settings.csTextColor || undefined,
            }}
          >
            <CardContent className="p-3 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-slate-950" style={{ color: settings.csTextColor || undefined }}>
                  {isRtl ? "أسئلة التصنيف" : "Category FAQs"}{" "}
                  {selectedCategory ? <span className="text-slate-400 text-sm">{isRtl ? selectedCategory.nameAr : selectedCategory.nameEn}</span> : null}
                </div>
                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadFaqs} disabled={loadingFaqs}>
                  <RefreshCcw className={`w-4 h-4 ${loadingFaqs ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {!selectedCategoryId ? (
                <div className="text-sm font-medium text-slate-500">{t("common.selectFirst") || (isRtl ? "اختر تصنيفاً أولاً." : "Select a category first.")}</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                  {/* Form */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-600" style={{ color: settings.csTextColor || undefined }}>
                      {editingFaqId ? (t("admin.customer_service.editQuestion") || (isRtl ? "تعديل سؤال" : "Edit question")) : (t("admin.customer_service.addQuestion") || (isRtl ? "إضافة سؤال" : "Add question"))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Question (AR)</Label>
                      <Textarea 
                        value={faqForm.questionAr} 
                        onChange={(e) => setFaqForm((p) => ({ ...p, questionAr: e.target.value }))} 
                        className="min-h-[90px]" 
                        style={{
                          color: settings.csTextColor || undefined,
                          fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                          fontFamily: settings.csFontFamily || undefined,
                          backgroundColor: settings.csBg || undefined,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Answer (AR)</Label>
                      <Textarea 
                        value={faqForm.answerAr} 
                        onChange={(e) => setFaqForm((p) => ({ ...p, answerAr: e.target.value }))} 
                        className="min-h-[120px]" 
                        style={{
                          color: settings.csTextColor || undefined,
                          fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                          fontFamily: settings.csFontFamily || undefined,
                          backgroundColor: settings.csBg || undefined,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Question (EN)</Label>
                      <Textarea 
                        value={faqForm.questionEn} 
                        onChange={(e) => setFaqForm((p) => ({ ...p, questionEn: e.target.value }))} 
                        className="min-h-[90px]" 
                        dir="ltr" 
                        style={{
                          color: settings.csTextColor || undefined,
                          fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                          fontFamily: settings.csFontFamily || undefined,
                          backgroundColor: settings.csBg || undefined,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500" style={{ color: settings.csTextColor ? `${settings.csTextColor}cc` : undefined }}>Answer (EN)</Label>
                      <Textarea 
                        value={faqForm.answerEn} 
                        onChange={(e) => setFaqForm((p) => ({ ...p, answerEn: e.target.value }))} 
                        className="min-h-[120px]" 
                        dir="ltr" 
                        style={{
                          color: settings.csTextColor || undefined,
                          fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                          fontFamily: settings.csFontFamily || undefined,
                          backgroundColor: settings.csBg || undefined,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest text-white"
                        onClick={submitFaq}
                        disabled={
                          savingFaq ||
                          !faqForm.questionAr.trim() ||
                          !faqForm.answerAr.trim() ||
                          !faqForm.questionEn.trim() ||
                          !faqForm.answerEn.trim()
                        }
                        style={{
                          backgroundColor: settings.csTextColor || '#0f172a',
                          color: settings.csBg || '#ffffff',
                          fontFamily: settings.csFontFamily || undefined,
                        }}
                      >
                        {savingFaq ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingFaqId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                        {!savingFaq && !editingFaqId && <Plus className="w-4 h-4 ml-2" />}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" 
                        onClick={resetFaqForm}
                        style={{
                          fontFamily: settings.csFontFamily || undefined,
                        }}
                      >
                        {t("common.clear") || (isRtl ? "تفريغ" : "Clear")}
                      </Button>
                    </div>
                  </div>

                  {/* List */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-600">
                      {t("admin.customer_service.questionsList") || (isRtl ? "قائمة الأسئلة" : "Questions list")}
                    </div>
                    {selectedFaqs.length === 0 ? (
                      <div className="text-sm font-medium text-slate-500">{t("common.noData") || (isRtl ? "لا يوجد أسئلة في هذا التصنيف." : "No questions in this category.")}</div>
                    ) : (
                      <div className="divide-y divide-slate-200 border border rounded-2xl overflow-hidden">
                        {selectedFaqs.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-4 rounded-xl border border"
                            style={{
                              backgroundColor: settings.csBg || undefined,
                              color: settings.csTextColor || undefined,
                              fontFamily: settings.csFontFamily || undefined,
                            }}
                            draggable
                            onDragStart={() => setDragFaqId(q.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={async () => {
                              if (!selectedCategoryId) return;
                              if (!dragFaqId || dragFaqId === q.id) return;
                              const from = selectedFaqs.findIndex((x) => x.id === dragFaqId);
                              const to = selectedFaqs.findIndex((x) => x.id === q.id);
                              if (from === -1 || to === -1) return;
                              const next = moveInArray(selectedFaqs, from, to);
                              setDragFaqId(null);
                              await persistFaqOrder(selectedCategoryId, next);
                            }}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <div className="mt-0.5 opacity-40 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div 
                                      className="font-bold"
                                      style={{
                                        color: settings.csTextColor || undefined,
                                        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                                      }}
                                    >
                                      {q.questionAr}
                                    </div>
                                    <div className="mt-1 text-[12px] font-medium text-slate-400" dir="ltr">
                                      {q.questionEn}
                                    </div>
                                  </div>
                                  <span className="shrink-0 text-[10px] font-black text-slate-600 bg-muted border border px-2 py-0.5 rounded-full">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <div 
                                  className="mt-1 line-clamp-2 opacity-80"
                                  style={{
                                    color: settings.csTextColor || undefined,
                                    fontSize: settings.csFontSize ? `${Math.max(parseInt(settings.csFontSize) - 2, 12)}px` : undefined,
                                  }}
                                >
                                  {q.answerAr}
                                </div>
                                <div className="mt-1 line-clamp-2 text-[12px] text-slate-400" dir="ltr">
                                  {q.answerEn}
                                </div>
                                <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-2">
                                  {isRtl ? "اسحب أو استخدم الأسهم لإعادة الترتيب" : "Drag or use arrows to reorder"}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={async () => {
                                    if (!selectedCategoryId) return;
                                    const idx = selectedFaqs.findIndex((x) => x.id === q.id);
                                    const next = moveInArray(selectedFaqs, idx, idx - 1);
                                    await persistFaqOrder(selectedCategoryId, next);
                                  }}
                                  title={t("common.moveUp") || (isRtl ? "لأعلى" : "Move up")}
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={async () => {
                                    if (!selectedCategoryId) return;
                                    const idx = selectedFaqs.findIndex((x) => x.id === q.id);
                                    const next = moveInArray(selectedFaqs, idx, idx + 1);
                                    await persistFaqOrder(selectedCategoryId, next);
                                  }}
                                  title={t("common.moveDown") || (isRtl ? "لأسفل" : "Move down")}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                                <Button type="button" variant="outline" className="h-8 w-8 p-0 rounded-lg" onClick={() => startEditFaq(q)} title={isRtl ? "تعديل" : "Edit"}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 rounded-lg"
                                  onClick={() =>
                                    setConfirm({
                                      type: "deleteFaq",
                                      id: q.id,
                                      title: t("admin.customer_service.confirmDeleteQuestionTitle") || (isRtl ? "حذف السؤال" : "Delete question"),
                                      desc: t("admin.customer_service.confirmDeleteQuestionDesc") || (isRtl ? "هل أنت متأكد من حذف هذا السؤال؟" : "Are you sure you want to delete this question?"),
                                    })
                                  }
                                  title={isRtl ? "حذف" : "Delete"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "feedback" && (
        <Card 
          className="border"
          style={{
            backgroundColor: settings.csCardBg || undefined,
            color: settings.csTextColor || undefined,
          }}
        >
          <CardContent className="p-3 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-black" style={{ color: settings.csTextColor || undefined }}>{t("admin.customer_service.customerFeedback") || (isRtl ? "رسائل العملاء" : "Customer Feedback")}</div>
              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadFeedback} disabled={loadingFeedback}>
                <RefreshCcw className={`w-4 h-4 ${loadingFeedback ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {feedback.length === 0 ? (
              <div className="text-sm font-medium text-slate-500">{t("common.noData") || (isRtl ? "لا توجد رسائل." : "No messages yet.")}</div>
            ) : (
              <div className="divide-y divide-slate-200 border border rounded-2xl overflow-hidden">
                {feedback.map((m) => (
                  <div 
                    key={m.id} 
                    className="p-4 flex flex-col gap-3 rounded-xl border border"
                    style={{
                      backgroundColor: settings.csBg || undefined,
                      color: settings.csTextColor || undefined,
                      fontFamily: settings.csFontFamily || undefined,
                    }}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="font-black" style={{ color: settings.csTextColor || undefined }}>
                          {m.name}{" "}
                          <span className={`text-[10px] font-black uppercase tracking-widest ml-2 ${statusClass(m.status)}`}>
                            {statusLabel(m.status)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs opacity-75 font-medium">
                          {m.contactMethod === "email" ? `${m.email || ""}` : `${m.phoneNumber || ""}`}
                          {m.email && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-black text-slate-700">
                              <Mail className="h-3 w-3" />
                              {isRtl ? "يرسل بريد مع الرد" : "Email on reply"}
                            </span>
                          )}
                        </div>
                        {m.pagePath && (
                          <div className="text-[11px] opacity-60 font-bold">
                            {isRtl ? "المسار:" : "Path:"} {m.pagePath}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.resolvedUser?.id && (
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 rounded-xl gap-2 font-bold border text-slate-800 hover:bg-muted"
                            onClick={() => handleOpenChat(m.resolvedUser.id)}
                            title={isRtl ? "مراسلة العميل" : "Message Client"}
                          >
                            <MessageSquare className="w-4 h-4 text-slate-600" />
                            {isRtl ? "مراسلة" : "Message"}
                          </Button>
                        )}
                        {m.status !== "resolved" && (
                          <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => updateFeedbackStatus(m.id, "resolved")} title={isRtl ? "وضع تم الحل" : "Mark resolved"}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-9 rounded-xl"
                          onClick={() =>
                            setConfirm({
                              type: "deleteFeedback",
                              id: m.id,
                              title: t("admin.customer_service.confirmDeleteMessageTitle") || (isRtl ? "حذف الرسالة" : "Delete message"),
                              desc: t("admin.customer_service.confirmDeleteMessageDesc") || (isRtl ? "هل أنت متأكد من حذف هذه الرسالة؟" : "Are you sure you want to delete this message?"),
                            })
                          }
                          title={isRtl ? "حذف" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div 
                      className="leading-relaxed whitespace-pre-wrap opacity-95"
                      style={{
                        color: settings.csTextColor || undefined,
                        fontSize: settings.csFontSize ? `${settings.csFontSize}px` : undefined,
                      }}
                    >
                      {m.question}
                    </div>
                    {m.adminReply && (
                      <div className="rounded-2xl border border bg-muted/40 p-4">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-700">
                          {isRtl ? "رد الإدارة" : "Admin reply"}
                        </div>
                        <div 
                          className="whitespace-pre-wrap font-bold leading-7 text-slate-800"
                          style={{
                            fontSize: settings.csFontSize ? `${parseInt(settings.csFontSize) - 1}px` : undefined,
                          }}
                        >
                          {m.adminReply}
                        </div>
                        {m.adminRepliedAt && <div className="mt-2 text-[10px] font-black text-slate-500">{new Date(m.adminRepliedAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}</div>}
                      </div>
                    )}
                    {m.userReply && (
                      <div className="rounded-2xl border border bg-muted/40 p-4">
                        <div className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-60">
                          {isRtl ? "رد العميل" : "Customer reply"}
                        </div>
                        <div 
                          className="whitespace-pre-wrap font-bold leading-7 text-slate-800"
                          style={{
                            fontSize: settings.csFontSize ? `${parseInt(settings.csFontSize) - 1}px` : undefined,
                          }}
                        >
                          {m.userReply}
                        </div>
                        {m.userRepliedAt && <div className="mt-2 text-[10px] font-black opacity-45">{new Date(m.userRepliedAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}</div>}
                      </div>
                    )}
                    <div className="rounded-2xl border border bg-card/40 p-3">
                      <Label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {isRtl ? "اكتب رد الإدارة" : "Admin reply"}
                      </Label>
                      <Textarea
                        value={replyDrafts[m.id] ?? ""}
                        onChange={(event) => setReplyDrafts((current) => ({ ...current, [m.id]: event.target.value }))}
                        className="min-h-24 rounded-xl bg-card text-sm font-bold"
                        placeholder={isRtl ? "اكتب الرد الذي سيظهر للعميل ويرسل للبريد إن وجد..." : "Write the reply shown to the customer and emailed if available..."}
                      />
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          className="h-10 rounded-xl bg-slate-900 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black"
                          disabled={replyingFeedbackId === m.id || !(replyDrafts[m.id] || "").trim()}
                          onClick={() => submitAdminReply(m.id)}
                        >
                          <Send className="h-4 w-4" />
                          {replyingFeedbackId === m.id ? (isRtl ? "جار الإرسال" : "Sending") : (isRtl ? "إرسال الرد" : "Send reply")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "opinions" && (
        <div className="bg-card rounded-3xl border border shadow-sm overflow-hidden">
          <AdminOpinionsPage />
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => {
          if (!v) setConfirm(null);
        }}
        title={confirm?.title || ""}
        description={confirm?.desc}
        confirmLabel={t("common.confirm") || (isRtl ? "تأكيد" : "Confirm")}
        cancelLabel={t("common.cancel") || (isRtl ? "إلغاء" : "Cancel")}
        destructive
        onConfirm={runConfirm}
        loading={confirmLoading}
      />
    </div>
  );
}
