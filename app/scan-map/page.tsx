"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Place } from "@/types/map";

// ✅ Dynamically import the Map component to avoid SSR issues
const Map = dynamic(() => import("../src/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl animate-pulse flex items-center justify-center">
      <div className="text-slate-400">جاري تحميل الخريطة...</div>
    </div>
  ),
});

// ✅ Constants
const DEFAULT_LOCATION: [number, number] = [24.7136, 46.6753];
const RADIUS = 2000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";

export default function ScanMapPage() {
  // ✅ State
  const [propertyLocation, setPropertyLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [searchRadius, setSearchRadius] = useState(RADIUS);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Memoized values
  const hasPlaces = useMemo(() => places.length > 0, [places]);
  const uniqueTypes = useMemo(() => new Set(places.map(p => p.type)).size, [places]);

  // ✅ Handle location selection from Map
  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    if (isSelectingLocation) {
      setPropertyLocation([lat, lng]);
      setIsSelectingLocation(false);
      setPlaces([]); // Clear previous results
      setError(null);
    }
  }, [isSelectingLocation]);

  // ✅ Calculate distance (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // ✅ Optimized scan function
  const scanArea = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        latitude: propertyLocation[0].toString(),
        longitude: propertyLocation[1].toString(),
        radius: searchRadius.toString(),
      });

      const response = await fetch(`${API_URL}/places?${params}`);

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("تنسيق البيانات غير صحيح");
      }

      setPlaces(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      setError(errorMessage);
      console.error("Error scanning area:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyLocation, searchRadius, loading]);

  // ✅ Export CSV function
  const exportCSV = useCallback(() => {
    if (!hasPlaces) return;

    const csvRows = [];

    // Headers
    csvRows.push(["الاسم", "النوع", "المسافة (م)", "العرض", "الطول", "المدينة"].join(","));

    // Data rows
    places.forEach(place => {
      const distance = calculateDistance(
        propertyLocation[0], propertyLocation[1],
        place.latitude, place.longitude
      );

      const row = [
        `"${place.name.replace(/"/g, '""')}"`,
        place.type,
        Math.round(distance),
        place.latitude.toFixed(6),
        place.longitude.toFixed(6),
        place.city ? `"${place.city.replace(/"/g, '""')}"` : ""
      ];

      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `scan_results_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [places, propertyLocation, hasPlaces]);

  // ✅ Sort places by distance
  const sortedPlaces = useMemo(() => {
    return [...places].sort((a, b) => {
      const distA = calculateDistance(propertyLocation[0], propertyLocation[1], a.latitude, a.longitude);
      const distB = calculateDistance(propertyLocation[0], propertyLocation[1], b.latitude, b.longitude);
      return distA - distB;
    });
  }, [places, propertyLocation]);

  // ✅ Group places by type for statistics
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach(place => {
      counts[place.type] = (counts[place.type] || 0) + 1;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [places]);

  // ✅ Reset to default location
  const resetToDefault = useCallback(() => {
    setPropertyLocation(DEFAULT_LOCATION);
    setPlaces([]);
    setSearchRadius(RADIUS);
    setIsSelectingLocation(false);
    setError(null);
  }, []);

  // ✅ Format distance for display
  const formatDistance = useCallback((distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)} متر`;
    }
    return `${(distance / 1000).toFixed(1)} كيلومتر`;
  }, []);

  // ✅ Get distance color class
  const getDistanceColor = useCallback((distance: number) => {
    if (distance < 500) return "bg-green-900/30 text-green-400";
    if (distance < 1000) return "bg-yellow-900/30 text-yellow-400";
    if (distance < 2000) return "bg-orange-900/30 text-orange-400";
    return "bg-red-900/30 text-red-400";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-4 md:p-6" dir="rtl">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-emerald-400">
          🗺️ نظام مسح المناطق المحيطة
        </h1>
        <p className="text-slate-400 text-center text-sm md:text-base">
          حدد موقع العقار ثم امسح المنطقة المحيطة للعثور على الخدمات القريبة
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Controls & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-emerald-400">📍</span>
              موقع العقار
            </h2>

            <div className="space-y-4">
              {/* Location Display */}
              <div className="bg-slate-900/80 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">الإحداثيات:</span>
                  <button
                    onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      isSelectingLocation
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {isSelectingLocation ? "❌ إلغاء التحديد" : "📍 تحديد جديد"}
                  </button>
                </div>
                <div className="font-mono text-sm bg-slate-800 p-2 rounded-lg text-center">
                  {propertyLocation[0].toFixed(6)}
                  <br />
                  {propertyLocation[1].toFixed(6)}
                </div>
              </div>

              {/* Search Radius Slider */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  🔍 نصف قطر البحث: <span className="text-emerald-400">{searchRadius.toLocaleString()} متر</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>500م</span>
                  <span>2.5كم</span>
                  <span>5كم</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={scanArea}
                  disabled={loading || isSelectingLocation}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      جاري المسح...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      بدء المسح
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={resetToDefault}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🏠</span>
                    الافتراضي
                  </button>

                  {hasPlaces && (
                    <button
                      onClick={() => setShowTable(!showTable)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <span>{showTable ? "👁️‍🗨️" : "📊"}</span>
                      {showTable ? "إخفاء الجدول" : "عرض الجدول"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          {hasPlaces && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-blue-400">📊</span>
                نتائج المسح
              </h2>

              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-emerald-400">{places.length}</div>
                    <div className="text-sm text-slate-400">عدد الأماكن</div>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-400">{uniqueTypes}</div>
                    <div className="text-sm text-slate-400">عدد الأنواع</div>
                  </div>
                </div>

                {/* Top Types */}
                {typeCounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">أكثر الأنواع تواجداً:</h3>
                    <div className="space-y-2">
                      {typeCounts.map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                          <span className="text-sm truncate">{type}</span>
                          <span className="bg-slate-800 px-2 py-1 rounded text-xs min-w-[2rem] text-center">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <button
                  onClick={exportCSV}
                  disabled={!hasPlaces}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <span>⬇️</span>
                  تصدير نتائج CSV
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-400 text-xl mt-1">⚠️</div>
                <div>
                  <h3 className="font-bold text-red-300 mb-1">خطأ</h3>
                  <p className="text-sm text-red-200/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isSelectingLocation && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-yellow-400 text-xl mt-1">💡</div>
                <div>
                  <h3 className="font-bold text-yellow-300 mb-1">وضع تحديد الموقع</h3>
                  <p className="text-sm text-yellow-200/80">
                    انقر على الخريطة لتحديد موقع العقار الجديد، ثم اضغط على زر "بدء المسح"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Map & Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-slate-700 overflow-hidden">
            <Map
              center={propertyLocation}
              zoom={14}
              height="70vh"
              places={places}
              onLocationSelect={handleLocationSelect}
              useCurrentLocation={false}
              markerTitle="موقع العقار"
              markerDescription="انقر لتحديد موقع جديد"
              showControls={isSelectingLocation}
            />
          </div>

          {/* Results Table */}
          {showTable && hasPlaces && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-4 bg-slate-800/70 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>📋</span>
                  جدول النتائج ({places.length} مكان)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTable(false)}
                    className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    إغلاق الجدول
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-800/80 sticky top-0">
                    <tr>
                      <th className="p-3 text-right font-semibold text-slate-300">#</th>
                      <th className="p-3 text-right font-semibold text-slate-300">الاسم</th>
                      <th className="p-3 text-right font-semibold text-slate-300">النوع</th>
                      <th className="p-3 text-right font-semibold text-slate-300">المسافة</th>
                      <th className="p-3 text-right font-semibold text-slate-300">الإحداثيات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlaces.map((place, index) => {
                      const distance = calculateDistance(
                        propertyLocation[0], propertyLocation[1],
                        place.latitude, place.longitude
                      );

                      return (
                        <tr
                          key={place.id}
                          className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="p-3 text-center text-slate-400">{index + 1}</td>
                          <td className="p-3">
                            <div className="font-medium max-w-[200px] truncate">{place.name}</div>
                            {place.city && (
                              <div className="text-xs text-slate-500">{place.city}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-3 py-1 bg-slate-800 rounded-full text-sm max-w-[150px] truncate">
                              {place.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getDistanceColor(distance)}`}>
                                {formatDistance(distance)}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-xs font-mono text-slate-400">
                              {place.latitude.toFixed(4)}
                              <br />
                              {place.longitude.toFixed(4)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 bg-slate-800/70 border-t border-slate-700 text-sm text-slate-400">
                تم العثور على {places.length} مكان ضمن دائرة نصف قطرها {searchRadius.toLocaleString()} متر
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-slate-800 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} نظام مسح المناطق المحيطة. جميع الحقوق محفوظة.</p>
        <p className="mt-1">تحديث البيانات في الوقت الفعلي عبر OpenStreetMap</p>
      </footer>
    </div>
  );
}