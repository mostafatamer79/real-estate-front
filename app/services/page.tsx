"use client";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Scale, Hammer, Megaphone, MoreHorizontal, ArrowLeft, ChevronRight
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";

const serviceCards = [
  { id: "postPurchase", icon: ShoppingBag, index: "01", span: "md:col-span-2 lg:col-span-3" },
  { id: "legal",        icon: Scale,       index: "02", span: "md:col-span-2 lg:col-span-3" },
  { id: "construction", icon: Hammer,      index: "03", span: "md:col-span-2 lg:col-span-2" },
  { id: "marketing",    icon: Megaphone,   index: "04", span: "md:col-span-2 lg:col-span-2" },
  { id: "other",        icon: MoreHorizontal, index: "05", span: "md:col-span-4 lg:col-span-2" },
];

export default function Services() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const { isOpen, message, isAdmin } = useSectionGuard('services');
  const { settings } = useSettings();
  const { user } = useAuth();

  const statusOf = (id: string): 'enabled' | 'soon' | 'disabled' => {
    const key = `services_${id}`;
    const v = (settings.moduleFlags as any)?.[key];
    if (v === 'soon' || v === 'disabled') return v;
    return 'enabled';
  };
  const msgOf = (id: string) => (settings.moduleMessages as any)?.[`services_${id}`] || '';



  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('footer.services') || 'الخدمات'} message={message} isAdmin={isAdmin} />;
  }

  return (
    <section className="w-full min-h-screen bg-slate-950 flex flex-col overflow-x-hidden relative" dir={isRtl ? "rtl" : "ltr"}>
      {/* Ambient background glows matching details/page.tsx */}
      <div className="absolute inset-0 overflow-hidden bg-slate-950 pointer-events-none z-0">
        <div className="absolute top-[5%] left-[10%] w-[50%] h-[40%] rounded-full bg-indigo-500/4 blur-[140px]" />
        <div className="absolute bottom-[15%] right-[5%] w-[35%] h-[35%] rounded-full bg-slate-600/8 blur-[120px]" />
        <div className="absolute top-[45%] right-[20%] w-[25%] h-[25%] rounded-full bg-gray-500/4 blur-[100px]" />
      </div>

      {/* Header row */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 pb-0">
        <motion.button
          initial={{ opacity: 0, x: isRtl ? 10 : -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => router.push("/details")}
          className="group flex items-center gap-2 text-slate-600 hover:text-slate-500 transition-colors text-[10px] font-bold uppercase tracking-widest mb-6 sm:mb-8"
        >
          <div className="w-6 h-6 rounded-full bg-white/[0.02] border border-white/[0.06] group-hover:bg-white/[0.05] flex items-center justify-center transition-all duration-200">
            <ArrowLeft className={`w-3 h-3 ${isRtl ? "rotate-180" : ""}`} />
          </div>
          {t("common.back")}
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 mb-3 flex-row-reverse">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
            <p className="text-[9px] font-bold text-white/50 uppercase tracking-widest">
              {t("services.platformServices") || "خدمات المنصة"}
            </p>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.03em] leading-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 mb-3">
            {t("services.title") || "خدماتنا"}
          </h1>
          <p className="text-white/40 text-sm max-w-lg leading-relaxed">
            نقدم مجموعة متكاملة من الخدمات العقارية لتسهيل رحلتك في السوق.
          </p>
        </motion.div>

        <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent mb-6 sm:mb-8" />
      </div>

      {/* Grid */}
      <motion.main
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
        className="relative z-10 max-w-7xl w-full bg-slate-950 mx-auto px-4 sm:px-6 md:px-10 pb-12 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-3"
      >
        {serviceCards.map((card) => {
          const Icon = card.icon;
          const status = statusOf(card.id);
          const isAdminRole = (user as any)?.role === 'admin';
          const disabled = status !== 'enabled';
          const isSoon = status === 'soon';
          const isDisabled = status === 'disabled';
          if (status === 'disabled') return null;
          return (
            <motion.div
              key={card.id}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.97 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
              }}
              whileHover="hovered"
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(card.id === "legal" ? "/services/legal" : `/services/form?type=${card.id}`);
                }
              }}
              onClick={() => {
                if (disabled) return;
                router.push(card.id === "legal" ? "/services/legal" : `/services/form?type=${card.id}`);
              }}
              className={`group relative ${isRtl ? "text-right" : "text-left"} ${card.span} bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] overflow-hidden transition-all duration-300 ${
                disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-white/20 hover:-translate-y-0.5'
              }`}
            >
              {/* Hover bg */}
              <motion.div
                variants={{ hovered: { opacity: 1 }, hidden: { opacity: 0 } }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white/[0.03] pointer-events-none"
              />

              {/* Shimmer line */}
              <motion.div
                variants={{ hovered: { opacity: 1, x: "100%" }, hidden: { opacity: 0, x: "-100%" } }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />

              <div className="flex items-start justify-between w-full relative z-10">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 flex items-center justify-center transition-all duration-300">
                  <Icon className="w-4 h-4 text-white/50 group-hover:text-white/90 transition-colors duration-200" />
                </div>
                <span className="text-[10px] font-black text-white/15 tracking-widest font-mono group-hover:text-white/30 transition-colors">
                  {card.index}
                </span>
              </div>

              <div className="mt-auto pt-4 relative z-10 w-full flex flex-row items-end justify-between">
                <h3 className="text-base sm:text-lg font-bold text-white/80 leading-tight group-hover:text-white transition-colors duration-200 pointer-events-none">
                  {t(`services.${card.id}`)}
                </h3>
                {isSoon ? (
                  <span
                    className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest pointer-events-none border"
                    style={{
                      backgroundColor: "var(--soon-badge-bg, #ffffff)",
                      color: "var(--soon-badge-text, #000000)",
                      borderColor: "var(--soon-badge-bg, #ffffff)",
                    }}
                  >
                    {t("common.soon") || "قريباً"}
                  </span>
                ) : (
                <div className="flex items-center gap-1.5 pointer-events-none">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 transform translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200">
                    <ChevronRight className={`w-3 h-3 text-white/60 ${isRtl ? "rotate-180" : ""}`} />
                  </div>
                </div>
                )}
              </div>

              {/* Admin-only explicit preview for "soon" so it doesn't behave like normal click */}
              {isAdminRole && isSoon && (
                <div className="relative z-10 pt-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/services/form?type=${card.id}&preview=1`);
                    }}
                    className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-[10px] font-black text-white/60 hover:text-white/90 transition-all inline-flex items-center gap-2"
                  >
                    معاينة كمسؤول
                  </button>
                </div>
              )}

            </motion.div>
          );
        })}
      </motion.main>
    </section>
  );
}
