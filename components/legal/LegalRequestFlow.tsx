"use client";

import { useState, useEffect, useRef } from "react";
import { Scale, FileText, ShieldCheck, MoreHorizontal, Loader2, ArrowRight, ChevronLeft, RefreshCw, Info } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { useSettings } from "@/context/SettingsContext";
import DynamicServiceForm from "@/components/services/DynamicServiceForm";
import { LEGAL_SUBCATEGORIES, LegalCategoryId } from "@/lib/service-catalog";
import { resolveServiceForm, coerceServiceFormDef } from "@/lib/service-forms";
import { ServiceFormDef } from "@/types/service-form";
import api from "@/lib/api";

const categoryIcons: Record<LegalCategoryId, any> = {
  disputes: Scale,
  contracts: FileText,
  documentation: ShieldCheck,
  other: MoreHorizontal,
};

type LegalRequestFlowProps = {
  onSuccessRedirect?: string;
  initialCategory?: string | null;
  selectionOnly?: boolean;
  onCategorySelect?: (category: string) => void;
  onBackToSelection?: () => void;
};

export default function LegalRequestFlow({
  onSuccessRedirect = "/wallet",
  initialCategory = null,
  selectionOnly = false,
  onCategorySelect,
  onBackToSelection,
}: LegalRequestFlowProps) {
  const { user } = useAuth();
  const { settings } = useSettings();

  const moduleStatus = (k: string): 'enabled' | 'soon' | 'disabled' => {
    const v = (settings.moduleFlags as any)?.[k];
    if (v === 'soon' || v === 'disabled') return v;
    return 'enabled';
  };
  const moduleMessage = (k: string) => (settings.moduleMessages as any)?.[k] || '';
  const isAdmin = (user as any)?.role === 'admin';

  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  // Resolve the form definition for the selected legal subcategory:
  // SettingsContext (service_form_legal_<sub> from /settings/public) first,
  // falling back to GET /settings/service-forms/legal_<sub> (cached per category).
  const [def, setDef] = useState<ServiceFormDef | null>(null);
  const [defState, setDefState] = useState<"loading" | "ready" | "error">("loading");
  const [retryNonce, setRetryNonce] = useState(0);
  const fetchedRef = useRef<Record<string, ServiceFormDef | null>>({});

  const formKey = selectedCategory
    ? LEGAL_SUBCATEGORIES.find((c) => c.id === selectedCategory)?.formKey ?? null
    : null;

  useEffect(() => {
    if (!formKey) return;
    const fromSettings = resolveServiceForm(formKey, settings.serviceForms);
    if (fromSettings) {
      setDef(fromSettings);
      setDefState("ready");
      return;
    }
    if (formKey in fetchedRef.current) {
      const cached = fetchedRef.current[formKey];
      setDef(cached);
      setDefState(cached ? "ready" : "error");
      return;
    }
    let cancelled = false;
    setDefState("loading");
    api
      .get(`/settings/service-forms/${formKey}`)
      .then((res) => {
        const parsed = coerceServiceFormDef(res.data);
        fetchedRef.current[formKey] = parsed;
        if (!cancelled) {
          setDef(parsed);
          setDefState(parsed ? "ready" : "error");
        }
      })
      .catch(() => {
        fetchedRef.current[formKey] = null;
        if (!cancelled) setDefState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [formKey, settings.serviceForms, retryNonce]);

  // ─── Main Render ─────────────────────────────────────────────────────────────
	  return (
	    <div className="w-full" dir="rtl">
	      {!selectedCategory ? (
	        /* Category Selection Grid */
	        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
	          {LEGAL_SUBCATEGORIES.map((cat) => {
	            const moduleKey = cat.formKey;
	            const status = moduleStatus(moduleKey);
	            // Disabled modules should be removed from the page for everyone.
	            if (status === 'disabled') return null;
	            const disabled = status !== 'enabled';
	            const isSoon = status === 'soon';
            const CatIcon = categoryIcons[cat.id];
	            return (
	              <motion.div
	                key={cat.id}
	                whileHover={disabled ? undefined : "hovered"}
	                whileTap={disabled ? undefined : { scale: 0.98 }}
	                role="button"
	                tabIndex={disabled ? -1 : 0}
	                aria-disabled={disabled}
	                onKeyDown={(e) => {
	                  if (disabled) {
	                    const msg = moduleMessage(moduleKey) || 'قريباً';
	                    toast.error(msg);
	                    return;
	                  }
	                  if (e.key === "Enter" || e.key === " ") {
	                    e.preventDefault();
	                    if (onCategorySelect) onCategorySelect(cat.id);
	                    else setSelectedCategory(cat.id);
	                  }
	                }}
	                onClick={() => {
	                  if (disabled) {
	                    const msg = moduleMessage(moduleKey) || 'قريباً';
	                    toast.error(msg);
	                    return;
	                  }
	                  if (onCategorySelect) onCategorySelect(cat.id);
	                  else setSelectedCategory(cat.id);
	                }}
	                className={`group relative rounded-2xl p-4 sm:p-5 text-right flex flex-col justify-between min-h-[140px] sm:min-h-[160px] transition-all duration-300 overflow-hidden border ${
	                  disabled
	                    ? 'opacity-60 cursor-not-allowed bg-card/[0.02] border-white/[0.08]'
	                    : 'bg-card/[0.02] border-white/[0.08] hover:border-white/20 cursor-pointer hover:-translate-y-0.5'
	                }`}
	              >
	                <motion.div
	                  variants={{ hovered: { opacity: 1 }, initial: { opacity: 0 } }}
	                  transition={{ duration: 0.3 }}
	                  className="absolute inset-0 bg-card/[0.03] pointer-events-none"
	                />
	                {/* Stronger "not available" sheen for soon/disabled so it doesn't look normal even for admin */}
	                {disabled && (
	                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
	                )}
	                <motion.div
	                  variants={{ hovered: { opacity: 1 }, initial: { opacity: 0 } }}
	                  className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
	                />
	                <div className="relative z-10 flex items-start justify-between gap-4">
	                  <div className="w-9 h-9 rounded-xl bg-card/5 border border-white/10 group-hover:scale-105 flex items-center justify-center transition-all duration-300">
	                    <CatIcon className="w-4 h-4 text-white/50 group-hover:text-white/90 transition-colors duration-200" />
	                  </div>
	                  {isSoon && (
	                    <span className="text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-widest">
	                      قريباً
	                    </span>
	                  )}
	                </div>
	                <div className="relative z-10 mt-auto pt-4">
	                  <p className="text-base sm:text-lg font-bold text-white/80 group-hover:text-white transition-colors duration-200">{cat.title}</p>
	                  <p className="text-[10px] font-medium text-white/40 mt-1 leading-relaxed">{cat.description}</p>
	                </div>

	                {/* Admin-only explicit preview so "soon" doesn't behave like normal click */}
	                {isAdmin && isSoon && (
	                  <div className="pt-1">
	                    <button
	                      type="button"
	                      onClick={(e) => {
	                        e.stopPropagation();
	                        if (onCategorySelect) onCategorySelect(cat.id);
	                        else setSelectedCategory(cat.id);
	                      }}
	                      className="h-9 px-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-[10px] font-black text-slate-500 hover:text-slate-300 transition-all inline-flex items-center gap-2"
	                    >
	                      <Info className="w-4 h-4" />
	                      معاينة كمسؤول
	                    </button>
	                  </div>
	                )}
	              </motion.div>
	            );
	          })}
	        </div>
	      ) : !selectionOnly && (
	        /* Selected Category Form */
	        <div className="space-y-8">
	          {/* Back button */}
	          <button
	            onClick={() => onBackToSelection ? onBackToSelection() : setSelectedCategory(null)}
	            className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
	          >
	            <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
	            العودة لاختيار التصنيف
	          </button>

	          {/* Form card */}
	          <div className="!bg-white/30 backdrop-blur-md shadow-sm border !border-white/35 rounded-[1rem] p-4 sm:p-8 relative overflow-hidden">
	            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

	            {defState === "loading" && (
	              <div className="flex items-center justify-center py-24">
	                <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
	              </div>
	            )}

	            {defState === "error" && (
	              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
	                <p className="text-sm font-bold text-slate-600">تعذر تحميل نموذج هذه الخدمة</p>
	                <button
	                  onClick={() => {
	                    if (formKey) delete fetchedRef.current[formKey];
	                    setRetryNonce((n) => n + 1);
	                  }}
	                  className="h-11 px-6 rounded-2xl bg-slate-950 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
	                >
	                  <RefreshCw className="w-3.5 h-3.5" />
	                  إعادة المحاولة
	                </button>
	              </div>
	            )}

	            {defState === "ready" && def && (
	              <DynamicServiceForm
	                def={def}
	                category="legal"
	                isLegal
	                successRedirect={onSuccessRedirect}
	                renderActions={({ submit, isSubmitting, isValid }) => (
	                  /* Action Buttons */
	                  <div className="flex gap-4 pt-4">
	                    <button
	                      onClick={() => onBackToSelection ? onBackToSelection() : setSelectedCategory(null)}
	                      className="flex-1 h-14 rounded-2xl border border hover:border-slate-300 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-all"
	                    >
	                      إلغاء
	                    </button>
	                    <button
	                      onClick={submit}
	                      disabled={isSubmitting || !isValid}
	                      className="flex-[2] h-14 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
	                    >
	                      {isSubmitting ? (
	                        <Loader2 className="w-4 h-4 animate-spin" />
	                      ) : (
	                        <><span>إرسال الطلب</span><ArrowRight className="w-4 h-4 rotate-180" /></>
	                      )}
	                    </button>
	                  </div>
	                )}
	              />
	            )}
	          </div>
	        </div>
	      )}
	    </div>
	  );
}
