"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Megaphone,
  Building2,
  Wallet,
  Scale,
  Users,
  ArrowLeft,
  CreditCard,
  Clock,
  Globe,
  Upload,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import NotificationBell from "@/app/src/components/NotificationBell";
import { useLanguage } from "@/context/LanguageContext";
import { Role } from "@/types/user";
import { useSettings } from "@/context/SettingsContext";

/* ─── Department config ─── */
const DEPT_CONFIG: Record<
  string,
  { nameAr: string; nameEn: string; Icon: React.ElementType }
> = {
  marketing:  { nameAr: "إدارة التسويق",   nameEn: "Marketing",   Icon: Megaphone  },
  properties: { nameAr: "إدارة الاملاك",    nameEn: "Properties",  Icon: Building2  },
  finance:    { nameAr: "الإدارة المالية",   nameEn: "Finance",     Icon: Wallet     },
  legal:      { nameAr: "الإدارة القانونية", nameEn: "Legal",       Icon: Scale      },
  employees:  { nameAr: "إدارة الموظفين",   nameEn: "Employees",   Icon: Users      },
};

const canonicalDeptSlug = (slug: string) => {
  const s = String(slug || "").toLowerCase().trim();
  if (!s) return "";
  if (s === "financial") return "finance";
  if (s === "employee") return "employees";
  if (s === "property" || s === "property_management" || s === "pm") return "properties";
  return s;
};

