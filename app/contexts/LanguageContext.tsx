"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import enTranslations from "../translations/en.json";
import trTranslations from "../translations/tr.json";

type Language = "en" | "tr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations = {
  en: enTranslations,
  tr: trTranslations,
};

// Helper function to get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return current[key] as Record<string, unknown>;
    }
    return undefined;
  }, obj as Record<string, unknown> | undefined);

  return typeof result === "string" ? result : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize state with function to read from localStorage on client, default to 'en' on server
  // This prevents hydration mismatches and avoids setState in effects
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      if (savedLanguage === "en" || savedLanguage === "tr") {
        return savedLanguage;
      }
    }
    return "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
  };

  const t = (key: string): string => {
    const translation = getNestedValue(
      translations[language] as Record<string, unknown>,
      key
    );
    return translation || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
