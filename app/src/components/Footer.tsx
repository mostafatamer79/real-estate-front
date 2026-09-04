"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { Mail, Phone, X, ArrowUp } from "lucide-react";

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

  const platformLinks = [
    { label: t("footer.about_us"),   href: "/about" },
    { label: t("footer.terms"),      href: "/info?tab=terms" },
    { label: t("footer.usage"),      href: "/info?tab=usage" },
  ];

  const supportLinks = [
    { label: t("footer.faq"),          href: "/customerservice/faq" },
    { label: t("footer.share_opinion"), href: "/share-opinion" },
    { label: t("footer.contact_us"),   href: "/customerservice/contact" },
  ];

  return (
    <footer
      className="relative bg-[#0d1117] text-white"
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* scroll-to-top */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label={t("footer.scroll_top")}
          className="fixed z-40 bottom-24 left-4 md:bottom-8 max-md:bottom-[calc(80px+env(safe-area-inset-bottom))] h-11 w-11 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white backdrop-blur-sm hover:bg-white/20 active:scale-90 transition-all"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* ── DESKTOP ─────────────────────────────── */}
      <div className="hidden md:block border-t border-white/10">
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-4 gap-12">

          {/* brand */}
          <div className="space-y-4">
            <Link href="/">
              <img
                src={settings?.logoWhiteUrl || "/icons/white.png"}
                alt={t("footer.logo_alt")}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-[220px]">
              {t("footer.brand_desc")}
            </p>
          </div>

          {/* platform */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              {t("footer.about_platform")}
            </p>
            <ul className="space-y-3">
              {platformLinks.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* support */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              {t("footer.help_support")}
            </p>
            <ul className="space-y-3">
              {supportLinks.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/55 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
              {t("footer.contact")}
            </p>
            <ul className="space-y-3">
              {settings.contactEmail && (
                <li>
                  <a href={`mailto:${settings.contactEmail}`} className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span>{settings.contactEmail}</span>
                  </a>
                </li>
              )}
              {settings.contactPhone && (
                <li>
                  <a href={`tel:${settings.contactPhone}`} className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors" dir="ltr">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{settings.contactPhone}</span>
                  </a>
                </li>
              )}
              {settings.contactTwitter && (
                <li>
                  <a href={getXProfileUrl(settings.contactTwitter)} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors" dir="ltr">
                    <X className="h-4 w-4 shrink-0" />
                    <span>{settings.contactTwitter}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* desktop bottom bar */}
        <div className="border-t border-white/[0.07] px-8 py-5 max-w-6xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-white/30">{t("footer.rights_platform", { year: 2026 })}</p>
          <p className="text-xs text-white/25">{t("footer.made_with")}</p>
        </div>
      </div>

      {/* ── MOBILE ──────────────────────────────── */}
      <div className="md:hidden">

        {/* top divider */}
        <div className="h-px bg-white/[0.08]" />

        {/* logo row */}
        <div className="px-6 py-5 flex items-center justify-between">
          <Link href="/" className="active:opacity-70 transition-opacity">
            <img
              src={settings?.logoWhiteUrl || "/icons/white.png"}
              alt={t("footer.logo_alt")}
              className="h-8 w-auto object-contain"
            />
          </Link>

          {/* social icons */}
          <div className="flex items-center gap-2">
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-white/55 active:scale-90 transition-all"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
            {settings.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-white/55 active:scale-90 transition-all"
              >
                <Phone className="h-4 w-4" />
              </a>
            )}
            {settings.contactTwitter && (
              <a
                href={getXProfileUrl(settings.contactTwitter)}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/[0.08] text-white/55 active:scale-90 transition-all"
              >
                <X className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {/* divider */}
        <div className="h-px mx-6 bg-white/[0.07]" />

        {/* links — two columns */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-4">
          {/* column 1 */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-white/25 mb-3">
              {t("footer.about_platform")}
            </p>
            {platformLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center h-10 text-sm text-white/55 active:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* column 2 */}
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-white/25 mb-3">
              {t("footer.help_support")}
            </p>
            {supportLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center h-10 text-sm text-white/55 active:text-white transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* copyright */}
        <div className="h-px mx-6 bg-white/[0.07]" />
        <div className="px-6 py-4 text-center">
          <p className="text-[0.73rem] text-white/30">
            {t("footer.rights_platform", { year: 2026 })}
          </p>
        </div>

      </div>
    </footer>
  );
}
