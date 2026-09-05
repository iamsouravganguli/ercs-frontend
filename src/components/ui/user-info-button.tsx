"use client";

import * as React from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { User } from "lucide-react";
import { useTranslation } from "@/i18n";

interface UserInfoButtonProps {
  user?: {
    name?: string;
    role_code?: string;
    role?: string;
  };
  align?: "start" | "center" | "end";
  side?: "top" | "bottom" | "left" | "right";
}

export function UserInfoButton({
  user,
  align = "end",
  side = "bottom",
}: UserInfoButtonProps) {
  const { lang } = useTranslation();
  const isHindi = lang === "hi";

  const labels = {
    profile: isHindi ? "प्रोफ़ाइल" : "Profile",
    name: isHindi ? "नाम" : "Name",
    role: isHindi ? "भूमिका" : "Role",
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/60 dark:hover:bg-neutral-700/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 shrink-0 transition-all cursor-pointer"
          title="User Information"
        >
          <User className="w-4 h-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={8}
        className="w-64 p-4 rounded-xl border border-border/60 ring-0 shadow-lg bg-popover text-popover-foreground z-[100]"
      >
        <div className="space-y-4">
          {}
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <User className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-semibold text-sm">{labels.profile}</h4>
          </div>

          {}
          <div className="space-y-3">
            {}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block">
                {labels.name}
              </span>
              <span className="text-sm font-medium text-foreground block truncate">
                {user?.name || "N/A"}
              </span>
            </div>

            {}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block">
                {labels.role}
              </span>
              <span className="text-sm font-medium text-foreground block truncate">
                {formatRole(user?.role_code || user?.role)}
              </span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
