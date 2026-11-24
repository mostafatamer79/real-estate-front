import { Place } from "@/types/map";

export interface ScanPlaceWithDistance extends Place {
  distance: number;
}

export interface PlaceTypeStat {
  type: string;
  count: number;
  percentage: number;
}

export interface PlaceStatistics {
  totalPlaces: number;
  uniqueTypesCount: number;
  topTypes: PlaceTypeStat[];
  closestPlace: ScanPlaceWithDistance | null;
  farthestPlace: ScanPlaceWithDistance | null;
  averageDistanceMeters: number;
}

export interface SaudiDistrictPreset {
  id: string;
  nameAr: string;
  nameEn: string;
  cityNameAr: string;
  cityNameEn: string;
  location: [number, number];
}

export const SAUDI_DISTRICT_PRESETS: SaudiDistrictPreset[] = [
  {
    id: "riyadh-olaya",
    nameAr: "حي العليا",
    nameEn: "Al Olaya District",
    cityNameAr: "الرياض",
    cityNameEn: "Riyadh",
    location: [24.7136, 46.6753],
  },
  {
    id: "riyadh-malqa",
    nameAr: "حي الملقا",
    nameEn: "Al Malqa District",
    cityNameAr: "الرياض",
    cityNameEn: "Riyadh",
    location: [24.8143, 46.6174],
  },
  {
    id: "riyadh-hittin",
    nameAr: "حي حطين",
    nameEn: "Hittin District",
    cityNameAr: "الرياض",
    cityNameEn: "Riyadh",
    location: [24.7645, 46.5982],
  },
  {
    id: "jeddah-rawdah",
    nameAr: "حي الروضة",
    nameEn: "Al Rawdah District",
    cityNameAr: "جدة",
    cityNameEn: "Jeddah",
    location: [21.5724, 39.1554],
  },
  {
    id: "jeddah-shati",
    nameAr: "حي الشاطئ",
    nameEn: "Al Shati District",
    cityNameAr: "جدة",
    cityNameEn: "Jeddah",
    location: [21.6083, 39.1172],
  },
  {
    id: "khobar-corniche",
    nameAr: "كورنيش الخبر",
    nameEn: "Khobar Corniche",
    cityNameAr: "الخبر",
    cityNameEn: "Al Khobar",
    location: [26.2942, 50.2185],
  },
  {
    id: "dammam-faisaliyah",
    nameAr: "حي الفيصلية",
    nameEn: "Al Faisaliyah",
    cityNameAr: "الدمام",
    cityNameEn: "Dammam",
    location: [26.4207, 50.0888],
  },
  {
    id: "makkah-aziziyah",
    nameAr: "حي العزيزية",
    nameEn: "Al Aziziyah",
    cityNameAr: "مكة المكرمة",
    cityNameEn: "Makkah",
    location: [21.4133, 39.8667],
  },
  {
    id: "madinah-markaziyah",
    nameAr: "المنطقة المركزية",
    nameEn: "Central Area",
    cityNameAr: "المدينة المنورة",
    cityNameEn: "Madinah",
    location: [24.4672, 39.6111],
  },
];

/**
 * Calculates great-circle distance between two points using Haversine formula.
 * Returns distance in meters (rounded to nearest integer).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lon1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lon2)
  ) {
    return 0;
  }

  const R = 6371000; // Earth's mean radius in meters
  const toRad = Math.PI / 180;
  const phi1 = lat1 * toRad;
  const phi2 = lat2 * toRad;
  const deltaPhi = (lat2 - lat1) * toRad;
  const deltaLambda = (lon2 - lon1) * toRad;

  const sinDeltaPhi = Math.sin(deltaPhi / 2);
  const sinDeltaLambda = Math.sin(deltaLambda / 2);

  const a =
    sinDeltaPhi * sinDeltaPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinDeltaLambda * sinDeltaLambda;

  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, Math.max(0, a))), Math.sqrt(Math.max(0, 1 - a)));

  return Math.round(R * c);
}

/**
 * Formats distance with localized units.
 */
