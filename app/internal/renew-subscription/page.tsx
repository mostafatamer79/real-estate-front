"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  PackageCheck,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";

type SubscriptionStatus = {
  active: boolean;
  daysLeft?: number;
  noExpiry?: boolean;
  subscription?: {
    endDate?: string;
    managementPackage?: { name?: string } | null;
    amount?: number;
    subscriptionType?: string;
  } | null;
};

export default function RenewSubscriptionPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const isRtl = language === "ar";
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }

    api
      .get("/subscriptions/status")
      .then((res) => setStatus(res.data || null))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [router]);

  const statusCopy = useMemo(() => {
    if (!status) {
      return {
        title: isRtl ? "حالة الاشتراك غير متاحة" : "Subscription status unavailable",
        desc: isRtl ? "يمكنك اختيار باقة جديدة أو إنشاء اشتراك مخصص." : "Choose a package or create a custom subscription.",
        tone: "neutral",
      };
    }
    if (status.active) {
      return {
        title: isRtl ? "اشتراكك نشط" : "Your subscription is active",
        desc: status.noExpiry
          ? (isRtl ? "هذا الاشتراك غير محدود ولا يحتاج إلى تجديد." : "This subscription has no expiry date.")
          : (isRtl ? `متبقي ${status.daysLeft ?? 0} يوم على الاشتراك الحالي.` : `${status.daysLeft ?? 0} days remaining on your current subscription.`),
        tone: "active",
      };
    }
    return {
      title: isRtl ? "الاشتراك غير نشط" : "Subscription inactive",
      desc: isRtl ? "فعّل اشتراكك للعودة إلى الإدارات والميزات الداخلية." : "Activate your subscription to regain access to internal departments.",
      tone: "expired",
    };
  }, [isRtl, status]);

  const currentSub = status?.subscription;
  const locale = isRtl ? "ar-SA" : "en-US";
  const lastEndDate = currentSub?.endDate
    ? new Date(currentSub.endDate).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const actionCards = [
    {
      id: "packages",
      title: isRtl ? "اختيار باقة جاهزة" : "Choose Package",
      desc: isRtl ? "باقات جاهزة بسعر شهري أو سنوي حسب الإدارات المحددة من الإدارة." : "Ready packages with monthly or yearly pricing.",
      icon: PackageCheck,
      action: () => router.push("/subscriptions/new?mode=packages"),
      cta: isRtl ? "عرض الباقات" : "View packages",
    },
    {
      id: "custom",
      title: isRtl ? "اشتراك مخصص" : "Custom Subscription",
      desc: isRtl ? "اختر الإدارات التي تحتاجها وعدد موظفي إدارة الموظفين." : "Choose departments and employee seats.",
      icon: SlidersHorizontal,
      action: () => router.push("/subscriptions/new?mode=custom"),
      cta: isRtl ? "إنشاء مخصص" : "Create custom",
    },
    {
      id: "wallet",
      title: isRtl ? "المحفظة والفواتير" : "Wallet & Invoices",
      desc: isRtl ? "راجع الفواتير وادفع الاشتراكات المعلقة من المحفظة." : "Review invoices and pay pending subscriptions.",
      icon: Wallet,
      action: () => router.push("/wallet"),
      cta: isRtl ? "فتح المحفظة" : "Open wallet",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[55vh] bg-slate-50 flex items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-white px-6 py-5 text-sm font-black text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          {isRtl ? "جاري تحميل بيانات الاشتراك" : "Loading subscription details"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8" dir={isRtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/internal")}
            className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-xs font-black text-slate-600 hover:bg-slate-50"
          >
            <ArrowRight className="h-4 w-4" />
            {isRtl ? "العودة للإدارات" : "Back to internal"}
          </Button>
          <div className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 shadow-sm ring-1 ring-slate-100">
            <CreditCard className="h-4 w-4" />
            {isRtl ? "إدارة الاشتراك" : "Subscription"}
          </div>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="absolute -top-28 -left-24 h-64 w-64 rounded-full bg-slate-950/5 blur-3xl" />
          <div className="absolute -bottom-28 -right-24 h-64 w-64 rounded-full bg-slate-950/5 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-950 px-4 text-[11px] font-black text-white">
                <ShieldCheck className="h-4 w-4" />
                {isRtl ? "تجديد الاشتراك" : "Renew Subscription"}
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {statusCopy.title}
                </h1>
                <p className="max-w-2xl text-sm font-bold leading-7 text-slate-500">
                  {statusCopy.desc}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => router.push("/subscriptions/new")}
                  className="h-12 rounded-2xl bg-slate-950 px-6 text-xs font-black text-white hover:bg-slate-800"
                >
                  <PackageCheck className="h-4 w-4" />
                  {isRtl ? "اختر اشتراك" : "Choose subscription"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/wallet")}
                  className="h-12 rounded-2xl border-slate-200 bg-white px-6 text-xs font-black text-slate-700 hover:bg-slate-50"
                >
                  <Wallet className="h-4 w-4" />
                  {isRtl ? "المحفظة" : "Wallet"}
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {isRtl ? "الحالة الحالية" : "Current Status"}
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {status?.active ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                  </p>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  status?.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"
                }`}>
                  {status?.active ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl bg-white p-4 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{isRtl ? "الباقة" : "Package"}</span>
                  <span className="text-slate-900">{currentSub?.managementPackage?.name || (isRtl ? "غير محدد" : "Not set")}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{isRtl ? "النوع" : "Type"}</span>
                  <span className="text-slate-900">{currentSub?.subscriptionType || "-"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-400">{isRtl ? "تاريخ الانتهاء" : "End Date"}</span>
                  <span className="text-slate-900">{status?.noExpiry ? (isRtl ? "غير محدود" : "No expiry") : lastEndDate || "-"}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                type="button"
                onClick={card.action}
                className="group rounded-[1.75rem] border border-slate-100 bg-white p-5 text-start shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-900 ring-1 ring-slate-100 transition-colors group-hover:bg-slate-950 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[11px] font-black text-slate-400">{card.cta}</span>
                </div>
                <h2 className="text-base font-black text-slate-950">{card.title}</h2>
                <p className="mt-2 text-xs font-bold leading-6 text-slate-500">{card.desc}</p>
              </button>
            );
          })}
        </section>

        <section className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-800 ring-1 ring-slate-100">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-950">
                  {isRtl ? "تحتاج معاينة الإدارات قبل الاشتراك؟" : "Need to preview departments first?"}
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  {isRtl ? "يمكنك مشاهدة الأقسام المتاحة والميزات من صفحة الاشتراكات." : "You can view departments and features from the subscription page."}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/subscriptions/new")}
              className="h-11 rounded-2xl border-slate-200 bg-white px-5 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              {isRtl ? "فتح صفحة الاشتراكات" : "Open subscriptions"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
