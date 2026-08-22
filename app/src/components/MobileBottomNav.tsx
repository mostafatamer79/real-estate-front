"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, FileText, User, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { hapticTick } from '@/lib/haptics';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Auto-hide on scroll down, reveal on scroll up (native app pattern)
  useEffect(() => {
    lastY.current = window.scrollY;
    setHidden(false);
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 6 && y > 140) setHidden(true);
      else if (y < lastY.current - 6) setHidden(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  // Safe translation: fall back when the key is missing (t() returns the raw key)
  const tr = (key: string, ar: string, en: string) => {
    const v = t(key);
    return v && v !== key ? v : language === 'ar' ? ar : en;
  };

  // Pages where we DO NOT want to show the bottom nav
  // (/wallet has its own bottom tab bar)
  const hiddenRoutes = ['/login', '/scan-map', '/wallet'];
  const isHidden = hiddenRoutes.some(route => pathname?.startsWith(route));

  // Hide nav on specific chat rooms but keep it on the main chat list
  const isChatRoom = pathname?.startsWith('/chat/') && pathname !== '/chat';

  if (isHidden || isChatRoom) return null;

  const navItems = [
    { name: tr('home.title', 'الرئيسية', 'Home'), path: '/details', icon: Home },
    { name: tr('header.services', 'الخدمات', 'Services'), path: '/services', icon: LayoutGrid },
    { name: tr('header.myRequests', 'طلباتي', 'Requests'), path: '/services/my-requests', icon: FileText },
    { name: tr('chat.title', 'الدردشة', 'Chat'), path: '/chat', icon: MessageSquare },
    { name: tr('profile.title', 'حسابي', 'Profile'), path: '/profile', icon: User },
  ];

  return (
    <motion.nav
      id="tour-target-bottom-nav"
      aria-label="Main navigation"
      animate={{ y: hidden ? 130 : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 34 }}
      className="md:hidden fixed z-50 left-3 right-3 rounded-[1.75rem] border border-white/10 bg-slate-950/90 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
      style={{ bottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      {/* Hairline top highlight */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

      <div className="relative flex items-stretch justify-around h-[66px] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => !isActive && hapticTick()}
              className="relative flex flex-col items-center justify-center flex-1 min-w-[48px] py-1.5 active:scale-95 transition-transform"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  aria-hidden="true"
                  className="absolute inset-x-0.5 top-1.5 bottom-1.5 rounded-[1.25rem] bg-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                  transition={{ type: 'spring', stiffness: 480, damping: 40 }}
                />
              )}
              <motion.span
                key={isActive ? 'active' : 'inactive'}
                initial={isActive ? { scale: 0.7, y: 3 } : false}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="relative z-10 flex items-center justify-center h-7 w-7"
              >
                <Icon
                  className={`w-[26px] h-[26px] transition-colors duration-200 ${
                    isActive ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]' : 'text-slate-300'
                  }`}
                  strokeWidth={isActive ? 2.4 : 2}
                />
              </motion.span>
              <span
                className={`relative z-10 mt-1 text-[12px] leading-none max-w-full truncate px-0.5 transition-all duration-200 ${
                  isActive ? 'text-white font-bold' : 'text-slate-300 font-medium opacity-90'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
