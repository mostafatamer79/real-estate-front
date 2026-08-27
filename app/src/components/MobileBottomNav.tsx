"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
      animate={{ y: hidden ? 130 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35, mass: 0.8 }}
      className="md:hidden fixed z-50 left-2.5 right-2.5 rounded-[1.5rem] border border-white/[0.08] bg-slate-950/85 backdrop-blur-[28px] saturate-[1.8] shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_0_0.5px_rgba(255,255,255,0.05)]"
      style={{ bottom: 'calc(8px + env(safe-area-inset-bottom))' }}
    >
      {/* Premium top highlight — gradient hairline */}
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Subtle inner glow at top */}
      <div className="pointer-events-none absolute inset-x-4 top-0 h-8 bg-gradient-to-b from-white/[0.03] to-transparent rounded-t-[1.5rem]" />

      <div className="relative flex items-stretch justify-around h-[64px] px-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => !isActive && hapticTick()}
              className="relative flex flex-col items-center justify-center flex-1 min-w-[48px] py-1.5 active:scale-95 transition-transform duration-150"
            >
              {/* Active pill background — premium glass effect */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-active-pill"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 38, mass: 0.7 }}
                    className="absolute inset-x-1 top-1 bottom-1 rounded-[1.1rem] bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_12px_rgba(255,255,255,0.04)]"
                  />
                )}
              </AnimatePresence>

              {/* Icon container with spring animation */}
              <motion.span
                key={isActive ? 'active' : 'inactive'}
                initial={isActive ? { scale: 0.5, y: 4 } : false}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 20, mass: 0.6 }}
                className="relative z-10 flex items-center justify-center h-7 w-7"
              >
                <Icon
                  className={`w-[24px] h-[24px] transition-all duration-300 ${
                    isActive
                      ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                      : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
              </motion.span>

              {/* Label with smooth transition */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.7,
                  y: isActive ? 0 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`relative z-10 mt-0.5 text-[11px] leading-none max-w-full truncate px-0.5 transition-colors duration-300 ${
                  isActive ? 'text-white font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                {item.name}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
