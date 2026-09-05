"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { TranslationProvider } from "./TranslationProvider";
import translationData from "../locales";

const LANG_KEY = "portal-language";
export type Locale = "en" | "hi";

interface LanguageContextType {
  locale: Locale;
  switchLanguage: (lang: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("hi");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(LANG_KEY) as Locale | null) ?? "hi";
    setLocale(stored);
    setMounted(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === LANG_KEY && e.newValue) {
        setLocale(e.newValue as Locale);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const switchLanguage = (lang: Locale) => {
    localStorage.setItem(LANG_KEY, lang);
    setLocale(lang);
  };

  const value = useMemo(() => ({ locale, switchLanguage }), [locale]);

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={value}>
      <TranslationProvider locale={locale} messages={translationData}>
        {children}
      </TranslationProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
