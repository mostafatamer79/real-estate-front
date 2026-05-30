"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import SignIn from "../../login/page";
import { useRouter } from 'next/navigation';
import { useSettings } from '@/context/SettingsContext';

export default function HomePage() {
  const [showSignIn, setShowSignIn] = useState(false);
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
          if (u.role === 'admin') router.push('/admin/dashboard');
          else if (u.departments && u.departments.length > 0) router.push('/department-hub');
          else router.push('/details');
        } catch (e) {
          router.push('/details');
        }
      } else {
        router.push('/details');
      }
    } else {
      const timer = setTimeout(() => {
        setShowSignIn(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <section className='w-full h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden' dir="rtl">
      {/* background radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />

      {/* Splash — shown while not logged in and sign-in not yet shown */}
      {!isLoggedIn && !showSignIn && (
        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
          {isLoading ? (
            <span className="inline-block w-48 h-16 bg-white/5 rounded-2xl animate-pulse" />
          ) : (
            <Image
              src="/icons/white.png"
              alt={settings.appName}
              width={240}
              height={80}
              className="object-contain h-20 w-auto"
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
                className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse"
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