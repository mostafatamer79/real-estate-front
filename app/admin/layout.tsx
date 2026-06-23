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
  Headphones,
  BarChart3,
  LineChart,
  MapPinned,
  Building2,
  Percent,
  TrendingUp
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

// ...existing code...
  const menuSections = [
    {

      title: '',
      items: [
        { id: 'details', href: '/details', icon: ArrowLeft, label: t('admin.nav.back_to_details') || (isRtl ? 'العودة للموقع' : 'Back to site') },
      ]
    },
    {
      title: isRtl ? 'الرئيسية' : 'Workspace',
      items: [
        { id: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard, label: isRtl ? ' لوح التحكم' : 'Dashboard' },
        { id: 'users', href: '/admin/users', icon: Users, label: isRtl ? ' المستخدمين' : 'Users' },
        { id: 'subscriptions', href: '/admin/subscriptions', icon: CreditCard, label: isRtl ? ' الاشتراكات' : 'Subscriptions' },
        { id: 'finance-transactions', href: '/admin/transactions', icon: Wallet, label: isRtl ? 'العمليات المالية' : 'Transactions' },

        { id: 'map-control', href: '/admin/map-control', icon: MapPinned, label: isRtl ? ' الخريطة' : 'Map' },
        { id: 'operations', href: '/admin/operations', icon: BarChart3, label: isRtl ? ' الاحصائيات والعمليات' : 'Stats & Operations' },
        { id: 'trends', href: '/admin/trends', icon: LineChart, label: isRtl ? ' تحليلات والاتجاهات' : 'Analytics & Trends' },
        { id: 'customer-service', href: '/admin/customer-service', icon: Headphones, label: isRtl ? ' خدمة العملاء' : 'Customer Service' },
        { id: 'chat', href: '/internal/chat', icon: MessageSquare, label: isRtl ? 'الرسائل والمحادثات' : 'Messages & Chats' },
        { id: 'settings', href: '/admin/settings', icon: Settings, label: isRtl ? 'الإعدادات والتحكم' : 'Settings & Control' },
      ]
    },
    {
      title: isRtl ? 'الإدارات' : 'Departments',
      items: [
        { id: 'offers', href: '/admin/offers', icon: FileText, label: isRtl ? 'إدارة العروض' : 'Offers Management' },
        { id: 'orders', href: '/admin/orders', icon: ShoppingBag, label: isRtl ? 'إدارة الطلبات' : 'Orders Management' },
        { id: 'marketing', href: '/admin/marketing', icon: Megaphone, label: isRtl ? 'إدارة التسويق' : 'Marketing Management' },
        { id: 'properties-management', href: '/admin/properties-management', icon: Building2, label: isRtl ? 'إدارة الاملاك' : 'Properties Management' },
        { id: 'legal', href: '/admin/legal', icon: Scale, label: isRtl ? 'الإدارة القانونية' : 'Legal Management' },
      ]
    },
    {
      title: isRtl ? 'الإدارة المالية' : 'Financial Management',
      items: [
        { id: 'finance-main', href: '/admin/wallet', icon: Receipt, label: isRtl ? 'الفواتير' : 'Finance Overview' },
        { id: 'invoices', href: '/admin/wallet?tab=invoices', icon: FileText, label: isRtl ? 'الفواتير' : 'Invoices' },
        { id: 'commissions', href: '/admin/wallet?tab=commissions', icon: Percent, label: isRtl ? 'العقود والعمولات' : 'Contracts & Commissions' },
        { id: 'files', href: '/admin/wallet?tab=files', icon: CreditCard, label: isRtl ? 'الملفات والمستندات' : 'Files & Documents' },
        { id: 'investments', href: '/admin/wallet?tab=investments', icon: TrendingUp, label: isRtl ? 'الاستثمارات' : 'Investments' },
      ]
    },
    {
      title: isRtl ? 'الخدمات' : 'Services',
      items: [
        { id: 'post-purchase', href: '/admin/services?type=post_purchase', icon: Wrench, label: isRtl ? 'خدمات ما بعد الشراء' : 'Post-purchase Services' },
        { id: 'legal-services', href: '/admin/services?type=legal', icon: ShieldAlert, label: isRtl ? 'الخدمات القانونية' : 'Legal Services' },
        { id: 'construction', href: '/admin/services?type=construction', icon: Building2, label: isRtl ? 'البناء والمقاولات' : 'Construction' },
        { id: 'marketing-services', href: '/admin/services?type=marketing', icon: Megaphone, label: isRtl ? 'خدمات التسويق' : 'Marketing Services' },
        { id: 'other-services', href: '/admin/services?type=other', icon: Wrench, label: isRtl ? 'أخرى' : 'Other' },
      ]
    },


  ];
