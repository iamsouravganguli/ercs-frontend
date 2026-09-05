"use client";

import { useEffect } from "react";
import { useLanguage } from "@/i18n";
import { useTheme } from "next-themes";
import { apiClient } from "@/lib/api-client";

export function PreferencesSync() {
  const { locale, switchLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const sync = async () => {
      try {

        if (
          typeof document !== "undefined" &&
          !document.cookie.includes("access_token")
        )
          return;
        const res: any = await apiClient.get("/preferences/");
        const data = res?.data?.result?.data;
        if (!data) return;
        if (data.preferred_language && data.preferred_language !== locale) {
          switchLanguage(data.preferred_language);
        }
        if (data.preferred_theme && data.preferred_theme !== theme) {
          setTheme(data.preferred_theme);
        }
      } catch {}
    };
    sync();

  }, []);

  return null;
}
