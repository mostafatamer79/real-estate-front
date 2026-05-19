"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
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
import { CheckCircle2, Plus, RefreshCcw, Trash2, Pencil, FolderPlus, MessageCircleQuestion, ChevronUp, ChevronDown, GripVertical } from "lucide-react";

type TabKey = "faqs" | "feedback";

export default function AdminCustomerServicePage() {
  const { language, t } = useLanguage();
  const isRtl = language === "ar";

  const [tab, setTab] = useState<TabKey>("faqs");

  const [categories, setCategories] = useState<CustomerServiceFaqCategory[]>([]);
  const [faqs, setFaqs] = useState<CustomerServiceFaq[]>([]);
  const [feedback, setFeedback] = useState<CustomerServiceFeedback[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingFaqs, setLoadingFaqs] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

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
    setFaqForm({ questionAr: "", answerAr: "", questionEn: "", answerEn: "", sortOrder: 0 });
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
      if (editingFaqId) {
        await customerServiceFaqApi.update(editingFaqId, {
          ...faqForm,
          categoryId: selectedCategoryId,
        } as any);
      } else {
        await customerServiceFaqApi.create({
          ...faqForm,
          categoryId: selectedCategoryId,
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

  const resetDefaults = async () => {
    const ok = window.confirm(
      isRtl
        ? "سيتم استبدال التصنيفات والأسئلة بالافتراضي. متابعة؟"
        : "This will replace categories and FAQs with defaults. Continue?",
    );
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
    <div className="p-6 lg:p-8 space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
            <MessageCircleQuestion className="w-3 h-3" />
            {t("admin.customer_service.title") || (isRtl ? "خدمة العملاء" : "Customer Service")}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            {t("admin.customer_service.subtitle") || (isRtl ? "إدارة التصنيفات والأسئلة والرسائل" : "Manage Categories, FAQs & Feedback")}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant={tab === "faqs" ? "default" : "outline"} className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setTab("faqs")}>
            {t("admin.customer_service.tabs.faqs") || (isRtl ? "الأسئلة" : "FAQs")}
          </Button>
          <Button type="button" variant={tab === "feedback" ? "default" : "outline"} className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => setTab("feedback")}>
            {t("admin.customer_service.tabs.feedback") || (isRtl ? "الرسائل" : "Feedback")}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetDefaults}>
            {t("admin.customer_service.loadDefaults") || (isRtl ? "تحميل الافتراضي" : "Load defaults")}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => { loadCategories(); loadFaqs(); loadFeedback(); }}>
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {tab === "faqs" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Categories */}
          <Card className="xl:col-span-1 border-slate-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-slate-950">{t("admin.customer_service.categories") || (isRtl ? "التصنيفات" : "Categories")}</div>
                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadCategories} disabled={loadingCategories}>
                  <RefreshCcw className={`w-4 h-4 ${loadingCategories ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-black text-slate-600">
                  {editingCategoryId ? (t("admin.customer_service.editCategory") || (isRtl ? "تعديل تصنيف" : "Edit category")) : (t("admin.customer_service.addCategory") || (isRtl ? "إضافة تصنيف" : "Add category"))}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Name (AR)</Label>
                    <Input value={categoryForm.nameAr} onChange={(e) => setCategoryForm((p) => ({ ...p, nameAr: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Name (EN)</Label>
                    <Input value={categoryForm.nameEn} onChange={(e) => setCategoryForm((p) => ({ ...p, nameEn: e.target.value }))} dir="ltr" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest"
                    onClick={submitCategory}
                    disabled={savingCategory || !categoryForm.nameAr.trim() || !categoryForm.nameEn.trim()}
                  >
                    {savingCategory ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingCategoryId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                    {!savingCategory && !editingCategoryId && <FolderPlus className="w-4 h-4 ml-2" />}
                  </Button>
                  <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetCategoryForm}>
                    {t("common.clear") || (isRtl ? "تفريغ" : "Clear")}
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                {categories.length === 0 ? (
                  <div className="text-sm font-medium text-slate-500">{isRtl ? "لا يوجد تصنيفات." : "No categories yet."}</div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((c, idx) => {
                      const active = c.id === selectedCategoryId;
                      return (
                        <div key={c.id} className={`rounded-xl border ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"} p-3`}>
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
                              <button type="button" className="flex-1 text-left" onClick={() => setSelectedCategoryId(c.id)}>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm font-black text-slate-950">{isRtl ? c.nameAr : c.nameEn}</div>
                                  <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
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
                                className="h-9 rounded-xl"
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
                                className="h-9 rounded-xl"
                                onClick={async () => {
                                  const idx = categories.findIndex((x) => x.id === c.id);
                                  const next = moveInArray(categories, idx, idx + 1);
                                  await persistCategoryOrder(next);
                                }}
                                title={isRtl ? "لأسفل" : "Move down"}
                              >
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => startAddFaqForCategory(c.id)} title={isRtl ? "إضافة سؤال" : "Add question"}>
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => startEditCategory(c)} title={isRtl ? "تعديل" : "Edit"}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-9 rounded-xl"
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
          <Card className="xl:col-span-2 border-slate-200">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-black text-slate-950">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Form */}
                  <div className="space-y-3">
                    <div className="text-xs font-black text-slate-600">
                      {editingFaqId ? (t("admin.customer_service.editQuestion") || (isRtl ? "تعديل سؤال" : "Edit question")) : (t("admin.customer_service.addQuestion") || (isRtl ? "إضافة سؤال" : "Add question"))}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500">Question (AR)</Label>
                      <Textarea value={faqForm.questionAr} onChange={(e) => setFaqForm((p) => ({ ...p, questionAr: e.target.value }))} className="min-h-[90px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500">Answer (AR)</Label>
                      <Textarea value={faqForm.answerAr} onChange={(e) => setFaqForm((p) => ({ ...p, answerAr: e.target.value }))} className="min-h-[120px]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500">Question (EN)</Label>
                      <Textarea value={faqForm.questionEn} onChange={(e) => setFaqForm((p) => ({ ...p, questionEn: e.target.value }))} className="min-h-[90px]" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black text-slate-500">Answer (EN)</Label>
                      <Textarea value={faqForm.answerEn} onChange={(e) => setFaqForm((p) => ({ ...p, answerEn: e.target.value }))} className="min-h-[120px]" dir="ltr" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest"
                        onClick={submitFaq}
                        disabled={
                          savingFaq ||
                          !faqForm.questionAr.trim() ||
                          !faqForm.answerAr.trim() ||
                          !faqForm.questionEn.trim() ||
                          !faqForm.answerEn.trim()
                        }
                      >
                        {savingFaq ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingFaqId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                        {!savingFaq && !editingFaqId && <Plus className="w-4 h-4 ml-2" />}
                      </Button>
                      <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetFaqForm}>
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
                      <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                        {selectedFaqs.map((q, idx) => (
                          <div
                            key={q.id}
                            className="p-4 bg-white"
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
                                  <div className="mt-0.5 text-slate-300 cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-4 h-4" />
                                  </div>
                                  <div className="text-slate-950 font-bold text-sm flex-1">{isRtl ? q.questionAr : q.questionEn}</div>
                                  <span className="shrink-0 text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                    #{idx + 1}
                                  </span>
                                </div>
                                <div className="text-slate-500 text-sm mt-1 line-clamp-2">{isRtl ? q.answerAr : q.answerEn}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                  {isRtl ? "اسحب أو استخدم الأسهم لإعادة الترتيب" : "Drag or use arrows to reorder"}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-xl"
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
                                  className="h-9 rounded-xl"
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
                                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => startEditFaq(q)} title={isRtl ? "تعديل" : "Edit"}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  className="h-9 rounded-xl"
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
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-slate-950 font-black">{t("admin.customer_service.customerFeedback") || (isRtl ? "رسائل العملاء" : "Customer Feedback")}</div>
              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadFeedback} disabled={loadingFeedback}>
                <RefreshCcw className={`w-4 h-4 ${loadingFeedback ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {feedback.length === 0 ? (
              <div className="text-sm font-medium text-slate-500">{t("common.noData") || (isRtl ? "لا توجد رسائل." : "No messages yet.")}</div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                {feedback.map((m) => (
                  <div key={m.id} className="p-4 flex flex-col gap-3 bg-white">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-slate-950 font-black">
                          {m.name}{" "}
                          <span className={`text-[10px] font-black uppercase tracking-widest ml-2 ${m.status === "resolved" ? "text-emerald-600" : "text-amber-600"}`}>
                            {m.status === "resolved" ? (t("admin.customer_service.resolved") || (isRtl ? "تم الحل" : "resolved")) : (t("admin.customer_service.new") || (isRtl ? "جديد" : "new"))}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {m.contactMethod === "email" ? `${m.email || ""}` : `${m.phoneNumber || ""}`}
                        </div>
                        {m.pagePath && (
                          <div className="text-[11px] text-slate-400 font-bold">
                            {isRtl ? "المسار:" : "Path:"} {m.pagePath}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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

                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{m.question}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
