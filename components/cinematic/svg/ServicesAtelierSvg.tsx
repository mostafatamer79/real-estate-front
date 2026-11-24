"use client";

import React from "react";

export default function ServicesAtelierSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 540 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <rect width="540" height="380" fill="#080e18" rx="8" />

      {/* Blueprint Grid */}
      <g stroke="#2dd4bf" strokeOpacity="0.08" strokeWidth="1" strokeDasharray="3 6">
        {[60, 120, 180, 240, 300, 360, 420, 480].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="360" />
        ))}
        {[60, 120, 180, 240, 300].map((y) => (
          <line key={y} x1="20" y1={y} x2="520" y2={y} />
        ))}
      </g>

      {/* Central Certified Notary Medallion / Escrow Seal */}
      <g transform="translate(270, 190)">
        {/* Outer Rotating Gear Ring */}
        <circle cx="0" cy="0" r="80" stroke="#d4af37" strokeWidth="2" strokeDasharray="8 6" fill="#0b1523" fillOpacity="0.8" className="svg-compass-spin" />
        <circle cx="0" cy="0" r="68" stroke="#2dd4bf" strokeWidth="1.5" strokeOpacity="0.6" fill="none" />
        <circle cx="0" cy="0" r="54" stroke="#d4af37" strokeWidth="2" fill="#0e1a2b" />

        {/* Scales of Justice / Governance Balance */}
        <line x1="0" y1="-32" x2="0" y2="28" stroke="#f3e5ab" strokeWidth="3" />
        <line x1="-36" y1="-16" x2="36" y2="-16" stroke="#f3e5ab" strokeWidth="2.5" />
        <line x1="-36" y1="-16" x2="-36" y2="6" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="36" y1="-16" x2="36" y2="6" stroke="#2dd4bf" strokeWidth="1.5" />
        <path d="M -48 6 Q -36 18 -24 6 Z" fill="#d4af37" />
        <path d="M 24 6 Q 36 18 48 6 Z" fill="#d4af37" />

        <circle cx="0" cy="-32" r="4" fill="#d4af37" />
      </g>

      {/* Laser Level Crosshairs (Engineering Inspection) */}
      <g transform="translate(100, 100)">
        <circle cx="0" cy="0" r="28" stroke="#2dd4bf" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
        <line x1="-38" y1="0" x2="38" y2="0" stroke="#2dd4bf" strokeWidth="1.5" />
        <line x1="0" y1="-38" x2="0" y2="38" stroke="#2dd4bf" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="4" fill="#d4af37" />
        <text x="0" y="44" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontFamily="monospace">
          STRUCTURAL CAD
        </text>
      </g>

      {/* AI Property Valuation Matrix (Top Right) */}
      <g transform="translate(430, 90)">
        <rect x="-45" y="-30" width="90" height="60" rx="4" stroke="#d4af37" strokeWidth="1.5" fill="#0b1626" />
        <path d="M -35 15 L -15 5 L 5 -10 L 35 -20" stroke="#2dd4bf" strokeWidth="2" fill="none" />
        <circle cx="35" cy="-20" r="3" fill="#d4af37" />
        <text x="0" y="44" textAnchor="middle" fill="#f3e5ab" fontSize="9" fontFamily="monospace">
          AI VALUATION
        </text>
      </g>

      {/* Property Management Plinth (Bottom Left) */}
      <g transform="translate(100, 290)">
        <polygon points="0,-24 30,-8 0,8 -30,-8" stroke="#d4af37" strokeWidth="1.5" fill="#0e1b2c" />
        <polygon points="-30,-8 0,8 0,32 -30,16" stroke="#2dd4bf" strokeWidth="1.5" fill="#091320" />
        <polygon points="0,8 30,-8 30,16 0,32" stroke="#d4af37" strokeOpacity="0.6" strokeWidth="1.5" fill="#070e17" />
        <text x="0" y="46" textAnchor="middle" fill="#d4af37" fontSize="9" fontFamily="monospace">
          ASSET MGMT
        </text>
      </g>

      {/* Instant Digital Escrow (Bottom Right) */}
      <g transform="translate(430, 290)">
        <rect x="-35" y="-22" width="70" height="44" rx="3" stroke="#2dd4bf" strokeWidth="1.5" fill="#0b1626" />
        <line x1="-25" y1="-10" x2="25" y2="-10" stroke="#d4af37" strokeWidth="1.5" />
        <line x1="-25" y1="0" x2="15" y2="0" stroke="#f3e5ab" strokeWidth="1" />
        <line x1="-25" y1="10" x2="5" y2="10" stroke="#2dd4bf" strokeWidth="1" />
        <circle cx="20" cy="8" r="5" fill="#d4af37" />
        <text x="0" y="40" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontFamily="monospace">
          NAFATH SSO
        </text>
      </g>
    </svg>
  );
}
