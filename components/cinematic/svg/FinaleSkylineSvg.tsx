"use client";

import React from "react";

export default function FinaleSkylineSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="skyDusk" x1="720" y1="0" x2="720" y2="600" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#080c14" />
          <stop offset="50%" stopColor="#0e1726" />
          <stop offset="85%" stopColor="#1a2014" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#06090e" />
        </linearGradient>

        <linearGradient id="skySearchlight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Twilight Sky Background */}
      <rect width="1440" height="600" fill="url(#skyDusk)" />

      {/* Stars in Sky */}
      {[
        { x: 120, y: 60 }, { x: 280, y: 40 }, { x: 410, y: 90 }, { x: 580, y: 30 },
        { x: 740, y: 70 }, { x: 890, y: 45 }, { x: 1040, y: 80 }, { x: 1220, y: 35 },
        { x: 1350, y: 95 }, { x: 200, y: 130 }, { x: 970, y: 120 }, { x: 1150, y: 110 },
      ].map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={i % 3 === 0 ? 1.8 : 1} fill="#f3e5ab" fillOpacity={0.7} />
      ))}

      {/* Sweeping Sky Searchlight Beams */}
      <polygon points="680,320 540,0 600,0" fill="url(#skySearchlight)" opacity="0.4" className="svg-beam-left" />
      <polygon points="760,320 840,0 900,0" fill="url(#skySearchlight)" opacity="0.4" className="svg-beam-right" />

      {/* Background Silhouette Layer 1 (Distant Skyline) */}
      <g stroke="#2dd4bf" strokeOpacity="0.2" strokeWidth="1" fill="#09101c" fillOpacity="0.8">
        <rect x="80" y="380" width="70" height="220" />
        <rect x="170" y="340" width="85" height="260" />
        <rect x="280" y="360" width="90" height="240" />
        <rect x="400" y="310" width="100" height="290" />
        <rect x="530" y="350" width="80" height="250" />
        <rect x="830" y="340" width="90" height="260" />
        <rect x="950" y="310" width="110" height="290" />
        <rect x="1090" y="370" width="80" height="230" />
        <rect x="1200" y="330" width="95" height="270" />
        <rect x="1320" y="360" width="75" height="240" />
      </g>

      {/* Iconic Kingdom Tower Vector Silhouette (Center Left) */}
      <g transform="translate(620, 160)">
        <path
          d="M 40 440 L 58 60 C 68 110 92 110 102 60 L 120 440 Z"
          stroke="#d4af37"
          strokeWidth="2.5"
          fill="#0c1421"
        />
        {/* Sky Bridge Inverted Parabola */}
        <path d="M 58 60 C 68 110 92 110 102 60" stroke="#f3e5ab" strokeWidth="2" fill="none" />
        <circle cx="80" cy="40" r="3" fill="#d4af37" />
        <line x1="80" y1="40" x2="80" y2="440" stroke="#d4af37" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="6 6" />
      </g>

      {/* Iconic Al Faisaliah Tower Vector Silhouette (Center Right) */}
      <g transform="translate(770, 180)">
        <polygon points="60,420 78,50 82,50 100,420" stroke="#2dd4bf" strokeWidth="2" fill="#091320" />
        {/* Golden Globe Sphere */}
        <circle cx="80" cy="110" r="14" stroke="#d4af37" strokeWidth="2" fill="#d4af37" fillOpacity="0.8" />
        <circle cx="80" cy="110" r="18" stroke="#f3e5ab" strokeWidth="1" strokeDasharray="3 3" />
        {/* Spire */}
        <line x1="80" y1="50" x2="80" y2="10" stroke="#f3e5ab" strokeWidth="2" />
        <circle cx="80" cy="10" r="2.5" fill="#f3e5ab" />
      </g>

      {/* Foreground Banan Parametric Smart Towers & Water Edge */}
      <g stroke="#d4af37" strokeOpacity="0.6" strokeWidth="1.5" fill="#060b13">
        {/* Banan Twisting Tower 1 */}
        <polygon points="260,260 340,260 360,600 240,600" stroke="#d4af37" />
        {/* Banan Twisting Tower 2 */}
        <polygon points="1060,240 1140,240 1160,600 1040,600" stroke="#d4af37" />

        {/* Diagonal Floor Slabs on Towers */}
        {[300, 340, 380, 420, 460, 500, 540].map((y) => (
          <React.Fragment key={y}>
            <line x1="250" y1={y} x2="350" y2={y} stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1" />
            <line x1="1050" y1={y} x2="1150" y2={y} stroke="#2dd4bf" strokeOpacity="0.4" strokeWidth="1" />
          </React.Fragment>
        ))}
      </g>

      {/* Reflecting Water Line at Bottom */}
      <line x1="0" y1="540" x2="1440" y2="540" stroke="#d4af37" strokeWidth="2" />
      <path
        d="M 0 560 Q 360 550 720 560 T 1440 560"
        stroke="#2dd4bf"
        strokeOpacity="0.4"
        strokeWidth="1.5"
        fill="none"
        className="svg-wave-1"
      />
      <path
        d="M 0 580 Q 360 570 720 580 T 1440 580"
        stroke="#d4af37"
        strokeOpacity="0.3"
        strokeWidth="1"
        fill="none"
        className="svg-wave-2"
      />
    </svg>
  );
}
