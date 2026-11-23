'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Compass, Navigation } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings, resolveSurfaceColor } from '@/context/SettingsContext';
import { DETAILS_DESIGN_KEY, parseDetailsDesign } from '@/lib/details-design';
import type { NeighborhoodScene, DroneTelemetry } from './neighborhood-scene';
import { Button } from '@/components/ui/button';
import styles from './details-explorer.module.css';

const PropertyMap = dynamic(() => import('@/app/src/components/Map'), { ssr: false });

export default function DetailsNeighborhood({ showTitle = true }: { showTitle?: boolean }) {
  const { settings } = useSettings();
  const { t, language } = useLanguage();
  const design = useMemo(() => parseDetailsDesign(settings.textOverrides[DETAILS_DESIGN_KEY]), [settings.textOverrides]);
  const [nearViewport, setNearViewport] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [selected, setSelected] = useState<string | null>(null);
  const [telemetry, setTelemetry] = useState<DroneTelemetry>({ state: 'overhead', altitude: 38, heading: 41 });
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<NeighborhoodScene | null>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const theme = useRef(settings.isDark);
  theme.current = settings.isDark;

  const useMapFallback = status === 'failed' || !design.enable3d;
  const markers = [
    ...(design.showPropertyPin ? [{ id: 'apartment', ar: t('details.scene.property'), en: t('details.scene.property') }] : []),
    ...(design.showPins ? design.places.filter(place => place.enabled) : []),
  ];
  const active = markers.find(place => place.id === selected);
  const markerLabel = (place: { ar: string; en: string }) => language === 'ar' ? place.ar : place.en;

  useEffect(() => {
    const region = root.current;
    if (!region) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: '240px 0px' });
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { scene.current?.theme(settings.isDark); }, [settings.isDark]);

  const placesJson = JSON.stringify(design.places);
  useEffect(() => {
    const target = host.current;
    if (!nearViewport || !design.enable3d || !target) return;
    let cancelled = false;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => scene.current?.setReducedMotion(media.matches);
    setStatus('loading');

    import('./neighborhood-scene').then(({ createNeighborhoodScene }) => {
      if (cancelled) return;
      scene.current = createNeighborhoodScene(target, pins => {
        const width = target.clientWidth;
        for (const { id, visible, x, y } of pins) {
          const button = pinRefs.current.get(id);
          if (!button) continue;
          button.hidden = !visible;
          if (visible) {
            const left = Math.max(30, Math.min(x, width - 30));
            button.style.transform = `translate3d(${left}px, ${y}px, 0) translate(-50%, -50%)`;
          }
        }
      }, {
        places: JSON.parse(placesJson),
        dark: theme.current,
        reducedMotion: media.matches,
        onDroneStateChange: setTelemetry,
      });
      setStatus('ready');
    }).catch(() => {
      if (!cancelled) setStatus('failed');
    });

    media.addEventListener('change', change);
    return () => {
      cancelled = true;
      media.removeEventListener('change', change);
      scene.current?.dispose();
      scene.current = null;
    };
  }, [design.enable3d, nearViewport, placesJson]);

  useEffect(() => { scene.current?.draw(); }, [design.showPins, design.showPropertyPin, language]);

  const handlePinClick = (placeId: string) => {
    if (selected === placeId) {
      setSelected(null);
    } else {
      setSelected(placeId);
      scene.current?.flyToPlace(placeId);
    }
  };

  return (
    <div id="tour-target-map" ref={root} className={styles.explorer} style={{
      '--scene-desktop': `${design.desktopHeight}px`,
      '--scene-mobile': `${design.mobileHeight}px`,
      '--property-pin-color': design.propertyPinColor,
    } as CSSProperties}>
      {showTitle && <div className={styles.mapHeading}>
        <h2 style={{ color: resolveSurfaceColor(settings.mapTitleColor, settings.isDark), fontSize: settings.mapTitleSize && parseFloat(settings.mapTitleSize) !== 16 ? `${parseFloat(settings.mapTitleSize)}px` : undefined }}>
          {t('details.map.title')}
        </h2>
      </div>}
      <div className={styles.stage}>
        {design.enable3d && (
          <div className={styles.canvas} ref={host} hidden={useMapFallback} tabIndex={status === 'ready' ? 0 : undefined}
            role="group" aria-label={t('details.scene.label')} aria-describedby="details-scene-caption">
            <span id="details-scene-caption" className="sr-only">{t('details.scene.illustration')}</span>
            {status === 'loading' && <p role="status" className={styles.loading}>{t('details.scene.loading')}</p>}
            {status === 'ready' && (
              <>
                <div className={styles.hudOverlay}>
                  <div className={styles.telemetryBadge} aria-live="polite">
                    <span className={styles.telemetryDot} data-state={telemetry.state} aria-hidden="true" />
                    <span className={styles.telemetryMode}>
                      {telemetry.state === 'flying'
                        ? t('details.drone.flying')
                        : telemetry.state === 'street'
                        ? t('details.drone.street')
                        : t('details.drone.overview')}
                    </span>
                    <span className={styles.telemetryDivider} aria-hidden="true">·</span>
                    <span className={styles.telemetryValue}>{telemetry.altitude}m</span>
                    {telemetry.speed ? (
                      <>
                        <span className={styles.telemetryDivider} aria-hidden="true">·</span>
                        <span className={styles.telemetryValue}>{telemetry.speed}km/h</span>
                      </>
                    ) : null}
                    <span className={styles.telemetryDivider} aria-hidden="true">·</span>
                    <span className={styles.telemetryValue}>{telemetry.heading}°</span>
                  </div>
                  <button
                    type="button"
                    className={styles.overviewButton}
                    onClick={() => scene.current?.flyToOverview()}
                    aria-label={t('details.drone.reset')}
                    title={t('details.drone.reset')}
                  >
                    <Compass className={styles.overviewIcon} aria-hidden="true" />
                    <span>{t('details.drone.reset')}</span>
                  </button>
                </div>
                <div className={styles.interactionHint} aria-hidden="true">
                  <Navigation className={styles.hintIcon} />
                  <span>{t('details.drone.hint')}</span>
                </div>
              </>
            )}
            <div className={styles.pins}>
              {markers.map(place => (
                <button key={place.id} type="button" hidden
                  ref={element => { if (element) pinRefs.current.set(place.id, element); else pinRefs.current.delete(place.id); }}
                  className={styles.pin} data-property={place.id === 'apartment'}
                  aria-pressed={selected === place.id} onClick={() => handlePinClick(place.id)}>
                  {markerLabel(place)}
                </button>
              ))}
            </div>
            <span className="sr-only" role="status">
              {active ? `${markerLabel(active)} · ${t(active.id === 'apartment' ? 'details.scene.propertyInfo' : 'details.scene.placeInfo')}` : ''}
            </span>
          </div>
        )}
        {useMapFallback && (
          <>
            {design.enable3d && <span className="sr-only" role="status">{t('details.scene.unavailable')}</span>}
            <PropertyMap center={[design.latitude, design.longitude]} zoom={15}
              markerPosition={[design.latitude, design.longitude]} markerTitle={t('map.markerProp')}
              markerDescription={t('map.markerDefault')} />
          </>
        )}
      </div>
      <div className={styles.bottom}>
        <Button asChild variant="outline" size="sm" className={styles.scan}>
          <Link href="/scan-map" prefetch={false}>
            <MapPin aria-hidden="true" />
            {t('details.scene.scan')}
            <ArrowUpRight aria-hidden="true" className={styles.scanArrow} />
          </Link>
        </Button>
      </div>
    </div>
  );
}
