"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/src/components/Header";

export function SiteHeader() {
  const path = usePathname();
  if (path === "/") return null;
  return <Header />;
}

export function SiteFooter() {
  return null;
}
