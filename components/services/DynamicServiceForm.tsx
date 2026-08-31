"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronLeft, Loader2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/context/SettingsContext";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { FieldDef, ServiceFormDef } from "@/types/service-form";
import {
  applyTemplate,
  getPath,
  isFieldVisible,
  setPath,
} from "@/lib/service-forms";

// Styling tokens copied verbatim from app/services/form/page.tsx
const inputClass = "w-full min-h-[56px] py-3 bg-card border border hover:border-slate-350 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/5 rounded-2xl px-5 text-slate-900 text-sm font-bold placeholder:text-slate-900 focus:outline-none transition-all duration-200 shadow-sm";
const labelClass = "text-[9px] font-black text-slate-900 uppercase tracking-[0.22em] mb-2 block";

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="h-px flex-1 bg-muted" />
    <span className="text-[8px] font-black text-slate-900 uppercase tracking-[0.3em]">{label}</span>
    <div className="h-px flex-1 bg-muted" />
  </div>
);

// Placeholder upload UI (uploads are non-functional today — parity with the old forms)
const DropZone = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="p-7 border border-dashed border hover:border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 bg-muted/50 hover:bg-muted transition-all cursor-pointer group">
    <div className="w-12 h-12 rounded-xl bg-card border border flex items-center justify-center group-hover:border-slate-300 transition-colors">
      <Upload className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
    <div className="text-center">
      <p className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{label}</p>
      {sub && <p className="text-[9px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const FIXED_TARGETS = new Set([
  "clientName",
  "phone",
  "city",
  "district",
  "quantity",
  "serviceType",
  "description",
  "termsAccepted",
]);

export interface DynamicServiceFormActions {
  submit: () => void;
  isSubmitting: boolean;
  isValid: boolean;
}

interface DynamicServiceFormProps {
  def: ServiceFormDef;
  /** DTO category, e.g. "postPurchase" or "legal" (also used for service_price_ lookups) */
  category: string;
  /** Legal flows: enables the clientName/phone fallback chain (user → firstParty → 'عميل') */
  isLegal?: boolean;
  /** Where to redirect after a successful submit */
  successRedirect?: string;
  /** When provided, replaces the built-in submit button (used by LegalRequestFlow's action row) */
  renderActions?: (actions: DynamicServiceFormActions) => React.ReactNode;
}

