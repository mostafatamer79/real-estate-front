"use client";

import React, { useState } from "react";
import {
  MapPin,
  Crosshair,
  Sliders,
  RotateCcw,
  Table as TableIcon,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import {
  ScanPlaceWithDistance,
  PlaceStatistics,
  SAUDI_DISTRICT_PRESETS,
  formatDistance,
} from "@/lib/redesign-chat12-scan";
import { SaudiRiyalAmount } from "@/components/ui/saudi-riyal";
import styles from "./scan-map.module.css";

interface ScanMapControlsProps {
  propertyLocation: [number, number];
  onLocationChange: (loc: [number, number]) => void;
  isSelectingLocation: boolean;
  onToggleSelectingLocation: () => void;
  searchRadius: number;
  onRadiusChange: (radius: number) => void;
  onStartScan: () => void;
  onReset: () => void;
  onLocateMe: () => void;
  isLocating: boolean;
  isLoadingScan: boolean;
  places: ScanPlaceWithDistance[];
  stats: PlaceStatistics;
  showTable: boolean;
  onToggleTable: () => void;
  onExportCsv: () => void;
  error: string | null;
  onDismissError: () => void;
  pricingStatus: "loading" | "free" | "available" | "unavailable";
  reportPrice: number;
  isPaid: boolean;
  onRequestReportInvoice: () => void;
  isCreatingInvoice: boolean;
  isGeneratingReport: boolean;
  onRetryReportGeneration: () => void;
  generatedFilesCount: number;
  locale?: "ar" | "en";
}

export default function ScanMapControls({
  propertyLocation,
  onLocationChange,
  isSelectingLocation,
  onToggleSelectingLocation,
  searchRadius,
  onRadiusChange,
  onStartScan,
  onReset,
  onLocateMe,
  isLocating,
  isLoadingScan,
  places,
  stats,
  showTable,
  onToggleTable,
  onExportCsv,
  error,
  onDismissError,
  pricingStatus,
  reportPrice,
  isPaid,
  onRequestReportInvoice,
  isCreatingInvoice,
  isGeneratingReport,
  onRetryReportGeneration,
  generatedFilesCount,
  locale = "ar",
}: ScanMapControlsProps) {
  const isAr = locale === "ar";
  const [copiedCoords, setCopiedCoords] = useState(false);

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText(
        `${propertyLocation[0].toFixed(6)}, ${propertyLocation[1].toFixed(6)}`
      );
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    } catch {
      // ignore
    }
  };

  const hasPlaces = places.length > 0;
  const isFreeOrPaid = pricingStatus === "free" || isPaid;

  return (
    <aside className={styles.sidebar}>
      {/* 1. Location & Survey Controls Panel */}
      <section className={styles.panel} aria-labelledby="location-controls-title">
        <h2 id="location-controls-title" className={styles.panelTitle}>
          <MapPin size={18} className="text-amber-500" />
          <span>{isAr ? "تحديد الموقع ونطاق المسح" : "Survey Location & Radius"}</span>
        </h2>

        <div className={styles.controlGroup}>
          {/* Preset Selector */}
          <div>
            <label htmlFor="district-preset-select" className={styles.fieldLabel}>
              <span>{isAr ? "الأحياء والمدن النموذجية" : "Major Districts & Cities"}</span>
              <span style={{ fontSize: "0.6875rem", textTransform: "none", color: "var(--accent-brass)" }}>
                {isAr ? "اختيار سريع" : "Quick pick"}
              </span>
            </label>
            <select
              id="district-preset-select"
              className={styles.selectInput}
              aria-label={isAr ? "اختر حي أو مدينة نموذجية" : "Select district or city preset"}
              onChange={(e) => {
                const found = SAUDI_DISTRICT_PRESETS.find((p) => p.id === e.target.value);
                if (found) {
                  onLocationChange(found.location);
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>
                {isAr ? "-- اختر حي أو مدينة للتمركز السريع --" : "-- Choose a major district --"}
              </option>
              {SAUDI_DISTRICT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {isAr
                    ? `${preset.cityNameAr} - ${preset.nameAr}`
                    : `${preset.cityNameEn} - ${preset.nameEn}`}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinates readout and actions */}
          <div>
            <div className={styles.fieldLabel}>
              <span>{isAr ? "الإحداثيات الجغرافية المحددة" : "Selected Coordinates"}</span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className={styles.btnSecondary}
                style={{ height: "1.75rem", padding: "0 0.5rem", fontSize: "0.6875rem" }}
                aria-label={isAr ? "نسخ الإحداثيات" : "Copy coordinates"}
              >
                {copiedCoords ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                <span>{copiedCoords ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
              </button>
            </div>
            <div className={styles.coordCard}>
              <div className={styles.coordNumbers}>
                <div>LAT: {propertyLocation[0].toFixed(6)}</div>
                <div>LNG: {propertyLocation[1].toFixed(6)}</div>
              </div>
              <div style={{ display: "flex", gap: "0.35rem" }}>
                <button
                  type="button"
                  onClick={onToggleSelectingLocation}
                  className={`${styles.btnSecondary} ${
                    isSelectingLocation ? styles.btnSecondaryActive : ""
                  }`}
                  style={{ height: "2.25rem", padding: "0 0.65rem", fontSize: "0.75rem" }}
                  aria-pressed={isSelectingLocation}
                  aria-label={
                    isSelectingLocation
                      ? isAr
                        ? "إلغاء وضع النقر على الخريطة"
                        : "Cancel map click mode"
                      : isAr
                      ? "تفعيل النقر على الخريطة لتحديد موقع"
                      : "Click map to pick location"
                  }
                >
                  <MapPin size={14} />
                  <span>
                    {isSelectingLocation
                      ? isAr
                        ? "جاري التحديد..."
                        : "Click map..."
                      : isAr
                      ? "انقر بالخريطة"
                      : "Pick on map"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={onLocateMe}
                  disabled={isLocating}
                  className={styles.btnSecondary}
                  style={{ height: "2.25rem", padding: "0 0.65rem", fontSize: "0.75rem" }}
                  aria-label={isAr ? "استخدام موقعي الحالي" : "Locate my position"}
                >
                  {isLocating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                  <span>{isAr ? "موقعي" : "My GPS"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Radius Slider */}
          <div>
            <div className={styles.fieldLabel}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Sliders size={12} />
                {isAr ? "نصف قطر المسح" : "Scan Radius"}
              </span>
              <span style={{ color: "var(--accent-brass)", fontWeight: 800 }}>
                {formatDistance(searchRadius, locale)}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={searchRadius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className={styles.rangeSlider}
              aria-label={isAr ? "شريط تمرير نصف قطر المسح" : "Scan radius slider"}
            />
            <div className={styles.rangeMarks}>
              <span>500 {isAr ? "متر" : "m"}</span>
              <span>2.5 {isAr ? "كم" : "km"}</span>
              <span>5 {isAr ? "كم" : "km"}</span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onStartScan}
              disabled={isLoadingScan || isSelectingLocation}
              className={styles.btnPrimary}
              aria-busy={isLoadingScan}
            >
              {isLoadingScan ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{isAr ? "جاري مسح المرافق والخدمات..." : "Scanning amenities..."}</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} className="text-amber-400" />
                  <span>{isAr ? "بدء مسح الحي والخدمات" : "Start District Survey"}</span>
                </>
              )}
            </button>

            <div className={styles.btnToolbar}>
              <button
                type="button"
                onClick={onReset}
                disabled={isLoadingScan}
                className={styles.btnSecondary}
                style={{ flex: 1 }}
              >
                <RotateCcw size={14} />
                <span>{isAr ? "استعادة الافتراضي" : "Reset"}</span>
              </button>

              {hasPlaces && (
                <button
                  type="button"
                  onClick={onToggleTable}
                  className={`${styles.btnSecondary} ${showTable ? styles.btnSecondaryActive : ""}`}
                  style={{ flex: 1 }}
                  aria-pressed={showTable}
                >
                  <TableIcon size={14} />
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
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notice Banner: Location Selection Mode */}
      {isSelectingLocation && (
        <div className={styles.tipBanner} role="status">
          <MapPin size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <div style={{ fontWeight: 800, marginBottom: "0.15rem" }}>
              {isAr ? "وضع النقر المباشر مفعل" : "Interactive Pin Mode Active"}
            </div>
            <div>
              {isAr
                ? "انقر على أي نقطة في الخريطة لتغيير إحداثيات مركز المسح، ثم اضغط بدء المسح."
                : "Click anywhere on the map to place the survey center marker."}
            </div>
          </div>
        </div>
      )}

      {/* Notice Banner: Errors */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, marginBottom: "0.15rem" }}>
              {isAr ? "تنبيه في المسح" : "Survey Alert"}
            </div>
            <div>{error}</div>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className={styles.btnSecondary}
            style={{ height: "1.75rem", padding: "0 0.5rem", fontSize: "0.6875rem" }}
          >
            {isAr ? "تخطي" : "Dismiss"}
          </button>
        </div>
      )}

      {/* 2. Results Summary Panel (Shown when places exist) */}
      {hasPlaces && (
        <section className={styles.panel} aria-labelledby="scan-results-title">
          <h2 id="scan-results-title" className={styles.panelTitle}>
            <Layers size={18} className="text-emerald-500" />
            <span>{isAr ? "ملخص المؤشرات الجغرافية" : "Geospatial Summary"}</span>
          </h2>

          <div className={styles.statsGrid}>
            <div className={styles.statTile}>
              <div className={styles.statValue} style={{ color: "#10b981" }}>
                {stats.totalPlaces}
              </div>
              <div className={styles.statLabel}>{isAr ? "مرفق مكتشف" : "Places Found"}</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statValue} style={{ color: "#38bdf8" }}>
                {stats.uniqueTypesCount}
              </div>
              <div className={styles.statLabel}>{isAr ? "تصنيف مميز" : "Categories"}</div>
            </div>
          </div>

          {stats.topTypes.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div className={styles.fieldLabel} style={{ marginBottom: "0.5rem" }}>
                <span>{isAr ? "أبرز فئات الخدمات المحيطة" : "Top Surrounding Categories"}</span>
              </div>
              <div className={styles.typeList}>
                {stats.topTypes.slice(0, 5).map((stat) => (
                  <div key={stat.type} className={styles.typeRow}>
                    <span style={{ fontWeight: 600 }}>{stat.type}</span>
                    <span className={styles.typeRowBadge}>
                      {stat.count} ({stat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.closestPlace && (
            <div
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "0.75rem",
                padding: "0.75rem",
                fontSize: "0.75rem",
                marginBottom: "0.875rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>{isAr ? "أقرب مرفق:" : "Closest:"}</span>
              <span style={{ fontWeight: 700, color: "var(--text-main)" }}>
                {stats.closestPlace.name} ({formatDistance(stats.closestPlace.distance, locale)})
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onExportCsv}
              className={styles.btnSecondary}
              style={{ flex: 1 }}
              aria-label={isAr ? "تصدير النتائج كملف CSV" : "Export places to CSV"}
            >
              <Download size={14} />
              <span>{isAr ? "تصدير CSV" : "Export CSV"}</span>
            </button>
            <a
              href="/wallet?tab=files"
              className={styles.btnSecondary}
              style={{ flex: 1, textDecoration: "none" }}
            >
              <FileText size={14} />
              <span>{isAr ? "خزينة الملفات" : "My Files"}</span>
            </a>
          </div>

          {generatedFilesCount > 0 && (
            <div
              style={{
                marginTop: "0.75rem",
                textAlign: "center",
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#10b981",
              }}
            >
              {isAr
                ? `تم توليد وحفظ ${generatedFilesCount} ملفات رسمية في حسابك.`
                : `${generatedFilesCount} official report files generated & saved.`}
            </div>
          )}
        </section>
      )}

      {/* 3. Official Neighborhood Report Service Card */}
      <section className={styles.panel} aria-labelledby="report-service-title">
        <h2 id="report-service-title" className={styles.panelTitle}>
          <FileText size={18} className="text-amber-500" />
          <span>{isAr ? "خدمة التقرير الرقمي للحي" : "Official District Report"}</span>
        </h2>

        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 0.875rem" }}>
          {isAr
            ? "استخرج تحليلاً مساحياً موثقاً بصيغتي PDF و Excel مع خريطة الموقع وتصنيف المنشآت المحيطة."
            : "Generate an authenticated spatial dossier in PDF & Excel containing location charts and amenity tables."}
        </p>

        {/* Pricing line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "var(--bg-surface-elevated)",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid var(--border-subtle)",
            marginBottom: "0.875rem",
          }}
        >
          <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {isAr ? "رسوم استخراج التقرير" : "Report Generation Fee"}
          </span>
          <span style={{ fontWeight: 800, fontSize: "0.9375rem" }}>
            {pricingStatus === "loading" ? (
              <span style={{ color: "var(--text-muted)" }}>{isAr ? "جاري التحقق..." : "Checking..."}</span>
            ) : pricingStatus === "free" ? (
              <span style={{ color: "#10b981" }}>{isAr ? "مشمول مجاناً" : "Included Free"}</span>
            ) : pricingStatus === "available" ? (
              <span style={{ color: "var(--accent-brass)" }}>
                <SaudiRiyalAmount amount={reportPrice} locale={isAr ? "ar-SA" : "en-US"} />
              </span>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                {isAr ? "غير متوفر حالياً" : "Unavailable"}
              </span>
            )}
          </span>
        </div>

        {/* Payment / Unlock Status */}
        {isFreeOrPaid ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10b981",
                padding: "0.625rem 0.875rem",
                borderRadius: "0.75rem",
                textAlign: "center",
                fontSize: "0.8125rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <CheckCircle2 size={16} />
              <span>{isAr ? "الخدمة مفعلة وجاهزة للاستخراج" : "Report Service Unlocked"}</span>
            </div>

            {hasPlaces && (
              <button
                type="button"
                onClick={onRetryReportGeneration}
                disabled={isGeneratingReport}
                className={styles.btnSecondary}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{isAr ? "جاري إنشاء التقرير..." : "Generating files..."}</span>
                  </>
                ) : (
                  <>
                    <FileText size={14} />
                    <span>{isAr ? "توليد ملفات PDF و Excel مجدداً" : "Regenerate PDF & Excel"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onRequestReportInvoice}
            disabled={isCreatingInvoice || pricingStatus === "unavailable" || pricingStatus === "loading"}
            className={styles.btnPrimary}
            style={{ width: "100%", height: "2.75rem" }}
          >
            {isCreatingInvoice ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>{isAr ? "جاري إعداد الفاتورة..." : "Preparing invoice..."}</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                <span>{isAr ? "طلب التقرير والدفع الآن" : "Order Report & Pay"}</span>
              </>
            )}
          </button>
        )}
      </section>
    </aside>
  );
}
