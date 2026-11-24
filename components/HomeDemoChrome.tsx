"use client";

import { usePathname } from "next/navigation";
import Header from "@/app/src/components/Header";
import Footer from "@/app/src/components/Footer";

export function SiteHeader() {
  const path = usePathname();
  if (path === "/") return null;
  return <Header />;
}

export function SiteFooter() {
  const path = usePathname();
  if (path === "/login" || path === "/") return null;
  return <Footer />;
}
