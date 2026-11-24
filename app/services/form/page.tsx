// app/service-form/page.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { legalServiceCopy } from "@/components/services/legal-service-copy";
import LegalRequestFlow from "@/components/legal/LegalRequestFlow";
import DynamicServiceForm from "@/components/services/DynamicServiceForm";
import {
  getServiceDisplayName,
  getServiceNamesForCategory,
  getCustomServicesForCategory,
  makeServiceItemFlagKey,
  SERVICE_CATALOG,
  LEGAL_SUBCATEGORIES,
  ServiceCategoryId,
} from "@/lib/service-catalog";
import { resolveServiceForm, coerceServiceFormDef } from "@/lib/service-forms";
import { ServiceFormDef } from "@/types/service-form";
import api from "@/lib/api";
import Link from "next/link";
import { servicePageAccess } from "@/lib/service-page-access";
import styles from "./service-request.module.css";
import surface from "../services-redesign.module.css";

function ServiceFormContent() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useSettings();

  const serviceType = searchParams.get("type") || "postPurchase";
  const legalCategory = searchParams.get("category");
  const customCategory = settings.customCategories.find((category) => category.id === serviceType);
  const config = SERVICE_CATALOG[serviceType as ServiceCategoryId] || (customCategory
    ? {
        title: customCategory.title,
        description: customCategory.description || "خدمة مخصصة من إدارة المنصة.",
        index: customCategory.index || "NEW",
        options: [],
      }
    : undefined);


  const buildGenericCustomCategoryForm = (): ServiceFormDef => {
    const services = getCustomServicesForCategory(settings.customServices, serviceType)
      .filter((service) => service.status !== "disabled")
      .map((service) => ({
        value: service.name,
        label: service.displayName || service.name,
        status: service.status,
        disabled: service.status === "soon",
      }));

    return {
      version: 1,
      serviceTypeFallback: customCategory?.title || serviceType,
      fields: [
        { id: "clientName", type: "text", label: "الاسم الكامل", required: true, target: "clientName", half: true },
        { id: "phone", type: "text", label: "رقم الجوال", required: true, target: "phone", half: true, dir: "ltr" },
        { id: "city", type: "text", label: "المدينة", required: true, target: "city", half: true },
        { id: "district", type: "text", label: "الحي", required: true, target: "district", half: true },
        { id: "service", type: "select", label: "نوع الخدمة المطلوبة", placeholder: "اختر من القائمة...", required: services.length > 0, target: "serviceType", options: services },
        { id: "quantity", type: "number", label: "الكمية / العدد", required: true, half: true, target: "quantity", defaultValue: "1" },
        { id: "description", type: "textarea", label: "تفاصيل وملاحظات", placeholder: "اشرح لنا حاجتك بالتفصيل...", target: "description" },
        { id: "termsAccepted", type: "terms", label: "الشروط والأحكام", required: true, target: "termsAccepted", defaultValue: "false" },
      ],
    };
  };

  // Resolve the form definition: SettingsContext first (service_form_<category> from
  // /settings/public), falling back to GET /settings/service-forms/:category (cached per category).
  const immediateDef = useMemo(() => {
    if (serviceType === "legal") return null;
    if (customCategory && !settings.serviceForms[`service_form_${serviceType}`]) {
      return buildGenericCustomCategoryForm();
    }
    return resolveServiceForm(serviceType, settings.serviceForms);
  // The custom category object and service arrays change whenever admin settings change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceType, customCategory, settings.serviceForms, settings.customServices]);
  const [fetched, setFetched] = useState<{ type: string; def: ServiceFormDef | null } | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const def = immediateDef || (fetched?.type === serviceType ? fetched.def : null);
  const defState = immediateDef || def ? "ready" : fetched?.type === serviceType ? "error" : "loading";

  useEffect(() => {
    if (serviceType === "legal" || immediateDef) return;
    let cancelled = false;
    api
      .get(`/settings/service-forms/${serviceType}`)
      .then((res) => {
        const parsed = coerceServiceFormDef(res.data);
        if (!cancelled) setFetched({ type: serviceType, def: parsed });
      })
      .catch(() => {
        if (!cancelled) setFetched({ type: serviceType, def: null });
      });
    return () => {
      cancelled = true;
    };
  }, [serviceType, immediateDef, retryNonce]);

  const moduleKey = `services_${serviceType}`;
  const categoryStatus = customCategory?.status;
  const status = categoryStatus === "soon" || categoryStatus === "disabled"
    ? categoryStatus : settings.moduleFlags[moduleKey] || "enabled";
  const msg = settings.moduleMessages[moduleKey] || '';
  const isAdmin = user?.role === 'admin';
  const isPreview = searchParams.get('preview') === '1';


  const effectiveDef = useMemo<ServiceFormDef | null>(() => {
    if (!def || serviceType === "legal") return def;
    const customServices = getCustomServicesForCategory(settings.customServices, serviceType);
    const customOptions = customServices.map((service) => ({
      value: service.name,
      label: service.displayName || service.name,
      status: service.status,
      disabled: service.status === "soon",
    }));

    return {
      ...def,
      fields: def.fields.map((field) => {
        if (field.target !== "serviceType" || !field.options) return field;
        const optionsByValue = new Map(
          [...field.options, ...customOptions].map((option) => [option.value, option]),
        );
        const options = Array.from(optionsByValue.values())
          .map((option) => {
            const status = option.status || settings.moduleFlags[makeServiceItemFlagKey(serviceType, option.value)] || "enabled";
            return {
              ...option,
              label: getServiceDisplayName(serviceType, option.value, settings.customServices),
              status,
              disabled: option.disabled || status === "soon",
            };
          })
          .filter((option) => option.status !== "disabled");
        return { ...field, options };
      }),
    };
  }, [def, serviceType, settings.customServices, settings.moduleFlags]);

  const legalSubcategory = LEGAL_SUBCATEGORIES.find(category => category.id === legalCategory);
  const access = servicePageAccess({ section: settings.sectionFlags.services, category: status,
    subcategory: serviceType === "legal" && legalSubcategory ? settings.moduleFlags[legalSubcategory.formKey] : undefined, admin: isAdmin, preview: isPreview });
  const invalidSelection = !config || (serviceType === "legal" && (!legalSubcategory || !getServiceNamesForCategory('legal', settings.customServices).includes(legalSubcategory.title)));

  const backHref = serviceType === "legal" ? "/services/legal" : "/services";
  const Back = isRtl ? ArrowRight : ArrowLeft;
  const back = (
    <Button asChild variant="ghost" className={styles.back}>
      <Link href={backHref}><Back aria-hidden="true" />{isRtl ? "العودة للخدمات" : "Back to services"}</Link>
    </Button>
  );
  const loading = <p role="status" className={styles.state}>
    <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
    {isRtl ? "جارٍ التحميل…" : "Loading…"}
  </p>;
  const title = customCategory?.title || t(`services.${serviceType}`);
  const description = legalSubcategory
    ? (isRtl ? legalSubcategory.description : legalServiceCopy[legalSubcategory.id].description)
    : customCategory ? customCategory.description : t(`services.${serviceType}.description`);
  const unavailable = access !== "enabled" || invalidSelection;
  const unavailableTitle = invalidSelection
    ? (isRtl ? "اختر الخدمة المطلوبة أولًا" : "Choose a service first")
    : access === "soon"
      ? (isRtl ? "هذه الخدمة ستتوفر قريبًا" : "This service is coming soon")
      : (isRtl ? "هذه الخدمة غير متاحة حاليًا" : "This service is currently unavailable");
  const detailMessage = access === "section" ? settings.sectionMessages.services
    : serviceType === "legal" && legalSubcategory && settings.moduleFlags[legalSubcategory.formKey] !== "enabled"
      ? settings.moduleMessages[legalSubcategory.formKey] : msg;
  const legalTitle = legalSubcategory
    ? getServiceDisplayName("legal", legalSubcategory.title, settings.customServices)
    : title;
  const formTitle = !isRtl && legalSubcategory && legalTitle === legalSubcategory.title
    ? legalServiceCopy[legalSubcategory.id].title : legalTitle;

  return (
    <section className={surface.page} dir={isRtl ? "rtl" : "ltr"}>
      <div className={styles.shell}>
        {back}
        {settingsLoading || authLoading ? loading : unavailable ? (
          <header className={styles.orientation}>
            <h1>{unavailableTitle}</h1>
            <p role="status">{detailMessage || (isRtl ? "يمكنك العودة إلى قائمة الخدمات المتاحة." : "Return to the available services.")}</p>
          </header>
        ) : (
          <>
            <header className={styles.orientation}>
              <h1>{formTitle}</h1>
              {description && <p>{description}</p>}
            </header>
            {serviceType === "legal" ? (
              <LegalRequestFlow key={legalCategory} initialCategory={legalCategory} requestTitle={formTitle}
                onBackToSelection={() => router.push("/services/legal")} />
            ) : defState === "loading" ? loading : defState === "error" ? (
              <div className={styles.state}>
                <p role="alert">{isRtl ? "تعذر تحميل نموذج هذه الخدمة" : "Could not load this service form"}</p>
                <Button type="button" variant="outline" onClick={() => {
                  setFetched(null);
                  setRetryNonce(n => n + 1);
                }}>
                  <RefreshCw aria-hidden="true" />
                  {isRtl ? "إعادة المحاولة" : "Try again"}
                </Button>
              </div>
            ) : effectiveDef && (
              <DynamicServiceForm key={serviceType} def={effectiveDef} category={serviceType} requestTitle={formTitle} />
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default function ServiceForm() {
  return (
    <Suspense fallback={
      <div className="calm-page calm-screen min-h-screen bg-card flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border border flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-muted-foreground dark:text-slate-400 animate-spin" />
        </div>
      </div>
    }>
      <ServiceFormContent />
    </Suspense>
  );
}
