"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Crosshair,
  Download,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Plus,
  Table as TableIcon,
  X,
} from "lucide-react";
import { Place } from "@/types/map";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";
import { useSectionGuard } from "@/hooks/useSectionGuard";
import PaymentMethodsModal from "@/components/Payment/PaymentMethodsModal";
import ComingSoonOverlay from "@/components/ComingSoonOverlay";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import { financialApi } from "@/lib/api";
import {
  ATLAS_CATEGORIES,
  AtlasCategoryKey,
  categorizePlaceType,
  classifyGeolocationError,
  computePlaceStatistics,
  computeZoomForRadius,
  derivePricingStatus,
  findNearestDistrictPreset,
  formatCoordinatesDms,
  formatDistance,
  generateScanCsv,
  resolvePlacesApiUrl,
  sortPlacesByDistance,
  validatePlacesResponse,
  ScanPlaceWithDistance,
} from "@/lib/redesign-chat12-scan";
import AtlasScanSidebar from "@/components/redesign/chat12/AtlasScanSidebar";
import ScanResultsTable from "@/components/redesign/chat12/ScanResultsTable";
import ScanDisclaimerModal from "@/components/redesign/chat12/ScanDisclaimerModal";
import ScanGeneratingOverlay from "@/components/redesign/chat12/ScanGeneratingOverlay";
import styles from "@/components/redesign/chat12/atlas-scan.module.css";

const AtlasMap = dynamic(() => import("@/components/redesign/chat12/AtlasMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-live="polite"
      className={styles.atlasMapContainer}
      style={{ display: "grid", placeItems: "center", color: "#94a3b8" }}
    >
      <span>جاري تحميل الخريطة الجغرافية...</span>
    </div>
  ),
});

const DEFAULT_LOCATION: [number, number] = [24.7136, 46.6753]; // Riyadh, Al Olaya
const DEFAULT_RADIUS = 2000; // 2 km

