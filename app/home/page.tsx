"use client";

import Map from "../src/components/Map";

export default function DetailsPage() {
  const propertyLocation: [number, number] = [24.7136, 46.6753]; // Riyadh, Saudi Arabia

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 ">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">تفاصيل العقار</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-white">الموقع</h2>
          <div className="flex justify-center">
            <div className="w-full max-w-2xl">
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

      </div>
    </div>
  );
}

