"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useTranslation, useLanguage } from "@/i18n";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Settings2, Globe, Sun, Moon, User } from "lucide-react";
import { cn } from "@/lib/cn";

interface PreferencesButtonProps {
  user?: any;
  isCollapsed?: boolean;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export function PreferencesButton({
  user,
  isCollapsed = false,
  align = "center",
  side = "top",
}: PreferencesButtonProps) {
  const { t, lang } = useTranslation();
  const { locale, switchLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isHindi = lang === "hi";

  const labels = {
    profile: isHindi ? "प्रोफ़ाइल" : "Profile",
    name: isHindi ? "नाम" : "Name",
    role: isHindi ? "भूमिका" : "Role",
    settings: isHindi ? "सेटिंग्स" : "Settings",
  };

  const formatRole = (role?: string) => {
    if (!role) return "N/A";
    const upper = role.toUpperCase();


    const hindiRoles: Record<string, string> = {
      RSI: "आरएसआई सर्किल",
      RI: "आरआई सर्किल",
      CT: "नागरिक",
      CITIZEN: "नागरिक",
      CC: "अधिकारी",
      AD: "अधिवक्ता",
      ADVOCATE: "अधिवक्ता",
      SA: "सुपर एडमिन",
      PO: "पीठासीन अधिकारी",
      CO: "पेशकार / अहलमद",
    };


    const englishRoles: Record<string, string> = {
      RSI: "RSI Circle",
      RI: "RI Circle",
      CT: "Citizen",
      CITIZEN: "Citizen",
      CC: "Court Clerk",
      AD: "Advocate",
      ADVOCATE: "Advocate",
      SA: "Super Admin",
      PO: "Presiding Officer",
      CO: "Clerk / Ahlmad",
    };

    const roleMap = isHindi ? hindiRoles : englishRoles;

    return (
      roleMap[upper] ||
      role
        .split("_")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ")
    );
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-900 bg-white dark:bg-blue-950 hover:bg-blue-50 dark:hover:bg-blue-900 text-slate-700 dark:text-blue-200 shrink-0 transition-all cursor-pointer",
            isCollapsed && "w-9 h-9",
          )}
          title={labels.settings}
        >
          <Settings2 className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-45" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-[270px] p-3 rounded-2xl border border-blue-200 dark:border-blue-900 ring-0 shadow-lg bg-[#f0f7ff] dark:bg-slate-900 text-popover-foreground z-[100]"
      >
        <div className="space-y-3">
          {}
          {user && (
            <div className="bg-white dark:bg-blue-950 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 flex items-center justify-center text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="flex flex-col min-w-0 flex-grow">
                <span className="text-sm font-semibold text-slate-900 dark:text-white truncate block leading-tight">
                  {user?.name || "User"}
                </span>
                <span className="text-[9px] mt-1 font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 self-start truncate max-w-full">
                  {formatRole(user?.role_code || user?.role)}
                </span>
              </div>
            </div>
          )}

          {}
          {user && <div className="h-px bg-blue-200/60 dark:bg-blue-900/60" />}

          {}
          <div className="text-[10px] font-bold text-blue-900/80 dark:text-blue-300/80 tracking-wider px-1">
            {t("header.preferences") || "Preferences"}
          </div>

          {}
          <div className="space-y-1.5 px-1">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{t("header.language")}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-blue-100/70 dark:bg-blue-950/80 p-0.5 rounded-lg border border-blue-200 dark:border-blue-900">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-medium rounded-md justify-center px-2 py-1 shadow-none border-transparent cursor-pointer transition-all duration-200 hover:bg-blue-200/40 dark:hover:bg-blue-900/40",
                  locale === "en"
                    ? "bg-white dark:bg-blue-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
                onClick={() => switchLanguage("en")}
              >
                English
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-medium rounded-md justify-center px-2 py-1 shadow-none border-transparent cursor-pointer transition-all duration-200 hover:bg-blue-200/40 dark:hover:bg-blue-900/40",
                  locale === "hi"
                    ? "bg-white dark:bg-blue-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
                onClick={() => switchLanguage("hi")}
              >
                हिन्दी
              </Button>
            </div>
          </div>

          {}
          <div className="space-y-1.5 px-1">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>{t("header.theme")}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-blue-100/70 dark:bg-blue-950/80 p-0.5 rounded-lg border border-blue-200 dark:border-blue-900">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-medium rounded-md justify-center gap-1.5 px-2 py-1 shadow-none border-transparent cursor-pointer transition-all duration-200 hover:bg-blue-200/40 dark:hover:bg-blue-900/40",
                  theme === "light"
                    ? "bg-white dark:bg-blue-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
                onClick={() => setTheme("light")}
              >
                <Sun className="w-3.5 h-3.5 shrink-0" />
                {t("header.light")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 text-xs font-medium rounded-md justify-center gap-1.5 px-2 py-1 shadow-none border-transparent cursor-pointer transition-all duration-200 hover:bg-blue-200/40 dark:hover:bg-blue-900/40",
                  theme === "dark"
                    ? "bg-white dark:bg-blue-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white",
                )}
                onClick={() => setTheme("dark")}
              >
                <Moon className="w-3.5 h-3.5 shrink-0" />
                {t("header.dark")}
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
