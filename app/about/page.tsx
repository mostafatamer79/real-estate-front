"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUp,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  FileText,
  Headphones,
  Layers3,
  MapPinned,
  Megaphone,
  MessageSquare,
  Mouse,
  Scale,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

const platformStats = [
  { value: "AI", label: "مسح الخريطة وتحليل الموقع" },
  { value: "360", label: "رحلة عقارية مترابطة" },
  { value: "24/7", label: "متابعة رقمية للطلبات" },
  { value: "2026", label: "منصة تشغيل حديثة" },
];

const capabilities = [
  {
    icon: MapPinned,
    title: "الخريطة والماسح الذكي",
    eyebrow: "AI Scanner Map",
    text: "تساعد الخريطة في قراءة المناطق، استعراض نطاقات العمل، إصدار التقارير، وتقديم صورة أوضح عن الموقع قبل اتخاذ القرار.",
    points: ["مسح مناطق", "تقارير قابلة للتسعير", "فتح وإغلاق نطاقات", "تحليل موقع العقار"],
  },
  {
    icon: ShoppingBag,
    title: "العروض والطلبات",
    eyebrow: "Offers & Orders",
    text: "تجمع المنصة بين عرض العقارات وإدارة طلبات العملاء في مسار واحد، مع متابعة الحالة والتواصل والملفات المرتبطة بكل عملية.",
    points: ["إضافة عروض", "إدارة طلبات", "ملاحظات وتشغيل", "تواصل مرتبط بالعملية"],
  },
  {
    icon: Wrench,
    title: "الخدمات العقارية",
    eyebrow: "Services",
    text: "توفر المنصة خدمات ما بعد الشراء، البناء والمقاولات، خدمات التسويق، والخدمات الأخرى، مع تسعير مستقل لكل خدمة.",
    points: ["خدمات ما بعد الشراء", "البناء والمقاولات", "خدمات التسويق", "طلبات مخصصة"],
  },
  {
    icon: Scale,
    title: "الخدمات القانونية",
    eyebrow: "Legal",
    text: "تدعم المنصة مسارات قانونية تشمل المنازعات، العقود، التوثيق، والاستشارات أو التقارير القانونية، مع تحويل الطلب للإدارة المختصة.",
    points: ["منازعات", "عقود", "توثيق", "استشارات وتقارير"],
  },
  {
    icon: Wallet,
    title: "المحفظة والمالية",
    eyebrow: "Wallet",
    text: "تغطي المحفظة الفواتير، العمولات، الملفات والمستندات، والاستثمارات، وتساعد الإدارة على متابعة الحركة المالية بوضوح.",
    points: ["فواتير", "عمولات", "مستندات", "استثمارات"],
  },
  {
    icon: Building2,
    title: "إدارة الأملاك",
    eyebrow: "Properties",
    text: "تدعم المنصة إدارة الأملاك وما يرتبط بها من مستأجرين وعقود ومدفوعات وصيانة، لتكون البيانات قابلة للمتابعة من مكان واحد.",
    points: ["أملاك", "مستأجرين", "عقود", "صيانة ومدفوعات"],
  },
];

const operations = [
  { icon: Megaphone, title: "إدارة التسويق", text: "استقبال طلبات التسويق، مراجعة التفاصيل، وتسعير الخدمة حسب الحالة." },
  { icon: Headphones, title: "خدمة العملاء", text: "استقبال الاستفسارات والرد عليها ومتابعة حل المشكلة حتى إغلاقها." },
  { icon: BarChart3, title: "الإحصائيات والاتجاهات", text: "قراءة النشاطات والعمليات والمؤشرات بطريقة تساعد الإدارة على اتخاذ القرار." },
  { icon: SlidersHorizontal, title: "الإعدادات والتحكم", text: "التحكم في مظهر المنصة، الأقسام، الرسائل، الأسعار، وإتاحة الخدمات." },
];

const journey = [
  "يبدأ العميل من الخريطة أو الخدمات أو العروض.",
  "يتم إنشاء طلب واضح بالبيانات والملفات والتفاصيل المطلوبة.",
  "ينتقل الطلب للإدارة المناسبة: عقارية، مالية، قانونية، تسويق أو خدمة عملاء.",
  "تتم المتابعة من لوحة الإدارة مع إمكانية الفوترة، الشات، الملاحظات، والتحديثات.",
  "تغلق العملية بسجل قابل للرجوع إليه داخل المنصة.",
];


