// app/components/ProfileModal.tsx
"use client";

import { useState } from 'react';
import { X, Save, User, Shield, MapPin } from 'lucide-react';
import { Role } from '@/types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  token: string;
  onUpdate: (updatedUser: any) => void;
}

export default function ProfileModal({ isOpen, onClose, user, token, onUpdate }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    role: user?.role || Role.USER,
    agentLicenseNumber: user?.agentLicenseNumber || '',
    address: user?.address || '',
    city: user?.city || 'الرياض',
    country: user?.country || 'السعودية',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

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

      onUpdate(data);
      onClose();
      
    } catch (err: any) {
      setError(err.message || 'فشل تحديث الملف الشخصي');
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
            <h2 className="text-xl font-bold">تعديل الملف الشخصي</h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الأول</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الاسم الأخير</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">نوع الحساب</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value={Role.USER}>مستخدم</option>
             
                <option value={Role.AGENT}>مقدم الخدمة</option>
              </select>
            </div>

            {formData.role === Role.AGENT && (
              <div>
                <label className="block text-sm font-medium mb-1">رقم الرخصة المهنية</label>
                <input
                  type="text"
                  name="agentLicenseNumber"
                  value={formData.agentLicenseNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                  required={formData.role === Role.AGENT}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">العنوان</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">المدينة</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">الدولة</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
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
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-sm transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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