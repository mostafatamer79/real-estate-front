"use client";
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from "@/context/LanguageContext";
import NotificationBell from "./NotificationBell";
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  Headset, 
  Languages, 
  Menu, 
  X,
  Bell,
  MessageSquare,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { Role } from "@/types/user";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleLanguage, language, t } = useLanguage();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            setUser(JSON.parse(storedUser));
        } catch (e) {
            console.error("Invalid user data");
        }
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/');
      window.location.reload(); 
  };

  const [isHeaderHiddenByOverlay, setIsHeaderHiddenByOverlay] = useState(false);

  useEffect(() => {
    const checkHeaderVisibility = () => {
      setIsHeaderHiddenByOverlay(document.body.getAttribute('data-hide-header') === 'true');
    };

    // Initial check
    checkHeaderVisibility();

    // Observe body attributes
    const observer = new MutationObserver(checkHeaderVisibility);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-hide-header'] });

    return () => observer.disconnect();
  }, []);

  if (pathname !== '/details' || isHeaderHiddenByOverlay) {
    return null;
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 h-16 z-[9999] transition-all duration-300 bg-slate-950 border-b border-white/10`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
        {/* Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => router.push('/')}
        >

          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r bg-white">
             {t('project.name')}
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
             <Link 
               href="/customerservice" 
               className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors"
             >
                <Headset className="w-4 h-4" />
                {t('header.customerService')}
             </Link>
             
             <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium uppercase transition-colors"
             >
                <Languages className="w-4 h-4" />
                {language === 'ar' ? 'English' : 'العربية'}
             </button>

             {user && (
               <div className="flex items-center gap-4">
                  <NotificationBell />

                  <Link 
                    href="/chat"
                    className="text-white/70 hover:text-white transition-colors relative"
                    title={t('chat.title')}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  
                  <div className="h-6 w-px bg-white/10 mx-2"></div>

                  <Link 
                    href="/profile" 
                    className="flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">
                      {user.firstName || user.email?.split('@')[0]}
                    </span>
                  </Link>
                  
                  {user?.role === Role.ADMIN && (
                    <Link 
                      href="/admin/dashboard" 
                      className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium text-sm transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        {t('home.controlPanel')}
                    </Link>
                  )}

       

       

                  <button
                    onClick={handleLogout}
                    className="p-2 text-white/70 hover:text-red-400 transition-colors"
                    title={t('header.logout')}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
               </div>
             )}
              
            {!user && (
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-full shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                >
                  {t('header.login')}
                </button>
            )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-white/10 flex flex-col p-6 gap-6 z-40 animate-in slide-in-from-top duration-300">
           <Link 
               href="/customerservice" 
               className="flex items-center gap-3 text-white/80 text-lg font-medium"
               onClick={() => setIsMenuOpen(false)}
             >
                <Headset className="w-5 h-5" />
                {t('header.customerService')}
             </Link>
             
             <button 
                onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                className="flex items-center gap-3 text-white/80 text-lg font-medium uppercase"
             >
                <Languages className="w-5 h-5" />
                {language === 'ar' ? 'English' : 'العربية'}
             </button>

             {user ? (
               <>
                 <Link 
                    href="/profile" 
                    className="flex items-center gap-3 text-white text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    {user.firstName || user.email}
                  </Link>

                  <Link 
                    href="/chat" 
                    className="flex items-center gap-3 text-white text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MessageSquare className="w-5 h-5" />
                    {t('chat.title')}
                  </Link>
                  
                  {user?.role === Role.ADMIN && (
                    <Link 
                      href="/admin/dashboard" 
                      className="flex items-center gap-3 text-emerald-400 text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('home.controlPanel')}
                    </Link>
                  )}

                  {(user?.role === Role.ADMIN || user?.role === Role.VIEWER || user?.role === Role.MARKETING || user?.role === Role.MARKETING_ADMIN) && (
                    <Link 
                      href="/marketing" 
                      className="flex items-center gap-3 text-orange-400 text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('header.marketing_management')}
                    </Link>
                  )}

                  {(user?.role === Role.ADMIN || user?.role === Role.VIEWER || user?.role === Role.LEGAL || user?.role === Role.LEGAL_ADMIN) && (
                    <Link 
                      href="/disputes" 
                      className="flex items-center gap-3 text-blue-400 text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('header.legal_management')}
                    </Link>
                  )}

                  {(user?.role === Role.ADMIN || user?.role === Role.VIEWER || user?.role === Role.FINANCE || user?.role === Role.FINANCE_ADMIN) && (
                    <Link 
                      href="/financial" 
                      className="flex items-center gap-3 text-emerald-400 text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        {t('header.financial_management')}
                    </Link>
                  )}

                  {(user?.role === Role.ADMIN || user?.role === Role.VIEWER || user?.role === Role.AGENT || user?.role === Role.BROKER) && (
                    <Link 
                      href="/customerservice" 
                      className="flex items-center gap-3 text-purple-400 text-lg font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        ادارة الاملاك
                    </Link>
                  )}

                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="flex items-center gap-3 text-red-400 text-lg font-medium mt-4"
                  >
                    <LogOut className="w-5 h-5" />
                    {t('header.logout')}
                  </button>
               </>
             ) : (
                <button
                  onClick={() => { router.push('/login'); setIsMenuOpen(false); }}
                  className="w-full py-3 bg-slate-600 text-white text-lg font-semibold rounded-xl shadow-lg"
                >
                  {t('header.login')}
                </button>
             )}
        </div>
      )}
    </header>
  );
}
