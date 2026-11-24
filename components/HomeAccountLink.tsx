"use client";

import Link from "next/link";
import { ArrowUpLeft, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/context/LanguageContext";

export default function HomeAccountLink({ withIcons = false }: { withIcons?: boolean }) {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const ar = language === "ar";
  const label = isAuthenticated
    ? (ar ? "الانتقال إلى لوحة المعلومات" : "Go to dashboard")
    : (ar ? "تسجيل الدخول" : "Sign in");

  return <Link href={isAuthenticated ? "/details" : "/login"}>
    {withIcons && <UserRound size={16} aria-hidden="true" />}
    {label}
    {withIcons && <ArrowUpLeft size={16} aria-hidden="true" />}
  </Link>;
}
