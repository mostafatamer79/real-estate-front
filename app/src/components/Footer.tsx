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
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";

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
  const isAr = language === "ar";

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const platformLinks = [
    { label: t("footer.about_us"), href: "/about", icon: Info },
    { label: t("footer.terms"), href: "/info?tab=terms", icon: Shield },
    { label: t("footer.usage"), href: "/info?tab=usage", icon: BookOpen },
  ];

  const supportLinks = [
    { label: t("footer.faq"), href: "/customerservice/faq", icon: HelpCircle },
    { label: t("footer.share_opinion"), href: "/share-opinion", icon: MessageSquareHeart },
    { label: t("footer.contact_us"), href: "/customerservice/contact", icon: MessageCircle },
  ];

  return (
    <footer
      className="mobile-footer relative mt-auto overflow-hidden border-t border-slate-800 bg-slate-950 text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Abstract Background Shapes (original desktop styles) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none hidden md:block">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[100px]" />
      </div>

      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={scrollToTop}
          aria-label={t("footer.scroll_top")}
          className="fixed z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-2xl backdrop-blur transition hover:bg-card hover:text-slate-950 md:bottom-6 left-6 max-md:bottom-[calc(80px+env(safe-area-inset-bottom))]"
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}

      {/* ════════════════════════════════════════════════════
          DESKTOP LAYOUT (100% Original styling, structure & animations)
          ════════════════════════════════════════════════════ */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-8 sm:pb-12 relative z-10">
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
                className="h-24 sm:h-40 w-auto object-contain relative z-10"
                animate={{
                  y: [0, -8, 0],
                  filter: [
                    "drop-shadow(0px 0px 0px rgba(59,130,246,0))",
                    "drop-shadow(0px 10px 20px rgba(59,130,246,0.2))",
                    "drop-shadow(0px 0px 0px rgba(59,130,246,0))",
                  ],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </Link>
          </motion.div>

          {/* Platform */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              {t("footer.about_platform")}
            </h3>
            <ul className="space-y-4">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="wow-ripple flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white whitespace-nowrap"
                  >
                    <link.icon className="h-4 w-4 text-slate-500 shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              {t("footer.help_support")}
            </h3>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="wow-ripple flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white whitespace-nowrap"
                  >
                    <link.icon className="h-4 w-4 text-slate-500 shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              {t("footer.contact")}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="wow-ripple hover:text-white transition-colors break-all"
                >
                  {settings.contactEmail}
                </a>
              </li>
              {settings.contactPhone && (
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <Phone className="w-5 h-5 text-slate-500 shrink-0" />
                  <a
                    href={`tel:${settings.contactPhone}`}
                    className="wow-ripple hover:text-white transition-colors break-all"
                    dir="ltr"
                  >
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings.contactTwitter && (
                <li className="flex items-center gap-3 text-slate-400 text-sm">
                  <X className="w-5 h-5 text-slate-500 shrink-0" />
                  <a
                    href={getXProfileUrl(settings.contactTwitter)}
                    target="_blank"
                    rel="noreferrer"
                    className="wow-ripple hover:text-white transition-colors break-all"
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
          className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4"
        >
          <p className="text-center md:text-right text-slate-500 text-sm font-medium">
            {t("footer.rights_platform", { year: 2026 })}
          </p>
          <div className="flex items-center gap-2 sm:gap-4 text-slate-500 text-sm font-medium">
            <span className="text-sm">{t("footer.made_with")}</span>
          </div>
        </motion.div>
      </div>

      {/* ════════════════════════════════════════════════════
          MOBILE LAYOUT (Refined, Clean & High-End - Aqar / Bayut inspired)
          ════════════════════════════════════════════════════ */}
      <div className="md:hidden relative z-10 px-5 pt-7 pb-6 space-y-6">
        {/* Top: Logo & Social Buttons */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center active:opacity-75 transition-opacity">
            <img
              src={settings?.logoWhiteUrl || "/icons/white.png"}
              alt={t("footer.logo_alt")}
              className="h-9 w-auto object-contain"
            />
          </Link>

          {/* Social / Contact Icons */}
          <div className="flex items-center gap-2">
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                aria-label="Email"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 active:scale-95 transition-all shadow-sm"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {settings.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                aria-label="Phone"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 active:scale-95 transition-all shadow-sm"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {settings.contactTwitter && (
              <a
                href={getXProfileUrl(settings.contactTwitter)}
                target="_blank"
                rel="noreferrer"
                aria-label="X"
                className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 active:scale-95 transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Clean 2-Column Links with Icons */}
        <div className="grid grid-cols-2 gap-5 pt-1">
          {/* Platform Column */}
          <div className="space-y-3">
            <h4 className="text-[0.72rem] font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-800/60">
              {t("footer.about_platform")}
            </h4>
            <ul className="space-y-2">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-[0.82rem] font-medium text-slate-400 hover:text-slate-200 active:text-white transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Column */}
          <div className="space-y-3">
            <h4 className="text-[0.72rem] font-bold uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-800/60">
              {t("footer.help_support")}
            </h4>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-2 text-[0.82rem] font-medium text-slate-400 hover:text-slate-200 active:text-white transition-colors"
                  >
                    <link.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Minimal Copyright Strip */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col items-center gap-1 text-center">
          <p className="text-[0.72rem] text-slate-500 font-medium">
            {t("footer.rights_platform", { year: 2026 })}
          </p>
          <p className="text-[0.66rem] text-slate-600">
            {t("footer.made_with")}
          </p>
        </div>
      </div>
    </footer>
  );
}
