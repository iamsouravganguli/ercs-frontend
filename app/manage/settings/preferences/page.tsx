"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useLanguage } from "@/i18n";
import { useTheme } from "next-themes";
import { usePreferences, useUpdatePreferences, useSessionCheck } from '@/lib/query';
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Languages, Palette, Check, Sun, Moon, Monitor } from "lucide-react";
import { DataBoundary } from "@/components/ui/data-boundary";

export default function PreferencesPage() {
  const { t } = useTranslation();
  const { locale, switchLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const prefQuery = usePreferences();
  const updateMut = useUpdatePreferences();
  const { data: sessionData } = useSessionCheck();
  const isAuthenticated = !!sessionData?.result?.data?.is_authenticated;

  const [selectedLang, setSelectedLang] = useState<"en" | "hi">(locale);
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >((theme as any) || "light");


  useEffect(() => {
    const data: any = prefQuery.data?.result?.data;
    if (data) {
      if (data.preferred_language && data.preferred_language !== locale) {
        switchLanguage(data.preferred_language);
        setSelectedLang(data.preferred_language);
      }
      if (data.preferred_theme && data.preferred_theme !== theme) {
        setTheme(data.preferred_theme);
        setSelectedTheme(data.preferred_theme);
      }
    }
  }, [prefQuery.data]);


  useEffect(() => setSelectedLang(locale), [locale]);
  useEffect(() => setSelectedTheme((theme as any) || "light"), [theme]);

  const handleSave = async () => {
    try {
      if (isAuthenticated) {
        await updateMut.mutateAsync({
          preferred_language: selectedLang,
          preferred_theme: selectedTheme,
        });
      }
      switchLanguage(selectedLang);
      setTheme(selectedTheme);
      localStorage.setItem("portal-language", selectedLang);
      localStorage.setItem("portal-theme", selectedTheme);
      toast.success(
        isAuthenticated
          ? "Preferences saved to account"
          : "Preferences saved locally",
      );
    } catch (e: any) {
      toast.error(e?.message || "Failed to save preferences");
    }
  };

  const hasChanges =
    selectedLang !==
      (prefQuery.data?.result?.data as any)?.preferred_language ||
    selectedTheme !== (prefQuery.data?.result?.data as any)?.preferred_theme;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Preferences
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-white dark:bg-background">
        <DataBoundary
          isError={prefQuery.isError}
          data={prefQuery.data?.result?.data}
          errorTitle="Failed to load preferences"
          errorMessage={(prefQuery.error as any)?.message || "Failed"}
          onRefetch={prefQuery.refetch}
          emptyTitle="No preferences"
          emptyMessage="No data"
          refetchLabel="Retry"
        >
          <div className="w-full space-y-5 max-w-2xl">
            <Card className="p-3.5 space-y-4 border border-border/40 dark:border-border/30 bg-card dark:bg-card shadow-sm">
              <div className="rounded-xl border border-border/40 dark:border-border/30 bg-card dark:bg-card p-3.5 space-y-3">
                <p className="text-sm font-semibold leading-none">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { code: "en", label: "English", sub: "English" },
                    { code: "hi", label: "हिन्दी", sub: "हिन्दी" },
                  ].map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setSelectedLang(opt.code as any)}
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
                        {selectedLang === opt.code && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border/40 dark:border-border/30 bg-card dark:bg-card p-3.5 space-y-3">
                <p className="text-sm font-semibold leading-none">Appearance</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "light", label: "Light", Icon: Sun },
                    { code: "dark", label: "Dark", Icon: Moon },
                    { code: "system", label: "System", Icon: Monitor },
                  ].map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => setSelectedTheme(opt.code as any)}
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

              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateMut.isPending}
                  className="min-w-[100px] h-9 rounded-xl shadow-sm"
                >
                  {updateMut.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </Card>
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