export function formatDistance(meters: number, locale: "ar" | "en" = "ar"): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return locale === "ar" ? "0 متر" : "0 m";
  }

  if (meters < 1000) {
    const formatted = Math.round(meters);
    return locale === "ar" ? `${formatted} متر` : `${formatted} m`;
  }

  const km = (meters / 1000).toFixed(1);
  return locale === "ar" ? `${km} كم` : `${km} km`;
}

/**
 * Maps distance to semantic tone classes for tags.
 */
export function getDistanceTone(meters: number): {
  colorClass: string;
  badgeLabel: string;
} {
  if (meters < 500) {
    return {
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      badgeLabel: "ملاصق",
    };
  }
  if (meters < 1000) {
    return {
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      badgeLabel: "قريب جداً",
    };
  }
  if (meters < 2000) {
    return {
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      badgeLabel: "مسافة متوسطة",
    };
  }
  return {
    colorClass: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    badgeLabel: "نطاق المحيط",
  };
}

/**
 * Computes automatic leaflet zoom level from radius in meters.
 */
export function computeZoomForRadius(radiusMeters: number): number {
  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) return 14;
  const zoom = Math.round(14 - Math.log2(radiusMeters / 2000));
  return Math.max(11, Math.min(17, zoom));
}

/**
 * Sorts places by ascending distance from specified center coordinates.
 */
export function sortPlacesByDistance(
  places: Place[],
  originLat: number,
  originLng: number
): ScanPlaceWithDistance[] {
  if (!Array.isArray(places)) return [];

  const withDistances = places.map((p) => {
    const distance = calculateDistance(originLat, originLng, p.latitude, p.longitude);
    return {
      ...p,
      distance,
    };
  });

  return withDistances.sort((a, b) => a.distance - b.distance);
}

/**
 * Computes aggregate summary statistics for a set of places.
 */
export function computePlaceStatistics(placesWithDistance: ScanPlaceWithDistance[]): PlaceStatistics {
  const totalPlaces = placesWithDistance.length;
  if (totalPlaces === 0) {
    return {
      totalPlaces: 0,
      uniqueTypesCount: 0,
      topTypes: [],
      closestPlace: null,
      farthestPlace: null,
      averageDistanceMeters: 0,
    };
  }

  const counts: Record<string, number> = {};
  let distanceSum = 0;

  for (const place of placesWithDistance) {
    const key = place.type || "other";
    counts[key] = (counts[key] || 0) + 1;
    distanceSum += place.distance || 0;
  }

  const topTypes: PlaceTypeStat[] = Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / totalPlaces) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const sorted = [...placesWithDistance].sort((a, b) => a.distance - b.distance);

  return {
    totalPlaces,
    uniqueTypesCount: Object.keys(counts).length,
    topTypes,
    closestPlace: sorted[0] || null,
    farthestPlace: sorted[sorted.length - 1] || null,
    averageDistanceMeters: Math.round(distanceSum / totalPlaces),
  };
}

/**
 * Resolves the canonical API URL for the places endpoint.
 * Handles production origin, custom env, and ensures Nest global prefix `/api` is honored.
 */
export function resolvePlacesApiUrl(envApiUrl?: string, origin?: string): string {
  // If window is available in browser and not localhost
  if (origin && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
    return `${origin.replace(/\/+$/, "")}/api/places`;
  }

  let base = envApiUrl || "http://localhost:3030/api";
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  base = base.replace(/\/+$/, "");

  // If base does not end with /api, append /api
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }

  return `${base}/places`;
}

/**
 * Validates places response payload from server.
 */
