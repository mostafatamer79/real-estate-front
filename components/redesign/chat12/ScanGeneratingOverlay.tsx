"use client";

import React from "react";
import { Loader2, FileSpreadsheet, FileText } from "lucide-react";
import styles from "./scan-map.module.css";

interface ScanGeneratingOverlayProps {
  isGenerating: boolean;
  locale?: "ar" | "en";
}

export default function ScanGeneratingOverlay({
  isGenerating,
  locale = "ar",
}: ScanGeneratingOverlayProps) {
  if (!isGenerating) return null;

  const isAr = locale === "ar";

  return (
    <div
      className={styles.dialogBackdrop}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={styles.dialogWindow}
        style={{ maxWidth: "480px", textAlign: "center", alignItems: "center" }}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div
          style={{
            width: "4.5rem",
            height: "4.5rem",
            borderRadius: "1.25rem",
            backgroundColor: "var(--accent-gold-bg)",
            border: "1px solid var(--accent-gold-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-brass)",
            marginBottom: "0.5rem",
          }}
        >
          <Loader2 size={36} className="animate-spin" />
        </div>

        <h3 className={styles.dialogTitle}>
          {isAr ? "جاري بناء تقرير الحي الرقمي" : "Generating Neighborhood Report"}
        </h3>

        <p className={styles.dialogDesc}>
          {isAr
            ? "يتم الآن تجميع مؤشرات المسح، استخراج ملفات PDF و Excel، وحفظها تلقائياً في خزينة الملفات الخاصة بك."
            : "Compiling geospatial metrics, generating PDF & Excel files, and syncing directly to your secured documents ledger."}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            margin: "0.5rem 0",
            color: "var(--text-muted)",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <FileText size={16} className="text-blue-500" />
            PDF Report
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <FileSpreadsheet size={16} className="text-emerald-500" />
            Excel Ledger
          </span>
        </div>

        <div
          style={{
            width: "100%",
            height: "0.5rem",
            borderRadius: "1rem",
            backgroundColor: "var(--bg-surface-elevated)",
            overflow: "hidden",
            marginTop: "0.5rem",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "70%",
              borderRadius: "1rem",
              background: "linear-gradient(90deg, #d97706, #38bdf8)",
              animation: "pulse 1.8s infinite ease-in-out",
            }}
          />
        </div>
      </div>
    </div>
  );
}