const fallingSignals = [
  { label: "AI Scanner", left: "7%", delay: 0, duration: 10 },
  { label: "Map Report", left: "19%", delay: 1.7, duration: 12 },
  { label: "Wallet", left: "34%", delay: 0.8, duration: 11 },
  { label: "Legal", left: "53%", delay: 2.4, duration: 13 },
  { label: "Services", left: "69%", delay: 1.1, duration: 10.5 },
  { label: "Orders", left: "86%", delay: 3, duration: 12.5 },
];

const motionRails = [
  { top: "18%", delay: 0, duration: 8 },
  { top: "39%", delay: 1.3, duration: 9.5 },
  { top: "64%", delay: 0.7, duration: 10.5 },
  { top: "82%", delay: 2.2, duration: 8.8 },
];

const commandCards = [
  { icon: MapPinned, label: "مسح ذكي وشامل للأحياء", value: "AI Scanner", side: "right" },
  { icon: FileText, label: "تقارير تحليل وتخطيط جغرافي مؤتمتة", value: "PDF Report", side: "left" },
];

const serviceFlow = [
  { icon: ShoppingBag, title: "العروض", text: "إضافة، مراجعة، إيقاف، ملاحظات، ومتابعة المحادثات." },
  { icon: Wrench, title: "الخدمات", text: "خدمات ما بعد الشراء، قانونية، مقاولات، تسويق، وخدمات أخرى." },
  { icon: Layers3, title: "الإدارات", text: "تسويق، مالية، أملاك، قانونية، عروض وطلبات من مكان واحد." },
  { icon: ShieldCheck, title: "التحكم", text: "صلاحيات، إغلاق وفتح أقسام، أسعار، محتوى، وإعدادات المنصة." },
];

const scannerSteps = [
  { title: "اختيار الموقع", text: "يبدأ العميل من الخريطة أو صفحة التفاصيل ويحدد المنطقة أو العقار المطلوب قراءته." },
  { title: "تحليل ذكي", text: "تتحول البيانات إلى قراءة واضحة تشمل النطاق، نوع الخدمة، قابلية التقرير، والتكلفة المرتبطة." },
  { title: "تقرير ومتابعة", text: "يصدر التقرير ويرتبط بالطلب أو الخدمة حتى تقدر الإدارة تراجعه وتتابع حالته." },
];

const timeline = [
  { icon: MapPinned, title: "الخريطة", text: "فتح مناطق، إغلاق مناطق، تغيير أسعار التقارير، وإدارة ما يظهر للعميل." },
  { icon: ShoppingBag, title: "العروض والطلبات", text: "مراجعة العروض والطلبات من لوحة الإدارة مع إمكانية التعديل والحذف والإيقاف." },
  { icon: Megaphone, title: "التسويق", text: "استقبال طلبات التسويق التي لا تظهر كإدارة للعميل، ثم تشغيلها من الإدارة." },
  { icon: Scale, title: "القانونية", text: "استلام الطلبات القانونية، رفع الردود، ومتابعة الملفات والحالة حتى الإغلاق." },
  { icon: Wallet, title: "المحفظة", text: "الفواتير، العمولات، الملفات والمستندات، والاستثمارات مرتبطة ببيانات العميل." },
  { icon: Headphones, title: "خدمة العملاء", text: "شات، ملاحظات، حل مشاكل، وإغلاق الاستفسارات مع حفظ السياق." },
];

const serviceMatrix = [
  ["خدمات ما بعد الشراء", "غاز", "نقل أثاث", "توثيق", "صياغة عقود"],
  ["الخدمات القانونية", "منازعات", "عقود", "استشارات", "تقارير"],
  ["البناء والمقاولات", "تصميم هندسي", "تنفيذ", "صيانة", "تقييم"],
  ["خدمات التسويق", "تصوير", "حملات", "محتوى", "إدارة طلب"],
  ["أخرى", "طلبات مخصصة", "متابعة", "تسعير", "خدمة جديدة"],
];

// AnimatedFrame Removed

