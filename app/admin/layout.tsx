"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShoppingBag,
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
  Scale,
  FileText,
  Wrench,
  Headphones
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import SoonBadge from "../src/components/SoonBadge";

function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const { t, language } = useLanguage();
  const { settings } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const isRtl = language === 'ar';

  useEffect(() => {
    // Default to closed on small screens (mobile/tablet).
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setIsSidebarOpen(false);
    }
  }, []);

  const closeSidebarIfMobile = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Role-based protection: non-admins should be kicked out of /admin
          if (parsedUser.role !== 'admin') {
            console.warn("Access denied. Admin role required.");
            router.push('/');
          }
        } catch (e) {
          console.error("Failed to parse user", e);
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    };

    checkAuth();

    // Listen for auth changes (e.g. login from another component)
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('auth-change', checkAuth);
    };
  }, [router]);

  const menuSections = [
    {
      title: isRtl ? 'الرئيسية' : 'Workspace',
      items: [
        { id: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard, label: t('admin.nav.dashboard') },
        { id: 'users', href: '/admin/users', icon: Users, label: t('admin.nav.users') },
      ]
    },
    {
      title: isRtl ? 'العقارات والطلبات' : 'Real Estate & Requests',
      items: [
        { id: 'orders', href: '/admin/orders', icon: ShoppingBag, label: t('admin.nav.orders_mgmt') || 'إدارة الطلبات' },
        { id: 'offers', href: '/admin/offers', icon: FileText, label: t('admin.nav.offers') || 'إدارة العروض' },
        { id: 'wallet', href: '/admin/wallet', icon: Wallet, label: t('admin.nav.wallet') || 'إدارة المحفظة' },
        { id: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard, label: t('admin.nav.subscriptions') || 'إدارة الاشتراكات' },
      ]
    },
    {
      title: isRtl ? 'الخدمات والعمليات' : 'Services & Operations',
      items: [
        { id: 'services', href: '/admin/services', icon: Wrench, label: t('admin.nav.services_mgmt') || 'إدارة الخدمات' },
        { id: 'transactions', href: '/admin/transactions', icon: Receipt, label: t('admin.nav.transactions') },
        { id: 'service-requests', href: '/admin/service-requests', icon: MessageSquare, label: t('admin.nav.services') },
      ]
    },
    {
      title: isRtl ? 'الأقسام والتسويق' : 'Departments & Marketing',
      items: [
        { id: 'marketing', href: '/admin/marketing', icon: Megaphone, label: t('admin.nav.marketing') },
        { id: 'legal',    href: '/admin/legal',            icon: Scale,         label: t('admin.nav.legal') },
        { id: 'customer-service', href: '/admin/customer-service', icon: Headphones, label: t('admin.nav.customer_service') || 'خدمة العملاء' },
      ]
    },
    {
      title: isRtl ? 'الإعدادات والتحكم' : 'Settings & Setup',
      items: [
        { id: 'info-content', href: '/admin/info-content', icon: ShieldAlert, label: t('admin.nav.info_content') || 'المحتوى القانوني' },
        { id: 'packages', href: '/admin/packages', icon: Briefcase, label: t('admin.nav.packages') },
        { id: 'settings', href: '/admin/settings', icon: Settings, label: t('admin.nav.settings') },
      ]
    },
    {
      title: '',
      items: [
        { id: 'details', href: '/details', icon: ArrowLeft, label: t('admin.nav.back_to_details') },
      ]
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-50/50" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Menu Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`fixed top-4 z-50 p-2 bg-slate-900 text-white rounded-lg lg:hidden ${isRtl ? 'left-4' : 'right-4'}`}
      >
        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          // Desktop widths
          isSidebarOpen ? 'lg:w-64' : 'lg:w-20'
        } w-64 fixed lg:static inset-y-0 z-40 bg-slate-950 text-white transition-transform lg:transition-all duration-300 ease-in-out border-slate-900 flex flex-col
        ${isRtl ? 'right-0 lg:border-l lg:border-r-0' : 'left-0 border-r'}
        ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Image
            src="/icons/\u0627\u0644\u0645\u0641\u0631\u063a \u0627\u0628\u064a\u0636.png"
            alt="Logo"
            width={isSidebarOpen ? 110 : 36}
            height={36}
            className="object-contain h-9 w-auto transition-all duration-300"
            priority
          />
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-black tracking-tighter text-lg whitespace-nowrap uppercase"
            >
              <span className="text-white/40">{settings.textOverrides?.['admin_badge'] || 'ADMIN'}</span>
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 hide-scrollbar">
          {menuSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(item => {
              const [itemPath] = item.href.split('?');
              const hrefToModule: Record<string, string> = {
                '/admin/transactions': 'finance',
                '/admin/marketing': 'marketing',
                '/admin/service-requests': 'service_requests',
                '/admin/legal': 'legal',
                '/admin/packages': 'subscriptions',
              };
              const moduleKey = hrefToModule[itemPath];
              const moduleStatus = moduleKey ? (settings.moduleFlags?.[moduleKey] || 'enabled') : 'enabled';
              return !(moduleKey && moduleStatus === 'disabled');
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1.5">
                {section.title && isSidebarOpen && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-black tracking-widest text-white/30 uppercase">
                    {section.title}
                  </div>
                )}
                {!isSidebarOpen && section.title && sIdx > 0 && (
                  <div className="h-[1px] bg-white/5 my-3 mx-2" />
                )}
                <div className="space-y-1.5">
                  {visibleItems.map((item) => {
                    const [itemPath] = item.href.split('?');
                    const isActive = pathname === itemPath;
                    
                    const hrefToSection: Record<string, string> = {
                      '/admin/transactions': 'financial',
                      '/admin/marketing': 'marketing',
                      '/admin/service-requests': 'services',
                      '/admin/legal': 'disputes',
                      '/admin/packages': 'subscriptions',
                      '/admin/customer-service': 'customerservice',
                    };

                    const hrefToModule: Record<string, string> = {
                      '/admin/transactions': 'finance',
                      '/admin/marketing': 'marketing',
                      '/admin/service-requests': 'service_requests',
                      '/admin/legal': 'legal',
                      '/admin/packages': 'subscriptions',
                    };
                    
                    const sectionKey = hrefToSection[itemPath];
                    const moduleKey = hrefToModule[itemPath];
                    const moduleStatus = moduleKey ? (settings.moduleFlags?.[moduleKey] || 'enabled') : 'enabled';
                    
                    const isClosed = (sectionKey && settings.sectionFlags?.[sectionKey] === 'closed') || (moduleKey && moduleStatus === 'soon');

                    return (
                      <div key={item.id} className="relative group">
                        <Link
                          href={isClosed ? '#' : item.href}
                          onClick={(e) => {
                            if (isClosed) e.preventDefault();
                            if (!isClosed) closeSidebarIfMobile();
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                            isActive 
                              ? 'bg-white text-slate-950 shadow-md shadow-white/5' 
                              : isClosed 
                                ? 'text-white/20 cursor-not-allowed opacity-50' 
                                : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'group-hover:scale-110 transition-transform'}`} />
                          {isSidebarOpen && (
                            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                          )}
                          
                          {isClosed && isSidebarOpen && (
                            <SoonBadge className="mr-auto">
                              {t('common.soon') || 'قريباً'}
                            </SoonBadge>
                          )}

                          {!isSidebarOpen && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                              {item.label} {isClosed ? `(${t('common.soon') || 'قريباً'})` : ''}
                            </div>
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                <p className="text-[8px] font-black text-white/30 truncate uppercase tracking-widest">{settings.textOverrides?.['admin_role_label'] || user.role}</p>
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
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4">
             <Image
               src="/icons/\u0627\u0644\u0645\u0641\u0631\u063a.png"
               alt="Logo"
               width={100}
               height={32}
               className="object-contain h-8 w-auto"
             />
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </Suspense>
  );
}
