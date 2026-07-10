"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useOffers } from "@/hooks/useOffers";
import { Role } from "@/types/user";

interface FormState {
  propertyType: string;
  area: string;
  propertyAge: string;
  direction: string;
  price: string;
  city: string;
  neighborhood: string;
  deedType: string;
  propertyCondition: string;
  additionalNotes: string;
}

const initialForm: FormState = {
  propertyType: "",
  area: "",
  propertyAge: "",
  direction: "",
  price: "",
  city: "",
  neighborhood: "",
  deedType: "",
  propertyCondition: "",
  additionalNotes: "",
};

const allowedRoles = new Set<string>([
  Role.AGENT,
  Role.BROKER,
  Role.REAL_ESTATE_OFFICE,
  Role.OWNER,
  Role.ADMIN,
  Role.MARKETING,
  Role.MARKETING_ADMIN,
]);

export default function NewOfferPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { user, token } = useAuth();
  const { createOffer, loading } = useOffers();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string>("");

  const isArabic = language === "ar";
  const canCreate = useMemo(() => {
    const role = String(user?.role || "").toLowerCase();
    return token && allowedRoles.has(role);
  }, [token, user?.role]);

  const onChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!canCreate) {
      setError(isArabic ? "ليست لديك صلاحية إنشاء عرض." : "You are not allowed to create offers.");
      return;
    }

    if (!form.propertyType || !form.area || !form.price || !form.city || !form.neighborhood || !form.propertyAge || !form.direction || !form.deedType || !form.propertyCondition) {
      setError(isArabic ? "يرجى تعبئة جميع الحقول المطلوبة." : "Please fill in all required fields.");
      return;
    }

    try {
      const created = await createOffer({
        propertyType: form.propertyType,
        area: Number(form.area),
        propertyAge: form.propertyAge,
        direction: form.direction,
        price: Number(form.price),
        city: form.city,
        neighborhood: form.neighborhood,
        deedType: form.deedType,
        propertyCondition: form.propertyCondition,
        additionalNotes: form.additionalNotes || undefined,
      });

      router.push(`/offers/${created.id}`);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;
      setError(message || (isArabic ? "فشل إنشاء العرض." : "Failed to create offer."));
    }
  };

  return (
    <section className="min-h-screen bg-muted py-10" dir={isArabic ? "rtl" : "ltr"}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => router.push("/offers")}
          className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowRight className={`w-4 h-4 ${!isArabic ? "rotate-180" : ""}`} />
          {isArabic ? "العودة إلى العروض" : "Back to offers"}
        </button>

        <div className="bg-card border border rounded-2xl p-6 sm:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isArabic ? "إنشاء عرض جديد" : "Create New Offer"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {isArabic ? "أدخل البيانات الأساسية لنشر العرض العقاري." : "Fill the required data to publish your property offer."}
          </p>

          {!canCreate && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">
              {isArabic ? "هذه الصفحة متاحة للوكيل/الوسيط والأدوار الإدارية فقط." : "This page is available to agents/brokers and admin roles only."}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm text-gray-700">
              {isArabic ? "نوع العقار" : "Property Type"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.propertyType} onChange={(e) => onChange("propertyType", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "المساحة" : "Area"} *
              <input type="number" min="1" className="mt-1 w-full border rounded-lg px-3 py-2" value={form.area} onChange={(e) => onChange("area", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "السعر" : "Price"} *
              <input type="number" min="1" className="mt-1 w-full border rounded-lg px-3 py-2" value={form.price} onChange={(e) => onChange("price", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "المدينة" : "City"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.city} onChange={(e) => onChange("city", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "الحي" : "Neighborhood"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.neighborhood} onChange={(e) => onChange("neighborhood", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "عمر العقار" : "Property Age"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.propertyAge} onChange={(e) => onChange("propertyAge", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "الاتجاه" : "Direction"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.direction} onChange={(e) => onChange("direction", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700">
              {isArabic ? "نوع الصك" : "Deed Type"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.deedType} onChange={(e) => onChange("deedType", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700 sm:col-span-2">
              {isArabic ? "حالة العقار" : "Property Condition"} *
              <input className="mt-1 w-full border rounded-lg px-3 py-2" value={form.propertyCondition} onChange={(e) => onChange("propertyCondition", e.target.value)} />
            </label>

            <label className="text-sm text-gray-700 sm:col-span-2">
              {isArabic ? "ملاحظات إضافية" : "Additional Notes"}
              <textarea className="mt-1 w-full border rounded-lg px-3 py-2 min-h-24" value={form.additionalNotes} onChange={(e) => onChange("additionalNotes", e.target.value)} />
            </label>

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={loading || !canCreate}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isArabic ? "حفظ العرض" : "Save Offer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
