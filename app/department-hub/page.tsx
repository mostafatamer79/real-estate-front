"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Wallet,
  Scale,
  Megaphone,
  Users,
  LayoutDashboard,
  ArrowUpRight,
  Sparkles,
  Clock,
  Lock,
  ChevronLeft,
  MessageSquare,
  LogOut,
  Menu,
  X as CloseIcon,
  Loader2,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SaudiRiyalAmount, SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";
import api from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import NotificationBell from "@/app/src/components/NotificationBell";

// ─── Department definitions ───────────────────────────────────────────────────
const DEPTS = [
  {
    key: "properties",
    labelAr: "إدارة الأملاك",
    labelEn: "Properties",
    href: "/internal/properties?view=properties&section=dashboard",
    Icon: Building2,
  },
  {
    key: "finance",
    labelAr: "الإدارة المالية",
    labelEn: "Finance",
    href: "/internal/finance?view=financial&section=financial",
    Icon: Wallet,
  },
  {
    key: "legal",
    labelAr: "الإدارة القانونية",
    labelEn: "Legal",
    href: "/internal/legal?view=legal&section=legal",
    Icon: Scale,
  },
  {
    key: "marketing",
    labelAr: "إدارة التسويق",
    labelEn: "Marketing",
    href: "/internal/marketing?view=marketing&section=marketing",
    Icon: Megaphone,
  },
  {
    key: "employees",
    labelAr: "إدارة الموظفين",
    labelEn: "Employees",
    href: "/internal/employees?view=employees&section=users",
    Icon: Users,
  },
];

