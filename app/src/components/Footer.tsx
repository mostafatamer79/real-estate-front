"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, HelpCircle, Phone, Shield } from "lucide-react";
import VerificationQr from "@/components/VerificationQr";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import styles from "./footer.module.css";

export default function Footer() {
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const isAr = language === "ar";

  const links = [
    { label: t("footer.terms"), href: "/info?tab=terms", icon: Shield },
    { label: t("footer.usage"), href: "/info?tab=usage", icon: BookOpen },
    { label: t("footer.faq"), href: "/customerservice/faq", icon: HelpCircle },
    { label: t("footer.contact"), href: "/customerservice/contact", icon: Phone },
  ];

  return (
    <footer
      id="contact"
      className={styles.footer}
      dir={isAr ? "rtl" : "ltr"}
    >
      <div className={styles.inner}>
        <div className={styles.brandGroup}>
          <Link
            href="/"
            className={styles.logoLink}
            aria-label={t("footer.logo_alt")}
          >
            <Image
              src={settings?.logoWhiteUrl || "/icons/white.png"}
              alt={t("footer.logo_alt")}
              className={styles.logo}
              width={160}
              height={160}
              unoptimized
            />
          </Link>

          <div className={styles.qrWrap}>
            <VerificationQr />
          </div>
        </div>

        <nav
          aria-label={isAr ? "روابط التذييل" : "Footer links"}
          className={styles.nav}
        >
          <ul className={styles.linkList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={styles.link}>
                  <link.icon className={styles.linkIcon} aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