/* ─── Sidebar nav item ─── */
function SideNavItem({
  href,
  icon: Icon,
  label,
  sublabel,
  isActive,
  disabled,
  onClick,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={!disabled ? { x: -4, scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className="w-full"
    >
      <Link
        href={disabled ? "#" : href}
        onClick={(e) => {
          if (disabled) { e.preventDefault(); return; }
          onClick?.();
        }}
        className={`group flex items-center justify-between gap-3 w-full rounded-[1.5rem] px-4 py-3.5 transition-all duration-300 ${
          isActive
            ? "bg-slate-950 shadow-xl shadow-slate-950/20"
            : disabled
              ? "opacity-40 cursor-not-allowed bg-slate-50/50"
              : "bg-white hover:bg-slate-50 shadow-sm shadow-slate-200/40 hover:shadow-lg hover:shadow-slate-200/60 border border-slate-100"
        }`}
      >
        {/* Left arrow */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
          isActive ? "bg-white/10" : "bg-slate-100 group-hover:bg-slate-200 shadow-inner"
        }`}>
          <ArrowLeft className={`w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1 ${
            isActive ? "text-white/60" : "text-slate-400"
          }`} />
        </div>

        {/* Label */}
        <div className="flex-1 text-right min-w-0">
          <p className={`text-[12px] font-black truncate leading-tight tracking-tight ${
            isActive ? "text-white" : "text-slate-700"
          }`}>{label}</p>
          {sublabel && (
            <p className={`text-[10px] font-bold mt-0.5 tracking-wide ${
              isActive ? "text-white/50" : "text-slate-400"
            }`}>{sublabel}</p>
          )}
        </div>

        {/* Right icon tile */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
          isActive
            ? "bg-slate-800 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            : "bg-slate-100 group-hover:bg-slate-200 group-hover:scale-110"
        }`}>
          <Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? "text-white scale-110" : "text-slate-600"}`} />
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Shell ─── */
export default function InternalShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const searchParams = useSearchParams();
  const { t, language, toggleLanguage } = useLanguage();
  const [user, setUser]         = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [subStatus, setSubStatus] = useState<{ active: boolean; daysLeft: number; noExpiry: boolean; subscription?: any } | null>(null);
  const { settings } = useSettings();
  const isRtl = language === "ar";

  const isChat     = pathname === "/internal/chat" || pathname.startsWith("/internal/chat/");
  const deptSlug   = isChat ? "" : canonicalDeptSlug(pathname.split("/")[2] ?? "");
  const dept       = DEPT_CONFIG[deptSlug];
  const currentView = searchParams.get("view") || "dashboard";
  const isHub      = !isChat && (!deptSlug || deptSlug === "internal" || !dept);
  const dashboardTitle = t("internal.dashboard.title");
  const loadingText = t("internal.common.loading");
  const chatLabel = t("internal.nav.chat");
  const chatCenterLabel = t("internal.chat.centerTitle");
  const backToHomeLabel = t("internal.nav.backHome");
  const logoutLabel = t("internal.nav.logout");
  const subscriptionsLabel = t("internal.nav.subscriptions");
  const profileLabel = t("internal.profile.title");
  const uploadImageLabel = t("internal.profile.uploadImage");
  const uploadingLabel = t("internal.profile.uploading");
  const openProfileLabel = t("internal.profile.openFull");
  const subscriptionStatusLabel = t("internal.sub.statusTitle");
  const openEndedLabel = t("internal.sub.openEnded");
  const expiredLabel = t("internal.sub.expired");
  const daysLeftLabel = (days: number) => t("internal.sub.daysLeft", { days });
  const languageSwitchLabel = t("internal.nav.languageSwitch");

  const syncUserFromStorage = () => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    setUser(parsed);
    return parsed;
  };

  const persistUser = (nextUser: any) => {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    window.dispatchEvent(new Event("auth-change"));
    window.dispatchEvent(new Event("user-updated"));
  };

  /* page title */
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${isRtl ? (dept?.nameAr || dashboardTitle) : (dept?.nameEn || dashboardTitle)} • Mostkl`;
  }, [dept?.nameAr, dept?.nameEn, isRtl, dashboardTitle]);

  /* section guard */
  const deptToSection: Record<string, string> = {
    marketing: "marketing", properties: "buildingmanagement",
    finance: "financial",   legal: "disputes",
  };
  const { isOpen, message, isAdmin } = useSectionGuard(deptToSection[deptSlug] || "internal");

  const modStatus = (key: string): "enabled" | "soon" | "disabled" => {
    const v = (settings.moduleFlags as any)?.[key];
    return v === "soon" || v === "disabled" ? v : "enabled";
  };

  /* auth guard */
  useEffect(() => {
    const parsed = syncUserFromStorage();
    if (!parsed) { router.push("/login"); return; }

    const departments  = Array.isArray(parsed.departments) ? parsed.departments : [];
    const hasDept      = departments.includes(deptSlug) || (deptSlug === "finance" && departments.includes("financial"));
    const hasPerm      = (parsed.departmentPermissions?.[deptSlug] && parsed.departmentPermissions[deptSlug] !== "none") ||
                         (deptSlug === "finance" && parsed.departmentPermissions?.financial && parsed.departmentPermissions.financial !== "none");
    const canAccess    = parsed.role === Role.ADMIN || hasDept || hasPerm;
    const modSt        = (settings.moduleFlags as any)?.[deptSlug] || "enabled";
    const isPreview    = searchParams.get("preview") === "1";
    const blocked      = modSt === "disabled" || (modSt === "soon" && !(parsed.role === Role.ADMIN && isPreview));

    if (!isHub && (!canAccess || blocked) && deptSlug) {
      const first = departments[0] || "";
      if (first) router.push(`/internal/${first}`);
      else router.push("/");
    }

    // Fetch subscription status
    api.get('/subscriptions/status').then(res => {
      setSubStatus(res.data);
    }).catch(err => {
      console.error("Sub check error", err);
      // Fallback: if check fails, assume active for now or handle appropriately
      setSubStatus({ active: true, daysLeft: 999, noExpiry: true });
    });
    const sync = () => syncUserFromStorage();
    window.addEventListener("auth-change", sync);
    window.addEventListener("user-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("auth-change", sync);
      window.removeEventListener("user-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [router, deptSlug, settings.moduleFlags, searchParams, isHub]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/user/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const imageUrl = response.data?.data?.url || response.data?.url;
      if (!imageUrl) return;

      await api.put("/user/profile", { profileImage: imageUrl });
      persistUser({ ...user, profileImage: imageUrl });
    } catch (error) {
      console.error("Profile image upload failed", error);
    } finally {
      setIsUploadingImage(false);
      event.target.value = "";
    }
  };

  const getDisplayName = () => {
    if (!user) return "";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  };

  const getUserInitials = () => {
    if (!user) return "?";
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return `${first}${last}`.trim() || first || last || "?";
  };

  const avatarNode = (className: string, textClassName: string) => (
    <div className={`${className} overflow-hidden`}>
      {user?.profileImage ? (
        <img src={user.profileImage} alt={getDisplayName()} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${textClassName}`}>
          {getUserInitials()}
        </div>
      )}
    </div>
  );

  /* dept access check */
  const canAccess = (dSlug: string) => {
    if (!user) return false;
    if (user.role === Role.ADMIN) return true;
    const allowed = new Set((Array.isArray(user.departments) ? user.departments : []).map((d: any) => canonicalDeptSlug(d)));
    const canonical = canonicalDeptSlug(dSlug);
    const perms = user.departmentPermissions || {};
    const perm  = perms[canonical];
    const alias = canonical === "finance" ? perms.financial : canonical === "employees" ? perms.employee :
                  canonical === "properties" ? (perms.property || perms.property_management || perms.pm) : undefined;
    return allowed.has(canonical) || (perm && perm !== "none") || (alias && alias !== "none");
  };

  /* dept feature items */
  const deptFeatureItems: Record<string, Array<{ id: string; href: string; icon: React.ElementType; label: string; moduleKey: string }>> = {
    marketing:  [{ id: "marketing",              href: `/internal/${deptSlug}?view=marketing&section=marketing`,         icon: Megaphone,  label: "التسويق",          moduleKey: "marketing"   }],
    finance:    [
      { id: "financial-dashboard",     href: `/internal/${deptSlug}?view=financial&section=financial`,       icon: Wallet, label: "لوحة مالية",        moduleKey: "finance" },
      { id: "financial-transactions",  href: `/internal/${deptSlug}?view=financial&section=transactions`,    icon: Wallet, label: "العمليات",           moduleKey: "finance" },
      { id: "financial-payments",      href: `/internal/${deptSlug}?view=financial&section=payments`,        icon: Wallet, label: "المدفوعات",          moduleKey: "finance" },
      { id: "financial-expenses",      href: `/internal/${deptSlug}?view=financial&section=expenses`,        icon: Wallet, label: "المصروفات",          moduleKey: "finance" },
      { id: "financial-reports",       href: `/internal/${deptSlug}?view=financial&section=reports`,         icon: Wallet, label: "التقارير",           moduleKey: "finance" },
      { id: "financial-settlements",   href: `/internal/${deptSlug}?view=financial&section=settlements`,     icon: Wallet, label: "التسويات",           moduleKey: "finance" },
      { id: "financial-service-requests", href: `/internal/${deptSlug}?view=financial&section=service_requests`, icon: Wallet, label: "إدارة الخدمات", moduleKey: "finance" },
    ],
    legal:      [{ id: "legal",                  href: `/internal/${deptSlug}?view=legal&section=legal`,                icon: Scale,      label: "الإدارة القانونية", moduleKey: "legal"       }],
    properties: [
      { id: "buildingmanagement", href: `/internal/${deptSlug}?view=properties&section=dashboard`, icon: Building2, label: "إدارة المباني", moduleKey: "properties" },
      { id: "offers",             href: `/internal/${deptSlug}?view=properties&section=offers`,    icon: Building2, label: "العروض",        moduleKey: "offers"     },
      { id: "orders",             href: `/internal/${deptSlug}?view=properties&section=orders`,    icon: Building2, label: "الطلبات",       moduleKey: "orders"     },
    ],
    employees:  [{ id: "employees",              href: `/internal/${deptSlug}?view=employees&section=users`,            icon: Users,      label: "الموظفين",         moduleKey: "employees"   }],
  };

  const commonItems = [
    { id: "dashboard", href: isHub ? "/internal" : `/internal/${deptSlug}?view=dashboard`, icon: LayoutDashboard, label: "الإحصاءات",      moduleKey: "internal_stats"   },
    { id: "requests",  href: isHub ? `/internal/properties?view=requests` : `/internal/${deptSlug}?view=requests`, icon: MessageSquare, label: "طلبات الخدمات", moduleKey: "service_requests" },
  ];
  const featureItems = (!isHub && deptFeatureItems[deptSlug]) || [];

  const isActive = (id: string, href: string) => {
    if (id === "chat") return pathname === "/internal/chat" || pathname.startsWith("/internal/chat/");
    if (isHub && id === "dashboard") return pathname === "/internal";
    if (!isHub && (id === "dashboard" || id === "requests")) return currentView === id;
    try {
      const url = new URL(href, "http://x");
      const v   = url.searchParams.get("view");
      const s   = url.searchParams.get("section");
      if (v) return currentView === v && (s ? searchParams.get("section") === s : true);
    } catch {}
    return currentView === id || pathname === href;
  };

  /* ─── loading ─── */
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold">{loadingText}</div>
      </div>
    );
  }

  /* ─── subscription guard ─── */
  if (subStatus && !subStatus.active) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md">
          {/* Icon */}
          <div className="w-24 h-24 rounded-[2rem] bg-red-500/20 border border-red-500/20 flex items-center justify-center">
            <Clock className="w-12 h-12 text-red-400" />
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-white tracking-tight">انتهى اشتراكك</h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto font-medium leading-relaxed">
              لقد انتهت فترة اشتراكك في المنصة. يمكنك تجديد اشتراكك للاستمرار في الوصول إلى جميع الخدمات، أو العودة إلى الصفحة الرئيسية.
            </p>
          </div>

          {/* Subscription info if available */}
          {subStatus.subscription && (
            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-right space-y-1">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">آخر اشتراك</p>
              <p className="text-white font-bold text-sm">
                انتهى في: {new Date(subStatus.subscription.endDate).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => router.push('/internal/renew-subscription')}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm tracking-wide transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              تجديد الاشتراك
            </button>
            <button
              onClick={() => router.push('/details')}
              className="w-full h-12 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-bold text-sm transition-all border border-white/10"
            >
              الذهاب إلى الصفحة الرئيسية
            </button>
            <button
              onClick={handleLogout}
              className="w-full h-10 text-slate-500 hover:text-slate-300 text-xs font-bold transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── coming soon ─── */
  if (!isHub && !isOpen) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <ComingSoonOverlay sectionName={dept?.nameAr || "لوحة الإدارة"} message={message} isAdmin={isAdmin} />
      </div>
    );
  }

  const DeptIcon = dept?.Icon;
  const accessibleDepts = Object.entries(DEPT_CONFIG).filter(([s]) => canAccess(s) && modStatus(s) !== "disabled");

  /* ─── Subscription Badge ─── */
  const SubscriptionBadge = () => {
    if (!subStatus) return null;
    const isLow = subStatus.daysLeft <= 7 && !subStatus.noExpiry;
    return (
      <div className={`mx-3 mb-2 p-3 rounded-2xl border transition-all ${
        subStatus.noExpiry ? 'bg-slate-50 border-slate-100' :
        isLow ? 'bg-red-50 border-red-100 animate-pulse' : 'bg-slate-50 border-slate-100'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            subStatus.noExpiry ? 'bg-slate-200 text-slate-600' :
            isLow ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{subscriptionStatusLabel}</p>
            <p className={`text-[11px] font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
              {subStatus.noExpiry ? openEndedLabel : 
               subStatus.daysLeft <= 0 ? expiredLabel : 
               daysLeftLabel(subStatus.daysLeft)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const ProfilePanel = () => (
    <AnimatePresence>
      {profileOpen && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProfileOpen(false)}
            className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: isRtl ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRtl ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className={`fixed top-0 z-[80] h-full w-full max-w-md bg-white shadow-2xl ${
              isRtl ? "right-0" : "left-0"
            }`}
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-950">{profileLabel}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{subscriptionStatusLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-[calc(100%-4rem)] overflow-y-auto p-5 space-y-5">
              <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {avatarNode("w-20 h-20 rounded-[1.5rem] bg-slate-100 shadow-sm", "text-xl font-black text-slate-700")}
                    <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center cursor-pointer shadow-lg">
                      {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageUpload} />
                    </label>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-slate-950 truncate">{getDisplayName()}</p>
                    <p className="text-sm text-slate-500 truncate">{user?.email || user?.phone || user?.role}</p>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">
                      {isUploadingImage ? uploadingLabel : uploadImageLabel}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{subscriptionStatusLabel}</p>
                <p className="text-xl font-black text-slate-950">
                  {!subStatus ? loadingText : subStatus.noExpiry ? openEndedLabel : subStatus.daysLeft <= 0 ? expiredLabel : daysLeftLabel(subStatus.daysLeft)}
                </p>
                {subStatus?.subscription?.endDate && (
                  <p className="text-sm text-slate-500 mt-2">
                    {new Date(subStatus.subscription.endDate).toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/internal/renew-subscription");
                    }}
                    className="flex-1 h-11 rounded-2xl bg-slate-950 text-white text-sm font-black"
                  >
                    {subscriptionsLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      router.push("/profile");
                    }}
                    className="flex-1 h-11 rounded-2xl border border-slate-200 text-slate-700 text-sm font-black flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {openProfileLabel}
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  /* ─── Sidebar content (shared between hub and dept views) ─── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full" dir={isRtl ? "rtl" : "ltr"}>

      {/* ── Back link ── */}
      {!isHub && (
        <div className="px-5 pt-5 pb-2">
          <Link
            href="/internal"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-[11px] font-black uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className={`w-3 h-3 ${isRtl ? "rotate-180" : ""}`} />
            {backToHomeLabel}
          </Link>
        </div>
      )}

      {/* ── Title ── */}
      <div className="px-5 pt-4 pb-5 border-b border-slate-100">
        <h2 className="text-[18px] font-black text-slate-950 tracking-tight">
          {isChat ? chatCenterLabel : isHub ? dashboardTitle : isRtl ? dept?.nameAr : dept?.nameEn}
        </h2>
        {!isHub && !isChat && (
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            {dept?.nameEn} DEPT
          </p>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Hub: show all accessible departments */}
        {isHub && accessibleDepts.map(([dSlug, dConfig]) => {
          const disabled = modStatus(dSlug) !== "enabled";
          const DIcon = dConfig.Icon;
          return (
            <SideNavItem
              key={dSlug}
              href={`/internal/${dSlug}?view=dashboard`}
              icon={DIcon}
              label={isRtl ? dConfig.nameAr : dConfig.nameEn}
              sublabel={disabled ? (isRtl ? "قريباً" : "Coming soon") : undefined}
              disabled={disabled}
              onClick={() => setSidebarOpen(false)}
            />
          );
        })}

        {/* Dept: common items */}
        {!isHub && commonItems.map((item) => {
          const st = modStatus(item.moduleKey);
          if (st === "disabled") return null;
          return (
            <SideNavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isActive(item.id, item.href)}
              disabled={st !== "enabled"}
              onClick={() => setSidebarOpen(false)}
            />
          );
        })}

        {/* Dept: feature items */}
        {!isHub && featureItems.length > 0 && (
          <>
            <div className="h-px bg-slate-100 mx-2 my-2" />
            {featureItems.map((item) => {
              const st = modStatus(item.moduleKey);
              if (st === "disabled") return null;
              return (
                <SideNavItem
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  isActive={isActive(item.id, item.href)}
                  disabled={st !== "enabled"}
                  onClick={() => setSidebarOpen(false)}
                />
              );
            })}
          </>
        )}

        {/* Hub: common bottom items */}
        {isHub && (
          <>
            <div className="h-px bg-slate-100 mx-2 my-2" />
            {commonItems.slice(1).map((item) => {
              const st = modStatus(item.moduleKey);
              if (st === "disabled") return null;
              return (
                <SideNavItem
                  key={item.id}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  disabled={st !== "enabled"}
                  onClick={() => setSidebarOpen(false)}
                />
              );
            })}
          </>
        )}
      </nav>

      <div className="px-4 pb-5 pt-3 border-t border-slate-100 space-y-2">
        <SubscriptionBadge />
        {isHub && (
          <SideNavItem
            href="/subscriptions/new"
            icon={CreditCard}
            label={subscriptionsLabel}
          />
        )}
        <SideNavItem
          href="/details"
          icon={ArrowLeft}
          label={backToHomeLabel}
          onClick={() => setSidebarOpen(false)}
        />
        <button
          onClick={handleLogout}
          className="group flex items-center justify-between gap-3 w-full rounded-[1.5rem] px-4 py-3.5 bg-white hover:bg-red-50 border border-slate-100 hover:border-red-100 shadow-sm transition-all duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors">
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          </div>
          <span className="flex-1 text-right text-[12px] font-black text-slate-700 group-hover:text-red-600 transition-colors">
            {logoutLabel}
          </span>
        </button>
      </div>
    </div>
  );

  /* ─── Layout ─── */
  return (
    <div className="flex h-screen bg-[#f7f7f8] overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>

      {/* ══ Desktop Sidebar ══ */}
      <aside
        className={`hidden lg:flex flex-col w-72 shrink-0 bg-white shadow-sm overflow-hidden ${
          isRtl ? "border-l border-slate-100" : "border-r border-slate-100"
        }`}
      >
        {/* Topbar in sidebar */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100 shrink-0">
          <Image
            src="/icons/black.png"
            alt="Logo"
            width={100}
            height={32}
            className="object-contain h-8 w-auto"
            priority
          />
          <button type="button" onClick={() => setProfileOpen(true)}>
            {avatarNode("w-9 h-9 rounded-full bg-slate-950", "text-[11px] font-black text-white")}
          </button>
        </div>

        <SidebarContent />
      </aside>

      {/* ══ Mobile: hamburger + drawer ══ */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-4 z-50 lg:hidden w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md ${
          isRtl ? "right-4" : "left-4"
        }`}
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: isRtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className={`fixed inset-y-0 z-50 w-72 bg-white shadow-2xl lg:hidden overflow-hidden ${
                isRtl ? "right-0" : "left-0"
              }`}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className={`absolute top-4 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center ${
                  isRtl ? "left-4" : "right-4"
                }`}
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ Main content ══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Slim top bar */}
        <div className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 gap-3 shrink-0">
          <div className="lg:hidden w-8" /> {/* spacer for hamburger */}
          <div className="flex items-center gap-2">
            {isChat ? (
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{chatCenterLabel}</span>
            </div>
          ) : DeptIcon && !isHub ? (
            <div className="flex items-center gap-2">
              <DeptIcon className="w-4 h-4 text-slate-500" />
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                {isRtl ? dept?.nameAr : dept?.nameEn}
              </span>
            </div>
          ) : (
            <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              {dashboardTitle}
            </span>
          )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/internal/chat"
              className={`h-10 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 text-[11px] font-black transition-colors flex items-center gap-2 ${
                isChat ? "bg-slate-950 text-white border-slate-950 hover:bg-slate-900 hover:text-white" : ""
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{chatLabel}</span>
            </Link>
            <button
              type="button"
              onClick={toggleLanguage}
              className="h-10 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-black transition-colors"
            >
              <span className="hidden sm:inline">{languageSwitchLabel}</span>
              <Globe className="w-4 h-4 sm:hidden" />
            </button>
            <NotificationBell
              variant="light"
              align="left"
              buttonClassName="rounded-2xl bg-slate-100 text-slate-500 hover:text-slate-950 hover:bg-slate-200"
            />
            <button type="button" onClick={() => setProfileOpen(true)} className="shrink-0">
              {avatarNode("w-10 h-10 rounded-2xl bg-slate-950", "text-sm font-black text-white")}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className={isChat ? "h-full flex flex-col" : `${currentView === "dashboard" || isHub ? "max-w-5xl" : "max-w-[1400px]"} mx-auto py-8 px-6 lg:px-8`}>
            {children}
          </div>
        </div>
      </main>
      <ProfilePanel />
    </div>
  );
}
