// app/service-form/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, CheckCircle2, ChevronLeft, Calendar, Clock, Hash } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/context/SettingsContext";
import { motion, AnimatePresence, Variants } from "framer-motion";
import LegalRequestFlow from "@/components/legal/LegalRequestFlow";
import { toast } from "react-hot-toast";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

type ServiceType = "postPurchase" | "legal" | "construction" | "marketing" | "leasing" | "visit" | "other";

const serviceCategoryMap = {
  postPurchase: "postPurchase", legal: "legal", construction: "construction",
  marketing: "marketing", leasing: "leasing", visit: "visit", other: "other",
} as const;

const serviceConfig: Record<ServiceType, { title: string; description: string; index: string }> = {
  postPurchase:  { title: "خدمات ما بعد الشراء",      description: "نقدم لك حلولاً متكاملة للعناية بمنزلك وتجهيزه بأفضل المعايير.", index: "01" },
  legal:         { title: "الخدمات القانونية",          description: "حلول قانونية احترافية مدعومة بفريق من الخبراء لضمان حقوقك العقارية.", index: "02" },
  construction:  { title: "خدمات البناء والمقاولات",   description: "خبرة متكاملة في البناء، التشطيب، والإشراف الهندسي.", index: "03" },
  marketing:     { title: "خدمات التسويق العقاري",     description: "نبرز جمال عقارك بأحدث تقنيات التصوير والحملات الجذابة.", index: "04" },
  leasing:       { title: "خدمات التأجير والإدارة",    description: "إدارة ذكية لعقودك وتحصيل إيجاراتك بكل يسر وأمان.", index: "05" },
  visit:         { title: "طلب زيارة العقار",          description: "خدمات ميدانية لمعاينة العقار، تصويره، أو استلام تقارير مفصلة عنه.", index: "06" },
  other:         { title: "خدمات أخرى",                description: "خدمات استشارية وتقييمية شاملة تلبي كافة احتياجاتك العقارية.", index: "07" },
};

const serviceOptions: Record<ServiceType, string[]> = {
  postPurchase: ["الغاز", "نقل وتركيب الأثاث", "التأمين على المنزل", "الصيانة (سباكة / كهرباء)", "خدمة التنظيف", "تنسيق حدائق", "أنظمة أمنية", "أخرى"],
  legal: [],
  construction: ["مقاول عظم", "تصميم هندسي", "تشطيبات", "كهرباء", "سباكة", "نجارة", "دهانات", "ألمنيوم", "إشراف هندسي", "تصميم داخلي", "أخرى"],
  marketing: ["تصوير فوتوغرافي للعقار", "حملة إعلانية (وسائل التواصل الاجتماعي)", "حملة إعلانية (إعلانات طرق/تقليدية)", "أخرى"],
  leasing: ["تأجير العقار", "إدارة عقود الإيجار", "تحصيل الإيجارات", "أخرى"],
  visit: ["زيارة شخصية", "زيارة بالنيابة", "تصوير العقار", "تقرير مفصل", "جولة مع الوكيل", "أخرى"],
  other: ["التقييم العقاري", "المسح الهندسي",  "أخرى"],
};

// Premium white background inputs
const inputClass = "w-full h-13 bg-white border border-slate-200 hover:border-slate-350 focus:border-slate-400 focus:ring-2 focus:ring-slate-950/5 rounded-2xl px-5 text-slate-900 text-sm font-bold placeholder:text-slate-900 focus:outline-none transition-all duration-200 shadow-sm";
const labelClass = "text-[9px] font-black text-slate-900 uppercase tracking-[0.22em] mb-2 block";

