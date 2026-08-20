"use client";
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface MobileAppHeaderProps {
  title?: string;
  theme?: 'dark' | 'light'; // dark for slate-950 bg, light for white/slate-50 bg
}

export default function MobileAppHeader({ title, theme = 'dark' }: MobileAppHeaderProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRtl = language === 'ar';
  
  // Don't show on root home page if there is one
  const pathname = usePathname();
  if (pathname === '/') return null;

  const bgClass = theme === 'dark' ? 'bg-slate-950/90 border-white/10' : 'bg-white/90 border-slate-200';
  const textClass = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const btnClass = theme === 'dark' ? 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200';

  return (
    <div 
      className={`flex md:hidden items-center justify-between px-4 pb-2 border-b backdrop-blur-md sticky top-0 z-[99] ${bgClass}`}
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.back()} 
          className={`flex items-center justify-center w-9 h-9 rounded-full border transition-colors ${btnClass}`}
        >
          <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <h1 className={`text-sm font-bold tracking-wide ${textClass}`}>
          {title || t("common.back") || "رجوع"}
        </h1>
      </div>
      <div className="w-9 h-9" /> {/* Spacer */}
    </div>
  );
}
