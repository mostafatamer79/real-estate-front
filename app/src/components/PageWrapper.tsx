"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';
import { needsProfileCompletion } from '@/lib/profile-completion';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: settingsLoading } = useSettings();

  useEffect(() => {
    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/verify-otp', '/nafath-login', '/customerservice'];

    const isPublic = publicRoutes.some(route =>
      pathname === route || (route !== '/' && pathname?.startsWith(route))
    );

    const token = localStorage.getItem('token');

    // Wait until settings have loaded to avoid a premature redirect on first render.

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

  }, [pathname, router, settingsLoading]);

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
  const shouldAddPadding = !isHiddenHeader && !isHomePage;

  return <AnimatePresence mode="wait"><motion.main key={pathname} initial={{ opacity: 0, y: 8, scale: 0.995 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.998 }} transition={{ duration: 0.35 }} className={shouldAddPadding ? "pt-16" : ""}>{children}</motion.main></AnimatePresence>;
}
