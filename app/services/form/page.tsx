// app/service-form/page.tsx
"use client";

import MobileAppHeader from "@/app/src/components/MobileAppHeader";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/context/SettingsContext";
import { motion, Variants } from "framer-motion";
import LegalRequestFlow from "@/components/legal/LegalRequestFlow";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import DynamicServiceForm from "@/components/services/DynamicServiceForm";
import { SERVICE_CATALOG, ServiceCategoryId } from "@/lib/service-catalog";
import { resolveServiceForm, coerceServiceFormDef } from "@/lib/service-forms";
import { ServiceFormDef } from "@/types/service-form";
import api from "@/lib/api";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, duration: 0.4 } },
};

function ServiceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { settings } = useSettings();

  const serviceType = (searchParams.get("type") || "postPurchase") as ServiceCategoryId;
  const legalCategory = searchParams.get("category");
  const config = SERVICE_CATALOG[serviceType];

  // Resolve the form definition: SettingsContext first (service_form_<category> from
  // /settings/public), falling back to GET /settings/service-forms/:category (cached per category).
  const [def, setDef] = useState<ServiceFormDef | null>(null);
  const [defState, setDefState] = useState<"loading" | "ready" | "error">("loading");
  const [retryNonce, setRetryNonce] = useState(0);
  const fetchedRef = useRef<Record<string, ServiceFormDef | null>>({});

  useEffect(() => {
    if (serviceType === "legal") return;
    const fromSettings = resolveServiceForm(serviceType, settings.serviceForms);
    if (fromSettings) {
      setDef(fromSettings);
      setDefState("ready");
      return;
    }
    if (serviceType in fetchedRef.current) {
      const cached = fetchedRef.current[serviceType];
      setDef(cached);
      setDefState(cached ? "ready" : "error");
      return;
    }
    let cancelled = false;
    setDefState("loading");
    api
      .get(`/settings/service-forms/${serviceType}`)
      .then((res) => {
        const parsed = coerceServiceFormDef(res.data);
        fetchedRef.current[serviceType] = parsed;
        if (!cancelled) {
          setDef(parsed);
          setDefState(parsed ? "ready" : "error");
        }
      })
      .catch(() => {
        fetchedRef.current[serviceType] = null;
        if (!cancelled) setDefState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [serviceType, settings.serviceForms, retryNonce]);

  const moduleKey = `services_${serviceType}`;
  const status: 'enabled' | 'soon' | 'disabled' = ((settings.moduleFlags as any)?.[moduleKey] as any) || 'enabled';
  const msg = ((settings.moduleMessages as any)?.[moduleKey] as any) || '';
  const isAdmin = (user as any)?.role === 'admin';
  const isPreview = searchParams.get('preview') === '1';

  // Disabled modules are removed from UI and blocked from direct navigation for everyone.
  if (status === 'disabled') {
    router.replace('/services');
    return null;
  }
  // "Soon" modules are visible as disabled; direct navigation is blocked unless admin explicitly previews.
  if (status === 'soon' && !(isAdmin && isPreview)) {
    return <ComingSoonOverlay sectionName={config?.title || "الخدمات"} message={msg} isAdmin={isAdmin} />;
  }

  if (serviceType === "legal" && !legalCategory) {
    router.replace("/services/legal");
    return null;
  }

  return (


    <section className="services-form-root w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/90 text-slate-950 relative overflow-hidden flex flex-col font-sans selection:bg-muted pb-12" dir="rtl">
      <MobileAppHeader theme="light" title={config ? config.title : "طلب خدمة"} />
      {/* Ambient Background Glows */}
      <div className='absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />
      <div className='absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-400/10 rounded-full blur-[150px] translate-x-1/3 translate-y-1/3 pointer-events-none' />
      <div className='absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-400/5 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none' />

      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block relative z-10 max-w-7xl mx-auto w-full px-6 pt-10"
      >
        <button
          onClick={() => router.push("/services")}
          className="group flex items-center gap-3 text-slate-500 hover:text-slate-950 transition-colors text-[10px] font-black uppercase tracking-[0.25em]"
        >
          <div className="w-8 h-8 rounded-full border border group-hover:border-slate-400 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          العودة للخدمات
        </button>
      </motion.div>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-12 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 font-mono">{config.index}</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.04em] leading-[0.9] text-slate-950 mb-4">{config.title}</h1>
          <p className="text-slate-600 text-sm w-full sm:max-w-md leading-relaxed">{config.description}</p>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-24">
        {/* Legal Flow */}
        {serviceType === "legal" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <LegalRequestFlow initialCategory={legalCategory} onBackToSelection={() => router.push("/services/legal")} />
          </motion.div>
        )}

        {/* Standard Form (definition-driven) */}
        {serviceType !== "legal" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative bg-card border border rounded-[1rem] p-5 sm:p-12 overflow-hidden shadow-sm"
          >
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
                    delete fetchedRef.current[serviceType];
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
              <DynamicServiceForm def={def} category={serviceType} />
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function ServiceForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border border flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    }>
      <ServiceFormContent />
    </Suspense>
  );
}
