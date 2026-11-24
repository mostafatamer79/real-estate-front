"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Place } from "@/types/map";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import PaymentMethodsModal from "@/components/Payment/PaymentMethodsModal";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { financialApi } from "@/lib/api";
import {
  computeZoomForRadius,
  sortPlacesByDistance,
  computePlaceStatistics,
  resolvePlacesApiUrl,
  validatePlacesResponse,
  generateScanCsv,
  derivePricingStatus,
  classifyGeolocationError,
  ScanPlaceWithDistance,
} from "@/lib/redesign-chat12-scan";
import ScanMapHeader from "@/components/redesign/chat12/ScanMapHeader";
import ScanMapControls from "@/components/redesign/chat12/ScanMapControls";
import ScanResultsTable from "@/components/redesign/chat12/ScanResultsTable";
import ScanDisclaimerModal from "@/components/redesign/chat12/ScanDisclaimerModal";
import ScanGeneratingOverlay from "@/components/redesign/chat12/ScanGeneratingOverlay";
import styles from "@/components/redesign/chat12/scan-map.module.css";

// Dynamic Import for Map with Accessible Skeleton
const MapLoading = () => {
  const { t, language } = useLanguage();
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-[65vh] min-h-[420px] bg-slate-100 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center p-6 border border-slate-200 dark:border-slate-800"
    >
      <div className="h-8 w-8 rounded-full border-3 border-amber-500 border-t-transparent animate-spin mb-3" />
      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
        {t("scan.loadingMap") || (language === "ar" ? "جاري تحميل الخريطة الجغرافية..." : "Loading Map...")}
      </span>
    </div>
  );
};

const Map = dynamic(() => import("../src/components/Map"), {
  ssr: false,
  loading: () => <MapLoading />,
});

const DEFAULT_LOCATION: [number, number] = [24.7136, 46.6753]; // Riyadh, Al Olaya
const DEFAULT_RADIUS = 2000; // 2km

