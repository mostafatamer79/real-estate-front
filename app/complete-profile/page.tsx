// app/complete-profile/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Save, User, Shield, MapPin, ArrowRight, CheckCircle2, Building2, Globe } from 'lucide-react';
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
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrors({});

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

      updateUser(data);
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
        <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-200 relative overflow-hidden font-sans" dir="rtl">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
            <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">العودة للرئيسية</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Title & Info */}
            <div className="lg:col-span-4 space-y-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        إكمال الملف الشخصي
                    </h1>
                    <p className="text-slate-400 leading-relaxed">
                        قم بتحديث بياناتك للحصول على تجربة مخصصة والوصول إلى كافة المميزات.
                    </p>
                </div>
                
                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">هويتك الرقمية</h3>
                            <p className="text-sm text-slate-400 mt-1">تأكد من صحة بياناتك لسهولة التواصل والتوثيق.</p>
                        </div>
                    </div>
                    <div className="w-full h-px bg-slate-800"></div>
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">حساب موثوق</h3>
                            <p className="text-sm text-slate-400 mt-1">البيانات الصحيحة تزيد من موثوقية حسابك لدى العملاء.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Form */}
            <div className="lg:col-span-8">
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                     {/* Glass effect highlight */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"></div>

                    {errors.general && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                           {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Personal Info Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <User className="w-5 h-5 text-blue-400" />
                                المعلومات الشخصية
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">الاسم الأول</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-600"
                                        placeholder="الاسم الأول"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">الاسم الأخير</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none placeholder:text-slate-600"
                                        placeholder="الاسم الأخير"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <Shield className="w-5 h-5 text-purple-400" />
                                نوع الحساب
                            </h2>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.USER ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.USER}
                                            checked={formData.role === Role.USER}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.USER ? 'border-blue-500' : 'border-slate-500'}`}>
                                                {formData.role === Role.USER && <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.USER ? 'text-blue-400' : 'text-slate-400'}`}>مستخدم</span>
                                        </div>
                                    </label>

                                    <label className={`relative cursor-pointer rounded-xl p-4 border transition-all ${formData.role === Role.AGENT ? 'bg-purple-600/10 border-purple-500' : 'bg-slate-950/50 border-slate-700 hover:border-slate-600'}`}>
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={Role.AGENT}
                                            checked={formData.role === Role.AGENT}
                                            onChange={handleChange}
                                            className="absolute opacity-0 w-full h-full inset-0 cursor-pointer"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.role === Role.AGENT ? 'border-purple-500' : 'border-slate-500'}`}>
                                                 {formData.role === Role.AGENT && <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>}
                                            </div>
                                            <span className={`font-medium ${formData.role === Role.AGENT ? 'text-purple-400' : 'text-slate-400'}`}>مقدم خدمة</span>
                                        </div>
                                    </label>
                                </div>

                                {formData.role === Role.AGENT && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-medium text-slate-300 mb-2 block">رقم الرخصة المهنية</label>
                                        <input
                                            type="text"
                                            name="agentLicenseNumber"
                                            value={formData.agentLicenseNumber}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none placeholder:text-slate-600"
                                            placeholder="أدخل رقم الرخصة (مطلوب)"
                                        />
                                         <p className="text-xs text-purple-400/80 mt-2 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            سيتم التحقق من الوثائق خلال 24 ساعة
                                         </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="space-y-4">
                             <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                                <MapPin className="w-5 h-5 text-emerald-400" />
                                الموقع الجغرافي
                            </h2>
                            <div className="space-y-4">
                                 <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">العنوان</label>
                                    <div className="relative">
                                        <Building2 className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                                        <input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none placeholder:text-slate-600"
                                            placeholder="العنوان ومكان الإقامة"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">المدينة</label>
                                        <select
                                            name="city"
                                            value={formData.city}
                                            onChange={handleChange}
                                            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                        >
                                            {['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الطائف', 'أبها', 'حائل'].map(c => (
                                                <option key={c} value={c} className="bg-slate-900">{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-300">الدولة</label>
                                        <div className="relative">
                                             <Globe className="absolute right-4 top-3.5 w-5 h-5 text-slate-500" />
                                            <select
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl pr-12 pl-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none appearance-none"
                                            >
                                                {['السعودية', 'الإمارات', 'الكويت', 'قطر', 'عمان', 'البحرين'].map(c => (
                                                    <option key={c} value={c} className="bg-slate-900">{c}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 p-px focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex h-full w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-4 text-sm font-bold text-white transition-all group-hover:bg-transparent group-hover:from-blue-600/90 group-hover:to-blue-500/90">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            جاري المعالجة...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            حفظ التغييرات
                                        </>
                                    )}
                                </span>
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}