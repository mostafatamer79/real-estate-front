"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import SignIn from "../../login/page";
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

export default function HomePage() {
  const [showSignIn, setShowSignIn] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const { settings, isLoading } = useSettings();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);

           router.push('/details');
        } catch (e) {
          router.push('/details');
        }
      } else {
        router.push('/details');
      }
    } else if (!showSignIn) {
      setShowSignIn(true);
    }
  }, [showSignIn, router]);

  return (
    <section 
      className='w-full h-screen flex flex-col items-center justify-center relative overflow-hidden' 
      dir="rtl"
      style={{ 
        // backgroundImage: "url('/cover.jpeg')",
        // backgroundSize: "cover",
        // backgroundPosition: "center",
        // backgroundRepeat: "no-repeat"
      }}
    >
      {/* Dark overlay to match splash theme and keep text readable */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{ backgroundColor: settings.splashBg ? `${settings.splashBg}33` : 'rgba(11, 15, 25, 0.2)' }} 
      />

      {/* background radial glow */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />

      {/* Splash — shown while not logged in and sign-in not yet shown */}
      {!isLoggedIn && !showSignIn && (
        <div className="flex flex-col items-center gap-3 md:gap-6 animate-in fade-in duration-700 relative z-10">
          {isLoading ? (
            <span className="inline-block w-48 h-16 bg-card/5 rounded-2xl animate-pulse" />
          ) : (
            <Image
              src={settings.logoWhiteUrl || '/icons/white.png'}
              alt={settings.appName}
              width={480}
              height={Number(settings.splashLogoHeight || 120)}
              className="object-contain w-auto h-24 sm:h-32 md:h-40"
              style={settings.splashLogoHeight ? { height: `${settings.splashLogoHeight}px` } : undefined}
              priority
            />
          )}
          <p className="text-white/30 text-sm font-medium">
            {isLoading ? '' : settings.description}
          </p>
          {/* Loading dots */}
          <div className="flex gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-card/20 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sign-in overlay */}
      {showSignIn && !isLoggedIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </section>
  );
}