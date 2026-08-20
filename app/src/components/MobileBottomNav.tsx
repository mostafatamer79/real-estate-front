"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid, FileText, User, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Pages where we DO NOT want to show the bottom nav
  const hiddenRoutes = ['/login', '/scan-map'];
  const isHidden = hiddenRoutes.some(route => pathname?.startsWith(route));

  // Hide nav on specific chat rooms but keep it on the main chat list
  const isChatRoom = pathname?.startsWith('/chat/') && pathname !== '/chat';
  
  if (isHidden || isChatRoom) return null;

  const navItems = [
    { name: t('home.title') || 'Home', path: '/details', icon: Home },
    { name: t('header.services') || 'Services', path: '/services', icon: Grid },
    { name: t('header.myRequests') || 'Requests', path: '/services/my-requests', icon: FileText },
    { name: t('chat.title') || 'Chat', path: '/chat', icon: MessageSquare },
    { name: t('profile.title') || 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-[64px] px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 ${
                isActive ? 'text-primary' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 scale-110' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'fill-primary/20' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
