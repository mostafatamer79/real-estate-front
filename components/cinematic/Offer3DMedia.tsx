"use client";

import { ExternalLink } from "lucide-react";
import { safeHttpUrl } from "@/lib/safe-url";

type Offer3DMediaProps = {
  source: string;
  label: string;
  language: "ar" | "en";
};

export default function Offer3DMedia({ source, label, language }: Offer3DMediaProps) {
  const url = source.startsWith("/") && !source.startsWith("//") ? source : safeHttpUrl(source);
  if (!url) return null;

  const directVideo = /\.(mp4|webm|ogv|ogg)$/i.test(new URL(url, "https://example.invalid").pathname);

  return (
    <div className="cinematic-3d-media">
      {directVideo && (
        <video controls playsInline preload="none" aria-label={label} className="cinematic-3d-video">
          <source src={url} />
          {language === "ar" ? "متصفحك لا يدعم تشغيل هذا الفيديو." : "Your browser cannot play this video."}
        </video>
      )}
      <a href={url} target="_blank" rel="noopener noreferrer" className="cinematic-3d-link">
        <span>{label}</span>
        <ExternalLink size={17} aria-hidden="true" />
      </a>
    </div>
  );
}
