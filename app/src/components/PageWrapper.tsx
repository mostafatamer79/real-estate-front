"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext';

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
      router.push('/login');
    }

    if (token && !isPublic && pathname !== '/profile' && pathname !== '/complete-profile') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const parsedUser = JSON.parse(userStr);
          let needsProfileCompletion = false;
          if (parsedUser.role !== 'admin') {
            const isProfileComplete = !!parsedUser.firstName && !!parsedUser.lastName;
            const isAgentWithoutLicense = (parsedUser.role === 'agent' || parsedUser.role === 'broker') && !parsedUser.agentLicenseNumber && !parsedUser.falLicenseNumber;
            needsProfileCompletion = !isProfileComplete || isAgentWithoutLicense;
          }
          
          if (needsProfileCompletion) {
            router.push('/profile');
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

  const hiddenRoutes = ['/login', '/scan-map'];
  const isHidden = hiddenRoutes.some(route => pathname?.startsWith(route));
  const isChatRoom = pathname?.startsWith('/chat/') && pathname !== '/chat';
  const hasBottomNav = !isHidden && !isChatRoom;

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`${shouldAddPadding ? "pt-16" : ""} ${hasBottomNav ? "pb-[92px] pb-nav-safe md:pb-0" : ""}`}
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}
