"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Shield,
  Zap,
  Star,
} from "lucide-react";
import api from "@/lib/api";

const PLANS = [
  {
    id: "monthly",
    label: "شهري",
    type: "شهري",
    months: 1,
    price: 299,
    badge: null,
    description: "مثالي للتجربة",
  },
  {
    id: "quarterly",
    label: "ربع سنوي",
    type: "مخصص",
    months: 3,
    price: 799,
    badge: "وفّر 11%",
    description: "الأكثر مرونة",
  },
  {
    id: "yearly",
    label: "سنوي",
    type: "سنوي",
    months: 12,
    price: 2499,
    badge: "الأفضل قيمة",
    description: "وفّر 30%",
  },
];

const PAYMENT_METHODS = [
  { id: "بطاقة ائتمان", label: "بطاقة ائتمان / مدى", icon: "💳" },
  { id: "تحويل بنكي", label: "تحويل بنكي", icon: "🏦" },
  { id: "Apple Pay", label: "Apple Pay", icon: "🍎" },
  { id: "STC Pay", label: "STC Pay", icon: "📱" },
];

const FEATURES = [
  "وصول كامل لجميع الأقسام",
  "إدارة الموظفين والصلاحيات",
  "التقارير المالية المفصّلة",
  "إدارة العقارات والوحدات",
  "دعم فني متواصل",
  "تحديثات مجانية مستمرة",
];

export default function RenewSubscriptionPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentStatus, setCurrentStatus] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));

    // Load current subscription status
    api.get("/subscriptions/status").then((res) => {
      setCurrentStatus(res.data);
    }).catch(() => {});
  }, [router]);

  const handleRenew = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    const today = new Date();
    const endDate = new Date(today);
    if (selectedPlan.type === "سنوي") {
      endDate.setFullYear(today.getFullYear() + 1);
    } else {
      endDate.setMonth(today.getMonth() + selectedPlan.months);
    }

    try {
      await api.post("/subscriptions", {
        userId: user.id,
        subscriptionType: selectedPlan.type,
        customPeriodMonths: selectedPlan.type === "مخصص" ? selectedPlan.months : undefined,
        amount: selectedPlan.price,
        startDate: today.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        paymentMethod: selectedPayment,
        status: "نشط",
        noExpiry: false,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/internal");
      }, 2500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        "حدث خطأ أثناء تجديد الاشتراك. يرجى المحاولة مرة أخرى."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center space-y-6 max-w-sm">
          <div className="w-24 h-24 rounded-[2rem] bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white">تم تجديد اشتراكك!</h1>
            <p className="text-slate-400 text-sm font-medium">
              مرحباً بك مجدداً. جاري تحويلك إلى لوحة التحكم...
            </p>
          </div>
          <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
            <Loader2 className="w-4 h-4 animate-spin" />
            جاري التحويل...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">تجديد الاشتراك</h1>
            <p className="text-slate-400 text-sm font-medium">اختر الخطة المناسبة لك</p>
          </div>
        </div>

        {/* Expired notice */}
        {currentStatus && !currentStatus.active && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-300 text-sm font-bold">
              اشتراكك منتهٍ — قم بالتجديد الآن للعودة إلى الوصول الكامل
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Plans + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan selector */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">اختر الخطة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative p-5 rounded-2xl border-2 text-right transition-all ${
                      selectedPlan.id === plan.id
                        ? "border-blue-500 bg-blue-600/15"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-3 px-2 py-0.5 bg-blue-500 rounded-full text-[10px] font-black">
                        {plan.badge}
                      </span>
                    )}
                    <p className="font-black text-white text-base">{plan.label}</p>
                    <p className="text-slate-400 text-xs font-medium mt-1">{plan.description}</p>
                    <p className="text-2xl font-black text-white mt-3">
                      {plan.price.toLocaleString('ar-SA')}
                      <span className="text-sm font-bold text-slate-400"> ر.س</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">طريقة الدفع</h2>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-right ${
                      selectedPayment === method.id
                        ? "border-blue-500 bg-blue-600/15"
                        : "border-white/10 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-bold text-sm text-white">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            {/* Order summary */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">ملخص الطلب</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">الخطة</span>
                  <span className="text-white font-bold">{selectedPlan.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">المدة</span>
                  <span className="text-white font-bold">{selectedPlan.months} شهر</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">طريقة الدفع</span>
                  <span className="text-white font-bold">
                    {PAYMENT_METHODS.find(m => m.id === selectedPayment)?.label}
                  </span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-black">الإجمالي</span>
                  <span className="text-blue-400 font-black text-lg">
                    {selectedPlan.price.toLocaleString('ar-SA')} ر.س
                  </span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-xs font-bold text-center">{error}</p>
                </div>
              )}

              <button
                onClick={handleRenew}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                {isLoading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> جاري المعالجة...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> تجديد الاشتراك</>
                )}
              </button>

              <button
                onClick={() => router.push("/details")}
                className="w-full h-10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl font-bold text-xs transition-all border border-white/10"
              >
                الذهاب إلى الصفحة الرئيسية
              </button>
            </div>

            {/* Features */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-black text-white">ما يشمله الاشتراك</h2>
              </div>
              <ul className="space-y-2">
                {FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