function CommandRoom({ reduceMotion, isRtl }: { reduceMotion: boolean; isRtl: boolean }) {
  const { settings } = useSettings();
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
      <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.028] p-5 shadow-2xl shadow-black/30 [contain:paint] sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.09),transparent_34%),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100%_100%,44px_44px,44px_44px] opacity-70" />
        {!reduceMotion && (
          <>
            <motion.div
              initial={{ y: "-120%", opacity: 0 }}
              whileInView={{ y: "340%", opacity: [0, 0.8, 0] }}
              viewport={{ once: false }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[14%] top-0 h-24 w-px bg-gradient-to-b from-transparent via-white/45 to-transparent [will-change:transform,opacity]"
            />
            <motion.div
              initial={{ x: isRtl ? "-140%" : "140%" }}
              whileInView={{ x: isRtl ? "260%" : "-260%" }}
              viewport={{ once: false }}
              transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[48%] h-px w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent [will-change:transform]"
            />
          </>
        )}

        <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ x: reduceMotion ? 0 : isRtl ? 42 : -42, opacity: 1 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true, margin: "-120px" }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/65 px-4 py-2">
              <Sparkles className="h-4 w-4 text-white/45" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">Live Digital Command</span>
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">
              تجربة رقمية موحدة تجمع بين الخرائط الذكية ومسح الأحياء المدعوم بالذكاء الاصطناعي.
            </h2>
            <p className="max-w-2xl text-base font-bold leading-8 text-white/66">
              هنا تكمن كفاءة المنصة؛ حيث تبدأ العملية بمسح الحي جغرافياً، ليقوم النظام بتحليل البيانات وتحويلها بالذكاء الاصطناعي إلى مسار متكامل يشمل الخرائط التفاعلية والتقارير الفنية المؤتمتة.
            </p>
          </motion.div>

          <div className="relative min-h-[560px] overflow-hidden rounded-[2.25rem] border border-white/10 bg-slate-950/70 p-4 sm:p-6">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:46px_46px] opacity-35" />
            <motion.div
              animate={reduceMotion ? undefined : { rotate: -360 }}
              transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/12 [will-change:transform]"
            />
            <motion.div
              animate={reduceMotion ? undefined : { scale: [1, 1.08, 1], opacity: [0.35, 0.78, 0.35] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/[0.025] [will-change:transform,opacity]"
            />
            {!reduceMotion && (
              <motion.div
                initial={{ y: "-20%" }}
                animate={{ y: "640%" }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-6 right-6 top-0 h-14 bg-gradient-to-b from-white/[0.12] to-transparent [will-change:transform]"
              />
            )}

            <div className="relative flex min-h-[520px] items-center justify-center">

              {/* Glowing animated orb background */}
              <motion.div 
                animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], filter: ["blur(20px)", "blur(40px)", "blur(20px)"], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute h-40 w-40 rounded-full bg-blue-600/40"
              />
              <motion.div 
                animate={reduceMotion ? undefined : { rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute h-[300px] w-[300px] rounded-full border border-dashed border-blue-400/40"
              />
              <motion.div 
                animate={reduceMotion ? undefined : { rotate: -360, scale: [1, 1.1, 1] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute h-[420px] w-[420px] rounded-full border border-dotted border-indigo-400/30"
              />
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative z-10 flex h-52 w-52 items-center justify-center rounded-full border border-white/10 bg-slate-950/80 shadow-[0_0_60px_rgba(59,130,246,0.35)] backdrop-blur-xl"
              >
                <img src={settings?.logoWhiteUrl || '/icons/white.png'} alt="Logo" className="w-32 object-contain" />
              </motion.div>

              {commandCards.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{
                    opacity: 1,
                    x: reduceMotion ? 0 : item.side === "left" ? -70 : 70,
                    y: reduceMotion ? 0 : index % 2 === 0 ? -34 : 34,
                  }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: reduceMotion ? 0 : 0.75, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={reduceMotion ? undefined : { scale: 1.04, y: -6 }}
                  className={`absolute z-20 w-[210px] rounded-3xl border border-white/12 bg-slate-950/85 p-4 shadow-2xl shadow-black/35 backdrop-blur-md [will-change:transform] ${
                    index === 0
                      ? "right-4 top-8 sm:right-8"
                      : index === 1
                        ? "left-4 top-32 sm:left-8"
                        : index === 2
                          ? "right-4 bottom-32 sm:right-8"
                          : "bottom-8 left-4 sm:left-8"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <item.icon className="h-5 w-5 text-white/65" />
                    <span className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-white/34">{item.value}</span>
                  </div>
                  <p className="text-sm font-black text-white">{item.label}</p>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      animate={reduceMotion ? undefined : { x: ["-100%", "0%", "100%"] }}
                      transition={{ duration: 2.8 + index * 0.25, repeat: Infinity, ease: "easeInOut" }}
                      className="h-full w-1/2 rounded-full bg-white/45 [will-change:transform]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ScannerStory Removed

function OperatingTimeline({ reduceMotion, isRtl }: { reduceMotion: boolean; isRtl: boolean }) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  return (
    <section ref={containerRef} className="relative border-y border-white/10 bg-white/[0.014] px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Full Operating Flow</p>
          <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">كل إدارة تتحرك في نفس النظام، لكن لكل واحدة مسارها الخاص.</h2>
          <p className="text-base font-bold leading-8 text-white/65">
            الصفحة توضح كيف ترتبط الأقسام ببعضها بدون تكرار أو ضياع بيانات: الخريطة، الطلبات، التسويق، القانونية، المحفظة، وخدمة العملاء.
          </p>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 top-0 hidden w-px bg-white/10 md:block" style={{ right: isRtl ? "50%" : undefined, left: isRtl ? undefined : "50%" }} />
          {!reduceMotion && (
            <motion.div 
              className="absolute bottom-0 top-0 hidden w-0.5 bg-gradient-to-b from-blue-500 via-indigo-400 to-transparent md:block origin-top shadow-[0_0_20px_rgba(99,102,241,0.8)]" 
              style={{ 
                right: isRtl ? "50%" : undefined, 
                left: isRtl ? undefined : "50%",
                scaleY: scrollYProgress,
              }} 
            />
          )}
          <div className="space-y-5">
            {timeline.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ x: reduceMotion ? 0 : index % 2 === 0 ? 44 : -44, y: reduceMotion ? 0 : 16 }}
                whileInView={{ x: 0, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: reduceMotion ? 0 : 0.65, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`relative grid gap-5 md:grid-cols-2 md:items-center ${index % 2 === 0 ? "" : "md:[&>div:first-child]:col-start-2"}`}
              >
                <div className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 shadow-2xl shadow-black/20 [will-change:transform]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <item.icon className="h-5 w-5 text-white/65" />
                  </div>
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <p className="mt-3 text-sm font-bold leading-7 text-white/63">{item.text}</p>
                </div>
                <div className="hidden md:block" />
                <motion.span
                  animate={reduceMotion ? undefined : { scale: [1, 1.28, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: index * 0.2 }}
                  className="absolute left-1/2 top-1/2 hidden h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900 shadow-[0_0_24px_rgba(255,255,255,0.28)] md:block z-10"
                >
                  <motion.div 
                    className="absolute inset-1 rounded-full bg-white"
                    style={{
                      scale: scrollYProgress,
                      opacity: scrollYProgress
                    }}
                  />
                </motion.span>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ServiceMatrix({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
      <div className="mb-12 max-w-3xl space-y-4">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Services Matrix</p>
        <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">الخدمات ليست نفس القائمة في كل مكان. كل قسم له خدماته وتسعيره ومساره.</h2>
        <p className="text-base font-bold leading-8 text-white/65">
          كل طلب خدمة يدخل بمسار مناسب له، واللوحة تقدر تتحكم في الأسعار، الحالة، الملاحظات، والردود بدون بيانات وهمية.
        </p>
      </div>

      <div className="grid gap-4">
        {serviceMatrix.map((row, rowIndex) => (
          <motion.div
            key={row[0]}
            initial={{ x: reduceMotion ? 0 : rowIndex % 2 === 0 ? -36 : 36 }}
            whileInView={{ x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: reduceMotion ? 0 : 0.62, delay: rowIndex * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 [will-change:transform] md:grid-cols-[1.1fr_repeat(4,1fr)]"
          >
            {row.map((cell, cellIndex) => (
              <motion.div
                key={cell}
                animate={reduceMotion || cellIndex === 0 ? undefined : { y: [0, -4, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, delay: cellIndex * 0.1 + rowIndex * 0.08, ease: "easeInOut" }}
                whileHover={cellIndex === 0 ? undefined : { scale: 1.05, backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)" }}
                className={`rounded-2xl border px-4 py-4 text-sm font-black transition-colors duration-300 [will-change:transform] ${
                  cellIndex === 0 ? "border-white/14 bg-slate-950/78 text-white" : "border-white/10 bg-slate-950/48 text-white/58"
                }`}
              >
                {cell}
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default function AboutPage() {
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const reduceMotion = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll();
  const backgroundShift = useTransform(scrollYProgress, [0, 1], [0, reduceMotion ? 0 : -120]);
  const progressScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 680);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white" dir={isRtl ? "rtl" : "ltr"}>
      <motion.div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.08), transparent 40%)`,
        }}
      />
      <motion.div
        style={{ scaleX: progressScale, transformOrigin: isRtl ? "right" : "left" }}
        className="fixed inset-x-0 top-0 z-[60] h-1 bg-gradient-to-r from-blue-500 to-indigo-500 [will-change:transform] shadow-[0_0_15px_rgba(59,130,246,0.6)]"
      />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div 
          style={{ y: backgroundShift }} 
          animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[6%] top-[10%] h-[40rem] w-[40rem] rounded-full bg-blue-600/10 blur-[100px] [will-change:transform]" 
        />
        <motion.div 
          style={{ y: backgroundShift }} 
          animate={reduceMotion ? undefined : { scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[12%] left-[8%] h-[48rem] w-[48rem] rounded-full bg-indigo-600/10 blur-[100px] [will-change:transform]" 
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.032)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.022)_1px,transparent_1px)] bg-[size:76px_76px] opacity-20 [mask-image:radial-gradient(circle_at_top,black,transparent_72%)]" />
        {!reduceMotion && (
            <></>
        )}
      </div>

      {showScrollTop && (
        <motion.button
          type="button"
          initial={{ y: 18, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          whileHover={reduceMotion ? undefined : { y: -4 }}
          whileTap={{ scale: 0.96 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="العودة للأعلى"
          className={`fixed bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/12 bg-slate-950/85 text-white shadow-2xl shadow-black/35 backdrop-blur-xl transition-colors hover:bg-white hover:text-slate-950 ${isRtl ? "left-6" : "right-6"}`}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}

      <section className="relative mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-12 px-5 pb-14 pt-28 sm:px-8 lg:px-12 lg:pt-32">
        <div className="space-y-8 text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6 relative z-10"
          >
            <motion.h1 
              animate={reduceMotion ? undefined : { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="text-4xl font-black leading-[1.12] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white sm:text-6xl lg:text-7xl drop-shadow-sm"
              style={{ backgroundSize: "200% auto" }}
            >
              من نحن
            </motion.h1>
            <p className="text-base font-bold leading-8 text-white/75 sm:text-lg">
              نحن منصة "الوساطة الرقمية" منصة سعودية متخصصة في قطاع تكنولوجيا العقار انطلقنا لنقدم نموذجاً متطوراً يجمع بين الحلول التقنية المبتكرة والالتزام بالأنظمة، حيث نوفر بيئة رقمية متكاملة لخدمات الوساطة وإدارة العقارات، تهدف إلى تسهيل التعاملات العقارية، وتسريع إجراءاتها، ورفع كفاءتها، بما يضمن حقوق جميع الأطراف ويوفر تجربة مستخدم آمنة وموثوقة.
              <br /><br />
              ونعتمد في أعمالنا على بنية تحتية تقنية متقدمة تحمي البيانات وتضمن سرية المعلومات، مع التزامنا الكامل باللوائح والتشريعات التي تنظم القطاع العقاري في المملكة العربية السعودية، لنكون الشريك الرقمي الموثوق في تطوير التعاملات العقارية وتنظيمه
            </p>
          </motion.div>
        </div>

        {/* Scroll Down Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.button
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
            animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 text-white/40 hover:text-blue-400 transition-colors group"
          >
            <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-current p-1">
              <motion.div 
                animate={reduceMotion ? undefined : { y: [0, 12, 0], opacity: [1, 0, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-2 w-1 rounded-full bg-current"
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 transition-opacity group-hover:opacity-100">
              {isRtl ? 'اكتشف' : 'Scroll'}
            </span>
            <ChevronDown className="h-4 w-4 absolute -bottom-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </motion.div>
      </section>

      <CommandRoom reduceMotion={reduceMotion} isRtl={isRtl} />



      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="mb-12 max-w-3xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Platform Capabilities</p>
          <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">كل جزء في المنصة يخدم قرارا أو إجراء داخل الرحلة العقارية.</h2>
          <p className="text-base font-bold leading-8 text-white/65">
            صممنا المنصة حتى لا تكون الأقسام منفصلة عن بعضها. كل طلب، فاتورة، محادثة، مستند، تقرير أو خدمة يمكن ربطه بسياقه داخل النظام.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {capabilities.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ y: reduceMotion ? 0 : 22 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-90px" }}
              transition={{ duration: reduceMotion ? 0 : 0.58, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.02, boxShadow: "0 20px 40px -10px rgba(59,130,246,0.15)", borderColor: "rgba(255,255,255,0.2)" }}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.06] [will-change:transform]"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-white/65 transition-colors duration-300 group-hover:border-blue-500/30 group-hover:text-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <item.icon className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/35">{item.eyebrow}</span>
              </div>
              <h3 className="text-xl font-black text-white">{item.title}</h3>
              <p className="mt-4 text-sm font-bold leading-7 text-white/65">{item.text}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {item.points.map((point) => (
                  <span key={point} className="rounded-full bg-white/[0.055] px-3 py-1.5 text-[10px] font-black text-white/55">
                    {point}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <OperatingTimeline reduceMotion={reduceMotion} isRtl={isRtl} />

      <ServiceMatrix reduceMotion={reduceMotion} />

      <section className="relative border-y border-white/10 bg-slate-950 px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">How It Works</p>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">من أول نقرة حتى إغلاق العملية.</h2>
            <p className="text-base font-bold leading-8 text-white/65">
              المنصة مبنية حول خط تشغيل واضح. لا يضيع الطلب بين الصفحات، ولا تنفصل الفاتورة عن الخدمة، ولا تصبح المحادثة خارج سياق العملية.
            </p>
          </div>

          <div className="space-y-3">
            {journey.map((item, index) => (
              <motion.div
                key={item}
                initial={{ x: reduceMotion ? 0 : isRtl ? -18 : 18 }}
                whileInView={{ x: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: reduceMotion ? 0 : 0.5, delay: index * 0.05 }}
                whileHover={reduceMotion ? undefined : { x: isRtl ? -10 : 10, backgroundColor: "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.2)" }}
                className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 transition-all duration-300 [will-change:transform]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950 text-sm font-black text-white/55 transition-colors duration-300 group-hover:bg-blue-500/10 group-hover:text-blue-400">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <p className="text-sm font-black leading-7 text-white/75">{item}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="mb-12 max-w-3xl space-y-4">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/40">Operations</p>
          <h2 className="text-3xl font-black leading-tight text-white sm:text-5xl">الإدارة ترى الصورة كاملة.</h2>
          <p className="text-base font-bold leading-8 text-white/65">
            لوحة الإدارة ليست مجرد قوائم. هي مساحة تشغيل تسمح بالتحكم في الخدمات، الأسعار، الأقسام، حالة الطلبات، المحادثات، الملفات، والفواتير.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {operations.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ y: reduceMotion ? 0 : 18 }}
              whileInView={{ y: 0 }}
              viewport={{ once: true, margin: "-110px" }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: index * 0.05 }}
              whileHover={reduceMotion ? undefined : { y: -8, scale: 1.02, boxShadow: "0 20px 40px -10px rgba(59,130,246,0.15)", borderColor: "rgba(255,255,255,0.2)" }}
              className="group rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-all duration-300 hover:bg-white/[0.06] [will-change:transform]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-white/65 transition-colors duration-300 group-hover:border-blue-500/30 group-hover:text-blue-400 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-black text-white">{item.title}</h3>
              <p className="mt-3 text-sm font-bold leading-7 text-white/65">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative px-5 pb-28 sm:px-8 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/40 p-8 text-center sm:p-12 shadow-[0_0_80px_rgba(59,130,246,0.15)] backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent" />
          <MessageSquare className="relative z-10 mx-auto h-12 w-12 text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
          <h2 className="relative z-10 mx-auto mt-6 max-w-4xl text-3xl font-black leading-tight text-white sm:text-5xl">هدفنا أن تكون كل خطوة عقارية قابلة للفهم، المتابعة، والتوثيق.</h2>
          <p className="relative z-10 mx-auto mt-6 max-w-3xl text-base font-bold leading-8 text-white/75">
            الوساطة الرقمية تجمع الأدوات التي يحتاجها العميل والإدارة ومقدم الخدمة في منصة واحدة، حتى تتحول العملية العقارية من صفحات منفصلة إلى تجربة تشغيل واضحة.
          </p>
        </motion.div>
      </section>
    </main>
  );
}
