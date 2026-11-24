"use client";

import { serviceFieldError } from "@/lib/workspace-usability";
import { useLanguage } from "@/context/LanguageContext";
import { applyCatalogToForm } from "@/lib/service-catalog";
import { useEffect, useMemo, useState, useId, useRef } from "react";
import { loginHref } from "@/lib/auth-navigation";
import { fetchWithTimeout } from "@/lib/fetch-with-timeout";
import { getApiUrl } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, Loader2, Upload } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { getRequestFieldSteps } from "./request-steps";
import styles from "./request-wizard.module.css";
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
const inputClass = "w-full min-h-12 py-2.5 bg-card border border hover:border-slate-350 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/5 rounded-2xl px-5 text-foreground text-sm font-medium placeholder:text-muted-foreground focus:outline-none transition-all duration-200 shadow-sm";
const labelClass = "text-sm font-semibold text-foreground mb-2 block";

// Translate the shipped form definitions for English display. Keep option values
// and administrator-authored content untouched so request payloads remain stable.
const defaultEnglishCopy: Record<string, string> = {
  "البيانات الشخصية": "Personal details", "تفاصيل الخدمة": "Service details",
  "الاسم بالكامل": "Full name", "الاسم الكامل": "Full name", "رقم الجوال": "Mobile number",
  "المدينة": "City", "الحي": "District", "نوع الخدمة المطلوبة": "Requested service",
  "الكمية / العدد": "Quantity", "تفاصيل وملاحظات": "Details and notes",
  "اكتب نوع الخدمة المطلوبة": "Describe the requested service", "نوع الخدمة التسويقية": "Marketing service",
  "الاسم الثلاثي أو الرباعي": "Full name", "اسم المدينة": "City name",
  "اسم الحي السكني": "District name", "اختر من القائمة...": "Select an option...",
  "اشرح لنا حاجتك بالتفصيل...": "Describe what you need...",
  "ما هي الخدمة التي تحتاجها؟": "What service do you need?",
  "الغاز": "Gas", "نقل وتركيب الأثاث": "Furniture moving and installation",
  "التأمين على المنزل": "Home insurance", "الصيانة (سباكة / كهرباء)": "Maintenance (plumbing / electrical)",
  "خدمة التنظيف": "Cleaning", "تنسيق حدائق": "Landscaping", "أنظمة أمنية": "Security systems",
  "مقاول عظم": "Structural contractor", "تصميم هندسي": "Engineering design",
  "تشطيبات": "Finishing", "كهرباء": "Electrical", "سباكة": "Plumbing",
  "نجارة": "Carpentry", "دهانات": "Painting", "ألمنيوم": "Aluminium",
  "إشراف هندسي": "Engineering supervision", "تصميم داخلي": "Interior design",
  "تصوير فوتوغرافي للعقار": "Property photography",
  "حملة إعلانية (وسائل التواصل الاجتماعي)": "Social media campaign",
  "حملة إعلانية (إعلانات طرق/تقليدية)": "Outdoor / traditional campaign",
  "أخرى": "Other", "الخدمة المطلوبة": "Requested service",
  "التقييم العقاري": "Property valuation", "المسح الهندسي": "Engineering survey", "تمويل عقاري": "Property financing",
  "الطرف الأول": "First party", "الطرف الثاني": "Second party", "رقم الهوية": "ID number",
  "بيانات الطرف الأول": "First party details", "بيانات الطرف الثاني": "Second party details",
  "ما هي الخدمات التي سيتم تقديمها، وما هي طبيعة الالتزامات.": "Describe the services and obligations.",
  "اسم البائع / المشتري / الوسيط": "Seller, buyer or broker name", "أدخل رقم الهوية": "Enter ID number",
  "الجنسية": "Nationality", "الصفة": "Role", "بائع": "Seller", "مشتري": "Buyer", "وسيط": "Broker",
  "نوع النزاع (اختياري)": "Dispute type (optional)", "اختر نوع النزاع": "Choose the dispute type",
  "اختر...": "Select…", "اكتب نوع النزاع": "Specify the dispute type", "نوع النزاع...": "Dispute type…",
  "وصف النزاع": "Dispute description", "اكتب وصفاً تفصيلياً للنزاع...": "Describe the dispute in detail…",
  "المستندات (Word, PDF, صور)": "Documents (Word, PDF, images)",
  "رفع المستندات والملفات — الحد الأقصى لكل ملف: 10MB": "Documents and files, up to 10 MB per file",
  "نزاعات الملكية": "Ownership disputes", "عقود البيع والإيجار": "Sale and lease contracts",
  "قضايا الرهن العقاري": "Mortgage disputes", "مخالفات البناء": "Building violations",
  "نزع الملكية للمصلحة العامة": "Expropriation for public use", "مشاكل في مشاريع التطوير": "Development project disputes",
  "قضايا التركات العقارية": "Property inheritance disputes",
  "نوع العقد": "Contract type", "عقد بيع": "Sale agreement", "عقد إيجار": "Lease agreement",
  "عقد الانتفاع العقاري": "Usufruct agreement", "عقد الهبة العقاري": "Property gift agreement",
  "عقد الرهن العقاري": "Mortgage agreement", "عقد الاستثمار العقاري": "Property investment agreement",
  "مراجعة العقود": "Contract review", "اكتب نوع العقد": "Specify the contract type",
  "مثلاً: عقد إدارة أملاك": "For example, a property management agreement",
  "رقم الإقامة": "Residency number", "السجل التجاري": "Commercial registration",
  "الاسم (اسم العميل / اسم الشركة) *": "Client or company name *", "أدخل الاسم الكامل": "Enter the full name",
  "نوع الهوية": "ID type", "الهوية / الإقامة / السجل التجاري *": "ID, residency or registration number *",
  "أدخل الأرقام": "Enter the number", "البريد الإلكتروني": "Email", "العنوان الوطني": "National address",
  "رفق صورة أو PDF": "Image or PDF", "بيانات الوكيل": "Representative details",
  "اسم الوكيل": "Representative name", "اسم الوكيل بالكامل": "Full representative name",
  "رقم الوكالة": "Power of attorney number", "مرفق الوكالة": "Power of attorney document",
  "ارفاق الوكالة (صورة أو PDF)": "Power of attorney (image or PDF)", "باقة مراجعة العقود": "Contract review",
  "ارفق العقد للمراجعة": "Contract for review", "PDF, Word, أو صور — الحد الأقصى 20MB": "PDF, Word or images, up to 20 MB",
  "تفاصيل العقد": "Contract details", "وصف الخدمات": "Service description", "المدة الزمنية": "Duration",
  "مدة العقد": "Contract duration", "تفاصيل الدفع": "Payment details",
  "مبلغ الدفع، طريقة الدفع، وتواريخ الاستحقاق": "Amount, payment method and due dates",
  "الحقوق والمسؤوليات": "Rights and obligations", "الحقوق والواجبات لكل طرف": "Each party’s rights and obligations",
  "شروط إلغاء العقد": "Cancellation terms", "كيفية إلغاء العقد وفسخه": "How the contract can be ended",
  "صفة مقدم الطلب": "Applicant role", "الوكيل": "Representative", "أدخل الاسم": "Enter name",
  "صورة الهوية": "ID image", "ارفاق صورة الهوية (يقبل كذا صيغة)": "ID image in a supported format",
  "صك الملكية": "Title deed", "ارفاق صك الملكية": "Title deed attachment",
  "PDF أو صورة واضحة (يقبل كذا صيغة)": "PDF or clear image", "مبلغ البيع": "Sale amount",
  "مستندات أخرى": "Other documents", "رفع مستندات إضافية": "Additional documents",
  "(يقبل كذا صيغة)": "(Supported formats)", "توثيق": "Documentation", "توثيق صك الملكية": "Title deed documentation",
  "توثيق مستندات البيع": "Sale document verification", "توثيق بيانات الأطراف": "Party information verification",
  "نوع الخدمة": "Service type", "استشارة قانونية": "Legal consultation", "تقرير قانوني": "Legal report",
  "خدمة قانونية مخصصة": "Custom legal service", "نوع الخدمة المخصص": "Custom service type",
  "أدخل اسمك": "Enter your name", "موضوع الاستشارة": "Consultation topic",
  "صفتك (مالك، وكيل، إلخ)": "Your role (owner, representative, etc.)", "نوع العقار": "Property type",
  "فيلا، شقة، أرض...": "Villa, apartment, land…", "رقم العرض": "Listing number",
  "رقم العرض إن وجد": "Listing number, if available", "تفاصيل وطلبات إضافية": "Additional details and requests",
  "المرفقات (جميع الصيغ)": "Attachments", "إرفاق ملفات داعمة — يقبل جميع الصيغ": "Supporting documents",
  "كود الوحدة (PRP)": "Property code (PRP)", "تاريخ الجلسة": "Session date", "وقت الجلسة": "Session time",
  "استشارات قانونية": "Legal consultations", "تقارير قانونية": "Legal reports",
  "ما هي الخدمة القانونية التي تحتاجها؟": "What legal service do you need?",
  "اكتب موضوع استشارتك هنا...": "Describe the subject of your consultation…",
  "نوع التصوير": "Photography type", "فيديو": "Video", "لايف": "Live",
};

