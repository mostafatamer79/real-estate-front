"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  CreditCard, 
  Receipt,
  MessageSquare,
  ShieldAlert,
  Megaphone,
  Briefcase,
  Wallet,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User as UserIcon,
  ArrowLeft,
  Scale
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push('/login');
    }
  }, [router]);

  const menuItems = [
    { id: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.nav.dashboard') },
    { id: 'users', href: '/admin/users', icon: Users, label: t('admin.nav.users') },
    { id: 'transactions', href: '/admin/transactions', icon: Receipt, label: t('admin.nav.transactions') },
    { id: 'marketing', href: '/admin/marketing', icon: Megaphone, label: t('admin.marketing.title') },
    { id: 'services', href: '/admin/service-requests', icon: MessageSquare, label: t('admin.nav.services') },
    { id: 'legal',    href: '/admin/legal',            icon: Scale,         label: 'الإدارة القانونية' },
  
    { id: 'packages', href: '/admin/packages', icon: Briefcase, label: t('admin.nav.packages') },
    { id: 'settings', href: '/admin/settings', icon: Settings, label: t('admin.nav.settings') },
    { id: 'details', href: '/details', icon: ArrowLeft, label: t('admin.nav.back_to_details') },
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50/50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-lg lg:hidden"
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } fixed lg:static inset-y-0 z-40 bg-slate-950 text-white transition-all duration-300 ease-in-out border-r border-slate-900 flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-slate-950" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black tracking-tighter text-lg whitespace-nowrap"
            >
              DARAKARK <span className="text-white/40">ADMIN</span>
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1.5 hide-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                  isActive 
                    ? 'bg-white text-slate-950' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'group-hover:scale-110 transition-transform'}`} />
                {isSidebarOpen && (
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                )}
                {/* Tooltip for collapsed sidebar */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/5 space-y-3">
          {isSidebarOpen && (
            <div className="px-3 py-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black">
                {user.firstName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-[8px] font-black text-white/30 truncate uppercase tracking-widest">{user.role}</p>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-red-500/10 transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              {isSidebarOpen && (
              <span className="text-xs font-black uppercase tracking-widest">{t('admin.nav.logout')}</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Placeholder */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-end px-8 shrink-0">
           <div className="flex items-center gap-4">
             {/* Add Notifications or Language Switcher if needed */}
           </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto py-8 px-6 lg:px-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
