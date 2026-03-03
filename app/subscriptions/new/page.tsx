"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { subscriptionsApi, propertiesApi } from "@/lib/api";

interface Property {
  id: string;
  name: string;
  type: string;
}

interface Unit {
  id: string;
  unitNumber: string;
  type: string;
  propertyId?: string;
}

interface CreateSubscriptionData {
  propertyId?: string;
  unitId?: string;
  subscriptionType: string;
  customPeriodMonths?: number;
  amount: number;
  startDate: string;
  paymentMethod: string;
  notes?: string;
  paymentReference?: string;
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [formData, setFormData] = useState<CreateSubscriptionData>({
    subscriptionType: "سنوي",
    amount: 0,
    startDate: new Date().toISOString().split("T")[0],
    paymentMethod: "مدى",
  });

  const subscriptionTypes = [
    { value: "سنوي", label: "سنوي (12 شهر)" },
    { value: "شهري", label: "شهري" },
    { value: "مخصص", label: "مخصص" },
  ];

  const paymentMethods = [
    { value: "بطاقة ائتمان", label: "بطاقة ائتمان" },
    { value: "تحويل بنكي", label: "تحويل بنكي" },
    { value: "نقدي", label: "نقدي" },
    { value: "مدى", label: "مدى" },
    { value: "Apple Pay", label: "Apple Pay" },
    { value: "STC Pay", label: "STC Pay" },
  ];

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      fetchUnits(selectedProperty);
    } else {
      setUnits([]);
    }
  }, [selectedProperty]);

  const fetchProperties = async () => {
    try {
      const response = await propertiesApi.findAll();
      setProperties(response.data);
    } catch (error) {
      console.error("Error fetching properties:", error);
    }
  };

  const fetchUnits = async (propertyId: string) => {
    try {
      const response = await propertiesApi.getUnits(propertyId);
      setUnits(response.data);
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  const calculateEndDate = () => {
    const start = new Date(formData.startDate);
    const end = new Date(start);

    switch (formData.subscriptionType) {
      case "سنوي":
        end.setFullYear(end.getFullYear() + 1);
        break;
      case "شهري":
        end.setMonth(end.getMonth() + 1);
        break;
      case "مخصص":
        if (formData.customPeriodMonths) {
          end.setMonth(end.getMonth() + formData.customPeriodMonths);
        }
        break;
    }

    return end.toLocaleDateString("ar-SA");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await subscriptionsApi.create(formData);
      alert("تم إنشاء الاشتراك بنجاح");
      router.push("/buildingmanagement/properties");
    } catch (error) {
      console.error("Error creating subscription:", error);
      alert("حدث خطأ أثناء إنشاء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            اشتراك عقار جديد
          </h1>
          <p className="text-gray-600 mb-8">
            إنشاء اشتراك لعقار أو وحدة في إدارة الأملاك
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اختر العقار *
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => {
                  setSelectedProperty(e.target.value);
                  setFormData({
                    ...formData,
                    propertyId: e.target.value,
                    unitId: undefined,
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">اختر العقار</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} ({property.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Selection (Optional) */}
            {selectedProperty && units.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر الوحدة (اختياري)
                </label>
                <select
                  value={formData.unitId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, unitId: e.target.value || undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">اشتراك للعقار بالكامل</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      وحدة {unit.unitNumber} ({unit.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  اترك فارغاً للاشتراك في العقار بالكامل
                </p>
              </div>
            )}

            {/* Subscription Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الاشتراك *
              </label>
              <select
                value={formData.subscriptionType}
                onChange={(e) =>
                  setFormData({ ...formData, subscriptionType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {subscriptionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Period */}
            {formData.subscriptionType === "مخصص" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدة بالأشهر *
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.customPeriodMonths || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customPeriodMonths: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="عدد الأشهر"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                قيمة الاشتراك (ريال) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Date Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ النهاية (تلقائي)
                </label>
                <input
                  type="text"
                  value={calculateEndDate()}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-slate-100 text-gray-700"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                طريقة الدفع *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({ ...formData, paymentMethod: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم المرجع (اختياري)
              </label>
              <input
                type="text"
                value={formData.paymentReference || ""}
                onChange={(e) =>
                  setFormData({ ...formData, paymentReference: e.target.value })
                }
                placeholder="رقم الفاتورة أو المرجع"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ملاحظات (اختياري)
              </label>
              <textarea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="أي ملاحظات إضافية..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-slate-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "جاري الإنشاء..." : "إنشاء اشتراك"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-slate-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
