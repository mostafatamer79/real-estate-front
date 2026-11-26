"use client";

import { usePathname, useRouter } from 'next/navigation';
import { loginHref } from "@/lib/auth-navigation";
import { isPublicBrowsingPath } from "@/lib/seo";
import { cinematicRouteFamily } from "@/lib/cinematic-route-family";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading: settingsLoading } = useSettings();
  const { language } = useLanguage();
  const [verificationRequired, setVerificationRequired] = useState(false);

  useEffect(() => {
    const showVerification = () => setVerificationRequired(true);
    window.addEventListener('nafath-verification-required', showVerification);
    return () => window.removeEventListener('nafath-verification-required', showVerification);
  }, []);

  useEffect(() => {
    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/verify-otp', '/customerservice', '/services/form', '/services/legal'];

    const isPublic = isPublicBrowsingPath(pathname) || publicRoutes.some(route =>
      pathname === route || (route === '/customerservice' && ['/customerservice/contact', '/customerservice/faq', '/customerservice/support'].includes(pathname))
    );

    let token: string | null = null;
    try { token = localStorage.getItem('token'); } catch {}

    // Wait until settings have loaded to avoid a premature redirect on first render.

    if (!token && !isPublic && !settingsLoading) {
      // If no token and not a public route, redirect to login
      router.replace(loginHref(window.location.pathname + window.location.search));
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

  // App Router owns the page lifecycle. Retaining an exiting page here can
  // leave the incoming route inside a main element with opacity: 0.
  return <main data-appearance-content data-cinematic-family={cinematicRouteFamily(pathname)} className={shouldAddPadding ? "pt-16" : ""}>
    {verificationRequired && pathname !== '/profile' && <div role="alert" className="sticky top-16 z-50 mx-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <p>{language === 'ar' ? 'يمكنك التصفح. لإتمام هذا الإجراء، وثّق هويتك عبر نفاذ من ملفك الشخصي.' : 'You can browse. To complete this action, verify your identity through Nafath on your profile.'}</p>
      <Link href="/profile" className="shrink-0 font-bold underline">{language === 'ar' ? 'توثيق الهوية' : 'Verify identity'}</Link>
      <button type="button" onClick={() => setVerificationRequired(false)} aria-label={language === 'ar' ? 'إغلاق' : 'Dismiss'} className="p-2">×</button>
    </div>}
    {children}</main>;
}
