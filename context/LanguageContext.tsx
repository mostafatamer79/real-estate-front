"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  const [direction, setDirection] = useState<Direction>("rtl");

  useEffect(() => {
    const storedLang = localStorage.getItem("language") as Language;
    if (storedLang) {
      setLanguage(storedLang);
      setDirection(storedLang === "ar" ? "rtl" : "ltr");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    setDirection(language === "ar" ? "rtl" : "ltr");
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "ar" ? "en" : "ar"));
  };

  const t = (key: string, params?: Record<string, string | number>) => {
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
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, toggleLanguage, t }}>
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
