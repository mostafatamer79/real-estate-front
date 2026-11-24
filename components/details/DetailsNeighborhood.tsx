'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Compass, Navigation, Plus, Minus } from 'lucide-react';
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
  const [revealed, setRevealed] = useState(false);
  const [telemetry, setTelemetry] = useState<DroneTelemetry>({ state: 'overhead', altitude: 38, heading: 41 });
  const root = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<NeighborhoodScene | null>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const theme = useRef(settings.isDark);
  theme.current = settings.isDark;

  const useMapFallback = status === 'failed' || !design.enable3d;
  const propertyLabel = language === 'ar' ? 'عقار' : 'Property';

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
        for (const { id, x, y } of pins) {
          const button = pinRefs.current.get(id);
          if (!button) continue;
          button.hidden = false;
          const left = Math.max(60, Math.min(x, width - 60));
          const top = Math.max(80, Math.min(y, target.clientHeight - 60));
          button.style.transform = `translate3d(${left}px, ${top}px, 0) translate(-50%, -50%)`;
        }
      }, {
        places: JSON.parse(placesJson),
        dark: theme.current,
        reducedMotion: media.matches,
        propertyEntry: true,
        onDroneStateChange: value => setTelemetry(previous => previous.state === value.state ? previous : value),
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

  const revealMap = () => {
    setRevealed(true);
    scene.current?.flyToOverview();
    host.current?.focus({ preventScroll: true });
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
          <div className={styles.canvas} data-revealed={revealed} ref={host} hidden={useMapFallback} tabIndex={status === 'ready' ? 0 : undefined}
            role="group" aria-label={t('details.scene.label')} aria-describedby="details-scene-caption">
            <span id="details-scene-caption" className="sr-only">{t('details.scene.illustration')}</span>
            {status === 'loading' && <p role="status" className={styles.loading}>{t('details.scene.loading')}</p>}
            {status === 'ready' && (
              <>
                <div className={styles.hudOverlay}>
                  <div className={styles.telemetryBadge} role="status">
                    <span className={styles.telemetryDot} data-state={telemetry.state} aria-hidden="true" />
                    <span className={styles.telemetryMode}>
                      {telemetry.state === 'flying'
                        ? t('details.drone.flying')
                        : telemetry.state === 'street'
                        ? t('details.drone.street')
                        : t('details.drone.overview')}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.overviewButton}
                    onClick={() => { setRevealed(true); scene.current?.flyToOverview(); }}
                    aria-label={t('details.drone.reset')}
                    title={t('details.drone.reset')}
                  >
                    <Compass className={styles.overviewIcon} aria-hidden="true" />
                    <span>{t('details.drone.reset')}</span>
                  </button>
                </div>
                <div className={styles.zoomControls} role="group" aria-label={language === 'ar' ? 'تكبير الخريطة' : 'Map zoom'}>
                  <button type="button" onClick={() => scene.current?.zoom(-0.15)} aria-label={language === 'ar' ? 'تكبير' : 'Zoom in'}><Plus aria-hidden="true" /></button>
                  <button type="button" onClick={() => scene.current?.zoom(0.15)} aria-label={language === 'ar' ? 'تصغير' : 'Zoom out'}><Minus aria-hidden="true" /></button>
                </div>
                <div className={styles.interactionHint} aria-hidden="true">
                  <Navigation className={styles.hintIcon} />
                  <span>{t('details.drone.hint')}</span>
                </div>
              </>
            )}
            <div className={styles.pins}>
              <button type="button" hidden
                ref={element => { if (element) pinRefs.current.set('apartment', element); else pinRefs.current.delete('apartment'); }}
                className={`${styles.pin} ${styles.propertyEntry}`} data-property="true" data-dismissed={revealed}
                disabled={revealed} aria-hidden={revealed} onClick={revealMap}>
                {propertyLabel}
              </button>
            </div>
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
