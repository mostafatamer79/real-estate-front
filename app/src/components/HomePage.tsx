"use client";
import React, { useState, useEffect } from 'react';
import SignIn from "../../login/page";
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
      
      {!isLoggedIn && (
        <div className={`flex-1 flex items-center justify-center text-white text-5xl font-bold text-center py-72`}>
        دير عقارك
        </div>
      )}

       {isLoggedIn && (
          <div className="flex-1 flex flex-col items-center justify-center text-white">
        
          </div>
      )}

      {showSignIn && !isLoggedIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </section>
  );
}