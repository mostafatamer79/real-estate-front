"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Crosshair,
  Edit3,
  Loader2,
  MapPin,
  RotateCcw,
  Scan,
  Search,
  X,
} from "lucide-react";
import { SAUDI_DISTRICT_PRESETS } from "@/lib/redesign-chat12-scan";
import styles from "./atlas-scan.module.css";

interface SearchResultItem {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
}

export interface AtlasScanSidebarProps {
  propertyLocation: [number, number];
  searchRadius: number;
  isLoadingScan: boolean;
  isLocating: boolean;
  isOutdated: boolean;
  hasResults: boolean;
  placesCount: number;
  error: string | null;
  locale: "ar" | "en";
  mobileOpen: boolean;
  onToggleMobileOpen: () => void;
  onSelectLocation: (lat: number, lng: number, label?: string, panTo?: boolean) => void;
  onRadiusChange: (radiusMeters: number) => void;
  onStartScan: () => void;
  onCancelScan: () => void;
  onReset: () => void;
  onLocateMe: () => void;
  onDismissError: () => void;
}

export default function AtlasScanSidebar({
  propertyLocation,
  searchRadius,
  isLoadingScan,
  isLocating,
  isOutdated,
  hasResults,
  placesCount,
  error,
  locale,
  mobileOpen,
  onToggleMobileOpen,
  onSelectLocation,
  onRadiusChange,
  onStartScan,
  onCancelScan,
  onReset,
  onLocateMe,
  onDismissError,
}: AtlasScanSidebarProps) {
  const isAr = locale === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState(propertyLocation[0].toFixed(6));
  const [manualLng, setManualLng] = useState(propertyLocation[1].toFixed(6));
  const [coordInputError, setCoordInputError] = useState<string | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setManualLat(propertyLocation[0].toFixed(6));
    setManualLng(propertyLocation[1].toFixed(6));
  }, [propertyLocation]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Local preset matches
  const localMatches = useMemo<SearchResultItem[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SAUDI_DISTRICT_PRESETS.filter((p) => {
      const text = `${p.cityNameAr} ${p.nameAr} ${p.cityNameEn} ${p.nameEn}`.toLowerCase();
      return text.includes(q);
    }).map((p) => ({
      id: `preset-${p.id}`,
      label: isAr ? `${p.cityNameAr}، ${p.nameAr}` : `${p.cityNameEn}, ${p.nameEn}`,
      sublabel: isAr ? "موقع مقترح" : "Suggested",
      lat: p.location[0],
      lng: p.location[1],
    }));
  }, [searchQuery, isAr]);

  // Debounced Nominatim geocoding search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          q
        )}&countrycodes=sa&limit=5&accept-language=${isAr ? "ar,en" : "en,ar"}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as Array<{
          place_id: number;
          display_name: string;
          lat: string;
          lon: string;
        }>;
        const mapped: SearchResultItem[] = data
          .map((item) => {
            const parts = item.display_name.split(",").map((s) => s.trim());
            return {
              id: `nom-${item.place_id}`,
              label: parts.slice(0, 2).join("، "),
              sublabel: parts.slice(2, 4).join("، "),
              lat: Number(item.lat),
              lng: Number(item.lon),
            };
          })
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));
        setRemoteResults(mapped);
      } catch (err) {
        if ((err as { name?: string })?.name !== "AbortError") {
          setRemoteResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, isAr]);

  const combinedResults = useMemo(() => {
    const merged = [...localMatches];
    for (const r of remoteResults) {
      if (!merged.some((m) => Math.abs(m.lat - r.lat) < 0.005 && Math.abs(m.lng - r.lng) < 0.005)) {
        merged.push(r);
      }
    }
    return merged.slice(0, 6);
  }, [localMatches, remoteResults]);

  const handleApplyManualCoords = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = Number(manualLat);
    const lng = Number(manualLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setCoordInputError(
        isAr ? "يرجى إدخال إحداثيات صالحة (Lat: -90..90, Lng: -180..180)" : "Enter valid coordinates"
      );
      return;
    }
    setCoordInputError(null);
    onSelectLocation(lat, lng, undefined, true);
    setShowManualCoords(false);
  };

  const radiusKm = searchRadius / 1000;
  const rangePercent = ((searchRadius - 500) / 4500) * 100;

  let statusText = isAr
    ? "اختر موقعك ونطاقك لاستكشاف الخدمات."
    : "Choose your location and radius to explore services.";
  let statusState: "idle" | "success" | "error" | "outdated" = "idle";

  if (isLoadingScan) {
    statusText = isAr ? "جارٍ مسح المرافق والخدمات الفعلية..." : "Scanning real facilities and services...";
  } else if (error) {
    statusText = error;
    statusState = "error";
  } else if (isOutdated && hasResults) {
    statusText = isAr
      ? "تم تغيير الموقع أو النطاق. أعد المسح لتحديث النتائج."
      : "Location or radius changed. Re-scan to update results.";
    statusState = "outdated";
  } else if (hasResults) {
    statusText =
      placesCount > 0
        ? isAr
          ? `اكتمل المسح: ${placesCount} مرفق ضمن نطاق ${radiusKm.toFixed(1)} كم.`
          : `Scan complete: ${placesCount} facilities within ${radiusKm.toFixed(1)} km.`
        : isAr
        ? `لا توجد مرافق مسجلة ضمن ${radiusKm.toFixed(1)} كم. جرّب توسيع النطاق.`
        : `No facilities found within ${radiusKm.toFixed(1)} km. Try expanding the radius.`;
    statusState = placesCount > 0 ? "success" : "idle";
  }

  return (
    <aside className={styles.surveySidebar} aria-label={isAr ? "إعدادات المسح" : "Survey settings"}>
      <button
        type="button"
        className={styles.controlsToggle}
        aria-expanded={mobileOpen}
        aria-controls="atlas-survey-settings"
        onClick={onToggleMobileOpen}
      >
        <span>{isAr ? "إعدادات المسح" : "Survey Settings"}</span>
        <ChevronDown className={styles.controlsToggleIcon} aria-hidden="true" />
      </button>

      <div className={styles.surveySettings} id="atlas-survey-settings">
        <div className={styles.sidebarTitle}>
          <Crosshair size={22} className="text-amber-500 shrink-0" aria-hidden="true" />
          <div>
            <h2>{isAr ? "صمّم نطاق رؤيتك" : "Design Your Survey"}</h2>
            <p>{isAr ? "موقع واحد. صورة أوضح." : "One location. Clearer picture."}</p>
          </div>
        </div>

        {/* Map-click guidance */}
        <div className={styles.guidanceHint}>
          <MapPin size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
          <span>{isAr ? "اضغط على الخريطة لتحديد موقع المسح" : "Click or tap the map to set scan center"}</span>
        </div>

        {/* Location Search */}
        <div className={styles.searchBlock} ref={searchWrapRef}>
          <label htmlFor="atlas-location-search" className={styles.fieldLabel}>
            <span>{isAr ? "البحث عن موقع أو حي" : "Search location or district"}</span>
          </label>
          <div className={styles.searchInputWrap}>
            <Search className={styles.searchIcon} aria-hidden="true" />
            <input
              id="atlas-location-search"
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setDropdownOpen(true);
              }}
              placeholder={isAr ? "ابحث عن حي أو مدينة..." : "Search district or city..."}
              className={styles.searchInput}
              autoComplete="off"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => {
                  setSearchQuery("");
                  setRemoteResults([]);
                  setDropdownOpen(false);
                }}
                aria-label={isAr ? "مسح البحث" : "Clear search"}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {dropdownOpen && (searchQuery.trim().length >= 2 || combinedResults.length > 0) && (
            <div className={styles.searchDropdown} role="listbox" aria-label={isAr ? "نتائج البحث" : "Search results"}>
              {isSearching && combinedResults.length === 0 && (
                <div className={styles.searchOption} style={{ color: "#94a3b8", cursor: "default" }}>
                  <span>{isAr ? "جارٍ البحث..." : "Searching..."}</span>
                  <Loader2 size={13} className="animate-spin" />
                </div>
              )}
              {!isSearching && combinedResults.length === 0 && (
                <div className={styles.searchOption} style={{ color: "#94a3b8", cursor: "default" }}>
                  <span>{isAr ? "لا توجد نتائج مطابقة" : "No matching locations"}</span>
                </div>
              )}
              {combinedResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={styles.searchOption}
                  onClick={() => {
                    onSelectLocation(item.lat, item.lng, item.label, true);
                    setSearchQuery(item.label);
                    setDropdownOpen(false);
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                  {item.sublabel && (
                    <small style={{ color: "#64748b", flexShrink: 0 }}>{item.sublabel}</small>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Coordinates + Geolocation + Accessible Manual Entry */}
        <div className={styles.coordinateField}>
          <div className={styles.fieldLabel}>
            <span>{isAr ? "مركز المسح" : "Scan Center"}</span>
            <div className={styles.coordActionsRow}>
              <button
                type="button"
                onClick={onLocateMe}
                disabled={isLocating}
                className={styles.coordActionBtn}
                aria-label={isAr ? "استخدام موقعي الحالي" : "Use my current location"}
              >
                {isLocating ? <Loader2 size={11} className="animate-spin" /> : <Crosshair size={11} />}
                <span>{isAr ? "استخدام موقعي" : "Use my location"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowManualCoords((prev) => !prev)}
                aria-expanded={showManualCoords}
                className={styles.coordActionBtn}
                aria-label={isAr ? "إدخال الإحداثيات يدوياً" : "Enter coordinates manually"}
                title={isAr ? "تعديل الإحداثيات يدوياً" : "Edit coordinates"}
              >
                <Edit3 size={11} />
              </button>
            </div>
          </div>

          <div className={styles.coordBox} dir="ltr">
            <span>
              <small>LAT </small>
              <b>{propertyLocation[0].toFixed(6)}</b>
            </span>
            <span>
              <small>LNG </small>
              <b>{propertyLocation[1].toFixed(6)}</b>
            </span>
          </div>

          {showManualCoords && (
            <form onSubmit={handleApplyManualCoords} className={styles.manualCoordsForm}>
              <div className={styles.manualCoordsInputs} dir="ltr">
                <label>
                  <span>Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    aria-label={isAr ? "خط العرض" : "Latitude"}
                  />
                </label>
                <label>
                  <span>Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    aria-label={isAr ? "خط الطول" : "Longitude"}
                  />
                </label>
              </div>
              {coordInputError && <span style={{ color: "#f87171", fontSize: "10px" }}>{coordInputError}</span>}
              <button type="submit" className={styles.manualApplyBtn}>
                {isAr ? "تعيين الإحداثيات" : "Apply Coordinates"}
              </button>
            </form>
          )}
        </div>

        {/* Radius Slider & Quick Presets */}
        <div className={styles.radiusField}>
          <div className={styles.fieldHeading}>
            <label htmlFor="atlas-radius" style={{ fontSize: "11px", color: "var(--muted)" }}>
              {isAr ? "نصف قطر الاستكشاف" : "Exploration Radius"}
            </label>
            <output htmlFor="atlas-radius">
              {radiusKm.toFixed(1)} <small>{isAr ? "كم" : "km"}</small>
            </output>
          </div>
          <input
            id="atlas-radius"
            type="range"
            min={500}
            max={5000}
            step={100}
            value={searchRadius}
            disabled={isLoadingScan}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className={styles.rangeInput}
            style={{ "--range-percent": `${rangePercent}%` } as React.CSSProperties}
            aria-valuetext={`${radiusKm.toFixed(1)} ${isAr ? "كيلومتر" : "kilometers"}`}
          />
          <div className={styles.rangeScale}>
            <span>{isAr ? "500 م" : "500 m"}</span>
            <span>{isAr ? "2.5 كم" : "2.5 km"}</span>
            <span>{isAr ? "5 كم" : "5 km"}</span>
          </div>

          <div className={styles.radiusPresets} role="group" aria-label={isAr ? "نطاقات المسح السريعة" : "Quick radius presets"}>
            {[1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                disabled={isLoadingScan}
                aria-pressed={searchRadius === val}
                onClick={() => onRadiusChange(val)}
                className={styles.radiusPresetBtn}
              >
                {val / 1000} {isAr ? "كم" : "km"}
              </button>
            ))}
          </div>
        </div>

        {/* Scan / Cancel / Reset */}
        <div className={styles.scanActions}>
          {isLoadingScan ? (
            <button type="button" onClick={onCancelScan} className={styles.cancelScanButton}>
              <X size={16} aria-hidden="true" />
              <span>{isAr ? "إلغاء المسح" : "Cancel Scan"}</span>
            </button>
          ) : (
            <button type="button" onClick={onStartScan} className={styles.scanButton}>
              <Scan size={16} aria-hidden="true" />
              <span>{isOutdated && hasResults ? (isAr ? "إعادة المسح الذكي" : "Re-scan Area") : (isAr ? "ابدأ المسح الذكي" : "Start Smart Scan")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            disabled={isLoadingScan}
            className={styles.resetButton}
            aria-label={isAr ? "استعادة إعدادات المسح" : "Reset survey settings"}
            title={isAr ? "استعادة إعدادات المسح" : "Reset"}
          >
            <RotateCcw size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Live status */}
        <p className={styles.scanStatus} data-state={statusState} role="status" aria-live="polite">
          {statusText}
        </p>

        {/* Error & Retry */}
        {error && (
          <div className={styles.sidebarError} role="alert">
            <div>
              <div>{error}</div>
              <button type="button" onClick={onStartScan} className={styles.retryBtn}>
                {isAr ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              aria-label={isAr ? "إغلاق التنبيه" : "Dismiss"}
              style={{ background: "transparent", border: 0, color: "inherit", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
