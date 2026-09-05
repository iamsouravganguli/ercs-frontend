"use client";
import { useProfileDetail } from "@/lib";
import { useTranslation } from "@/i18n";
import { PageTabs, type PageTab } from "@/components/ui/page-tab";
import { hasRole } from "@/components/ui/role-guard";
import { UserCog, KeyRound, Users } from "lucide-react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full flex-1 flex flex-col bg-background min-h-0 overflow-hidden">
      {children}
    </div>
  );
}
