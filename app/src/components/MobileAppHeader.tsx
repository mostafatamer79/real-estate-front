"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';
import NotificationBell from './NotificationBell';

interface MobileAppHeaderProps {
  title?: string;
  theme?: 'dark' | 'light'; // dark for slate-950 bg, light for white/slate-50 bg
  showNotifications?: boolean;
}

export default function MobileAppHeader({ title, theme = 'dark', showNotifications = false }: MobileAppHeaderProps) {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const isRtl = language === 'ar';

  // Don't show on root home page if there is one
  const pathname = usePathname();
  if (pathname === '/') return null;

  const bgClass = theme === 'dark'
    ? 'bg-slate-950/75 border-white/[0.07] supports-[backdrop-filter]:bg-slate-950/60'
    : 'bg-white/80 border-slate-200/70 supports-[backdrop-filter]:bg-white/65';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const btnClass = theme === 'dark'
    ? 'bg-white/[0.06] border-white/10 text-slate-200 active:bg-white/[0.12]'
    : 'bg-slate-100/90 border-slate-200 text-slate-600 active:bg-slate-200';

  // Guard against missing translation keys (t() returns the raw key)
  const backKey = t("common.back");
  const backLabel = backKey && backKey !== "common.back" ? backKey : isRtl ? "رجوع" : "Back";

  return (
    <motion.div
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={`flex md:hidden items-center justify-between px-3 pb-2 border-b backdrop-blur-xl sticky top-0 z-[99] ${bgClass}`}
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      {/* Hairline highlight */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-px ${
          theme === 'dark' ? 'bg-gradient-to-r from-transparent via-white/15 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-900/10 to-transparent'
        }`}
      />
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => router.back()}
          className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors active:scale-90 ${btnClass}`}
          aria-label={backLabel}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <h1 className={`text-sm font-bold tracking-wide ${textClass}`}>
          {title || backLabel}
        </h1>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleLanguage}
          className={`flex items-center justify-center h-9 min-w-9 px-2 rounded-full border text-[11px] font-black uppercase transition-colors active:scale-90 ${btnClass}`}
        >
          {language === 'ar' ? 'EN' : 'ع'}
        </button>
        {showNotifications && (
          <NotificationBell
            variant={theme === 'dark' ? 'dark' : 'light'}
            buttonClassName={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}
            align={isRtl ? 'left' : 'right'}
          />
        )}
      </div>
    </motion.div>
  );
}
