"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import {
  Shield,
  BookOpen,
  Mail,
  MessageCircle,
  X,
  Info,
  HelpCircle,
  ArrowUp,
  MessageSquareHeart,
  ChevronDown,
  Phone,
  Building2,
  Compass,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MapPin,
  Flame,
  Search,
  KeyRound,
  ShieldCheck,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function getXProfileUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

export default function Footer() {
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("quickNav");
  const [activeTab, setActiveTab] = useState<"cities" | "types">("cities");

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const toggleSection = (key: string) => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const isAr = language === "ar";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  // Popular Saudi Real Estate Cities (like Aqar & Bayut)
  const popularCities = [
    { name: isAr ? "الرياض" : "Riyadh", query: "الرياض", count: "12,400+" },
    { name: isAr ? "جدة" : "Jeddah", query: "جدة", count: "8,900+" },
    { name: isAr ? "الدمام" : "Dammam", query: "الدمام", count: "4,300+" },
    { name: isAr ? "الخبر" : "Khobar", query: "الخبر", count: "3,700+" },
    { name: isAr ? "مكة المكرمة" : "Makkah", query: "مكة", count: "2,100+" },
    { name: isAr ? "المدينة المنورة" : "Madinah", query: "المدينة", count: "1,800+" },
  ];

  // Popular Property Types (like Aqar & Bayut)
  const popularTypes = [
    { label: isAr ? "شقق للإيجار" : "Apartments for Rent", href: "/properties?purpose=rent&type=APARTMENT" },
    { label: isAr ? "فلل للبيع" : "Villas for Sale", href: "/properties?purpose=sale&type=VILLA" },
    { label: isAr ? "أراضي للبيع" : "Lands for Sale", href: "/properties?purpose=sale&type=LAND" },
    { label: isAr ? "مكاتب تجارية" : "Commercial Offices", href: "/properties?purpose=rent&type=OFFICE" },
    { label: isAr ? "أدوار للإيجار" : "Floors for Rent", href: "/properties?purpose=rent&type=FLOOR" },
    { label: isAr ? "شقق تمليك" : "Apartments for Sale", href: "/properties?purpose=sale&type=APARTMENT" },
  ];

  const quickNavLinks = [
    { label: isAr ? "عقارات للبيع" : "Properties For Sale", href: "/properties?purpose=sale", icon: Building2 },
    { label: isAr ? "عقارات للإيجار" : "Properties For Rent", href: "/properties?purpose=rent", icon: Compass },
    { label: isAr ? "استكشف الخريطة" : "Explore Map", href: "/map", icon: MapPin },
    { label: isAr ? "خدمات عقارية" : "Real Estate Services", href: "/services", icon: Sparkles },
  ];

  const platformLinks = [
    { label: t("footer.about_us"), href: "/about", icon: Info },
    { label: t("footer.terms"), href: "/info?tab=terms", icon: Shield },
    { label: t("footer.usage"), href: "/info?tab=usage", icon: BookOpen },
    { label: t("footer.permits") || (isAr ? "التراخيص والتصاريح" : "Permits & Licenses"), href: "/info?tab=permits", icon: CheckCircle2 },
  ];

  const supportLinks = [
    { label: t("footer.faq"), href: "/customerservice/faq", icon: HelpCircle },
    { label: t("footer.share_opinion"), href: "/share-opinion", icon: MessageSquareHeart },
    { label: t("footer.contact_us"), href: "/customerservice/contact", icon: MessageCircle },
  ];

  const accordionSections = [
    {
      id: "quickNav",
      title: isAr ? "تصفح العقارات والخدمات" : "Explore & Services",
      badge: isAr ? "شائع" : "Popular",
      links: quickNavLinks,
    },
    {
      id: "platform",
      title: t("footer.about_platform"),
      links: platformLinks,
    },
    {
      id: "support",
      title: t("footer.help_support"),
      links: supportLinks,
    },
  ];

  return (
    <footer
      className="mobile-footer relative mt-auto overflow-hidden border-t border-slate-800/80 bg-slate-950 text-white select-none"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[380px] md:w-[650px] h-[380px] md:h-[650px] rounded-full bg-blue-600/[0.08] blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[320px] md:w-[550px] h-[320px] md:h-[550px] rounded-full bg-emerald-600/[0.07] blur-[120px]" />
        <div className="absolute top-[40%] left-[20%] w-[200px] h-[200px] rounded-full bg-indigo-500/[0.04] blur-[100px]" />
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 15 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={scrollToTop}
          aria-label={t("footer.scroll_top")}
          className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-slate-900/90 text-white shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md transition-all hover:bg-white hover:text-slate-950 bottom-24 md:bottom-8 left-5 max-md:bottom-[calc(84px+env(safe-area-inset-bottom))]"
        >
          <ArrowUp className="h-5 w-5 stroke-[2.5]" />
        </motion.button>
      )}

      {/* ════════════════════════════════════════
          DESKTOP LAYOUT (md and above)
          ════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pt-20 pb-12 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 mb-16"
        >
          {/* Brand */}
          <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
            <Link href="/" className="inline-block mb-2 relative group">
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-500/20 blur-[40px] rounded-full"
              />
              <motion.img
                src={settings?.logoWhiteUrl || "/icons/white.png"}
                alt={t("footer.logo_alt")}
                className="h-24 sm:h-36 w-auto object-contain relative z-10 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              {t("footer.brand_desc")}
            </p>
          </motion.div>

          {/* Platform Links */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t("footer.about_platform")}
            </h3>
            <ul className="space-y-4">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    <link.icon className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support Links */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t("footer.help_support")}
            </h3>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                  >
                    <link.icon className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {settings.contactEmail}
                </a>
              </li>
              {settings.contactPhone && (
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="hover:text-white transition-colors"
                    dir="ltr"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings.contactTwitter && (
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <X className="w-4 h-4 text-slate-400" />
                  </div>
                  <a
                    href={getXProfileUrl(settings.contactTwitter)}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white transition-colors break-all"
                    dir="ltr"
                  >
                    {settings.contactTwitter || "X"}
                  </a>
                </li>
              )}
            </ul>
          </motion.div>
        </motion.div>

        {/* Desktop Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {t("footer.systems_ok") || (isAr ? "الأنظمة تعمل بكفاءة" : "All Systems Operational")}
            </span>
            <p className="text-slate-500 text-xs font-medium">
              {t("footer.rights_platform", { year: 2026 })}
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-xs font-medium">
            <span>{t("footer.made_with")}</span>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════
          ULTRA WOW MOBILE LAYOUT (below md)
          ════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 pb-8">
        
        {/* 1. Hero Brand Glassmorphic Showcase */}
        <div className="px-4 pt-5 pb-3">
          <div className="relative overflow-hidden rounded-[2rem] p-5 border border-white/[0.12] bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 backdrop-blur-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
            {/* Ambient inner gradients */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-blue-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col gap-4">
              {/* Row 1: Logo & Regulated Badge */}
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center active:scale-95 transition-transform">
                  <img
                    src={settings?.logoWhiteUrl || "/icons/white.png"}
                    alt={t("footer.logo_alt")}
                    className="h-9 w-auto object-contain drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                  />
                </Link>

                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/[0.12] border border-emerald-500/30 text-emerald-400 text-[0.74rem] font-semibold tracking-tight shadow-[0_2px_10px_rgba(16,185,129,0.15)]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? "منصة مرخصة وموثوقة" : "Licensed & Verified"}</span>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-slate-300/90 text-xs leading-relaxed font-normal">
                {isAr
                  ? "منصتك الرائدة لاكتشاف العقارات الحصرية، الحجوزات المباشرة، وحلول الوساطة الرقمية المتوافقة مع تنظيمات السوق السعودي."
                  : "Saudi Arabia's premier digital real estate hub for verified listings, seamless direct bookings, and licensed brokerage."}
              </p>

              {/* High-Impact Contact Buttons Grid */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {settings.contactEmail && (
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    aria-label="Email"
                    className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-90 border border-white/[0.08] text-slate-300 hover:text-white transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-[0.68rem] font-medium">{isAr ? "البريد" : "Email"}</span>
                  </a>
                )}

                {settings.contactPhone && (
                  <a
                    href={`tel:${settings.contactPhone}`}
                    aria-label="Phone"
                    className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-90 border border-white/[0.08] text-slate-300 hover:text-white transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <span className="text-[0.68rem] font-medium">{isAr ? "اتصال" : "Call"}</span>
                  </a>
                )}

                {settings.contactTwitter && (
                  <a
                    href={getXProfileUrl(settings.contactTwitter)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="X"
                    className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-90 border border-white/[0.08] text-slate-300 hover:text-white transition-all group"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-slate-200 group-hover:scale-110 transition-transform">
                      <X className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[0.68rem] font-medium">X</span>
                  </a>
                )}

                <Link
                  href="/customerservice/contact"
                  aria-label="Support Chat"
                  className="flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-gradient-to-b from-blue-600/20 to-indigo-600/10 hover:from-blue-600/30 hover:to-indigo-600/20 active:scale-90 border border-blue-500/30 text-blue-300 hover:text-white transition-all group"
                >
                  <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(59,130,246,0.3)]">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[0.68rem] font-semibold">{isAr ? "الدعم" : "Support"}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Interactive Discovery Tabs: Cities & Property Types (inspired by Aqar & Bayut) */}
        <div className="px-4 py-2">
          <div className="rounded-[1.75rem] p-4 border border-white/[0.08] bg-slate-900/50 backdrop-blur-xl">
            {/* Tab header buttons */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setActiveTab("cities")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "cities"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "أشهر المدن" : "Popular Cities"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("types")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "types"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isAr ? "التصنيفات الرائجة" : "Trending Types"}
                </button>
              </div>

              <span className="flex items-center gap-1 text-[0.7rem] text-amber-400 font-medium">
                <Flame className="w-3.5 h-3.5 fill-amber-400/20" />
                <span>{isAr ? "الأكثر طلباً" : "Most Searched"}</span>
              </span>
            </div>

            {/* Tab Contents */}
            {activeTab === "cities" ? (
              <div className="grid grid-cols-3 gap-2">
                {popularCities.map((city) => (
                  <Link
                    key={city.name}
                    href={`/properties?city=${encodeURIComponent(city.query)}`}
                    className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/[0.05] transition-all group"
                  >
                    <span className="text-[0.8rem] font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                      {city.name}
                    </span>
                    <span className="text-[0.65rem] text-slate-500 mt-0.5" dir="ltr">
                      {city.count}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {popularTypes.map((type) => (
                  <Link
                    key={type.label}
                    href={type.href}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.1] border border-white/[0.05] transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500/50 group-hover:bg-blue-400 shrink-0 transition-colors" />
                    <span className="text-[0.76rem] font-medium text-slate-300 group-hover:text-white truncate">
                      {type.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3. Primary Feature Action Tiles (Buy / Rent / Map / Services) */}
        <div className="px-4 py-2">
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/properties?purpose=sale"
              className="relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900/60 to-slate-900/40 border border-blue-500/20 hover:border-blue-500/40 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[0.84rem] font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                  {isAr ? "عقارات للبيع" : "Buy Properties"}
                </span>
                <span className="text-[0.66rem] text-slate-400 truncate">
                  {isAr ? "فلل، شقق، أراضي" : "Villas, Flats, Land"}
                </span>
              </div>
            </Link>

            <Link
              href="/properties?purpose=rent"
              className="relative overflow-hidden flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 hover:border-emerald-500/40 active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[0.84rem] font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                  {isAr ? "عقارات للإيجار" : "Rent Properties"}
                </span>
                <span className="text-[0.66rem] text-slate-400 truncate">
                  {isAr ? "سكني وتجاري موثق" : "Residential & Comm."}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* 4. Fluid Animated Accordion Links (Bayut / Aqar style) */}
        <div className="px-4 py-2 space-y-2">
          {accordionSections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div
                key={section.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/45 backdrop-blur-md transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between px-4 py-3.5 active:bg-white/[0.03]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[0.86rem] font-semibold text-slate-200 tracking-tight">
                      {section.title}
                    </span>
                    {section.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[0.64rem] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? "rotate-180 bg-white/10" : "bg-transparent"}`}>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-4 pt-1 pb-3.5 grid grid-cols-2 gap-2 border-t border-white/[0.04]">
                        {section.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.08] text-[0.8rem] font-medium text-slate-300 hover:text-white transition-all group"
                          >
                            <link.icon className="h-3.5 w-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                            <span className="truncate">{link.label}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* 5. Trust & Regulatory Banner (REGA / Fal compliance) */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/[0.08] via-slate-900/60 to-transparent border border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[0.74rem] font-bold text-amber-300">
                  {isAr ? "معتمد وممتثل لضوابط الهيئة العامة للعقار" : "Compliant with Real Estate General Authority"}
                </span>
                <span className="text-[0.66rem] text-slate-400">
                  {isAr ? "وساطة مرخصة ومعاملات موثقة عبر منصة إيجار وفال" : "Licensed brokerage with authenticated deals"}
                </span>
              </div>
            </div>
            <Link
              href="/info?tab=terms"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 6. System Status Badge & Polished Copyright */}
        <div className="px-6 pt-5 flex flex-col items-center gap-2 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/10 text-[0.7rem] text-slate-300 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-medium">
              {isAr ? "جميع الخدمات والأنظمة تعمل بكفاءة 100%" : "All Systems & APIs Operational"}
            </span>
          </div>

          <p className="text-slate-400 text-[0.74rem] font-medium pt-1">
            {t("footer.rights_platform", { year: 2026 })}
          </p>

          <p className="text-slate-500 text-[0.66rem]">
            {t("footer.made_with")}
          </p>
        </div>

      </div>
    </footer>
  );
}
