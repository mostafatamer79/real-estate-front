"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";
import SoonBadge from "./SoonBadge";
import { 
  Shield, BookOpen, FileCheck, Phone, Mail, 
  Instagram, Facebook, ArrowRight, 
  MapPin, Send, MessageCircle, 
  X
} from "lucide-react";
import { motion } from "framer-motion";

function getXProfileUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "#";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://x.com/${trimmed.replace(/^@/, "")}`;
}

export default function Footer() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

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

  return (
    <footer className="relative bg-slate-950 text-white overflow-hidden mt-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/10 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-slate-900/10 blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-12 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16"
        >
          {/* Brand Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="space-y-4">
              <Image
                src={settings.logoWhiteUrl || '/icons/white.png'}
                alt={t('project.name')}
                width={320}
                height={(settings.logoHeight || 40) * 1.5}
                className="object-contain w-auto"
                style={{ height: `${(settings.logoHeight || 40) * 1.5}px` }}
              />
              <p className="text-slate-400 text-sm leading-relaxed max-w-[420px]">
                {t('footer.brand_desc')}
              </p>
            </div>
            <div className="flex gap-4">
              {[
                { icon: X, href: getXProfileUrl(settings.contactTwitter) },
                { icon: Instagram, href: "#" },
                { icon: Facebook, href: "#" },
              ].map((social, idx) => (
                <Link 
                  key={idx} 
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all hover:scale-110 group"
                >
                  <social.icon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              {t('footer.quick_links')}
            </h3>
            <ul className="space-y-4">
              {[
                { label: t('footer.home'), href: "/", key: 'details' },
                { label: t('footer.offers'), href: "/offers", key: 'offers' },
                { label: t('footer.management'), href: "/buildingmanagement", key: 'buildingmanagement' },
                { label: t('footer.services'), href: "/services", key: 'services' },
              ].filter(link => {
                if (link.key === 'buildingmanagement') {
                  if (!user) return false;
                  if (user.role !== 'admin' && (!user.departments || user.departments.length === 0)) return false;
                }
                return true;
              }).map((link, idx) => {
                const isClosed = settings.sectionFlags[link.key] === 'closed';
                return (
                  <li key={idx} className="relative group/li">
                    <Link 
                      href={isClosed ? "#" : link.href} 
                      onClick={(e) => isClosed && e.preventDefault()}
                      className={`text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 group transition-colors w-fit ${isClosed ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 scale-0 group-hover:scale-100 transition-transform" />
                      {link.label}
                      {isClosed && (
                        <SoonBadge className="ml-2">
                          {t('common.soon') || 'قريباً'}
                        </SoonBadge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Legal & Support */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
               {t('footer.support')}
            </h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  href={settings.sectionFlags.customerservice === 'closed' ? "#" : "/customerservice"} 
                  onClick={(e) => settings.sectionFlags.customerservice === 'closed' && e.preventDefault()}
                  className={`text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 group transition-colors w-fit ${settings.sectionFlags.customerservice === 'closed' ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                >
                  <MessageCircle className="w-4 h-4 text-gray-500 " />
                  {t("header.customerService")}
                  {settings.sectionFlags.customerservice === 'closed' && (
                    <SoonBadge className="ml-2">
                      {t('common.soon') || 'قريباً'}
                    </SoonBadge>
                  )}
                </Link>
              </li>
              <li>
                <Link href="/info?tab=terms" className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 group transition-colors w-fit">
                  <Shield className="w-4 h-4 text-gray-500 " />
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link href="/info?tab=usage" className="text-slate-400 hover:text-white text-sm font-medium flex items-center gap-2 group transition-colors w-fit">
                  <BookOpen className="w-4 h-4 text-gray-500 " />
                  {t("footer.usage")}
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact Layout */}
          <motion.div variants={itemVariants} className="space-y-6">
             <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
               {t('footer.contact_us')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors">{settings.contactEmail}</a>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone className="w-5 h-5 text-indigo-500 shrink-0" />
                <a href={`tel:${settings.contactPhone}`} className="hover:text-white transition-colors" dir="ltr">{settings.contactPhone}</a>
              </li>
            </ul>
            
            {/* Mini Newsletter */}
            <div className="pt-2">
              <div className="relative group">
                <input 
                  type="email" 
                  placeholder={t('footer.newsletter')} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-medium"
                />
                <button className="absolute left-2 top-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
                  <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <p className="text-slate-500 text-xs font-medium">
            {t("footer.rights").replace("{year}", currentYear.toString())}
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">{t('footer.systems_ok')}</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
