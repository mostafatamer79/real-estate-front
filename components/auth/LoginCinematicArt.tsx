"use client";

import { useState } from "react";
import styles from "./login-cinematic-art.module.css";

type CourtyardZoneId = "discover" | "services" | "followup";

interface CourtyardZone {
  id: CourtyardZoneId;
  index: string;
  labelAr: string;
  labelEn: string;
  captionAr: string;
  captionEn: string;
}

const COURTYARD_ZONES: readonly CourtyardZone[] = [
  {
    id: "discover",
    index: "01",
    labelAr: "استكشف العقار",
    labelEn: "Discover",
    captionAr: "استعراض الوحدات السكنية والمخططات المتاحة بوضوح.",
    captionEn: "Browse curated residences and architectural floor plans.",
  },
  {
    id: "services",
    index: "02",
    labelAr: "الخدمات",
    labelEn: "Services",
    captionAr: "طلب تقييم، تمويل، أو استشارة عقارية مخصصة.",
    captionEn: "Request valuation, financing, or tailored advisory.",
  },
  {
    id: "followup",
    index: "03",
    labelAr: "المتابعة",
    labelEn: "Follow up",
    captionAr: "متابعة طلباتك ومواعيدك من لوحة واحدة.",
    captionEn: "Track your requests and appointments in one place.",
  },
];

interface LoginCinematicArtProps {
  language: string;
}

/**
 * Interactive architectural blueprint elevation with line-draw reveal,
 * gentle hover/active node pulse, and keyboard-accessible zone hotspots.
 */
export default function LoginCinematicArt({ language }: LoginCinematicArtProps) {
  const [activeZoneId, setActiveZoneId] = useState<CourtyardZoneId>("discover");
  const isArabic = language === "ar";
  const activeZone =
    COURTYARD_ZONES.find((zone) => zone.id === activeZoneId) ?? COURTYARD_ZONES[0];

  return (
    <div
      className={styles.artRoot}
      aria-label={
        isArabic
          ? "مخطط تفاعلي للفناء المعماري"
          : "Interactive architectural courtyard blueprint"
      }
    >
      <div className={styles.svgFrame}>
        <svg
          viewBox="0 0 360 112"
          className={styles.wireframeSvg}
          role="img"
          aria-label={
            isArabic
              ? "رسم تخطيطي لفناء معماري من ثلاثة أقسام"
              : "Architectural courtyard blueprint with three interactive sections"
          }
        >
          {/* Blueprint datum grid */}
          <line x1="8" y1="98" x2="352" y2="98" className={styles.gridLine} />
          <line x1="120" y1="10" x2="120" y2="104" className={styles.gridLine} />
          <line x1="240" y1="10" x2="240" y2="104" className={styles.gridLine} />

          {/* Zone 01: Residence Wing & Terraced Elevation */}
          <g
            onClick={() => setActiveZoneId("discover")}
            className={`${styles.zoneGroup} ${
              activeZoneId === "discover" ? styles.zoneGroupActive : ""
            }`}
          >
            <rect
              x="16"
              y="24"
              width="96"
              height="74"
              rx="1"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay1}`}
            />
            <rect
              x="28"
              y="38"
              width="28"
              height="36"
              rx="1"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay2}`}
            />
            <rect
              x="66"
              y="38"
              width="34"
              height="22"
              rx="1"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay3}`}
            />
            <line x1="16" y1="18" x2="112" y2="18" className={styles.zoneAccent} />
            <circle cx="64" cy="24" r="6" className={styles.zonePulseRing} />
            <circle
              cx="64"
              cy="24"
              r={activeZoneId === "discover" ? 3.5 : 2.5}
              className={styles.zoneNode}
            />
          </g>

          {/* Zone 02: Central Courtyard & Colonnade */}
          <g
            onClick={() => setActiveZoneId("services")}
            className={`${styles.zoneGroup} ${
              activeZoneId === "services" ? styles.zoneGroupActive : ""
            }`}
          >
            <rect
              x="128"
              y="42"
              width="104"
              height="56"
              rx="1"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay2}`}
            />
            <path
              d="M142 98 V64 A14 14 0 0 1 170 64 V98"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay3}`}
            />
            <path
              d="M190 98 V64 A14 14 0 0 1 218 64 V98"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay3}`}
            />
            <rect x="148" y="82" width="64" height="8" rx="1" className={styles.zoneAccent} />
            <circle cx="180" cy="42" r="6" className={styles.zonePulseRing} />
            <circle
              cx="180"
              cy="42"
              r={activeZoneId === "services" ? 3.5 : 2.5}
              className={styles.zoneNode}
            />
          </g>

          {/* Zone 03: Gateway Arch & Follow-up Pavilion */}
          <g
            onClick={() => setActiveZoneId("followup")}
            className={`${styles.zoneGroup} ${
              activeZoneId === "followup" ? styles.zoneGroupActive : ""
            }`}
          >
            <rect
              x="248"
              y="30"
              width="96"
              height="68"
              rx="1"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay3}`}
            />
            <path
              d="M276 98 V56 A20 20 0 0 1 316 56 V98"
              pathLength={100}
              className={`${styles.zoneStroke} ${styles.drawDelay4}`}
            />
            <line x1="258" y1="42" x2="334" y2="42" className={styles.zoneAccent} />
            <circle cx="296" cy="30" r="6" className={styles.zonePulseRing} />
            <circle
              cx="296"
              cy="30"
              r={activeZoneId === "followup" ? 3.5 : 2.5}
              className={styles.zoneNode}
            />
          </g>
        </svg>
      </div>

      <div
        className={styles.hotspotRow}
        role="group"
        aria-label={isArabic ? "نقاط استكشاف المنصة" : "Platform exploration hotspots"}
      >
        {COURTYARD_ZONES.map((zone) => {
          const isActive = zone.id === activeZoneId;
          return (
            <button
              key={zone.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveZoneId(zone.id)}
              className={`${styles.hotspotBtn} ${isActive ? styles.hotspotBtnActive : ""}`}
            >
              <span className={styles.hotspotIndex} dir="ltr">
                {zone.index}
              </span>
              <span>{isArabic ? zone.labelAr : zone.labelEn}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.caption} aria-live="polite">
        {isArabic ? activeZone.captionAr : activeZone.captionEn}
      </p>
    </div>
  );
}
