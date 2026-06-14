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
import { GripVertical, Plus, RefreshCcw, Trash2, Pencil, ChevronUp, ChevronDown, Scale } from "lucide-react";

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabs */}
        <Card className="xl:col-span-1 border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="font-black text-slate-950">{t("admin.info_content.tabs") || (isRtl ? "التبويبات" : "Tabs")}</div>
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-600">
                {editingTabId ? (t("admin.info_content.editTab") || (isRtl ? "تعديل تبويب" : "Edit tab")) : (t("admin.info_content.addTab") || (isRtl ? "إضافة تبويب" : "Add tab"))}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500">Key</Label>
                  <Input value={tabForm.key} onChange={(e) => setTabForm((p) => ({ ...p, key: e.target.value }))} dir="ltr" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500">Title (AR)</Label>
                  <Input value={tabForm.titleAr} onChange={(e) => setTabForm((p) => ({ ...p, titleAr: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-black text-slate-500">Title (EN)</Label>
                  <Input value={tabForm.titleEn} onChange={(e) => setTabForm((p) => ({ ...p, titleEn: e.target.value }))} dir="ltr" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest" onClick={submitTab} disabled={savingTab || !tabForm.key.trim() || !tabForm.titleAr.trim() || !tabForm.titleEn.trim()}>
                  {savingTab ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingTabId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                  {!savingTab && !editingTabId && <Plus className="w-4 h-4 ml-2" />}
                </Button>
                <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetTabForm}>
                  {t("common.clear") || (isRtl ? "تفريغ" : "Clear")}
                </Button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 space-y-2">
              {tabs.map((tab, idx) => {
                const active = tab.id === selectedTabId;
                return (
                  <div
                    key={tab.id}
                    className={`rounded-xl border ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"} p-3`}
                    draggable
                    onDragStart={() => setDragTabId(tab.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async () => {
                      if (!dragTabId || dragTabId === tab.id) return;
                      const from = tabs.findIndex((t) => t.id === dragTabId);
                      const to = tabs.findIndex((t) => t.id === tab.id);
                      if (from === -1 || to === -1) return;
                      setDragTabId(null);
                      await persistTabOrder(moveInArray(tabs, from, to));
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 flex items-start gap-2">
                        <div className="mt-1 text-slate-400 cursor-grab active:cursor-grabbing">
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <button type="button" className="flex-1 text-left" onClick={() => setSelectedTabId(tab.id)}>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-black text-slate-950">{isRtl ? tab.titleAr : tab.titleEn}</div>
                            <span className="text-[10px] font-black text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            key: {tab.key} • {isRtl ? "اسحب لتغيير الترتيب" : "Drag to reorder"}
                          </div>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                        <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => startEditTab(tab)} title={isRtl ? "تعديل" : "Edit"}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="h-9 rounded-xl"
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
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Blocks */}
        <Card className="xl:col-span-2 border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="font-black text-slate-950">
                {t("admin.info_content.tabContent") || (isRtl ? "محتوى التبويب" : "Tab content")}{" "}
                {selectedTab ? <span className="text-slate-400 text-sm">{isRtl ? selectedTab.titleAr : selectedTab.titleEn}</span> : null}
              </div>
              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={loadAll} disabled={loading}>
                <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {!selectedTabId ? (
              <div className="text-sm font-medium text-slate-500">{t("common.selectFirst") || (isRtl ? "اختر تبويباً أولاً." : "Select a tab first.")}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-600">
                    {editingBlockId ? (t("admin.info_content.editBlock") || (isRtl ? "تعديل عنصر" : "Edit block")) : (t("admin.info_content.addBlock") || (isRtl ? "إضافة عنصر" : "Add block"))}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Label (AR)</Label>
                    <Input value={blockForm.labelAr} onChange={(e) => setBlockForm((p) => ({ ...p, labelAr: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Label (EN)</Label>
                    <Input value={blockForm.labelEn} onChange={(e) => setBlockForm((p) => ({ ...p, labelEn: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Text (AR)</Label>
                    <Textarea value={blockForm.textAr} onChange={(e) => setBlockForm((p) => ({ ...p, textAr: e.target.value }))} className="min-h-[120px]" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-black text-slate-500">Text (EN)</Label>
                    <Textarea value={blockForm.textEn} onChange={(e) => setBlockForm((p) => ({ ...p, textEn: e.target.value }))} className="min-h-[120px]" dir="ltr" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" className="h-9 rounded-xl bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest" onClick={submitBlock} disabled={savingBlock || !blockForm.labelAr.trim() || !blockForm.labelEn.trim() || !blockForm.textAr.trim() || !blockForm.textEn.trim()}>
                      {savingBlock ? (t("common.loading") || (isRtl ? "جارٍ الحفظ..." : "Saving...")) : editingBlockId ? (t("common.update") || (isRtl ? "تحديث" : "Update")) : (t("common.add") || (isRtl ? "إضافة" : "Add"))}
                      {!savingBlock && !editingBlockId && <Plus className="w-4 h-4 ml-2" />}
                    </Button>
                    <Button type="button" variant="outline" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={resetBlockForm}>
                      {t("common.clear") || (isRtl ? "تفريغ" : "Clear")}
                    </Button>
                  </div>
                </div>

                {/* List */}
                  <div className="space-y-2">
                  <div className="text-xs font-black text-slate-600">{isRtl ? "قائمة العناصر" : "Blocks list"}</div>
                  {blocksForTab.length === 0 ? (
                    <div className="text-sm font-medium text-slate-500">{t("common.noData") || (isRtl ? "لا يوجد محتوى." : "No blocks yet.")}</div>
                  ) : (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
                      {blocksForTab.map((b, idx) => (
                        <div
                          key={b.id}
                          className="p-4 bg-white"
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
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <div className="mt-0.5 text-slate-300 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <div className="text-slate-950 font-bold text-sm flex-1">{isRtl ? b.labelAr : b.labelEn}</div>
                                <span className="shrink-0 text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="text-slate-500 text-sm mt-1 line-clamp-2">{isRtl ? b.textAr : b.textEn}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                {isRtl ? "اسحب أو استخدم الأسهم لإعادة الترتيب" : "Drag or use arrows to reorder"}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-1 sm:justify-start">
                              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={async () => {
                                const idx = blocksForTab.findIndex((x) => x.id === b.id);
                                await persistBlockOrder(moveInArray(blocksForTab, idx, idx - 1));
                              }} title={t("common.moveUp") || (isRtl ? "لأعلى" : "Move up")}>
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={async () => {
                                const idx = blocksForTab.findIndex((x) => x.id === b.id);
                                await persistBlockOrder(moveInArray(blocksForTab, idx, idx + 1));
                              }} title={t("common.moveDown") || (isRtl ? "لأسفل" : "Move down")}>
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => startEditBlock(b)} title={isRtl ? "تعديل" : "Edit"}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                className="h-9 rounded-xl"
                                onClick={() =>
                                  setConfirm({
                                    type: "deleteBlock",
                                    id: b.id,
                                    title: t("admin.info_content.confirmDeleteBlockTitle") || (isRtl ? "حذف العنصر" : "Delete block"),
                                    desc: t("admin.info_content.confirmDeleteBlockDesc") || (isRtl ? "هل أنت متأكد من حذف هذا العنصر؟" : "Are you sure you want to delete this block?"),
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
