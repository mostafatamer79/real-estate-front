"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { needsProfileCompletion } from '@/lib/profile-completion';
import { useLanguage } from '@/context/LanguageContext';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.998,
    transition: {
      duration: 0.2,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const [shouldAddPadding, setShouldAddPadding] = useState(false);
  const { settings, isLoading: settingsLoading } = useSettings();

  useEffect(() => {
    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/verify-otp', '/customerservice'];
    
    const isPublic = publicRoutes.some(route => 
      pathname === route || (route !== '/' && pathname?.startsWith(route))
    );

    const token = localStorage.getItem('token');

    // When the global free trial is active, all routes are accessible without login.
    // Also wait until settings have loaded to avoid a premature redirect on first render.
    const globalFreeTrial = settings.uiFlags['enable_global_free_trial'] === true;

    if (!token && !isPublic && !settingsLoading) {
      // If no token and not a public route, redirect to login
      router.replace('/login');
    }

    if (token && !isPublic && pathname !== '/profile' && pathname !== '/complete-profile') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          if (needsProfileCompletion(parsedUser)) {
            router.replace('/profile');
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    
    // List of paths where the header is hidden or special handling is needed
    // Matches logic in Header.tsx: /wallet, /buildingmanagement, /login
    // Also excluding '/' (Home) as per plan
    const isHiddenHeader = 
        pathname?.startsWith('/wallet') || 
        pathname?.startsWith('/buildingmanagement') || 
        pathname?.startsWith('/department-hub') || 
        pathname?.startsWith('/admin') || 
        pathname?.startsWith('/internal') || 
        pathname?.startsWith('/services') || 
        pathname === '/offers' || 
        pathname === '/orders' || 
        pathname === '/login';
    
    const isHomePage = pathname === '/';

    // We add padding if the header is visible AND it's not the home page
    const needsPadding = !isHiddenHeader && !isHomePage;
    
    setShouldAddPadding(needsPadding);
  }, [pathname, settings, settingsLoading]);

  const fallbackPath = () => {
    if (pathname?.startsWith('/admin')) return '/admin/dashboard';
    if (pathname?.startsWith('/internal')) return '/internal';
    if (pathname?.startsWith('/services')) return '/services';
    if (pathname?.startsWith('/wallet')) return '/details';
    return '/details';
  };

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackPath());
  };

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={shouldAddPadding ? "pt-16" : ""}
      >
        {pathname !== "/" && pathname !== "/login" && (
          <button
            type="button"
            onClick={handleBack}
            aria-label={language === "ar" ? "رجوع" : "Back"}
            className="fixed end-4 top-20 z-[90] hidden md:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
          >
            <ArrowLeft className={language === "ar" ? "h-4 w-4 rotate-180" : "h-4 w-4"} />
            <span>{language === "ar" ? "رجوع" : "Back"}</span>
          </button>
        )}
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
