"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./translations";

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

  // Basic dictionary placeholder
  // Imported from translations.ts
  const t = (key: string, params?: Record<string, string | number>) => {
    const text = translations[language][key] || key;
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
