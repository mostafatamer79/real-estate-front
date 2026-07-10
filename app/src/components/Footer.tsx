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
  Send,
  ArrowUp
} from "lucide-react";
import { motion } from "framer-motion";

function getXProfileUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

export default function Footer() {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const [showScrollTop, setShowScrollTop] = useState(false);

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
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const platformLinks = [
    { label: "نبذة عنا", href: "/about", icon: Info },
    { label: "الشروط والأحكام", href: "/info?tab=terms", icon: Shield },
    { label: "سياسة الاستخدام", href: "/info?tab=usage", icon: BookOpen },
  ];

  const supportLinks = [
    { label: "الأسئلة الشائعة", href: "/customerservice/faq", icon: HelpCircle },
    { label: "شاركنا رأيك", href: "/share-opinion", icon: Send },
    { label: "تواصل معنا", href: "/customerservice/contact", icon: MessageCircle },
  ];

  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden mt-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[100px]" />
      </div>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="العودة للأعلى"
          className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/90 text-white shadow-2xl backdrop-blur transition hover:bg-card hover:text-slate-950"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 mb-8 sm:mb-16"
        >
          {/* Platform */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              عن المنصة
            </h3>
            <ul className="space-y-4">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white">
                    <link.icon className="h-4 w-4 text-slate-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              المساعدة والدعم
            </h3>
            <ul className="space-y-4">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="flex w-fit items-center gap-3 text-sm font-medium text-slate-400 transition-colors hover:text-white">
                    <link.icon className="h-4 w-4 text-slate-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants} className="space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
               اتصل بنا
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-5 h-5 text-slate-500 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <X className="w-5 h-5 text-slate-500 shrink-0" />
                <a href={getXProfileUrl(settings.contactTwitter)} target="_blank" rel="noreferrer" className="hover:text-white transition-colors" dir="ltr">
                  {settings.contactTwitter || "X"}
                </a>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8 flex items-center justify-center"
        >
          <p className="text-center text-slate-500 text-xs font-medium">
            كافة الحقوق محفوظة لمنصة الوساطة الرقمية 2026
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