const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-4 py-1">
    <div className="h-px flex-1 bg-muted" />
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <div className="h-px flex-1 bg-muted" />
  </div>
);

// The form definition may include a file field, but this request endpoint does not upload files.
const DropZone = ({ label, sub }: { label: string; sub?: string }) => (
  <div className="p-5 border border-dashed border-border rounded-xl flex items-center gap-3 bg-muted/30">
    <div className="calm-icon w-12 h-12 rounded-xl bg-card border border flex items-center justify-center group-hover:border-slate-300 transition-colors">
      <Upload className="w-5 h-5 text-muted-foreground dark:text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground dark:text-slate-400 mt-0.5">{sub}</p>}
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

type FieldValue = string | boolean;

interface DynamicServiceFormProps {
  def: ServiceFormDef;
  /** DTO category, e.g. "postPurchase" or "legal" (also used for service_price_ lookups) */
  category: string;
  catalogCategory?: string;
  /** Legal flows: enables the clientName/phone fallback chain (user → firstParty → 'عميل') */
  isLegal?: boolean;
  /** Where to redirect after a successful submit */
  successRedirect?: string;
  /** Enables the public request steps and supplies the summary title. */
  requestTitle?: string;
  /** Replaces the legacy submit action for embedded forms. */
  renderActions?: (actions: DynamicServiceFormActions) => React.ReactNode;
}

