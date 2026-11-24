"use client";

import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

export default function ThemeToggle() {
  const { settings, toggleTheme } = useSettings();
  const { language } = useLanguage();
  const isDark = settings.isDark;
  const label = isDark
    ? language === "ar" ? "الوضع النهاري" : "Light mode"
    : language === "ar" ? "الوضع الليلي" : "Dark mode";

  return (
    <motion.button
      type="button"
      data-theme-toggle
      aria-label={label}
      aria-pressed={isDark}
      title={label}
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      className="theme-toggle calm-interactive fixed z-[10001] bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 md:left-6 flex min-h-12 items-center gap-2.5 rounded-full border px-3.5 py-2 text-sm font-bold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="theme-toggle-icon flex h-8 w-8 items-center justify-center rounded-full" aria-hidden="true">
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -20, scale: 0.7, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </span>
      <span className="theme-toggle-label whitespace-nowrap">{label}</span>
    </motion.button>
  );
}
