"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUp,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Wrench,
  Building2,
  FileSearch,
  Compass,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { safeNavigateBack } from "@/lib/redesign-chat11-content";

interface CapabilityItem {
  icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  textAr: string;
  textEn: string;
  pointsAr: string[];
  pointsEn: string[];
}

const capabilities: CapabilityItem[] = [
  {
    icon: Wallet,
    titleAr: "المحفظة والمالية",
    titleEn: "Wallet & Financials",
    textAr: "تبدأ الدورة بضبط التعاملات؛ حيث تغطي المحفظة الفواتير، والعمولات، والملفات، والاستثمارات، مما يتيح للمستفيدين تتبع الحركة المالية والتدفقات النقدية بدقة ووضوح.",
    textEn: "The transaction lifecycle begins with verified financial governance: invoices, commissions, escrow documents, and property investments, enabling transparent cash flow tracking.",
    pointsAr: ["فواتير", "عمولات", "مستندات", "استثمارات"],
    pointsEn: ["Invoices", "Commissions", "Documents", "Investments"],
  },
  {
    icon: Wrench,
    titleAr: "منظومة الخدمات العقارية",
    titleEn: "Professional Real Estate Services",
    textAr: "توفر المنصة للمستفيدين منظومة متكاملة تشمل خدمات ما بعد الشراء، والخدمات القانونية، والبناء والمقاولات، وخدمات التسويق، وغيرها، مع إتاحة تسعير مستقل ومحدد لكل خدمة.",
    textEn: "Comprehensive professional service ecosystem encompassing post-purchase assistance, legal consulting, contracting and construction, and verified marketing with independent pricing per service.",
    pointsAr: ["خدمات ما بعد الشراء", "الخدمات القانونية", "البناء والمقاولات", "خدمات التسويق", "أخرى"],
    pointsEn: ["After-sales", "Legal services", "Construction", "Marketing", "Other"],
  },
  {
    icon: Building2,
    titleAr: "إدارة وطرح العروض",
    titleEn: "Property Offers & Listings",
    textAr: "وفي الجانب العقاري التفاعلي، يتيح النظام للمستفيدين طرح عروضهم العقارية لتجمعها المنصة وتيسر إدارتها في مسار موحد، يسهل من خلاله متابعة حالة العرض، والتواصل اللحظي، وحفظ الملفات المرتبطة به.",
    textEn: "An interactive property marketplace enabling users to publish, manage, and track real estate offers within a unified pipeline with instant communication and verified records.",
    pointsAr: ["إضافة عروض", "إدارة العروض", "ملاحظات وتعديل", "تواصل مرن ولحظي"],
    pointsEn: ["Create offers", "Offer management", "Notes & revisions", "Real-time chat"],
  },
  {
    icon: FileSearch,
    titleAr: "طلبات الشراء والاستئجار",
    titleEn: "Property Requests & Inquiries",
    textAr: "تمكن المنصة المستفيدين من تقديم طلباتهم العقارية بدقة، لتتولى المنصة فلترتها ومطابقتها ذكياً مع العروض المتاحة، تسريعاً لعملية التنفيذ وإتمام الصفقات.",
    textEn: "Targeted property requisition system that accurately captures buyer/renter requirements, intelligently matching them against verified listings for faster transaction closing.",
    pointsAr: ["إضافة طلبات", "متابعة حالة الطلب", "مطابقة ذكية", "أرشيف الطلبات"],
    pointsEn: ["Submit requests", "Status tracking", "Smart matching", "Request archive"],
  },
];

