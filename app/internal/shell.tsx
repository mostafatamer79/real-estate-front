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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      whileHover={!disabled ? { x: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className="w-full"
    >
      <Link
        href={disabled ? "#" : href}
        onClick={(e) => {
          if (disabled) { e.preventDefault(); return; }
          onClick?.();
        }}
        className={`group flex items-center gap-3 w-full rounded-lg px-2 py-2 transition-colors duration-150 border-r-2 ${
          isActive
            ? "bg-white/10 text-white border-white/70"
            : disabled
              ? "opacity-40 cursor-not-allowed text-white/40 border-transparent"
              : "text-white/70 hover:text-white hover:bg-white/5 border-transparent hover:border-white/30"
        }`}
      >
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
          isActive ? "bg-white text-slate-950 border-white/20" : "bg-white/5 border-white/10 group-hover:bg-white/10"
        }`}>
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-slate-950" : "text-white/80"}`} />
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[12px] font-black truncate tracking-tight">{label}</p>
          {sublabel && (
            <p className={`text-[10px] font-bold mt-0.5 ${isActive ? "text-white/50" : "text-white/30"}`}>{sublabel}</p>
          )}
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
  const [impersonatedByAdmin, setImpersonatedByAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [subStatus, setSubStatus] = useState<{ active: boolean; daysLeft: number; noExpiry: boolean; subscription?: any } | null>(null);
  const { settings } = useSettings();
  const isRtl = language === "ar";
  const exactBuildingManagementPaths = new Set([
    "/internal",
    "/internal/properties",
    "/internal/marketing",
    "/internal/legal",
    "/internal/employees",
  ]);
  const shouldUseExactBuildingManagementLayout = exactBuildingManagementPaths.has(pathname);

  const isChat     = pathname === "/internal/chat" || pathname.startsWith("/internal/chat/");
  const deptSlug   = isChat ? "" : canonicalDeptSlug(pathname.split("/")[2] ?? "");
  const dept       = DEPT_CONFIG[deptSlug];
  const currentView = searchParams.get("view") || "dashboard";
  const currentSection = searchParams.get("section") || "";
  const isPreview = searchParams.get("preview") === "1";
  const moduleFlagsKey = JSON.stringify(settings.moduleFlags || {});
  const isRenewSubscriptionPage = pathname === "/internal/renew-subscription";
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
    try {
      const stored = localStorage.getItem("user");
      const impersonationAdmin = localStorage.getItem("impersonatedByAdmin");
      setImpersonatedByAdmin(impersonationAdmin ? JSON.parse(impersonationAdmin) : null);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      setUser(parsed);
      return parsed;
    } catch {
      setUser(null);
      setImpersonatedByAdmin(null);
      return null;
    }
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
    marketing: "marketing",
    properties: "buildingmanagement",
    finance: "financial",
    legal: "disputes",
    employees: "buildingmanagement",
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
    if (shouldUseExactBuildingManagementLayout) return;

    const modSt        = (settings.moduleFlags as any)?.[deptSlug] || "enabled";
    const blocked      = modSt === "disabled" || (modSt === "soon" && !(parsed.role === Role.ADMIN && isPreview));

    if (!isHub && (!canAccess || blocked) && deptSlug) {
      const first = departments[0] || "";
      const fallback = first === "offers" || first === "orders" ? "properties" : first;
      if (fallback) router.push(`/internal/${fallback}`);
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
  }, [router, deptSlug, moduleFlagsKey, isPreview, isHub, shouldUseExactBuildingManagementLayout]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("adminImpersonationSession");
    localStorage.removeItem("impersonatedByAdmin");
    window.dispatchEvent(new Event("auth-change"));
    router.push("/login");
  };

  const handleReturnToAdmin = () => {
    const rawSession = localStorage.getItem("adminImpersonationSession");
    if (!rawSession) return;

    try {
      const session = JSON.parse(rawSession);
      if (session.token) localStorage.setItem("token", session.token);
      else localStorage.removeItem("token");

      if (session.refreshToken) localStorage.setItem("refreshToken", session.refreshToken);
      else localStorage.removeItem("refreshToken");

      if (session.user) localStorage.setItem("user", session.user);
      else localStorage.removeItem("user");

      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      setImpersonatedByAdmin(null);
      window.dispatchEvent(new Event("auth-change"));
      router.push(session.returnTo || "/admin/users");
    } catch {
      localStorage.removeItem("adminImpersonationSession");
      localStorage.removeItem("impersonatedByAdmin");
      router.push("/admin/users");
    }
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
    const hasDirectAccess = allowed.has(canonical) || (perm && perm !== "none") || (alias && alias !== "none");
    if (canonical === "properties") {
      return hasDirectAccess || allowed.has("offers") || allowed.has("orders") ||
        (perms.offers && perms.offers !== "none") ||
        (perms.orders && perms.orders !== "none");
    }
    return hasDirectAccess;
  };

  const canAccessFeatureItem = (itemId: string) => {
    if (user?.role === Role.ADMIN) return true;
    if (itemId === "buildingmanagement") {
      const allowed = new Set((Array.isArray(user?.departments) ? user.departments : []).map((d: any) => canonicalDeptSlug(d)));
      const perms = user?.departmentPermissions || {};
      return allowed.has("properties") ||
        (perms.properties && perms.properties !== "none") ||
        (perms.property && perms.property !== "none") ||
        (perms.property_management && perms.property_management !== "none") ||
        (perms.pm && perms.pm !== "none");
    }
    if (itemId === "offers") return canAccess("properties") || canAccess("offers");
    if (itemId === "orders") return canAccess("properties") || canAccess("orders");
    return true;
  };

  const deptFeatureItems: Record<string, Array<{ id: string; href: string; icon: React.ElementType; label: string; moduleKey: string }>> = {
    marketing: [{ id: "marketing", href: `/internal/${deptSlug}?view=marketing&section=marketing`, icon: Megaphone, label: "التسويق", moduleKey: "marketing" }],
    finance: [
      { id: "financial-dashboard", href: `/internal/${deptSlug}?view=financial&section=financial`, icon: Wallet, label: "لوحة مالية", moduleKey: "finance" },
      { id: "financial-transactions", href: `/internal/${deptSlug}?view=financial&section=transactions`, icon: Wallet, label: "العمليات", moduleKey: "finance" },
      { id: "financial-payments", href: `/internal/${deptSlug}?view=financial&section=payments`, icon: Wallet, label: "المدفوعات", moduleKey: "finance" },
      { id: "financial-expenses", href: `/internal/${deptSlug}?view=financial&section=expenses`, icon: Wallet, label: "المصروفات", moduleKey: "finance" },
      { id: "financial-reports", href: `/internal/${deptSlug}?view=financial&section=reports`, icon: Wallet, label: "التقارير", moduleKey: "finance" },
      { id: "financial-settlements", href: `/internal/${deptSlug}?view=financial&section=settlements`, icon: Wallet, label: "التسويات", moduleKey: "finance" },
      { id: "financial-service-requests", href: `/internal/${deptSlug}?view=financial&section=service_requests`, icon: Wallet, label: "إدارة الخدمات", moduleKey: "finance" },
    ],
    legal: [{ id: "legal", href: `/internal/${deptSlug}?view=legal&section=legal`, icon: Scale, label: "الإدارة القانونية", moduleKey: "legal" }],
    properties: [
      { id: "buildingmanagement", href: `/internal/${deptSlug}?view=properties&section=dashboard`, icon: Building2, label: "إدارة المباني", moduleKey: "properties" },
      { id: "offers", href: `/internal/${deptSlug}?view=properties&section=offers`, icon: Building2, label: "إدارة العروض", moduleKey: "offers" },
      { id: "orders", href: `/internal/${deptSlug}?view=properties&section=orders`, icon: Building2, label: "إدارة الطلبات", moduleKey: "orders" },
    ],
    employees: [{ id: "employees", href: `/internal/${deptSlug}?view=employees&section=users`, icon: Users, label: "الموظفين", moduleKey: "employees" }],
  };

  const commonItems = [
    { id: "dashboard", href: isHub ? "/internal" : `/internal/${deptSlug}?view=dashboard`, icon: LayoutDashboard, label: "الإحصاءات",      moduleKey: "internal_stats"   },
    { id: "requests",  href: isHub ? `/internal/properties?view=requests` : `/internal/${deptSlug}?view=requests`, icon: MessageSquare, label: "طلبات الخدمات", moduleKey: "service_requests" },
    { id: "subscriptions", href: "/internal/renew-subscription", icon: CreditCard, label: subscriptionsLabel, moduleKey: "subscriptions" },
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
      if (v) return currentView === v && (s ? currentSection === s : true);
    } catch {}
    return currentView === id || pathname === href;
  };

  if (shouldUseExactBuildingManagementLayout) {
    return <>{children}</>;
  }

  /* ─── loading ─── */
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm font-bold">{loadingText}</div>
      </div>
    );
  }

  /* ─── subscription guard ─── */
  if (subStatus && !subStatus.active && !isRenewSubscriptionPage) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-lg">
          <div className="px-6 pt-6 pb-5">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-slate-950">
                {language === "ar" ? "انتهى اشتراكك" : "Subscription inactive"}
              </DialogTitle>
              <DialogDescription>
                {language === "ar"
                  ? "لا يمكن الوصول إلى الخدمات قبل تفعيل الاشتراك. اختر باقة جاهزة أو اشتراكًا مخصصًا."
                  : "You need an active subscription to continue. Choose a package or create a custom subscription."}
              </DialogDescription>
            </DialogHeader>
            {subStatus.subscription && (
              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
                {language === "ar"
                  ? `آخر اشتراك انتهى في: ${new Date(subStatus.subscription.endDate).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}`
                  : `Last subscription ended on: ${new Date(subStatus.subscription.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 pt-0">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl border-slate-200 px-5 font-bold"
              onClick={() => router.push("/subscriptions/new")}
            >
              <CreditCard className="h-4 w-4" />
              {language === "ar" ? "اشتراك مخصص" : "Custom subscription"}
            </Button>
            <Button
              type="button"
              className="h-11 rounded-2xl px-5 font-bold"
              onClick={() => router.push("/internal/renew-subscription")}
            >
              {language === "ar" ? "تجديد الاشتراك" : "Renew subscription"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-2xl px-5 font-bold text-slate-500"
              onClick={() => router.push("/details")}
            >
              {language === "ar" ? "العودة للرئيسية" : "Back to home"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      <div className={`mb-2 rounded-lg border px-3 py-2 transition-all ${
        subStatus.noExpiry ? 'bg-white/5 border-white/10' :
        isLow ? 'bg-red-500/10 border-red-300/20 animate-pulse' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            subStatus.noExpiry ? 'bg-white/10 text-white/70' :
            isLow ? 'bg-red-500/15 text-red-200' : 'bg-white/10 text-white/70'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex-1 text-right">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">{subscriptionStatusLabel}</p>
            <p className={`text-[11px] font-black ${isLow ? 'text-red-200' : 'text-white/80'}`}>
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
            className="inline-flex items-center gap-1.5 text-white/35 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className={`w-3 h-3 ${isRtl ? "rotate-180" : ""}`} />
            {backToHomeLabel}
          </Link>
        </div>
      )}

      {/* ── Title ── */}
      <div className="px-5 pt-4 pb-5 border-b border-white/5">
        <h2 className="text-[18px] font-black text-white tracking-tight">
          {isChat ? chatCenterLabel : isHub ? dashboardTitle : isRtl ? dept?.nameAr : dept?.nameEn}
        </h2>
        {!isHub && !isChat && (
          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mt-0.5">
            {dept?.nameEn} DEPT
          </p>
        )}
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">

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
            <div className="my-4 h-px bg-white/5" />
            {featureItems.map((item) => {
              const st = modStatus(item.moduleKey);
              if (st === "disabled") return null;
              if (!canAccessFeatureItem(item.id)) return null;
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
            <div className="my-4 h-px bg-white/5" />
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

      <div className="p-4 border-t border-white/5 space-y-2">
        <SubscriptionBadge />
        <SideNavItem
          href="/details"
          icon={ArrowLeft}
          label={backToHomeLabel}
          onClick={() => setSidebarOpen(false)}
        />
        <button
          onClick={handleLogout}
          className="group flex items-center gap-3 w-full rounded-lg px-2 py-2 text-white/70 hover:text-white hover:bg-red-500/10 transition-colors border-r-2 border-transparent hover:border-red-300/60"
        >
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4 text-white/80 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="flex-1 text-right text-[12px] font-black tracking-tight">
            {logoutLabel}
          </span>
        </button>
      </div>
    </div>
  );

  /* ─── Layout ─── */
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>

      {/* ══ Desktop Sidebar ══ */}
      <aside
        className="hidden lg:flex flex-col w-64 shrink-0 bg-slate-950 text-white overflow-hidden shadow-xl shadow-black/20 lg:shadow-none"
      >
        {/* Topbar in sidebar */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm tracking-tight leading-tight truncate">
                {isChat ? chatCenterLabel : isHub ? dashboardTitle : isRtl ? dept?.nameAr : dept?.nameEn}
              </p>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest truncate">
                {isHub ? "INTERNAL DEPT." : dept?.nameEn ? `${dept.nameEn} DEPT.` : "INTERNAL"}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setProfileOpen(true)}>
            {avatarNode("w-9 h-9 rounded-full bg-white/10", "text-[11px] font-black text-white")}
          </button>
        </div>

        <SidebarContent />
      </aside>

      {/* ══ Mobile: hamburger + drawer ══ */}
      <button
        onClick={() => setSidebarOpen(true)}
        className={`fixed top-4 z-50 lg:hidden w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm shadow-black/20 ${
          isRtl ? "right-4" : "left-4"
        }`}
      >
        <Menu className="w-5 h-5" />
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
              className={`fixed inset-y-0 z-50 w-64 bg-slate-950 text-white shadow-2xl lg:hidden overflow-hidden ${
                isRtl ? "right-0" : "left-0"
              }`}
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className={`absolute top-4 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center ${
                  isRtl ? "left-4" : "right-4"
                }`}
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ══ Main content ══ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Slim top bar */}
        <div className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 gap-3 shrink-0">
          <div className="lg:hidden w-8" /> {/* spacer for hamburger */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-slate-100 transition-colors">
              <Menu className="w-4 h-4 text-slate-400" />
            </button>
            <div className="hidden lg:block h-4 w-px bg-slate-200" />
            {isChat ? (
            <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <span className="text-[12px] font-black text-slate-900 truncate">{chatCenterLabel}</span>
            </div>
          ) : DeptIcon && !isHub ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-2 px-3 h-9 rounded-xl bg-slate-50 border border-slate-200 min-w-0">
                <DeptIcon className="w-4 h-4 text-slate-700 shrink-0" />
                <span className="text-[12px] font-black text-slate-900 truncate">
                {isRtl ? dept?.nameAr : dept?.nameEn}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">DEPT</span>
              </div>
              <div className="hidden sm:flex items-center h-9 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-[11px] font-black">
                {currentView}
              </div>
            </div>
          ) : (
            <span className="flex items-center h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[12px] font-black text-slate-900">
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
              align="left"
              buttonClassName="rounded-xl bg-slate-100 text-slate-500 hover:text-slate-950 hover:bg-slate-200"
            />
            <button type="button" onClick={() => setProfileOpen(true)} className="shrink-0">
              {avatarNode("w-8 h-8 rounded-full bg-slate-950", "text-[10px] font-black text-white")}
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
