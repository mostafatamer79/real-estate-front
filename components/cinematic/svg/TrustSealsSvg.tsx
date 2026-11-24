"use client";

import React from "react";

export function RegaSealSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="#d4af37" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="32" cy="32" r="24" fill="#0b1626" stroke="#2dd4bf" strokeWidth="1" />
      <polygon points="32,14 44,22 44,42 32,50 20,42 20,22" stroke="#d4af37" strokeWidth="1.5" fill="#070e17" />
      <path d="M 26 34 L 30 38 L 38 28" stroke="#2dd4bf" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NafathSealSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="#2dd4bf" strokeWidth="2" />
      <circle cx="32" cy="32" r="23" fill="#091422" stroke="#d4af37" strokeWidth="1" strokeDasharray="2 4" />
      {/* Fingerprint / Digital ID Rings */}
      <path d="M 32 18 A 14 14 0 0 1 46 32 C 46 40 40 46 32 46 C 24 46 18 40 18 32" stroke="#2dd4bf" strokeWidth="1.5" fill="none" />
      <path d="M 32 23 A 9 9 0 0 1 41 32 C 41 37 37 41 32 41" stroke="#d4af37" strokeWidth="1.5" fill="none" />
      <circle cx="32" cy="32" r="3" fill="#f3e5ab" />
    </svg>
  );
}

export function EjarSealSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="#d4af37" strokeWidth="1.5" />
      <rect x="18" y="14" width="28" height="36" rx="3" fill="#0b1727" stroke="#2dd4bf" strokeWidth="1.5" />
      <line x1="24" y1="22" x2="40" y2="22" stroke="#d4af37" strokeWidth="1.5" />
      <line x1="24" y1="28" x2="40" y2="28" stroke="#f3e5ab" strokeWidth="1" />
      <line x1="24" y1="34" x2="34" y2="34" stroke="#f3e5ab" strokeWidth="1" />
      <circle cx="37" cy="38" r="4" fill="#d4af37" />
    </svg>
  );
}

export function WafiSealSvg({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="28" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="6 3" />
      <polygon points="32,16 48,26 48,46 32,46 16,46 16,26" fill="#0a1524" stroke="#d4af37" strokeWidth="1.5" />
      <line x1="32" y1="20" x2="32" y2="44" stroke="#2dd4bf" strokeWidth="1.5" />
      <circle cx="32" cy="30" r="5" stroke="#f3e5ab" strokeWidth="1.5" fill="#0d1b2e" />
    </svg>
  );
}
