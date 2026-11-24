"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Compass } from "lucide-react";
import styles from "./scan-map.module.css";

interface ScanMapHeaderProps {
  onBack: () => void;
  title: string;
  description: string;
  locale?: "ar" | "en";
}

export default function ScanMapHeader({
  onBack,
  title,
  description,
  locale = "ar",
}: ScanMapHeaderProps) {
  const isAr = locale === "ar";

  return (
    <header className={styles.headerCard}>
      <div className={styles.headerTextGroup}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.25rem" }}>
          <button
            type="button"
            onClick={onBack}
            className={styles.btnSecondary}
            aria-label={isAr ? "رجوع إلى الصفحة السابقة" : "Back to previous page"}
            style={{ height: "2.25rem", padding: "0 0.75rem" }}
          >
            {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{isAr ? "رجوع" : "Back"}</span>
          </button>
          <span className={styles.headerKicker}>
            <Compass size={12} style={{ display: "inline", verticalAlign: "middle", marginInlineEnd: "4px" }} />
            {isAr ? "المسح الجغرافي والتحليل المكاني" : "Geospatial Survey & Cartography"}
          </span>
        </div>

        <h1 className={styles.headerTitle}>{title}</h1>
        <p className={styles.headerDesc}>{description}</p>
      </div>

      <div className={styles.artworkVignette}>
        <Image
          src="/artworks/chat12-cartography-plinth.webp"
          alt={isAr ? "مرصد المسح الجغرافي المعماري" : "Cartographic Architectural Survey Pavilion"}
          width={560}
          height={220}
          priority
          className={styles.artworkImage}
        />
        <div className={styles.artworkBadge}>
          {isAr ? "مسح الأحياء الذكي" : "Smart District Survey"}
        </div>
      </div>
    </header>
  );
}
