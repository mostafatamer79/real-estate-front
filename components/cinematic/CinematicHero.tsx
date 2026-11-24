"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import type { PointerEvent } from "react";

type CinematicHeroProps = {
  description: string;
  showOffers: boolean;
};

export default function CinematicHero({ description, showOffers }: CinematicHeroProps) {
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty("--cinematic-rotate-x", `${(-y * 5).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--cinematic-rotate-y", `${(x * 6).toFixed(2)}deg`);
  };

  const resetPointer = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.style.setProperty("--cinematic-rotate-x", "0deg");
    event.currentTarget.style.setProperty("--cinematic-rotate-y", "0deg");
  };

  return (
    <section className="cinematic-hero" aria-labelledby="cinematic-home-title">
      <div className="cinematic-hero-copy">
        <h1 id="cinematic-home-title">العروض والخدمات العقارية في مكان واحد</h1>
        <p>{description}</p>
        <div className="cinematic-hero-actions">
          {showOffers && (
            <Link href="/offers" className="cinematic-primary-action">
              استعرض العروض <ArrowUpLeft aria-hidden="true" size={18} />
            </Link>
          )}
          <Link href="/about" className="cinematic-secondary-action">تعرف على المنصة</Link>
        </div>
      </div>
      <div
        className="cinematic-hero-stage"
        onPointerMove={handlePointerMove}
        onPointerLeave={resetPointer}
      >
        <div className="cinematic-hero-plane">
          <div className="cinematic-photo-frame">
            <Image
              src="/cinematic-residence.webp"
              alt="تصور معماري لمبنى سكني حديث"
              fill
              priority
              sizes="(max-width: 767px) 100vw, (max-width: 1200px) 55vw, 680px"
              className="cinematic-hero-image"
            />
          </div>
          <span className="cinematic-visual-note">تصور بصري</span>
        </div>
      </div>
    </section>
  );
}
