"use client";

import React from "react";
import { X, Navigation, MapPin } from "lucide-react";
import { ScanPlaceWithDistance, formatDistance, getDistanceTone } from "@/lib/redesign-chat12-scan";
import styles from "./scan-map.module.css";

interface ScanResultsTableProps {
  places: ScanPlaceWithDistance[];
  onClose: () => void;
  locale?: "ar" | "en";
  searchRadius: number;
}

export default function ScanResultsTable({
  places,
  onClose,
  locale = "ar",
  searchRadius,
}: ScanResultsTableProps) {
  const isAr = locale === "ar";

  if (places.length === 0) return null;

  return (
    <div className={styles.panel} style={{ marginTop: "1rem", overflow: "hidden", padding: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.25rem",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--bg-surface-elevated)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Navigation size={18} className="text-amber-500" />
          <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: "var(--text-main)" }}>
            {isAr
              ? `جدول النتائج والمرافق (${places.length} موقع)`
              : `Places & Amenities Table (${places.length} locations)`}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.btnSecondary}
          aria-label={isAr ? "إغلاق جدول النتائج" : "Close results table"}
          style={{ height: "2.25rem", padding: "0 0.75rem" }}
        >
          <X size={14} />
          <span>{isAr ? "إغلاق" : "Close"}</span>
        </button>
      </div>

      <div style={{ overflowX: "auto", maxHeight: "460px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: isAr ? "right" : "left" }}>
          <thead style={{ position: "sticky", top: 0, backgroundColor: "var(--bg-surface-elevated)", zIndex: 1 }}>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              <th scope="col" style={{ padding: "0.75rem 1rem", width: "45px", textAlign: "center" }}>#</th>
              <th scope="col" style={{ padding: "0.75rem 1rem" }}>{isAr ? "اسم المرفق" : "Place Name"}</th>
              <th scope="col" style={{ padding: "0.75rem 1rem" }}>{isAr ? "النوع" : "Category"}</th>
              <th scope="col" style={{ padding: "0.75rem 1rem" }}>{isAr ? "المسافة التقريبية" : "Approx. Distance"}</th>
              <th scope="col" style={{ padding: "0.75rem 1rem" }}>{isAr ? "الإحداثيات" : "Coordinates"}</th>
            </tr>
          </thead>
          <tbody style={{ fontSize: "0.8125rem", color: "var(--text-main)" }}>
            {places.map((place, idx) => {
              const tone = getDistanceTone(place.distance);
              return (
                <tr
                  key={place.id || idx}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-surface-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <MapPin size={14} className="text-slate-400 flex-shrink-0" />
                      <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {place.name}
                      </span>
                    </div>
                    {place.city && (
                      <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                        {place.city}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.375rem",
                        backgroundColor: "var(--bg-surface-elevated)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {place.type}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span
                      className={tone.colorClass}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.2rem 0.55rem",
                        borderRadius: "0.375rem",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      <span>{formatDistance(place.distance, locale)}</span>
                      <span style={{ fontSize: "0.625rem", opacity: 0.85 }}>({tone.badgeLabel})</span>
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontFamily: "ui-monospace, monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "0.75rem 1.25rem",
          backgroundColor: "var(--bg-surface-elevated)",
          borderTop: "1px solid var(--border-subtle)",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>
          {isAr
            ? `إجمالي ${places.length} موقع ضمن نطاق ${searchRadius.toLocaleString()} متر.`
            : `Total of ${places.length} locations within ${searchRadius.toLocaleString()}m radius.`}
        </span>
      </div>
    </div>
  );
}
