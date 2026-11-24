"use client";

import React from "react";

export interface MasterplanHotspot {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  tagAr: string;
  tagEn: string;
  x: number;
  y: number;
}

export const BANAN_VECTOR_HOTSPOTS: MasterplanHotspot[] = [
  {
    id: "lagoon",
    nameAr: "البحيرة الكريستالية والممشى المائي",
    nameEn: "Central Crystal Lagoon",
    descAr: "شريان مائي بطول 4.2 كم مع ممرات مشاة مظللة ومناخ محلي منخفض الحرارة.",
    descEn: "4.2km pristine waterway with shaded esplanades and natural microclimate cooling.",
    tagAr: "واجهة مائية",
    tagEn: "Waterfront",
    x: 580,
    y: 380,
  },
  {
    id: "pavilion",
    nameAr: "الجناح البارامتري الثقافي العائم",
    nameEn: "Parametric Cultural Pavilion",
    descAr: "أيقونة معمارية عضوية بارامترية تحتضن الفعاليات والمعارض الاستثمارية العالمية.",
    descEn: "Organic parametric architectural landmark hosting cultural events and luxury exhibitions.",
    tagAr: "أيقونة معمارية",
    tagEn: "Iconic Landmark",
    x: 670,
    y: 320,
  },
  {
    id: "financial",
    nameAr: "المركز المالي ومجمع التقنية الذكية",
    nameEn: "Financial & Smart Tech Hub",
    descAr: "أبراج مكتبية مستدامة بمعايير LEED البلاتينية لكبرى الشركات وصناديق الاستثمار.",
    descEn: "LEED Platinum smart towers housing sovereign wealth funds and global headquarters.",
    tagAr: "أبراج أعمال",
    tagEn: "Commercial HQs",
    x: 940,
    y: 220,
  },
  {
    id: "villas",
    nameAr: "ضاحية فلل ريزيدنس بنان الخاصة",
    nameEn: "Banan Sovereign Villa Enclave",
    descAr: "محميات سكنية مستقلة بأفنية عاكسة، مسابح خاصة، وتصاميم نجدية مستدامة.",
    descEn: "Private gated estates with reflection courtyards and contemporary Najdi masonry.",
    tagAr: "سكن فاخر",
    tagEn: "Prime Villas",
    x: 260,
    y: 440,
  },
  {
    id: "transit",
    nameAr: "محطة النقل الكهربائي السريع والبوليفارد",
    nameEn: "Rapid Transit Hub & Grand Boulevard",
    descAr: "محور تنقل ذاتي القيادة يربط بنان مباشرة بمطار الملك سلمان ومركز كافد المالي.",
    descEn: "Autonomous electric transit spine linking Banan directly to KAFD and Airport.",
    tagAr: "ربط ذكي",
    tagEn: "Transit Spine",
    x: 480,
    y: 580,
  },
];

interface Props {
  activeId: string | null;
  onSelectHotspot: (hotspot: MasterplanHotspot) => void;
  className?: string;
}

