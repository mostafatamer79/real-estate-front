"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Wallet, Scale, Megaphone, Users, ArrowUpRight, LayoutDashboard, Sparkles, Clock, Lock, ChevronLeft, MessageSquare } from "lucide-react";
import api from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const DEPTS: Array<{ key: string; label: string; href: string; Icon: React.ElementType }> = [
  { key: "properties", label: "إدارة الاملاك", href: "/internal/properties?view=properties&section=dashboard", Icon: Building2 },
  { key: "finance", label: "الإدارة المالية", href: "/internal/finance?view=financial&section=financial", Icon: Wallet },
  { key: "legal", label: "الإدارة القانونية", href: "/internal/legal?view=legal&section=legal", Icon: Scale },
  { key: "marketing", label: "إدارة التسويق", href: "/internal/marketing?view=marketing&section=marketing", Icon: Megaphone },
  { key: "employees", label: "إدارة الموظفين", href: "/internal/employees?view=employees&section=users", Icon: Users },
];

export default function InternalHomePage() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t, language } = useLanguage();
  const isRtl = language === "ar";
  const [user, setUser] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const copy = {
    deptTitle: t("internal.dashboard.title"),
    welcome: t("internal.dashboard.welcome"),
    welcomeFallback: t("internal.dashboard.welcomeFallback"),
    overview: t("internal.dashboard.overview"),
    noDepartments: t("internal.dashboard.noDepartments"),
    enterDepartment: t("internal.dashboard.enterDepartment"),
    comingSoon: t("common.soon"),
    quickServices: t("internal.dashboard.quickServices"),
    chat: t("internal.nav.chat"),
    reviewChats: t("internal.dashboard.reviewChats"),
    details: t("internal.dashboard.details"),
    profile: t("internal.dashboard.profile"),
    latestRequests: t("internal.dashboard.latestRequests"),
    viewAll: t("internal.dashboard.viewAll"),
    unavailable: t("internal.dashboard.unavailable"),
    noRecentRequests: t("internal.dashboard.noRecentRequests"),
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [router]);

  const moduleStatus = (k: string): "enabled" | "soon" | "disabled" => {
    const v = (settings.moduleFlags as any)?.[k];
    return v === "soon" || v === "disabled" ? v : "enabled";
  };

  const allowedDepts = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return DEPTS;
    const depts = new Set((Array.isArray(user.departments) ? user.departments : []).map((d: any) => String(d).toLowerCase()));
    const perms = user.departmentPermissions || {};
    const can = (k: string) => depts.has(k) || (perms[k] && perms[k] !== "none");
    return DEPTS.filter((d) => can(d.key) && moduleStatus(d.key) !== "disabled");
  }, [user, settings.moduleFlags]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get("/dashboard/manager")
      .then((res) => setSummary(res.data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [user]);

  // We removed the auto-redirect to allow users to see the hub summary even if they have only one department
  // useEffect(() => {
  //   if (!user) return;
  //   if (allowedDepts.length === 1) {
  //     router.replace(allowedDepts[0].href);
  //   }
  // }, [user, allowedDepts, router]);

  const counts = summary?.counts || {};
  const mods = summary?.modules || {};

  const cards = [
    { key: "properties", label: isRtl ? "الأملاك" : "Properties", value: counts.properties ?? 0, Icon: Building2 },
    { key: "orders", label: isRtl ? "الطلبات" : "Orders", value: counts.orders ?? 0, Icon: LayoutDashboard },
    { key: "offers", label: isRtl ? "العروض" : "Offers", value: counts.offers ?? 0, Icon: ArrowUpRight },
    { key: "income", label: isRtl ? "الدخل" : "Income", value: counts.income ?? 0, Icon: Wallet, unit: "SAR" },
  ].filter((c) => {
    if (c.key === "income") return mods.finance && moduleStatus("finance") === "enabled";
    if (c.key === "properties") return mods.properties && moduleStatus("properties") === "enabled";
    if (c.key === "orders") return mods.orders && moduleStatus("orders") === "enabled";
    if (c.key === "offers") return mods.offers && moduleStatus("offers") === "enabled";
    return true;
  });

  const container = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.06, duration: 0.35 } },
  };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

  const deptCards = allowedDepts.map((d) => ({
    ...d,
    label: isRtl ? d.label : ({
      properties: t("internal.dept.properties"),
      finance: t("internal.dept.finance"),
      legal: t("internal.dept.legal"),
      marketing: t("internal.dept.marketing"),
      employees: t("internal.dept.employees"),
    } as Record<string, string>)[d.key] || d.label,
    status: moduleStatus(d.key),
    message: ((settings.moduleMessages as any) || {})?.[d.key] || "",
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <motion.div variants={item} className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-slate-950/5 blur-3xl" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              {copy.deptTitle}
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight">
              {copy.welcome} <span className="font-black">{user?.firstName || copy.welcomeFallback}</span>
            </h1>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{copy.overview}</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleString(isRtl ? "ar-SA" : "en-US")}
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? new Array(4).fill(0) : cards).map((c: any, idx: number) => {
          if (loading) return <div key={idx} className="bg-white rounded-2xl border border-slate-100 p-6 h-[110px] animate-pulse" />;
          const Icon = c.Icon;
          return (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.25 }}
              className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{c.label}</p>
                <p className="text-2xl font-black text-slate-950 tabular-nums">
                  {c.key === "income" ? Number(c.value || 0).toLocaleString("en-US") : c.value}
                  {c.unit && <span className="text-[10px] font-black text-slate-400 ml-2">{c.unit}</span>}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800">
                <Icon className="w-6 h-6" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

	      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
	        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
	          <div className="flex items-center justify-between mb-6">
	            <div>
	              <h2 className="text-2xl font-black text-slate-950">{copy.deptTitle}</h2>
	              <div className="mt-2 h-1 w-14 rounded-full bg-slate-950" />
	            </div>
	            <div className="text-[11px] font-black text-slate-400 tabular-nums">
	              {deptCards.length}
	            </div>
	          </div>

	          {deptCards.length === 0 ? (
	            <div className="h-40 flex items-center justify-center text-slate-300 text-sm font-bold">{copy.noDepartments}</div>
	          ) : (
	            <div className="space-y-5">
	              {deptCards.map((d, idx) => {
	                const DisabledIcon = Lock;
	                const Icon = d.Icon;
	                const disabled = d.status !== "enabled";
	                return (
	                  <motion.div key={d.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04, duration: 0.22 }}>
	                    <Link
	                      href={disabled ? "#" : d.href}
	                      onClick={(e) => {
	                        if (disabled) e.preventDefault();
	                      }}
	                      title={disabled ? d.message || copy.comingSoon : ""}
	                      className={`relative block rounded-[2.25rem] bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-slate-100 transition-all ${
	                        disabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-[0_10px_26px_rgba(15,23,42,0.10)]"
	                      }`}
	                    >
	                      <div className="flex items-center justify-between px-6 py-6">
	                        <div className="flex items-center gap-4">
	                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center">
	                            <ChevronLeft className="w-6 h-6 text-slate-300" />
	                          </div>
	                          <div className="min-w-0">
	                            <div className="text-[15px] font-black text-slate-700 truncate">{d.label}</div>
	                            <div className="text-[11px] font-bold text-slate-400 mt-1">
	                              {disabled ? copy.comingSoon : copy.enterDepartment}
	                            </div>
	                          </div>
	                        </div>

	                        <div className="w-20 h-20 rounded-[1.75rem] bg-slate-50 shadow-[0_10px_20px_rgba(15,23,42,0.08)] flex items-center justify-center">
	                          {disabled ? <DisabledIcon className="w-9 h-9 text-slate-400" /> : <Icon className="w-9 h-9 text-slate-900" />}
	                        </div>
	                      </div>
	                    </Link>
	                  </motion.div>
	                );
	              })}
	            </div>
	          )}
	        </div>

	        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-950">{copy.quickServices}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quick actions</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/chat"
              className="group rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{copy.chat}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{copy.reviewChats}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
            </Link>
            <Link
              href="/details"
              className="group rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-black text-slate-950">{copy.details}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">{copy.profile}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 group-hover:bg-slate-950 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </Link>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-950">{copy.latestRequests}</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Latest activity</p>
            </div>
            {mods.orders && moduleStatus("orders") === "enabled" && (
              <Link href="/internal/properties?view=properties&section=orders" className="text-[11px] font-black text-slate-400 hover:text-slate-950 transition-colors">
                {copy.viewAll}
              </Link>
            )}
          </div>
          {!(mods.orders && moduleStatus("orders") === "enabled") ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">{copy.unavailable}</div>
          ) : loading ? (
            <div className="space-y-3">
              {new Array(5).fill(0).map((_, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 h-[74px] animate-pulse" />
              ))}
            </div>
          ) : (summary?.latestOrders || []).length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-300 text-sm font-bold">{copy.noRecentRequests}</div>
          ) : (
            <div className="space-y-3">
              {(summary?.latestOrders || []).slice(0, 5).map((o: any) => (
                <div key={o.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-950 truncate">{o.propertyType} • {o.city}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{new Date(o.createdAt).toLocaleString("ar-SA")}</p>
                  </div>
                  <div className="text-[11px] font-black text-slate-700 tabular-nums">
                    {o.price ? `${Number(o.price).toLocaleString("en-US")} SAR` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
