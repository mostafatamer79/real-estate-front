'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Map as MapInstance, Marker as MarkerInstance, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Compass, Maximize2, Minimize2, Minus, Plus, RefreshCw } from 'lucide-react';
import styles from './geographic-map.module.css';

export interface GeographicMapProps {
  latitude?: number;
  longitude?: number;
  showPropertyPin?: boolean;
  propertyPinColor?: string;
  enable3d?: boolean;
  isDark?: boolean;
  language?: string;
  className?: string;
  style?: CSSProperties;
  onWebGlError?: () => void;
}

const SATELLITE_RASTER_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const OPENFREEMAP_PLANET_URL = 'https://tiles.openfreemap.org/planet';
const STREETS_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

// Base satellite style loads only fast raster tiles so the map is visible and interactive quickly;
// 3D building extrusions are attached progressively once the base map is ready.
const SATELLITE_BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [SATELLITE_RASTER_URL],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

const BUILDING_EXTRUSION_LAYER = {
  id: '3d-buildings',
  source: 'openfreemap',
  'source-layer': 'building',
  type: 'fill-extrusion',
  minzoom: 13,
  paint: {
    'fill-extrusion-color': [
      'interpolate',
      ['linear'],
      ['coalesce', ['get', 'render_height'], 0],
      0,
      '#d4d4d8',
      20,
      '#a1a1aa',
      60,
      '#71717a',
      120,
      '#52525b',
    ],
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      13,
      0,
      14.5,
      ['coalesce', ['get', 'render_height'], 0],
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      13,
      0,
      14.5,
      ['coalesce', ['get', 'render_min_height'], 0],
    ],
    'fill-extrusion-opacity': 0.85,
  },
};

function ensureBuildingExtrusion(map: MapInstance, visible: boolean) {
  let sourceId = map.getSource('openfreemap')
    ? 'openfreemap'
    : map.getSource('openmaptiles')
    ? 'openmaptiles'
    : null;

  if (!sourceId && visible) {
    try {
      map.addSource('openfreemap', {
        type: 'vector',
        url: OPENFREEMAP_PLANET_URL,
      });
      sourceId = 'openfreemap';
    } catch {
      return;
    }
  }

  if (sourceId && !map.getLayer('3d-buildings')) {
    try {
      map.addLayer({ ...BUILDING_EXTRUSION_LAYER, source: sourceId } as Parameters<MapInstance['addLayer']>[0]);
    } catch {
      return;
    }
  }

  if (map.getLayer('3d-buildings')) {
    map.setLayoutProperty('3d-buildings', 'visibility', visible ? 'visible' : 'none');
  }
}

