"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import { useEffect, useState } from "react";

const defaultIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markerPosition?: [number, number];
  markerTitle?: string;
  markerDescription?: string;
  height?: string;
  width?: string;
  className?: string;
  useCurrentLocation?: boolean;
}

export default function Map({
  center = [24.7136, 46.6753], 
  zoom = 13,
  markerPosition,
  markerTitle = "الرياض, المملكة العربية السعودية",
  markerDescription = "الموقع الافتراضي",
  height = "300px",
  className = "",
  useCurrentLocation = false,
}: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (useCurrentLocation && mounted && navigator.geolocation) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([latitude, longitude]);
          setIsLoadingLocation(false);
          setLocationError(null);
        },
        (error) => {
          setIsLoadingLocation(false);
          setLocationError(error.message);
          console.error("Error getting location:", error);
        }
      );
    }
  }, [useCurrentLocation, mounted]);

  const mapCenter = currentLocation || center;
  const markerPos = markerPosition || currentLocation || center;

  if (!mounted) {
    return (
      <div className={`w-full flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-gray-600">تحميل الخريطة...</div>
      </div>
    );
  }

  if (isLoadingLocation) {
    return (
      <div className={`w-full flex items-center justify-center bg-gray-100 ${className}`} style={{ height }}>
        <div className="text-gray-600">جاري تحديد موقعك...</div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-lg overflow-hidden shadow-lg ${className}`} style={{ height }}>
      <MapContainer
        className="w-full"
        center={mapCenter}
        zoom={zoom}
        style={{ height: height, zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={markerPos} icon={defaultIcon}>
          <Popup>
            <div className="text-center">
              <h3 className="font-bold mb-1">
                {useCurrentLocation && currentLocation ? "موقعك الحالي" : markerTitle}
              </h3>
              <p className="text-sm text-gray-600">
                {useCurrentLocation && currentLocation ? "تم تحديد موقعك بنجاح" : markerDescription}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
      {locationError && (
        <div className="text-red-500 text-sm text-center mt-2 p-2 bg-red-50 rounded">
          خطأ في تحديد الموقع: {locationError}
        </div>
      )}
    </div>
  );
}

