"use client";
import React, { useState, useEffect } from 'react';
import SignIn from "../../login/page";
import Header from "./Header";

export default function HomePage() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [animateText, setAnimateText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start the fade-out animation
      setAnimateText('fade-out');
      
      // Show the SignIn component after the fade-out animation completes
      setTimeout(() => {
        setShowSignIn(true);
      }, 500);
    }, 3000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className='w-full h-screen bg-slate-950 flex flex-col relative' dir="rtl">
      <Header onSignUp={() => setShowSignIn(true)} />

      {/* Option 1: Fade out */}
    <div className={`flex-1 flex items-center justify-center text-white text-2xl font-bold text-center py-72 ${
  animateText === 'fade-out' ? 'fade-out-animation' : ''
}`}>
  عقارات السعودية
</div>
      {/* Option 2: Slide up (uncomment to use) */}
      {/* <div className={`flex-1 flex items-center justify-center text-white text-2xl font-bold text-center py-72 transition-all duration-500 ${
        animateText === 'fade-out' ? 'opacity-0 translate-y-[-20px]' : 'opacity-100 translate-y-0'
      }`}>
        عقارات السعودية
      </div> */}

      {/* Option 3: Scale down (uncomment to use) */}
      {/* <div className={`flex-1 flex items-center justify-center text-white text-2xl font-bold text-center py-72 transition-all duration-500 ${
        animateText === 'fade-out' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}>
        عقارات السعودية
      </div> */}

      {showSignIn && <SignIn onClose={() => setShowSignIn(false)} />}
    </section>
  );
} 