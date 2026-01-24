// app/details/page.tsx
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
const Map = dynamic(() => import("../src/components/Map"), { ssr: false });
import PropertyInfoCards from "../src/components/PropertyInfoCards";
import QuickActions from "../src/components/QuickActions";
import ProfileCard from "../src/components/ProfileCard";
import PriceTrendChart from "../src/components/PriceTrendChart";
import PropertyDistributionChart from "../src/components/PropertyDistributionChart";
import ProfileModal from "@/components/ProfileModal";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Edit2, MessageCircle } from 'lucide-react';
import { Role } from '@/types/user';

export default function HomePage() {
  const propertyLocation: [number, number] = [24.7136, 46.6753];
  const { user, token, needsProfileCompletion } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  const handleProfileUpdate = (updatedUser: any) => {
    window.location.reload();
  };

  // Mock data for charts
  const priceData = [1200, 1250, 1180, 1300, 1280, 1350, 1320, 1400, 1380, 1450];
  const propertyTypes = [
    { name: 'سكني', value: 40, color: 'bg-blue-500' },
    { name: 'تجاري', value: 30, color: 'bg-green-500' },
    { name: 'مكاتب', value: 20, color: 'bg-purple-500' },
    { name: 'أخرى', value: 10, color: 'bg-yellow-500' }
  ];

  return (
    <>
      <div className="w-full min-h-screen bg-slate-950 p-4" dir="rtl">

        {/* Header */}
        <div className="w-full flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-lg font-bold text-white"
          >
            دير عقارك
          </button>
          <div className="flex items-center gap-2">
            <ProfileCard />
            {user && (
              <button
            onClick={() => router.push("/profile")}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white/80 hover:text-white transition-colors"
                title="تعديل الملف الشخصي"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {user && (
              <button
                onClick={() => router.push('/chat')}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white/80 hover:text-white transition-colors"
                title="الدردشة"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            )}
             {user?.role === Role.ADMIN && (
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-400 font-bold transition-colors text-sm"
                >
                  لوحة التحكم
                </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6 max-w-6xl mx-auto">

          {/* Map */}
          <div className="w-full bg-slate-900 rounded-xl overflow-hidden">
            <div className="h-64">
              <Map
                center={propertyLocation}
                zoom={15}
                markerPosition={propertyLocation}
                markerTitle="موقع العقار"
                markerDescription="الموقع الافتراضي"
              />
            </div>
          </div>

          {/* Scan Button */}
          <div className="w-full">
            <button
              onClick={() => router.push('/scan-map')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-bold shadow transition"
            >
              🗺️ مسح المنطقة المحيطة
            </button>
            <p className="text-center text-sm text-white/60 mt-1">
              تحليل الخدمات والمرافق القريبة من العقار
            </p>
          </div>

          {/* Property Info Cards */}
          <div className="w-full">
            <PropertyInfoCards />
          </div>

          {/* Two Charts - One Line, One Pie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PriceTrendChart data={priceData} />
            <PropertyDistributionChart data={propertyTypes} />
          </div>

          {/* Quick Actions */}
          <div className="w-full">
            <QuickActions />
          </div>

        </div>
      </div>

      {user && token && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}