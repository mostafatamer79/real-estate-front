// app/components/ProfileModal.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Loader2 } from 'lucide-react';
import { Role, User } from '@/types/user';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ApiResponse } from '@/types/api';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: (updatedUser: User) => void;
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  lastName: z.string().min(1, 'الاسم الأخير مطلوب'),
  role: z.nativeEnum(Role),
  agentLicenseNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().min(1, 'المدينة مطلوبة'),
  country: z.string().min(1, 'الدولة مطلوبة'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const { toast } = useToast();
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
    if (isOpen && user) {
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
  }, [isOpen, user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const response = await api.put<ApiResponse<User>>('/user/profile', data);
      
      onUpdate(response.data.data);
      onClose();
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم تحديث بيانات الملف الشخصي",
        variant: "default",
      });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-slate-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">تعديل الملف الشخصي</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">الاسم الأول</label>
                <input
                  type="text"
                  {...register('firstName')}
                  className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg focus:outline-none text-sm text-white ${errors.firstName ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                />
                {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">الاسم الأخير</label>
                <input
                  type="text"
                  {...register('lastName')}
                  className={`w-full px-3 py-2 bg-slate-700/50 border rounded-lg focus:outline-none text-sm text-white ${errors.lastName ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'}`}
                />
                {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-200">نوع الحساب</label>
              <select
                {...register('role')}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-white"
              >
                <option value={Role.USER}>مستخدم</option>
                <option value={Role.AGENT}>مقدم الخدمة</option>
              </select>
            </div>

            {selectedRole === Role.AGENT && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">رقم الرخصة المهنية</label>
                <input
                  type="text"
                  {...register('agentLicenseNumber')}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-200">العنوان</label>
              <input
                type="text"
                {...register('address')}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">المدينة</label>
                <select
                  {...register('city')}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-white"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-200">الدولة</label>
                <select
                  {...register('country')}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm text-white"
                >
                  <option value="السعودية">السعودية</option>
                  <option value="الإمارات">الإمارات</option>
                  <option value="الكويت">الكويت</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-sm text-white transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
  );
}