const sectionDivider = (label: string) => (
  <div className="flex items-center gap-4 py-1">
    <div className="h-px flex-1 bg-slate-200" />
    <span className="text-[8px] font-black text-slate-900 uppercase tracking-[0.3em]">{label}</span>
    <div className="h-px flex-1 bg-slate-200" />
  </div>
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, duration: 0.4 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

function ServiceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();
  const { settings } = useSettings();
  const serviceType = (searchParams.get("type") || "postPurchase") as ServiceType;
  const legalCategory = searchParams.get("category");
  const config = serviceConfig[serviceType];

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

  // Look up price from global settings
  const getServicePrice = (service: string): number | null => {
    if (!service || service === "أخرى") return null;
    const key = `service_price_${serviceType}_${service}`.replace(/\s+/g, '_').toLowerCase();
    const price = settings.servicePrices[key];
    return price !== undefined ? price : null;
  };

  const [formData, setFormData] = useState({
    name: "", phone: "", city: "", district: "",
    service: "", otherService: "", quantity: "1", description: "",
    propertyId: "", appointmentDate: "", appointmentTime: "",
    visitPhotographyType: "", // "video" | "live"
    termsAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : prev.name,
        phone: user.phone || prev.phone,
        city: user.city || prev.city,
        district: user.district || prev.district,
      }));
    }
  }, [user, isAuthenticated]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    formData.name.trim() && formData.phone.trim() && formData.city.trim() && formData.district.trim() &&
    (serviceType === "legal" ? true :
      serviceType === "marketing" ? (formData.propertyId && formData.appointmentDate && formData.appointmentTime) :
      serviceType === "visit" && formData.service === "تصوير العقار" ? (formData.service.trim() && formData.visitPhotographyType) :
      formData.service.trim()) &&
    formData.quantity.trim() && formData.termsAccepted;

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      toast.error("يجب الموافقة على الشروط والأحكام");
      return;
    }
    if (!isFormValid) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading("جاري إرسال طلبك...");

    try {
      let finalDescription = formData.description;
      if (serviceType === "marketing") {
        finalDescription = `[Photography Schedule]\nProperty ID: ${formData.propertyId}\nDate: ${formData.appointmentDate}\nTime: ${formData.appointmentTime}\n---\nNotes: ${formData.description}`;
      }
      if (serviceType === "visit" && formData.service === "تصوير العقار") {
        finalDescription = `[Photography Type: ${formData.visitPhotographyType === 'video' ? 'Video' : 'Live'}]\n---\n${formData.description}`;
      }

      const requestData = {
        category: serviceCategoryMap[serviceType],
        serviceType: formData.service === "أخرى" ? formData.otherService : (formData.service || (serviceType === "marketing" ? "Photography Session" : "")),
        clientName: formData.name,
        phone: formData.phone,
        city: formData.city,
        district: formData.district,
        quantity: parseInt(formData.quantity || "1"),
        description: finalDescription || undefined,
        userId: user?.id || undefined,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(requestData),
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

      toast.success("تم إنشاء طلب الخدمة بنجاح، سيقوم الفريق بالمراجعة والرد عليك قريباً", { id: loadingToast, duration: 4000 });
      setTimeout(() => router.push("/wallet"), 4000);
    } catch (err: any) {
      toast.error("حدث خطأ أثناء إرسال الطلب", { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (


    <section className="w-full min-h-screen bg-slate-45 text-slate-950 flex flex-col font-sans overflow-x-hidden selection:bg-slate-200" dir="rtl">

      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-10"
      >
        <button
          onClick={() => router.push("/services")}
          className="group flex items-center gap-3 text-slate-500 hover:text-slate-950 transition-colors text-[10px] font-black uppercase tracking-[0.25em]"
        >
          <div className="w-8 h-8 rounded-full border border-slate-200 group-hover:border-slate-400 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </div>
          العودة للخدمات
        </button>
      </motion.div>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-12 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 font-mono">{config.index}</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] leading-[0.9] text-slate-950 mb-4">{config.title}</h1>
          <p className="text-slate-600 text-sm max-w-md leading-relaxed">{config.description}</p>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-24">
        {/* Legal Flow */}
        {serviceType === "legal" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <LegalRequestFlow initialCategory={legalCategory} onBackToSelection={() => router.push("/services/legal")} />
          </motion.div>
        )}

        {/* Standard Form */}
        {serviceType !== "legal" && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative bg-white border border-slate-200 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden shadow-sm"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

            <div className="relative space-y-7">
              {/* Personal Info */}
              <motion.div variants={itemVariants}>{sectionDivider("البيانات الشخصية")}</motion.div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { label: "الاسم بالكامل", field: "name", placeholder: "الاسم الثلاثي أو الرباعي", dir: "rtl" },
                  { label: "رقم الجوال",    field: "phone", placeholder: "05xxxxxxxx",               dir: "ltr" },
                  { label: "المدينة",        field: "city",  placeholder: "اسم المدينة",               dir: "rtl" },
                  { label: "الحي",           field: "district", placeholder: "اسم الحي السكني",       dir: "rtl" },
                ].map(f => (
                  <motion.div key={f.field} variants={itemVariants} className="space-y-2">
                    <label className={labelClass}>{f.label}</label>
                    <input
                      className={inputClass}
                      style={{ height: "3.25rem" }}
                      value={(formData as any)[f.field]}
                      onChange={(e) => handleInputChange(f.field, e.target.value)}
                      placeholder={f.placeholder}
                      dir={f.dir}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Service Details */}
              <motion.div variants={itemVariants} className="pt-2">{sectionDivider("تفاصيل الخدمة")}</motion.div>

              {serviceType === "marketing" ? (
                <div className="space-y-5">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className={labelClass}>نوع الخدمة التسويقية</label>
                    <div className="relative">
                      <select className={inputClass + " appearance-none cursor-pointer"} style={{ height: "3.25rem" }} value={formData.service} onChange={(e) => handleInputChange("service", e.target.value)}>
                        {serviceOptions.marketing.map((s, i) => <option key={i} value={s} className="bg-white text-slate-900">{s}</option>)}
                      </select>
                      <ChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 -rotate-90 text-slate-400 pointer-events-none" />
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: "كود الوحدة (PRP)", field: "propertyId", icon: Hash, type: "text", placeholder: "PRP-X" },
                      { label: "تاريخ الجلسة", field: "appointmentDate", icon: Calendar, type: "date", placeholder: "" },
                      { label: "وقت الجلسة", field: "appointmentTime", icon: Clock, type: "time", placeholder: "" },
                    ].map(f => (
                      <motion.div key={f.field} variants={itemVariants} className="space-y-2">
                        <label className={labelClass}>{f.label}</label>
                        <div className="relative">
                          <f.icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          <input type={f.type} className={inputClass + " pr-10"} style={{ height: "3.25rem" }} value={(formData as any)[f.field]} onChange={(e) => handleInputChange(f.field, e.target.value)} placeholder={f.placeholder} dir="ltr" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className={labelClass}>نوع الخدمة المطلوبة</label>
                    <div className="relative">
                      <select className={inputClass + " appearance-none cursor-pointer"} style={{ height: "3.25rem" }} value={formData.service} onChange={(e) => handleInputChange("service", e.target.value)}>
                        <option value="" disabled className="bg-white text-slate-900">اختر من القائمة...</option>
                        {serviceOptions[serviceType].map((s, i) => <option key={i} value={s} className="bg-white text-slate-900">{s}</option>)}
                      </select>
                      </div>
                  </motion.div>
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className={labelClass}>الكمية / العدد</label>
                    <input type="number" className={inputClass} style={{ height: "3.25rem" }} value={formData.quantity} onChange={(e) => handleInputChange("quantity", e.target.value)} min="1" />
                  </motion.div>
                  {formData.service === "أخرى" && (
                    <motion.div variants={itemVariants} className="space-y-2 md:col-span-2 animate-in slide-in-from-top-2 duration-300">
                      <label className={labelClass}>اكتب نوع الخدمة المطلوبة</label>
                      <input
                        type="text"
                        className={inputClass}
                        style={{ height: "3.25rem" }}
                        value={formData.otherService}
                        onChange={(e) => handleInputChange("otherService", e.target.value)}
                        placeholder="ما هي الخدمة التي تحتاجها؟"
                      />
                    </motion.div>
                  )}
                </div>
              )}

              {/* Visit Photography Type Conditional */}
              {serviceType === "visit" && formData.service === "تصوير العقار" && (
                <motion.div variants={itemVariants} className="space-y-2">
                    <label className={labelClass}>نوع التصوير</label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: 'video', label: 'فيديو' },
                            { id: 'live', label: 'لايف' }
                        ].map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => handleInputChange("visitPhotographyType", opt.id)}
                                className={`flex items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${
                                    formData.visitPhotographyType === opt.id
                                    ? "bg-slate-950 text-white border-slate-950"
                                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                                }`}
                            >
                                <span className="font-black text-sm">{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
              )}

              {/* Notes */}
              <motion.div variants={itemVariants} className="space-y-2 pt-2">
                <label className={labelClass}>تفاصيل وملاحظات</label>
                <textarea
                  className={inputClass + " h-28 py-4 resize-none"}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="اشرح لنا حاجتك بالتفصيل..."
                />
              </motion.div>

              {/* Price Summary */}
              {formData.service && formData.service !== "أخرى" && (() => {
                const price = getServicePrice(formData.service);
                const qty = parseInt(formData.quantity || "1") || 1;
                return (
                  <motion.div
                    key={formData.service}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">سعر الخدمة التقديري</span>
                      <span className="text-xl font-black text-slate-950">
                        {price !== null
                          ? qty > 1
                            ? <><SaudiRiyalAmount amount={price * qty} locale="ar-SA" /> <span className="text-xs text-slate-500">({qty} × {price.toLocaleString('ar-SA')})</span></>
                            : <SaudiRiyalAmount amount={price} locale="ar-SA" />
                          : <span className="text-sm text-slate-500">يحدد بعد المراجعة</span>
                        }
                      </span>
                    </div>
                    {price !== null && settings.taxPercentage > 0 && (
                      <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                        <span className="text-[9px] font-black text-slate-400 uppercase">شامل ضريبة {settings.taxPercentage}%</span>
                        <span className="text-sm font-black text-slate-600">
                          <SaudiRiyalAmount amount={(price * qty) * (1 + settings.taxPercentage / 100)} locale="ar-SA" />
                        </span>
                      </div>
                    )}
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">
                      * سيتم تحديد السعر النهائي بدقة من قبل الفريق المختص بعد مراجعة الطلب.
                    </p>
                  </motion.div>
                );
              })()}

              {/* Terms Toggle — same white/[0.03] bg-white flip as other UI */}
              <motion.div variants={itemVariants} className="pt-2">
                <div
                  onClick={() => handleInputChange("termsAccepted", !formData.termsAccepted)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${
                    formData.termsAccepted
                      ? "bg-slate-100 text-slate-950 border-slate-300"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${formData.termsAccepted ? "border-slate-950 bg-slate-950" : "border-slate-300"}`}>
                    <CheckCircle2 className={`w-3.5 h-3.5 transition-opacity ${formData.termsAccepted ? "text-white opacity-100" : "opacity-0"}`} />
                  </div>
                  <div>
                    <p className={`text-[10px] font-medium mt-0.5 ${formData.termsAccepted ? "text-slate-700" : "text-slate-600"}`}>
                      أوافق على{' '}
                      <a
                        href="/info?tab=usage"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`underline underline-offset-2 decoration-dotted hover:decoration-solid transition-all duration-150 ${
                          formData.termsAccepted ? "text-slate-700 hover:opacity-80" : "text-slate-600 hover:text-slate-950"
                        }`}
                      >
                        سياسة الاستخدام
                      </a>
                      {' '}و{' '}
                      <a
                        href="/info?tab=terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`underline underline-offset-2 decoration-dotted hover:decoration-solid transition-all duration-150 ${
                          formData.termsAccepted ? "text-slate-700 hover:opacity-80" : "text-slate-600 hover:text-slate-950"
                        }`}
                      >
                        الشروط والأحكام
                      </a>
                      {' '}ومعالجة البيانات المدخلة.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Submit CTA */}
              <motion.div variants={itemVariants} className="pt-4 space-y-4">
                <motion.button
                  whileTap={isFormValid && !isSubmitting ? { scale: 0.99 } : {}}
                  disabled={!isFormValid || isSubmitting}
                  onClick={handleSubmit}
                  className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest transition-all duration-300 ${
                    isFormValid && !isSubmitting
                      ? "bg-slate-950 text-white hover:bg-slate-800 shadow-sm"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
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
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default function ServiceForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl border border-slate-200 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        </div>
      </div>
    }>
      <ServiceFormContent />
    </Suspense>
  );
}
