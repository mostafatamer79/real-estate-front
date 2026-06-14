"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Megaphone,
  Building2,
  Wallet,
  Scale,
  Users,
  TrendingUp,
  Activity,
  PlusCircle,
  FileText,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import InternalRequestsPage from "@/app/internal/[dept]/requests/page";
import BuildingManagementPage from "@/app/buildingmanagement/page";
import FinancialPage from "@/app/financial/page";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { Role } from "@/types/user";

// ─── Department Config ──────────────────────────────────────────────────────
const DEPT_CONFIG: Record<string, {
  nameAr: string;
  nameEn: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  Icon: React.ElementType;
  description: string;
}> = {
  marketing: {
    nameAr: 'إدارة التسويق',
    nameEn: 'Marketing',
    color: 'text-slate-700',
    gradientFrom: 'from-slate-900',
    gradientTo: 'to-slate-700',
    Icon: Megaphone,
    description: 'إدارة حملات التسويق والإعلانات العقارية',
  },
  properties: {
    nameAr: 'إدارة الاملاك',
    nameEn: 'Properties',
    color: 'text-slate-700',
    gradientFrom: 'from-slate-900',
    gradientTo: 'to-slate-700',
    Icon: Building2,
    description: 'إدارة العقارات والممتلكات المسجلة في المنظومة',
  },
  finance: {
    nameAr: 'الإدارة المالية',
    nameEn: 'Finance',
    color: 'text-slate-700',
    gradientFrom: 'from-slate-900',
    gradientTo: 'to-slate-700',
    Icon: Wallet,
    description: 'متابعة المعاملات المالية والتقارير والمحاسبة',
  },
  legal: {
    nameAr: 'الإدارة القانونية',
    nameEn: 'Legal',
    color: 'text-slate-700',
    gradientFrom: 'from-slate-900',
    gradientTo: 'to-slate-700',
    Icon: Scale,
    description: 'متابعة العقود والنزاعات القانونية والامتثال',
  },
  employees: {
    nameAr: 'إدارة الموظفين',
    nameEn: 'Employees',
    color: 'text-slate-700',
    gradientFrom: 'from-slate-900',
    gradientTo: 'to-slate-700',
    Icon: Users,
    description: 'إدارة ملفات الموظفين والإجراءات الإدارية',
  },
};

const canonicalDeptSlug = (slug: string) => {
  const s = String(slug || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "financial") return "finance";
  if (s === "employee") return "employees";
  if (s === "property" || s === "property_management" || s === "pm") return "properties";
  return s;
};

