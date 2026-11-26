"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { translations } from "./translations";
import { useSettings } from "./SettingsContext";

type Language = "ar" | "en";
type Direction = "rtl" | "ltr";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  const [language, setLanguage] = useState<Language>("ar");
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem("language");
      if (storedLang === "ar" || storedLang === "en") {
        queueMicrotask(() => setLanguage(storedLang));
      }
    } catch { /* Retain the default language when storage is unavailable. */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("language", language); } catch {}
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    // Check for dynamic override first from SettingsContext
    const overrides = settings.textOverrides || {};
    const overrideKey = `${language}_${key}`;
    const text = overrides[overrideKey] || overrides[key] || translations[language][key] || key;

    if (params) {
      return Object.keys(params).reduce((acc, current) => {
        return acc.replace(new RegExp(`{${current}}`, 'g'), String(params[current]));
      }, text);
    }
    return text;
  }, [language, settings.textOverrides]);

  const contextValue = useMemo(
    () => ({ language, direction, setLanguage, toggleLanguage, t }),
    [language, direction, toggleLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