// ─── Inner content component ──────────────────────────────────────────────────
function DepartmentHubContent() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const isRtl = language === "ar";

  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState("dashboard");

  // ── Module status helper ──────────────────────────────────────────────────
  const moduleStatus = (k: string): "enabled" | "soon" | "disabled" => {
    const v = (settings.moduleFlags as any)?.[k];
    return v === "soon" || v === "disabled" ? v : "enabled";
  };

  // ── Allowed departments ───────────────────────────────────────────────────
  const allowedDepts = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return DEPTS;
    const depts = new Set(
      (Array.isArray(user.departments) ? user.departments : []).map((d: any) =>
        String(d).toLowerCase()
      )
    );
    const perms = user.departmentPermissions || {};
    const can = (k: string) => {
      if (k === "properties") {
        return depts.has(k) || depts.has("offers") || depts.has("orders") ||
          (perms[k] && perms[k] !== "none") ||
          (perms.offers && perms.offers !== "none") ||
          (perms.orders && perms.orders !== "none");
      }
      return depts.has(k) || (perms[k] && perms[k] !== "none");
    };
    return DEPTS.filter((d) => can(d.key) && moduleStatus(d.key) !== "disabled");
  }, [user, settings.moduleFlags]);

  // ── Fetch dashboard summary ───────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get("/dashboard/manager")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [user]);

  // ── Stats cards ───────────────────────────────────────────────────────────
  const counts = summary?.counts || {};
  const mods = summary?.modules || {};

  const statCards = [
    {
      key: "properties",
      label: isRtl ? "الأملاك" : "Properties",
      value: counts.properties ?? 0,
      Icon: Building2,
    },
    {
      key: "orders",
      label: isRtl ? "الطلبات" : "Orders",
      value: counts.orders ?? 0,
      Icon: LayoutDashboard,
    },
    {
      key: "offers",
      label: isRtl ? "العروض" : "Offers",
      value: counts.offers ?? 0,
      Icon: ArrowUpRight,
    },
    {
      key: "income",
      label: isRtl ? "الدخل" : "Income",
      value: counts.income ?? 0,
      Icon: Wallet,
      unit: "",
    },
  ].filter((c) => {
    if (c.key === "income") return mods.finance && moduleStatus("finance") === "enabled";
    if (c.key === "properties") return mods.properties && moduleStatus("properties") === "enabled";
    if (c.key === "orders") return mods.orders && moduleStatus("orders") === "enabled";
    if (c.key === "offers") return mods.offers && moduleStatus("offers") === "enabled";
    return true;
  });

  // ── Dept cards with translated labels ────────────────────────────────────
  const deptCards = allowedDepts.map((d) => ({
    ...d,
    label: isRtl ? d.labelAr : d.labelEn,
    status: moduleStatus(d.key),
    message: ((settings.moduleMessages as any) || {})?.[d.key] || "",
  }));

  // ── Sidebar items ─────────────────────────────────────────────────────────
  const sidebarItems = [
    {
      id: "dashboard",
      label: isRtl ? "لوحة التحكم" : "Dashboard",
      Icon: LayoutDashboard,
      onClick: () => setSelectedSection("dashboard"),
    },
    ...deptCards.map((d) => ({
      id: d.key,
      label: d.label,
      Icon: d.Icon,
      onClick: () => router.push(d.href),
    })),
  ];

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // ── Animation variants ────────────────────────────────────────────────────
  const container = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, duration: 0.35 } },
  };
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
  };

  // ── Render Dashboard Content ──────────────────────────────────────────────
  const renderDashboard = () => (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Welcome card */}
      <motion.div
        variants={item}
        className="relative overflow-hidden rounded-[1.25rem] border border bg-card p-4 sm:p-8 shadow-sm"
      >
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              {isRtl ? "مركز الإدارات" : "Department Hub"}
            </div>
            <h1 className="text-3xl md:text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
              {isRtl ? "أهلاً،" : "Welcome,"}{" "}
              <span className="font-black">{user?.firstName || (isRtl ? "بك" : "back")}</span>
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {isRtl ? "إليك نظرة عامة على الأقسام" : "Overview of your departments"}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleString(isRtl ? "ar-SA" : "en-US")}
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? new Array(4).fill(0) : statCards).map((c: any, idx: number) => {
          if (loading)
            return <div key={idx} className="bg-card rounded-2xl border border p-3 sm:p-6 h-[110px] animate-pulse" />;
          const Icon = c.Icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="bg-card rounded-2xl border border p-3 sm:p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-950 tabular-nums">
                  {c.key === "income" ? Number(c.value || 0).toLocaleString("en-US") : c.value}
                  {c.key === "income" ? <SaudiRiyalSymbol className="ml-2 text-slate-400" iconClassName="h-3 w-3" /> : c.unit ? <span className="text-[10px] font-black text-slate-400 ml-2">{c.unit}</span> : null}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-muted border border flex items-center justify-center text-slate-800">
                <Icon className="w-6 h-6" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Departments + Quick actions */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 gap-6">
        {/* Department cards */}
        <div className="bg-card rounded-[1rem] border border p-3 sm:p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                {isRtl ? "الأقسام" : "Departments"}
              </h2>
              <div className="mt-2 h-1 w-14 rounded-full bg-slate-950" />
            </div>
            <div className="text-[11px] font-black text-slate-400 tabular-nums">{deptCards.length}</div>
          </div>

          {deptCards.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-300 text-sm font-bold">
              {isRtl ? "لا توجد أقسام متاحة" : "No departments available"}
            </div>
          ) : (
            <div className="space-y-5">
              {deptCards.map((d, idx) => {
                const Icon = d.Icon;
                const disabled = d.status !== "enabled";
                return (
                  <motion.div
                    key={d.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.22 }}
                  >
                    <Link
                      href={disabled ? "#" : d.href}
                      onClick={(e) => { if (disabled) e.preventDefault(); }}
                      title={disabled ? d.message || (isRtl ? "قريباً" : "Coming soon") : ""}
                      className={`relative block rounded-[2.25rem] bg-card shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-all ${
                        disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
                      }`}
                    >
                      <div className="flex items-center justify-between px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
                            <ChevronLeft className={`w-6 h-6 text-slate-300 ${isRtl ? "" : "rotate-180"}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[15px] font-black text-slate-700 truncate">{d.label}</div>
                            <div className="text-[11px] font-bold text-slate-400 mt-1">
                              {disabled ? (isRtl ? "قريباً" : "Coming soon") : (isRtl ? "الدخول للقسم" : "Enter department")}
                            </div>
                          </div>
                        </div>
                        <div className="w-20 h-20 rounded-[1.25rem] bg-muted shadow-[0_10px_20px_rgba(15,23,42,0.08)] flex items-center justify-center">
                          {disabled ? <Lock className="w-9 h-9 text-slate-400" /> : <Icon className="w-9 h-9 text-slate-900" />}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions + Latest requests */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-card rounded-[1.25rem] border border p-3 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-950">{isRtl ? "روابط سريعة" : "Quick Links"}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quick actions</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/chat"
                className="group rounded-2xl border border bg-muted hover:bg-card transition-colors p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">{isRtl ? "المحادثات" : "Chat"}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{isRtl ? "مراجعة المحادثات" : "Review chats"}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-card border border flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </Link>
              <Link
                href="/details"
                className="group rounded-2xl border border bg-muted hover:bg-card transition-colors p-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">{isRtl ? "التفاصيل" : "Details"}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{isRtl ? "لوحة البيانات" : "Main dashboard"}</p>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-card border border flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>

          {/* Latest requests */}
          <div className="bg-card rounded-[1.25rem] border border p-3 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-950">{isRtl ? "آخر الطلبات" : "Latest Requests"}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Latest activity</p>
              </div>
              {mods.orders && moduleStatus("orders") === "enabled" && (
                <Link
                  href="/internal/properties?view=properties&section=orders"
                  className="text-[11px] font-black text-slate-400 hover:text-slate-950 transition-colors"
                >
                  {isRtl ? "عرض الكل" : "View all"}
                </Link>
              )}
            </div>

            {!(mods.orders && moduleStatus("orders") === "enabled") ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">
                {isRtl ? "غير متاح" : "Unavailable"}
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {new Array(4).fill(0).map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl border border bg-muted h-[74px] animate-pulse" />
                ))}
              </div>
            ) : (summary?.latestOrders || []).length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">
                {isRtl ? "لا توجد طلبات حديثة" : "No recent requests"}
              </div>
            ) : (
              <div className="space-y-3">
                {(summary?.latestOrders || []).slice(0, 4).map((o: any) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl border border bg-muted hover:bg-card transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-950 truncate">
                        {o.propertyType} • {o.city}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 truncate">
                        {new Date(o.createdAt).toLocaleString(isRtl ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                    <div className="text-[11px] font-black text-slate-700 tabular-nums">
                      {o.price ? <SaudiRiyalAmount amount={Number(o.price)} locale="en-US" iconClassName="h-3 w-3 text-slate-700" /> : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-muted" dir={isRtl ? "rtl" : "ltr"}>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-slate-900 text-white rounded-lg lg:hidden shadow-sm shadow-black/20"
      >
        {isSidebarOpen ? <CloseIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } fixed right-0 lg:static inset-y-0 z-40 bg-slate-950 text-white transition-all duration-300 ease-in-out flex flex-col shadow-xl shadow-black/20 lg:shadow-none`}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="font-black text-sm tracking-tight leading-tight">
                  {isRtl ? "مركز الإدارات" : "Department Hub"}
                </p>
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">DEPT. HUB</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sidebar nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {sidebarItems.map((navItem) => {
            const isActive = selectedSection === navItem.id && navItem.id === "dashboard";
            const Icon = navItem.Icon;
            return (
              <button
                key={navItem.id}
                type="button"
                onClick={() => {
                  navItem.onClick();
                  closeSidebarOnMobile();
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors duration-150 group border-r-2 ${
                  isActive
                    ? "bg-card/10 text-white border-white/70"
                    : "text-white/70 hover:text-white hover:bg-card/5 border-transparent hover:border-white/30"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? "bg-card text-slate-950 border-white/20"
                      : "bg-card/5 border-white/10 group-hover:bg-card/10"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-white/80"}`} />
                </div>
                {isSidebarOpen && (
                  <span className="text-[12px] font-black tracking-tight">{navItem.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-white/70 hover:text-white hover:bg-red-500/10 transition-colors border-r-2 border-transparent hover:border-red-300/60 group"
          >
            <div className="w-9 h-9 rounded-lg bg-card/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/10 transition-colors">
              <LogOut className="w-4 h-4 text-white/80 group-hover:rotate-12 transition-transform" />
            </div>
            {isSidebarOpen && (
              <span className="text-[12px] font-black tracking-tight">
                {isRtl ? "تسجيل الخروج" : "Sign out"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="h-16 bg-card border-b border flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-muted transition-colors"
            >
              <Menu className="w-4 h-4 text-slate-400" />
            </button>
            <div className="h-4 w-px bg-muted" />
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-muted border border min-w-0">
                <Building2 className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="text-[12px] font-black text-slate-900 truncate">
                  {isRtl ? "مركز الإدارات" : "Department Hub"}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">
                  DEPT
                </span>
              </div>
              <div className="hidden sm:flex items-center h-9 px-3 rounded-xl bg-card border border text-slate-700 text-[11px] font-black">
                {isRtl ? "لوحة التحكم" : "Dashboard"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center text-white text-[10px] font-black">
              {user?.firstName?.[0]}
            </div>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto py-8 px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedSection}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                {renderDashboard()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Page export with Suspense ────────────────────────────────────────────────
export default function DepartmentHub() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      }
    >
      <DepartmentHubContent />
    </Suspense>
  );
}
