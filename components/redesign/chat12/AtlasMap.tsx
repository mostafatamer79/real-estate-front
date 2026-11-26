"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import type LType from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ATLAS_CATEGORIES,
  AtlasCategoryKey,
  categorizePlaceType,
  ScanPlaceWithDistance,
} from "@/lib/redesign-chat12-scan";
import styles from "./atlas-scan.module.css";

export interface AtlasMapProps {
  center: [number, number];
  radiusMeters: number;
  zoom: number;
  panTrigger: number;
  places: ScanPlaceWithDistance[];
  activeCategory: AtlasCategoryKey;
  selectedPlaceId: string | number | null;
  isOutdated: boolean;
  locale: "ar" | "en";
  onCenterChange: (lat: number, lng: number) => void;
  onSelectPlace: (place: ScanPlaceWithDistance) => void;
  onScaleLabelChange: (label: string) => void;
  onMapReady?: (actions: {
    zoomIn: () => void;
    zoomOut: () => void;
    centerOnMarker: (target?: [number, number], targetZoom?: number) => void;
  }) => void;
}

function formatScaleBarLabel(lat: number, zoom: number, locale: "ar" | "en"): string {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const rawMeters = metersPerPixel * 64;
  const niceSteps = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
  let best = niceSteps[0];
  for (const step of niceSteps) {
    if (rawMeters >= step * 0.7) {
      best = step;
    }
  }
  if (best >= 1000) {
    const km = best / 1000;
    return locale === "ar" ? `${km} كم` : `${km} km`;
  }
  return locale === "ar" ? `${best} م` : `${best} m`;
}