function StatCard({ label, value, icon: Icon, color }: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-950 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

export default function DepartmentDashboard() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deptParam = params.dept as string;
  const dept = canonicalDeptSlug(deptParam);
  const view = searchParams.get('view') || 'dashboard';
  const config = DEPT_CONFIG[dept];
  const { isOpen, message, isAdmin } = useSectionGuard('internal');
  const { t } = useLanguage();
  const { settings } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, done: 0 });
  const [mgrLoading, setMgrLoading] = useState(false);
  const [mgrSummary, setMgrSummary] = useState<any>(null);

  useEffect(() => {
    if (deptParam && dept && deptParam !== dept) {
      router.replace(`/internal/${dept}?${searchParams.toString()}`);
      return;
    }
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      window.location.href = '/login';
      return;
    }
    const parsed = JSON.parse(storedUser);
    setUser(parsed);

    const departments = Array.isArray(parsed.departments) ? parsed.departments : [];
    const perm = parsed.departmentPermissions?.[dept];
    const permAlias = dept === 'finance' ? parsed.departmentPermissions?.financial : undefined;
    const isFinance = dept === 'finance';
    const canAccessDept = parsed.role === 'admin' || 
                         departments.includes(dept) || 
                         (isFinance && departments.includes('financial')) ||
                         (dept === 'properties' && (departments.includes('offers') || departments.includes('orders'))) ||
                         (perm && perm !== 'none') ||
                         (permAlias && permAlias !== 'none') ||
                         (dept === 'properties' && parsed.departmentPermissions?.offers && parsed.departmentPermissions.offers !== 'none') ||
                         (dept === 'properties' && parsed.departmentPermissions?.orders && parsed.departmentPermissions.orders !== 'none') ||
                         (isFinance && parsed.departmentPermissions?.financial && parsed.departmentPermissions.financial !== 'none');
    
    if (!canAccessDept) {
      const firstDepartment = departments[0] || 'properties';
      const fallback = firstDepartment === 'offers' || firstDepartment === 'orders' ? 'properties' : firstDepartment;
      router.replace(`/internal/${fallback}`);
      return;
    }

    // If this department module is removed/soon, block. (Soon shouldn't work unless admin previews.)
    const deptModuleStatus = settings.moduleFlags?.[dept] || 'enabled';
    const isPreview = searchParams.get('preview') === '1';
    const blockedByModule = deptModuleStatus === 'disabled' || (deptModuleStatus === 'soon' && !(parsed.role === 'admin' && isPreview));
    if (blockedByModule) {
      router.replace('/department-hub');
      return;
    }

    // No redirect: /internal/<dept> stays the shell. Department workspaces are rendered below.

    // Manager home uses aggregated dashboard summary
    if (parsed.role === Role.MANGER && view === 'dashboard') {
      setMgrLoading(true);
      api.get('/dashboard/manager')
        .then((res) => setMgrSummary(res.data))
        .catch(() => setMgrSummary(null))
        .finally(() => setMgrLoading(false));
      return;
    }

    // Non-manager: dept-specific service request counts (best-effort)
    api.get(`/service-requests/by-department/${dept}?countOnly=true`)
      .then(res => {
        if (res.data) {
          setStats({
            pending: res.data.pending ?? 0,
            inProgress: res.data.inProgress ?? 0,
            done: res.data.done ?? 0,
          });
        }
      })
      .catch(() => {});
  }, [dept, deptParam, router, view, searchParams, settings.moduleFlags]);

  const isPreview = searchParams.get('preview') === '1';
  const deptModuleStatus: 'enabled' | 'soon' | 'disabled' = (settings.moduleFlags?.[dept] as any) || 'enabled';
  if (deptModuleStatus === 'soon' && !(isAdmin && isPreview)) {
    return <ComingSoonOverlay sectionName={config?.nameAr || "الإدارة الداخلية"} message={settings.moduleMessages?.[dept] || ''} isAdmin={isAdmin} />;
  }

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={config?.nameAr || "الإدارة الداخلية"} message={message} isAdmin={isAdmin} />;
  }

  if (!config) return (
    <div className="flex items-center justify-center h-64 text-slate-400 font-bold">
      إدارة غير معروفة
    </div>
  );

  // Internal department workspaces use the full building management surface for
  // the shared operational modules so the sidebar, nested nav, and transitions
  // stay identical across /buildingmanagement and /internal.
  if (dept === 'finance') {
    const financialTabMap: Record<string, string> = {
      financial: 'dashboard',
      dashboard: 'dashboard',
      transactions: 'transactions',
      payments: 'payments',
      expenses: 'expenses',
      reports: 'reports',
      settlements: 'settlements',
      service_requests: 'service_requests',
    };
    const financeTab = financialTabMap[searchParams.get('section') || 'financial'] || 'dashboard';
    return <FinancialPage embedded initialTab={financeTab} />;
  }

  if (['properties', 'marketing', 'legal', 'employees'].includes(dept)) {
    return <BuildingManagementPage />;
  }

  if (view !== 'dashboard') {
    if (view === 'properties' || view === 'employees' || view === 'marketing' || view === 'financial' || view === 'legal') {
      if (view === 'financial') {
        const status = settings.moduleFlags?.finance || 'enabled';
        if (status === 'disabled') {
          router.replace(`/internal/${dept}?view=dashboard`);
          return null;
        }
        if (status === 'soon' && !(isAdmin && isPreview)) {
          return <ComingSoonOverlay sectionName={config?.nameAr || "الإدارة الداخلية"} message={settings.moduleMessages?.finance || ''} isAdmin={isAdmin} />;
        }
        const financialTabMap: Record<string, string> = {
          financial: 'dashboard',
          dashboard: 'dashboard',
          transactions: 'transactions',
          payments: 'payments',
          expenses: 'expenses',
          reports: 'reports',
          settlements: 'settlements',
          service_requests: 'service_requests',
        };
        const financeTab = financialTabMap[searchParams.get('section') || 'financial'] || 'dashboard';
        return <FinancialPage embedded initialTab={financeTab} />;
      }

      const section = searchParams.get('section') || '';
      const viewToModule: Record<string, string> = {
        properties: section === 'offers' ? 'offers' : section === 'orders' ? 'orders' : 'properties',
        employees: 'employees',
        marketing: 'marketing',
        legal: 'legal',
      };
      const moduleKey = viewToModule[view] || view;
      const status = settings.moduleFlags?.[moduleKey] || 'enabled';
      if (status === 'disabled') {
        router.replace(`/internal/${dept}?view=dashboard`);
        return null;
      }
      if (status === 'soon' && !(isAdmin && isPreview)) {
        return <ComingSoonOverlay sectionName={config?.nameAr || "الإدارة الداخلية"} message={settings.moduleMessages?.[moduleKey] || ''} isAdmin={isAdmin} />;
      }
      return <BuildingManagementPage />;
    }
    if (view === 'requests') {
      const status = settings.moduleFlags?.service_requests || 'enabled';
      if (status === 'disabled') {
        router.replace(`/internal/${dept}?view=dashboard`);
        return null;
      }
      if (status === 'soon' && !(isAdmin && isPreview)) {
        return <ComingSoonOverlay sectionName="طلبات الخدمات" message={settings.moduleMessages?.service_requests || ''} isAdmin={isAdmin} />;
      }
      return <InternalRequestsPage />;
    }
  }

  const DeptIcon = config.Icon;
  const now = new Date();
  const greeting = now.getHours() < 12 ? 'صباح الخير' : now.getHours() < 17 ? 'مساء الخير' : 'مساء النور';

  const moduleStatus = (k: string): 'enabled' | 'soon' | 'disabled' => (settings.moduleFlags?.[k] as any) || 'enabled';
  const moduleMessage = (k: string) => settings.moduleMessages?.[k] || '';

  // Manager dashboard
  if (user?.role === Role.MANGER && view === 'dashboard') {
    const counts = mgrSummary?.counts || {};
    const mods = mgrSummary?.modules || {};

    // Re-mapped relevant modules for filtering
    const DEPT_RELEVANT_MODULES: Record<string, string[]> = {
      marketing: ['marketing'],
      properties: ['properties', 'orders', 'offers'],
      finance: ['finance'],
      legal: ['legal'],
      employees: ['employees'],
    };

    const cards: Array<{ key: string; label: string; value: any; icon: React.ElementType; moduleKey: string }> = [];
    if (mods.properties && moduleStatus('properties') === 'enabled') cards.push({ key: 'properties', label: t('admin.nav.properties'), value: counts.properties ?? 0, icon: Building2, moduleKey: 'properties' });
    if (mods.finance && moduleStatus('finance') === 'enabled') cards.push({ key: 'income', label: t('admin.nav.transactions'), value: counts.income ?? 0, icon: Wallet, moduleKey: 'finance' });
    if (mods.legal && moduleStatus('legal') === 'enabled') {
      cards.push({ key: 'legal_pending', label: t('bm.status.pending'), value: counts.legal_disputes_pending ?? 0, icon: Scale, moduleKey: 'legal' });
      cards.push({ key: 'legal_docs', label: t('bm.legal.notary'), value: counts.legal_docs_pending ?? 0, icon: CheckCircle, moduleKey: 'legal' });
    }
    if (mods.employees && moduleStatus('employees') === 'enabled') cards.push({ key: 'employees', label: t('admin.nav.users'), value: counts.employees ?? 0, icon: Users, moduleKey: 'employees' });
    if (mods.orders && moduleStatus('orders') === 'enabled') cards.push({ key: 'orders', label: t('pm.orders'), value: counts.orders ?? 0, icon: Activity, moduleKey: 'orders' });
    if (mods.offers && moduleStatus('offers') === 'enabled') cards.push({ key: 'offers', label: t('pm.offers'), value: counts.offers ?? 0, icon: TrendingUp, moduleKey: 'offers' });

    const filteredCards = cards.filter(c => (DEPT_RELEVANT_MODULES[dept] || []).includes(c.moduleKey));

    const quick: Array<{ id: string; href: string; title: string; subtitle: string; icon: React.ElementType; moduleKey: string }> = [
      // Employees
      { id: 'employees', href: `/internal/employees?view=employees&section=users`, title: 'إضافة موظف جديد', subtitle: 'إدارة فريق العمل', icon: Users, moduleKey: 'employees' },
      
      // Properties granular
      { id: 'properties_add', href: `/internal/properties?view=properties&section=properties`, title: t('bm.properties.add') || 'اضافة عقار', subtitle: 'توسيع محفظتك العقارية', icon: PlusCircle, moduleKey: 'properties' },
      { id: 'properties_list', href: `/internal/properties?view=properties&section=dashboard`, title: t('admin.nav.properties') || 'إدارة الأملاك', subtitle: 'لوحة الأملاك', icon: Building2, moduleKey: 'properties' },
      { id: 'offers', href: `/internal/properties?view=properties&section=offers`, title: t('pm.offers') || 'إدارة العروض', subtitle: 'إدارة العروض والاعلانات', icon: TrendingUp, moduleKey: 'offers' },
      { id: 'orders', href: `/internal/properties?view=properties&section=orders`, title: t('pm.orders') || 'إدارة الطلبات', subtitle: 'متابعة طلبات الشراء', icon: Activity, moduleKey: 'orders' },
      
      // Marketing
      { id: 'marketing', href: `/internal/marketing?view=marketing&section=marketing`, title: 'إدارة التسويق', subtitle: 'العروض والإعلانات', icon: Megaphone, moduleKey: 'marketing' },
      
      // Legal
      { id: 'legal', href: `/internal/legal?view=legal&section=legal`, title: 'الإدارة القانونية', subtitle: 'نزاعات وعقود', icon: Scale, moduleKey: 'legal' },
    ];

    const filteredQuick = quick.filter(q => (DEPT_RELEVANT_MODULES[dept] || []).includes(q.moduleKey));

    const latestOrders: any[] = Array.isArray(mgrSummary?.latestOrders) ? mgrSummary.latestOrders : [];

    return (
      <div className="space-y-8" dir="rtl">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              اهلا وسهلا بك، <span className="font-black">{user?.firstName || 'مرحباً'}</span>
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {config.nameAr} • {t('bm.dashboard.manager_portal') || 'لوحة المدير'}
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(mgrLoading ? new Array(4).fill(0) : filteredCards).map((c: any, idx: number) => {
            if (mgrLoading) {
              return <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 h-[110px] animate-pulse" />;
            }
            const Icon = c.icon;
            return (
              <div key={c.key} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                  <p className="text-2xl font-black text-slate-950 tabular-nums">
                    {c.key === 'income' ? `${Number(c.value || 0).toLocaleString('en-US')}` : c.value}
                    {c.key === 'income' && <span className="text-[10px] font-black text-slate-400 ml-2">SAR</span>}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick services */}
          <div className="rounded-[2rem] bg-slate-950 text-white p-6 shadow-xl border border-slate-900">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-black uppercase tracking-widest">خدمات سريعة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredQuick.map((q) => {
                const status = moduleStatus(q.moduleKey);
                if (!isAdmin && (status === 'disabled' || !mods[q.moduleKey])) return null;
                const disabled = !isAdmin && status !== 'enabled';
                return (
                  <Link
                    key={q.id}
                    href={disabled ? '#' : q.href}
                    onClick={(e) => { if (disabled) e.preventDefault(); }}
                    className={`rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4 transition-colors ${
                      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <q.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-black truncate">{q.title}</p>
                        <p className="text-[10px] font-bold text-white/50 truncate">{q.subtitle}</p>
                      </div>
                    </div>
                    {status === 'soon' && !isAdmin ? (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border"
                        style={{
                          backgroundColor: "var(--soon-badge-bg, #ffffff)",
                          color: "var(--soon-badge-text, #000000)",
                          borderColor: "var(--soon-badge-bg, #ffffff)",
                        }}
                      >
                        {t("common.soon") || "قريباً"}
                      </span>
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-white/40" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Latest orders */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-950">أحدث الطلبات</h2>
              {mods.orders && moduleStatus('orders') === 'enabled' && (
                <Link href="/internal/properties?view=properties&section=orders" className="text-[11px] font-black text-slate-400 hover:text-slate-950 transition-colors">
                  عرض الكل
                </Link>
              )}
            </div>
            {(!mods.orders || moduleStatus('orders') !== 'enabled') ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">
                غير متاح
              </div>
            ) : latestOrders.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">
                لا توجد طلبات حديثة
              </div>
            ) : (
              <div className="space-y-3">
                {latestOrders.map((o) => (
                  <div key={o.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950 truncate">{o.propertyType} • {o.city}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">{new Date(o.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                    <div className="text-[11px] font-black text-slate-700 tabular-nums">
                      {o.price ? `${Number(o.price).toLocaleString('en-US')} SAR` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} p-8 text-white shadow-xl`}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-white/70 text-sm font-bold">{greeting}،</p>
            <h1 className="text-3xl font-black tracking-tight">
              {user?.firstName ?? 'مرحباً'} 👋
            </h1>
            <p className="text-white/80 text-sm max-w-sm leading-relaxed mt-2">
              {config.description}
            </p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
            <DeptIcon className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="relative z-10 mt-6 pt-6 border-t border-white/20 flex items-center gap-6">
          <div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">الإدارة</p>
            <p className="text-white font-black text-sm mt-0.5">{config.nameAr}</p>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">التاريخ</p>
            <p className="text-white font-black text-sm mt-0.5">
              {now.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="bg-white rounded-[2rem] border border-slate-100 p-5 md:p-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">لوحة الإحصاءات</p>
          <h2 className="text-lg font-black text-slate-950">{config.nameAr}</h2>
        </div>
        <div className="text-xs font-black text-slate-500">
          {view === 'dashboard' ? 'الملخص الرئيسي' : 'عرض القسم الحالي'}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard label="طلبات معلقة" value={stats.pending} icon={Clock} color="text-slate-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard label="قيد المعالجة" value={stats.inProgress} icon={Activity} color="text-slate-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <StatCard label="مكتملة" value={stats.done} icon={CheckCircle} color="text-slate-500" />
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-4"
      >
        <h2 className="text-sm font-black text-slate-950 uppercase tracking-widest">الإجراءات السريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/internal/${dept}/requests`}
            className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">طلبات الخدمات</p>
                <p className="text-[10px] text-slate-400 font-bold">عرض وإدارة الطلبات</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-950 transition-colors" />
          </Link>

          <div className="relative flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl opacity-60 cursor-not-allowed">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">التقارير</p>
                <p className="text-[10px] text-slate-400 font-bold">إحصاءات وتقارير</p>
              </div>
            </div>
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border"
              style={{
                backgroundColor: "var(--soon-badge-bg, #ffffff)",
                color: "var(--soon-badge-text, #000000)",
                borderColor: "var(--soon-badge-bg, #ffffff)",
              }}
            >
              {t("common.soon") || "قريباً"}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Department workspaces live in /buildingmanagement and /financial inside the internal shell. */}
    </div>
  );
}
