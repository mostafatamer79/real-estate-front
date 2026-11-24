"use client";

import React, { useEffect, useRef } from "react";
import { AlertCircle, Check, X } from "lucide-react";
import styles from "./scan-map.module.css";

interface ScanDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  checked: boolean;
  onCheckChange: (checked: boolean) => void;
  locale?: "ar" | "en";
}

export default function ScanDisclaimerModal({
  isOpen,
  onClose,
  onConfirm,
  checked,
  onCheckChange,
  locale = "ar",
}: ScanDisclaimerModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      // Focus modal container or confirm button
      setTimeout(() => {
        if (confirmBtnRef.current) {
          confirmBtnRef.current.focus();
        } else if (dialogRef.current) {
          dialogRef.current.focus();
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
          return;
        }

        // Focus trap
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAr = locale === "ar";
  const titleText = isAr ? "إقرار شروط واستخدام مسح الحي" : "Neighborhood Scan Disclaimer & Terms";
  const descText = isAr
    ? "يُرجى قراءة وتأكيد الإقرار الفني أدناه قبل الشروع في مسح الخدمات والمرافق المحيطة."
    : "Please review and acknowledge the technical service terms below before initiating the surroundings scan.";
  const disclaimerBody = isAr
    ? "يُعد استخدامك لخدمة مسح الحي بالذكاء الاصطناعي أو اعتمادك على هذا التقرير، إقراراً علنياً وصريحاً منك بالعلم التام بطبيعة الخدمات التقنية واحتمالية وجود نسبة خطأ أو تباين إحصائي في مخرجاتها."
    : "Using the neighborhood scanning service or relying on this report constitutes explicit acknowledgment of the technical nature of data mapping and the possibility of statistical variance in geospatial outputs.";

  return (
    <div
      className={styles.dialogBackdrop}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-disclaimer-title"
        aria-describedby="scan-disclaimer-desc"
        tabIndex={-1}
        className={styles.dialogWindow}
        dir={isAr ? "rtl" : "ltr"}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "var(--accent-gold-bg)",
                color: "var(--accent-brass)",
                border: "1px solid var(--accent-gold-border)",
                flexShrink: 0,
              }}
            >
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 id="scan-disclaimer-title" className={styles.dialogTitle}>
                {titleText}
              </h2>
              <p id="scan-disclaimer-desc" className={styles.dialogDesc}>
                {descText}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.btnSecondary}
            aria-label={isAr ? "إغلاق" : "Close"}
            style={{ width: "2.25rem", height: "2.25rem", padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>

        <label className={styles.disclaimerBox}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckChange(e.target.checked)}
            className={styles.disclaimerCheckbox}
          />
          <span>{disclaimerBody}</span>
        </label>

        <div className={styles.dialogActions}>
          <button type="button" onClick={onClose} className={styles.btnSecondary}>
            {isAr ? "إلغاء" : "Cancel"}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={!checked}
            onClick={() => {
              if (checked) {
                onConfirm();
              }
            }}
            className={styles.btnPrimary}
            style={{ minWidth: "180px", width: "auto" }}
          >
            <Check size={16} />
            <span>{isAr ? "أوافق وابدأ المسح" : "Agree & Start Scan"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
