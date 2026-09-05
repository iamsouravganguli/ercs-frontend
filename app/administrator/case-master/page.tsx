"use client";
import { useTranslation } from "@/i18n";
import {
  FileText,
  FileEdit,
  FolderOpen,
  ListOrdered,
  Workflow,
  HelpCircle,
  PanelLeft,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GridMenu, GridMenuItem } from "@/components/ui/grid-menu";

export default function CaseMasterMenus() {
  const { t } = useTranslation();

  const caseMasterOptions: GridMenuItem[] = [
    {
      title: t("case_master.options.case_types.title") || "Case Types",
      description:
        t("case_master.options.case_types.description") ||
        "Manage systems defined case types and classification schemas",
      icon: <FileText className="w-5 h-5" />,
      href: "/administrator/case-master/types",
    },
    {
      title:
        t("case_master.options.case_categories.title") || "Case Categories",
      description:
        t("case_master.options.case_categories.description") ||
        "Configure broad groupings and classifications for legal matters",
      icon: <FolderOpen className="w-5 h-5" />,
      href: "/administrator/case-master/categories",
    },
    {
      title: t("case_master.options.case_stages.title") || "Hearing Stages",
      description:
        t("case_master.options.case_stages.description") ||
        "Track and update standard judicial stages for courtroom litigation",
      icon: <ListOrdered className="w-5 h-5" />,
      href: "/administrator/case-master/stages",
    },
    {
      title: t("case_master.options.workflow.title") || "Status Workflow",
      description:
        t("case_master.options.workflow.description") ||
        "Define state transitions and custom triggers for legal cases",
      icon: <Workflow className="w-5 h-5" />,
      href: "/administrator/case-master/workflow",
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background dark:bg-neutral-950 overflow-hidden">
      {}
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 px-4 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 py-2.5 md:py-0 h-auto md:h-14">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("administrator.quick.case_master.title") || "Case Master"}
          </span>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar bg-muted/30">
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">
              {t("administrator.quick.case_master.title") ||
                "Case Master Configuration"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {t("administrator.quick.case_master.description") ||
                "Configure case classifications, legal categories, judicial hearing stages, and case status transition models"}
            </p>
          </div>

          <section className="space-y-4">
            <GridMenu items={caseMasterOptions} />
          </section>
        </div>
      </div>
    </div>
  );
}
