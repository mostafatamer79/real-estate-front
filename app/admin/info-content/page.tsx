"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { infoContentApi, type InfoBlock, type InfoTab } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import { GripVertical, Plus, RefreshCcw, Trash2, Pencil, ChevronUp, ChevronDown, Scale, FileText, CheckCircle2 } from "lucide-react";

type ConfirmState =
  | { type: "deleteTab"; id: string; title: string; desc: string }
  | { type: "deleteBlock"; id: string; title: string; desc: string }
  | null;

export default function AdminInfoContentPage() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const { t } = useLanguage();
  const confirmDialog = useConfirmDialog();

  const [tabs, setTabs] = useState<InfoTab[]>([]);
  const [blocks, setBlocks] = useState<InfoBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);

  // Tab form
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tabForm, setTabForm] = useState({ key: "", titleAr: "", titleEn: "", sortOrder: 0 });
  const [savingTab, setSavingTab] = useState(false);

  // Block form
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [blockForm, setBlockForm] = useState({ labelAr: "", labelEn: "", textAr: "", textEn: "", sortOrder: 0 });
  const [savingBlock, setSavingBlock] = useState(false);

  // DnD
  const [dragTabId, setDragTabId] = useState<string | null>(null);
  const [dragBlockId, setDragBlockId] = useState<string | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const res = await infoContentApi.getAll();
      const nextTabs = Array.isArray(res.data?.tabs) ? res.data.tabs : [];
      const nextBlocks = Array.isArray(res.data?.blocks) ? res.data.blocks : [];
      setTabs(nextTabs);
      setBlocks(nextBlocks);
      if (!selectedTabId && nextTabs.length > 0) setSelectedTabId(nextTabs[0].id);
      if (selectedTabId && !nextTabs.some((t) => t.id === selectedTabId)) {
        setSelectedTabId(nextTabs[0]?.id ?? null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetTabForm = () => {
    setEditingTabId(null);
    setTabForm({ key: "", titleAr: "", titleEn: "", sortOrder: 0 });
  };
  const resetBlockForm = () => {
    setEditingBlockId(null);
    setBlockForm({ labelAr: "", labelEn: "", textAr: "", textEn: "", sortOrder: 0 });
  };

  const nextSortOrder = (items: Array<{ sortOrder?: number | null }>) => {
    if (!items || items.length === 0) return 0;
    const max = Math.max(...items.map((x) => Number(x.sortOrder ?? 0)));
    return Number.isFinite(max) ? max + 1 : items.length;
  };

  const moveInArray = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = arr.slice();
    const [it] = copy.splice(from, 1);
    copy.splice(to, 0, it);
    return copy;
  };

  const selectedTab = tabs.find((t) => t.id === selectedTabId) || null;
  const blocksForTab = useMemo(() => blocks.filter((b) => b.tabId === selectedTabId).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [blocks, selectedTabId]);

  const startEditTab = (tab: InfoTab) => {
    setEditingTabId(tab.id);
    setTabForm({ key: tab.key, titleAr: tab.titleAr, titleEn: tab.titleEn, sortOrder: tab.sortOrder ?? 0 });
  };
  const startEditBlock = (block: InfoBlock) => {
    setEditingBlockId(block.id);
    setBlockForm({ labelAr: block.labelAr, labelEn: block.labelEn, textAr: block.textAr, textEn: block.textEn, sortOrder: block.sortOrder ?? 0 });
  };

  const submitTab = async () => {
    setSavingTab(true);
    try {
      if (editingTabId) await infoContentApi.updateTab(editingTabId, tabForm);
      else {
        const res = await infoContentApi.createTab({ ...tabForm, sortOrder: nextSortOrder(tabs) });
        setSelectedTabId(res.data?.id ?? selectedTabId);
      }
      await loadAll();
      resetTabForm();
    } finally {
      setSavingTab(false);
    }
  };

  const submitBlock = async () => {
    if (!selectedTabId) return;
    setSavingBlock(true);
    try {
      if (editingBlockId) await infoContentApi.updateBlock(editingBlockId, { ...blockForm, tabId: selectedTabId } as any);
      else await infoContentApi.createBlock({ ...blockForm, tabId: selectedTabId, sortOrder: nextSortOrder(blocksForTab) } as any);
      await loadAll();
      resetBlockForm();
    } finally {
      setSavingBlock(false);
    }
  };

  const persistTabOrder = async (next: InfoTab[]) => {
    setTabs(next);
    try {
      await infoContentApi.reorderTabs(next.map((t) => t.id));
      await loadAll();
    } catch {
      await loadAll();
    }
  };

  const persistBlockOrder = async (next: InfoBlock[]) => {
    if (!selectedTabId) return;
    // optimistic update
    setBlocks((prev) => {
      const other = prev.filter((b) => b.tabId !== selectedTabId);
      return [...other, ...next];
    });
    try {
      await infoContentApi.reorderBlocks(selectedTabId, next.map((b) => b.id));
      await loadAll();
    } catch {
      await loadAll();
    }
  };

  const resetDefaults = async () => {
    const ok = await confirmDialog({
      title: isRtl ? "سيتم استبدال المحتوى بالافتراضي. متابعة؟" : "This will replace content with defaults. Continue?",
      confirmLabel: isRtl ? "متابعة" : "Continue",
      cancelLabel: isRtl ? "إلغاء" : "Cancel",
    });
    if (!ok) return;
    await infoContentApi.resetDefaults();
    await loadAll();
    resetTabForm();
    resetBlockForm();
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmLoading(true);
    try {
      if (confirm.type === "deleteTab") await infoContentApi.deleteTab(confirm.id);
      if (confirm.type === "deleteBlock") await infoContentApi.deleteBlock(confirm.id);
      await loadAll();
      if (confirm.type === "deleteTab" && selectedTabId === confirm.id) setSelectedTabId(null);
      if (confirm.type === "deleteBlock" && editingBlockId === confirm.id) resetBlockForm();
      if (confirm.type === "deleteTab" && editingTabId === confirm.id) resetTabForm();
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
            <Scale className="w-3 h-3" />
            {t("admin.info_content.title") || (isRtl ? "المحتوى القانوني" : "Legal / Info Content")}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">
            {t("admin.info_content.subtitle") || (isRtl ? "إدارة صفحة المعلومات" : "Manage /info page")}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetDefaults}>
            {t("admin.customer_service.loadDefaults") || (isRtl ? "تحميل الافتراضي" : "Load defaults")}
          </Button>
          <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadAll} disabled={loading}>
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Horizontal Tabs Area */}
        <Card className="border-slate-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="font-black text-slate-950">{t("admin.info_content.tabs") || (isRtl ? "التبويبات المتاحة" : "Available Tabs")}</div>
              <div className="flex items-center gap-2">
                <Button type="button" className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest" onClick={() => { resetTabForm(); setSelectedTabId(null); }}>
                  {t("admin.info_content.addTab") || (isRtl ? "إضافة تبويب جديد" : "Add New Tab")}
                  <Plus className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* Horizontal Scrollable Tabs */}
            <div className="flex overflow-x-auto custom-scrollbar pb-2 gap-2">
              {tabs.map((tab, idx) => {
                const active = tab.id === selectedTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => { setSelectedTabId(tab.id); resetTabForm(); }}
                    className={`shrink-0 cursor-pointer transition-all rounded-xl border ${active ? "border-slate-900 bg-slate-900 text-white shadow-md" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"} p-3 flex items-center gap-3 min-w-[200px]`}
                  >
                    <div className="flex-1">
                      <div className={`text-sm font-black ${active ? "text-white" : "text-slate-950"}`}>{isRtl ? tab.titleAr : tab.titleEn}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-slate-400" : "text-slate-500"}`}>
                        key: {tab.key}
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button type="button" variant="ghost" className={`h-8 w-8 p-0 rounded-lg ${active ? "text-slate-300 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-900"}`} onClick={() => startEditTab(tab)} title={isRtl ? "تعديل" : "Edit"}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className={`h-8 w-8 p-0 rounded-lg ${active ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                        onClick={() =>
                          setConfirm({
                            type: "deleteTab",
                            id: tab.id,
                            title: t("admin.info_content.confirmDeleteTabTitle") || (isRtl ? "حذف التبويب" : "Delete tab"),
                            desc: t("admin.info_content.confirmDeleteTabDesc") || (isRtl ? "سيتم حذف التبويب وجميع العناصر بداخله." : "This will delete the tab and all blocks inside it."),
                          })
                        }
                        title={isRtl ? "حذف" : "Delete"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tab Form (shown if editing a tab or adding a new tab) */}
            {(!selectedTabId || editingTabId) && (
              <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                <div className="text-sm font-black text-slate-800 mb-3">
                  {editingTabId ? (t("admin.info_content.editTab") || (isRtl ? "تعديل تبويب" : "Edit tab")) : (t("admin.info_content.addTab") || (isRtl ? "إضافة تبويب" : "Add tab"))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-500">Key (Identifier)</Label>
                    <Input value={tabForm.key} onChange={(e) => setTabForm((p) => ({ ...p, key: e.target.value }))} dir="ltr" className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-500">Title (AR)</Label>
                    <Input value={tabForm.titleAr} onChange={(e) => setTabForm((p) => ({ ...p, titleAr: e.target.value }))} className="bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-slate-500">Title (EN)</Label>
                    <Input value={tabForm.titleEn} onChange={(e) => setTabForm((p) => ({ ...p, titleEn: e.target.value }))} dir="ltr" className="bg-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest" onClick={submitTab} disabled={savingTab || !tabForm.key.trim() || !tabForm.titleAr.trim() || !tabForm.titleEn.trim()}>
                    {savingTab ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingTabId ? (t("common.update") || (isRtl ? "تحديث التبويب" : "Update Tab")) : (t("common.add") || (isRtl ? "حفظ التبويب" : "Save Tab"))}
                  </Button>
                  <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white" onClick={() => { resetTabForm(); if (!editingTabId && tabs.length > 0) setSelectedTabId(tabs[0].id); }}>
                    {t("common.cancel") || (isRtl ? "إلغاء" : "Cancel")}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab Focus: Editor & Preview */}
        {selectedTabId && !editingTabId && selectedTab && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Editor (Blocks List + Form) */}
            <Card className="border-slate-200">
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="font-black text-slate-950 text-lg">
                    {isRtl ? "إدارة بنود " : "Manage "}{isRtl ? selectedTab.titleAr : selectedTab.titleEn}
                  </div>
                  <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetBlockForm}>
                    <Plus className="w-3 h-3 ml-1" />
                    {isRtl ? "عنصر جديد" : "New Block"}
                  </Button>
                </div>

                {/* Block Form */}
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-4">
                  <div className="text-sm font-black text-slate-800">
                    {editingBlockId ? (isRtl ? "تعديل البند" : "Edit Block") : (isRtl ? "إضافة بند جديد" : "Add New Block")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500">Label (AR)</Label>
                      <Input value={blockForm.labelAr} onChange={(e) => setBlockForm((p) => ({ ...p, labelAr: e.target.value }))} className="bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-black text-slate-500">Label (EN)</Label>
                      <Input value={blockForm.labelEn} onChange={(e) => setBlockForm((p) => ({ ...p, labelEn: e.target.value }))} dir="ltr" className="bg-white" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-black text-slate-500">Text (AR) - ابدأ بـ (-) أو (*) لإنشاء قائمة</Label>
                      <Textarea value={blockForm.textAr} onChange={(e) => setBlockForm((p) => ({ ...p, textAr: e.target.value }))} className="min-h-[120px] bg-white" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs font-black text-slate-500">Text (EN) - Start with (-) or (*) to create a list</Label>
                      <Textarea value={blockForm.textEn} onChange={(e) => setBlockForm((p) => ({ ...p, textEn: e.target.value }))} className="min-h-[120px] bg-white" dir="ltr" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button type="button" className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest" onClick={submitBlock} disabled={savingBlock || !blockForm.labelAr.trim() || !blockForm.labelEn.trim() || !blockForm.textAr.trim() || !blockForm.textEn.trim()}>
                      {savingBlock ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingBlockId ? (t("common.update") || (isRtl ? "تحديث البند" : "Update Block")) : (t("common.add") || (isRtl ? "حفظ البند" : "Save Block"))}
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white" onClick={resetBlockForm}>
                      {t("common.cancel") || (isRtl ? "إلغاء" : "Cancel")}
                    </Button>
                  </div>
                </div>

                {/* Blocks List */}
                <div className="space-y-2">
                  <div className="text-sm font-black text-slate-800">{isRtl ? "البنود الحالية" : "Current Blocks"}</div>
                  {blocksForTab.length === 0 ? (
                    <div className="text-sm font-medium text-slate-500 p-4 border border-dashed border-slate-200 rounded-xl text-center">
                      {isRtl ? "لا يوجد بنود. أضف بنداً جديداً لرؤيته في المعاينة." : "No blocks. Add a new block to see it in preview."}
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                      {blocksForTab.map((b, idx) => (
                        <div
                          key={b.id}
                          className={`p-4 transition-colors ${editingBlockId === b.id ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                          draggable
                          onDragStart={() => setDragBlockId(b.id)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async () => {
                            if (!dragBlockId || dragBlockId === b.id) return;
                            const from = blocksForTab.findIndex((x) => x.id === dragBlockId);
                            const to = blocksForTab.findIndex((x) => x.id === b.id);
                            if (from === -1 || to === -1) return;
                            setDragBlockId(null);
                            await persistBlockOrder(moveInArray(blocksForTab, from, to));
                          }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0 flex items-start gap-3">
                              <div className="mt-1 text-slate-300 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="shrink-0 text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                    #{idx + 1}
                                  </span>
                                  <div className="text-slate-900 font-bold text-sm truncate">{isRtl ? b.labelAr : b.labelEn}</div>
                                </div>
                                <div className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{isRtl ? b.textAr : b.textEn}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                               <Button type="button" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900" onClick={async () => {
                                 const i = blocksForTab.findIndex((x) => x.id === b.id);
                                 await persistBlockOrder(moveInArray(blocksForTab, i, i - 1));
                               }}>
                                 <ChevronUp className="w-4 h-4" />
                               </Button>
                               <Button type="button" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-slate-900" onClick={async () => {
                                 const i = blocksForTab.findIndex((x) => x.id === b.id);
                                 await persistBlockOrder(moveInArray(blocksForTab, i, i + 1));
                               }}>
                                 <ChevronDown className="w-4 h-4" />
                               </Button>
                               <Button type="button" variant="ghost" className={`h-8 w-8 p-0 rounded-lg ${editingBlockId === b.id ? "text-slate-900 bg-slate-200" : "text-slate-400 hover:text-slate-900"}`} onClick={() => startEditBlock(b)}>
                                 <Pencil className="w-4 h-4" />
                               </Button>
                               <Button
                                 type="button"
                                 variant="ghost"
                                 className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                 onClick={() =>
                                   setConfirm({
                                     type: "deleteBlock",
                                     id: b.id,
                                     title: t("admin.info_content.confirmDeleteBlockTitle") || (isRtl ? "حذف العنصر" : "Delete block"),
                                     desc: t("admin.info_content.confirmDeleteBlockDesc") || (isRtl ? "هل أنت متأكد من حذف هذا العنصر؟" : "Are you sure you want to delete this block?"),
                                   })
                                 }
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
              </CardContent>
            </Card>

            {/* Right: Live Preview */}
            <Card className="border-slate-200 overflow-hidden bg-slate-50 flex flex-col h-[800px] lg:sticky lg:top-24">
              <div className="bg-slate-900 p-3 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/70 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {isRtl ? "معاينة حية (كما تظهر للمستخدم)" : "Live Preview (User View)"}
                </span>
              </div>
              
              <div className="flex-1 relative w-full overflow-hidden"
                style={{
                  backgroundImage: "url('/cover.jpeg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <div className="absolute inset-0 bg-white/20 pointer-events-none z-0" />
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6 lg:p-8 z-10 bg-transparent">
                  
                  {/* Preview Content matching Modal */}
                  <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-md p-6 lg:p-8 rounded-[2rem] shadow-xl border border-white/40">
                    <div className="text-center mb-8">
                      <h1 className="text-2xl font-black text-slate-900 mb-2">
                        {isRtl ? selectedTab.titleAr : selectedTab.titleEn}
                      </h1>
                    </div>

                    {blocksForTab.length === 0 ? (
                      <div className="text-center text-slate-500 py-10 font-medium text-sm">
                        {isRtl ? "لا يوجد محتوى. سيظهر هنا بعد الإضافة." : "No content. Will appear here after adding."}
                      </div>
                    ) : (
                      blocksForTab.map((block) => (
                        <div key={block.id}>
                          {((isRtl ? block.labelAr : block.labelEn) || "") && (
                            <div className="flex items-center gap-3 mb-4 mt-8">
                              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <h3 className="text-base font-black text-slate-900 tracking-tight">
                                {isRtl ? block.labelAr : block.labelEn}
                              </h3>
                            </div>
                          )}
                          
                          {((isRtl ? block.textAr : block.textEn) || "").split('\n').map((line, idx) => {
                            if (!line.trim()) return null;
                            if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                              return (
                                <ul key={idx} className="space-y-3 mb-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                  <li className="flex items-start gap-3">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-slate-700 leading-relaxed">{line.replace(/^[-*]/, '').trim()}</span>
                                  </li>
                                </ul>
                              );
                            }
                            return (
                              <p key={idx} className="text-sm font-medium text-slate-600 leading-relaxed mb-4">
                                {line}
                              </p>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

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