export default function ScanMapPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { isOpen, message, isAdmin } = useSectionGuard("scan_map");
  const { settings, isLoading: settingsLoading } = useSettings();

  // Core Survey State
  const [propertyLocation, setPropertyLocation] = useState<[number, number]>(DEFAULT_LOCATION);
  const [customLocationLabel, setCustomLocationLabel] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(DEFAULT_RADIUS);
  const [panTrigger, setPanTrigger] = useState<number>(0);
  const [rawPlaces, setRawPlaces] = useState<Place[]>([]);
  const [hasScanned, setHasScanned] = useState<boolean>(false);
  const [isOutdated, setIsOutdated] = useState<boolean>(false);
  const [loadingScan, setLoadingScan] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Atlas UI State
  const [mobileControlsOpen, setMobileControlsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<AtlasCategoryKey>("all");
  const [selectedPlace, setSelectedPlace] = useState<ScanPlaceWithDistance | null>(null);
  const [mapScaleLabel, setMapScaleLabel] = useState<string>(isAr ? "500 م" : "500 m");

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

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const mapCaptureRef = useRef<HTMLDivElement | null>(null);
  const mapActionsRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    centerOnMarker: (target?: [number, number], targetZoom?: number) => void;
  } | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Escape closes place detail card
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedPlace) {
        setSelectedPlace(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedPlace]);

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined") {
      // Prefer Navigation API when available to avoid going back to about:blank or external sites
      const nav = (
        window as unknown as {
          navigation?: {
            currentEntry?: { index?: number };
            entries?: () => Array<{ url?: string | null }>;
          };
        }
      ).navigation;

      if (nav?.entries && nav.currentEntry && typeof nav.currentEntry.index === "number") {
        const idx = nav.currentEntry.index;
        const prevUrl = idx > 0 ? nav.entries()[idx - 1]?.url : null;
        if (prevUrl && prevUrl.startsWith(window.location.origin)) {
          router.back();
          return;
        }
        router.push("/");
        return;
      }

      let isSameOriginReferrer = false;
      if (document.referrer) {
        try {
          isSameOriginReferrer = new URL(document.referrer).origin === window.location.origin;
        } catch {
          isSameOriginReferrer = false;
        }
      }
      if (window.history.length > 1 && isSameOriginReferrer) {
        router.back();
        return;
      }
    }
    router.push("/");
  }, [router]);

  // Pricing Status Derivation
  const isMapFree = settings?.uiFlags?.is_map_free ?? false;
  const pricingInfo = useMemo(() => {
    return derivePricingStatus(settings?.servicePrices, isMapFree, settingsLoading);
  }, [settings?.servicePrices, isMapFree, settingsLoading]);

  const isFreeOrPaid = pricingInfo.status === "free" || isPaid;

  // Distance Sorting & Place Statistics
  const sortedPlaces: ScanPlaceWithDistance[] = useMemo(() => {
    return sortPlacesByDistance(rawPlaces, propertyLocation[0], propertyLocation[1]);
  }, [rawPlaces, propertyLocation]);

  const placeStats = useMemo(() => {
    return computePlaceStatistics(sortedPlaces);
  }, [sortedPlaces]);

  // Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AtlasCategoryKey, number> = {
      all: sortedPlaces.length,
      education: 0,
      health: 0,
      shopping: 0,
      parks: 0,
      dining: 0,
      worship: 0,
      other: 0,
    };
    for (const p of sortedPlaces) {
      const cat = categorizePlaceType(p.type);
      counts[cat] += 1;
    }
    return counts;
  }, [sortedPlaces]);

  const dynamicZoom = useMemo(() => computeZoomForRadius(searchRadius), [searchRadius]);

  // Human-readable location label (preset if nearby, custom search label, or coordinates)
  const resolvedLocationLabel = useMemo(() => {
    if (customLocationLabel) return customLocationLabel;
    const nearest = findNearestDistrictPreset(propertyLocation[0], propertyLocation[1]);
    if (nearest) {
      return isAr ? `${nearest.cityNameAr}، ${nearest.nameAr}` : `${nearest.cityNameEn}, ${nearest.nameEn}`;
    }
    return isAr
      ? `نقطة مخصصة (${propertyLocation[0].toFixed(4)}, ${propertyLocation[1].toFixed(4)})`
      : `Custom Point (${propertyLocation[0].toFixed(4)}, ${propertyLocation[1].toFixed(4)})`;
  }, [customLocationLabel, propertyLocation, isAr]);

  const dmsCoords = useMemo(
    () => formatCoordinatesDms(propertyLocation[0], propertyLocation[1]),
    [propertyLocation]
  );

  // Location change handler (from map click, marker drag, search, or manual coords)
  const handleSelectLocation = useCallback(
    (lat: number, lng: number, label?: string, panTo: boolean = false) => {
      setPropertyLocation([lat, lng]);
      setCustomLocationLabel(label ?? null);
      setSelectedPlace(null);
      setError(null);
      if (hasScanned) {
        setIsOutdated(true);
      }
      if (panTo) {
        setPanTrigger((n) => n + 1);
      }
    },
    [hasScanned]
  );

  // Radius change handler
  const handleRadiusChange = useCallback(
    (radiusMeters: number) => {
      setSearchRadius(radiusMeters);
      if (hasScanned) {
        setIsOutdated(true);
      }
    },
    [hasScanned]
  );

  // Geolocation Handler (only triggered on explicit user action)
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
        handleSelectLocation(latitude, longitude, isAr ? "موقعي الحالي" : "My Current Location", true);
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
  }, [isAr, handleSelectLocation]);

  // Capture map image for report generation fallback
  const captureMapImage = useCallback(async () => {
    if (!mapCaptureRef.current) return undefined;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapCaptureRef.current, {
        backgroundColor: "#0a0e17",
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
      });
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      return undefined;
    }
  }, []);

  // Report Generator Function
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
        if (isMountedRef.current) {
          const errRecord = reportErr as { response?: { status?: number } };
          if (errRecord?.response?.status === 401) {
            toast.error(
              isAr
                ? "تم المسح بنجاح! يُرجى تسجيل الدخول لحفظ التقرير الرسمي تلقائياً في حسابك."
                : "Scan complete. Sign in to sync the official report to your files."
            );
          } else {
            toast.error(
              isAr
                ? "تم المسح بنجاح. تعذر إصدار ملف التقرير حالياً؛ يمكنك إعادة المحاولة."
                : "Survey finished. Report generation can be retried."
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

  // Cancel Scan
  const handleCancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoadingScan(false);
  }, []);

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
    setSelectedPlace(null);
    setMobileControlsOpen(false);

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
        headers: { Accept: "application/json" },
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
        setHasScanned(true);
        setIsOutdated(false);
        setActiveCategory("all");

        if (validation.places.length === 0) {
          toast(
            isAr
              ? `لم يتم العثور على مرافق مسجلة ضمن دائرة قطرها ${searchRadius}م.`
              : `No registered facilities found within ${searchRadius}m.`,
            { icon: "📍" }
          );
        } else {
          toast.success(
            isAr
              ? `تم اكتشاف ${validation.places.length} مرفق بنجاح`
              : `Found ${validation.places.length} places`
          );

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

  const handleStartScan = useCallback(() => {
    if (!acceptedDisclaimer) {
      setDisclaimerChecked(false);
      setIsDisclaimerOpen(true);
      return;
    }
    executeScan();
  }, [acceptedDisclaimer, executeScan]);

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
    } catch {
      toast.error(isAr ? "تعذر تصدير ملف CSV" : "Failed to export CSV");
    }
  }, [sortedPlaces, propertyLocation, isAr]);

  const handleReset = useCallback(() => {
    handleCancelScan();
    setPropertyLocation(DEFAULT_LOCATION);
    setCustomLocationLabel(null);
    setSearchRadius(DEFAULT_RADIUS);
    setRawPlaces([]);
    setHasScanned(false);
    setIsOutdated(false);
    setSelectedPlace(null);
    setActiveCategory("all");
    setError(null);
    setShowTable(false);
    setGeneratedFiles([]);
    setPanTrigger((n) => n + 1);
  }, [handleCancelScan]);

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
        throw new Error("Missing invoice identifier");
      }
    } catch {
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

  const mapStatusText = loadingScan
    ? isAr
      ? "جارٍ مسح الحي"
      : "Scanning area"
    : isOutdated && hasScanned
    ? isAr
      ? "نتائج سابقة — أعد المسح"
      : "Outdated — Re-scan"
    : hasScanned
    ? isAr
      ? `تم المسح (${sortedPlaces.length})`
      : `Scanned (${sortedPlaces.length})`
    : isAr
    ? "نطاق المسح جاهز"
    : "Survey range ready";

  return (
    <div className={styles.atlasRoot} dir={isAr ? "rtl" : "ltr"}>
      <a className={styles.skipLink} href="#atlas-workspace">
        {isAr ? "انتقل إلى أدوات المسح" : "Skip to survey controls"}
      </a>

      <div className={styles.atlasShell}>
        <div className={styles.atlasWorkspace} id="atlas-workspace" tabIndex={-1}>
          {/* Floating Atlas Heading */}
          <section className={styles.atlasHeading} aria-labelledby="atlas-page-title">
            <div>
              <h1 id="atlas-page-title" className={styles.atlasHeadingTitle}>
                {isAr ? "أطلس الحي." : "Neighborhood Atlas."}
              </h1>
              <p className={styles.atlasHeadingSub}>
                {isAr ? "المكان كما لم تقرأه من قبل." : "The neighborhood, read with clarity."}
              </p>
            </div>
            <div className={styles.atlasIndex}>
              <span>{resolvedLocationLabel}</span>
              <strong dir="ltr">{dmsCoords}</strong>
              <span className={styles.atlasIndexBadge}>
                {isAr ? "مسح جغرافي فعلي" : "Live Geospatial Survey"}
              </span>
            </div>
          </section>

          {/* Floating Controls Dock: Back Button + Survey Sidebar */}
          <div className={styles.controlsDock}>
            <button
              type="button"
              onClick={handleBack}
              className={styles.backButton}
              aria-label={isAr ? "رجوع إلى الصفحة السابقة" : "Back to previous page"}
            >
              {isAr ? <ArrowRight size={15} aria-hidden="true" /> : <ArrowLeft size={15} aria-hidden="true" />}
              <span>{isAr ? "رجوع" : "Back"}</span>
            </button>

            <AtlasScanSidebar
              propertyLocation={propertyLocation}
              searchRadius={searchRadius}
              isLoadingScan={loadingScan}
              isLocating={isLocating}
              isOutdated={isOutdated}
              hasResults={hasScanned}
              placesCount={sortedPlaces.length}
              error={error}
              locale={isAr ? "ar" : "en"}
              mobileOpen={mobileControlsOpen}
              onToggleMobileOpen={() => setMobileControlsOpen((prev) => !prev)}
              onSelectLocation={handleSelectLocation}
              onRadiusChange={handleRadiusChange}
              onStartScan={handleStartScan}
              onCancelScan={handleCancelScan}
              onReset={handleReset}
              onLocateMe={handleLocateMe}
              onDismissError={() => setError(null)}
            />
          </div>

          {/* Edge-to-Edge Interactive Map */}
          <section className={styles.mapColumn} aria-label={isAr ? "خريطة المسح الجغرافي" : "Geospatial survey map"}>
            <div ref={mapCaptureRef} className={styles.mapFrame} aria-busy={loadingScan}>
              <AtlasMap
                center={propertyLocation}
                radiusMeters={searchRadius}
                zoom={dynamicZoom}
                panTrigger={panTrigger}
                places={sortedPlaces}
                activeCategory={activeCategory}
                selectedPlaceId={selectedPlace?.id ?? null}
                isOutdated={isOutdated}
                locale={isAr ? "ar" : "en"}
                onCenterChange={(lat, lng) => handleSelectLocation(lat, lng, undefined, false)}
                onSelectPlace={(place) => setSelectedPlace(place)}
                onScaleLabelChange={setMapScaleLabel}
                onMapReady={(actions) => {
                  mapActionsRef.current = actions;
                }}
              />

              {/* Map Top Line */}
              <div className={styles.mapTopline}>
                <div className={styles.mapToplineLoc}>
                  <MapPin size={15} className="text-amber-500 shrink-0" aria-hidden="true" />
                  <h2>{resolvedLocationLabel}</h2>
                </div>
                <span
                  className={`${styles.mapState} ${isOutdated && hasScanned ? styles.mapStateOutdated : ""}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className={styles.mapStateDot} aria-hidden="true" />
                  {mapStatusText}
                </span>
              </div>

              {/* Map Tools */}
              <div className={styles.mapTools} role="group" aria-label={isAr ? "أدوات الخريطة" : "Map tools"}>
                <button
                  type="button"
                  onClick={() => mapActionsRef.current?.zoomIn()}
                  aria-label={isAr ? "تقريب الخريطة" : "Zoom in"}
                >
                  <Plus size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => mapActionsRef.current?.zoomOut()}
                  aria-label={isAr ? "إبعاد الخريطة" : "Zoom out"}
                >
                  <Minus size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => mapActionsRef.current?.centerOnMarker(propertyLocation, dynamicZoom)}
                  aria-label={isAr ? "تمركز على نقطة المسح" : "Center on scan point"}
                >
                  <Crosshair size={16} aria-hidden="true" />
                </button>
              </div>

              {/* North Indicator */}
              <div className={styles.mapNorth} aria-hidden="true">
                <span>N</span>
                <Compass size={20} />
              </div>

              {/* Radius Pill */}
              <span className={styles.mapRadiusLabel}>
                {isAr
                  ? `نطاق ${(searchRadius / 1000).toFixed(1)} كم`
                  : `${(searchRadius / 1000).toFixed(1)} km radius`}
              </span>

              {/* Scan Sweep Overlay */}
              {loadingScan && <div className={styles.scanSweep} aria-hidden="true" />}

              {/* Selected Place Detail Card */}
              {selectedPlace && (
                <div className={styles.placeDetail} role="dialog" aria-label={selectedPlace.name}>
                  <div>
                    <strong>{selectedPlace.name}</strong>
                    <p>
                      {selectedPlace.type} · {formatDistance(selectedPlace.distance, isAr ? "ar" : "en")}
                      {selectedPlace.city ? ` · ${selectedPlace.city}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.placeDetailClose}
                    onClick={() => setSelectedPlace(null)}
                    aria-label={isAr ? "إغلاق تفاصيل الخدمة" : "Close place details"}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Real Category Filters */}
              {hasScanned && sortedPlaces.length > 0 && (
                <div className={styles.mapFilters} role="group" aria-label={isAr ? "تصنيف الخدمات" : "Filter services"}>
                  {ATLAS_CATEGORIES.filter((cat) => cat.key === "all" || categoryCounts[cat.key] > 0).map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      className={styles.filterBtn}
                      aria-pressed={activeCategory === cat.key}
                      onClick={() => {
                        setActiveCategory(cat.key);
                        setSelectedPlace(null);
                      }}
                    >
                      <span>{isAr ? cat.labelAr : cat.labelEn}</span>
                      <span className={styles.filterCount}>{categoryCounts[cat.key]}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Real Summary Strip (no illustrative/placeholder metrics) */}
              <div className={styles.summaryStrip} aria-label={isAr ? "ملخص نطاق المسح" : "Survey summary"}>
                <div className={styles.summaryCell}>
                  <span>{isAr ? "داخل نطاق المسح" : "Within Scan Range"}</span>
                  <strong>
                    {hasScanned ? sortedPlaces.length : "—"}{" "}
                    <small>{isAr ? "منشأة وخدمة" : "places"}</small>
                  </strong>
                </div>
                <div className={styles.summaryCell}>
                  <span>{isAr ? "التصنيفات المكتشفة" : "Categories Found"}</span>
                  <strong>
                    {hasScanned ? placeStats.uniqueTypesCount : "—"}{" "}
                    <small>
                      {hasScanned && placeStats.closestPlace
                        ? isAr
                          ? `· الأقرب ${formatDistance(placeStats.closestPlace.distance, "ar")}`
                          : `· Closest ${formatDistance(placeStats.closestPlace.distance, "en")}`
                        : isAr
                        ? "تصنيف"
                        : "types"}
                    </small>
                  </strong>
                </div>
                <div className={styles.summaryCell}>
                  <span>{isAr ? "مساحة الاستكشاف" : "Exploration Area"}</span>
                  <strong>
                    {(Math.PI * Math.pow(searchRadius / 1000, 2)).toFixed(1)}
                    <small> {isAr ? "كم²" : "km²"}</small>
                  </strong>
                </div>
              </div>

              {/* Map Bottom Scale Bar */}
              <div className={styles.mapBottomline}>
                <span>OpenStreetMap · {isAr ? "إحداثيات حقيقية" : "Live Coordinates"}</span>
                <span className={styles.mapScale} aria-hidden="true">
                  {mapScaleLabel}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Report & Export Callout below map */}
        <section className={styles.reportSectionWrap} aria-labelledby="atlas-report-title">
          <div className={styles.reportCallout}>
            <div className={styles.reportHeading}>
              <FileText size={26} className="text-amber-500 shrink-0" aria-hidden="true" />
              <div>
                <h2 id="atlas-report-title">
                  {isAr ? "من الخريطة إلى القرار." : "From Map to Decision."}
                </h2>
                <p>
                  {isAr
                    ? "تقرير شامل للحي، جاهز للمشاركة بصيغتي PDF و Excel."
                    : "Authenticated neighborhood report in PDF & Excel."}
                </p>
              </div>
            </div>

            <div className={styles.reportActions}>
              <div className={styles.reportPricePill}>
                <span>{isAr ? "رسوم التقرير:" : "Fee:"}</span>
                <strong>
                  {pricingInfo.status === "loading" ? (
                    isAr ? "جاري التحقق..." : "Checking..."
                  ) : pricingInfo.status === "free" ? (
                    isAr ? "مشمول مجاناً" : "Free"
                  ) : pricingInfo.status === "available" ? (
                    <SaudiRiyalAmount amount={pricingInfo.price} locale={isAr ? "ar-SA" : "en-US"} />
                  ) : (
                    isAr ? "غير متوفر" : "Unavailable"
                  )}
                </strong>
              </div>

              {isFreeOrPaid ? (
                <>
                  {sortedPlaces.length > 0 && (
                    <button
                      type="button"
                      onClick={() => triggerReportGeneration(rawPlaces, propertyLocation, searchRadius)}
                      disabled={generatingReport}
                      className={`${styles.reportButton} ${styles.reportButtonPrimary}`}
                    >
                      {generatingReport ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <FileText size={15} />
                      )}
                      <span>
                        {generatingReport
                          ? isAr
                            ? "جارٍ توليد التقرير..."
                            : "Generating..."
                          : isAr
                          ? "توليد تقرير PDF و Excel"
                          : "Generate PDF & Excel"}
                      </span>
                    </button>
                  )}
                  <Link href="/wallet?tab=files" className={styles.reportButton}>
                    <FileText size={15} />
                    <span>
                      {generatedFiles.length > 0
                        ? isAr
                          ? `خزينة الملفات (${generatedFiles.length})`
                          : `My Files (${generatedFiles.length})`
                        : isAr
                        ? "خزينة الملفات"
                        : "My Files"}
                    </span>
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestReportInvoice}
                  disabled={
                    creatingInvoice ||
                    pricingInfo.status === "unavailable" ||
                    pricingInfo.status === "loading"
                  }
                  className={`${styles.reportButton} ${styles.reportButtonPrimary}`}
                >
                  {creatingInvoice ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
                  <span>{isAr ? "طلب التقرير والدفع الآن" : "Order Report & Pay"}</span>
                </button>
              )}

              {sortedPlaces.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowTable((prev) => !prev)}
                    className={styles.reportButton}
                    aria-pressed={showTable}
                  >
                    <TableIcon size={15} />
                    <span>
                      {showTable
                        ? isAr
                          ? "إخفاء الجدول"
                          : "Hide Table"
                        : isAr
                        ? "عرض الجدول"
                        : "Show Table"}
                    </span>
                  </button>
                  <button type="button" onClick={handleExportCsv} className={styles.reportButton}>
                    <Download size={15} />
                    <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {showTable && sortedPlaces.length > 0 && (
            <ScanResultsTable
              places={sortedPlaces}
              onClose={() => setShowTable(false)}
              locale={isAr ? "ar" : "en"}
              searchRadius={searchRadius}
            />
          )}
        </section>
      </div>

      {/* Payment Modal */}
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

      {/* Disclaimer Modal */}
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
    </div>
  );
}
