"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Eye, Loader2, Shield, Wallet } from "lucide-react";
import toast from "react-hot-toast";
import api, { subscriptionsApi } from "@/lib/api";
import DepartmentFeaturePreviewDialog, { PreviewDepartmentKey } from "@/components/subscriptions/DepartmentFeaturePreviewDialog";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

type DeptSlug = "properties" | "offers" | "orders" | "finance" | "employees";

interface ManagementPackage {
  id: string;
  name: string;
  yearlyPrice: number;
  monthlyPrice: number;
  discount: number;
  description?: string;
  features?: string[];
  administrations?: string[];
  isActive: boolean;
}

interface SubscriptionRecord {
  id: string;
  departmentSlug?: string;
  subscriptionType: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  managementPackage?: {
    id: string;
    name: string;
  };
}

const DEPT_TO_PACKAGE_ADMIN: Record<DeptSlug, string> = {
  properties: "admin.dept.real_estate",
  offers: "admin.dept.offers",
  orders: "admin.dept.orders",
  finance: "admin.dept.finance",
  employees: "admin.dept.hr",
};

const DEPT_LABELS: Record<DeptSlug, string> = {
  properties: "إدارة الاشتراكات",
  offers: "اشتراكات إدارة العروض",
  orders: "اشتراكات إدارة الطلبات",
  finance: "اشتراكات الإدارة المالية",
  employees: "اشتراكات إدارة الموظفين",
};

const DEPT_TO_PREVIEW: Record<DeptSlug, PreviewDepartmentKey> = {
  properties: "properties",
  offers: "offers",
  orders: "orders",
  finance: "finance",
  employees: "employees",
};