// ...existing code...

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
        } w-64 fixed inset-y-0 z-40 bg-slate-950 text-white transition-transform lg:transition-all duration-300 ease-in-out border-slate-900 flex flex-col
        ${isRtl ? 'right-0 lg:border-l lg:border-r-0' : 'left-0 border-r'}
        ${isSidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <Image
            src={settings.logoWhiteUrl || '/icons/white.png'}
            alt="Logo"
            width={isSidebarOpen ? 150 : 44}
            height={settings.logoHeight || 44}
            className="object-contain w-auto transition-all duration-300"
            style={{ height: isSidebarOpen ? `${settings.logoHeight || 44}px` : '36px' }}
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
            const visibleItems = section.items;

            if (visibleItems?.length === 0) return null;

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
                  {visibleItems?.map((item) => {
                    const [itemPath] = item.href.split('?');
                    const itemSearch = item.href.includes('?') ? new URLSearchParams(item.href.split('?')[1]) : null;
                    const isActive = pathname === itemPath && (
                      itemSearch
                        ? Array.from(itemSearch.entries()).every(([key, value]) => searchParams.get(key) === value)
                        : !Array.from(searchParams.keys()).some((key) => ['tab', 'type', 'section'].includes(key))
                    );

                    const hrefToSection: Record<string, string> = {
                      '/admin/wallet': 'financial',
                      '/admin/transactions': 'financial',
                      '/admin/marketing': 'marketing',
                      '/admin/services': 'services',
                      '/admin/service-requests': 'services',
                      '/admin/legal': 'disputes',
                      '/admin/packages': 'subscriptions',
                      '/admin/customer-service': 'customerservice',
                    };

                    const hrefToModule: Record<string, string> = {
                      '/admin/dashboard': 'dashboard',
                      '/admin/users': 'users',
                      '/admin/subscriptions': 'subscriptions',
                      '/admin/transactions': 'finance',
                      '/admin/map-control': 'map_control',
                      '/admin/operations': 'operations',
                      '/admin/trends': 'trends',
                      '/admin/customer-service': 'customer_service',
                      '/internal/chat': 'chat',
                      '/admin/settings': 'settings',
                      '/admin/offers': 'offers',
                      '/admin/orders': 'orders',
                      '/admin/marketing': 'marketing',
                      '/admin/properties-management': 'properties',
                      '/admin/legal': 'legal',
                      '/admin/wallet': 'wallet',
                      '/admin/services': 'service_requests',
                      '/admin/service-requests': 'service_requests',
                      '/admin/packages': 'subscriptions',
                    };

                    const sectionKey = hrefToSection[itemPath];
                    const moduleKey = hrefToModule[itemPath];
                    const moduleStatus = moduleKey ? (settings.moduleFlags?.[moduleKey] || 'enabled') : 'enabled';

                    const isClosed = false;
                    const showAdminStatusBadge =
                      (sectionKey && settings.sectionFlags?.[sectionKey] === 'closed') ||
                      (moduleKey && (moduleStatus === 'soon' || moduleStatus === 'disabled'));

                    return (
                      <div key={item.id} className="relative group">
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            closeSidebarIfMobile();
                          }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                            isActive
                              ? 'bg-white text-slate-950 shadow-md shadow-white/5'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-slate-950' : 'group-hover:scale-110 transition-transform'}`} />
                          {isSidebarOpen && (
                            <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                          )}

                          {showAdminStatusBadge && isSidebarOpen && (
                            <SoonBadge className="mr-auto">
                              {moduleStatus === 'disabled' ? (isRtl ? 'معطل' : 'Off') : (t('common.soon') || 'قريباً')}
                            </SoonBadge>
                          )}

                          {!isSidebarOpen && (
                            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 pointer-events-none">
                              {item.label} {showAdminStatusBadge ? `(${moduleStatus === 'disabled' ? (isRtl ? 'معطل' : 'Off') : (t('common.soon') || 'قريباً')})` : ''}
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
      <main
        className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
          isRtl
            ? isSidebarOpen ? 'lg:mr-64' : 'lg:mr-20'
            : isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 shrink-0">
           <div className="flex items-center gap-4">
             <Image
               src={settings.logoBlackUrl || '/icons/black.png'}
               alt="Logo"
               width={200}
               height={settings.logoHeight || 40}
               className="object-contain w-auto"
               style={{ height: `${settings.logoHeight || 40}px` }}
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
