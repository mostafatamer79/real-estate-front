// app/complete-profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, User, Shield, MapPin, FileText, ArrowLeft } from 'lucide-react';
import { Role } from '@/types/user';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading, isAuthenticated, updateUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: Role.USER,
    agentLicenseNumber: '',
    address: '',
    city: 'الرياض',
    country: 'السعودية',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (user) {
      // Pre-fill form with existing data
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || Role.USER,
        agentLicenseNumber: user.agentLicenseNumber || '',
        address: user.address || '',
        city: user.city || 'الرياض',
        country: user.country || 'السعودية',
      });
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

    // Validate required fields
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrors({ general: 'الاسم الأول والاسم الأخير مطلوبان' });
      setIsSaving(false);
      return;
    }

    if (formData.role === Role.AGENT && !formData.agentLicenseNumber.trim()) {
      setErrors({ agentLicenseNumber: 'رقم الرخصة المهنية مطلوب للوكلاء' });
      setIsSaving(false);
      return;
    }

    try {
        console.log(token)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تحديث الملف الشخصي');
      }

      // Update local storage with new user data
      updateUser(data);
      
      // Show success message
      alert('تم تحديث الملف الشخصي بنجاح!');
      
      // Redirect to details page
      router.push('/details');

    } catch (err: any) {
      console.error('Update error:', err);
      setErrors({ general: err.message || 'فشل تحديث الملف الشخصي' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          رجوع
        </button>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">إكمال الملف الشخصي</h1>
          <p className="text-white/60">
            يرجى إكمال بياناتك الشخصية للمتابعة
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-center">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5" />
                المعلومات الشخصية
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    الاسم الأول *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="أدخل الاسم الأول"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    الاسم الأخير *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="أدخل الاسم الأخير"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                نوع الحساب
              </h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  اختر نوع الحساب
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none appearance-none"
                >
                  <option value={Role.USER}>مستخدم</option>
                  <option value={Role.AGENT}>مقدم الخدمة</option>
                </select>
                <p className="mt-2 text-sm text-white/60">
                  {formData.role === Role.AGENT 
                    ? 'يحتاج الوكلاء إلى ترخيص مهني للتحقق'
                    
                    : 'يمكن للمستخدمين حجز الخدمات'}
                </p>
              </div>

              {/* Agent License Number (only for AGENT role) */}
              {formData.role === Role.AGENT && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    رقم الرخصة المهنية *
                  </label>
                  <input
                    type="text"
                    name="agentLicenseNumber"
                    value={formData.agentLicenseNumber}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 bg-slate-700/50 border ${errors.agentLicenseNumber ? 'border-red-500' : 'border-slate-600'} rounded-lg focus:border-blue-500 focus:outline-none`}
                    placeholder="أدخل رقم الرخصة المهنية"
                    required
                  />
                  {errors.agentLicenseNumber && (
                    <p className="mt-2 text-sm text-red-400">{errors.agentLicenseNumber}</p>
                  )}
                  <p className="mt-2 text-sm text-white/60">
                    سيتم التحقق من رخصتك من قبل فريقنا خلال ٢٤-٤٨ ساعة
                  </p>
                </div>
              )}
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                الموقع
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    العنوان
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                    placeholder="أدخل عنوانك"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    المدينة
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="مكة">مكة</option>
                    <option value="المدينة">المدينة</option>
                    <option value="الطائف">الطائف</option>
                    <option value="أبها">أبها</option>
                    <option value="حائل">حائل</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    الدولة
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="السعودية">السعودية</option>
                    <option value="الإمارات">الإمارات</option>
                    <option value="الكويت">الكويت</option>
                    <option value="قطر">قطر</option>
                    <option value="عمان">عمان</option>
                    <option value="البحرين">البحرين</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    حفظ وإكمال الملف الشخصي
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}