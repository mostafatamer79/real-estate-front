// app/service-form/page.tsx (updated)
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../../src/components/Header";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';

type ServiceType = "postPurchase" | "legal" | "construction" | "other";

const serviceCategoryMap = {
  postPurchase: 'postPurchase',
  legal: 'legal',
  construction: 'construction',
  other: 'other'
} as const;

export default function ServiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated } = useAuth();
  const serviceType = (searchParams.get("type") || "postPurchase") as ServiceType;

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    city: "",
    district: "",
    service: "",
    quantity: "",
    description: "",
    termsAccepted: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const serviceOptions = {
    postPurchase: [
      "الغاز",
      "نقل وتركيب الأثاث",
      "التأمين على المنزل",
      "الصيانة (سباكة / كهرباء)",
      "خدمة التنظيف",
      "تنسيق حدائق",
      "أنظمة أمنية",
    ],
    legal: [
      "التوثيق ونقل الملكية",
      "تحديث الصكوك",
      "حل المنازعات العقارية",
      "صياغة ومراجعة العقود العقارية",
      "تقديم الاستشارات العقارية",
    ],
    construction: [
      "مقاول عظم",
      "تصميم هندسي",
      "تشطيبات",
      "كهرباء",
      "سباكة",
      "نجارة",
      "دهانات",
      "ألمنيوم",
      "إشراف هندسي",
      "تصميم داخلي",
    ],
    other: [
      "التقييم العقاري",
      "المسح الهندسي",
      "تقرير عن الحي"
    ],
  };

  const serviceTitles = {
    postPurchase: "خدمات ما بعد الشراء",
    legal: "الخدمات القانونية",
    construction: "أعمال البناء",
    other: "خدمات أخرى",
  };

  // Pre-fill user data if logged in
  useEffect(() => {
    if (user && isAuthenticated) {
      setFormData(prev => ({
        ...prev,
        name: user.firstName && user.lastName 
          ? `${user.firstName} ${user.lastName}`
          : prev.name,
        phone: user.phone || prev.phone,
        city: user.city || prev.city,
      }));
    }
  }, [user, isAuthenticated]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError("");
  };

  const handleSubmit = async () => {
    if (!formData.termsAccepted) {
      setError("يجب الموافقة على الشروط والأحكام");
      return;
    }

    if (!isFormValid) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const requestData = {
        category: serviceCategoryMap[serviceType],
        serviceType: formData.service,
        clientName: formData.name,
        phone: formData.phone,
        city: formData.city,
        district: formData.district,
        quantity: parseInt(formData.quantity),
        description: formData.description || undefined,
        userId: user?.id || undefined,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is logged in
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-requests`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إرسال الطلب');
      }

      setSuccess(`تم إرسال طلبك بنجاح (${serviceTitles[serviceType]})، سيتم التواصل معك قريباً`);
      
      // Reset form
      setFormData({
        name: "",
        phone: "",
        city: "",
        district: "",
        service: "",
        quantity: "",
        description: "",
        termsAccepted: false,
      });

      // Redirect to service requests page if logged in
      if (isAuthenticated) {
        setTimeout(() => {
          router.push('/services');
        }, 2000);
      }

    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.name.trim() &&
    formData.phone.trim() &&
    formData.city.trim() &&
    formData.district.trim() &&
    formData.service.trim() &&
    formData.quantity.trim() &&
    formData.termsAccepted;

  return (
    <section className="w-full min-h-screen bg-slate-950 text-white flex flex-col" dir="rtl">
      <Header />

      {/* Navigation Arrows */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 mt-6">
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/services")}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للخدمات
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            {serviceTitles[serviceType]}
          </h1>
          <p className="text-gray-400 text-center text-sm sm:text-base">
            املأ النموذج أدناه لطلب الخدمة
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 text-center">{success}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 mb-2 block text-right">
                الاسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="أدخل الاسم"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-gray-300 mb-2 block text-right">
                رقم الجوال <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="أدخل رقم الجوال"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 mb-2 block text-right">
                المدينة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="أدخل المدينة"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-gray-300 mb-2 block text-right">
                الحي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                placeholder="أدخل الحي"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-300 mb-2 block text-right">
                الخدمة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.service}
                onChange={(e) => handleInputChange("service", e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-400 transition-colors"
              >
                <option value="" disabled>اختر الخدمة</option>
                {serviceOptions[serviceType].map((service, index) => (
                  <option key={index} value={service}>{service}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-300 mb-2 block text-right">
                العدد المطلوب <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="أدخل العدد"
                min="1"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-300 mb-2 block text-right">الوصف</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="أدخل الوصف (اختياري)"
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-sm sm:text-base text-gray-300">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500"
              />
              <span>
                أقرّ بأنّي اطلعت على الشروط والأحكام وأوافق عليها
              </span>
            </label>
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              سيتم إدراج فاتورة هذه الخدمة في قسم المحفظة فور إتمام الطلب
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <button
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
              className={`w-full max-w-md rounded-lg px-6 py-3 font-semibold transition-all flex items-center justify-center gap-2 ${
                isFormValid && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الطلب"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}