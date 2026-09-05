"use client";

import { useCallback, useMemo } from "react";
import { useTranslationContext } from "./TranslationProvider";

type Messages = Record<string, unknown>;

export function useTranslation() {
  const { messages, locale } = useTranslationContext();

  const lang = useMemo(() => {
    if (!locale) return "en";
    return locale.toLowerCase().startsWith("hi") ? "hi" : "en";
  }, [locale]);

  const getNestedValue = (obj: Messages, path: string) => {
    return path
      .split(".")

      .reduce((acc: any, key) => (acc as Record<string, unknown>)?.[key], obj);
  };

  const interpolate = (
    text: string,
    vars?: Record<string, string | number>,
  ) => {
    if (!vars) return text;

    return text.replace(/\{(\w+)\}/g, (_, key) => {
      return vars[key]?.toString() ?? `{${key}}`;
    });
  };

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = getNestedValue(messages, key);


      if (value && typeof value === "object" && !Array.isArray(value)) {
        const translated =
          value?.[lang] ??
          value?.en ??
          Object.values(value).find((v) => typeof v === "string");

        if (typeof translated === "string") {
          return interpolate(translated, vars);
        }
      }


      if (typeof value === "string") {
        return interpolate(value, vars);
      }


      if (process.env["NODE_ENV"] === "development") {
        console.warn(`Missing translation key: ${key}`);
      }

      return key;
    },
    [messages, lang],
  );

  return { t, locale, lang };
}
