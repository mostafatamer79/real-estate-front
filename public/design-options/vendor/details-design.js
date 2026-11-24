export const DETAILS_DESIGN_KEY = 'details_design';
export const PLACE_IDS = ['park', 'restaurant', 'school', 'pharmacy', 'market', 'mosque'];
export const DEFAULT_DETAILS_DESIGN = {
    enable3d: true, typing: true, showPins: true, showPropertyPin: true, showSectionIcons: false,
    propertyPinColor: '#d92d2d', desktopHeight: 400, mobileHeight: 260,
    latitude: 24.7136, longitude: 46.6753,
    lightBackground: '#e3eaf4', lightSurface: '#f3f6fb', lightText: '#24333d',
    darkBackground: '#101827', darkSurface: '#1b2835', darkText: '#edf1f5',
    places: [
        { id: 'park', ar: 'حديقة', en: 'Park', x: -5.2, y: .9, z: -1.7, enabled: true },
        { id: 'restaurant', ar: 'مطعم', en: 'Restaurant', x: 5.2, y: 1.5, z: 1.6, enabled: true },
        { id: 'school', ar: 'مدرسة', en: 'School', x: 4.8, y: 1.8, z: -2.9, enabled: true },
        { id: 'pharmacy', ar: 'صيدلية', en: 'Pharmacy', x: -5.2, y: 1.3, z: 2.6, enabled: true },
        { id: 'market', ar: 'متجر', en: 'Market', x: 1, y: 1.2, z: 4.1, enabled: true },
        { id: 'mosque', ar: 'مسجد', en: 'Mosque', x: -1.7, y: 1.7, z: -3.8, enabled: true },
    ],
};
const record = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const bounded = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function parseDetailsDesign(raw) {
    let input = {};
    try {
        input = record(JSON.parse(raw || '{}'));
    }
    catch { /* Saved legacy or invalid content uses safe defaults. */ }
    const d = DEFAULT_DETAILS_DESIGN;
    const bool = (key) => typeof input[key] === 'boolean' ? input[key] : d[key];
    const pins = Array.isArray(input.places) ? input.places.map(record) : [];
    const color = (key) => typeof input[key] === 'string' && /^#[\da-f]{6}$/i.test(input[key]) ? input[key] : d[key];
    return {
        enable3d: bool('enable3d'), typing: bool('typing'), showPins: bool('showPins'), showPropertyPin: bool('showPropertyPin'), showSectionIcons: bool('showSectionIcons'),
        propertyPinColor: typeof input.propertyPinColor === 'string' && /^#[\da-f]{6}$/i.test(input.propertyPinColor) ? input.propertyPinColor : d.propertyPinColor,
        desktopHeight: bounded(input.desktopHeight, d.desktopHeight, 260, 480), mobileHeight: bounded(input.mobileHeight, d.mobileHeight, 220, 340),
        latitude: bounded(input.latitude, d.latitude, -85, 85), longitude: bounded(input.longitude, d.longitude, -180, 180),
        lightBackground: color('lightBackground'), lightSurface: color('lightSurface'), lightText: color('lightText'), darkBackground: color('darkBackground'), darkSurface: color('darkSurface'), darkText: color('darkText'),
        places: d.places.map(fallback => {
            const pin = pins.find(p => p.id === fallback.id) || {};
            return { ...fallback, ar: typeof pin.ar === 'string' && pin.ar.trim() ? pin.ar.slice(0, 80) : fallback.ar,
                en: typeof pin.en === 'string' && pin.en.trim() ? pin.en.slice(0, 80) : fallback.en,
                x: bounded(pin.x, fallback.x, -6.5, 6.5), y: bounded(pin.y, fallback.y, .3, 3), z: bounded(pin.z, fallback.z, -4.5, 4.5),
                enabled: typeof pin.enabled === 'boolean' ? pin.enabled : fallback.enabled };
        }),
    };
}
