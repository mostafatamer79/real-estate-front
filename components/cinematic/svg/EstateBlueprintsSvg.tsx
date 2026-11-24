"use client";

import React from "react";

/**
 * 1. BANAN SOVEREIGN VILLA BLUEPRINT
 * Architectural floorplan & cross-section with courtyard reflecting pool
 */
export function BananVillaBlueprintSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width="600" height="380" fill="#090e17" />

      {/* CAD Grid */}
      <g stroke="#2dd4bf" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="4 8">
        {[60, 120, 180, 240, 300, 360, 420, 480, 540].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="360" />
        ))}
        {[60, 120, 180, 240, 300].map((y) => (
          <line key={y} x1="30" y1={y} x2="570" y2={y} />
        ))}
      </g>

      {/* Perimeter Villa Walls */}
      <rect x="60" y="50" width="480" height="280" rx="4" stroke="#d4af37" strokeWidth="2.5" fill="#0b131f" fillOpacity="0.6" />

      {/* Inner Courtyard (Patio & Reflecting Pool) */}
      <rect x="230" y="90" width="220" height="150" rx="4" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="6 4" fill="#06121d" />

      {/* Private Pool with Animated Waves */}
      <rect x="250" y="110" width="180" height="110" rx="3" fill="#0d283d" stroke="#2dd4bf" strokeWidth="2" />
      <path
        d="M 260 140 Q 305 130 350 140 T 420 140"
        stroke="#2dd4bf"
        strokeOpacity="0.6"
        strokeWidth="1.5"
        fill="none"
        className="svg-wave-1"
      />
      <path
        d="M 260 170 Q 305 160 350 170 T 420 170"
        stroke="#d4af37"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        fill="none"
        className="svg-wave-2"
      />

      {/* Double Height Living Room (West Wing) */}
      <rect x="80" y="70" width="130" height="240" stroke="#d4af37" strokeWidth="1.5" fill="none" />
      <line x1="80" y1="70" x2="210" y2="310" stroke="#d4af37" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="210" y1="70" x2="80" y2="310" stroke="#d4af37" strokeOpacity="0.2" strokeWidth="1" strokeDasharray="4 4" />
      <text x="145" y="195" textAnchor="middle" fill="#d4af37" fontSize="11" fontWeight="bold" letterSpacing="1">
        DOUBLE-HEIGHT SALON
      </text>
      <text x="145" y="215" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontFamily="monospace">
        CLEARANCE +6.80M
      </text>

      {/* East Wing - Master Suites & Majlis */}
      <rect x="470" y="70" width="50" height="110" stroke="#d4af37" strokeWidth="1" fill="none" />
      <text x="495" y="130" textAnchor="middle" fill="#f3e5ab" fontSize="9" transform="rotate(90, 495, 130)">
        ROYAL MAJLIS
      </text>
      <rect x="470" y="195" width="50" height="115" stroke="#d4af37" strokeWidth="1" fill="none" />
      <text x="495" y="255" textAnchor="middle" fill="#f3e5ab" fontSize="9" transform="rotate(90, 495, 255)">
        CHEF KITCHEN
      </text>

      {/* Dimension Lines */}
      <g stroke="#f3e5ab" strokeWidth="1">
        <line x1="60" y1="350" x2="540" y2="350" />
        <line x1="60" y1="344" x2="60" y2="356" />
        <line x1="540" y1="344" x2="540" y2="356" />
        <text x="300" y="366" textAnchor="middle" fill="#f3e5ab" fontSize="10" fontFamily="monospace">
          TOTAL SPAN 28.40M // 850 SQM
        </text>
      </g>
    </svg>
  );
}

/**
 * 2. HORIZON SKY PENTHOUSE WIRED TERRACE
 * Cantilevered sky deck with infinity hot spa overlooking the city
 */
