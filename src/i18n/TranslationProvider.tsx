"use client";

import { createContext, useContext, useMemo } from "react";

type Messages = Record<string, unknown>;

type TranslationContextType = {
  locale: string;
  messages: Messages;
};

const TranslationContext = createContext<TranslationContextType | undefined>(
  undefined,
);

type TranslationProviderProps = {
  locale: string;
  messages: Messages;
  children: React.ReactNode;
};

export function TranslationProvider({
  locale,
  messages,
  children,
}: TranslationProviderProps) {

  const value = useMemo(() => ({ locale, messages }), [locale, messages]);

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const ctx = useContext(TranslationContext);

  if (!ctx) {
    throw new Error(
      "useTranslationContext must be used within TranslationProvider",
    );
  }

  return ctx;
}