export default function DepartmentSubscriptionsPage({ deptSlug }: { deptSlug: DeptSlug }) {
  const router = useRouter();
  const [packages, setPackages] = useState<ManagementPackage[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formData, setFormData] = useState({
    packageId: "",
    subscriptionType: "شهري",
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [packagesRes, subsRes] = await Promise.all([
        api.get("/management-packages"),
        subscriptionsApi.findMySubscriptions(),
      ]);
      setPackages(Array.isArray(packagesRes.data) ? packagesRes.data : []);
      const mySubs = Array.isArray(subsRes.data) ? subsRes.data : [];
      setSubscriptions(mySubs.filter((sub: SubscriptionRecord) => sub.departmentSlug === deptSlug));
    } catch (error) {
      console.error("Failed to load department subscriptions:", error);
      toast.error("تعذر تحميل بيانات الاشتراكات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [deptSlug]);

  const availablePackages = useMemo(() => {
    const adminKey = DEPT_TO_PACKAGE_ADMIN[deptSlug];
    return packages.filter((pkg) => {
      if (!pkg.isActive) return false;
      if (!Array.isArray(pkg.administrations) || pkg.administrations.length === 0) return true;
      return pkg.administrations.includes(adminKey);
    });
  }, [deptSlug, packages]);

  const selectedPackage = availablePackages.find((pkg) => pkg.id === formData.packageId);
  const computedAmount = selectedPackage
    ? Number(formData.subscriptionType === "سنوي" ? selectedPackage.yearlyPrice : selectedPackage.monthlyPrice) *
        (1 - Number(selectedPackage.discount || 0) / 100)
    : 0;

  const handleCreate = async () => {
    if (!formData.packageId) {
      toast.error("اختر الباقة أولاً");
      return;
    }

    setCreating(true);
    try {
      const response = await subscriptionsApi.create({
        packageId: formData.packageId,
        departmentSlug: deptSlug,
        subscriptionType: formData.subscriptionType,
        amount: computedAmount,
        startDate: formData.startDate,
        paymentMethod: "مدى",
        notes: formData.notes || undefined,
      });

      toast.success("تم إنشاء الاشتراك وتحويلك إلى المحفظة");
      await fetchData();
      router.push(`/wallet?subscription=${response.data.id}`);
    } catch (error: any) {
      console.error("Failed to create department subscription:", error);
      toast.error(error?.response?.data?.message || "فشل إنشاء الاشتراك");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted text-slate-700 px-3 py-1 text-[11px] font-black">
              <Shield className="w-4 h-4" />
              {DEPT_LABELS[deptSlug]}
            </div>
            <h1 className="text-2xl font-black text-slate-950">الباقات المتاحة</h1>
            <p className="text-sm font-bold text-slate-500">اختر باقة الإدارة ثم أكمل الدفع من المحفظة، ويمكنك استعراض خصائص القسم بدون إنشاء أي بيانات.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="h-11 px-4 rounded-xl border border text-slate-700 hover:bg-muted transition-colors text-sm font-black flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              معاينة القسم
            </button>
            <button
              onClick={() => router.push("/wallet")}
              className="h-11 px-4 rounded-xl border border text-slate-700 hover:bg-muted transition-colors text-sm font-black flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              المحفظة
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.9fr] gap-6">
        <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6">
          <h2 className="text-lg font-black text-slate-950 mb-5">اختر الباقة</h2>
          {loading ? (
            <div className="py-14 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-700" /></div>
          ) : availablePackages.length === 0 ? (
            <div className="py-14 text-center text-slate-400 font-bold">لا توجد باقات مفعلة لهذه الإدارة</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePackages.map((pkg) => {
                const isSelected = pkg.id === formData.packageId;
                const amount = Number(formData.subscriptionType === "سنوي" ? pkg.yearlyPrice : pkg.monthlyPrice) *
                  (1 - Number(pkg.discount || 0) / 100);
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, packageId: pkg.id }))}
                    className={`text-right rounded-3xl border p-5 transition-all ${
                      isSelected ? "border-slate-900 bg-muted shadow-sm" : "border hover:border-slate-300 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-black text-slate-950">{pkg.name}</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1">{pkg.description || "باقة اشتراك داخلية"}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-slate-900 shrink-0" />}
                    </div>
                    <div className="text-2xl font-black text-slate-900 mb-3"><SaudiRiyalAmount amount={amount} locale="ar-SA" /></div>
                    <div className="space-y-2">
                      {(pkg.features || []).slice(0, 4).map((feature, index) => (
                        <div key={index} className="text-sm text-slate-600 font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-black text-slate-950">تفاصيل الاشتراك</h2>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500">نوع الاشتراك</label>
            <div className="grid grid-cols-2 gap-3">
              {["شهري", "سنوي"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, subscriptionType: type }))}
                  className={`h-12 rounded-xl border text-sm font-black transition-colors ${
                    formData.subscriptionType === type
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border text-slate-700 hover:bg-muted"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500">تاريخ البداية</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full h-12 rounded-xl border border px-4 text-sm font-bold outline-none focus:border-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500">ملاحظات</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              className="w-full min-h-[110px] rounded-xl border border px-4 py-3 text-sm font-bold outline-none focus:border-slate-900"
              placeholder="أي تفاصيل إضافية للاشتراك"
            />
          </div>

          <div className="rounded-2xl bg-muted border border p-4 space-y-2">
            <div className="text-xs font-black text-slate-500">الإجمالي الحالي</div>
            <div className="text-3xl font-black text-slate-950"><SaudiRiyalAmount amount={computedAmount} locale="ar-SA" /></div>
            <div className="text-xs font-bold text-slate-400">سيتم إنشاء الاشتراك بحالة معلّق ثم تحويلك إلى المحفظة لإتمام الدفع.</div>
          </div>

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !formData.packageId}
            className="w-full h-12 rounded-xl bg-slate-900 text-white font-black text-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            اشترك وانتقل للدفع
          </button>
        </div>
      </div>

      <div className="rounded-[1.25rem] bg-card border border shadow-sm p-6">
        <h2 className="text-lg font-black text-slate-950 mb-4">اشتراكاتي في هذه الإدارة</h2>
        {subscriptions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 font-bold">لا توجد اشتراكات سابقة لهذه الإدارة</div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="rounded-2xl border border bg-muted px-4 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-black text-slate-950">{sub.managementPackage?.name || "باقة اشتراك"}</div>
                  <div className="text-xs font-bold text-slate-500 mt-1">
                    {sub.subscriptionType} • {new Date(sub.startDate).toLocaleDateString("ar-SA")} • <SaudiRiyalAmount amount={Number(sub.amount || 0)} locale="ar-SA" iconClassName="h-3 w-3" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-black ${
                    sub.status === "نشط" ? "bg-emerald-100 text-emerald-700" : sub.status === "معلق" ? "bg-amber-100 text-amber-700" : "bg-muted text-slate-700"
                  }`}>
                    {sub.status}
                  </span>
                  {sub.status === "معلق" && (
                    <button
                      onClick={() => router.push(`/wallet?subscription=${sub.id}`)}
                      className="h-10 px-4 rounded-xl border border hover:bg-card text-slate-700 text-xs font-black"
                    >
                      متابعة الدفع
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DepartmentFeaturePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        initialDepartment={DEPT_TO_PREVIEW[deptSlug]}
      />
    </div>
  );
}
