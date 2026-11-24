"use client";
import { canNavigateBack } from "@/lib/workspace-usability";
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
  onBack?: () => void;
}

export default function MobileAppHeader({ title, theme = 'dark', showNotifications = false, onBack }: MobileAppHeaderProps) {
  const router = useRouter();
  const { t, language, toggleLanguage } = useLanguage();
  const isRtl = language === 'ar';

  // Don't show on root home page if there is one
  const pathname = usePathname();
  if (pathname === '/') return null;

  const bgClass = theme === 'dark'
    ? 'bg-background/75 dark:bg-slate-950/75 border-border dark:border-white/[0.07] supports-[backdrop-filter]:bg-background/90 dark:supports-[backdrop-filter]:bg-slate-950/60'
    : 'bg-white/80 border-slate-200/70 supports-[backdrop-filter]:bg-white/65';
  const textClass = theme === 'dark' ? 'text-foreground dark:text-white' : 'text-slate-900';
  const btnClass = theme === 'dark'
    ? 'bg-muted dark:bg-white/[0.06] border-border dark:border-white/10 text-foreground dark:text-slate-200 active:bg-muted active:dark:bg-white/[0.12]'
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
          theme === 'dark' ? 'bg-gradient-to-r from-transparent via-white/15 to-transparent' : 'bg-gradient-to-r from-transparent via-card/10 dark:via-slate-900/10 to-transparent'
        }`}
      />
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => { if (onBack) onBack(); else if (pathname === '/profile') router.push('/details'); else {
            const navigation = (window as Window & { navigation?: { currentEntry?: { index: number }; entries: () => Array<{ index: number; url?: string }> } }).navigation;
            const currentEntry = navigation?.currentEntry;
            const previousUrl = currentEntry ? navigation?.entries().find(entry => entry.index === currentEntry.index - 1)?.url : undefined;
            if (canNavigateBack(window.location.href, window.history.length, document.referrer, currentEntry ? { index: currentEntry.index, previousUrl } : undefined)) router.back();
            else router.push('/details');
          } }}
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
          type="button"
          aria-label={isRtl ? "Switch to English" : "التبديل إلى العربية"}
          onClick={toggleLanguage}
          className={`flex items-center justify-center h-9 min-w-9 px-2 rounded-full border text-[11px] font-black uppercase transition-colors active:scale-90 ${btnClass}`}
        >
          {language === 'ar' ? 'EN' : 'ع'}
        </button>
        {showNotifications && (
          <NotificationBell
            variant={theme === 'dark' ? 'dark' : 'light'}
            buttonClassName={theme === 'dark' ? 'text-muted-foreground dark:text-slate-300' : 'text-slate-600'}
            align={isRtl ? 'left' : 'right'}
          />
        )}
      </div>
    </motion.div>
  );
}
