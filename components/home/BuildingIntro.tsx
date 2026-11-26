"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  createBuildingScene,
  type BuildingSceneController,
} from "./building-scene";

function subscribeReducedMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

interface FloorInfo {
  num: string;
  labelAr: string;
  labelEn: string;
  titleAr: string;
  titleEn: string;
  shortAr: string;
  shortEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

const FLOORS: FloorInfo[] = [
  {
    num: "G",
    labelAr: "الطابق الأرضي / بداية الرحلة",
    labelEn: "Ground Floor / Journey Start",
    titleAr: "الاستقبال",
    titleEn: "Reception",
    shortAr: "بداية رحلتك",
    shortEn: "Start your journey",
    descriptionAr: "ابدأ رحلتك، تعرّف على حسابك، واعرف كيف تتواصل مع فريق الدعم.",
    descriptionEn: "Start your journey, explore your account, and see how to reach our support team.",
  },
  {
    num: "01",
    labelAr: "الطابق الأول / خدمة لكل احتياج",
    labelEn: "First Floor / Service for Every Need",
    titleAr: "الخدمات",
    titleEn: "Services",
    shortAr: "لكل احتياج، خطوة",
    shortEn: "A step for every need",
    descriptionAr:
      "اختر الخدمة العقارية، راجع متطلباتها، ثم تابع طلبك وتفاصيله من حسابك.",
    descriptionEn:
      "Choose a real estate service, review its requirements, and track your request from your account.",
  },
  {
    num: "02",
    labelAr: "الطابق الثاني / إدارة التفاصيل",
    labelEn: "Second Floor / Managing Details",
    titleAr: "الداخلية",
    titleEn: "Internal",
    shortAr: "إدارة التفاصيل",
    shortEn: "Manage operations",
    descriptionAr:
      "نظّم أعمال العقار والفريق والعقود والمدفوعات، ضمن الصلاحيات المتاحة لحسابك.",
    descriptionEn:
      "Organize properties, teams, contracts, and payments within your account permissions.",
  },
  {
    num: "03",
    labelAr: "الطابق الثالث / فرص تلتقي باحتياجك",
    labelEn: "Third Floor / Opportunities Meet Needs",
    titleAr: "العروض والطلبات",
    titleEn: "Offers & Requests",
    shortAr: "فرص تلتقي باحتياجك",
    shortEn: "Opportunities & needs",
    descriptionAr:
      "اكتشف العروض العقارية، حدّد احتياجك للشراء أو الاستئجار، وتابع طلباتك.",
    descriptionEn:
      "Explore property offers, submit buying or renting requests, and track your inquiries.",
  },
];

interface BuildingIntroProps {
  onEnterHome: () => void;
}

export default function BuildingIntro({ onEnterHome }: BuildingIntroProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const hostRef = useRef<HTMLDivElement | null>(null);
  const storyRef = useRef<HTMLDivElement | null>(null);
  const onEnterHomeRef = useRef(onEnterHome);

  useEffect(() => {
    onEnterHomeRef.current = onEnterHome;
  }, [onEnterHome]);

  const [activeFloor, setActiveFloor] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const host = hostRef.current;
    if (!host) return;

    let controller: BuildingSceneController | null = null;
    let fallbackTimer: number | undefined;
    let disposed = false;
    let currentFloor = 0;

    const clearFallbackTimer = () => {
      if (fallbackTimer !== undefined) {
        window.clearInterval(fallbackTimer);
        fallbackTimer = undefined;
      }
    };

    const presentFloor = (idx: number) => {
      currentFloor = idx;
      setActiveFloor(idx);
      if (!media.matches && storyRef.current) {
        storyRef.current.animate(
          [
            { opacity: 0.45, transform: "translateY(6px)" },
            { opacity: 1, transform: "none" },
          ],
          { duration: 300, easing: "ease-out" },
        );
      }
    };

    const startFallback = () => {
      controller?.dispose();
      controller = null;
      setWebglUnavailable(true);
      setSceneReady(true);
      clearFallbackTimer();

      if (!media.matches) {
        let elapsedMs = Math.max(0, currentFloor) * 5000;
        let lastTick = performance.now();
        fallbackTimer = window.setInterval(() => {
          const now = performance.now();
          const delta = now - lastTick;
          lastTick = now;
          if (document.hidden || disposed) return;
          elapsedMs += Math.min(delta, 250);
          const nextFloor = Math.min(3, Math.floor(elapsedMs / 5000));
          if (nextFloor !== currentFloor) {
            presentFloor(nextFloor);
          }
          if (elapsedMs >= 20000) {
            clearFallbackTimer();
            onEnterHomeRef.current();
          }
        }, 100);
      }
    };

    const bootScene = () => {
      clearFallbackTimer();
      setWebglUnavailable(false);
      setSceneReady(false);
      presentFloor(0);

      try {
        controller = createBuildingScene({
          container: host,
          onUnavailable: startFallback,
        });
        setSceneReady(true);
        controller.setReducedMotion(media.matches);
        if (!media.matches) {
          controller.playIntro(
            () => {
              if (!disposed) onEnterHomeRef.current();
            },
            (idx) => {
              if (!disposed) presentFloor(idx);
            },
          );
        }
      } catch {
        startFallback();
      }
    };

    bootScene();

    const handleMotionChange = () => {
      controller?.dispose();
      controller = null;
      clearFallbackTimer();
      bootScene();
    };

    media.addEventListener("change", handleMotionChange);

    return () => {
      disposed = true;
      media.removeEventListener("change", handleMotionChange);
      clearFallbackTimer();
      controller?.dispose();
      controller = null;
    };
  }, []);

  const current = FLOORS[activeFloor] || FLOORS[0];

  return (
    <section
      id="intro"
      className="db-intro"
      dir={isAr ? "rtl" : "ltr"}
      aria-labelledby="intro-title"
    >
      <div className="db-intro-topline">
        <span className="db-eyebrow">
          {isAr ? "رحلتك العقارية، بمنظور جديد" : "Your Real Estate Journey, Reimagined"}
        </span>
        <span className="db-edition" lang="en">
          A NEW PERSPECTIVE / 01
        </span>
      </div>

      <div className="db-intro-layout">
        <div className="db-intro-copy">
          <span className="db-kicker">
            <i aria-hidden="true" />
            {isAr ? "أهلًا بك في الوساطة الرقمية" : "Welcome to Digital Brokerage"}
          </span>

          <h1 id="intro-title">
            {isAr ? (
              <>
                مساحة واحدة.
                <br />
                آفاق <em>متعددة.</em>
              </>
            ) : (
              <>
                One space.
                <br />
                Infinite <em>horizons.</em>
              </>
            )}
          </h1>

          <p className="db-intro-subtitle">
            {isAr ? "تعرّف على المنصة، طابقًا بطابق" : "Explore the platform, floor by floor"}
          </p>

          <div
            ref={storyRef}
            className="db-floor-story"
            id="floor-story"
            aria-labelledby="floor-story-title"
            data-presented-floor={String(activeFloor)}
            hidden={reducedMotion}
          >
            <span className="db-eyebrow" id="floor-story-label">
              {isAr ? current.labelAr : current.labelEn}
            </span>
            <h2 id="floor-story-title">{isAr ? current.titleAr : current.titleEn}</h2>
            <p id="floor-story-description">
              {isAr ? current.descriptionAr : current.descriptionEn}
            </p>
          </div>

          <button type="button" className="db-primary" onClick={onEnterHome}>
            <span>{isAr ? "ابدأ التجربة" : "Start Experience"}</span>
            <span aria-hidden="true">↖</span>
          </button>
        </div>

        <div className="db-building-stage">
          <div
            ref={hostRef}
            id="building"
            className="db-building-host"
            role="img"
            aria-label={
              isAr
                ? "عرض معماري تلقائي لمبنى المنصة ذي الطوابق الأربعة"
                : "Automated 3D architectural tour of the four-floor platform building"
            }
            hidden={webglUnavailable}
          >
            {!sceneReady && (
              <div className="db-scene-loading">
                <span className="db-loading-ring" aria-hidden="true" />
                <p>{isAr ? "نهيّئ لك المشهد المعماري…" : "Preparing the architectural scene…"}</p>
              </div>
            )}
          </div>

          <div id="scene-fallback" className="db-scene-fallback" hidden={!webglUnavailable}>
            <div className="db-fallback-building" aria-hidden="true">
              {[...FLOORS].reverse().map((floor, revIdx) => {
                const floorIndex = FLOORS.length - 1 - revIdx;
                return (
                  <div
                    key={floor.num}
                    className={floorIndex === activeFloor ? "presented-floor" : undefined}
                  >
                    {isAr ? floor.titleAr : floor.titleEn}
                  </div>
                );
              })}
            </div>
            <p>
              {isAr
                ? "عرض معماري مبسّط؛ الشرح التلقائي متاح دون العرض ثلاثي الأبعاد."
                : "Simplified architectural view; guided floor tour available without 3D WebGL."}
            </p>
          </div>

          <div className="db-scene-caption">
            <span className="db-compass" aria-hidden="true">
              N ↗
            </span>
            <span>
              {isAr ? "أربعة طوابق. تجربة مترابطة." : "Four floors. One connected experience."}
            </span>
            <span className="db-scene-tag" lang="en">
              DIGITAL HQ
            </span>
          </div>
        </div>
      </div>

      <ol
        className="db-floor-indicators"
        aria-label={isAr ? "مسار التعريف بالمنصة" : "Platform introduction path"}
        hidden={reducedMotion}
      >
        {FLOORS.map((floor, idx) => (
          <li
            key={floor.num}
            data-floor-indicator={idx}
            aria-current={idx === activeFloor ? "step" : undefined}
          >
            <span className="db-floor-num">{floor.num}</span>
            <span className="db-od-field">
              <strong>{isAr ? floor.titleAr : floor.titleEn}</strong>
              <small>{isAr ? floor.shortAr : floor.shortEn}</small>
            </span>
          </li>
        ))}
      </ol>

      <ol
        id="floor-explanations"
        className="db-static-floor-list"
        aria-label={isAr ? "تعرّف على طوابق المنصة" : "Explore the platform floors"}
        hidden={!reducedMotion}
      >
        {FLOORS.map((floor) => (
          <li key={floor.num}>
            <span className="db-floor-num">{floor.num}</span>
            <div>
              <h2>{isAr ? floor.titleAr : floor.titleEn}</h2>
              <p>{isAr ? floor.descriptionAr : floor.descriptionEn}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
