"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  ReactNode,
  useCallback,
} from "react";
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

// Store for language state
const languageListeners = new Set<() => void>();

function getLanguageSnapshot(): Language {
  if (typeof window === "undefined") {
    return "en"; // Server-side: always return 'en' to match initial render
  }
  const saved = localStorage.getItem("language") as Language;
  if (saved === "en" || saved === "tr") {
    return saved;
  }
  return "en";
}

function subscribeLanguage(callback: () => void) {
  languageListeners.add(callback);
  return () => {
    languageListeners.delete(callback);
  };
}

function setLanguageStore(lang: Language) {
  if (typeof window !== "undefined") {
    localStorage.setItem("language", lang);
  }
  languageListeners.forEach((listener) => listener());
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore to sync with localStorage
  // This ensures server and client render the same initially ('en'), then syncs after hydration
  const language = useSyncExternalStore(
    subscribeLanguage,
    getLanguageSnapshot,
    () => "en" as Language // Server snapshot: always 'en' to prevent hydration mismatch
  ) as Language;

  const setLanguage = useCallback((lang: Language) => {
    setLanguageStore(lang);
  }, []);

  const t = (key: string): string => {
    const lang = language as Language;
    const translation = getNestedValue(
      translations[lang] as Record<string, unknown>,
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
