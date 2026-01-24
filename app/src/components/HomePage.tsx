"use client";
import React, { useState, useEffect } from 'react';
import SignIn from "../../login/page";
import Header from "./Header";
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [animateText, setAnimateText] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
        // Optional: Redirect to meaningful page if logged in
        router.push('/details'); 
    } else {
        const timer = setTimeout(() => {
          setAnimateText('fade-out');
          setTimeout(() => {
            setShowSignIn(true);
          }, 500);
        }, 3000);
        return () => clearTimeout(timer);
    }
  }, []);

  return (
    <section className='w-full h-screen bg-slate-950 flex flex-col relative' dir="rtl">
      <Header onSignUp={() => setShowSignIn(true)} />

      {!isLoggedIn && (
        <div className={`flex-1 flex items-center justify-center text-white text-5xl font-bold text-center py-72 ${
            animateText === 'fade-out' ? 'fade-out-animation' : ''
        }`}>
        دير عقارك
        </div>
      )}

       {isLoggedIn && (
          <div className="flex-1 flex flex-col items-center justify-center text-white">
              <h1 className="text-4xl font-bold mb-8">مرحباً بك في نظام إدارة العقارات</h1>
               <div className="flex gap-4">
                  <button onClick={() => router.push('/details')} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                    تصفح العقارات
                  </button>
                   <button onClick={() => router.push('/scan-map')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-bold">
                    مسح المنطقة (Scan)
                  </button>
               </div>
          </div>
      )}

      {showSignIn && !isLoggedIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </section>
  );
}