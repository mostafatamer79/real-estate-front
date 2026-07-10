"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FolderOpen, Loader2 } from "lucide-react";
import { Place } from "@/types/map";
import { useLanguage } from "@/context/LanguageContext";
import PaymentMethodsModal from "@/components/Payment/PaymentMethodsModal";
import { financialApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";

// ✅ Dynamic Import with Loading Component
const MapLoading = () => {
  const { t } = useLanguage();
  return (
    <div className="h-[70vh] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl animate-pulse flex items-center justify-center">
      <div className="text-slate-400">{t('scan.loadingMap')}</div>
    </div>
  );
};

const Map = dynamic(() => import("../src/components/Map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

// ✅ Constants
const DEFAULT_LOCATION: [number, number] = [24.7136, 46.6753]
const RADIUS = 2000;
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3009";
const SCAN_DISCLAIMER_AR = "يُعد استخدامك لخدمة مسح الحي بالذكاء الاصطناعي أو اعتمادك على هذا التقرير، إقراراً علنياً وصريحاً منك بالعلم التام بطبيعة الخدمات التقنية واحتمالية وجود نسبة خطأ أو تباين إحصائي في مخرجاتها";

export default function ScanMapPage() {
  // ✅ State
  const [propertyLocation, setPropertyLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [searchRadius, setSearchRadius] = useState(RADIUS);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<any[]>([]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [acceptedScanDisclaimer, setAcceptedScanDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const mapCaptureRef = useRef<HTMLDivElement | null>(null);
  const { t, language } = useLanguage();
  const router = useRouter();
  const { isOpen, message, isAdmin } = useSectionGuard('scan_map');

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/details');
  }, [router]);

  // ✅ Memoized values
  const reportPrice = useMemo(() => Math.max(30, Math.floor(25 + (searchRadius / 100))), [searchRadius]);
  const hasPlaces = useMemo(() => places.length > 0, [places]);
  const uniqueTypes = useMemo(() => new Set(places.map(p => p.type)).size, [places]);

  // ✅ Automatic Zoom calculation based on radius
  const dynamicZoom = useMemo(() => {
    // Basic logarithmic formula to adjust zoom based on radius in meters
    // 2000m -> level 14
    // 1000m -> level 15
    // 4000m -> level 13
    return Math.round(14 - Math.log2(searchRadius / 2000));
  }, [searchRadius]);

  const captureMapImage = useCallback(async () => {
    if (!mapCaptureRef.current) return undefined;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(mapCaptureRef.current, {
        backgroundColor: '#0f172a',
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch (captureError) {
      console.warn('Map capture failed, report will use diagram fallback:', captureError);
      return undefined;
    }
  }, []);

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
    // if (!isPaid) {
    //   setError(t('scan.paymentRequired'));
    //   return;
    // }

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
        throw new Error(`${t('scan.serverError')}: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(t('scan.dataError'));
      }

      setPlaces(data);

      if (data.length > 0) {
        setGeneratingReport(true);
        setGeneratedFiles([]);
        try {
          const reportResponse = await financialApi.generateScanReport({
            latitude: propertyLocation[0],
            longitude: propertyLocation[1],
            radius: searchRadius,
            mapImage: await captureMapImage(),
            locationName: data[0]?.city || data[0]?.name || `موقع ${propertyLocation[0].toFixed(4)}, ${propertyLocation[1].toFixed(4)}`,
          });
          setGeneratedFiles(reportResponse.data?.files || []);
          toast.success('تم إنشاء ملفات Excel و PDF وحفظها في صفحة الملفات');
        } catch (reportError) {
          console.error("Error generating scan report files:", reportError);
          toast.error('تم المسح بنجاح، لكن تعذر إنشاء ملفات التقرير');
        } finally {
          setGeneratingReport(false);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('scan.unexpectedError');
      setError(errorMessage);
      console.error("Error scanning area:", err);
    } finally {
      setLoading(false);
    }
  }, [propertyLocation, searchRadius, loading, captureMapImage]);

  const handleStartScan = useCallback(() => {
    if (!acceptedScanDisclaimer) {
      setDisclaimerChecked(false);
      setIsDisclaimerOpen(true);
      return;
    }
    scanArea();
  }, [acceptedScanDisclaimer, scanArea]);

  // ✅ Export CSV function
  const exportCSV = useCallback(() => {
    if (!hasPlaces) return;

    const csvRows = [];

    // Headers
    csvRows.push([t('scan.csv.name'), t('scan.csv.type'), t('scan.csv.distance'), t('scan.csv.lat'), t('scan.csv.lng'), t('scan.csv.city')].join(","));

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
    setIsPaid(false);
    setInvoiceId(null);
    setGeneratedFiles([]);
    setAcceptedScanDisclaimer(false);
    setDisclaimerChecked(false);
  }, []);

  // ✅ Create Invoice for Neighborhood Report
  const handleRequestReport = async () => {
    setCreatingInvoice(true);
    try {
      const resp = await financialApi.createInvoice({
        amount: reportPrice,
        referenceType: 'NeighborhoodReport',
        description: `${t('scan.neighborReport')} - ${propertyLocation[0].toFixed(4)}, ${propertyLocation[1].toFixed(4)} (Radius: ${searchRadius}m)`,
      });
      setInvoiceId(resp.data.id);
      setIsPaymentModalOpen(true);
    } catch (err) {
      toast.error(t('scan.unexpectedError'));
    } finally {
      setCreatingInvoice(false);
    }
  };

  // ✅ Format distance for display
  const formatDistance = useCallback((distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)} ${t('scan.unit.meter')}`;
    }
    return `${(distance / 1000).toFixed(1)} ${t('scan.unit.km')}`;
  }, []);

  // ✅ Get distance color class
  const getDistanceColor = useCallback((distance: number) => {
    if (distance < 500) return "bg-green-900/30 text-green-400";
    if (distance < 1000) return "bg-yellow-900/30 text-yellow-400";
    if (distance < 2000) return "bg-orange-900/30 text-orange-400";
    return "bg-red-900/30 text-red-400";
  }, []);

  if (!isOpen) {
    return <ComingSoonOverlay sectionName={t('action.scan-map') || 'المسح والمخططات'} message={message} isAdmin={isAdmin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-4 md:p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {generatingReport && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full w-[95vw] sm:max-w-md rounded-3xl border border-white/10 bg-slate-900 shadow-2xl p-4 sm:p-8 text-center">
            <div className="mx-auto mb-5 h-16 w-16 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
            </div>
            <h2 className="text-xl font-black mb-2">جاري إنشاء التقرير الذكي</h2>
            <p className="text-sm text-slate-400 leading-7">
              يتم الآن توليد PDF و Excel، إضافة صورة الخريطة، حساب المؤشرات، وبناء الرسوم البيانية ثلاثية الأبعاد. الرجاء الانتظار حتى يكتمل الحفظ في صفحة الملفات.
            </p>
            <div className="mt-6 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 animate-pulse" />
            </div>
          </div>
        </div>
      )}
      {isDisclaimerOpen && (
        <div className="fixed inset-0 z-[9998] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full w-[95vw] sm:max-w-3xl max-h-[88vh] overflow-hidden rounded-[1.25rem] border border-white/10 bg-card text-slate-950 shadow-2xl" dir="rtl">


            <div className="border-t border bg-card px-6 pt-8 pb-5 sm:px-8 sm:pt-10">
              <label className="flex items-start gap-3 rounded-2xl border border bg-muted p-4 text-sm font-black text-slate-800">
                <input
                  type="checkbox"
                  checked={disclaimerChecked}
                  onChange={(event) => setDisclaimerChecked(event.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-slate-300 accent-slate-950"
                />
                <span>
                  {SCAN_DISCLAIMER_AR}
                </span>
              </label>
              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsDisclaimerOpen(false)}
                  className="h-12 rounded-2xl border border bg-card px-6 text-sm font-black text-slate-600 hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!disclaimerChecked}
                  onClick={() => {
                    setAcceptedScanDisclaimer(true);
                    setIsDisclaimerOpen(false);
                    scanArea();
                  }}
                  className="h-12 rounded-2xl bg-slate-950 px-6 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-black"
                >
                  أوافق وابدأ المسح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="mb-8 relative pt-2">
        <button
          type="button"
          onClick={handleBack}
          className="mb-6 inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-card/10 px-4 text-[11px] font-black uppercase tracking-widest text-slate-200 backdrop-blur-sm transition-all hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-white"
        >
          {language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {language === 'ar' ? 'رجوع' : 'Back'}
        </button>
        <h1 className="text-2xl md:text-xl sm:text-3xl font-bold text-center mb-2 text-slate-400">
           {t('scan.title')}
        </h1>
        <p className="text-slate-400 text-center text-sm md:text-base">
          {t('scan.desc')}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Left Column - Controls & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              {t('scan.propertyLocation')}
            </h2>

            <div className="space-y-4">
              {/* Location Display */}
              <div className="bg-slate-900/80 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">{t('scan.coordinates')}:</span>
                  <button
                    onClick={() => setIsSelectingLocation(!isSelectingLocation)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      isSelectingLocation
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
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
                  <span>500 {t('scan.unit.meter')}</span>
                  <span>2.5 {t('scan.unit.km')}</span>
                  <span>5 {t('scan.unit.km')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleStartScan}
                  disabled={loading || isSelectingLocation}
                  className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-500 hover:to-slate-400 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      {t('scan.scanning')}
                    </>
                  ) : (
                    <>
                      {t('scan.start')}
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={resetToDefault}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {t('scan.default')}
                  </button>

                  {hasPlaces && (
                    <button
                      onClick={() => setShowTable(!showTable)}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {showTable ? t('scan.hideTable') : t('scan.showTable')}
                    </button>
                  )}
                </div>
              </div>

              {/* Neighborhood Report Service Card */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700 mt-6 bg-gradient-to-br from-slate-800 to-slate-950/30">
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  {t('scan.neighborReport')}
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  {t('scan.paymentRequired')}
                </p>
                <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl mb-4">
                  <span className="text-sm">{t('scan.price')}</span>
                  <span className="font-bold text-emerald-400"><SaudiRiyalAmount amount={reportPrice} locale={language === 'ar' ? 'ar-SA' : 'en-US'} /></span>
                </div>

                {isPaid ? (
                  <div className="bg-emerald-900/20 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2">
                    {t('scan.unlocked')}
                  </div>
                ) : (
                  <button
                    onClick={handleRequestReport}
                    disabled={creatingInvoice}
                    className="w-full bg-slate-600 hover:bg-slate-500 disabled:opacity-50 px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    {creatingInvoice ? (
                      <span className="animate-spin text-lg">⟳</span>
                    ) : (
                      <>
                        {t('scan.payNow')}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          {hasPlaces && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                {t('scan.results')}
              </h2>

              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 p-4 rounded-xl text-center">
                    <div className="text-xl sm:text-2xl font-bold text-emerald-400">{places.length}</div>
                    <div className="text-sm text-slate-400">{t('scan.placesCount')}</div>
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-xl text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-400">{uniqueTypes}</div>
                    <div className="text-sm text-slate-400">{t('scan.typesCount')}</div>
                  </div>
                </div>

                {/* Top Types */}
                {typeCounts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">{t('scan.topTypes')}:</h3>
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
                  onClick={() => router.push('/wallet?tab=files')}
                  disabled={!hasPlaces || generatingReport}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {generatingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
                  {generatingReport ? 'جاري إنشاء Excel و PDF...' : 'عرض الملفات المحفوظة'}
                </button>
                {generatedFiles.length > 0 && (
                  <p className="text-xs text-emerald-400 text-center font-bold">
                    تم حفظ {generatedFiles.length} ملفات في صفحة الملفات
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-400 text-xl mt-1">⚠️</div>
                <div>
                  <h3 className="font-bold text-red-300 mb-1">{t('scan.error.title')}</h3>
                  <p className="text-sm text-red-200/80">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          {isSelectingLocation && (
            <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-bold text-yellow-300 mb-1">{t('scan.tips.title')}</h3>
                  <p className="text-sm text-yellow-200/80">
                    {t('scan.tips.desc')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Map & Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Map Card */}
          <div ref={mapCaptureRef} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-slate-700 overflow-hidden">
            <Map
              center={propertyLocation}
              zoom={dynamicZoom}
              height="70vh"
              places={places}
              onLocationSelect={handleLocationSelect}
              useCurrentLocation={false}
              markerTitle={t('map.markerProp')}
              markerDescription={t('scan.tips.desc')}
              showControls={isSelectingLocation}
            />
          </div>

          {/* Results Table */}
          {showTable && hasPlaces && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 overflow-hidden">
              <div className="p-4 bg-slate-800/70 border-b border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  {t('scan.table.results')} ({places.length} {t('scan.table.places')})
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTable(false)}
                    className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {t('scan.table.close')}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full">
                  <thead className="bg-slate-800/80 sticky top-0">
                    <tr>
                      <th className="p-3 text-right font-semibold text-slate-300">#</th>
                      <th className="p-3 text-right font-semibold text-slate-300">{t('scan.table.name')}</th>
                      <th className="p-3 text-right font-semibold text-slate-300">{t('scan.table.type')}</th>
                      <th className="p-3 text-right font-semibold text-slate-300">{t('scan.table.distance')}</th>
                      <th className="p-3 text-right font-semibold text-slate-300">{t('scan.table.coords')}</th>
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
                {t('scan.footer.found', { count: places.length, radius: searchRadius.toLocaleString() })}
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Payment Modal */}
      <PaymentMethodsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoiceId || ""}
        price={reportPrice}
        onPaymentSuccess={() => {
          setIsPaid(true);
          toast.success(t('scan.unlocked'));
        }}
      />
    </div>
  );
}