export default function ScanMapPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { isOpen, message, isAdmin } = useSectionGuard("scan_map");
  const { settings, isLoading: settingsLoading } = useSettings();

  // Core Survey State
  const [propertyLocation, setPropertyLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_RADIUS);
  const [rawPlaces, setRawPlaces] = useState<Place[]>([]);
  const [isSelectingLocation, setIsSelectingLocation] = useState<boolean>(false);
  const [loadingScan, setLoadingScan] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Financial & Report State
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [creatingInvoice, setCreatingInvoice] = useState<boolean>(false);
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ id: string; url?: string; name?: string }>>([]);

  // Disclaimer Modal State
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState<boolean>(false);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState<boolean>(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState<boolean>(false);

  // Refs for race protection and unmount safety
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const mapCaptureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Back Navigation with fallback
  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/details");
  }, [router]);

  // Pricing Status Derivation
  const isMapFree = settings?.uiFlags?.is_map_free ?? false;
  const pricingInfo = useMemo(() => {
    return derivePricingStatus(settings?.servicePrices, isMapFree, settingsLoading);
  }, [settings?.servicePrices, isMapFree, settingsLoading]);

  // Distance Sorting & Place Statistics
  const sortedPlaces: ScanPlaceWithDistance[] = useMemo(() => {
    return sortPlacesByDistance(rawPlaces, propertyLocation[0], propertyLocation[1]);
  }, [rawPlaces, propertyLocation]);

  const placeStats = useMemo(() => {
    return computePlaceStatistics(sortedPlaces);
  }, [sortedPlaces]);

  // Automatic Leaflet Zoom calculation based on radius
  const dynamicZoom = useMemo(() => {
    return computeZoomForRadius(searchRadius);
  }, [searchRadius]);

  // Capture map image for report generation fallback
  const captureMapImage = useCallback(async () => {
    if (!mapCaptureRef.current) return undefined;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapCaptureRef.current, {
        backgroundColor: "#0f172a",
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
      });
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch (captureError) {
      console.warn("Map raster capture skipped; backend diagram will be used:", captureError);
      return undefined;
    }
  }, []);

  // Map Click Handler
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      if (isSelectingLocation) {
        setPropertyLocation([lat, lng]);
        setIsSelectingLocation(false);
        setRawPlaces([]);
        setError(null);
      }
    },
    [isSelectingLocation]
  );

  // Geolocation Handler
  const handleLocateMe = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError(
        isAr
          ? "المتصفح الحالي لا يدعم خاصية التحديد الجغرافي."
          : "Geolocation is not supported by your current browser."
      );
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setPropertyLocation([latitude, longitude]);
        setRawPlaces([]);
        toast.success(isAr ? "تم تحديد موقعك الحالي بنجاح" : "Current location found");
      },
      (err) => {
        if (!isMountedRef.current) return;
        setIsLocating(false);
        const diagnostic = classifyGeolocationError(err, isAr ? "ar" : "en");
        setError(diagnostic.message);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  }, [isAr]);

  // Report Generator Function (Safe, preserves places even if report fails)
  const triggerReportGeneration = useCallback(
    async (placesList: Place[], originLoc: [number, number], radius: number) => {
      if (placesList.length === 0) return;

      setGeneratingReport(true);
      try {
        const mapImg = await captureMapImage();
        const primaryLocationName =
          placesList[0]?.city ||
          placesList[0]?.name ||
          (isAr
            ? `موقع ${originLoc[0].toFixed(4)}, ${originLoc[1].toFixed(4)}`
            : `Location ${originLoc[0].toFixed(4)}, ${originLoc[1].toFixed(4)}`);

        const resp = await financialApi.generateScanReport({
          latitude: originLoc[0],
          longitude: originLoc[1],
          radius,
          mapImage: mapImg,
          locationName: primaryLocationName,
        });

        if (isMountedRef.current) {
          const files = resp?.data?.files || [];
          setGeneratedFiles(files);
          toast.success(
            isAr
              ? "تم حفظ تقرير الحي (PDF و Excel) بنجاح في صفحة الملفات."
              : "Neighborhood report saved to your document ledger."
          );
        }
      } catch (reportErr: unknown) {
        console.warn("Report dossier generation encountered an error:", reportErr);
        if (isMountedRef.current) {
          const errRecord = reportErr as { response?: { status?: number } };
          const status = errRecord?.response?.status;
          if (status === 401) {
            toast.error(
              isAr
                ? "تم المسح بنجاح! يُرجى تسجيل الدخول لحفظ التقرير الرسمي تلقائياً في حسابك."
                : "Scan complete. Sign in to sync the official report to your files."
            );
          } else {
            toast.error(
              isAr
                ? "تم المسح بنجاح. تعذر إصدار ملف التقرير حالياً؛ يمكنك إعادة المحاولة عبر زر التوليد."
                : "Survey finished. Report generation can be retried via the controls."
            );
          }
        }
      } finally {
        if (isMountedRef.current) {
          setGeneratingReport(false);
        }
      }
    },
    [captureMapImage, isAr]
  );

  // Core Scan Execution
  const executeScan = useCallback(async () => {
    if (loadingScan) return;

    if (pricingInfo.status === "available" && !isPaid) {
      setError(
        t("scan.paymentRequired") ||
          (isAr
            ? "يُرجى سداد رسوم خدمة المسح أولاً للبدء."
            : "Payment required before initiating the scan.")
      );
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingScan(true);
    setError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : undefined;
      const endpoint = resolvePlacesApiUrl(process.env.NEXT_PUBLIC_API_URL, origin);

      const params = new URLSearchParams({
        latitude: propertyLocation[0].toString(),
        longitude: propertyLocation[1].toString(),
        radius: searchRadius.toString(),
      });

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `${t("scan.serverError") || (isAr ? "خطأ في السيرفر" : "Server error")}: HTTP ${response.status}`
        );
      }

      const rawJson = await response.json();
      const validation = validatePlacesResponse(rawJson);

      if (!validation.ok) {
        throw new Error(validation.message);
      }

      if (isMountedRef.current) {
        setRawPlaces(validation.places);

        if (validation.places.length === 0) {
          toast(
            isAr
              ? `لم يتم العثور على مرافق مسجلة ضمن دائرة قطرها ${searchRadius}م. يمكنك توسيع نطاق البحث.`
              : `No registered facilities found within ${searchRadius}m. Try expanding the search radius.`,
            { icon: "📍" }
          );
        } else {
          toast.success(
            isAr
              ? `تم اكتشاف ${validation.places.length} مرفق بنجاح`
              : `Found ${validation.places.length} places`
          );

          // If unlocked/free, attempt generating official report
          if (pricingInfo.status === "free" || isPaid) {
            triggerReportGeneration(validation.places, propertyLocation, searchRadius);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === "AbortError") return;

      const messageText =
        err instanceof Error
          ? err.message
          : isAr
          ? "تعذر الاتصال بخدمة مسح المرافق. تحقق من اتصال الشبكة."
          : "Failed to connect to survey service. Please check network.";

      if (isMountedRef.current) {
        setError(messageText);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingScan(false);
      }
    }
  }, [
    loadingScan,
    pricingInfo.status,
    isPaid,
    propertyLocation,
    searchRadius,
    t,
    isAr,
    triggerReportGeneration,
  ]);

  // Start scan handler (triggers disclaimer first if unaccepted)
  const handleStartScan = useCallback(() => {
    if (!acceptedDisclaimer) {
      setDisclaimerChecked(false);
      setIsDisclaimerOpen(true);
      return;
    }
    executeScan();
  }, [acceptedDisclaimer, executeScan]);

  // CSV Export Handler
  const handleExportCsv = useCallback(() => {
    if (sortedPlaces.length === 0) return;
    try {
      const csvContent = generateScanCsv(
        sortedPlaces,
        propertyLocation[0],
        propertyLocation[1],
        isAr ? "ar" : "en"
      );

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `district_scan_${propertyLocation[0].toFixed(4)}_${propertyLocation[1].toFixed(4)}_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(isAr ? "تم تصدير ملف CSV بنجاح" : "CSV file downloaded");
    } catch (csvError) {
      console.error("CSV generation failed:", csvError);
      toast.error(isAr ? "تعذر تصدير ملف CSV" : "Failed to export CSV");
    }
  }, [sortedPlaces, propertyLocation, isAr]);

  // Reset to default location
  const handleResetToDefault = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPropertyLocation(DEFAULT_LOCATION);
    setSearchRadius(DEFAULT_RADIUS);
    setRawPlaces([]);
    setIsSelectingLocation(false);
    setError(null);
    setShowTable(false);
    setGeneratedFiles([]);
  }, []);

  // Request Report Invoice
  const handleRequestReportInvoice = useCallback(async () => {
    setCreatingInvoice(true);
    try {
      const resp = await financialApi.createInvoice({
        amount: pricingInfo.price,
        referenceType: "NeighborhoodReport",
        description: `${t("scan.neighborReport") || "تقرير الحي"} - [${propertyLocation[0].toFixed(4)}, ${propertyLocation[1].toFixed(4)}] (${searchRadius}m)`,
      });

      if (resp?.data?.id) {
        setInvoiceId(resp.data.id);
        setIsPaymentModalOpen(true);
      } else {
        throw new Error("Missing invoice identifier in server response");
      }
    } catch (invErr: unknown) {
      console.error("Invoice creation failed:", invErr);
      toast.error(
        isAr
          ? "تعذر إعداد فاتورة الخدمة. يُرجى التحقق من اتصال الحساب والمحاولة ثانية."
          : "Failed to initiate report invoice. Please try again."
      );
    } finally {
      if (isMountedRef.current) {
        setCreatingInvoice(false);
      }
    }
  }, [pricingInfo.price, propertyLocation, searchRadius, t, isAr]);

  if (!isOpen) {
    return (
      <ComingSoonOverlay
        sectionName={t("action.scan-map") || (isAr ? "المسح والمخططات" : "District Survey")}
        message={message}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <main className={styles.root} dir={isAr ? "rtl" : "ltr"}>
      <div className={styles.container}>
        {/* Header */}
        <ScanMapHeader
          onBack={handleBack}
          title={t("scan.title") || (isAr ? "نظام مسح المناطق والأحياء" : "District Survey & Geospatial Scan")}
          description={
            t("scan.desc") ||
            (isAr
              ? "استكشف الخدمات الحيوية، المرافق التعليمية، الصحية، والترفيهية المحيطة بأي عقار أو حي بدقة متقدمة."
              : "Analyze surrounding amenities, commercial facilities, and spatial indicators for any property with precision.")
          }
          locale={isAr ? "ar" : "en"}
        />

        {/* Main Grid: Controls Sidebar + Map First Workspace */}
        <div className={styles.mainGrid}>
          {/* Controls & Summary */}
          <ScanMapControls
            propertyLocation={propertyLocation}
            onLocationChange={(loc) => {
              setPropertyLocation(loc);
              setRawPlaces([]);
              setError(null);
            }}
            isSelectingLocation={isSelectingLocation}
            onToggleSelectingLocation={() => setIsSelectingLocation((prev) => !prev)}
            searchRadius={searchRadius}
            onRadiusChange={(radius) => setSearchRadius(radius)}
            onStartScan={handleStartScan}
            onReset={handleResetToDefault}
            onLocateMe={handleLocateMe}
            isLocating={isLocating}
            isLoadingScan={loadingScan}
            places={sortedPlaces}
            stats={placeStats}
            showTable={showTable}
            onToggleTable={() => setShowTable((prev) => !prev)}
            onExportCsv={handleExportCsv}
            error={error}
            onDismissError={() => setError(null)}
            pricingStatus={pricingInfo.status}
            reportPrice={pricingInfo.price}
            isPaid={isPaid}
            onRequestReportInvoice={handleRequestReportInvoice}
            isCreatingInvoice={creatingInvoice}
            isGeneratingReport={generatingReport}
            onRetryReportGeneration={() =>
              triggerReportGeneration(rawPlaces, propertyLocation, searchRadius)
            }
            generatedFilesCount={generatedFiles.length}
            locale={isAr ? "ar" : "en"}
          />

          {/* Map Surface & Results Table */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div ref={mapCaptureRef} className={styles.mapFrame}>
              <Map
                center={propertyLocation}
                zoom={dynamicZoom}
                height="65vh"
                places={sortedPlaces}
                onLocationSelect={handleLocationSelect}
                useCurrentLocation={false}
                markerTitle={isAr ? "موقع العقار المستهدف" : "Target Property"}
                markerDescription={
                  isAr
                    ? "مركز دائرة مسح الخدمات والمرافق"
                    : "Center of the amenity search radius"
                }
                showControls={isSelectingLocation}
              />
            </div>

            {/* Results Table Section */}
            {showTable && sortedPlaces.length > 0 && (
              <ScanResultsTable
                places={sortedPlaces}
                onClose={() => setShowTable(false)}
                locale={isAr ? "ar" : "en"}
                searchRadius={searchRadius}
              />
            )}
          </div>
        </div>
      </div>

      {/* Layered Payment Modal */}
      <PaymentMethodsModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoiceId || ""}
        price={pricingInfo.price}
        onPaymentSuccess={() => {
          setIsPaid(true);
          toast.success(isAr ? "تم سداد رسوم الخدمة بنجاح وتفعيل التقرير" : "Payment successful");
          if (rawPlaces.length > 0) {
            triggerReportGeneration(rawPlaces, propertyLocation, searchRadius);
          }
        }}
      />

      {/* Accessible Terms Disclaimer Dialog */}
      <ScanDisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
        checked={disclaimerChecked}
        onCheckChange={setDisclaimerChecked}
        onConfirm={() => {
          setAcceptedDisclaimer(true);
          setIsDisclaimerOpen(false);
          executeScan();
        }}
        locale={isAr ? "ar" : "en"}
      />

      {/* Report Compilation Progress Overlay */}
      <ScanGeneratingOverlay isGenerating={generatingReport} locale={isAr ? "ar" : "en"} />
    </main>
  );
}
