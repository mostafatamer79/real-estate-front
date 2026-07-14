"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart3, Building2, CreditCard, FileText, Headphones, LineChart, LockKeyhole, MapPinned, Megaphone, Receipt, Scale, Settings, ShoppingBag, Trash2, Users, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import api, { activitiesApi, financialApi, usersApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "sonner";

const isClosedUser = (user: any) => user?.isActive === false || user?.status === "closed";
const isDeletedUser = (user: any) => Boolean(user?.deletedAt || user?.isDeleted || user?.status === "deleted");

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [isWiping, setIsWiping] = useState(false);
  const isRtl = language === "ar";
  const dashboardNavigation = [
    { href: "/admin/users", label: isRtl ? "المستخدمين" : "Users", icon: Users },
    { href: "/admin/subscriptions", label: isRtl ? "الاشتراكات" : "Subscriptions", icon: CreditCard },
    { href: "/admin/map-control", label: isRtl ? "الخريطة" : "Map", icon: MapPinned },
    { href: "/admin/operations", label: isRtl ? "الإحصائيات والعمليات" : "Stats & Operations", icon: BarChart3 },
    { href: "/admin/trends", label: isRtl ? "التحليلات والاتجاهات" : "Analytics & Trends", icon: LineChart },
    { href: "/admin/customer-service", label: isRtl ? "خدمة العملاء" : "Customer Service", icon: Headphones },
    { href: "/admin/settings", label: isRtl ? "الإعدادات والتحكم" : "Settings", icon: Settings },
    { href: "/admin/offers", label: isRtl ? "إدارة العروض" : "Offers", icon: FileText },
    { href: "/admin/orders", label: isRtl ? "إدارة الطلبات" : "Orders", icon: ShoppingBag },
    { href: "/admin/marketing", label: isRtl ? "إدارة التسويق" : "Marketing", icon: Megaphone },
    { href: "/admin/wallet", label: isRtl ? "الإدارة المالية" : "Finance", icon: Receipt },
    { href: "/admin/properties-management", label: isRtl ? "إدارة الأملاك" : "Properties", icon: Building2 },
    { href: "/admin/legal", label: isRtl ? "الإدارة القانونية" : "Legal", icon: Scale },
    { href: "/admin/services?type=post_purchase", label: isRtl ? "الخدمات" : "Services", icon: Wrench },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, usersRes, activitiesRes, requestsRes] = await Promise.all([
          financialApi.getDashboardStats(),
          usersApi.findAll(),
          activitiesApi.getRecent(),
          api.get("/service-requests", { params: { page: 1, limit: 500 } }).catch(() => ({ data: [] })),
        ]);

        setDashboardStats(statsRes.data || null);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
        setServiceRequests(Array.isArray(requestsRes.data?.items) ? requestsRes.data.items : Array.isArray(requestsRes.data) ? requestsRes.data : []);
      } catch (error) {
        console.error("Failed to fetch admin dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const closedAccounts = users.filter(isClosedUser).length;
    const deletedAccounts = users.filter(isDeletedUser).length;

    return [
      {
        label: isRtl ? "إجمالي المستخدمين" : "Total users",
        value: dashboardStats?.totalUsers ?? users.length,
        icon: Users,
        href: "/admin/users",
      },
      {
        label: isRtl ? "العمليات النشطة" : "Active operations",
        value: dashboardStats?.activeOperations ?? 0,
        icon: Activity,
        href: "/admin/operations",
      },
      {
        label: isRtl ? "الحسابات المغلقة" : "Closed accounts",
        value: closedAccounts,
        icon: LockKeyhole,
        href: "/admin/users",
      },
      {
        label: isRtl ? "الحسابات المحذوفة" : "Deleted accounts",
        value: deletedAccounts,
        icon: Trash2,
        href: "/admin/users",
      },
    ];
  }, [dashboardStats, isRtl, users]);

  const requestBuckets = useMemo(() => {
    const matches = (request: any, category: string, department?: string) => {
      const target = request.targetDepartment;
      const requestCategory = request.category;
      return requestCategory === category || (!!department && target === department);
    };

    const uncategorizedCount = serviceRequests.filter((request) => {
      const known =
        matches(request, "legal", "legal") ||
        matches(request, "marketing", "marketing") ||
        matches(request, "finance", "finance") ||
        matches(request, "postPurchase") ||
        matches(request, "post_purchase") ||
        matches(request, "construction") ||
        (request.category === "other" && !request.targetDepartment);
      return !known;
    }).length;

    return [
      {
        label: isRtl ? "كل طلبات المنصة" : "All platform requests",
        value: serviceRequests.length,
        href: "/admin/services",
        icon: BarChart3,
        description: isRtl ? "إجمالي كل الطلبات من الخدمات والإدارات" : "All requests across services and departments",
      },
      {
        label: isRtl ? "الإدارة القانونية" : "Legal requests",
        value: serviceRequests.filter((request) => matches(request, "legal", "legal")).length,
        href: "/admin/legal",
        icon: Scale,
        description: isRtl ? "منازعات، عقود، توثيق، واستشارات" : "Disputes, contracts, documentation, and consultation",
      },
      {
        label: isRtl ? "إدارة التسويق" : "Marketing requests",
        value: serviceRequests.filter((request) => matches(request, "marketing", "marketing")).length,
        href: "/admin/marketing",
        icon: Megaphone,
        description: isRtl ? "طلبات الحملات والخدمات التسويقية" : "Campaign and marketing service requests",
      },
      {
        label: isRtl ? "الإدارة المالية" : "Finance requests",
        value: serviceRequests.filter((request) => matches(request, "finance", "finance")).length,
        href: "/admin/wallet",
        icon: Receipt,
        description: isRtl ? "طلبات مرتبطة بالتحصيل والفواتير" : "Billing and collection related requests",
      },
      {
        label: isRtl ? "خدمات ما بعد الشراء" : "Post-purchase services",
        value: serviceRequests.filter((request) => request.category === "postPurchase" || request.category === "post_purchase").length,
        href: "/admin/services?type=post_purchase",
        icon: ShoppingBag,
        description: isRtl ? "الصيانة، النقل، التنظيف، وخدمات ما بعد الشراء" : "Maintenance, moving, cleaning, and post-purchase services",
      },
      {
        label: isRtl ? "البناء والمقاولات" : "Construction services",
        value: serviceRequests.filter((request) => request.category === "construction").length,
        href: "/admin/services?type=construction",
        icon: Building2,
        description: isRtl ? "طلبات البناء، التشطيبات، والإشراف" : "Construction, finishing, and supervision requests",
      },
      {
        label: isRtl ? "خدمات أخرى" : "Other services",
        value: serviceRequests.filter((request) => request.category === "other" && !request.targetDepartment).length + uncategorizedCount,
        href: "/admin/services?type=other",
        icon: Wrench,
        description: isRtl ? "أي طلبات غير مصنفة داخل إدارة محددة" : "Requests not assigned to a specific department",
      },
    ];
  }, [isRtl, serviceRequests]);

  const getActivityTitle = (activity: any) => {
    if (isRtl) return activity.titleAr || activity.title || activity.type || "نشاط";
    return activity.title || activity.titleAr || activity.type || "Activity";
  };

  const handleWipe = async () => {
    const confirmed = window.confirm(
      isRtl
        ? "تحذير: سيتم حذف جميع بيانات المنصة (مستخدمين، عقارات، طلبات، إلخ) ويبقى حساب الأدمن فقط. هل أنت متأكد؟"
        : "Warning: This will delete all platform data (users, properties, requests, etc.) and keep only admin accounts. Are you sure?"
    );
    if (!confirmed) return;

    setIsWiping(true);
    try {
      const res = await api.post("/wipe/all-data");
      toast?.success?.(res.data?.message || (isRtl ? "تم حذف البيانات بنجاح" : "Data wiped successfully"));
      window.location.reload();
    } catch (err: any) {
      toast?.error?.(err?.response?.data?.message || (isRtl ? "فشل حذف البيانات" : "Failed to wipe data"));
    } finally {
      setIsWiping(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-56 rounded-xl bg-muted" />
        <div className="grid grid-cols-1 md:grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
          <Activity className="h-3 w-3" />
          {isRtl ? "الرئيسية" : "Home"}
        </div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
          {isRtl ? "لوح التحكم" : "Admin Dashboard"}
        </h1>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={stat.href} className="block rounded-2xl border border bg-card p-4.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
              <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-slate-950">
                <stat.icon className="h-4.5 w-4.5" />
              </div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums text-slate-950">{stat.value}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="rounded-2xl border border bg-card p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-base font-black text-slate-950">{isRtl ? "طلبات المنصة" : "Platform requests"}</h2>
            <p className="text-[11px] font-bold text-slate-400">
              {isRtl ? "كل طلبات الخدمات والإدارات في مكان واحد. اضغط على الرقم أو الكرت للانتقال للصفحة." : "All service and department requests in one place. Click any card to open its page."}
            </p>
          </div>
          <div className="rounded-full bg-slate-950 px-3.5 py-1.5 text-[11px] font-black text-white">
            {isRtl ? "الإجمالي" : "Total"}: {serviceRequests.length.toLocaleString("en-US")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {requestBuckets.map((bucket, index) => (
            <motion.div
              key={bucket.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Link
                href={bucket.href}
                className={`group block h-full rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  bucket.value > 0
                    ? "border bg-slate-950 text-white shadow-sm"
                    : "border bg-muted/60 text-slate-500"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bucket.value > 0 ? "bg-card/10 text-white" : "bg-card text-slate-400"}`}>
                    <bucket.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-black ${bucket.value > 0 ? "bg-card text-slate-950" : "bg-card text-slate-400"}`}>
                    {bucket.value > 0 ? (isRtl ? "يحتاج متابعة" : "Needs review") : (isRtl ? "لا يوجد" : "Clear")}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-xs font-black ${bucket.value > 0 ? "text-white" : "text-slate-700"}`}>{bucket.label}</p>
                    <p className={`mt-1 line-clamp-2 text-[10px] font-bold leading-4 ${bucket.value > 0 ? "text-white/60" : "text-slate-400"}`}>{bucket.description}</p>
                  </div>
                  <p className="shrink-0 text-xl sm:text-2xl font-black tabular-nums">{bucket.value.toLocaleString("en-US")}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border bg-card p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-black text-slate-950">{isRtl ? "النشاطات الأخيرة" : "Recent activities"}</h2>
            <p className="text-[11px] font-bold text-slate-400">{isRtl ? "عرض فقط بدون تعديل" : "Read-only activity log"}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-slate-400">
            <Activity className="h-4.5 w-4.5" />
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="py-6 md:py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
            {isRtl ? "لا توجد نشاطات" : "No activities"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className="flex items-start gap-3.5 py-3.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-950">{getActivityTitle(activity)}</p>
                  {activity.description && (
                    <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-5 text-slate-500">{activity.description}</p>
                  )}
                  {activity.createdAt && (
                    <p className="mt-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                        locale: isRtl ? arSA : undefined,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 className="text-base font-black text-red-900">{isRtl ? "منطقة الخطر" : "Danger Zone"}</h2>
            <p className="text-[11px] font-bold text-red-600/80">
              {isRtl ? "عمليات لا يمكن التراجع عنها. استخدمها بحذر." : "Irreversible actions. Use with caution."}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-white p-4">
          <div>
            <p className="text-sm font-black text-slate-950">{isRtl ? "حذف جميع بيانات المنصة" : "Wipe all platform data"}</p>
            <p className="text-[11px] font-bold text-slate-400">
              {isRtl ? "يحذف كل شيء ويبقي حساب الأدمن فقط. مثالي قبل نشر نسخة تجريبية." : "Deletes everything and keeps only admin accounts. Ideal before publishing a demo."}
            </p>
          </div>
          <button
            onClick={handleWipe}
            disabled={isWiping}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-all hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isWiping ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {isRtl ? "جارٍ الحذف..." : "Wiping..."}
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                {isRtl ? "حذف البيانات" : "Wipe Data"}
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