export function HorizonPenthouseSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width="600" height="380" fill="#070b12" />

      {/* Night Sky & Stars */}
      {[
        { x: 80, y: 40 }, { x: 180, y: 70 }, { x: 260, y: 30 }, { x: 380, y: 55 },
        { x: 490, y: 35 }, { x: 540, y: 80 }, { x: 120, y: 110 }, { x: 320, y: 90 },
      ].map((star, i) => (
        <circle key={i} cx={star.x} cy={star.y} r={i % 2 === 0 ? 1.5 : 1} fill="#f3e5ab" fillOpacity="0.8" />
      ))}

      {/* City Wireframe Horizon (Bottom) */}
      <g stroke="#2dd4bf" strokeOpacity="0.25" strokeWidth="1" fill="none">
        <rect x="40" y="240" width="35" height="120" />
        <rect x="90" y="210" width="45" height="150" />
        <polygon points="112,170 90,210 135,210" />
        <rect x="150" y="230" width="40" height="130" />
        <rect x="210" y="190" width="55" height="170" />
        <rect x="280" y="220" width="38" height="140" />
        <rect x="330" y="180" width="60" height="180" />
        {/* Kingdom Tower Silhouette wireframe */}
        <path d="M 430 360 L 445 130 C 455 160 465 160 475 130 L 490 360 Z" stroke="#d4af37" strokeWidth="1.5" />
        <rect x="510" y="220" width="50" height="140" />
      </g>

      {/* Cantilevered Sky Terrace Deck (Isometric) */}
      <polygon
        points="100,160 520,130 570,280 150,320"
        fill="#0d1827"
        stroke="#d4af37"
        strokeWidth="2.5"
      />

      {/* Frameless Glass Railing */}
      <polygon
        points="100,110 520,80 570,230 150,270"
        fill="none"
        stroke="#2dd4bf"
        strokeWidth="1.5"
        strokeDasharray="8 4"
      />
      <line x1="100" y1="160" x2="100" y2="110" stroke="#2dd4bf" strokeWidth="2" />
      <line x1="520" y1="130" x2="520" y2="80" stroke="#2dd4bf" strokeWidth="2" />
      <line x1="570" y1="280" x2="570" y2="230" stroke="#2dd4bf" strokeWidth="2" />
      <line x1="150" y1="320" x2="150" y2="270" stroke="#2dd4bf" strokeWidth="2" />

      {/* Heated Infinity Jacuzzi Spa */}
      <polygon
        points="220,200 420,180 440,260 240,280"
        fill="#0b2c45"
        stroke="#2dd4bf"
        strokeWidth="2"
      />
      {/* Animated Jacuzzi Water Circles */}
      <circle cx="330" cy="230" r="22" stroke="#2dd4bf" strokeOpacity="0.7" strokeWidth="1.5" fill="none" className="svg-pulse-ring" />
      <circle cx="330" cy="230" r="10" stroke="#f3e5ab" strokeOpacity="0.8" strokeWidth="1" fill="none" />

      {/* Lounge Daybed Vectors */}
      <polygon points="140,240 190,230 205,270 155,280" stroke="#d4af37" strokeWidth="1.5" fill="#152438" />

      <text x="330" y="350" textAnchor="middle" fill="#d4af37" fontSize="11" fontFamily="monospace" letterSpacing="1">
        ELEVATION +210M // PENTHOUSE SKY SUITE
      </text>
    </svg>
  );
}

/**
 * 3. COMMERCIAL SMART TOWER CAD
 * Skyscraper parametric elevation with animated moving elevators
 */
