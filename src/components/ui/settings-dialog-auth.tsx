"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";

import { Button } from "./button";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "./custom-modal";

import { useTranslation, useLanguage, type Locale } from "@/i18n";

const THEME_KEY = "portal-theme";
const LANG_KEY = "portal-language";

type ThemeType = "light" | "dark" | "system";

export function SettingsDialogAuth({
  open,
  onOpenChange,
  dbPreferences,
  isAuthenticated,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dbPreferences?: { preferred_language?: Locale; preferred_theme?: ThemeType };
  isAuthenticated?: boolean;
  onSave?: (data: {
    preferred_language: Locale;
    preferred_theme: ThemeType;
  }) => Promise<void>;
}) {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { locale, switchLanguage } = useLanguage();

  const [selectedLang, setSelectedLang] = useState<Locale>(locale);
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("system");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (isAuthenticated && dbPreferences?.preferred_language) {
      setSelectedLang(dbPreferences.preferred_language);
    } else {
      setSelectedLang(locale);
    }
    if (isAuthenticated && dbPreferences?.preferred_theme) {
      setSelectedTheme(dbPreferences.preferred_theme);
    } else {
      const storedTheme =
        (localStorage.getItem(THEME_KEY) as ThemeType | null) ??
        (theme as ThemeType) ??
        "system";
      setSelectedTheme(storedTheme);
    }
  }, [open, theme, locale, isAuthenticated, dbPreferences]);


  const saveSettings = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave({
          preferred_language: selectedLang,
          preferred_theme: selectedTheme,
        });
      } else {
        localStorage.setItem(LANG_KEY, selectedLang);
        localStorage.setItem(THEME_KEY, selectedTheme);
      }
      switchLanguage(selectedLang);
      localStorage.setItem(LANG_KEY, selectedLang);
      localStorage.setItem(THEME_KEY, selectedTheme);
      setTheme(selectedTheme);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };


  function handleDialogChange(state: boolean) {
    if (!state) {
      setSelectedLang(locale);
      const storedTheme =
        (localStorage.getItem(THEME_KEY) as ThemeType) ?? "system";
      setSelectedTheme(storedTheme);
    }
    onOpenChange(state);
  }

  return (
    <CustomModal
      open={open}
      onOpenChange={handleDialogChange}
      className="max-w-[440px]"
    >
      <CustomModalClose onClose={() => handleDialogChange(false)} />
      <CustomModalHeader className="pb-2">
        <CustomModalTitle className="text-base">
          {t("settings.title") || "Preferences"}
        </CustomModalTitle>
      </CustomModalHeader>

      <CustomModalBody className="space-y-4 pb-6">
        {}
        <div className="rounded-xl border border-border/40 dark:border-border/30 bg-card dark:bg-card p-3.5 space-y-3">
          <p className="text-sm font-semibold leading-none">Language</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                code: "en",
                label: t("settings.english") || "English",
                sub: "English",
              },
              {
                code: "hi",
                label: t("settings.hindi") || "हिन्दी",
                sub: "हिन्दी",
              },
            ].map((opt) => (
              <button
                key={opt.code}
                onClick={() => setSelectedLang(opt.code as Locale)}
                className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${selectedLang === opt.code ? "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700" : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"}`}
              >
                <div>
                  <p className="text-sm font-medium leading-none">
                    {opt.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-none mt-1">
                    {opt.sub}
                  </p>
                </div>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 shrink-0 ${selectedLang === opt.code ? "bg-primary border-primary text-primary-foreground" : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"}`}
                >
                  {selectedLang === opt.code && <Check className="h-3 w-3" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {}
        <div className="rounded-xl border border-border/40 dark:border-border/30 bg-card dark:bg-card p-3.5 space-y-3">
          <p className="text-sm font-semibold leading-none">Appearance</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                code: "light",
                label: t("settings.light") || "Light",
                Icon: Sun,
              },
              { code: "dark", label: t("settings.dark") || "Dark", Icon: Moon },
              {
                code: "system",
                label: t("settings.system") || "System",
                Icon: Monitor,
              },
            ].map((opt) => (
              <button
                key={opt.code}
                onClick={() => setSelectedTheme(opt.code as ThemeType)}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition-all ${selectedTheme === opt.code ? "bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-700" : "bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-zinc-200 dark:border-zinc-800"}`}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${selectedTheme === opt.code ? "bg-primary text-primary-foreground" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"}`}
                >
                  <opt.Icon className="h-4 w-4" />
                </div>
                <span className="text-xs font-medium leading-none">
                  {opt.label}
                </span>
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${selectedTheme === opt.code ? "bg-primary border-primary text-primary-foreground" : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900"}`}
                >
                  {selectedTheme === opt.code && (
                    <Check className="h-2.5 w-2.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </CustomModalBody>

      <CustomModalFooter className="gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1 rounded-xl h-9"
        >
          {t("settings.cancel") || "Cancel"}
        </Button>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="flex-1 rounded-xl h-9"
        >
          {saving ? "Saving..." : t("settings.save") || "Save"}
        </Button>
      </CustomModalFooter>
    </CustomModal>
  );
}
