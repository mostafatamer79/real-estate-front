"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  AlertTriangle,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { useConfirmDialog } from "@/components/ui/confirm-dialog-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldDef, FieldType, ServiceFormDef } from "@/types/service-form";
import {
  coerceServiceFormDef,
  resolveServiceForm,
  SERVICE_FORM_KEY_PREFIX,
} from "@/lib/service-forms";
import {
  LEGAL_SUBCATEGORIES,
  SERVICE_CATALOG,
  SERVICE_CATEGORY_IDS,
} from "@/lib/service-catalog";

// The 10 editable categories: 6 non-legal catalog categories + 4 legal subcategories.
const BUILDER_CATEGORIES: { id: string; label: string }[] = [
  ...SERVICE_CATEGORY_IDS.filter((id) => id !== "legal").map((id) => ({
    id,
    label: SERVICE_CATALOG[id].title,
  })),
  ...LEGAL_SUBCATEGORIES.map((s) => ({
    id: s.formKey,
    label: `القانونية: ${s.title}`,
  })),
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "نص قصير" },
  { value: "textarea", label: "نص طويل" },
  { value: "number", label: "رقم" },
  { value: "select", label: "قائمة منسدلة" },
  { value: "radio", label: "اختيار من متعدد" },
  { value: "date", label: "تاريخ" },
  { value: "time", label: "وقت" },
  { value: "checkbox", label: "مربع اختيار" },
  { value: "file", label: "رفع ملف" },
  { value: "terms", label: "موافقة على الشروط" },
  { value: "divider", label: "فاصل مرئي" },
];

const FIELD_TYPE_LABELS = new Map(FIELD_TYPES.map((t) => [t.value, t.label]));

// Known fixed DTO targets; anything else is a free-text dotted jsonb path.
const FIXED_TARGETS: { value: string; label: string }[] = [
  { value: "clientName", label: "اسم العميل (clientName)" },
  { value: "phone", label: "الجوال (phone)" },
  { value: "city", label: "المدينة (city)" },
  { value: "district", label: "الحي (district)" },
  { value: "quantity", label: "الكمية (quantity)" },
  { value: "serviceType", label: "نوع الخدمة (serviceType)" },
  { value: "description", label: "الوصف (description)" },
  { value: "termsAccepted", label: "قبول الشروط (termsAccepted)" },
];

const inputCls =
  "w-full h-11 bg-muted border-transparent border focus:border-slate-950 rounded-xl px-4 text-sm font-bold outline-none transition-all";
const labelCls = "text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5";

