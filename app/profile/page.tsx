"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2, User, MapPin, Building, Briefcase } from 'lucide-react';
import { Role, User as UserType } from '@/types/user';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب'),
  role: z.nativeEnum(Role),
  agentLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'المدينة مطلوبة'),
  country: z.string().min(1, 'الدولة مطلوبة'),
  // Phone and Email are read-only for now as they require re-verification usually, 
  // but if API allows update, we can add them. 
  // UpdateUserDto allows them? No, it allows string.
  // We'll treat them as editable but maybe add warning or just handle as normal.
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, token, logout } = useAuth(); // Assuming logout exists, or we redirect
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      role: Role.USER,
      agentLicenseNumber: '',
      address: '',
      city: 'الرياض',
      country: 'السعودية',
    },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role || Role.USER,
        agentLicenseNumber: user.agentLicenseNumber || '',
        address: user.address || '',
        city: user.city || 'الرياض',
        country: user.country || 'السعودية',
      });
    } 
  }, [user, token, reset, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const response = await api.put<ApiResponse<UserType>>('/user/profile', data);
      
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات الملف الشخصي",
        variant: "default",
      });
      // Optionally reload or update context
      window.location.reload(); 
    } catch (error: any) {
        console.log(error);
      toast({
        title: "خطأ",
        description: error.response?.data?.message || 'فشل تحديث الملف الشخصي',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
      return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-slate-800">الملف الشخصي</h1>
            <button 
                onClick={() => router.back()}
                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
                عودة
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar / User Card */}
            <div className="md:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                        <User className="w-12 h-12" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">{user.firstName} {user.lastName}</h2>
                    <p className="text-slate-500 mb-4">{user.email || user.phone}</p>
                    <div className="w-full px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 mb-6">
                        {user.role === Role.ADMIN ? 'مدير النظام' : user.role === Role.AGENT ? 'مقدم خدمة' : 'مستخدم'}
                    </div>
                </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">تعديل البيانات</h3>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* Personal Info */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4">
                                <User className="w-4 h-4" />
                                المعلومات الشخصية
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">الاسم الأول</label>
                                    <input
                                    type="text"
                                    {...register('firstName')}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none text-right ${errors.firstName ? 'border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                                    />
                                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">الاسم الأخير</label>
                                    <input
                                    type="text"
                                    {...register('lastName')}
                                    className={`w-full px-3 py-2 bg-slate-50 border rounded-lg focus:outline-none text-right ${errors.lastName ? 'border-red-500' : 'border-slate-300 focus:border-blue-500'}`}
                                    />
                                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4 mt-6">
                                <MapPin className="w-4 h-4" />
                                الموقع والعنوان
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">العنوان</label>
                                    <input
                                        type="text"
                                        {...register('address')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700">المدينة</label>
                                        <select
                                            {...register('city')}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
                                        >
                                            <option value="الرياض">الرياض</option>
                                            <option value="جدة">جدة</option>
                                            <option value="الدمام">الدمام</option>
                                            <option value="مكة المكرمة">مكة المكرمة</option>
                                            <option value="المدينة المنورة">المدينة المنورة</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-slate-700">الدولة</label>
                                        <select
                                            {...register('country')}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
                                        >
                                            <option value="السعودية">السعودية</option>
                                            <option value="الإمارات">الإمارات</option>
                                            <option value="الكويت">الكويت</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Account Type */}
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-4 mt-6">
                                <Briefcase className="w-4 h-4" />
                                نوع الحساب
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-slate-700">نوع المستخدم</label>
                                    <select
                                        {...register('role')}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none text-right"
                                    >
                                        <option value={Role.USER}>مستخدم عادي</option>
                                        <option value={Role.AGENT}>مقدم خدمة (وسيط عقاري)</option>
                                    </select>
                                </div>
                                
                                {selectedRole === Role.AGENT && (
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <label className="block text-sm font-medium mb-1 text-blue-800">رقم الرخصة المهنية</label>
                                        <input
                                        type="text"
                                        {...register('agentLicenseNumber')}
                                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none text-right"
                                        placeholder="الرجاء إدخال رقم رخصة فال"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-6 border-t flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    جاري الحفظ...
                                </>
                                ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    حفظ التغييرات
                                </>
                                )}
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
