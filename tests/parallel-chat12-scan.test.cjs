const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

function loadModule() {
  const context = { exports: {} };
  const filePath = path.resolve(__dirname, '../lib/redesign-chat12-scan.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(transpiled, context);
  return context.exports;
}

test('calculateDistance computes accurate Haversine distance and handles edge cases', () => {
  const { calculateDistance } = loadModule();

  // Same coordinate should be 0 meters
  assert.equal(calculateDistance(24.7136, 46.6753, 24.7136, 46.6753), 0);

  // Riyadh Kingdom Centre to Faisaliyah Tower (~ 2.6 km)
  const dist = calculateDistance(24.7115, 46.6744, 24.6903, 46.6853);
  assert.ok(dist >= 2400 && dist <= 2700, `Expected ~2550m, got ${dist}`);

  // NaN / invalid inputs should return 0 safely without throwing
  assert.equal(calculateDistance(NaN, 46.6753, 24.7136, 46.6753), 0);
  assert.equal(calculateDistance(24.7136, Infinity, 24.7136, 46.6753), 0);
});

test('formatDistance formats meters and kilometers in AR and EN', () => {
  const { formatDistance } = loadModule();

  assert.equal(formatDistance(350, 'ar'), '350 متر');
  assert.equal(formatDistance(350, 'en'), '350 m');

  assert.equal(formatDistance(1850, 'ar'), '1.9 كم');
  assert.equal(formatDistance(1850, 'en'), '1.9 km');

  // Negative or invalid
  assert.equal(formatDistance(-50, 'ar'), '0 متر');
  assert.equal(formatDistance(NaN, 'en'), '0 m');
});

test('computeZoomForRadius clamps zoom levels predictably based on distance', () => {
  const { computeZoomForRadius } = loadModule();

  assert.equal(computeZoomForRadius(500), 16);
  assert.equal(computeZoomForRadius(1000), 15);
  assert.equal(computeZoomForRadius(2000), 14);
  assert.equal(computeZoomForRadius(4000), 13);
  assert.equal(computeZoomForRadius(5000), 13);

  // Boundaries
  assert.ok(computeZoomForRadius(100) <= 17);
  assert.ok(computeZoomForRadius(50000) >= 11);
  assert.equal(computeZoomForRadius(0), 14);
});

test('sortPlacesByDistance and computePlaceStatistics handle list aggregations correctly', () => {
  const { sortPlacesByDistance, computePlaceStatistics } = loadModule();

  const centerLat = 24.7136;
  const centerLng = 46.6753;

  const mockPlaces = [
    { id: '1', name: 'Far Hospital', type: 'hospital', latitude: 24.75, longitude: 46.72 },
    { id: '2', name: 'Close Cafe 1', type: 'cafe', latitude: 24.714, longitude: 46.676 },
    { id: '3', name: 'Close Cafe 2', type: 'cafe', latitude: 24.715, longitude: 46.677 },
    { id: '4', name: 'Medium School', type: 'school', latitude: 24.72, longitude: 46.68 },
  ];

  const sorted = sortPlacesByDistance(mockPlaces, centerLat, centerLng);
  assert.equal(sorted.length, 4);
  assert.equal(sorted[0].id, '2'); // Closest
  assert.equal(sorted[sorted.length - 1].id, '1'); // Farthest
  assert.ok(sorted[0].distance < sorted[1].distance);

  const stats = computePlaceStatistics(sorted);
  assert.equal(stats.totalPlaces, 4);
  assert.equal(stats.uniqueTypesCount, 3);
  assert.equal(stats.closestPlace.id, '2');
  assert.equal(stats.farthestPlace.id, '1');
  assert.equal(stats.topTypes[0].type, 'cafe');
  assert.equal(stats.topTypes[0].count, 2);
  assert.equal(stats.topTypes[0].percentage, 50);

  // Empty list handling
  const emptyStats = computePlaceStatistics([]);
  assert.equal(emptyStats.totalPlaces, 0);
  assert.equal(emptyStats.uniqueTypesCount, 0);
  assert.equal(emptyStats.closestPlace, null);
});

test('resolvePlacesApiUrl ensures canonical path and /api prefix for Nest backend', () => {
  const { resolvePlacesApiUrl } = loadModule();

  // Localhost with port 3030 without /api should append /api/places
  assert.equal(
    resolvePlacesApiUrl('http://localhost:3030'),
    'http://localhost:3030/api/places'
  );

  // Localhost with /api should produce /api/places without duplicating
  assert.equal(
    resolvePlacesApiUrl('http://localhost:3030/api'),
    'http://localhost:3030/api/places'
  );

  // Trailing slash handling
  assert.equal(
    resolvePlacesApiUrl('http://localhost:3030/api/'),
    'http://localhost:3030/api/places'
  );

  // Production domain origin
  assert.equal(
    resolvePlacesApiUrl(undefined, 'https://platform.brokerage.sa'),
    'https://platform.brokerage.sa/api/places'
  );
});

test('validatePlacesResponse distinguishes valid server arrays from malformed payloads', () => {
  const { validatePlacesResponse } = loadModule();

  // Valid array
  const valid = validatePlacesResponse([
    { id: 'p1', name: 'Sulaiman Al Habib', type: 'hospital', latitude: 24.7, longitude: 46.7, city: 'Riyadh' },
    { id: 'p2', name: '  Carrefour  ', type: 'supermarket', latitude: '24.71', longitude: '46.72' },
  ]);
  assert.equal(valid.ok, true);
  assert.equal(valid.places.length, 2);
  assert.equal(valid.places[0].name, 'Sulaiman Al Habib');
  assert.equal(valid.places[1].name, 'Carrefour');
  assert.equal(valid.places[1].latitude, 24.71);

  // Non-array payload (e.g. backend error object { error: 'message' })
  const nonArray = validatePlacesResponse({ error: 'Internal Server Error' });
  assert.equal(nonArray.ok, false);
  assert.equal(nonArray.errorKey, 'scan.dataError');

  // Null payload
  const nullPayload = validatePlacesResponse(null);
  assert.equal(nullPayload.ok, false);

  // Skips entries missing latitude/longitude
  const partial = validatePlacesResponse([
    { id: 'p1', name: 'Valid', latitude: 24.7, longitude: 46.7 },
    { id: 'p2', name: 'Invalid Coords', latitude: 'abc', longitude: null },
  ]);
  assert.equal(partial.ok, true);
  assert.equal(partial.places.length, 1);
});

test('generateScanCsv exports standard CSV with UTF-8 BOM and RFC 4180 escaping', () => {
  const { generateScanCsv } = loadModule();

  const mockPlaces = [
    {
      id: '1',
      name: 'مجمع "الرياض" التجاري, فرع العليا',
      type: 'commercial',
      distance: 350,
      latitude: 24.7136,
      longitude: 46.6753,
      city: 'الرياض',
    },
  ];

  const csvAr = generateScanCsv(mockPlaces, 24.71, 46.67, 'ar');
  // Starts with UTF-8 Byte Order Mark
  assert.ok(csvAr.startsWith('\uFEFF'));
  // Contains escaped quotes for internal quotes
  assert.ok(csvAr.includes('""الرياض""'));
  // Contains Arabic headers
  assert.ok(csvAr.includes('الاسم,النوع,المسافة_متر'));

  const csvEn = generateScanCsv(mockPlaces, 24.71, 46.67, 'en');
  assert.ok(csvEn.includes('Name,Type,Distance_Meters'));
});

test('derivePricingStatus accurately distinguishes free vs available vs unavailable states', () => {
  const { derivePricingStatus } = loadModule();

  // Loading settings
  const loadingRes = derivePricingStatus({ service_price_scan_report: 50 }, false, true);
  assert.equal(loadingRes.status, 'loading');
  assert.equal(loadingRes.price, 0);

  // Explicitly free via uiFlags.is_map_free
  const freeRes = derivePricingStatus({ service_price_scan_report: 50 }, true, false);
  assert.equal(freeRes.status, 'free');
  assert.equal(freeRes.price, 0);

  // Positive configured price
  const availRes = derivePricingStatus({ service_price_scan_report: 75 }, false, false);
  assert.equal(availRes.status, 'available');
  assert.equal(availRes.price, 75);

  // Explicitly configured 0 SAR
  const zeroRes = derivePricingStatus({ service_price_scan_report: 0 }, false, false);
  assert.equal(zeroRes.status, 'free');
  assert.equal(zeroRes.price, 0);

  // Missing or undefined price
  const unavailRes1 = derivePricingStatus(null, false, false);
  assert.equal(unavailRes1.status, 'unavailable');
  assert.equal(unavailRes1.price, 0);

  const unavailRes2 = derivePricingStatus({}, false, false);
  assert.equal(unavailRes2.status, 'unavailable');
  assert.equal(unavailRes2.price, 0);
});

test('classifyGeolocationError diagnoses standard W3C Geolocation error codes', () => {
  const { classifyGeolocationError } = loadModule();

  // Code 1: Permission Denied
  const denied = classifyGeolocationError({ code: 1 }, 'ar');
  assert.equal(denied.code, 'PERMISSION_DENIED');
  assert.ok(denied.message.includes('رفض إذن'));

  // Code 2: Position Unavailable
  const unavail = classifyGeolocationError({ code: 2 }, 'en');
  assert.equal(unavail.code, 'POSITION_UNAVAILABLE');
  assert.ok(unavail.message.includes('unavailable'));

  // Code 3: Timeout
  const timeout = classifyGeolocationError({ code: 3 }, 'ar');
  assert.equal(timeout.code, 'TIMEOUT');

  // Null error
  const nullErr = classifyGeolocationError(null, 'en');
  assert.equal(nullErr.code, 'UNKNOWN');
});

test('SAUDI_DISTRICT_PRESETS contains verified major city locations', () => {
  const { SAUDI_DISTRICT_PRESETS } = loadModule();

  assert.ok(Array.isArray(SAUDI_DISTRICT_PRESETS));
  assert.ok(SAUDI_DISTRICT_PRESETS.length >= 6);

  for (const preset of SAUDI_DISTRICT_PRESETS) {
    assert.ok(preset.id);
    assert.ok(preset.nameAr);
    assert.ok(preset.nameEn);
    assert.ok(Array.isArray(preset.location) && preset.location.length === 2);
    const [lat, lng] = preset.location;
    // Saudi Arabia latitude range approx 16 - 32, longitude approx 34 - 56
    assert.ok(lat >= 16 && lat <= 33, `Invalid lat ${lat} for ${preset.id}`);
    assert.ok(lng >= 34 && lng <= 56, `Invalid lng ${lng} for ${preset.id}`);
  }
});