export default function DynamicServiceForm({
  def: providedDef,
  category,
  catalogCategory = category,
  isLegal = false,
  successRedirect = "/wallet",
  renderActions,
  requestTitle,
}: DynamicServiceFormProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const displayCopy = (value?: string) => value ? (ar ? value : defaultEnglishCopy[value] || value) : "";
  const reduceMotion = useReducedMotion();
  const formId = useId();
  const submitLock = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const focusTarget = useRef<string | null>(null);
  useEffect(() => {
    if (focusTarget.current === null) return;
    const control = document.getElementById(focusTarget.current);
    (control || stepHeading.current)?.focus();
    focusTarget.current = null;
  }, [step]);

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  useEffect(() => () => { if (redirectTimer.current) clearTimeout(redirectTimer.current); }, []);
  const { user, token, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const def = useMemo(() => applyCatalogToForm(providedDef, catalogCategory, settings.customServices, settings.moduleFlags), [providedDef, catalogCategory, settings.customServices, settings.moduleFlags]);

  const [values, setValues] = useState<Record<string, FieldValue>>(() => {
    const initial: Record<string, FieldValue> = {};
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
  const [requestedDeliveryMode,setRequestedDeliveryMode]=useState<'any'|'online'|'in_person'>('any');
  const [requestCity,setRequestCity]=useState('');
  const hasCityField=def.fields.some(field=>field.target==='city'||field.target==='firstParty.city');
  useEffect(()=>{if(user?.city)setRequestCity(current=>current||user.city||'')},[user?.city]);
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

  const setValue = (id: string, value: FieldValue) =>
    setValues((prev) => ({ ...prev, [id]: value }));

  const visibleFields = useMemo(
    () => def.fields.filter((f) => isFieldVisible(f, values)),
    [def, values],
  );

  const fieldId = (field: FieldDef) => `${formId}-${field.id}`;
  const validationErrors = useMemo(() => Object.fromEntries(visibleFields.map(field => [field.id, serviceFieldError(field, values[field.id], language)])), [visibleFields, values, language]);
  const fieldSteps = useMemo(() => getRequestFieldSteps(def.fields, catalogCategory), [def.fields, catalogCategory]);
  const isWizard = requestTitle !== undefined;
  const steps = ar ? ["الخدمة المطلوبة", "تفاصيل الطلب", "مراجعة الطلب"] : ["Requested service", "Request details", "Review request"];
  const deliveryOptions = ar ? ["أونلاين أو حضوري", "أونلاين", "حضوري"] : ["Online or in person", "Online", "In person"];
  const cityId = `${formId}-request-city`;
  const isValid = Object.values(validationErrors).every(error => !error);

  // Price summary: driven by the serviceType-targeted field (non-legal only)
  const serviceField = def.fields.find((f) => f.target === "serviceType");
  const quantityField = def.fields.find((f) => f.target === "quantity");
  const selectedService = serviceField ? String(values[serviceField.id] ?? "") : "";
  const quantity = Math.max(parseInt(String(quantityField ? values[quantityField.id] : "1")) || 1, 1);

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
        payload.quantity = parseInt(String(v)) || 1;
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
        payload.city || getPath(payload, "firstParty.city") || user?.city || "";
      payload.district =
        user?.district || getPath(payload, "firstParty.district") || payload.district || "";
    }

    if(!hasCityField) payload.city=requestCity.trim();
    payload.metadata={...(payload.metadata || {}),requestedDeliveryMode};
    return payload;
  };

  const moveTo = (next: number, controlId = "") => {
    if (next === step) {
      if (controlId) document.getElementById(controlId)?.focus();
      return;
    }
    focusTarget.current = controlId;
    setStep(next);
  };

  const validateThrough = (through: number) => {
    for (let index = 0; index <= through; index++) {
      if (index === 1 && !hasCityField && !requestCity.trim()) {
        setSubmitError(ar ? "حدد مدينة تنفيذ الطلب" : "Enter the service request city");
        moveTo(index, cityId);
        return false;
      }
      const invalid = visibleFields.filter(field => fieldSteps.get(field.id) === index && validationErrors[field.id]);
      if (invalid.length) {
        setTouched(previous => ({ ...previous, ...Object.fromEntries(invalid.map(field => [field.id, true])) }));
        moveTo(index, fieldId(invalid[0]));
        return false;
      }
    }
    return true;
  };

  const advance = () => {
    setSubmitError(null);
    if (validateThrough(step)) moveTo(step + 1);
  };

  const submit = async () => {
    if (submitLock.current) return;
    if (!isAuthenticated || !token) { router.push(loginHref(window.location.pathname + window.location.search)); return; }
    if (isWizard && !validateThrough(2)) return;
    if (!hasCityField && !requestCity.trim()) {setSubmitError(ar?'حدد مدينة تنفيذ الطلب':'Enter the service request city');document.getElementById(`${formId}-request-city`)?.focus();return;}
    if (!isValid) {
      setShowErrors(true);
      const firstInvalid = visibleFields.find(field => validationErrors[field.id]);
      if (firstInvalid) document.getElementById(fieldId(firstInvalid))?.focus();
      return;
    }
    submitLock.current = true;
    setSubmitError(null);
    setIsSubmitting(true);
    let success = false;
    const loadingToast = toast.loading(ar ? "جاري إرسال طلبك..." : "Submitting your request...");

    try {
      const response = await fetchWithTimeout(`${getApiUrl()}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(buildPayload()),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.message) ? result.message.join('، ') : result.message;
        const text = typeof message === 'string' ? message : (ar ? 'تعذر إرسال الطلب. حاول مرة أخرى.' : 'Could not submit your request. Please try again.');
        setSubmitError(text);
        toast.error(text, { id: loadingToast });
        return;
      }
      success = true;
      setSubmitted(true);

      toast.success(ar ? "تم إنشاء طلب الخدمة بنجاح، سيقوم الفريق بالمراجعة والرد عليك قريباً" : "Your request was submitted successfully.", {
        id: loadingToast,
        duration: 4000,
      });
      redirectTimer.current = setTimeout(() => router.push(successRedirect), 4000);
    } catch {
      const message = ar ? 'تعذر الاتصال. بياناتك محفوظة في النموذج؛ حاول الإرسال مرة أخرى.' : 'Could not connect. Your entries are still in the form; try again.';
      setSubmitError(message);
      toast.error(message, { id: loadingToast });
    } finally {
      if (!success) { submitLock.current = false; setIsSubmitting(false); }
    }
  };

  const hasError = (f: FieldDef) => !!validationErrors[f.id] && (showErrors || !!touched[f.id]);
  const controlProps = (field: FieldDef) => ({
    id: fieldId(field), name: field.id,
    'aria-invalid': hasError(field),
    'aria-required': !!field.required || field.type === 'terms',
    'aria-describedby': hasError(field) ? `${fieldId(field)}-error` : undefined,
    onBlur: () => setTouched(previous => ({ ...previous, [field.id]: true })),
  });
  const errorCls = (f: FieldDef) =>
    hasError(f) ? " !border-red-400 focus:!border-red-400" : "";

  const renderFieldControl = (f: FieldDef) => {
    const v = values[f.id];
    switch (f.type) {
      case "textarea":
        return (
          <textarea
            {...controlProps(f)}
            className={inputClass + " h-28 py-4 resize-none" + errorCls(f)}
            value={String(v ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={displayCopy(f.placeholder)}
            dir={ar ? f.dir : (f.dir === "ltr" ? "ltr" : undefined)}
          />
        );
      case "number":
        return (
          <input
            {...controlProps(f)}
            type="number"
            className={inputClass + errorCls(f)}
            value={String(v ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={displayCopy(f.placeholder)}
            min="1"
            dir={f.dir}
          />
        );
      case "date":
      case "time":
        return (
          <input
            {...controlProps(f)}
            type={f.type}
            className={inputClass + errorCls(f)}
            value={String(v ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={f.placeholder}
            dir={f.dir || "ltr"}
          />
        );
      case "select":
        return (
          <div className="relative">
            <select
              {...controlProps(f)}
              className={inputClass + " appearance-none cursor-pointer pe-10" + errorCls(f)}
              value={String(v ?? "")}
              onChange={(e) => setValue(f.id, e.target.value)}
            >
              <option value="" disabled className="bg-card text-foreground">
                {displayCopy(f.placeholder) || (ar ? "اختر من القائمة..." : "Select an option...")}
              </option>
              {(f.options || []).map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled} className="bg-card text-foreground">
                  {o.status === "soon" ? `${displayCopy(o.label)} - ${ar ? "قريباً" : "Coming soon"}` : displayCopy(o.label)}
                </option>
              ))}
            </select>
            <ChevronLeft className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-muted-foreground dark:text-slate-400 pointer-events-none" />
          </div>
        );
      case "radio":
        return (
          <div {...controlProps(f)} role="radiogroup" tabIndex={-1} aria-labelledby={`${fieldId(f)}-label`} className={`grid grid-cols-1 gap-3 ${(f.options?.length || 0) > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {(f.options || []).map(option => (
              <label key={option.value} className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${v === option.value ? 'border-primary bg-muted text-foreground' : 'border-border bg-card text-foreground'}`}>
                <input type="radio" name={fieldId(f)} value={option.value} checked={v === option.value} disabled={option.disabled} onChange={() => setValue(f.id, option.value)} className="h-4 w-4 shrink-0 accent-primary" />
                <span>{option.status === 'soon' ? `${displayCopy(option.label)} - ${ar ? 'قريباً' : 'Coming soon'}` : displayCopy(option.label)}</span>
              </label>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <label className={`service-consent flex items-start gap-3 rounded-xl border bg-card p-4 text-foreground cursor-pointer ${hasError(f) ? "border-red-400" : "border-border"}`}>
            <input
            {...controlProps(f)}
              type="checkbox"
              name={f.id}
              checked={v === true}
              onChange={(event) => setValue(f.id, event.target.checked)}
              aria-invalid={hasError(f)}
              aria-required={!!f.required}
              className="mt-0.5 h-5 w-5 shrink-0 accent-primary cursor-pointer"
            />
            <span className="min-w-0 flex-1 text-sm leading-6">{displayCopy(f.label)}</span>
          </label>
        );
      case "terms":
        return (
          <label className={`service-consent flex items-start gap-3 rounded-xl border bg-card p-4 text-foreground cursor-pointer ${hasError(f) ? "border-red-400" : "border-border"}`}>
            <input
            {...controlProps(f)}
              type="checkbox"
              name={f.id}
              checked={v === true}
              onChange={(event) => setValue(f.id, event.target.checked)}
              aria-invalid={hasError(f)}
              aria-required={true}
              className="mt-0.5 h-5 w-5 shrink-0 accent-primary cursor-pointer"
            />
            <span className="min-w-0 flex-1 text-sm leading-6">
                {ar ? "أوافق على" : "I agree to the"}{" "}
                <a
                  href="/info?tab=usage"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium underline underline-offset-4 hover:opacity-80"
                >
                  {ar ? "سياسة الاستخدام" : "usage policy"}
                </a>{" "}
                {ar ? "و" : "and the"}{" "}
                <a
                  href="/info?tab=terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="font-medium underline underline-offset-4 hover:opacity-80"
                >
                  {ar ? "الشروط والأحكام" : "terms and conditions"}
                </a>{" "}
                {ar ? "ومعالجة البيانات المدخلة." : "and the processing of the information entered."} <span aria-hidden="true">*</span>
            </span>
          </label>
        );
      case "file":
        return <DropZone label={displayCopy(f.label)} sub={displayCopy(f.placeholder)} />;
      case "text":
      default:
        return (
          <input
            {...controlProps(f)}
            className={inputClass + errorCls(f)}
            value={String(v ?? "")}
            onChange={(e) => setValue(f.id, e.target.value)}
            placeholder={displayCopy(f.placeholder)}
            dir={ar ? f.dir : (f.dir === "ltr" ? "ltr" : undefined)}
          />
        );
    }
  };

  const price = !isLegal && selectedService ? getServicePrice(selectedService) : null;
  const showPriceSummary = !isLegal && !!selectedService && selectedService !== "أخرى";

  const cityField = visibleFields.find(field => field.target === "city" || field.target === "firstParty.city");
  const currentFields = visibleFields.filter(field => !isWizard || fieldSteps.get(field.id) === step);
  const displayedFields = currentFields.filter((field, index) =>
    !isWizard || field.type !== "divider" || (currentFields[index + 1] && currentFields[index + 1].type !== "divider")
  );
  const fieldText = (field: FieldDef) => {
    const value = values[field.id];
    if (typeof value === "boolean") return value ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No");
    return displayCopy(field.options?.find(option => option.value === value)?.label ?? String(value ?? "").trim());
  };
  const selectedChoice = visibleFields.find(field => field.options?.length && fieldSteps.get(field.id) === 0 && values[field.id]);
  const selectedLabel = selectedChoice ? fieldText(selectedChoice) : "";
  const cityLabel = cityField ? fieldText(cityField) : requestCity.trim();
  const reviewFields: { id: string; label: string; value: string }[] = [];
  if (isWizard && step === 2) {
    let heading: string | undefined;
    for (const field of visibleFields) {
      if (field.type === "divider") {
        heading = field.label;
        continue;
      }
      if (field.type === "file" || field.type === "terms") continue;
      const value = fieldText(field);
      if (!value) continue;
      const section = fieldSteps.get(field.id) === 0 ? field.section : field.section || heading;
      const prefix = section && section !== field.label ? displayCopy(section) + " · " : "";
      const label = prefix + displayCopy(field.label);
      reviewFields.push({ id: field.id, label, value });
    }
  }
  const requestLocation = (
    <fieldset disabled={isSubmitting} className="space-y-3">
      <legend className="sr-only">{ar ? "مكان وطريقة تنفيذ الطلب" : "Request location and delivery"}</legend>
      {!hasCityField && (!isWizard || step === 1) && (
        <label className={labelClass}>
          {ar ? "مدينة تنفيذ الطلب *" : "Request city *"}
          <input id={cityId} required maxLength={100} value={requestCity}
            onChange={event => { setRequestCity(event.target.value); setSubmitError(null); }} className={inputClass} />
        </label>
      )}
      {(!isWizard || step === 0) && (
        <label className={labelClass}>
          {ar ? "طريقة التنفيذ المطلوبة" : "Requested delivery mode"}
          <select value={requestedDeliveryMode}
            onChange={event => setRequestedDeliveryMode(event.target.value as typeof requestedDeliveryMode)} className={inputClass}>
            {(["any", "online", "in_person"] as const).map((value, index) =>
              <option key={value} value={value}>{deliveryOptions[index]}</option>
            )}
          </select>
        </label>
      )}
    </fieldset>
  );

  let lastSection: string | undefined;

  return (
    <div className={isWizard ? styles.layout : undefined}>
      {isWizard && (
        <ol className={styles.steps} aria-label={ar ? "خطوات الطلب" : "Request steps"}>
          {steps.map((label, index) => (
            <li key={label} aria-current={step === index ? "step" : undefined} data-complete={index < step}>
              <span aria-hidden="true">{new Intl.NumberFormat(ar ? "ar-SA" : "en").format(index + 1)}</span>
              {label}
            </li>
          ))}
        </ol>
      )}
      <form noValidate aria-busy={isSubmitting}
        className={`dynamic-service-form ${isWizard ? styles.form : "relative space-y-7"}`}
        onSubmit={event => {
          event.preventDefault();
          if (isSubmitting) return;
          if (isWizard && step < 2) advance();
          else void submit();
        }}>
        {isWizard && <h2 ref={stepHeading} tabIndex={-1} className={styles.stepHeading}>{steps[step]}</h2>}
        {(!isWizard || displayedFields.some(field => field.required || field.type === "terms") || (step === 1 && !hasCityField)) && <p className="text-sm text-muted-foreground">{ar ? 'الحقول المعلّمة بـ * مطلوبة.' : 'Fields marked * are required.'}</p>}
        {showErrors && !isValid && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{ar ? 'راجع الحقول الموضحة أدناه لإكمال الطلب.' : 'Check the highlighted fields below to complete your request.'}</p>}
        {submitError && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{submitError}</p>}
        {submitted && <p role="status" className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground">{ar ? 'تم إرسال الطلب. جارٍ الانتقال إلى المحفظة…' : 'Request submitted. Opening your wallet…'}</p>}
        <div key={step} className={isWizard ? styles.stepBody : "space-y-7"}>
          {isWizard && step === 2 && (
            <dl className={styles.review}>
              {reviewFields.map(field => (
                <div key={field.id}>
                  <dt>{field.label}</dt>
                  <dd dir="auto">{field.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {(!isWizard || step === 0 || (step === 1 && !hasCityField)) && requestLocation}
          {displayedFields.length > 0 && <fieldset disabled={isSubmitting} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <legend className="sr-only">{ar ? "بيانات طلب الخدمة" : "Service request details"}</legend>
            {displayedFields.map((f) => {
              if (f.type === "divider") {
                return (
                  <div key={f.id} className="md:col-span-2">
                    <SectionDivider label={displayCopy(f.label)} />
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
                      <SectionDivider label={displayCopy(f.section)} />
                    </div>
                  )}
                  {f.type === "file" || f.type === "terms" || f.type === "checkbox" ? (
                    <div className={`space-y-2 ${span}`}>
                      {f.type === "file" && (
                        <label id={`${fieldId(f)}-label`} htmlFor={fieldId(f)} className={labelClass}>
                          {displayCopy(f.label)}
                          {f.required ? " *" : ""}
                        </label>
                      )}
                      {renderFieldControl(f)}
                      {hasError(f) && <p id={`${fieldId(f)}-error`} className="text-sm text-destructive">{validationErrors[f.id]}</p>}
                    </div>
                  ) : (
                    <div className={`space-y-2 ${span}`}>
                      <label id={`${fieldId(f)}-label`} htmlFor={fieldId(f)} className={labelClass}>
                        {displayCopy(f.label)}
                        {f.required ? " *" : ""}
                      </label>
                      {renderFieldControl(f)}
                      {hasError(f) && (
                        <p id={`${fieldId(f)}-error`} className="text-sm text-destructive">{validationErrors[f.id]}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>}
        </div>

        {/* Price Summary */}
        {!isWizard && showPriceSummary && serviceField && (
          <motion.div
            key={selectedService}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="calm-panel p-3 sm:p-6 rounded-2xl bg-muted border border space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-muted-foreground">{ar ? "سعر الخدمة التقديري" : "Estimated service price"}</span>
              <span className="text-lg font-bold text-foreground">
                {price !== null
                  ? quantity > 1
                    ? <><SaudiRiyalAmount amount={price * quantity} locale="ar-SA" /> <span className="text-xs text-muted-foreground dark:text-slate-500">({quantity} × {price.toLocaleString("ar-SA")})</span></>
                    : <SaudiRiyalAmount amount={price} locale="ar-SA" />
                  : <span className="text-sm text-muted-foreground">{ar ? "يحدد بعد المراجعة" : "Confirmed after review"}</span>
                }
              </span>
            </div>
            {price !== null && settings.taxPercentage > 0 && (
              <div className="flex justify-between items-center border-t border pt-3">
                <span className="text-sm text-muted-foreground">{ar ? "شامل ضريبة" : "Including tax"} {settings.taxPercentage}%</span>
                <span className="text-sm font-black text-slate-600">
                  <SaudiRiyalAmount amount={price * quantity * (1 + settings.taxPercentage / 100)} locale="ar-SA" />
                </span>
              </div>
            )}
            <p className="text-[9px] font-bold text-muted-foreground dark:text-slate-400 leading-relaxed uppercase tracking-wider">
              {ar ? "* يحدد الفريق السعر النهائي بعد مراجعة الطلب." : "* Our team confirms the final price after reviewing your request."}
            </p>
          </motion.div>
        )}

        {/* Submit */}
        {isWizard ? (
          <div className={styles.actions}>
            {step > 0 && (
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => {
                setSubmitError(null);
                moveTo(step - 1);
              }}>{ar ? "السابق" : "Back"}</Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />}
              {step === 0 ? (ar ? "أكمل التفاصيل" : "Continue to details")
                : step === 1 ? (ar ? "راجع الطلب" : "Review request")
                : !isAuthenticated ? (ar ? "سجّل الدخول للإرسال" : "Sign in to submit")
                : (ar ? "إرسال الطلب" : "Submit request")}
            </Button>
          </div>
        ) : renderActions ? (
          renderActions({ submit, isSubmitting, isValid })
        ) : (
          <div className="pt-4 space-y-4">
            <motion.button
              whileTap={!reduceMotion && isValid && !isSubmitting ? { scale: 0.99 } : {}}
              type="submit"
              disabled={isSubmitting}
              className={`service-submit flex w-full min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                !isSubmitting
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
                  : "bg-muted text-muted-foreground cursor-not-allowed border border-border"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {isSubmitting
                  ? <><Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" /><span>{submitted ? (ar ? "تم الإرسال" : "Submitted") : (ar ? "جاري المعالجة..." : "Submitting...")}</span></>
                  : <><span>{ar ? "إرسال طلب الخدمة" : "Submit service request"}</span><ArrowLeft className="w-4 h-4 rotate-180" /></>
                }
              </div>
            </motion.button>
            <p className="text-center text-[9px] font-bold text-muted-foreground dark:text-slate-400 tracking-widest uppercase">
              {ar ? "سيتم الرد على طلبكم خلال 24 ساعة عمل" : "We aim to respond within 24 business hours"}
            </p>
          </div>
        )}
      </form>
      {isWizard && (
        <aside className={styles.summary} aria-labelledby={`${formId}-summary`}>
          <h2 id={`${formId}-summary`}>{ar ? "ملخص الطلب" : "Request summary"}</h2>
          <p className={styles.summaryTitle}>{requestTitle}</p>
          <dl>
            <div><dt>{ar ? "الخطوة الحالية" : "Current step"}</dt><dd>{steps[step]}</dd></div>
            {selectedLabel && <div><dt>{steps[0]}</dt><dd dir="auto">{selectedLabel}</dd></div>}
            {cityLabel && <div><dt>{ar ? "المدينة" : "City"}</dt><dd dir="auto">{cityLabel}</dd></div>}
            {quantityField && <div><dt>{ar ? "الكمية" : "Quantity"}</dt><dd>{quantity}</dd></div>}
            <div><dt>{ar ? "طريقة التنفيذ" : "Delivery mode"}</dt><dd>{deliveryOptions[["any", "online", "in_person"].indexOf(requestedDeliveryMode)]}</dd></div>
            {showPriceSummary && (
              <div>
                <dt>{ar ? "السعر التقديري" : "Estimated price"}</dt>
                <dd>{price !== null
                  ? <SaudiRiyalAmount amount={price * quantity} locale={ar ? "ar-SA" : "en-SA"} />
                  : (ar ? "يحدد بعد المراجعة" : "Confirmed after review")}</dd>
              </div>
            )}
            {showPriceSummary && price !== null && settings.taxPercentage > 0 && (
              <div>
                <dt>{ar ? "شامل الضريبة" : "Including tax"} ({settings.taxPercentage}%)</dt>
                <dd><SaudiRiyalAmount amount={price * quantity * (1 + settings.taxPercentage / 100)} locale={ar ? "ar-SA" : "en-SA"} /></dd>
              </div>
            )}
          </dl>
          {showPriceSummary && price !== null && (
            <p className={styles.priceNote}>{ar ? "يحدد الفريق السعر النهائي بعد مراجعة الطلب." : "Our team confirms the final price after reviewing your request."}</p>
          )}
        </aside>
      )}
    </div>
  );
}
