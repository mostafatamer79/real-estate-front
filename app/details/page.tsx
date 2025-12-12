// app/details/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Map from "../src/components/Map";
import PropertyInfoCards from "../src/components/PropertyInfoCards";
import QuickActions from "../src/components/QuickActions";
import ProfileCard from "../src/components/ProfileCard";
import ProfileModal from "@/components/ProfileModal";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Edit2 } from 'lucide-react';

export default function HomePage() {
  const propertyLocation: [number, number] = [24.7136, 46.6753];
  const { user, token, needsProfileCompletion } = useAuth();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    // Avoid redirect loop

  }, [needsProfileCompletion, router]);

  const handleProfileUpdate = (updatedUser: any) => {
    // You might want to refresh the page or update context
    window.location.reload();
  };

  return (
    <>
      <div className="w-full min-h-screen bg-slate-950 py-10 relative" dir="rtl">
        {/* Profile Button */}
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
          <ProfileCard />
          {user && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white/80 hover:text-white transition-colors"
              title="تعديل الملف الشخصي"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div className="mb-8 max-w-7xl mx-auto px-4">
          <Map
            center={propertyLocation}
            zoom={15}
            markerPosition={propertyLocation}
            markerTitle="موقع العقار"
            markerDescription="الموقع الافتراضي"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <PropertyInfoCards />
          </div>

          <div className="mb-8">
            <QuickActions />
          </div>
        </div>
      </div>

      {user && token && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          token={token}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}