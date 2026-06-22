"use client";

import { usePathname } from "next/navigation";

export default function GlobalBackground() {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/details")) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 -z-10 pointer-events-none opacity-[0.25]" 
      style={{
        backgroundImage: "url('/cover.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "repeat"
      }}
    />
  );
}
