"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import styles from "./BusinessVerificationFooter.module.css";

const verificationUrl = "https://eauthenticate.saudibusiness.gov.sa/EAuthSealApi/seal?token=YWU3Qm5vS3hTSkNlZGljRFgwY0VFdz09&lang=ar";
const footerLinks = [
  { href: "/about", ar: "من نحن", en: "About us" },
  { href: "/customerservice/contact", ar: "تواصل معنا", en: "Contact us" },
  { href: "/customerservice/faq", ar: "الأسئلة الشائعة", en: "FAQs" },
  { href: "/info?tab=terms", ar: "الشروط والأحكام", en: "Terms and conditions" },
  { href: "/info?tab=usage", ar: "سياسة الاستخدام", en: "Usage policy" },
  { href: "/share-opinion", ar: "شاركنا رأيك", en: "Share your feedback" },
];

export default function BusinessVerificationFooter() {
  const { language, t } = useLanguage();
  const { settings } = useSettings();
  const isArabic = language === "ar";

  return (
    <footer aria-label={isArabic ? "تذييل الموقع" : "Site footer"} dir={isArabic ? "rtl" : "ltr"} className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.grid}>
          <Link href="/" className={styles.brand} aria-label={isArabic ? "الوساطة الرقمية — الصفحة الرئيسية" : "Digital Brokerage — Home"}>
            <Image src={settings.logoWhiteUrl || "/icons/white.png"} alt={isArabic ? "الوساطة الرقمية" : "Digital Brokerage"} width={170} height={90} unoptimized />
          </Link>
          <nav className={styles.links} aria-label={isArabic ? "روابط الموقع" : "Site links"}>
            {footerLinks.map(link => <Link key={link.href} href={link.href}>{isArabic ? link.ar : link.en}</Link>)}
          </nav>
          <a className={styles.qr} href={verificationUrl} target="_blank" rel="noopener noreferrer" aria-label={isArabic ? "عرض التوثيق الرسمي للوساطة الرقمية — نافذة جديدة" : "View official Digital Brokerage verification — new tab"}>
            <Image src="/sbc-verification-qr.png" width={112} height={112} alt={isArabic ? "رمز QR للتوثيق الرسمي للوساطة الرقمية" : "QR code for official Digital Brokerage verification"} unoptimized />
          </a>
        </div>
        <div className={styles.bottom}>
          <p>{t("footer.rights_platform", { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
