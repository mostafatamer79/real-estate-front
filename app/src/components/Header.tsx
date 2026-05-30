"use client";
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import NotificationBell from "./NotificationBell";
import SoonBadge from "./SoonBadge";
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
  Building2,
  Briefcase
} from 'lucide-react';
import { useNotifications } from "@/context/NotificationContext";
import { Role } from "@/types/user";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleLanguage, language, t } = useLanguage();
  const { settings } = useSettings();
  const { notifications } = useNotifications();

  const unreadChatCount = React.useMemo(() => {
    return Array.isArray(notifications)
      ? notifications.filter(n => !n.isRead && n.type === 'chat').length
      : 0;
  }, [notifications]);


  useEffect(() => {
    const refreshUser = () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
          try {
              setUser(JSON.parse(storedUser));
          } catch (e) {
              console.error("Invalid user data");
              setUser(null);
          }
      } else {
        setUser(null);
      }
    };

    refreshUser();

    // Listen for custom auth changes (login/logout)
    window.addEventListener('auth-change', refreshUser);
    // Listen for changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'user' || e.key === 'token') refreshUser();
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('auth-change', refreshUser);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);

      // Notify other components
      window.dispatchEvent(new Event('auth-change'));

      router.push('/');
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

  // Determine if the header should be hidden based on the current route
  const isHiddenRoute = React.useMemo(() => {
    if (!pathname) return false;
    const hiddenPatterns = [
      '/admin',
      '/buildingmanagement',
      '/wallet',
      '/department-hub',
      '/login',
      '/internal',
      '/offers',
      '/orders'
    ];
    return hiddenPatterns.some(pattern => pathname.startsWith(pattern));
  }, [pathname]);

  // Hide header only if explicitly requested by overlay OR on special routes
  if (isHeaderHiddenByOverlay || isHiddenRoute) {
    return null;
  }

  return (
    <header
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`fixed top-0 left-0 right-0 h-16 z-[9999] transition-all duration-300 bg-slate-950 border-b border-white/10`}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => router.push('/details')}
        >
          <Image
            src="/icons/white.png"
            alt={t('project.name')}
            width={120}
            height={40}
            className="object-contain h-10 w-auto group-hover:opacity-80 transition-opacity"
            priority
          />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center">
              <div className="relative group/nav">
                <Link
                  href="/customerservice"
                  className={`flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors ${settings.sectionFlags.customerservice === 'closed' && user?.role !== Role.ADMIN ? 'opacity-40 grayscale' : ''}`}
                  onClick={(e) => {
                    if (settings.sectionFlags.customerservice === 'closed' && user?.role !== Role.ADMIN) e.preventDefault();
                  }}
                >
                   <Headset className="w-4 h-4" />
                   {t('header.customerService')}
                </Link>
                {settings.sectionFlags.customerservice === 'closed' && user?.role !== Role.ADMIN && (
                  <SoonBadge className="absolute -top-3 -right-2 pointer-events-none">
                    {t('common.soon') || 'قريباً'}
                  </SoonBadge>
                )}
              </div>

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
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-lg ring-2 ring-slate-950 animate-bounce animate-once">
                        {unreadChatCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/services/my-requests"
                    className="text-white/70 hover:text-white transition-colors relative"
                    title={t('header.myRequests')}
                  >
                    <Briefcase className="w-5 h-5" />
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

                  {user && user.departments && user.departments.length > 0 && user.role !== Role.ADMIN && (
                    <Link
                      href={`/internal`}
                      className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        {language === 'ar' ? "الادارات" : 'My Departments'}
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
                className={`flex items-center gap-3 text-white/80 text-lg font-medium ${settings.sectionFlags.customerservice === 'closed' && user?.role !== Role.ADMIN ? 'opacity-50 grayscale pointer-events-none' : ''}`}
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
                    className="flex items-center gap-3 text-white text-lg font-medium relative"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="relative">
                      <MessageSquare className="w-5 h-5" />
                      {unreadChatCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white shadow-md ring-1 ring-slate-950">
                          {unreadChatCount}
                        </span>
                      )}
                    </div>
                    {t('chat.title')}
                  </Link>

                  <Link
                    href="/services/my-requests"
                    className="flex items-center gap-3 text-white text-lg font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase className="w-5 h-5" />
                    {t('header.myRequests')}
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

                   {(user?.role === Role.ADMIN || user?.role === Role.MARKETING) && (
                    <div className="relative">
                      <Link
                        href="/marketing"
                        className={`flex items-center gap-3 text-orange-400 text-lg font-medium ${settings.sectionFlags.marketing === 'closed' && user?.role !== Role.ADMIN ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                          <LayoutDashboard className="w-5 h-5" />
                          {t('header.marketing_management')}
                      </Link>
                      {settings.sectionFlags.marketing === 'closed' && user?.role !== Role.ADMIN && (
                        <SoonBadge className="absolute left-0 top-0 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest">
                          {t('common.soon') || 'قريباً'}
                        </SoonBadge>
                      )}
                    </div>
                  )}

                   {(user?.role === Role.ADMIN || user?.role === Role.LEGAL) && (
                    <div className="relative">
                      <Link
                        href="/disputes"
                        className={`flex items-center gap-3 text-blue-400 text-lg font-medium ${settings.sectionFlags.disputes === 'closed' && user?.role !== Role.ADMIN ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                          <LayoutDashboard className="w-5 h-5" />
                          {t('header.legal_management')}
                      </Link>
                      {settings.sectionFlags.disputes === 'closed' && user?.role !== Role.ADMIN && (
                        <SoonBadge className="absolute left-0 top-0 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest">
                          {t('common.soon') || 'قريباً'}
                        </SoonBadge>
                      )}
                    </div>
                  )}

                   {(user?.role === Role.ADMIN || user?.role === Role.FINANCE) && (
                    <div className="relative">
                      <Link
                        href="/financial"
                        className={`flex items-center gap-3 text-emerald-400 text-lg font-medium ${settings.sectionFlags.financial === 'closed' && user?.role !== Role.ADMIN ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                          <LayoutDashboard className="w-5 h-5" />
                          {t('header.financial_management')}
                      </Link>
                      {settings.sectionFlags.financial === 'closed' && user?.role !== Role.ADMIN && (
                        <SoonBadge className="absolute left-0 top-0 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest">
                          {t('common.soon') || 'قريباً'}
                        </SoonBadge>
                      )}
                    </div>
                  )}


                   {/* Building Management Link (Restricted to those with departments or Admin, but NOT Watcher) */}
                   {(user?.role === Role.ADMIN || (user?.departments && user?.departments.length > 0)) && user?.role !== Role.VIEWER && (
                    <div className="relative">
                      <Link
                        href="/buildingmanagement"
                        className={`flex items-center gap-3 text-purple-400 text-lg font-medium ${settings.sectionFlags.buildingmanagement === 'closed' && user?.role !== Role.ADMIN ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                          <LayoutDashboard className="w-5 h-5" />
                          {t('action.propertyManagement')}
                      </Link>
                      {settings.sectionFlags.buildingmanagement === 'closed' && user?.role !== Role.ADMIN && (
                        <SoonBadge className="absolute left-0 top-0 px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest">
                          {t('common.soon') || 'قريباً'}
                        </SoonBadge>
                      )}
                    </div>
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