export default function BananMasterplanSvg({ activeId, onSelectHotspot, className = "" }: Props) {
  return (
    <svg
      viewBox="0 0 1200 720"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-label="مخطط مدينة بنان الذكية التفاعلي"
    >
      <defs>
        {/* Gradients */}
        <radialGradient id="planBgGrad" cx="600" cy="360" r="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0d1624" />
          <stop offset="70%" stopColor="#080e18" />
          <stop offset="100%" stopColor="#05080f" />
        </radialGradient>

        <linearGradient id="lagoonFill" x1="400" y1="200" x2="800" y2="500" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e3a53" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#0a2a40" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#061a29" stopOpacity="0.95" />
        </linearGradient>

        <linearGradient id="boulevardGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.8" />
        </linearGradient>

        <filter id="glowPlan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background Canvas */}
      <rect width="1200" height="720" fill="url(#planBgGrad)" />

      {/* =========================================================================
          1. TOPOGRAPHIC CONTOUR LINES (WAADI & DESERT ELEVATION)
          ========================================================================= */}
      <g stroke="#2dd4bf" strokeOpacity="0.08" strokeWidth="1" fill="none">
        <path d="M 50 120 C 300 80, 600 160, 900 100 S 1150 140, 1200 120" />
        <path d="M 0 200 C 250 160, 550 240, 850 180 S 1100 220, 1200 200" />
        <path d="M 0 300 C 200 260, 500 340, 800 280 S 1050 320, 1200 300" />
        <path d="M 0 420 C 220 380, 520 460, 820 400 S 1080 440, 1200 420" />
        <path d="M 0 540 C 240 500, 540 580, 840 520 S 1100 560, 1200 540" />
        <path d="M 0 660 C 260 620, 560 700, 860 640 S 1120 680, 1200 660" />
      </g>

      {/* Geodetic Coordinate Grid */}
      <g stroke="#d4af37" strokeOpacity="0.06" strokeWidth="1" strokeDasharray="6 12">
        <line x1="150" y1="0" x2="150" y2="720" />
        <line x1="300" y1="0" x2="300" y2="720" />
        <line x1="450" y1="0" x2="450" y2="720" />
        <line x1="600" y1="0" x2="600" y2="720" />
        <line x1="750" y1="0" x2="750" y2="720" />
        <line x1="900" y1="0" x2="900" y2="720" />
        <line x1="1050" y1="0" x2="1050" y2="720" />

        <line x1="0" y1="120" x2="1200" y2="120" />
        <line x1="0" y1="240" x2="1200" y2="240" />
        <line x1="0" y1="360" x2="1200" y2="360" />
        <line x1="0" y1="480" x2="1200" y2="480" />
        <line x1="0" y1="600" x2="1200" y2="600" />
      </g>

      {/* =========================================================================
          2. CENTRAL CRYSTAL LAGOON & WATERWAYS
          ========================================================================= */}
      {/* Outer Shoreline Promenade */}
      <path
        d="M 420 280 C 480 220, 720 220, 820 280 C 920 340, 920 460, 800 520 C 680 580, 520 560, 440 500 C 360 440, 360 340, 420 280 Z"
        stroke="#2dd4bf"
        strokeOpacity="0.4"
        strokeWidth="2"
        fill="none"
        strokeDasharray="8 6"
      />

      {/* Lagoon Water Body */}
      <path
        d="M 440 290 C 490 235, 700 235, 800 290 C 895 345, 895 445, 785 505 C 675 565, 535 545, 455 490 C 380 435, 380 345, 440 290 Z"
        fill="url(#lagoonFill)"
        stroke="#2dd4bf"
        strokeWidth="2.5"
        filter="url(#glowPlan)"
      />

      {/* Water Ripple Isobars */}
      <path
        d="M 480 320 C 520 270, 680 270, 750 320 C 820 370, 820 430, 740 470 C 660 510, 540 500, 490 460 C 440 420, 440 370, 480 320 Z"
        stroke="#2dd4bf"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M 520 350 C 550 310, 660 310, 710 350 C 760 390, 760 420, 700 445 C 640 470, 560 460, 530 430 C 500 400, 500 370, 520 350 Z"
        stroke="#d4af37"
        strokeOpacity="0.3"
        strokeWidth="1"
        fill="none"
      />

      {/* =========================================================================
          3. THE PARAMETRIC PAVILION (GEODESIC LATTICE ON WATER)
          ========================================================================= */}
      <g transform="translate(670, 320)">
        {/* Geodesic Ribs */}
        <ellipse cx="0" cy="0" rx="42" ry="24" stroke="#d4af37" strokeWidth="2" fill="#0b131f" fillOpacity="0.8" />
        <ellipse cx="0" cy="0" rx="32" ry="18" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="-42" y1="0" x2="42" y2="0" stroke="#d4af37" strokeWidth="1" />
        <line x1="0" y1="-24" x2="0" y2="24" stroke="#d4af37" strokeWidth="1" />
        <line x1="-30" y1="-17" x2="30" y2="17" stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="1" />
        <line x1="-30" y1="17" x2="30" y2="-17" stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="1" />
        <circle cx="0" cy="0" r="5" fill="#d4af37" />
      </g>

      {/* Connecting Lagoon Bridges */}
      <line x1="440" y1="290" x2="520" y2="350" stroke="#d4af37" strokeWidth="2.5" strokeDasharray="4 4" />
      <line x1="785" y1="505" x2="710" y2="445" stroke="#d4af37" strokeWidth="2.5" strokeDasharray="4 4" />

      {/* =========================================================================
          4. RESIDENTIAL VILLA ENCLAVES (WEST DISTRICT)
          ========================================================================= */}
      <g stroke="#d4af37" strokeOpacity="0.5" strokeWidth="1.2" fill="#0d1929" fillOpacity="0.5">
        {/* Villa Parcels */}
        {[
          { x: 160, y: 380, w: 42, h: 32 },
          { x: 215, y: 370, w: 45, h: 32 },
          { x: 275, y: 360, w: 42, h: 35 },
          { x: 150, y: 430, w: 48, h: 36 },
          { x: 210, y: 420, w: 50, h: 38 },
          { x: 270, y: 415, w: 48, h: 40 },
          { x: 140, y: 485, w: 52, h: 38 },
          { x: 205, y: 480, w: 52, h: 42 },
          { x: 270, y: 475, w: 50, h: 44 },
          { x: 130, y: 545, w: 55, h: 42 },
          { x: 198, y: 540, w: 56, h: 44 },
          { x: 268, y: 535, w: 55, h: 46 },
        ].map((v, i) => (
          <g key={`villa-${i}`}>
            <rect x={v.x} y={v.y} width={v.w} height={v.h} rx="3" />
            <circle cx={v.x + v.w / 2} cy={v.y + v.h / 2} r="2.5" fill="#2dd4bf" fillOpacity="0.7" />
          </g>
        ))}
        {/* District Perimeter Wall */}
        <path d="M 110 350 L 340 330 L 335 600 L 110 610 Z" stroke="#2dd4bf" strokeOpacity="0.3" strokeDasharray="6 4" fill="none" />
      </g>

      {/* =========================================================================
          5. COMMERCIAL & FINANCIAL SKYSCRAPER TOWERS (EAST DISTRICT)
          ========================================================================= */}
      <g stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="1.5" fill="#0c1724" fillOpacity="0.7">
        {/* Tower Footprints with Isometric Shadows */}
        {[
          { x: 920, y: 160, w: 48, h: 48, floors: 52 },
          { x: 990, y: 190, w: 40, h: 56, floors: 44 },
          { x: 910, y: 230, w: 52, h: 42, floors: 38 },
          { x: 980, y: 265, w: 46, h: 46, floors: 60 },
          { x: 1045, y: 220, w: 42, h: 42, floors: 34 },
          { x: 930, y: 300, w: 56, h: 40, floors: 40 },
          { x: 1005, y: 330, w: 44, h: 50, floors: 48 },
        ].map((t, i) => (
          <g key={`tower-${i}`}>
            <rect x={t.x} y={t.y} width={t.w} height={t.h} rx="2" stroke="#d4af37" />
            <rect x={t.x + 4} y={t.y + 4} width={t.w - 8} height={t.h - 8} stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1" />
            <line x1={t.x} y1={t.y} x2={t.x + t.w} y2={t.y + t.h} stroke="#2dd4bf" strokeOpacity="0.25" strokeWidth="1" />
            <line x1={t.x + t.w} y1={t.y} x2={t.x} y2={t.y + t.h} stroke="#2dd4bf" strokeOpacity="0.25" strokeWidth="1" />
          </g>
        ))}
      </g>

      {/* =========================================================================
          6. BANAN BOULEVARD & HIGH-SPEED TRANSIT SPINE (ANIMATED TRAFFIC)
          ========================================================================= */}
      {/* Main Highway Curve */}
      <path
        id="transitSpinePath"
        d="M 50 640 C 250 620, 450 580, 600 520 S 950 480, 1180 500"
        stroke="url(#boulevardGrad)"
        strokeWidth="4"
        fill="none"
        filter="url(#glowPlan)"
      />
      {/* Transit Guideway Lines */}
      <path
        d="M 50 646 C 250 626, 450 586, 600 526 S 950 486, 1180 506"
        stroke="#2dd4bf"
        strokeOpacity="0.3"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        fill="none"
      />

      {/* Moving Vehicle Lights along Transit Spine */}
      <circle r="4" fill="#f3e5ab" filter="url(#glowPlan)">
        <animateMotion
          path="M 50 640 C 250 620, 450 580, 600 520 S 950 480, 1180 500"
          dur="6s"
          repeatCount="indefinite"
        />
      </circle>
      <circle r="3" fill="#2dd4bf" filter="url(#glowPlan)">
        <animateMotion
          path="M 50 640 C 250 620, 450 580, 600 520 S 950 480, 1180 500"
          dur="6s"
          begin="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle r="3" fill="#d4af37" filter="url(#glowPlan)">
        <animateMotion
          path="M 50 640 C 250 620, 450 580, 600 520 S 950 480, 1180 500"
          dur="6s"
          begin="4s"
          repeatCount="indefinite"
        />
      </circle>

      {/* =========================================================================
          7. ROTATING AZIMUTH COMPASS ROSE & RADAR (TOP RIGHT)
          ========================================================================= */}
      <g transform="translate(1080, 80)">
        <circle cx="0" cy="0" r="46" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1" fill="#080e18" fillOpacity="0.8" />
        <circle cx="0" cy="0" r="38" stroke="#2dd4bf" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
        {/* Rotating Crosshair */}
        <g className="svg-compass-spin">
          <line x1="-36" y1="0" x2="36" y2="0" stroke="#d4af37" strokeWidth="1.5" />
          <line x1="0" y1="-36" x2="0" y2="36" stroke="#d4af37" strokeWidth="1.5" />
          <polygon points="0,-36 -4,-22 4,-22" fill="#d4af37" />
          <polygon points="0,36 -4,22 4,22" fill="#2dd4bf" />
        </g>
        <circle cx="0" cy="0" r="3" fill="#f3e5ab" />
        <text x="0" y="-40" textAnchor="middle" fill="#d4af37" fontSize="9" fontFamily="monospace">N</text>
        <text x="0" y="48" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontFamily="monospace">AZ 048°</text>
      </g>

      {/* =========================================================================
          8. INTERACTIVE CLICKABLE HOTSPOT NODES
          ========================================================================= */}
      {BANAN_VECTOR_HOTSPOTS.map((hotspot) => {
        const isSelected = activeId === hotspot.id;
        return (
          <g
            key={hotspot.id}
            transform={`translate(${hotspot.x}, ${hotspot.y})`}
            onClick={() => onSelectHotspot(hotspot)}
            style={{ cursor: "pointer" }}
            role="button"
            tabIndex={0}
            aria-label={hotspot.nameAr}
          >
            {/* Pulsing Outer Ping Ring */}
            <circle
              cx="0"
              cy="0"
              r="22"
              stroke={isSelected ? "#f3e5ab" : "#d4af37"}
              strokeOpacity="0.4"
              strokeWidth="1.5"
              fill="none"
              className="svg-pulse-ring"
            />
            {/* Core Badge */}
            <circle
              cx="0"
              cy="0"
              r="12"
              fill={isSelected ? "#d4af37" : "#0c1522"}
              stroke={isSelected ? "#ffffff" : "#d4af37"}
              strokeWidth="2"
              filter="url(#glowPlan)"
            />
            <circle cx="0" cy="0" r="4" fill={isSelected ? "#0c1522" : "#2dd4bf"} />

            {/* Label Plaque */}
            <g transform="translate(16, -10)">
              <rect
                x="0"
                y="-6"
                width="160"
                height="28"
                rx="4"
                fill="#080e18"
                fillOpacity="0.92"
                stroke={isSelected ? "#d4af37" : "#2dd4bf"}
                strokeOpacity={isSelected ? 0.9 : 0.4}
                strokeWidth="1"
              />
              <text x="10" y="12" fill={isSelected ? "#d4af37" : "#f8fafc"} fontSize="11" fontWeight="bold">
                {hotspot.nameAr}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}