function MapController({
  center,
  zoom,
  panTrigger,
  locale,
  onCenterChange,
  onScaleLabelChange,
  onMapReady,
}: {
  center: [number, number];
  zoom: number;
  panTrigger: number;
  locale: "ar" | "en";
  onCenterChange: (lat: number, lng: number) => void;
  onScaleLabelChange: (label: string) => void;
  onMapReady?: AtlasMapProps["onMapReady"];
}) {
  const map = useMap();
  const lastDragEndRef = useRef<number>(0);
  const lastPanTriggerRef = useRef<number>(panTrigger);

  useEffect(() => {
    if (!map) return;
    onScaleLabelChange(formatScaleBarLabel(map.getCenter().lat, map.getZoom(), locale));
  }, [map, locale, onScaleLabelChange]);

  useEffect(() => {
    if (!map || !onMapReady) return;
    onMapReady({
      zoomIn: () => map.zoomIn(),
      zoomOut: () => map.zoomOut(),
      centerOnMarker: (target, targetZoom) => {
        const dest = target || center;
        map.setView(dest, targetZoom ?? map.getZoom(), { animate: true });
      },
    });
  }, [map, onMapReady, center]);

  useEffect(() => {
    if (!map) return;
    if (lastPanTriggerRef.current !== panTrigger) {
      lastPanTriggerRef.current = panTrigger;
      map.setView(center, zoom, { animate: true });
    }
  }, [map, panTrigger, center, zoom]);

  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 450);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useMapEvents({
    dragend: () => {
      lastDragEndRef.current = Date.now();
    },
    zoomend: () => {
      onScaleLabelChange(formatScaleBarLabel(map.getCenter().lat, map.getZoom(), locale));
    },
    click: (e) => {
      // Guard against accidental click immediately following a map pan/drag
      if (Date.now() - lastDragEndRef.current < 160) return;
      onCenterChange(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function AtlasMap({
  center,
  radiusMeters,
  zoom,
  panTrigger,
  places,
  activeCategory,
  selectedPlaceId,
  isOutdated,
  locale,
  onCenterChange,
  onSelectPlace,
  onScaleLabelChange,
  onMapReady,
}: AtlasMapProps) {
  const [L, setL] = useState<typeof LType | null>(null);

  useEffect(() => {
    let active = true;
    import("leaflet").then((leaflet) => {
      if (active) setL(leaflet);
    });
    return () => {
      active = false;
    };
  }, []);

  const centerIcon = useMemo(() => {
    if (!L) return undefined;
    return new L.DivIcon({
      className: "atlas-center-pin",
      html: `
        <div style="position:relative;width:36px;height:36px;display:grid;place-items:center;cursor:grab;">
          <span style="position:absolute;inset:2px;border-radius:50%;border:1.5px solid rgba(245,158,11,0.55);background:rgba(245,158,11,0.12);"></span>
          <span style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:3px solid #0a0e17;box-shadow:0 0 0 1px #f59e0b,0 4px 12px rgba(0,0,0,0.6);"></span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }, [L]);

  const filteredPlaces = useMemo(() => {
    if (activeCategory === "all") return places;
    return places.filter((p) => categorizePlaceType(p.type) === activeCategory);
  }, [places, activeCategory]);

  const categoryColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cat of ATLAS_CATEGORIES) {
      map[cat.key] = cat.color;
    }
    return map;
  }, []);

  if (!L) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={styles.atlasMapContainer}
        style={{ display: "grid", placeItems: "center", color: "#94a3b8" }}
      >
        <span>{locale === "ar" ? "جاري تحميل الخريطة الجغرافية..." : "Loading interactive map..."}</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={styles.atlasMapContainer}
      zoomControl={false}
      scrollWheelZoom={true}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
    >
      <MapController
        center={center}
        zoom={zoom}
        panTrigger={panTrigger}
        locale={locale}
        onCenterChange={onCenterChange}
        onScaleLabelChange={onScaleLabelChange}
        onMapReady={onMapReady}
      />

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Geographically accurate scan radius circle */}
      <Circle
        center={center}
        radius={radiusMeters}
        pathOptions={{
          color: "#f59e0b",
          weight: 1.8,
          dashArray: "6 6",
          fillColor: "#f59e0b",
          fillOpacity: 0.08,
        }}
      />
      <Circle
        center={center}
        radius={radiusMeters * 0.62}
        pathOptions={{
          color: "#f59e0b",
          weight: 1,
          opacity: 0.28,
          fill: false,
        }}
      />

      {/* Draggable Scan Center Marker */}
      {centerIcon && (
        <Marker
          position={center}
          icon={centerIcon}
          draggable={true}
          zIndexOffset={1000}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              onCenterChange(latlng.lat, latlng.lng);
            },
          }}
        />
      )}

      {/* Real Service Result Markers */}
      {filteredPlaces.map((place) => {
        const cat = categorizePlaceType(place.type);
        const color = categoryColorMap[cat] || "#38bdf8";
        const isSelected = selectedPlaceId === place.id;
        const opacity = isOutdated ? 0.45 : 1;

        const pinIcon = new L.DivIcon({
          className: "atlas-service-pin",
          html: `
            <div style="
              width:${isSelected ? 22 : 15}px;
              height:${isSelected ? 22 : 15}px;
              border-radius:50%;
              background:${isSelected ? "#f59e0b" : color};
              border:2.5px solid ${isSelected ? "#0a0e17" : "#111827"};
              box-shadow:0 0 0 ${isSelected ? "3px rgba(245,158,11,0.45)" : "1px rgba(255,255,255,0.25)"},0 3px 10px rgba(0,0,0,0.55);
              opacity:${opacity};
              cursor:pointer;
              transition:transform 0.15s ease;
            "></div>
          `,
          iconSize: [isSelected ? 22 : 15, isSelected ? 22 : 15],
          iconAnchor: [isSelected ? 11 : 7.5, isSelected ? 11 : 7.5],
        });

        return (
          <Marker
            key={`${place.id}-${place.latitude}-${place.longitude}`}
            position={[place.latitude, place.longitude]}
            icon={pinIcon}
            zIndexOffset={isSelected ? 900 : 100}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                onSelectPlace(place);
              },
            }}
          />
        );
      })}
    </MapContainer>
  );
}