function makeFieldId() {
  return `field_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Normalize a string|string[] VisibleWhen operand to display text (arrays joined). */
function asText(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? v.join("، ") : v;
}

/** Whether a field is scoped to a given service value via visibleWhen on the service select. */
function equalsValue(equals: string | string[] | undefined, value: string): boolean {
  if (equals === undefined) return false;
  return Array.isArray(equals) ? equals.includes(value) : equals === value;
}

interface FieldEditorState extends FieldDef {
  optionsText: string;
  visibleWhenField: string;
  visibleWhenEquals: string;
  visibleWhenNotEquals: string;
}

export default function FormBuilderPanel() {
  const { settings, updateSettings, refetch } = useSettings();
  const confirmDialog = useConfirmDialog();

  const [category, setCategory] = useState<string>(BUILDER_CATEGORIES[0].id);
  const [draft, setDraft] = useState<ServiceFormDef | null>(null);
  const [loadedCategory, setLoadedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [serviceFilter, setServiceFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editor, setEditor] = useState<FieldEditorState | null>(null);
  const [editorIndex, setEditorIndex] = useState<number | null>(null);

  const loadDef = async (cat: string, forceFetch = false) => {
    if (!forceFetch) {
      const local = resolveServiceForm(cat, settings.serviceForms);
      if (local) {
        setDraft(JSON.parse(JSON.stringify(local)));
        setLoadedCategory(cat);
        return;
      }
    }
    setLoading(true);
    try {
      const res = await api.get(`/settings/service-forms/${cat}`);
      const def = coerceServiceFormDef(res.data);
      if (def) {
        setDraft(JSON.parse(JSON.stringify(def)));
        setLoadedCategory(cat);
        // Keep the context map in sync so other consumers (public renderer) see it
        updateSettings({
          serviceForms: {
            ...settings.serviceForms,
            [`${SERVICE_FORM_KEY_PREFIX}${cat}`]: JSON.stringify(def),
          },
        });
      } else {
        toast.error("تعذر تحميل نموذج الخدمة");
        setDraft(null);
      }
    } catch {
      toast.error("تعذر تحميل نموذج الخدمة");
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loadedCategory !== category) {
      setServiceFilter("");
      setDraft(null);
      loadDef(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  // The select/radio field that targets serviceType drives the per-service filter.
  const serviceField = useMemo(
    () =>
      draft?.fields.find(
        (f) => (f.type === "select" || f.type === "radio") && f.target === "serviceType",
      ) || null,
    [draft],
  );

  // Indices (into draft.fields) currently visible under the service filter:
  // common fields + fields whose visibleWhen targets the service select and equals the filter.
  const visibleIndices = useMemo(() => {
    if (!draft) return [];
    return draft.fields
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => {
        if (!serviceFilter || !serviceField) return true;
        if (!f.visibleWhen || f.visibleWhen.field !== serviceField.id) return true;
        return equalsValue(f.visibleWhen.equals, serviceFilter);
      })
      .map(({ i }) => i);
  }, [draft, serviceFilter, serviceField]);

  const openEditor = (index: number | null) => {
    const base: FieldDef =
      index !== null && draft
        ? draft.fields[index]
        : {
            id: makeFieldId(),
            type: "text",
            label: "",
            target: "",
            // Fields added while a service filter is active are scoped to that service
            ...(serviceFilter && serviceField
              ? { visibleWhen: { field: serviceField.id, equals: serviceFilter } }
              : {}),
          };
    setEditorIndex(index);
    setEditor({
      ...base,
      optionsText: (base.options || []).map((o) => `${o.value}=${o.label}`).join("\n"),
      visibleWhenField: base.visibleWhen?.field || "",
      visibleWhenEquals: asText(base.visibleWhen?.equals),
      visibleWhenNotEquals: asText(base.visibleWhen?.notEquals),
    });
    setEditorOpen(true);
  };

  const applyEditor = () => {
    if (!draft || !editor) return;
    if (!editor.label.trim()) {
      toast.error("أدخل عنوان الحقل");
      return;
    }
    if (editor.type !== "divider" && editor.type !== "terms" && !editor.target.trim()) {
      toast.error("أدخل وجهة الحفظ (target)");
      return;
    }
    const next: FieldDef = {
      id: editor.id,
      type: editor.type,
      label: editor.label.trim(),
      target: editor.target.trim(),
    };
    if (editor.placeholder?.trim()) next.placeholder = editor.placeholder.trim();
    if (editor.required) next.required = true;
    if (editor.half) next.half = true;
    if (editor.dir) next.dir = editor.dir;
    if (editor.section?.trim()) next.section = editor.section.trim();
    if (editor.defaultValue?.trim()) next.defaultValue = editor.defaultValue;
    if (editor.type === "select" || editor.type === "radio") {
      next.options = editor.optionsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const eq = line.indexOf("=");
          return eq === -1
            ? { value: line, label: line }
            : { value: line.slice(0, eq).trim(), label: line.slice(eq + 1).trim() };
        });
    }
    if (editor.visibleWhenField.trim()) {
      next.visibleWhen = { field: editor.visibleWhenField.trim() };
      if (editor.visibleWhenEquals.trim()) next.visibleWhen.equals = editor.visibleWhenEquals.trim();
      if (editor.visibleWhenNotEquals.trim())
        next.visibleWhen.notEquals = editor.visibleWhenNotEquals.trim();
    }

    setDraft({
      ...draft,
      fields:
        editorIndex !== null
          ? draft.fields.map((f, i) => (i === editorIndex ? next : f))
          : [...draft.fields, next],
    });
    setEditorOpen(false);
    setEditor(null);
  };

  const moveField = (listPos: number, dir: -1 | 1) => {
    if (!draft) return;
    const target = listPos + dir;
    if (target < 0 || target >= visibleIndices.length) return;
    const fields = [...draft.fields];
    const a = visibleIndices[listPos];
    const b = visibleIndices[target];
    [fields[a], fields[b]] = [fields[b], fields[a]];
    setDraft({ ...draft, fields });
  };

  const deleteField = async (index: number) => {
    if (!draft) return;
    const ok = await confirmDialog({
      title: "حذف الحقل؟",
      description: `سيتم حذف الحقل "${draft.fields[index].label}" من النموذج.`,
      confirmLabel: "حذف",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    setDraft({ ...draft, fields: draft.fields.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await api.put(`/settings/service-forms/${category}`, draft);
      updateSettings({
        serviceForms: {
          ...settings.serviceForms,
          [`${SERVICE_FORM_KEY_PREFIX}${category}`]: JSON.stringify(draft),
        },
      });
      toast.success("تم حفظ نموذج الخدمة بنجاح");
      await refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg.join("، ") : msg || "فشل في حفظ النموذج");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: "استعادة النموذج الافتراضي؟",
      description: "سيتم استبدال التخصيصات الحالية بالنموذج الافتراضي لهذه الخدمة.",
      confirmLabel: "استعادة الافتراضي",
      cancelLabel: "إلغاء",
      destructive: true,
    });
    if (!ok) return;
    setResetting(true);
    try {
      await api.post(`/settings/service-forms/${category}/reset`);
      await loadDef(category, true);
      await refetch();
      toast.success("تمت استعادة النموذج الافتراضي");
    } catch {
      toast.error("تعذرت استعادة النموذج الافتراضي");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-[1.25rem] border border bg-card p-3 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                تصميم نماذج الخدمات
              </h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                عدّل الحقول التي تظهر للعميل في نموذج طلب كل خدمة.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-12 rounded-2xl border border bg-card px-4 text-sm font-black outline-none"
            >
              {BUILDER_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {serviceField && (
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="h-12 rounded-2xl border border bg-card px-4 text-sm font-black outline-none"
              >
                <option value="">كل الحقول (النموذج الكامل)</option>
                {(serviceField.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    خدمة: {o.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-[11px] font-bold leading-5">
            تنبيه: إعادة تسمية خيار خدمة (في حقل نوع الخدمة) تجعل مفتاح السعر المرتبط به
            (service_price_...) يتيمًا بلا استخدام — حدّث التسمية في تبويب التسعير أيضًا.
          </p>
        </div>
      </div>

      {loading || !draft ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-[1.25rem] border border bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            جاري تحميل النموذج
          </p>
        </div>
      ) : (
        <div className="rounded-[1.25rem] border border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-black text-slate-500">
              {visibleIndices.length} حقل
              {serviceFilter ? " (حقول مشتركة + حقول هذه الخدمة)" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => openEditor(null)}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:border-slate-300"
              >
                <Plus className="h-4 w-4" />
                إضافة حقل
              </button>
              <button
                onClick={handleReset}
                disabled={resetting || saving}
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border bg-card px-4 text-[10px] font-black uppercase tracking-widest text-red-600 hover:border-red-200 disabled:opacity-50"
              >
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                استعادة الافتراضي
              </button>
              <button
                onClick={handleSave}
                disabled={saving || resetting}
                className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                حفظ النموذج
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {visibleIndices.map((fieldIndex, listPos) => {
              const field = draft.fields[fieldIndex];
              const scoped =
                serviceField && field.visibleWhen?.field === serviceField.id && field.visibleWhen?.equals;
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveField(listPos, -1)}
                      disabled={listPos === 0}
                      className="rounded-md p-1 text-slate-400 hover:bg-muted hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(listPos, 1)}
                      disabled={listPos === visibleIndices.length - 1}
                      className="rounded-md p-1 text-slate-400 hover:bg-muted hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{field.label}</p>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-black text-slate-500">
                        {FIELD_TYPE_LABELS.get(field.type) || field.type}
                      </span>
                      {field.required && (
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-black text-red-600">
                          مطلوب
                        </span>
                      )}
                      {scoped && (
                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-600">
                          {asText(field.visibleWhen?.equals)}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-400">
                      target: {field.target || "—"}
                      {field.section ? ` · قسم: ${field.section}` : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditor(fieldIndex)}
                    className="rounded-xl border border bg-card p-2 text-slate-500 hover:border-slate-300 hover:text-slate-950"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteField(fieldIndex)}
                    className="rounded-xl border border bg-red-50 p-2 text-red-500 hover:border-red-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            {visibleIndices.length === 0 && (
              <p className="p-10 text-center text-sm font-black text-slate-400">
                لا توجد حقول مطابقة — أضف حقلًا جديدًا
              </p>
            )}
          </div>
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-2xl rounded-[1.25rem] border border bg-card p-0 shadow-2xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
        >
          {editor && (
            <div className="p-7">
              <DialogHeader className="space-y-2 text-right">
                <DialogTitle className="text-xl font-black text-slate-950">
                  {editorIndex !== null ? "تعديل الحقل" : "إضافة حقل جديد"}
                </DialogTitle>
                <DialogDescription className="text-sm font-bold leading-6 text-slate-500">
                  حدّد خصائص الحقل ومكان حفظ قيمته في الطلب.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>عنوان الحقل</label>
                  <input
                    value={editor.label}
                    onChange={(e) => setEditor({ ...editor, label: e.target.value })}
                    className={inputCls}
                    placeholder="مثال: نوع العقار"
                  />
                </div>
                <div>
                  <label className={labelCls}>نوع الحقل</label>
                  <select
                    value={editor.type}
                    onChange={(e) => setEditor({ ...editor, type: e.target.value as FieldType })}
                    className={inputCls}
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>النص التوضيحي (placeholder)</label>
                  <input
                    value={editor.placeholder || ""}
                    onChange={(e) => setEditor({ ...editor, placeholder: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>القيمة الافتراضية</label>
                  <input
                    value={editor.defaultValue || ""}
                    onChange={(e) => setEditor({ ...editor, defaultValue: e.target.value })}
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>وجهة الحفظ (target)</label>
                  <select
                    value={
                      FIXED_TARGETS.some((t) => t.value === editor.target) ? editor.target : "__custom"
                    }
                    onChange={(e) => {
                      if (e.target.value !== "__custom")
                        setEditor({ ...editor, target: e.target.value });
                      else setEditor({ ...editor, target: "" });
                    }}
                    className={inputCls}
                  >
                    <option value="__custom">مسار مخصص (metadata./firstParty./secondParty.)</option>
                    {FIXED_TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  {!FIXED_TARGETS.some((t) => t.value === editor.target) && (
                    <input
                      value={editor.target}
                      onChange={(e) => setEditor({ ...editor, target: e.target.value })}
                      className={`${inputCls} mt-2`}
                      dir="ltr"
                      placeholder="metadata.propertyType"
                    />
                  )}
                </div>

                {(editor.type === "select" || editor.type === "radio") && (
                  <div className="md:col-span-2">
                    <label className={labelCls}>الخيارات (سطر لكل خيار بصيغة value=label)</label>
                    <textarea
                      value={editor.optionsText}
                      onChange={(e) => setEditor({ ...editor, optionsText: e.target.value })}
                      className="w-full h-28 bg-muted border-transparent border focus:border-slate-950 rounded-xl p-4 text-sm font-bold outline-none transition-all resize-none"
                      placeholder={"الغاز=الغاز\nأخرى=أخرى"}
                    />
                  </div>
                )}

                <div>
                  <label className={labelCls}>القسم (section)</label>
                  <input
                    value={editor.section || ""}
                    onChange={(e) => setEditor({ ...editor, section: e.target.value })}
                    className={inputCls}
                    placeholder="مثال: بيانات الطرف الأول"
                  />
                </div>
                <div>
                  <label className={labelCls}>الاتجاه (dir)</label>
                  <select
                    value={editor.dir || ""}
                    onChange={(e) =>
                      setEditor({ ...editor, dir: (e.target.value || undefined) as "rtl" | "ltr" | undefined })
                    }
                    className={inputCls}
                  >
                    <option value="">تلقائي</option>
                    <option value="rtl">RTL</option>
                    <option value="ltr">LTR</option>
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditor({ ...editor, required: !editor.required })}
                    className={`h-11 rounded-xl border text-xs font-black transition-all ${
                      editor.required
                        ? "bg-slate-950 text-white border-slate-950"
                        : "bg-muted text-slate-500 border hover:border"
                    }`}
                  >
                    حقل مطلوب
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditor({ ...editor, half: !editor.half })}
                    className={`h-11 rounded-xl border text-xs font-black transition-all ${
                      editor.half
                        ? "bg-slate-950 text-white border-slate-950"
                        : "bg-muted text-slate-500 border hover:border"
                    }`}
                  >
                    نصف العرض
                  </button>
                </div>

                <div className="md:col-span-2 rounded-2xl border border bg-muted p-4 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    الظهور المشروط (visibleWhen) — اختياري
                  </p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div>
                      <label className={labelCls}>معرّف الحقل الشرطي</label>
                      <input
                        value={editor.visibleWhenField}
                        onChange={(e) => setEditor({ ...editor, visibleWhenField: e.target.value })}
                        className={inputCls}
                        dir="ltr"
                        placeholder={serviceField ? serviceField.id : "field id"}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>يساوي</label>
                      <input
                        value={editor.visibleWhenEquals}
                        onChange={(e) => setEditor({ ...editor, visibleWhenEquals: e.target.value })}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>لا يساوي</label>
                      <input
                        value={editor.visibleWhenNotEquals}
                        onChange={(e) =>
                          setEditor({ ...editor, visibleWhenNotEquals: e.target.value })
                        }
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditorOpen(false)}
                  className="h-12 rounded-2xl border text-xs font-black text-slate-600"
                >
                  إلغاء
                </Button>
                <Button
                  type="button"
                  onClick={applyEditor}
                  className="h-12 rounded-2xl bg-slate-950 text-xs font-black text-white hover:bg-black"
                >
                  {editorIndex !== null ? "حفظ الحقل" : "إضافة الحقل"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