function CommandRoom({ reduceMotion, isRtl }: { reduceMotion: boolean; isRtl: boolean }) {
  const { settings } = useSettings();
  const logoSrc = settings.isDark
    ? settings.logoWhiteUrl || "/icons/white.png"
    : settings.logoBlackUrl || "/icons/black.png";

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:px-12 sm:py-10">
      <div className="calm-panel relative overflow-hidden rounded-[1.75rem] border border-border dark:border-white/10 bg-card/[0.028] p-4 shadow-sm dark:shadow-2xl shadow-black/30 [contain:paint] sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_40%),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_100%,44px_44px,44px_44px] opacity-70" />

        {!reduceMotion && (
          <>
            <motion.div
              initial={{ y: "-120%", opacity: 0 }}
              whileInView={{ y: "340%", opacity: [0, 0.7, 0] }}
              viewport={{ once: false }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="motion-reduce:hidden absolute left-[14%] top-0 h-24 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent [will-change:transform,opacity]"
            />
            <motion.div
              initial={{ x: isRtl ? "-140%" : "140%" }}
              whileInView={{ x: isRtl ? "260%" : "-260%" }}
              viewport={{ once: false }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="motion-reduce:hidden absolute top-[48%] h-px w-1/2 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent [will-change:transform]"
            />
          </>
        )}

        <div className="relative grid gap-8 lg:gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-6 w-full min-w-0"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              <Compass className="w-3.5 h-3.5" />
              <span>{isRtl ? "البنية التقنية للبيانات العقارية" : "Real Estate Intelligence Engine"}</span>
            </div>
            <h2 className="text-xl font-black leading-[1.4] text-foreground dark:text-white sm:text-2xl lg:text-3xl">
              {isRtl
                ? "تجربة رقمية موحدة تجمع بين الخرائط الذكية ومسح الأحياء المدعوم بالذكاء الاصطناعي."
                : "A unified digital experience combining smart maps and AI-assisted district scanning."}
            </h2>
            <p className="w-full max-w-2xl text-xs sm:text-sm font-bold leading-relaxed text-muted-foreground dark:text-white/70">
              {isRtl
                ? "هنا تكمن كفاءة المنصة؛ حيث تبدأ العملية بمسح الحي جغرافياً، ليقوم النظام بتحليل البيانات وتحويلها إلى مسار متكامل يشمل الخرائط التفاعلية والتقارير الفنية المؤتمتة لدعم اتخاذ القرار."
                : "Platform efficiency begins with geographical district scanning. The system processes spatial parameters into an integrated pipeline of interactive maps and automated technical reports to support decisive actions."}
            </p>
          </motion.div>

          <div className="calm-panel relative min-h-[320px] overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-background/80 dark:bg-slate-950/80 p-4 sm:p-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:46px_46px] opacity-40" />

            <div
              className={`absolute h-[260px] w-[260px] rounded-full border border-dashed border-border dark:border-white/15 ${
                reduceMotion ? "" : "animate-[spin_60s_linear_infinite]"
              }`}
            />
            <div
              className={`absolute h-40 w-40 rounded-full border border-amber-500/20 bg-amber-500/5 ${
                reduceMotion ? "" : "animate-pulse"
              }`}
            />

            <div className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full border border-border dark:border-white/10 bg-background/90 dark:bg-slate-950/90 shadow-[0_0_35px_rgba(197,168,128,0.2)] backdrop-blur-xl">
              <div className="relative w-20 h-20">
                <Image
                  src={logoSrc}
                  alt={isRtl ? "شعار المنصة" : "Platform Logo"}
                  fill
                  sizes="80px"
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { settings } = useSettings();
  const isRtl = language === "ar";
  const reduceMotion = Boolean(useReducedMotion());

  const { scrollYProgress } = useScroll();
  const backgroundShift = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -80]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 600);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logoSrc = useMemo(() => {
    return settings.isDark
      ? settings.logoWhiteUrl || "/icons/white.png"
      : settings.logoBlackUrl || "/icons/black.png";
  }, [settings.isDark, settings.logoWhiteUrl, settings.logoBlackUrl]);

  const handleBack = () => {
    safeNavigateBack(router, "/");
  };

  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  const handleScrollDown = () => {
    window.scrollTo({
      top: typeof window !== "undefined" ? window.innerHeight : 800,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  };

  return (
    <main
      className="calm-page calm-screen min-h-screen overflow-x-hidden bg-background dark:bg-slate-950 text-foreground dark:text-white"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progressScale, transformOrigin: isRtl ? "right" : "left" }}
        className="fixed inset-x-0 top-0 z-[60] h-1 bg-gradient-to-r from-amber-500 via-blue-500 to-indigo-500 [will-change:transform] shadow-[0_0_12px_rgba(197,168,128,0.5)]"
      />

      {/* Subtle architectural ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          style={{ y: backgroundShift }}
          className="calm-decoration absolute right-[6%] top-[10%] h-[36rem] w-[36rem] rounded-full bg-blue-600/10 blur-[90px] [will-change:transform]"
        />
        <motion.div
          style={{ y: backgroundShift }}
          className="calm-decoration absolute bottom-[12%] left-[8%] h-[42rem] w-[42rem] rounded-full bg-amber-600/10 blur-[100px] [will-change:transform]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:76px_76px] opacity-25 [mask-image:radial-gradient(circle_at_top,black,transparent_75%)]" />
      </div>

      {/* Floating scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={handleScrollTop}
          aria-label={isRtl ? "العودة للأعلى" : "Scroll to top"}
          className={`fixed bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border dark:border-white/12 bg-background/90 dark:bg-slate-950/90 text-foreground dark:text-white shadow-lg backdrop-blur-xl transition-transform hover:scale-105 active:scale-95 ${
            isRtl ? "left-6" : "right-6"
          }`}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Hero Header Section */}
      <section className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-10 px-4 pb-14 pt-24 sm:px-8 lg:px-12 lg:pt-32">
        <div className="absolute top-24 sm:top-28 z-20">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border dark:border-white/10 bg-muted/80 dark:bg-white/5 px-4 text-xs font-black text-muted-foreground dark:text-white/75 transition-all hover:bg-muted hover:dark:bg-white/10 hover:text-foreground hover:dark:text-white backdrop-blur-md shadow-sm"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? "العودة" : "Go Back"}
          </button>
        </div>

        <div className="space-y-8 text-center max-w-4xl mx-auto mt-12">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {isRtl ? "الوساطة الرقمية السعودية" : "Saudi Digital Brokerage"}
            </div>

            <h1 className="text-3xl font-black leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl drop-shadow-sm text-foreground dark:text-white">
              {isRtl ? "من نحن" : "About Us"}
            </h1>

            <p className="mx-auto max-w-4xl text-sm font-bold leading-loose text-foreground/80 dark:text-white/80 sm:text-base">
              {isRtl ? (
                <>
                  نحن منصة &quot;الوساطة الرقمية&quot; منصة سعودية متخصصة في قطاع تكنولوجيا العقار انطلقنا لنقدم نموذجاً متطوراً يجمع بين الحلول التقنية المبتكرة والالتزام بالأنظمة، حيث نوفر بيئة رقمية متكاملة لخدمات الوساطة وإدارة العقارات، تهدف إلى تسهيل التعاملات العقارية، وتسريع إجراءاتها، ورفع كفاءتها، بما يضمن حقوق جميع الأطراف ويوفر تجربة مستخدم آمنة وموثوقة.
                  <br /><br />
                  ونعتمد في أعمالنا على بنية تحتية تقنية متقدمة تحمي البيانات وتضمن سرية المعلومات، مع التزامنا الكامل باللوائح والتشريعات التي تنظم القطاع العقاري في المملكة العربية السعودية، لنكون الشريك الرقمي الموثوق في تطوير التعاملات العقارية وتنظيمها.
                </>
              ) : (
                <>
                  We are &quot;Digital Brokerage&quot;, a Saudi platform specializing in property technology. We launched to provide an advanced model merging innovative digital solutions with strict regulatory compliance. We deliver a cohesive ecosystem for real estate brokerage and property operations, designed to accelerate transaction workflows and uphold operational integrity for all participants.
                  <br /><br />
                  Our engineering foundation safeguards sensitive transactional data and adheres strictly to the regulatory statutes established across the Kingdom of Saudi Arabia, positioning our platform as a dependable digital partner in real estate governance.
                </>
              )}
            </p>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleScrollDown}
            aria-label={isRtl ? "التمرير للأسفل" : "Scroll down"}
            className="flex flex-col items-center gap-2 text-muted-foreground dark:text-white/50 hover:text-amber-600 hover:dark:text-amber-400 transition-colors group cursor-pointer"
          >
            <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1">
              <div className="h-2 w-1 rounded-full bg-current animate-bounce" />
            </div>
            <span className="text-[10px] font-black tracking-[0.2em] opacity-80 group-hover:opacity-100">
              {isRtl ? "اكتشف" : "Discover"}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </section>

      {/* Intelligence & Map Architecture */}
      <CommandRoom reduceMotion={reduceMotion} isRtl={isRtl} />

      {/* Operational Capabilities Grid */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:py-20 sm:px-8 lg:px-12">
        <div className="mb-12 space-y-4 max-w-3xl">
          <h2 className="text-2xl font-black leading-[1.4] text-foreground dark:text-white sm:text-3xl lg:text-4xl">
            {isRtl
              ? "كل جزء في المنصة يخدم قراراً أو إجراءً داخل الرحلة العقارية."
              : "Every platform component powers a concrete decision in the real estate journey."}
          </h2>
          <p className="text-xs sm:text-sm font-bold leading-loose text-muted-foreground dark:text-white/70">
            {isRtl
              ? "صُممت المنصة لتكامل أقسامها وترابطها، بما يضمن ربط كافة الإجراءات والعمليات بسياقها التنظيمي داخل النظام، لتوفير تجربة شاملة تمكّن المستفيدين عبر المسارات التالية:"
              : "Built for systemic cohesion, our architecture connects every procedure directly to its verifiable regulatory record across four primary functional pillars:"}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.article
                key={item.titleEn}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-[1.25rem] border border-border dark:border-white/10 bg-card/[0.03] p-5 sm:p-7 transition-all duration-300 hover:border-amber-500/30 hover:bg-card/[0.06] hover:shadow-lg [will-change:transform]"
              >
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border dark:border-white/10 bg-muted/60 dark:bg-white/5 text-amber-600 dark:text-amber-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground dark:text-white/40 tracking-widest font-mono">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-foreground dark:text-white">
                  {isRtl ? item.titleAr : item.titleEn}
                </h3>
                <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed text-muted-foreground dark:text-white/65">
                  {isRtl ? item.textAr : item.textEn}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {(isRtl ? item.pointsAr : item.pointsEn).map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-border dark:border-white/10 bg-muted/50 dark:bg-white/5 px-3 py-1 text-[11px] font-bold text-foreground/80 dark:text-white/70"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* Bottom Mission Section */}
      <section className="relative px-4 pb-28 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-20px" }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
          className="calm-panel relative mx-auto overflow-hidden rounded-[1.5rem] border border-border dark:border-white/10 bg-card/40 dark:bg-slate-950/50 p-6 text-center sm:p-14 shadow-lg backdrop-blur-xl max-w-7xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <h2 className="relative z-10 mx-auto max-w-4xl text-2xl font-black leading-[1.4] text-foreground dark:text-white sm:text-3xl lg:text-4xl">
            {isRtl
              ? "هدفنا أن تكون كل خطوة عقارية قابلة للفهم، المتابعة، والتوثيق."
              : "Our objective: make every real estate step transparent, trackable, and documented."}
          </h2>
          <p className="relative z-10 mx-auto mt-6 max-w-3xl text-xs sm:text-sm font-bold leading-loose text-muted-foreground dark:text-white/75">
            {isRtl
              ? "تجمع الوساطة الرقمية الأدوات التي يحتاجها المستفيد ومقدم الخدمة في منصة واحدة؛ لتتحول العملية العقارية من إجراءات متفرقة إلى تجربة تشغيل واضحة ومتكاملة."
              : "Digital Brokerage consolidates the verified toolsets required by both clients and licensed practitioners, transforming disparate procedures into an integrated operational workflow."}
          </p>

          <div className="relative z-10 mx-auto mt-10 flex justify-center">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36">
              <Image
                src={logoSrc}
                alt={isRtl ? "شعار المنصة" : "Platform Logo"}
                fill
                sizes="(max-width: 640px) 112px, 144px"
                className="object-contain"
              />
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