export function CommercialTowerSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width="600" height="380" fill="#080c14" />

      {/* Wind Aerodynamic Flow Lines */}
      <g stroke="#2dd4bf" strokeOpacity="0.12" strokeWidth="1" fill="none">
        <path d="M 40 80 Q 200 120 280 60 T 560 80" />
        <path d="M 40 160 Q 220 200 300 140 T 560 160" />
        <path d="M 40 240 Q 240 280 320 220 T 560 240" />
      </g>

      {/* Main Tower Column Body */}
      <g transform="translate(180, 20)">
        {/* Tower Facade Outer Frame */}
        <polygon points="40,20 200,20 220,330 20,330" stroke="#d4af37" strokeWidth="2.5" fill="#0b1422" fillOpacity="0.8" />

        {/* Floor Slabs */}
        {[50, 80, 110, 140, 170, 200, 230, 260, 290].map((y) => (
          <line key={y} x1="28" y1={y} x2="212" y2={y} stroke="#2dd4bf" strokeOpacity="0.3" strokeWidth="1" />
        ))}

        {/* Diagonal Structural Bracing (Diagrid) */}
        <line x1="38" y1="50" x2="202" y2="140" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="202" y1="50" x2="38" y2="140" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="32" y1="140" x2="208" y2="230" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="208" y1="140" x2="32" y2="230" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="26" y1="230" x2="214" y2="320" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />
        <line x1="214" y1="230" x2="26" y2="320" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />

        {/* Central High-Speed Elevator Shaft */}
        <rect x="108" y="20" width="24" height="310" stroke="#f3e5ab" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />

        {/* Animated Moving Elevator Car */}
        <rect x="110" y="240" width="20" height="26" rx="2" fill="#d4af37" stroke="#ffffff" strokeWidth="1">
          <animate attributeName="y" values="280;40;280" dur="8s" repeatCount="indefinite" />
        </rect>

        {/* Architectural Crown Spire */}
        <line x1="120" y1="20" x2="120" y2="-10" stroke="#d4af37" strokeWidth="2.5" />
        <circle cx="120" cy="-10" r="3" fill="#2dd4bf" />
      </g>

      {/* Flanking Side Wings */}
      <rect x="80" y="160" width="80" height="190" stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1.5" fill="#09111c" />
      <rect x="440" y="140" width="80" height="210" stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1.5" fill="#09111c" />

      {/* Spec Overlay Text */}
      <text x="300" y="365" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontFamily="monospace">
        LEED PLATINUM // 62 FLOORS // 42,000 SQM
      </text>
    </svg>
  );
}

/**
 * 4. STRATEGIC INVESTMENT PLOTS GIS CAD
 * Topographic cadastral boundary survey with ROI growth arc
 */
export function InvestmentPlotsSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width="600" height="380" fill="#070d16" />

      {/* Cadastral Topo Grid */}
      <g stroke="#d4af37" strokeOpacity="0.08" strokeWidth="1">
        {[80, 160, 240, 320, 400, 480].map((x) => (
          <line key={x} x1={x} y1="30" x2={x} y2="350" />
        ))}
        {[60, 120, 180, 240, 300].map((y) => (
          <line key={y} x1="40" y1={y} x2="560" y2={y} />
        ))}
      </g>

      {/* Investment Land Parcels (Polygons) */}
      <polygon
        points="100,80 280,60 310,180 80,210"
        stroke="#2dd4bf"
        strokeWidth="2"
        fill="#0d2433"
        fillOpacity="0.6"
      />
      <text x="180" y="140" textAnchor="middle" fill="#2dd4bf" fontSize="11" fontWeight="bold">
        PARCEL A // 18,500 M²
      </text>

      <polygon
        points="295,60 520,75 490,220 325,180"
        stroke="#d4af37"
        strokeWidth="2"
        fill="#1e2014"
        fillOpacity="0.6"
      />
      <text x="410" y="140" textAnchor="middle" fill="#d4af37" fontSize="11" fontWeight="bold">
        PARCEL B // 26,000 M²
      </text>

      {/* Boundary Coordinate Survey Markers */}
      {[
        { x: 100, y: 80, id: "BM-01" },
        { x: 280, y: 60, id: "BM-02" },
        { x: 520, y: 75, id: "BM-03" },
        { x: 490, y: 220, id: "BM-04" },
        { x: 310, y: 180, id: "BM-05" },
        { x: 80, y: 210, id: "BM-06" },
      ].map((m, i) => (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="8" stroke="#f3e5ab" strokeWidth="1.5" fill="#080e18" />
          <circle cx={m.x} cy={m.y} r="3" fill="#2dd4bf" />
          <text x={m.x} y={m.y - 12} textAnchor="middle" fill="#f3e5ab" fontSize="8" fontFamily="monospace">
            {m.id}
          </text>
        </g>
      ))}

      {/* ROI Yield Curve Arc */}
      <path
        d="M 80 320 Q 260 300 380 240 T 540 160"
        stroke="#2dd4bf"
        strokeWidth="3"
        fill="none"
        strokeDasharray="6 4"
      />
      <circle cx="540" cy="160" r="6" fill="#d4af37" />
      <text x="480" y="185" fill="#d4af37" fontSize="11" fontWeight="bold">
        +11.4% CAP RATE
      </text>

      <text x="300" y="360" textAnchor="middle" fill="#f3e5ab" fontSize="10" fontFamily="monospace">
        GIS SURVEY CERTIFIED // ESCROW READY
      </text>
    </svg>
  );
}