export function validatePlacesResponse(
  data: unknown
): { ok: true; places: Place[] } | { ok: false; errorKey: string; message: string } {
  if (!Array.isArray(data)) {
    return {
      ok: false,
      errorKey: "scan.dataError",
      message: "استجابة السيرفر غير متوافقة مع صيغة القائمة",
    };
  }

  const sanitized: Place[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const lat = Number(rec.latitude);
    const lng = Number(rec.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    sanitized.push({
      id: typeof rec.id === "string" || (typeof rec.id === "number" && Number.isFinite(rec.id)) ? rec.id : `${lat.toFixed(6)}-${lng.toFixed(6)}`,
      name: typeof rec.name === "string" && rec.name.trim() ? rec.name.trim() : "مرفق غير مسمى",
      type: typeof rec.type === "string" && rec.type.trim() ? rec.type.trim() : "amenity",
      latitude: lat,
      longitude: lng,
      city: typeof rec.city === "string" ? rec.city.trim() : undefined,
    });
  }

  return { ok: true, places: sanitized };
}

/**
 * Exports places list as clean RFC 4180 CSV with UTF-8 BOM.
 */
export function generateScanCsv(
  places: ScanPlaceWithDistance[],
  originLat: number,
  originLng: number,
  locale: "ar" | "en" = "ar"
): string {
  const headers =
    locale === "ar"
      ? ["الاسم", "النوع", "المسافة_متر", "خط_العرض", "خط_الطول", "المدينة"]
      : ["Name", "Type", "Distance_Meters", "Latitude", "Longitude", "City"];

  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows: string[] = [headers.join(",")];

  for (const place of places) {
    const row = [
      escapeCell(place.name),
      escapeCell(place.type),
      escapeCell(place.distance),
      escapeCell(place.latitude.toFixed(6)),
      escapeCell(place.longitude.toFixed(6)),
      escapeCell(place.city || ""),
    ];
    rows.push(row.join(","));
  }

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens Arabic correctly
  return "\uFEFF" + rows.join("\r\n");
}

/**
 * Derives accurate pricing availability status.
 * Distinguishes explicit free / ui-flag free vs positive price vs missing/unavailable.
 */
export function derivePricingStatus(
  servicePrices?: { service_price_scan_report?: number } | null,
  isMapFree?: boolean,
  isSettingsLoading?: boolean
): {
  status: "loading" | "free" | "available" | "unavailable";
  price: number;
} {
  if (isSettingsLoading) {
    return { status: "loading", price: 0 };
  }

  if (isMapFree === true) {
    return { status: "free", price: 0 };
  }

  const configuredPrice = servicePrices?.service_price_scan_report;
  if (configuredPrice === undefined || configuredPrice === null) {
    return { status: "unavailable", price: 0 };
  }

  const numericPrice = Number(configuredPrice);
  if (!Number.isFinite(numericPrice) || numericPrice < 0) {
    return { status: "unavailable", price: 0 };
  }

  if (numericPrice === 0) {
    return { status: "free", price: 0 };
  }

  return { status: "available", price: numericPrice };
}

/**
 * Classifies browser geolocation errors into clear diagnostic types.
 */
export function classifyGeolocationError(
  err: unknown,
  locale: "ar" | "en" = "ar"
): {
  code: "PERMISSION_DENIED" | "POSITION_UNAVAILABLE" | "TIMEOUT" | "UNSUPPORTED" | "UNKNOWN";
  message: string;
} {
  if (!err) {
    return {
      code: "UNKNOWN",
      message: locale === "ar" ? "تعذر تحديد الموقع الجغرافي" : "Failed to determine geolocation",
    };
  }

  const errObj = err as { code?: number; message?: string };

  if (errObj.code === 1) {
    return {
      code: "PERMISSION_DENIED",
      message:
        locale === "ar"
          ? "تم رفض إذن الوصول إلى الموقع. يُرجى تفعيل الموقع في المتصفح."
          : "Location permission denied. Please allow location access in your browser.",
    };
  }

  if (errObj.code === 2) {
    return {
      code: "POSITION_UNAVAILABLE",
      message:
        locale === "ar"
          ? "الموقع الجغرافي غير متوفر حالياً. تحقق من إشارة GPS أو الشبكة."
          : "Geolocation position unavailable. Check GPS or network signal.",
    };
  }

  if (errObj.code === 3) {
    return {
      code: "TIMEOUT",
      message:
        locale === "ar"
          ? "استغرق تحديد الموقع وقتاً أطول من المعتاد. يُرجى المحاولة ثانية."
          : "Geolocation request timed out. Please try again.",
    };
  }

  return {
    code: "UNKNOWN",
    message:
      typeof errObj.message === "string" && errObj.message
        ? errObj.message
        : locale === "ar"
        ? "حدث خطأ غير متوقع أثناء تحديد الموقع."
        : "An unexpected error occurred while locating.",
  };
}
