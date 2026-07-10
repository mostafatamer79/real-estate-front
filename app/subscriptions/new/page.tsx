"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, CreditCard, Eye, Loader2, Shield, SlidersHorizontal } from "lucide-react";
import toast from "react-hot-toast";
import api, { subscriptionsApi } from "@/lib/api";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { useLanguage } from "@/context/LanguageContext";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import DepartmentFeaturePreviewDialog, { PreviewDepartmentKey } from "@/components/subscriptions/DepartmentFeaturePreviewDialog";
import { SaudiRiyalAmount, SaudiRiyalSymbol } from "@/components/ui/saudi-riyal";

interface ManagementPackage {
  id: string;
  name: string;
  yearlyPrice: number;
  monthlyPrice: number;
  discount: number;
  description?: string;
  administrations?: string[];
  departmentPrices?: Record<string, { monthly: number; yearly: number }>;
  employeeSeatMonthlyPrice?: number;
  employeeSeatYearlyPrice?: number;
  isActive: boolean;
}

const administrationLabels: Record<string, string> = {
  "admin.dept.real_estate": "sub.dept.properties",
  "admin.dept.offers": "sub.dept.offers",
  "admin.dept.orders": "sub.dept.orders",
  "admin.dept.marketing": "sub.dept.marketing",
  "admin.dept.legal": "sub.dept.legal",
  "admin.dept.finance": "sub.dept.finance",
  "admin.dept.hr": "sub.dept.employees",
};

