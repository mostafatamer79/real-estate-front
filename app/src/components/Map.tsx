"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
// remove DivIcon import
import { useEffect, useState, useMemo, useCallback, forwardRef, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

// ✅ Create a simple colored dot icon with emoji fallback
const createIcon = (L: any, color: string = "#3b82f6", emoji?: string) => {
  if (!L) return null;
  if (emoji) {
    return new L.DivIcon({
      html: `<div style="font-size: 20px; text-align: center; width: 30px; height: 30px;">${emoji}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
      className: "emoji-marker",
    });
  }

  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    className: "dot-marker",
  });
};

// ✅ Comprehensive Arabic icon mapping for all place types
const ICON_MAP: Record<string, { emoji?: string; color: string; arabicName: string }> = {
  // ✅ الموانئ والمراسي
  anchorage: { emoji: "⚓", color: "#0284c7", arabicName: "مرسى" },

  // ✅ الحيوانات
  animal_boarding: { emoji: "🐕", color: "#16a34a", arabicName: "إيواء الحيوانات" },
  animal_breeding: { emoji: "🐄", color: "#16a34a", arabicName: "تربية الحيوانات" },
  animal_shelter: { emoji: "🐾", color: "#16a34a", arabicName: "ملجأ الحيوانات" },
  stables: { emoji: "🐎", color: "#16a34a", arabicName: "إسطبلات" },
  veterinary: { emoji: "🐾", color: "#16a34a", arabicName: "طبيب بيطري" },
  veterinary_pharmacy: { emoji: "💊", color: "#8b5cf6", arabicName: "صيدلية بيطرية" },

  // ✅ الفنون والثقافة
  arts_centre: { emoji: "🎨", color: "#8b5cf6", arabicName: "مركز فني" },
  auditorium: { emoji: "🎭", color: "#8b5cf6", arabicName: "قاعة محاضرات" },
  cinema: { emoji: "🎬", color: "#8b5cf6", arabicName: "سينما" },
  theatre: { emoji: "🎭", color: "#8b5cf6", arabicName: "مسرح" },
  exhibition_centre: { emoji: "🖼️", color: "#8b5cf6", arabicName: "مركز معارض" },
  planetarium: { emoji: "🔭", color: "#8b5cf6", arabicName: "قبة فلكية" },

  // ✅ المالية والبنوك
  atm: { emoji: "💳", color: "#059669", arabicName: "صراف آلي" },
  bank: { emoji: "🏦", color: "#059669", arabicName: "بنك" },
  bureau_de_change: { emoji: "💱", color: "#059669", arabicName: "صرافة" },
  money_transfer: { emoji: "💸", color: "#059669", arabicName: "تحويل أموال" },

  // ✅ الطعام والمشروبات
  cafe: { emoji: "☕", color: "#f59e0b", arabicName: "مقهى" },
  restaurant: { emoji: "🍽️", color: "#f59e0b", arabicName: "مطعم" },
  fast_food: { emoji: "🍔", color: "#f59e0b", arabicName: "وجبات سريعة" },
  bar: { emoji: "🍸", color: "#f59e0b", arabicName: "بار" },
  pub: { emoji: "🍺", color: "#f59e0b", arabicName: "حانة" },
  ice_cream: { emoji: "🍦", color: "#f59e0b", arabicName: "آيس كريم" },
  canteen: { emoji: "🥘", color: "#f59e0b", arabicName: "مطعم عمال" },
  food_court: { emoji: "🍜", color: "#f59e0b", arabicName: "ساحة طعام" },
  bakery: { emoji: "🥖", color: "#f59e0b", arabicName: "مخبز" },
  juice: { emoji: "🧃", color: "#f59e0b", arabicName: "عصير" },
  hookah_lounge: { emoji: "💨", color: "#f59e0b", arabicName: "شيشة" },
  "Grill, Cebab": { emoji: "🍢", color: "#f59e0b", arabicName: "مشويات" },

  // ✅ المواصلات
  bus_station: { emoji: "🚌", color: "#475569", arabicName: "محطة باصات" },
  bus_stop: { emoji: "🚏", color: "#475569", arabicName: "موقف باص" },
  taxi: { emoji: "🚕", color: "#475569", arabicName: "تاكسي" },
  parking: { emoji: "🅿️", color: "#475569", arabicName: "موقف سيارات" },
  car_rental: { emoji: "🚗", color: "#475569", arabicName: "تأجير سيارات" },
  car_wash: { emoji: "🧼", color: "#475569", arabicName: "غسيل سيارات" },
  ferry_terminal: { emoji: "⛴️", color: "#475569", arabicName: "مح渡ق العبارات" },
  bicycle_rental: { emoji: "🚲", color: "#475569", arabicName: "تأجير دراجات" },
  motorcycle_rental: { emoji: "🏍️", color: "#475569", arabicName: "تأجير دراجات نارية" },

  // ✅ الخدمات الحكومية
  police: { emoji: "👮", color: "#1d4ed8", arabicName: "شرطة" },
  fire_station: { emoji: "🚒", color: "#dc2626", arabicName: "إطفائية" },
  post_office: { emoji: "📮", color: "#1d4ed8", arabicName: "بريد" },
  courthouse: { emoji: "⚖️", color: "#1d4ed8", arabicName: "محكمة" },
  townhall: { emoji: "🏛️", color: "#1d4ed8", arabicName: "بلدية" },
  prison: { emoji: "🔒", color: "#1d4ed8", arabicName: "سجن" },
  coast_guard: { emoji: "🛥️", color: "#1d4ed8", arabicName: "خفر السواحل" },
  border_control: { emoji: "🛂", color: "#1d4ed8", arabicName: "مراقبة حدود" },

  // ✅ التعليم
  school: { emoji: "🏫", color: "#10b981", arabicName: "مدرسة" },
  college: { emoji: "🎓", color: "#10b981", arabicName: "كلية" },
  university: { emoji: "🎓", color: "#10b981", arabicName: "جامعة" },
  kindergarten: { emoji: "👶", color: "#10b981", arabicName: "روضة" },
  library: { emoji: "📚", color: "#10b981", arabicName: "مكتبة" },
  language_school: { emoji: "🗣️", color: "#10b981", arabicName: "مدرسة لغات" },
  music_school: { emoji: "🎵", color: "#10b981", arabicName: "مدرسة موسيقى" },
  dancing_school: { emoji: "💃", color: "#10b981", arabicName: "مدرسة رقص" },
  driving_school: { emoji: "🚗", color: "#10b981", arabicName: "مدرسة قيادة" },
  prep_school: { emoji: "📝", color: "#10b981", arabicName: "مدرسة تحضيرية" },

  // ✅ الصحة
  hospital: { emoji: "🏥", color: "#dc2626", arabicName: "مستشفى" },
  clinic: { emoji: "🏥", color: "#dc2626", arabicName: "عيادة" },
  doctors: { emoji: "👨‍⚕️", color: "#dc2626", arabicName: "طبيب" },
  dentist: { emoji: "🦷", color: "#0ea5e9", arabicName: "طبيب أسنان" },
  pharmacy: { emoji: "💊", color: "#8b5cf6", arabicName: "صيدلية" },
  health_post: { emoji: "🏥", color: "#dc2626", arabicName: "مركز صحي" },
  polyclinic: { emoji: "🏥", color: "#dc2626", arabicName: "عيادة متعددة" },
  childcare: { emoji: "👶", color: "#dc2626", arabicName: "رعاية أطفال" },

  // ✅ التسوق والتجارة
  marketplace: { emoji: "🛒", color: "#f97316", arabicName: "سوق" },
  commercial: { emoji: "🏬", color: "#f97316", arabicName: "تجاري" },
  shope: { emoji: "🛍️", color: "#f97316", arabicName: "متجر" },
  florist: { emoji: "💐", color: "#f97316", arabicName: "بائع زهور" },
  dry_cleaner: { emoji: "🧥", color: "#f97316", arabicName: "تنظيف جاف" },
  "Samsung Dealer": { emoji: "📱", color: "#f97316", arabicName: "وكيل سامسونج" },

  // ✅ الترفيه
  nightclub: { emoji: "🎉", color: "#ec4899", arabicName: "نادي ليلي" },
  casino: { emoji: "🎰", color: "#ec4899", arabicName: "كازينو" },
  karaoke_box: { emoji: "🎤", color: "#ec4899", arabicName: "كاريوكي" },
  stripclub: { emoji: "💃", color: "#ec4899", arabicName: "نادي تعري" },

  // ✅ الرياضة واللياقة
  gym: { emoji: "💪", color: "#ec4899", arabicName: "نادي رياضي" },
  spa: { emoji: "💆", color: "#ec4899", arabicName: "سبا" },
  dojo: { emoji: "🥋", color: "#ec4899", arabicName: "دوجو" },
  swimming_pool: { emoji: "🏊", color: "#ec4899", arabicName: "مسبح" },

  // ✅ الدين
  place_of_worship: { emoji: "🕌", color: "#7c3aed", arabicName: "مكان عبادة" },
  mosque: { emoji: "🕌", color: "#7c3aed", arabicName: "مسجد" },
  church: { emoji: "⛪", color: "#7c3aed", arabicName: "كنيسة" },

  // ✅ الخدمات العامة
  toilets: { emoji: "🚻", color: "#6b7280", arabicName: "مرحاض" },
  drinking_water: { emoji: "🚰", color: "#0284c7", arabicName: "ماء شرب" },
  fountain: { emoji: "⛲", color: "#0284c7", arabicName: "نافورة" },
  bench: { emoji: "🪑", color: "#6b7280", arabicName: "مقعد" },
  shelter: { emoji: "🛖", color: "#6b7280", arabicName: "ملجأ" },
  waste_basket: { emoji: "🗑️", color: "#15803d", arabicName: "سلة مهملات" },
  recycling: { emoji: "♻️", color: "#15803d", arabicName: "إعادة تدوير" },
  telephone: { emoji: "📞", color: "#6b7280", arabicName: "هاتف" },
  vending_machine: { emoji: "🛒", color: "#6b7280", arabicName: "آلة بيع" },

  // ✅ الشحن والطاقة
  charging_station: { emoji: "🔋", color: "#65a30d", arabicName: "محطة شحن" },
  device_charging_station: { emoji: "🔌", color: "#65a30d", arabicName: "شحن أجهزة" },
  fuel: { emoji: "⛽", color: "#f59e0b", arabicName: "بنزين" },

  // ✅ الخدمات المجتمعية
  community_centre: { emoji: "🏘️", color: "#14b8a6", arabicName: "مركز مجتمعي" },
  social_centre: { emoji: "👥", color: "#14b8a6", arabicName: "مركز اجتماعي" },
  clubhouse: { emoji: "🏠", color: "#14b8a6", arabicName: "نادي" },
  events_venue: { emoji: "🎪", color: "#14b8a6", arabicName: "مكان فعاليات" },
  wedding_venue: { emoji: "💒", color: "#14b8a6", arabicName: "قاعة أفراح" },

  // ✅ الصناعة
  industrial: { emoji: "🏭", color: "#64748b", arabicName: "صناعي" },
  workshop: { emoji: "🔧", color: "#64748b", arabicName: "ورشة" },
  electrical: { emoji: "⚡", color: "#64748b", arabicName: "كهربائي" },

  // ✅ السكن
  nursing_home: { emoji: "👵", color: "#f97316", arabicName: "دار مسنين" },
  nursery: { emoji: "🌱", color: "#10b981", arabicName: "حضانة" },

  // ✅ خدمات أخرى
  internet_cafe: { emoji: "💻", color: "#3b82f6", arabicName: "مقهى إنترنت" },
  photo_booth: { emoji: "📸", color: "#8b5cf6", arabicName: "كشك صور" },
  lost_property_office: { emoji: "🔍", color: "#6b7280", arabicName: "مكتب مفقودات" },
  weighing: { emoji: "⚖️", color: "#6b7280", arabicName: "ميزان" },
  clock: { emoji: "🕐", color: "#6b7280", arabicName: "ساعة" },
  binoculars: { emoji: "🔭", color: "#6b7280", arabicName: "منظار" },
  shower: { emoji: "🚿", color: "#0284c7", arabicName: "دش" },
  public_bath: { emoji: "🛁", color: "#0284c7", arabicName: "حمام عام" },
  meditation_centre: { emoji: "🧘", color: "#7c3aed", arabicName: "مركز تأمل" },
  crematorium: { emoji: "⚱️", color: "#6b7280", arabicName: "محرقة" },
  mortuary: { emoji: "⚰️", color: "#6b7280", arabicName: "مشرحة" },
  grave_yard: { emoji: "⚰️", color: "#6b7280", arabicName: "مقبرة" },
  "مغسلة_موتى": { emoji: "⚰️", color: "#6b7280", arabicName: "مغسلة موتى" },

  // ✅ الأنواع العامة (يستخدم للنوع العام)
  default: { color: "#6b7280", arabicName: "مكان عام" },
  yes: { color: "#3b82f6", arabicName: "موقع عام" },
  fixme: { color: "#ef4444", arabicName: "يحتاج تصحيح" },
};

// ✅ Get Arabic name for type
const getArabicName = (type: string): string => {
  if (!type) return "مكان غير معروف";

  const lowerType = type.toLowerCase();

  // Check for exact match
  if (ICON_MAP[lowerType]) {
    return ICON_MAP[lowerType].arabicName;
  }

  // Check for partial matches
  if (lowerType.includes('animal')) return "حيوانات";
  if (lowerType.includes('bicycle')) return "دراجات";
  if (lowerType.includes('car')) return "سيارات";
  if (lowerType.includes('parking')) return "مواقف";
  if (lowerType.includes('school')) return "مدرسة";
  if (lowerType.includes('shop')) return "متجر";
  if (lowerType.includes('office')) return "مكتب";
  if (lowerType.includes('water')) return "ماء";
  if (lowerType.includes('charging')) return "شحن";
  if (lowerType.includes('recycling')) return "تدوير";
  if (lowerType.includes('social')) return "اجتماعي";
  if (lowerType.includes('community')) return "مجتمعي";
  if (lowerType.includes('public')) return "عام";
  if (lowerType.includes('station')) return "محطة";
  if (lowerType.includes('centre') || lowerType.includes('center')) return "مركز";

  return type;
};

// ✅ Get icon for a place type
const getPlaceIcon = (L: any, type: string) => {
  if (!L || !type) return createIcon(L, "#6b7280");

  const lowerType = type.toLowerCase();

  if (ICON_MAP[lowerType]) {
    const config = ICON_MAP[lowerType];
    return createIcon(L, config.color, config.emoji);
  }

  // Check for partial matches
  for (const [key, config] of Object.entries(ICON_MAP)) {
    if (key.endsWith('_') && lowerType.startsWith(key.slice(0, -1))) {
      return createIcon(L, config.color);
    }
  }

  // Smart matching for common patterns
  if (lowerType.includes('animal')) return createIcon(L, "#16a34a", "🐾");
  if (lowerType.includes('bicycle')) return createIcon(L, "#0891b2", "🚲");
  if (lowerType.includes('car')) return createIcon(L, "#475569", "🚗");
  if (lowerType.includes('parking')) return createIcon(L, "#475569", "🅿️");
  if (lowerType.includes('school')) return createIcon(L, "#10b981", "🏫");
  if (lowerType.includes('shop') || lowerType.includes('market')) return createIcon(L, "#f97316", "🛒");
  if (lowerType.includes('office') || lowerType.includes('company')) return createIcon(L, "#6366f1", "🏢");
  if (lowerType.includes('water')) return createIcon(L, "#0284c7", "💧");
  if (lowerType.includes('charging')) return createIcon(L, "#65a30d", "🔋");
  if (lowerType.includes('recycling')) return createIcon(L, "#15803d", "♻️");
  if (lowerType.includes('social') || lowerType.includes('community')) return createIcon(L, "#14b8a6", "👥");
  if (lowerType.includes('public')) return createIcon(L, "#6b7280", "🏛️");
  if (lowerType.includes('station')) return createIcon(L, "#475569", "🚉");
  if (lowerType.includes('centre') || lowerType.includes('center')) return createIcon(L, "#8b5cf6", "🏛️");

  // Default icon based on first letter (for color variety)
  const colors = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
  ];

  const colorIndex = lowerType.charCodeAt(0) % colors.length;
  return createIcon(L, colors[colorIndex]);
};

// ✅ Default icons
const DEFAULT_ICONS = (L: any) => ({
  property: createIcon(L, "#ef4444", "🏠"),
  currentLocation: createIcon(L, "#10b981", "📍"),
  default: createIcon(L, "#3b82f6"),
});

// ✅ Map Updater Component
function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && map) {
      try {
        // Only set view if the map is actually in the document and has dimensions
        if (map.getContainer()) {
          if (zoom !== undefined) {
            map.setView(center, zoom, { animate: true });
          } else {
            map.setView(center, map.getZoom(), { animate: true });
          }
        }
      } catch (err) {
        console.warn("Leaflet setView error:", err);
      }
    }
    // Fix for Leaflet rendering inside modals
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [center, zoom, map]);

  return null;
}

// ✅ Map Click Handler Component
function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

// ✅ Types
import { Place } from "@/types/map";

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  markerPosition?: [number, number];
  markerTitle?: string;
  markerDescription?: string;
  height?: string;
  className?: string;
  useCurrentLocation?: boolean;
  places?: Place[];
  onLocationSelect?: (lat: number, lng: number) => void;
  showControls?: boolean;
  interactive?: boolean;
}

// ✅ Main Map Component
const Map = forwardRef<HTMLDivElement, MapProps>(function MapComponent({
  center = [24.7136, 46.6753],
  zoom = 13,
  markerPosition,
  markerTitle = "موقع العقار",
  markerDescription = "انقر لتحديد موقع جديد",
  height = "400px",
  className = "",
  useCurrentLocation = false,
  places = [],
  onLocationSelect,
  showControls = false,
  interactive = true,
}: MapProps, ref) {
  const { t } = useLanguage();
  // ✅ State
  const [mounted, setMounted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [L, setL] = useState<any>(null); // Leaflet instance

  // ✅ Memoized values
  const mapCenter = useMemo(() => {
    if (currentLocation) return currentLocation;
    if (center && Array.isArray(center) && center.length === 2) return center;
    return [24.7136, 46.6753] as [number, number];
  }, [center, currentLocation]);

  const markerPos = useMemo(() => {
    if (selectedPosition) return selectedPosition;
    if (markerPosition && Array.isArray(markerPosition) && markerPosition.length === 2) return markerPosition;
    if (currentLocation) return currentLocation;
    return mapCenter;
  }, [markerPosition, currentLocation, mapCenter, selectedPosition]);

  // ✅ Initialize Leaflet
  useEffect(() => {
    (async () => {
      const leaflet = await import('leaflet');
      setL(leaflet);
      setMounted(true);
    })();
    return () => setMounted(false);
  }, []);

  const markerIcon = useMemo(() => {
    if (!L) return null;
    return DEFAULT_ICONS(L).property;
  }, [L]);

  // ✅ Memoize place markers with icons and Arabic names
  const placeMarkers = useMemo(() => {
    if (!L) return [];
    return places.map(place => ({
      ...place,
      icon: getPlaceIcon(L, place.type),
      arabicType: getArabicName(place.type),
    }));
  }, [places, L]);

  // ✅ Effects



  // ✅ Keep latest callback in ref to avoid effect dependency
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (useCurrentLocation && mounted && navigator.geolocation) {
      setIsLoadingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setIsLoadingLocation(false);
          setLocationError(null);

          if (onLocationSelectRef.current) {
            onLocationSelectRef.current(latitude, longitude);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          setIsLoadingLocation(false);
          // Only show error if it's not a permission denial (code 1)
          if (error.code !== 1) {
             setLocationError(error.message);
          }
        },
        { timeout: 10000 }
      );
    }
  }, [useCurrentLocation, mounted]); // dependency onLocationSelect removed

  // ✅ Reset location
  const handleResetLocation = useCallback(() => {
    setSelectedPosition(null);
    if (center && Array.isArray(center) && center.length === 2) {
      if (onLocationSelect) {
        onLocationSelect(center[0], center[1]);
      }
    }
  }, [center, onLocationSelect]);

  // ✅ Loading states
  if (!mounted) {
    return (
      <div
        className={`w-full flex items-center justify-center bg-slate-100 ${className}`}
        style={{ height }}
      >
        <div className="text-gray-600">{t('map.loading')}</div>
      </div>
    );
  }

  // Removed blocking isLoadingLocation check to allow map to render

  return (
    <div className="relative" ref={ref}>
      {/* ✅ Controls */}
      {showControls && onLocationSelect && (
        <div className="absolute top-2 left-2 z-[1000] flex flex-col gap-2">
          <button
            onClick={handleResetLocation}
            className="bg-white hover:bg-slate-50 text-gray-800 px-3 py-2 rounded shadow text-sm flex items-center gap-1"
            title="إعادة تعيين الموقع"
          >
            <span>🔄</span>
            {t('map.reset')}
          </button>
        </div>
      )}

      {/* ✅ Locating Overlay */}
      {isLoadingLocation && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 px-3 py-2 rounded shadow text-sm font-medium text-blue-600 animate-pulse flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {t('map.locating')}
        </div>
      )}

      {/* ✅ Map Container */}
      <div
        className={`w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 ${className}`}
        style={{ height }}
      >
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          zoomControl={true}
          dragging={interactive}
          touchZoom={interactive}
          doubleClickZoom={interactive}
        >
          <MapUpdater center={mapCenter} zoom={zoom} />

          {/* ✅ Click Handler */}
          {onLocationSelect && <MapClickHandler onClick={onLocationSelect} />}

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* ✅ Property Marker */}
          {/* ✅ Property Marker */}
          {markerIcon && (
            <Marker position={markerPos} icon={markerIcon}>
              <Popup>
                <div className="text-center min-w-[150px]">
                  <h3 className="font-bold mb-1">
                    {useCurrentLocation && currentLocation ? `📍 ${t('map.current_location')}` : markerTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {useCurrentLocation && currentLocation ? t('map.location_success') : markerDescription}
                  </p>
                  <div className="bg-slate-50 p-1 rounded text-xs font-mono">
                    {markerPos[0].toFixed(6)}, {markerPos[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* ✅ Place Markers */}
          {placeMarkers.map(place => (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={place.icon}
            >
              <Popup>
                <div className="min-w-[150px]">
                  <strong className="block mb-1">{place.name}</strong>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {place.arabicType}
                    </span>
                    <span className="text-xs text-gray-500">({place.type})</span>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ✅ Click instructions */}
          {onLocationSelect && (
            <div className="leaflet-bottom leaflet-left">
              <div className="leaflet-control bg-white/90 backdrop-blur-sm px-3 py-2 m-2 rounded shadow text-sm">
                {t('map.scan_desc')}
              </div>
            </div>
          )}
        </MapContainer>
      </div>

      {/* ✅ Error message */}
      {locationError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center gap-2 text-red-700">
            <span>⚠️</span>
            <div className="text-sm">
              <p className="font-medium">{t('map.error')}</p>
              <p>{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Stats */}
      {places.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="text-sm bg-slate-50 text-blue-700 px-3 py-1 rounded-full">
            {places.length} مكان
          </div>
          <div className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">
            {new Set(places.map(p => getArabicName(p.type))).size} نوع مختلف
          </div>
        </div>
      )}

      {/* ✅ Custom styles for better Arabic display */}
      <style jsx global>{`
        .leaflet-popup-content {
          direction: rtl !important;
          text-align: right !important;
        }
        .leaflet-popup-content-wrapper {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
        }
        .emoji-marker {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
        }
      `}</style>
    </div>
  );
});

// ✅ Set display name for debugging
Map.displayName = 'Map';

export default Map;