function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function GeographicMap({
  latitude = 24.7136,
  longitude = 46.6753,
  showPropertyPin = true,
  propertyPinColor = '#d92d2d',
  enable3d = true,
  language = 'ar',
  className,
  style,
  onWebGlError,
}: GeographicMapProps) {
  const isAr = language === 'ar';
  const shellRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapInstance | null>(null);
  const maplibreglRef = useRef<typeof import('maplibre-gl') | null>(null);
  const markerRef = useRef<MarkerInstance | null>(null);
  const markerDotRef = useRef<HTMLDivElement | null>(null);
  const markerLabelRef = useRef<HTMLSpanElement | null>(null);
  const onWebGlErrorRef = useRef(onWebGlError);
  onWebGlErrorRef.current = onWebGlError;

  const [mode, setMode] = useState<'satellite' | 'streets'>('satellite');
  const [is3D, setIs3D] = useState(enable3d);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const configRef = useRef({ latitude, longitude, showPropertyPin, propertyPinColor, isAr, mode, is3D });
  configRef.current = { latitude, longitude, showPropertyPin, propertyPinColor, isAr, mode, is3D };
  const initialMountCoordsRef = useRef({ latitude, longitude });
  const baseLoadedRef = useRef(false);
  const fellBackToStreetsRef = useRef(false);
  const styleTimeoutRef = useRef<number | null>(null);

  // Sync reduced-motion preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
      mapRef.current?.resize();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  // Initialize MapLibre once per mount/retry (never rebuild on coordinate, language, or styling changes)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (!isWebGLSupported()) {
      setHasError(true);
      setIsLoading(false);
      onWebGlErrorRef.current?.();
      return;
    }

    let cancelled = false;
    let mapInstance: MapInstance | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let idleHandle: number | null = null;
    let buildingTimer: number | null = null;
    baseLoadedRef.current = false;
    fellBackToStreetsRef.current = false;

    const timeout = window.setTimeout(() => {
      if (!cancelled && !baseLoadedRef.current) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 20000);

    const {
      latitude: initLat,
      longitude: initLng,
      showPropertyPin: initShowPin,
      propertyPinColor: initPinColor,
      isAr: initIsAr,
      mode: initMode,
      is3D: init3D,
    } = configRef.current;
    initialMountCoordsRef.current = { latitude: initLat, longitude: initLng };

    const syncMarker = (
      maplibregl: typeof import('maplibre-gl'),
      map: MapInstance,
      showPin: boolean,
      pinColor: string,
      ar: boolean,
      lng: number,
      lat: number
    ) => {
      if (!showPin) {
        markerRef.current?.remove();
        markerRef.current = null;
        markerDotRef.current = null;
        markerLabelRef.current = null;
        return;
      }

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
        if (markerDotRef.current) markerDotRef.current.style.backgroundColor = pinColor;
        if (markerLabelRef.current) markerLabelRef.current.textContent = ar ? 'موقع العقار' : 'Property Location';
        return;
      }

      const markerEl = document.createElement('div');
      markerEl.className = styles.marker;

      const dotEl = document.createElement('div');
      dotEl.className = styles.markerDot;
      dotEl.style.backgroundColor = pinColor;
      markerDotRef.current = dotEl;

      const labelEl = document.createElement('span');
      labelEl.className = styles.markerLabel;
      labelEl.textContent = ar ? 'موقع العقار' : 'Property Location';
      markerLabelRef.current = labelEl;

      markerEl.appendChild(dotEl);
      markerEl.appendChild(labelEl);

      markerRef.current = new maplibregl.Marker({ element: markerEl })
        .setLngLat([lng, lat])
        .addTo(map);
    };

    const scheduleBuildings = (map: MapInstance) => {
      if (!configRef.current.is3D) return;
      const attach = () => {
        if (cancelled || !configRef.current.is3D) return;
        ensureBuildingExtrusion(map, true);
      };
      if (typeof window.requestIdleCallback === 'function') {
        idleHandle = window.requestIdleCallback(attach, { timeout: 600 });
      } else {
        buildingTimer = window.setTimeout(attach, 120);
      }
    };

    const initMap = async () => {
      try {
        setIsLoading(true);
        setHasError(false);

        const maplibregl = await import('maplibre-gl');
        maplibreglRef.current = maplibregl;

        if (cancelled) return;

        const animateEntry = init3D && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const initialPitch = init3D ? 55 : 0;
        const initialStyle = initMode === 'satellite' ? SATELLITE_BASE_STYLE : STREETS_STYLE_URL;

        const map = new maplibregl.Map({
          container,
          style: initialStyle,
          center: [initLng, initLat],
          zoom: animateEntry ? 15.6 : 16,
          pitch: animateEntry ? 32 : initialPitch,
          bearing: -24,
          attributionControl: false,
          pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
          maxTileCacheSize: 64,
          fadeDuration: 150,
          refreshExpiredTiles: false,
        });

        mapInstance = map;
        mapRef.current = map;

        map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

        // Stop camera on user interactions
        const stopCamera = (event: { originalEvent?: unknown }) => {
          if (event.originalEvent && (map.isMoving() || map.isRotating())) {
            map.stop();
          }
        };
        map.on('dragstart', stopCamera);
        map.on('rotatestart', stopCamera);
        map.on('pitchstart', stopCamera);
        map.on('zoomstart', stopCamera);
        map.on('touchstart', stopCamera);

        map.on('webglcontextlost', (e) => {
          (e as { originalEvent?: Event }).originalEvent?.preventDefault?.();
          if (cancelled) return;
          setHasError(true);
          setIsLoading(false);
          onWebGlErrorRef.current?.();
        });

        map.on('load', () => {
          if (cancelled) return;
          baseLoadedRef.current = true;
          window.clearTimeout(timeout);
          setIsLoading(false);
          setHasError(false);
          if (animateEntry) {
            map.easeTo({ zoom: 16, pitch: initialPitch, bearing: -24, duration: 850 });
          }
          scheduleBuildings(map);
          const attribution = map.getContainer().querySelector<HTMLDetailsElement>('.maplibregl-ctrl-attrib');
          if (attribution?.classList.contains('maplibregl-compact-show')) {
            attribution.querySelector<HTMLElement>('summary')?.click();
          }
        });

        map.on('style.load', () => {
          if (cancelled) return;
          const current3D = configRef.current.is3D;
          if (map.getSource('openfreemap') || map.getSource('openmaptiles')) {
            ensureBuildingExtrusion(map, current3D);
          } else if (baseLoadedRef.current && current3D) {
            scheduleBuildings(map);
          }
        });

        map.on('error', (e) => {
          if (cancelled) return;
          const message = e?.error?.message || '';
          if (message.includes('WebGL') || message.includes('GPU') || message.includes('context')) {
            window.clearTimeout(timeout);
            setHasError(true);
            setIsLoading(false);
            onWebGlErrorRef.current?.();
            return;
          }

          // Ignore transient single-tile or aborted requests once the base map is visible
          const hasTile = Boolean((e as { tile?: unknown })?.tile);
          if (baseLoadedRef.current && hasTile) {
            return;
          }

          // If initial satellite provider fails before load, fall back once to Streets style
          if (!baseLoadedRef.current && configRef.current.mode === 'satellite' && !fellBackToStreetsRef.current) {
            fellBackToStreetsRef.current = true;
            setMode('streets');
            map.setStyle(STREETS_STYLE_URL);
            return;
          }

          if (!baseLoadedRef.current) {
            window.clearTimeout(timeout);
            setHasError(true);
            setIsLoading(false);
          }
        });

        syncMarker(maplibregl, map, initShowPin, initPinColor, initIsAr, initLng, initLat);

        resizeObserver = new ResizeObserver(() => {
          map.resize();
        });
        resizeObserver.observe(container);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
          onWebGlErrorRef.current?.();
        }
      }
    };

    void initMap();

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (styleTimeoutRef.current !== null) {
        window.clearTimeout(styleTimeoutRef.current);
        styleTimeoutRef.current = null;
      }
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (buildingTimer !== null) {
        window.clearTimeout(buildingTimer);
      }
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      markerDotRef.current = null;
      markerLabelRef.current = null;
      mapInstance?.remove();
      mapRef.current = null;
    };
  }, [retryKey]);

  // Update coordinates smoothly without recreating the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (
      initialMountCoordsRef.current.latitude === latitude &&
      initialMountCoordsRef.current.longitude === longitude
    ) {
      return;
    }
    initialMountCoordsRef.current = { latitude, longitude };
    markerRef.current?.setLngLat([longitude, latitude]);
    map.easeTo({ center: [longitude, latitude], duration: reducedMotion ? 0 : 450 });
  }, [latitude, longitude, reducedMotion]);

  // Update marker visibility, color, and language label in place
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreglRef.current;
    if (!map || !maplibregl) return;

    if (!showPropertyPin) {
      markerRef.current?.remove();
      markerRef.current = null;
      markerDotRef.current = null;
      markerLabelRef.current = null;
      return;
    }

    if (markerRef.current) {
      if (markerDotRef.current) markerDotRef.current.style.backgroundColor = propertyPinColor;
      if (markerLabelRef.current) markerLabelRef.current.textContent = isAr ? 'موقع العقار' : 'Property Location';
      return;
    }

    const markerEl = document.createElement('div');
    markerEl.className = styles.marker;

    const dotEl = document.createElement('div');
    dotEl.className = styles.markerDot;
    dotEl.style.backgroundColor = propertyPinColor;
    markerDotRef.current = dotEl;

    const labelEl = document.createElement('span');
    labelEl.className = styles.markerLabel;
    labelEl.textContent = isAr ? 'موقع العقار' : 'Property Location';
    markerLabelRef.current = labelEl;

    markerEl.appendChild(dotEl);
    markerEl.appendChild(labelEl);

    markerRef.current = new maplibregl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .addTo(map);
  }, [showPropertyPin, propertyPinColor, isAr, latitude, longitude]);

  const handleModeChange = (newMode: 'satellite' | 'streets') => {
    if (newMode === mode) return;
    setMode(newMode);
    const map = mapRef.current;
    if (!map) return;

    if (styleTimeoutRef.current !== null) {
      window.clearTimeout(styleTimeoutRef.current);
    }
    setIsLoading(true);
    setHasError(false);

    const styleTarget = newMode === 'satellite' ? SATELLITE_BASE_STYLE : STREETS_STYLE_URL;
    styleTimeoutRef.current = window.setTimeout(() => {
      styleTimeoutRef.current = null;
      setIsLoading(false);
      setHasError(true);
    }, 12000);

    map.once('style.load', () => {
      if (styleTimeoutRef.current !== null) {
        window.clearTimeout(styleTimeoutRef.current);
        styleTimeoutRef.current = null;
      }
      setIsLoading(false);
      ensureBuildingExtrusion(map, configRef.current.is3D);
    });
    map.setStyle(styleTarget);
  };

  const handleToggle3D = () => {
    const next3D = !is3D;
    setIs3D(next3D);
    const map = mapRef.current;
    if (!map) return;

    const targetPitch = next3D ? 55 : 0;
    const targetBearing = next3D ? map.getBearing() : 0;

    if (reducedMotion) {
      map.jumpTo({ pitch: targetPitch, bearing: targetBearing });
    } else {
      map.easeTo({ pitch: targetPitch, bearing: targetBearing, duration: 600 });
    }

    ensureBuildingExtrusion(map, next3D);
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn({ duration: reducedMotion ? 0 : 300 });
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut({ duration: reducedMotion ? 0 : 300 });
  };

  const handleResetBearing = () => {
    const map = mapRef.current;
    if (!map) return;
    const targetPitch = is3D ? 55 : 0;
    if (reducedMotion) {
      map.jumpTo({ center: [longitude, latitude], bearing: 0, pitch: targetPitch });
    } else {
      map.easeTo({ center: [longitude, latitude], bearing: 0, pitch: targetPitch, duration: 800 });
    }
  };

  const handleToggleFullscreen = async () => {
    const container = shellRef.current;
    if (!container) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      // Gracefully ignore fullscreen request rejection
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setRetryKey((k) => k + 1);
  };

  const latAbs = Math.abs(latitude);
  const lngAbs = Math.abs(longitude);
  const latDir = latitude >= 0 ? 'N' : 'S';
  const lngDir = longitude >= 0 ? 'E' : 'W';
  const formattedCoordinates = `${latAbs.toFixed(4)}°${latDir}, ${lngAbs.toFixed(4)}°${lngDir}`;

  return (
    <div
      ref={shellRef}
      className={`${styles.shell} ${className || ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ position: 'relative', width: '100%', height: '100%', ...style }}
    >
      <div ref={mapContainerRef} className={styles.map} />
      <div className={styles.vignette} aria-hidden="true" />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>{isAr ? 'الاستكشاف الجغرافي' : 'Geographic Map'}</span>
          <h3 className={styles.title}>{isAr ? 'خريطة الحي' : 'Neighborhood Area'}</h3>
        </div>
        <div className={styles.badge}>
          <span className={styles.dot} aria-hidden="true" />
          <span>{mode === 'satellite' ? (isAr ? 'قمر صناعي' : 'Satellite') : (isAr ? 'شوارع' : 'Streets')}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar} role="toolbar" aria-label={isAr ? 'أدوات الخريطة' : 'Map view options'}>
        <button
          type="button"
          className={`${styles.segment} ${mode === 'satellite' ? styles.active : ''}`}
          aria-pressed={mode === 'satellite'}
          disabled={isLoading}
          onClick={() => handleModeChange('satellite')}
        >
          {isAr ? 'قمر صناعي' : 'Satellite'}
        </button>
        <button
          type="button"
          className={`${styles.segment} ${mode === 'streets' ? styles.active : ''}`}
          aria-pressed={mode === 'streets'}
          disabled={isLoading}
          onClick={() => handleModeChange('streets')}
        >
          {isAr ? 'شوارع' : 'Streets'}
        </button>
        <button
          type="button"
          className={`${styles.segment} ${is3D ? styles.active : ''}`}
          disabled={isLoading}
          onClick={handleToggle3D}
          aria-pressed={is3D}
        >
          {is3D ? '3D' : '2D'}
        </button>
      </div>

      {/* Controls */}
      <div className={styles.controls} role="group" aria-label={isAr ? 'التحكم بالخريطة' : 'Map controls'}>
        <button
          type="button"
          className={styles.control}
          onClick={handleZoomIn}
          aria-label={isAr ? 'تكبير' : 'Zoom in'}
          title={isAr ? 'تكبير' : 'Zoom in'}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={handleZoomOut}
          aria-label={isAr ? 'تصغير' : 'Zoom out'}
          title={isAr ? 'تصغير' : 'Zoom out'}
        >
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={handleResetBearing}
          aria-label={isAr ? 'إعادة ضبط الاتجاه' : 'Reset compass'}
          title={isAr ? 'إعادة ضبط الاتجاه' : 'Reset compass'}
        >
          <Compass className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.control}
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? (isAr ? 'إنهاء ملء الشاشة' : 'Exit fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
          title={isFullscreen ? (isAr ? 'إنهاء ملء الشاشة' : 'Exit fullscreen') : (isAr ? 'ملء الشاشة' : 'Fullscreen')}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.location}>
          <span className={styles.coordinates}>{formattedCoordinates}</span>
        </div>
        <div className={styles.hint}>
          {is3D
            ? isAr
              ? 'اسحب للتنقل، وبزر الفأرة الأيمن لتدوير المنظور'
              : 'Drag or right-click to tilt and rotate'
            : isAr
            ? 'اسحب للتنقل واستخدم التكبير للاستكشاف'
            : 'Drag to pan, scroll to zoom'}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className={styles.loading} role="status">
          <span>{isAr ? 'جاري تحميل الخريطة...' : 'Loading map...'}</span>
        </div>
      )}

      {/* Error state with retry */}
      {hasError && (
        <div className={styles.error} role="alert">
          <p>{isAr ? 'تعذر تحميل الخريطة ثلاثية الأبعاد' : 'Unable to load 3D geographic map'}</p>
          <button type="button" className={styles.retry} onClick={handleRetry}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