const ALL_ADMINISTRATIONS = Object.keys(administrationLabels);
const departmentPreviewMap: Record<string, PreviewDepartmentKey> = {
  "admin.dept.real_estate": "properties",
  "admin.dept.offers": "offers",
  "admin.dept.orders": "orders",
  "admin.dept.marketing": "marketing",
  "admin.dept.legal": "legal",
  "admin.dept.finance": "finance",
  "admin.dept.hr": "employees",
};
const emptyGlobalPricing = () => ({
  departmentPrices: ALL_ADMINISTRATIONS.reduce((acc, department) => {
    acc[department] = { monthly: 0, yearly: 0 };
    return acc;
  }, {} as Record<string, { monthly: number; yearly: number }>),
  employeeSeatMonthlyPrice: 0,
  employeeSeatYearlyPrice: 0,
});

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("subscriptions");

  const [impersonatedByAdmin, setImpersonatedByAdmin] = useState<any>(null);
  const [packages, setPackages] = useState<ManagementPackage[]>([]);
  const [globalPricing, setGlobalPricing] = useState(emptyGlobalPricing());
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [planMode, setPlanMode] = useState<"packages" | "custom">("packages");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [employeeSeats, setEmployeeSeats] = useState(0);
  const [subscriptionType, setSubscriptionType] = useState<"شهري" | "سنوي">("شهري");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDepartment, setPreviewDepartment] = useState<PreviewDepartmentKey>("properties");

  useEffect(() => {
    const syncImpersonation = () => {
      try {
        const rawAdmin = localStorage.getItem("impersonatedByAdmin");
        setImpersonatedByAdmin(rawAdmin ? JSON.parse(rawAdmin) : null);
      } catch {
        setImpersonatedByAdmin(null);
      }
    };

    syncImpersonation();
    window.addEventListener("auth-change", syncImpersonation);
    window.addEventListener("storage", syncImpersonation);
    return () => {
      window.removeEventListener("auth-change", syncImpersonation);
      window.removeEventListener("storage", syncImpersonation);
    };
  }, []);

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
      setImpersonatedByAdmin(null);
      router.push("/admin/users");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [packagesRes, mySubsRes, pricingRes] = await Promise.allSettled([
          api.get("/management-packages"),
          subscriptionsApi.findMySubscriptions(),
          api.get("/subscriptions/department-pricing"),
        ]);

        if (packagesRes.status === "fulfilled") {
          setPackages((Array.isArray(packagesRes.value.data) ? packagesRes.value.data : []).filter((pkg: ManagementPackage) => pkg.isActive));
        } else {
          setPackages([]);
        }

        if (mySubsRes.status === "fulfilled") {
          setSubscriptions(Array.isArray(mySubsRes.value.data) ? mySubsRes.value.data : []);
        } else {
          setSubscriptions([]);
        }

        if (pricingRes.status === "fulfilled") {
          const pricingData = pricingRes.value.data || {};
          setGlobalPricing({
            ...emptyGlobalPricing(),
            ...pricingData,
            departmentPrices: {
              ...emptyGlobalPricing().departmentPrices,
              ...(pricingData.departmentPrices || {}),
            },
          });
        } else {
          setGlobalPricing(emptyGlobalPricing());
        }
      } catch (error) {
        console.error("Failed to load public subscriptions:", error);
        toast.error(t("sub.public.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId);
  const isEmployeeDepartmentSelected = selectedDepartments.includes("admin.dept.hr");
  const priceKey = subscriptionType === "سنوي" ? "yearly" : "monthly";
  const getCurrentDepartmentPrice = (department: string) => {
    return Number(globalPricing.departmentPrices?.[department]?.[priceKey] || 0);
  };
  const getCurrentEmployeeSeatPrice = () => {
    return subscriptionType === "سنوي"
      ? Number(globalPricing.employeeSeatYearlyPrice || 0)
      : Number(globalPricing.employeeSeatMonthlyPrice || 0);
  };
  const periodLabel = subscriptionType === "سنوي" ? "سنوي" : "شهري";
  const selectedDepartmentPricing = selectedDepartments.map((department) => ({
    department,
    label: t(administrationLabels[department] || department),
    price: getCurrentDepartmentPrice(department),
  }));
  const employeeSeatTotal = isEmployeeDepartmentSelected
    ? employeeSeats * getCurrentEmployeeSeatPrice()
    : 0;

  const computedAmount = useMemo(() => {
    if (planMode === "packages" && !selectedPackage) return 0;
    if (planMode === "packages") {
      const packagePrice = subscriptionType === "سنوي"
        ? Number(selectedPackage?.yearlyPrice || 0)
        : Number(selectedPackage?.monthlyPrice || 0);
      return packagePrice * (1 - Number(selectedPackage?.discount || 0) / 100);
    }

    const hasDepartmentPricing = selectedDepartments.some((department) => getCurrentDepartmentPrice(department) > 0);
    let basePrice = 0;
    if (hasDepartmentPricing) {
      basePrice = selectedDepartments.reduce((total, department) => total + getCurrentDepartmentPrice(department), 0);
      if (isEmployeeDepartmentSelected) {
        basePrice += employeeSeats * getCurrentEmployeeSeatPrice();
      }
    }
    return basePrice;
  }, [planMode, selectedPackage, subscriptionType, selectedDepartments, employeeSeats, globalPricing]);

  const handleCreate = async () => {
    if (planMode === "packages" && !selectedPackageId) {
      toast.error(t("sub.public.selectPackageFirst"));
      return;
    }
    if (planMode === "custom" && selectedDepartments.length === 0) {
      toast.error("اختر إدارة واحدة على الأقل");
      return;
    }
    if (planMode === "custom" && isEmployeeDepartmentSelected && employeeSeats < 1) {
      toast.error("حدد عدد الموظفين");
      return;
    }

    setCreating(true);
    try {
      const response = await subscriptionsApi.create({
        packageId: planMode === "packages" ? selectedPackageId : undefined,
        subscriptionType,
        amount: computedAmount,
        selectedDepartments: planMode === "custom" ? selectedDepartments : undefined,
        employeeSeats: planMode === "custom" && isEmployeeDepartmentSelected ? employeeSeats : 0,
        startDate,
        paymentMethod: "مدى",
        notes: notes || (planMode === "custom" ? "اشتراك مخصص" : undefined),
      });
      toast.success(t("sub.public.createdRedirect"));
      router.push(`/wallet?subscription=${response.data.id}`);
    } catch (error: any) {
      console.error("Error creating department subscription:", error);
      toast.error(error?.response?.data?.message || t("sub.toast.error"));
    } finally {
      setCreating(false);
    }
  };

  const openDepartmentPreview = (department: PreviewDepartmentKey) => {
    setPreviewDepartment(department);
    setPreviewOpen(true);
  };

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t("subscriptions.management") || "الاشتراكات"} message={message} isAdmin={isAdmin} />;
  }

  return (
    <div className="min-h-screen bg-muted p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-card hover:bg-muted border border-/80 hover:border-slate-300 text-slate-800 px-5 py-2.5 rounded-2xl font-black text-xs transition-all duration-200 shadow-sm active:scale-95"
          >
            <ArrowRight className="w-4 h-4" />
            {t("common.back") || "رجوع"}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-[1rem] border border bg-card p-2 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setPlanMode("packages");
              setSelectedDepartments([]);
              setEmployeeSeats(0);
            }}
            className={`h-12 rounded-2xl text-sm font-black transition-colors ${
              planMode === "packages" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-muted"
            }`}
          >
            الباقات الجاهزة
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanMode("custom");
              setSelectedPackageId("");
              setSelectedDepartments([]);
              setEmployeeSeats(0);
            }}
            className={`h-12 rounded-2xl text-sm font-black transition-colors ${
              planMode === "custom" ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-muted"
            }`}
          >
            اشتراك مخصص
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
          <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              {planMode === "custom" ? <SlidersHorizontal className="w-5 h-5 text-slate-700" /> : <Building2 className="w-5 h-5 text-slate-700" />}
              <h2 className="text-xl font-black text-slate-950">
                {planMode === "custom" ? "تخصيص الاشتراك" : t("sub.public.packagesTitle")}
              </h2>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
              </div>
            ) : packages.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold">{t("sub.public.emptyPackages")}</div>
            ) : planMode === "custom" ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border bg-muted p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-black text-slate-950">أسعار الإدارات</div>
                      <div className="mt-2 text-xs font-bold text-slate-500">اختر الإدارات المطلوبة، وسيتم احتساب السعر حسب مدة الاشتراك.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDepartmentPreview("properties")}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border bg-card px-4 text-sm font-black text-slate-700 transition-colors hover:bg-muted"
                    >
                      <Eye className="h-4 w-4" />
                      استعراض الأقسام
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_ADMINISTRATIONS.map((department) => {
                    const checked = selectedDepartments.includes(department);
                    const monthly = Number(globalPricing.departmentPrices?.[department]?.monthly || 0);
                    const yearly = Number(globalPricing.departmentPrices?.[department]?.yearly || 0);
                    return (
                      <div
                        key={department}
                        onClick={() => {
                          setSelectedDepartments((current) => {
                            const next = checked ? current.filter((item) => item !== department) : [...current, department];
                            if (department === "admin.dept.hr" && checked) setEmployeeSeats(0);
                            return next;
                          });
                        }}
                        className={`cursor-pointer rounded-3xl border p-4 text-right transition-all ${
                          checked ? "border-slate-950 bg-muted shadow-sm" : "border hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-black text-slate-950">{t(administrationLabels[department] || department)}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-black text-slate-600">شهري <SaudiRiyalAmount amount={monthly} locale="ar-SA" iconClassName="h-3 w-3" /></span>
                              <span className="rounded-full bg-card px-3 py-1 text-[11px] font-black text-slate-600">سنوي <SaudiRiyalAmount amount={yearly} locale="ar-SA" iconClassName="h-3 w-3" /></span>
                            </div>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                openDepartmentPreview(departmentPreviewMap[department]);
                              }}
                              className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border bg-card px-3 text-xs font-black text-slate-700 transition-colors hover:bg-muted"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              عرض القسم والخصائص
                            </button>
                          </div>
                          {checked && <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-3xl border border p-5">
                  <div className="text-sm font-black text-slate-950">سعر كل موظف في إدارة الموظفين</div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-xs font-black text-slate-600">
                    <div className="rounded-2xl bg-muted p-3">شهري <SaudiRiyalAmount amount={Number(globalPricing.employeeSeatMonthlyPrice || 0)} locale="ar-SA" iconClassName="h-3 w-3" /></div>
                    <div className="rounded-2xl bg-muted p-3">سنوي <SaudiRiyalAmount amount={Number(globalPricing.employeeSeatYearlyPrice || 0)} locale="ar-SA" iconClassName="h-3 w-3" /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  const currentPrice = subscriptionType === "سنوي" ? Number(pkg.yearlyPrice) : Number(pkg.monthlyPrice);
                  const finalPrice = currentPrice * (1 - Number(pkg.discount || 0) / 100);

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setSelectedDepartments([]);
                        setEmployeeSeats(0);
                      }}
                      className={`cursor-pointer text-right rounded-[1.25rem] border p-5 transition-all ${
                        isSelected ? "border-slate-900 bg-muted shadow-sm" : "border hover:border-slate-300 bg-card"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-black text-slate-950">{pkg.name}</h3>
                          <p className="text-sm text-slate-500 font-bold mt-1">{pkg.description || t("sub.public.packageFallbackDesc")}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {(pkg.administrations || []).map((administration) => (
                          <button
                            key={administration}
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              const previewKey = departmentPreviewMap[administration];
                              if (previewKey) openDepartmentPreview(previewKey);
                            }}
                            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-black text-slate-700 transition-colors hover:bg-muted"
                          >
                            <Eye className="h-3 w-3" />
                            <span>{t(administrationLabels[administration] || administration)}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex items-end gap-2 mb-3">
                        <div className="text-3xl font-black text-slate-950">{finalPrice.toFixed(2)}</div>
                        <div className="text-sm font-bold text-slate-500 pb-1"><SaudiRiyalSymbol iconClassName="h-4 w-4" /></div>
                        {Number(pkg.discount || 0) > 0 && (
                          <div className="text-xs font-black text-emerald-600 pb-1">{t("sub.public.discount")} {Number(pkg.discount)}%</div>
                        )}
                      </div>

                      <div className="text-sm text-slate-500 font-bold">
                        {subscriptionType === "سنوي" ? "سعر الباقة السنوي" : "سعر الباقة الشهري"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-black text-slate-950">{t("sub.public.detailsTitle")}</h2>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">{t("sub.public.duration")}</label>
              <div className="grid grid-cols-2 gap-3">
                {(["شهري", "سنوي"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSubscriptionType(type)}
                    className={`h-12 rounded-xl border text-sm font-black transition-colors ${
                      subscriptionType === type ? "border-slate-900 bg-slate-900 text-white" : "border text-slate-700 hover:bg-muted"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">{t("sub.field.startDate")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 rounded-xl border border px-4 text-sm font-bold outline-none focus:border-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">{t("sub.field.notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[110px] rounded-xl border border px-4 py-3 text-sm font-bold outline-none focus:border-slate-900"
                placeholder={t("sub.public.notesPlaceholder")}
              />
            </div>

            {planMode === "custom" && (
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500">الإدارات المطلوبة</label>
                <div className="space-y-2">
                  {ALL_ADMINISTRATIONS.map((department) => {
                    const checked = selectedDepartments.includes(department);
                    return (
                      <button
                        key={department}
                        type="button"
                        onClick={() => {
                          setSelectedDepartments((current) => {
                            const next = checked ? current.filter((item) => item !== department) : [...current, department];
                            if (department === "admin.dept.hr" && checked) setEmployeeSeats(0);
                            return next;
                          });
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-right transition-colors ${
                          checked ? "border-slate-900 bg-muted" : "border hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-black text-slate-800">{t(administrationLabels[department] || department)}</span>
                          <span className="text-xs font-black text-slate-500">
                            <SaudiRiyalAmount amount={getCurrentDepartmentPrice(department)} locale="ar-SA" iconClassName="h-3 w-3" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {planMode === "custom" && isEmployeeDepartmentSelected && (
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500">عدد الموظفين</label>
                <input
                  type="number"
                  min={1}
                  value={employeeSeats || ""}
                  onChange={(e) => setEmployeeSeats(Math.max(0, Number(e.target.value || 0)))}
                  className="w-full h-12 rounded-xl border border px-4 text-sm font-bold outline-none focus:border-slate-900"
                  placeholder="0"
                />
                <div className="text-xs font-bold text-slate-400">
                  سعر كل موظف: <SaudiRiyalAmount amount={getCurrentEmployeeSeatPrice()} locale="ar-SA" iconClassName="h-3 w-3" />
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-muted border border p-4 space-y-3">
              <div className="text-xs font-black text-slate-500">{t("sub.public.selectedPackage")}</div>
              <div className="text-base font-black text-slate-950">
                {planMode === "custom" ? "اشتراك مخصص" : selectedPackage?.name || t("sub.public.selectFromList")}
              </div>
              <div className="flex flex-wrap gap-2">
                {planMode === "custom"
                  ? selectedDepartments.map((administration) => (
                      <span key={administration} className="px-2.5 py-1 rounded-full bg-card border border text-slate-700 text-[11px] font-black">
                        {t(administrationLabels[administration] || administration)}
                      </span>
                    ))
                  : (selectedPackage?.administrations || []).map((administration) => (
                      <span key={administration} className="px-2.5 py-1 rounded-full bg-card border border text-slate-700 text-[11px] font-black">
                        {t(administrationLabels[administration] || administration)}
                      </span>
                    ))}
              </div>
              {planMode === "custom" && isEmployeeDepartmentSelected && (
                <div className="text-xs font-black text-slate-500">الموظفون: {employeeSeats}</div>
              )}
              {planMode === "custom" && (
                <div className="space-y-2 rounded-2xl border border bg-card p-3">
                  <div className="flex items-center justify-between text-[11px] font-black text-slate-400">
                    <span>تفصيل الأسعار</span>
                    <span>{periodLabel}</span>
                  </div>
                  {selectedDepartmentPricing.length === 0 ? (
                    <div className="rounded-xl bg-muted px-3 py-2 text-xs font-bold text-slate-400">
                      اختر إدارة لعرض السعر
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {selectedDepartmentPricing.map((item) => (
                        <div key={item.department} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                          <span className="text-xs font-black text-slate-700">{item.label}</span>
                          <span className="text-xs font-black text-slate-950"><SaudiRiyalAmount amount={item.price} locale="ar-SA" iconClassName="h-3 w-3" /></span>
                        </div>
                      ))}
                      {isEmployeeDepartmentSelected && (
                        <div className="rounded-xl bg-slate-950 px-3 py-2 text-white">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-black">الموظفون</span>
                            <span className="text-xs font-black"><SaudiRiyalAmount amount={employeeSeatTotal} locale="ar-SA" iconClassName="h-3 w-3 text-white" /></span>
                          </div>
                          <div className="mt-1 text-[11px] font-bold text-white/60">
                            {employeeSeats || 0} × <SaudiRiyalAmount amount={getCurrentEmployeeSeatPrice()} locale="ar-SA" iconClassName="h-3 w-3 text-white/60" /> لكل موظف
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="pt-2 border-t border">
                <div className="text-xs font-black text-slate-500">{t("sub.public.total")}</div>
                <div className="text-3xl font-black text-slate-950"><SaudiRiyalAmount amount={computedAmount} locale="ar-SA" /></div>
                <div className="text-xs font-bold text-slate-400 mt-2">{t("sub.public.afterPayment")}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || (planMode === "packages" && !selectedPackageId)}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {t("sub.public.submit")}
            </button>
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-950 mb-4">{t("sub.public.previousSubscriptions")}</h2>
          {subscriptions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-bold">{t("sub.public.noPreviousSubscriptions")}</div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="rounded-2xl border border px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{sub.managementPackage?.name || "باقة اشتراك"}</div>
                    <div className="text-xs text-slate-500 font-bold mt-1">
                      {sub.subscriptionType} • {new Date(sub.startDate).toLocaleDateString("ar-SA")} • <SaudiRiyalAmount amount={Number(sub.amount || 0)} locale="ar-SA" iconClassName="h-3 w-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-muted text-slate-700 text-[11px] font-black">{sub.status}</span>
                      <button
                        type="button"
                        onClick={() => router.push(`/wallet?subscription=${sub.id}`)}
                        className="h-10 px-4 rounded-xl border border text-slate-700 hover:bg-muted text-sm font-black"
                      >
                      {t("sub.public.viewInWallet")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <DepartmentFeaturePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        initialDepartment={previewDepartment}
      />
    </div>
  );
}
