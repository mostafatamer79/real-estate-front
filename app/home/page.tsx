"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSettings } from '@/context/SettingsContext';
const Map = dynamic(() => import("../src/components/Map"), { ssr: false });

export default function DetailsPage() {
  const { settings } = useSettings();
  const propertyLocation: [number, number] = [24.7136, 46.6753]; // Riyadh, Saudi Arabia

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl sm:text-3xl font-bold mb-6 text-center text-white">تفاصيل العقار</h1>
        
        {settings.sectionFlags.map !== 'hidden' && settings.sectionFlags.map !== 'closed' && (
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-white">الموقع</h2>
            <div className="flex justify-center">
              <div className="w-full w-[95vw] sm:max-w-2xl">
                <Map
                  center={propertyLocation}
                  zoom={15}
                  markerPosition={propertyLocation}
                  markerTitle="موقع العقار"
                  markerDescription=" هذا موقع العقار"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

