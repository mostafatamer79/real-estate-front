"use client";

import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [shouldAddPadding, setShouldAddPadding] = useState(false);

  useEffect(() => {
    // List of public routes that don't require authentication
    const publicRoutes = ['/', '/login', '/verify-otp', '/customerservice'];
    
    const isPublic = publicRoutes.some(route => 
      pathname === route || (route !== '/' && pathname?.startsWith(route))
    );

    const token = localStorage.getItem('token');
    
    if (!token && !isPublic) {
      // If no token and not a public route, redirect to login
      router.push('/login');
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
        pathname?.startsWith('/offers') || 
        pathname?.startsWith('/orders') || 
        pathname === '/login';
    
    const isHomePage = pathname === '/';

    // We add padding if the header is visible AND it's not the home page
    const needsPadding = !isHiddenHeader && !isHomePage;
    
    setShouldAddPadding(needsPadding);
  }, [pathname]);

  return (
    <main className={shouldAddPadding ? "pt-16" : ""}>
      {children}
    </main>
  );
}
