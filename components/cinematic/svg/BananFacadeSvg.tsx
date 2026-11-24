"use client";

import React from "react";

export default function BananFacadeSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 820"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* Gradients */}
        <linearGradient id="facadeSkyGrad" x1="720" y1="0" x2="720" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#080c14" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#0f1726" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#070a0f" stopOpacity="0.98" />
        </linearGradient>

        <linearGradient id="goldBeamGrad" x1="0" y1="0" x2="1440" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f3e5ab" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#b38234" stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id="laserBeamGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
          <stop offset="50%" stopColor="#2dd4bf" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="portalGlow" cx="720" cy="460" r="380" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.25" />
          <stop offset="60%" stopColor="#2dd4bf" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0b0f17" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="waterGrad" x1="720" y1="620" x2="720" y2="820" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e2338" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#060d15" stopOpacity="0.95" />
        </linearGradient>

        <filter id="vectorGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Atmospheric Base Background */}
      <rect width="1440" height="820" fill="url(#facadeSkyGrad)" />

      {/* Central Radiance Portal */}
      <circle cx="720" cy="440" r="380" fill="url(#portalGlow)" />

      {/* =========================================================================
          1. ANIMATED CAD BLUEPRINT GRID & COORDINATES
          ========================================================================= */}
      <g stroke="#2dd4bf" strokeOpacity="0.12" strokeWidth="1" strokeDasharray="4 8">
        {/* Vertical Grid Lines */}
        <line x1="120" y1="40" x2="120" y2="780" />
        <line x1="240" y1="40" x2="240" y2="780" />
        <line x1="360" y1="40" x2="360" y2="780" />
        <line x1="480" y1="40" x2="480" y2="780" />
        <line x1="600" y1="40" x2="600" y2="780" />
        <line x1="720" y1="20" x2="720" y2="800" strokeOpacity="0.3" strokeDasharray="none" />
        <line x1="840" y1="40" x2="840" y2="780" />
        <line x1="960" y1="40" x2="960" y2="780" />
        <line x1="1080" y1="40" x2="1080" y2="780" />
        <line x1="1200" y1="40" x2="1200" y2="780" />
        <line x1="1320" y1="40" x2="1320" y2="780" />

        {/* Horizontal Elevation Lines */}
        <line x1="60" y1="120" x2="1380" y2="120" />
        <line x1="60" y1="240" x2="1380" y2="240" />
        <line x1="60" y1="360" x2="1380" y2="360" />
        <line x1="60" y1="480" x2="1380" y2="480" />
        <line x1="60" y1="600" x2="1380" y2="600" strokeOpacity="0.25" strokeDasharray="none" />
      </g>

      {/* CAD Measurement Ticks & Text */}
      <g fill="#2dd4bf" fillOpacity="0.4" fontFamily="monospace" fontSize="11" letterSpacing="2">
        <text x="70" y="115">+64.0M // ROOF APEX</text>
        <text x="70" y="235">+48.0M // ENTABLATURE</text>
        <text x="70" y="355">+32.0M // CAPITAL ZONE</text>
        <text x="70" y="475">+16.0M // MID COLONNADE</text>
        <text x="70" y="595">±0.00M // WATER PLINTH</text>

        <text x="725" y="55" textAnchor="middle" fill="#d4af37" fillOpacity="0.7">
          AXIS 00 // BANAN CENTRAL PORTAL
        </text>
        <text x="1300" y="115" textAnchor="end">LAT 24.8712° N</text>
        <text x="1300" y="135" textAnchor="end">LON 46.5921° E</text>
        <text x="1300" y="155" textAnchor="end">BEZEL 1:1 CAD</text>
      </g>

      {/* =========================================================================
          2. MONUMENTAL ARCHITECTURAL ELEVATION (COLONNADE & PEDIMENT)
          ========================================================================= */}
      {/* Grand Arch Frame */}
      <path
        d="M 520 600 V 380 A 200 200 0 0 1 920 380 V 600"
        stroke="#d4af37"
        strokeWidth="3"
        fill="none"
        filter="url(#vectorGlow)"
        className="svg-draw-path"
      />
      <path
        d="M 545 600 V 390 A 175 175 0 0 1 895 390 V 600"
        stroke="#2dd4bf"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        fill="none"
        strokeDasharray="6 4"
      />
      <path
        d="M 570 600 V 400 A 150 150 0 0 1 870 400 V 600"
        stroke="#d4af37"
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* Classical Keystone on Portal */}
      <polygon
        points="705,175 735,175 740,210 700,210"
        stroke="#d4af37"
        strokeWidth="2"
        fill="#0b131f"
      />
      <circle cx="720" cy="192" r="5" fill="#d4af37" />

      {/* Colonnade Pillars - Fluted Columns */}
      {/* Left Colonnade Group */}
      {[220, 310, 400, 490].map((x, i) => (
        <g key={`col-l-${i}`} className="svg-col-group">
          {/* Capital */}
          <rect x={x - 22} y="240" width="44" height="14" rx="2" stroke="#d4af37" strokeWidth="1.5" fill="#0d1827" />
          <line x1={x - 26} y1="236" x2={x + 26} y2="236" stroke="#d4af37" strokeWidth="2" />
          {/* Shaft & Fluting */}
          <rect x={x - 16} y="254" width="32" height="346" stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1" fill="none" />
          <line x1={x - 8} y1="254" x2={x - 8} y2="600" stroke="#d4af37" strokeOpacity="0.5" strokeWidth="1" />
          <line x1={x} y1="254" x2={x} y2="600" stroke="#f3e5ab" strokeOpacity="0.7" strokeWidth="1.5" />
          <line x1={x + 8} y1="254" x2={x + 8} y2="600" stroke="#d4af37" strokeOpacity="0.5" strokeWidth="1" />
          {/* Base Plinth */}
          <rect x={x - 20} y="594" width="40" height="8" rx="1" stroke="#d4af37" strokeWidth="1.5" fill="#0d1827" />
        </g>
      ))}

      {/* Right Colonnade Group */}
      {[950, 1040, 1130, 1220].map((x, i) => (
        <g key={`col-r-${i}`} className="svg-col-group">
          {/* Capital */}
          <rect x={x - 22} y="240" width="44" height="14" rx="2" stroke="#d4af37" strokeWidth="1.5" fill="#0d1827" />
          <line x1={x - 26} y1="236" x2={x + 26} y2="236" stroke="#d4af37" strokeWidth="2" />
          {/* Shaft & Fluting */}
          <rect x={x - 16} y="254" width="32" height="346" stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1" fill="none" />
          <line x1={x - 8} y1="254" x2={x - 8} y2="600" stroke="#d4af37" strokeOpacity="0.5" strokeWidth="1" />
          <line x1={x} y1="254" x2={x} y2="600" stroke="#f3e5ab" strokeOpacity="0.7" strokeWidth="1.5" />
          <line x1={x + 8} y1="254" x2={x + 8} y2="600" stroke="#d4af37" strokeOpacity="0.5" strokeWidth="1" />
          {/* Base Plinth */}
          <rect x={x - 20} y="594" width="40" height="8" rx="1" stroke="#d4af37" strokeWidth="1.5" fill="#0d1827" />
        </g>
      ))}

      {/* Monumental Entablature Beam & Architrave */}
      <rect x="180" y="218" width="1080" height="18" fill="#0b131f" stroke="#d4af37" strokeWidth="2" />
      <line x1="160" y1="212" x2="1280" y2="212" stroke="#f3e5ab" strokeWidth="2.5" />
      <line x1="180" y1="227" x2="1260" y2="227" stroke="#2dd4bf" strokeOpacity="0.5" strokeWidth="1" strokeDasharray="6 6" />

      {/* Classical Triangular Pediment With Parametric Louvers */}
      <polygon
        points="720,80 180,212 1260,212"
        stroke="#d4af37"
        strokeWidth="3"
        fill="#070c14"
        fillOpacity="0.8"
        filter="url(#vectorGlow)"
      />
      {/* Pediment Inner Louver Rays */}
      {[280, 360, 440, 520, 600, 680, 760, 840, 920, 1000, 1080, 1160].map((lx, i) => (
        <line
          key={`louver-${i}`}
          x1={lx}
          y1="212"
          x2="720"
          y2="90"
          stroke="#2dd4bf"
          strokeOpacity="0.25"
          strokeWidth="1"
        />
      ))}
      {/* Central Tympanum Medallion */}
      <circle cx="720" cy="165" r="28" stroke="#d4af37" strokeWidth="2" fill="#0b131f" />
      <circle cx="720" cy="165" r="22" stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="1" strokeDasharray="3 3" />
      <polygon points="720,147 734,165 720,183 706,165" fill="#d4af37" fillOpacity="0.8" />

      {/* =========================================================================
          3. WATER PLINTH & CANAL SINE WAVE REFLECTIONS
          ========================================================================= */}
      <rect x="0" y="602" width="1440" height="218" fill="url(#waterGrad)" />
      <line x1="0" y1="602" x2="1440" y2="602" stroke="#d4af37" strokeWidth="3" />

      {/* Moving Sine Wave Ripples */}
      <path
        d="M 0 630 Q 180 622 360 630 T 720 630 T 1080 630 T 1440 630"
        stroke="#2dd4bf"
        strokeOpacity="0.5"
        strokeWidth="1.5"
        fill="none"
        className="svg-wave-1"
      />
      <path
        d="M 0 660 Q 180 650 360 660 T 720 660 T 1080 660 T 1440 660"
        stroke="#d4af37"
        strokeOpacity="0.4"
        strokeWidth="1.2"
        fill="none"
        className="svg-wave-2"
      />
      <path
        d="M 0 700 Q 200 688 400 700 T 800 700 T 1200 700 T 1440 700"
        stroke="#2dd4bf"
        strokeOpacity="0.3"
        strokeWidth="1"
        fill="none"
        className="svg-wave-3"
      />
      <path
        d="M 0 750 Q 220 738 440 750 T 880 750 T 1320 750 T 1440 750"
        stroke="#d4af37"
        strokeOpacity="0.2"
        strokeWidth="1"
        fill="none"
      />

      {/* Stepping Plinth Steps into the Lagoon */}
      <line x1="420" y1="614" x2="1020" y2="614" stroke="#d4af37" strokeWidth="2" />
      <line x1="460" y1="626" x2="980" y2="626" stroke="#2dd4bf" strokeOpacity="0.6" strokeWidth="1.5" />
      <line x1="500" y1="638" x2="940" y2="638" stroke="#d4af37" strokeOpacity="0.4" strokeWidth="1" />

      {/* =========================================================================
          4. STRUCTURAL ANCHOR NODES WITH PULSING RINGS
          ========================================================================= */}
      {[
        { x: 180, y: 212, label: "NODE-A1" },
        { x: 720, y: 80, label: "APEX-00" },
        { x: 1260, y: 212, label: "NODE-B1" },
        { x: 520, y: 600, label: "PLINTH-L" },
        { x: 920, y: 600, label: "PLINTH-R" },
      ].map((node, i) => (
        <g key={`node-${i}`} className="svg-anchor-node">
          <circle cx={node.x} cy={node.y} r="14" stroke="#d4af37" strokeOpacity="0.3" fill="none" className="svg-pulse-ring" />
          <circle cx={node.x} cy={node.y} r="6" stroke="#f3e5ab" strokeWidth="2" fill="#0b131f" />
          <circle cx={node.x} cy={node.y} r="2.5" fill="#2dd4bf" />
        </g>
      ))}

      {/* Horizontal Laser Scanning Beam */}
      <line x1="0" y1="360" x2="1440" y2="360" stroke="url(#laserBeamGrad)" strokeWidth="3" className="svg-laser-scan" />
    </svg>
  );
}
