"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, CreditCard, Loader2, Shield } from "lucide-react";
import toast from "react-hot-toast";
import api, { subscriptionsApi } from "@/lib/api";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import { useLanguage } from "@/context/LanguageContext";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";

interface ManagementPackage {
  id: string;
  name: string;
  yearlyPrice: number;
  monthlyPrice: number;
  discount: number;
  description?: string;
  administrations?: string[];
  isActive: boolean;
}

const administrationLabels: Record<string, string> = {
  "admin.dept.real_estate": "sub.dept.properties",
  "admin.dept.marketing": "sub.dept.marketing",
  "admin.dept.legal": "sub.dept.legal",
  "admin.dept.finance": "sub.dept.finance",
  "admin.dept.hr": "sub.dept.employees",
};

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { isOpen, message, isAdmin } = useSectionGuard("subscriptions");

  const [packages, setPackages] = useState<ManagementPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [subscriptionType, setSubscriptionType] = useState<"شهري" | "سنوي">("شهري");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [packagesRes, mySubsRes] = await Promise.all([
          api.get("/management-packages"),
          subscriptionsApi.findMySubscriptions().catch(() => ({ data: [] as any[] })),
        ]);
        setPackages((Array.isArray(packagesRes.data) ? packagesRes.data : []).filter((pkg: ManagementPackage) => pkg.isActive));
        setSubscriptions(Array.isArray(mySubsRes.data) ? mySubsRes.data : []);
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

  const computedAmount = useMemo(() => {
    if (!selectedPackage) return 0;
    const basePrice = subscriptionType === "سنوي" ? Number(selectedPackage.yearlyPrice) : Number(selectedPackage.monthlyPrice);
    return basePrice * (1 - Number(selectedPackage.discount || 0) / 100);
  }, [selectedPackage, subscriptionType]);

  const handleCreate = async () => {
    if (!selectedPackageId) {
      toast.error(t("sub.public.selectPackageFirst"));
      return;
    }

    setCreating(true);
    try {
      const response = await subscriptionsApi.create({
        packageId: selectedPackageId,
        subscriptionType,
        amount: computedAmount,
        startDate,
        paymentMethod: "مدى",
        notes: notes || undefined,
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

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t("subscriptions.management") || "الاشتراكات"} message={message} isAdmin={isAdmin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-[2rem] bg-slate-950 text-white p-8 border border-slate-800 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black">
                <Shield className="w-4 h-4" />
                {t("sub.public.badge")}
              </div>
              <h1 className="text-3xl font-black">{t("sub.public.heroTitle")}</h1>
              <p className="text-sm text-white/70 font-bold max-w-3xl">
                {t("sub.public.heroDesc")}
              </p>
            </div>
            <button
              onClick={() => router.push("/wallet")}
              className="h-12 px-5 rounded-2xl bg-white text-slate-950 font-black text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              {t("action.wallet")}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.8fr] gap-6">
          <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-5 h-5 text-slate-700" />
              <h2 className="text-xl font-black text-slate-950">{t("sub.public.packagesTitle")}</h2>
            </div>

            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
              </div>
            ) : packages.length === 0 ? (
              <div className="py-16 text-center text-slate-400 font-bold">{t("sub.public.emptyPackages")}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackageId;
                  const currentPrice = subscriptionType === "سنوي" ? Number(pkg.yearlyPrice) : Number(pkg.monthlyPrice);
                  const finalPrice = currentPrice * (1 - Number(pkg.discount || 0) / 100);

                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`text-right rounded-[1.75rem] border p-5 transition-all ${
                        isSelected ? "border-slate-900 bg-slate-50 shadow-sm" : "border-slate-100 hover:border-slate-300 bg-white"
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
                          <span key={administration} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black">
                            {t(administrationLabels[administration] || administration)}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-end gap-2 mb-3">
                        <div className="text-3xl font-black text-slate-950">{finalPrice.toFixed(2)}</div>
                        <div className="text-sm font-bold text-slate-500 pb-1">ر.س</div>
                        {Number(pkg.discount || 0) > 0 && (
                          <div className="text-xs font-black text-emerald-600 pb-1">{t("sub.public.discount")} {Number(pkg.discount)}%</div>
                        )}
                      </div>

                      <div className="text-sm text-slate-500 font-bold">
                        {t("sub.public.departmentsOnly")}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6 space-y-5">
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
                      subscriptionType === type ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"
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
                className="w-full h-12 rounded-xl border border-slate-200 px-4 text-sm font-bold outline-none focus:border-slate-900"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500">{t("sub.field.notes")}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[110px] rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-900"
                placeholder={t("sub.public.notesPlaceholder")}
              />
            </div>

            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-3">
              <div className="text-xs font-black text-slate-500">{t("sub.public.selectedPackage")}</div>
              <div className="text-base font-black text-slate-950">{selectedPackage?.name || t("sub.public.selectFromList")}</div>
              <div className="flex flex-wrap gap-2">
                {(selectedPackage?.administrations || []).map((administration) => (
                  <span key={administration} className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-[11px] font-black">
                    {t(administrationLabels[administration] || administration)}
                  </span>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-black text-slate-500">{t("sub.public.total")}</div>
                <div className="text-3xl font-black text-slate-950">{computedAmount.toFixed(2)} ر.س</div>
                <div className="text-xs font-bold text-slate-400 mt-2">{t("sub.public.afterPayment")}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !selectedPackageId}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {t("sub.public.submit")}
            </button>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-950 mb-4">{t("sub.public.previousSubscriptions")}</h2>
          {subscriptions.length === 0 ? (
            <div className="py-10 text-center text-slate-400 font-bold">{t("sub.public.noPreviousSubscriptions")}</div>
          ) : (
            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="rounded-2xl border border-slate-100 px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-slate-950">{sub.managementPackage?.name || "باقة اشتراك"}</div>
                    <div className="text-xs text-slate-500 font-bold mt-1">
                      {sub.subscriptionType} • {new Date(sub.startDate).toLocaleDateString("ar-SA")} • {sub.amount} ر.س
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black">{sub.status}</span>
                      <button
                        type="button"
                        onClick={() => router.push(`/wallet?subscription=${sub.id}`)}
                        className="h-10 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-black"
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
    </div>
  );
}