export default function DynamicServiceForm({
  def,
  category,
  isLegal = false,
  successRedirect = "/wallet",
  renderActions,
}: DynamicServiceFormProps) {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    for (const f of def.fields) {
      if (f.defaultValue !== undefined) {
        initial[f.id] =
          f.type === "checkbox" || f.type === "terms"
            ? f.defaultValue === "true"
            : f.defaultValue;
      }
    }
    return initial;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  // Prefill personal fields from the logged-in user (mirrors the old form page),
  // plus firstParty.* so legal flows keep their party-1 prefill.
  useEffect(() => {
    if (!user || !isAuthenticated) return;
    const fullName =
      user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "";
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      const fill = (id: string, v: string) => {
        if (v && !next[id]) {
          next[id] = v;
          changed = true;
        }
      };
      for (const f of def.fields) {
        if (f.target === "clientName" || f.target === "firstParty.name") fill(f.id, fullName);
        else if (f.target === "phone" || f.target === "firstParty.phone") fill(f.id, user.phone || "");
        else if (f.target === "city" || f.target === "firstParty.city") fill(f.id, user.city || "");
        else if (f.target === "district" || f.target === "firstParty.district") fill(f.id, user.district || "");
        else if (f.target === "firstParty.email") fill(f.id, (user as any).email || "");
      }
      return changed ? next : prev;
    });
  }, [user, isAuthenticated, def]);

  const setValue = (id: string, value: any) =>
    setValues((prev) => ({ ...prev, [id]: value }));

  const visibleFields = useMemo(
    () => def.fields.filter((f) => isFieldVisible(f, values)),
    [def, values],
  );

  const isFieldFilled = (f: FieldDef): boolean => {
    const v = values[f.id];
    if (f.type === "checkbox" || f.type === "terms") return v === true;
    if (f.type === "file" || f.type === "divider") return true;
    return String(v ?? "").trim() !== "";
  };

  // isFormValid semantics: every required & visible field filled (terms is required by nature)
  const isValid = useMemo(
    () =>
      visibleFields.every(
        (f) => (!f.required && f.type !== "terms") || isFieldFilled(f),
      ),
    [visibleFields, values],
  );

  // Price summary: driven by the serviceType-targeted field (non-legal only)
  const serviceField = def.fields.find((f) => f.target === "serviceType");
  const quantityField = def.fields.find((f) => f.target === "quantity");
  const selectedService = serviceField ? String(values[serviceField.id] ?? "") : "";
  const quantity = Math.max(parseInt(quantityField ? values[quantityField.id] : "1") || 1, 1);

  const getServicePrice = (service: string): number | null => {
    if (!service || service === "أخرى") return null;
    const key = `service_price_${category}_${service}`.replace(/\s+/g, "_").toLowerCase();
    const price = settings.servicePrices[key];
    return price !== undefined ? price : null;
  };

  const buildPayload = (): Record<string, any> => {
    const payload: Record<string, any> = {
      category,
      userId: user?.id || undefined,
    };

    for (const f of visibleFields) {
      // target '' = not persisted on its own (still available for template interpolation)
      if (f.type === "file" || f.type === "divider" || f.target === "") continue;
      const v = values[f.id];
      if (f.target === "quantity") {
        payload.quantity = parseInt(v) || 1;
      } else if (f.target === "description") {
        payload.description = v || undefined;
      } else if (FIXED_TARGETS.has(f.target)) {
        payload[f.target] = v;
      } else {
        setPath(payload, f.target, v);
      }
    }

    // quantity is always sent (default 1), even when the def has no quantity field
    if (payload.quantity === undefined) payload.quantity = 1;

    // Templates override the assembled values. serviceType first so that
    // `{serviceType}` inside the descriptionTemplate refers to the composed value.
    const composedServiceType = applyTemplate(def.serviceTypeTemplate, values);
    if (composedServiceType !== undefined) payload.serviceType = composedServiceType;
    // serviceTypeFallback reproduces marketing's `service || "Photography Session"`
    if (
      (payload.serviceType === undefined || payload.serviceType === "") &&
      def.serviceTypeFallback
    ) {
      payload.serviceType = def.serviceTypeFallback;
    }
    const composedDescription = applyTemplate(def.descriptionTemplate, {
      ...values,
      serviceType: payload.serviceType ?? "",
    });
    if (composedDescription !== undefined) {
      payload.description = composedDescription || undefined;
    }

    // Legal fallback chain: user → firstParty → placeholder
    if (isLegal) {
      const userName =
        user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : "";
      payload.clientName =
        userName || getPath(payload, "firstParty.name") || payload.clientName || "عميل";
      payload.phone =
        user?.phone || getPath(payload, "firstParty.phone") || payload.phone || "05xxxxxxxx";
      payload.city =
        user?.city || getPath(payload, "firstParty.city") || payload.city || "";
      payload.district =
        user?.district || getPath(payload, "firstParty.district") || payload.district || "";
    }

    return payload;
  };

  const submit = async () => {
    if (!isValid) {
      setShowErrors(true);
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("جاري إرسال طلبك...");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildPayload()),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        if (Array.isArray(result.message)) {
          result.message.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(result.message || "فشل إرسال الطلب");
        }
        return;
      }

      toast.success("تم إنشاء طلب الخدمة بنجاح، سيقوم الفريق بالمراجعة والرد عليك قريباً", {
        id: loadingToast,
        duration: 4000,
      });
      setTimeout(() => router.push(successRedirect), 4000);
    } catch (err: any) {
      toast.error("حدث خطأ أثناء إرسال الطلب", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasError = (f: FieldDef) =>
    showErrors && (f.required || f.type === "terms") && !isFieldFilled(f);
  const errorCls = (f: FieldDef) =>
    hasError(f) ? " !border-red-400 focus:!border-red-400" : "";

  const renderFieldControl = (f: FieldDef) => {
    const v = values[f.id];
    switch (f.type) {
      case "textarea":
        return (
          <textarea
            className={inputClass + " h-28 py-4 resize-none" + errorCls(f)}
            value={v ?? ""}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={f.placeholder}
            dir={f.dir}
          />
        );
      case "number":
        return (
          <input
            type="number"
            className={inputClass + errorCls(f)}
            value={v ?? ""}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={f.placeholder}
            min="1"
            dir={f.dir}
          />
        );
      case "date":
      case "time":
        return (
          <input
            type={f.type}
            className={inputClass + errorCls(f)}
            value={v ?? ""}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={f.placeholder}
            dir={f.dir || "ltr"}
          />
        );
      case "select":
        return (
          <div className="relative">
            <select
              className={inputClass + " appearance-none cursor-pointer" + errorCls(f)}
              value={v ?? ""}
              onChange={(e) => setValue(f.id, e.target.value)}
            >
              <option value="" disabled className="bg-card text-slate-900">
                {f.placeholder || "اختر من القائمة..."}
              </option>
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled} className="bg-card text-slate-900">
                  {o.status === "soon" ? `${o.label} - قريباً` : o.label}
                </option>
              ))}
            </select>
            <ChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-slate-400 pointer-events-none" />
          </div>
        );
      case "radio":
        return (
          <div
            className={`grid grid-cols-1 gap-4 ${
              (f.options?.length || 0) > 2 ? "md:grid-cols-3" : "md:grid-cols-2"
            }`}
          >
            {(f.options || []).map((o) => {
              const disabledOption = !!o.disabled;
              return (
                <div
                  key={o.value}
                  onClick={() => {
                    if (!disabledOption) setValue(f.id, o.value);
                  }}
                  aria-disabled={disabledOption}
                  className={`flex items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${
                    disabledOption
                      ? "bg-muted text-slate-400 border cursor-not-allowed opacity-60"
                      : v === o.value
                        ? "bg-slate-950 text-white border-slate-950 cursor-pointer"
                        : "bg-muted text-slate-700 border hover:border-slate-400 cursor-pointer"
                  }`}
                >
                  <span className="font-black text-sm">{o.status === "soon" ? `${o.label} - قريباً` : o.label}</span>
                </div>
              );
            })}
          </div>
        );
      case "checkbox":
        return (
          <div
            onClick={() => setValue(f.id, !v)}
            className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
              v ? "bg-muted text-slate-950 border-slate-300" : "bg-muted text-slate-700 border hover:border-slate-400"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                v ? "border-slate-950 bg-slate-950" : "border-slate-300"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${v ? "text-white opacity-100" : "opacity-0"}`} />
            </div>
            <p className={`text-[10px] font-medium ${v ? "text-slate-700" : "text-slate-600"}`}>{f.label}</p>
          </div>
        );
      case "terms":
        return (
          <div
            onClick={() => setValue(f.id, !v)}
            className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
              v ? "bg-muted text-slate-950 border-slate-300" : "bg-muted text-slate-700 border hover:border-slate-400"
            }${hasError(f) ? " !border-red-400" : ""}`}
          >
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                v ? "border-slate-950 bg-slate-950" : "border-slate-300"
              }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${v ? "text-white opacity-100" : "opacity-0"}`} />
            </div>
            <div>
              <p className={`text-[10px] font-medium mt-0.5 ${v ? "text-slate-700" : "text-slate-600"}`}>
                أوافق على{" "}
                <a
                  href="/info?tab=usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`underline underline-offset-2 decoration-dotted hover:decoration-solid transition-all duration-150 ${
                    v ? "text-slate-700 hover:opacity-80" : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  سياسة الاستخدام
                </a>{" "}
                و{" "}
                <a
                  href="/info?tab=terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`underline underline-offset-2 decoration-dotted hover:decoration-solid transition-all duration-150 ${
                    v ? "text-slate-700 hover:opacity-80" : "text-slate-600 hover:text-slate-950"
                  }`}
                >
                  الشروط والأحكام
                </a>{" "}
                ومعالجة البيانات المدخلة.
              </p>
            </div>
          </div>
        );
      case "file":
        return <DropZone label={f.label} sub={f.placeholder} />;
      case "text":
      default:
        return (
          <input
            className={inputClass + errorCls(f)}
            value={v ?? ""}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={f.placeholder}
            dir={f.dir}
          />
        );
    }
  };

  const price = !isLegal && selectedService ? getServicePrice(selectedService) : null;
  const showPriceSummary = !isLegal && !!selectedService && selectedService !== "أخرى";

  let lastSection: string | undefined;

  return (
    <div className="relative space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleFields.map((f) => {
          if (f.type === "divider") {
            return (
              <div key={f.id} className="md:col-span-2">
                <SectionDivider label={f.label} />
              </div>
            );
          }
          const showSection = !!f.section && f.section !== lastSection;
          if (f.section) lastSection = f.section;
          const span = f.half ? "" : "md:col-span-2";
          return (
            <div key={f.id} className={`contents`}>
              {showSection && (
                <div className="md:col-span-2">
                  <SectionDivider label={f.section!} />
                </div>
              )}
              {f.type === "file" || f.type === "terms" || f.type === "checkbox" ? (
                <div className={`space-y-2 ${span}`}>
                  {f.type === "file" && (
                    <label className={labelClass}>
                      {f.label}
                      {f.required ? " *" : ""}
                    </label>
                  )}
                  {renderFieldControl(f)}
                </div>
              ) : (
                <div className={`space-y-2 ${span}`}>
                  <label className={labelClass}>
                    {f.label}
                    {f.required ? " *" : ""}
                  </label>
                  {renderFieldControl(f)}
                  {hasError(f) && (
                    <p className="text-[10px] font-bold text-red-500">هذا الحقل مطلوب</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Price Summary */}
      {showPriceSummary && serviceField && (
        <motion.div
          key={selectedService}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 sm:p-6 rounded-2xl bg-muted border border space-y-3"
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">سعر الخدمة التقديري</span>
            <span className="text-xl font-black text-slate-950">
              {price !== null
                ? quantity > 1
                  ? <><SaudiRiyalAmount amount={price * quantity} locale="ar-SA" /> <span className="text-xs text-slate-500">({quantity} × {price.toLocaleString("ar-SA")})</span></>
                  : <SaudiRiyalAmount amount={price} locale="ar-SA" />
                : <span className="text-sm text-slate-500">يحدد بعد المراجعة</span>
              }
            </span>
          </div>
          {price !== null && settings.taxPercentage > 0 && (
            <div className="flex justify-between items-center border-t border pt-3">
              <span className="text-[9px] font-black text-slate-400 uppercase">شامل ضريبة {settings.taxPercentage}%</span>
              <span className="text-sm font-black text-slate-600">
                <SaudiRiyalAmount amount={price * quantity * (1 + settings.taxPercentage / 100)} locale="ar-SA" />
              </span>
            </div>
          )}
          <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
            * سيتم تحديد السعر النهائي بدقة من قبل الفريق المختص بعد مراجعة الطلب.
          </p>
        </motion.div>
      )}

      {/* Submit */}
      {renderActions ? (
        renderActions({ submit, isSubmitting, isValid })
      ) : (
        <div className="pt-4 space-y-4">
          <motion.button
            whileTap={isValid && !isSubmitting ? { scale: 0.99 } : {}}
            disabled={!isValid || isSubmitting}
            onClick={submit}
            className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
              isValid && !isSubmitting
                ? "bg-slate-950 text-white hover:bg-slate-800 shadow-sm"
                : "bg-muted text-slate-400 cursor-not-allowed border border"
            }`}
          >
            <div className="flex items-center justify-center gap-3">
              {isSubmitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري المعالجة...</span></>
                : <><span>إرسال طلب الخدمة</span><ArrowLeft className="w-4 h-4 rotate-180" /></>
              }
            </div>
          </motion.button>
          <p className="text-center text-[9px] font-bold text-slate-400 tracking-widest uppercase">
            سيتم الرد على طلبكم خلال 24 ساعة عمل
          </p>
        </div>
      )}
    </div>
  );
}
