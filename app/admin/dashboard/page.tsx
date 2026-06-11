"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, BarChart3, Building2, CreditCard, FileText, Headphones, LineChart, LockKeyhole, MapPinned, Megaphone, Receipt, Scale, Settings, ShoppingBag, Trash2, Users, Wallet, Wrench } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { arSA } from "date-fns/locale";
import { activitiesApi, financialApi, usersApi } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const isClosedUser = (user: any) => user?.isActive === false || user?.status === "closed";
const isDeletedUser = (user: any) => Boolean(user?.deletedAt || user?.isDeleted || user?.status === "deleted");

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
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
    { href: "/admin/transactions", label: isRtl ? "الإدارة المالية" : "Finance", icon: Receipt },
    { href: "/admin/wallet", label: isRtl ? "المحفظة" : "Wallet", icon: Wallet },
    { href: "/admin/properties-management", label: isRtl ? "إدارة الأملاك" : "Properties", icon: Building2 },
    { href: "/admin/legal", label: isRtl ? "الإدارة القانونية" : "Legal", icon: Scale },
    { href: "/admin/services?type=post_purchase", label: isRtl ? "الخدمات" : "Services", icon: Wrench },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, usersRes, activitiesRes] = await Promise.all([
          financialApi.getDashboardStats(),
          usersApi.findAll(),
          activitiesApi.getRecent(),
        ]);

        setDashboardStats(statsRes.data || null);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);
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

  const getActivityTitle = (activity: any) => {
    if (isRtl) return activity.titleAr || activity.title || activity.type || "نشاط";
    return activity.title || activity.titleAr || activity.type || "Activity";
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-56 rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-32 rounded-2xl bg-slate-200" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-200" />
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
          <Activity className="h-3.5 w-3.5" />
          {isRtl ? "الرئيسية" : "Home"}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {isRtl ? "لوح التحكم" : "Admin Dashboard"}
        </h1>
      </header>

      <section className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto">
          {dashboardNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-fit items-center justify-center gap-2 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-950 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link href={stat.href} className="block rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-md">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-950">
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              <p className="text-3xl font-black tabular-nums text-slate-950">{stat.value}</p>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-950">{isRtl ? "النشاطات الأخيرة" : "Recent activities"}</h2>
            <p className="text-xs font-bold text-slate-400">{isRtl ? "عرض فقط بدون تعديل" : "Read-only activity log"}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-300">
            {isRtl ? "لا توجد نشاطات" : "No activities"}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((activity, index) => (
              <div key={activity.id || index} className="flex items-start gap-4 py-4">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-slate-950">{getActivityTitle(activity)}</p>
                  {activity.description && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium leading-6 text-slate-500">{activity.description}</p>
                  )}
                  {activity.createdAt && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
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
    </div>
  );
}
