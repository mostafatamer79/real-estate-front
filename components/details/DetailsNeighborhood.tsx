'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings, resolveSurfaceColor } from '@/context/SettingsContext';
import { DETAILS_DESIGN_KEY, parseDetailsDesign } from '@/lib/details-design';
import { Button } from '@/components/ui/button';
import styles from './details-explorer.module.css';

const GeographicMap = dynamic(() => import('./GeographicMap'), { ssr: false });
const PropertyMap = dynamic(() => import('@/app/src/components/Map'), { ssr: false });

export default function DetailsNeighborhood({ showTitle = true }: { showTitle?: boolean }) {
  const { settings } = useSettings();
  const { t, language } = useLanguage();
  const design = useMemo(() => parseDetailsDesign(settings.textOverrides[DETAILS_DESIGN_KEY]), [settings.textOverrides]);
  const [nearViewport, setNearViewport] = useState(false);
  const [fallbackToLeaflet, setFallbackToLeaflet] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const handleWebGlError = useCallback(() => setFallbackToLeaflet(true), []);

  const useMapFallback = !design.enable3d || fallbackToLeaflet;

  useEffect(() => {
    const region = root.current;
    if (!region) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setNearViewport(true);
      observer.disconnect();
    }, { rootMargin: '360px 0px' });
    observer.observe(region);
    return () => observer.disconnect();
  }, []);

  return (
    <div id="tour-target-map" ref={root} className={styles.explorer} style={{
      '--scene-desktop': `${design.desktopHeight}px`,
      '--scene-mobile': `${design.mobileHeight}px`,
      '--property-pin-color': design.propertyPinColor,
    } as CSSProperties}>
      {showTitle && <div className={styles.mapHeading}>
        <h2 style={{
          color: resolveSurfaceColor(settings.mapTitleColor, settings.isDark),
          fontSize: settings.mapTitleSize && parseFloat(settings.mapTitleSize) !== 16 ? `${parseFloat(settings.mapTitleSize)}px` : undefined,
        }}>
          {t('details.map.title')}
        </h2>
      </div>}
      <div className={styles.stage}>
        {nearViewport && (
          useMapFallback ? (
            <>
              {design.enable3d && <span className="sr-only" role="status">{t('details.scene.unavailable')}</span>}
              <PropertyMap
                center={[design.latitude, design.longitude]}
                zoom={15}
                markerPosition={[design.latitude, design.longitude]}
                markerTitle={t('map.markerProp')}
                markerDescription={t('map.markerDefault')}
              />
            </>
          ) : (
            <GeographicMap
              latitude={design.latitude}
              longitude={design.longitude}
              showPropertyPin={design.showPropertyPin}
              propertyPinColor={design.propertyPinColor}
              enable3d={design.enable3d}
              showPlaces={design.showPins}
              isDark={settings.isDark}
              language={language}
              onWebGlError={handleWebGlError}
            />
          )
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
