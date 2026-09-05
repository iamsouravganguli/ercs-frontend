"use client";

import React, { useState } from "react";
import { StatusUpdateModal } from "@/workflows/e-file/common/status-update/status-update-modal";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PreferencesButton } from "@/components/ui/preferences-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCaseDetail, useProfileDetail } from "@/lib";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/status-badge";
import Image from "next/image";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Scale,
  Home,
  FileText,
  Users,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  IndianRupee,
  Bell,
  Archive,
  Calendar,
  CheckCircle,
  Gavel,
  RotateCcw,
  Send,
  MapPin,
  History,
  LogOut,
  AlertTriangle,
  ClipboardCheck,
  RefreshCw,
  Info,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


type Step = {
  label: string;
  icon: any;
  href: string;
  roles?: string[];
};

type StepGroup = {
  groupLabel: string;
  roles: string[];
  steps: Step[];
};


export const getStepGroups = (base: string): StepGroup[] => [
  {
    groupLabel: "Case Initiation",
    roles: ["CT", "SA", "PO", "CO", "AD", "RI", "RSI"],
    steps: [
      {
        label: "Case details",
        icon: Scale,
        href: `${base}`,
        roles: ["CT", "SA", "PO", "CO", "AD"],
      },
      {
        label: "Party details",
        icon: Users,
        href: `${base}/parties`,
        roles: ["CT", "SA", "PO", "CO", "AD"],
      },
      {
        label: "Land details",
        icon: MapPin,
        href: `${base}/lands`,
        roles: ["CT", "SA", "PO", "CO", "AD", "RI", "RSI"],
      },
      {
        label: "Documents",
        icon: FileText,
        href: `${base}/documents`,
        roles: ["CT", "SA", "PO", "CO", "AD"],
      },
    ],
  },
  {
    groupLabel: "Finalization",
    roles: ["CT", "SA", "PO", "CO", "AD"],
    steps: [
      {
        label: "Review & submit",
        icon: ClipboardCheck,
        href: `${base}/review`,
      },
      { label: "Case Progress", icon: History, href: `${base}/timeline` },
    ],
  },
  {
    groupLabel: "Pre Order",
    roles: ["CT", "SA", "PO", "CO", "AD", "RI", "RSI"],
    steps: [
      { label: "Issue notice", icon: Bell, href: `${base}/notices` },
      { label: "Hearings", icon: Calendar, href: `${base}/hearing` },
      {
        label: "Orders",
        icon: FileText,
        href: `${base}/order/draft`,
        roles: ["CT", "SA", "PO", "CO", "AD"],
      },
    ],
  },
  {
    groupLabel: "Post Order",
    roles: ["SA", "PO", "CO"],
    steps: [
      {
        label: "Execution / Compliance",
        icon: CheckCircle,
        href: `${base}/execution`,
      },
      { label: "Case closure", icon: Archive, href: `${base}/close` },
    ],
  },
];


type Props = {
  role: string;
};

export function AppSidebar({ role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, state } = useSidebar();
  const params = useParams();
  const { t, lang } = useTranslation();
  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const caseNumber = params?.case_number as string | undefined;
  const base = caseNumber ? `/case/${caseNumber}` : "";

  const { data: caseDetailRes } = useCaseDetail(caseNumber as string);
  const caseData = caseDetailRes?.result?.data;
  const { data: profileData } = useProfileDetail();
  const user = profileData?.result?.data;

  const stageName = caseData?.current_stage_detail
    ? lang === "hi"
      ? caseData.current_stage_detail.name ||
        caseData.current_stage_detail.name_en
      : caseData.current_stage_detail.name_en ||
        caseData.current_stage_detail.name
    : null;

  const statusName = caseData?.current_status_detail
    ? lang === "hi"
      ? caseData.current_status_detail.name ||
        caseData.current_status_detail.name_en
      : caseData.current_status_detail.name_en ||
        caseData.current_status_detail.name
    : null;

  const lastUpdatedStr = React.useMemo(() => {
    if (!caseData?.updated_at) return null;
    const date = new Date(caseData.updated_at);
    return isNaN(date.getTime())
      ? null
      : date.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }, [caseData?.updated_at, lang]);

  const getStageBadgeVariant = React.useCallback(
    (
      code: string | null | undefined,
    ): "success" | "error" | "warning" | "info" | "neutral" => {
      if (!code) return "neutral";
      const c = code.toUpperCase();
      if (c === "FILING") {
        return "info";
      }
      if (c === "CLOSED") {
        return "success";
      }
      return "warning";
    },
    [],
  );

  const getStatusBadgeVariant = React.useCallback(
    (statusObj: any): "success" | "error" | "warning" | "info" | "neutral" => {
      if (!statusObj) return "neutral";
      const nameEn = statusObj.name_en || statusObj.name || "";
      const norm = nameEn.toLowerCase();
      if (
        norm.includes("draft") ||
        norm.includes("pending") ||
        norm.includes("process") ||
        norm.includes("hearing") ||
        norm.includes("scheduled") ||
        norm.includes("adjourned") ||
        norm.includes("issued")
      ) {
        return "warning";
      }
      if (
        norm.includes("filed") ||
        norm.includes("register") ||
        norm.includes("completed") ||
        norm.includes("passed") ||
        norm.includes("approved") ||
        norm.includes("paid") ||
        norm.includes("disposed") ||
        norm.includes("close") ||
        norm.includes("serve") ||
        norm.includes("final")
      ) {
        return "success";
      }
      if (
        norm.includes("reject") ||
        norm.includes("fail") ||
        norm.includes("dismiss") ||
        norm.includes("objection") ||
        norm.includes("defect")
      ) {
        return "error";
      }
      return "neutral";
    },
    [],
  );

  const normalizedRole = React.useMemo(() => {
    const r = role ? role.toUpperCase() : "";
    if (r === "CT") return "CT";
    if (r === "AD") return "AD";
    if (r === "CO" || r === "CC") return "CO";
    if (r === "PO") return "PO";
    if (r === "SA") return "SA";
    return r;
  }, [role]);

  const isCourtUser = React.useMemo(() => {
    const rawRole = role ? role.toUpperCase() : "";
    return ["PO", "CO", "CC", "SA", "RI", "RSI"].includes(rawRole || "");
  }, [role]);

  const visibleGroups = React.useMemo(() => {
    const rawGroups = getStepGroups(base);

    const isDraft = caseData && caseData.is_submitted === false;

    const roleGroups = !normalizedRole
      ? rawGroups
      : rawGroups
          .filter((g) =>
            g.roles.some((r) => r.toUpperCase() === normalizedRole),
          )
          .map((g) => ({
            ...g,
            steps: g.steps.filter(
              (s) =>
                !s.roles ||
                s.roles.some((r) => r.toUpperCase() === normalizedRole),
            ),
          }))
          .filter((g) => g.steps.length > 0);

    const roleGroupsWithoutTimeline = roleGroups
      .map((g) => ({
        ...g,
        steps: g.steps.filter((s) => s.label !== "Case Progress"),
      }))
      .filter((g) => g.steps.length > 0);

    const filteredGroups =
      isDraft && !isCourtUser
        ? roleGroupsWithoutTimeline.filter((g) =>
            ["Case Initiation", "Assets", "Finalization"].includes(
              g.groupLabel,
            ),
          )
        : roleGroupsWithoutTimeline;

    return filteredGroups.map((g) => {
      let groupLabelKey = "";
      if (g.groupLabel === "Case Initiation")
        groupLabelKey = "case.groups.initiation";
      else if (g.groupLabel === "Assets") groupLabelKey = "case.groups.assets";
      else if (g.groupLabel === "Finalization")
        groupLabelKey = "case.groups.finalization";
      else if (g.groupLabel === "Fee & Payments" || g.groupLabel === "Payments")
        groupLabelKey = "case.groups.payments";
      else if (g.groupLabel === "Pre Order")
        groupLabelKey = "case.groups.pre_order";
      else if (g.groupLabel === "Post Order")
        groupLabelKey = "case.groups.post_order";

      return {
        ...g,
        groupLabel: groupLabelKey ? t(groupLabelKey) : g.groupLabel,
        steps: g.steps.map((s) => {
          let stepLabelKey = "";
          if (s.label === "Case details") stepLabelKey = "case.details.title";
          else if (s.label === "Party details")
            stepLabelKey = "case.parties.title";
          else if (s.label === "Land details")
            stepLabelKey = "case.lands.title";
          else if (s.label === "Documents")
            stepLabelKey = "case.documents.title";
          else if (s.label === "Fees payment") {
            const isCitizenOrAdvocate =
              normalizedRole === "CT" || normalizedRole === "AD";
            stepLabelKey = isCitizenOrAdvocate
              ? "case.payments.case_transactions_title"
              : "case.payments.title";
          } else if (s.label === "Review & submit") {
            const isSubmitted = caseData?.is_submitted === true;
            stepLabelKey = isSubmitted
              ? "case.review.review_only"
              : "case.review.title";
          } else if (s.label === "Case Progress")
            stepLabelKey = "case.timeline.title";
          else if (s.label === "Issue notice") {
            const isCitizenOrAdvocate =
              normalizedRole === "CT" || normalizedRole === "AD";
            stepLabelKey = isCitizenOrAdvocate
              ? "case.notices.title_citizen"
              : "case.notices.title";
          } else if (s.label === "Serve notice")
            stepLabelKey = "case.serve.title";
          else if (s.label === "Date") stepLabelKey = "case.hearing.title";
          else if (s.label === "Next date / Adjournment")
            stepLabelKey = "case.adjourn.title";
          else if (s.label === "Draft order")
            stepLabelKey = "case.draft_order.title";
          else if (s.label === "Finalize order")
            stepLabelKey = "case.finalize_order.title";
          else if (s.label === "Execution / Compliance")
            stepLabelKey = "case.execution.title";
          else if (s.label === "Case closure")
            stepLabelKey = "case.closure.title";

          return {
            ...s,
            label: stepLabelKey ? t(stepLabelKey) : s.label,
          };
        }),
      };
    });
  }, [base, normalizedRole, t, caseData, isCourtUser]);
  const flatSteps = visibleGroups.flatMap((g) => g.steps);

  const activeIndex = flatSteps.findIndex((s) => s.href === pathname);

  const scrollMenuItemIntoView = React.useCallback(
    (targetEl?: HTMLElement | null) => {
      if (!targetEl) return;
      targetEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    },
    [],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const activeEl = document.querySelector<HTMLElement>(
        "[data-sidebar='menu-button'][aria-current='page'], [data-sidebar='menu-button'].bg-white, [data-sidebar='menu-button'][data-active='true']",
      );
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <TooltipProvider>
      <Sidebar
        collapsible="offcanvas"
        className="border-r border-blue-200 dark:border-blue-900 bg-gradient-to-b from-[#dbeafe] via-[#f0f9ff] to-[#dbeafe] dark:from-slate-900 dark:via-blue-950 dark:to-slate-950 text-slate-800 dark:text-slate-100 [&_[data-sidebar=sidebar]]:bg-transparent"
      >
        <SidebarHeader className="h-14 px-4 flex flex-row items-center justify-between border-b border-blue-200 dark:border-blue-900 shrink-0 bg-[#dbeafe] dark:bg-slate-900">
          <Link
            href="/"
            className="flex items-center gap-3 hover:opacity-90 transition-opacity flex-grow truncate"
          >
            <span className="rounded-lg bg-white p-1 shadow-xs border border-blue-200 shrink-0">
              <Image src="/logo.png" alt="Logo" width={28} height={28} />
            </span>
            {state !== "collapsed" && (
              <div className="flex flex-col items-start truncate">
                <span className="text-sm leading-tight text-slate-900 dark:text-white truncate w-full font-bold">
                  {t("brand.case_title") || "e-Filing"}
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5 truncate w-full font-medium">
                  {t("brand.case_subtitle") || "Board of Revenue, Uttarakhand"}
                </span>
              </div>
            )}
          </Link>
          {state !== "collapsed" && caseNumber && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  size="icon"
                  className="w-9 h-9 rounded-lg flex items-center justify-center border border-blue-200 dark:border-blue-900 bg-white dark:bg-blue-950 hover:bg-blue-50 dark:hover:bg-blue-900 text-slate-700 dark:text-blue-200 shrink-0 transition-all cursor-pointer ml-2 shadow-none"
                  title={t("case.sidebar.case_info") || "Case Details"}
                >
                  <Info className="w-4 h-4 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-[270px] p-3.5 rounded-2xl border border-blue-200 dark:border-blue-900 ring-0 shadow-lg bg-[#f0f7ff] dark:bg-slate-900 text-popover-foreground z-[100]"
              >
                <div className="space-y-3.5 text-left">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                      {t("case.sidebar.case_number")}
                    </div>
                    <div className="text-xs font-bold mt-1 text-slate-900 dark:text-white leading-none">
                      {caseNumber}
                    </div>
                  </div>
                  {stageName && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                        {t("case.sidebar.case_stage")}
                      </div>
                      <div className="mt-1.5 leading-none">
                        <StatusBadge
                          variant={getStageBadgeVariant(
                            caseData?.current_stage_detail?.code,
                          )}
                        >
                          <span className="text-xs font-semibold text-foreground leading-none">
                            {stageName}
                          </span>
                        </StatusBadge>
                      </div>
                    </div>
                  )}
                  {statusName && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                        {t("case.sidebar.case_status")}
                      </div>
                      <div className="mt-1.5 leading-none">
                        <StatusBadge
                          variant={getStatusBadgeVariant(
                            caseData?.current_status_detail,
                          )}
                        >
                          <span className="text-xs font-semibold text-foreground leading-none">
                            {statusName}
                          </span>
                        </StatusBadge>
                      </div>
                    </div>
                  )}
                  {lastUpdatedStr && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-none">
                        {t("case.sidebar.last_update")}
                      </div>
                      <div className="text-xs font-bold mt-1 text-slate-900 dark:text-white leading-none">
                        {lastUpdatedStr}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </SidebarHeader>

        {state !== "collapsed" && caseNumber && (
          <div className="sticky top-14 z-20 bg-[#dbeafe] dark:bg-neutral-950 px-3 py-2 border-b border-blue-200 dark:border-blue-900 shrink-0">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  router.push(`${base}/timeline`);
                  scrollMenuItemIntoView(e.currentTarget);
                }}
                className={cn(
                  "flex-1 h-8 px-2 text-xs font-medium bg-white/50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-blue-900 hover:text-slate-900 flex items-center justify-center gap-1 rounded-lg transition-all shadow-none shrink-0",
                  pathname === `${base}/timeline` &&
                    "bg-[#dbedff]! text-slate-900! font-bold border border-blue-300/60! shadow-xs! dark:bg-blue-900/80! dark:text-white!",
                )}
              >
                <History className="w-3.5 h-3.5" />
                <span className="truncate">{t("case.sidebar.timeline")}</span>
              </Button>

              {isCourtUser && caseData?.is_submitted === true && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalOpen(true)}
                  className="flex-1 h-8 px-2 text-xs font-medium bg-white/50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-blue-900 hover:text-slate-900 flex items-center justify-center gap-1 rounded-lg transition-all shadow-none shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="truncate">{t("case.sidebar.status")}</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  router.push(`${base}/payments`);
                  scrollMenuItemIntoView(e.currentTarget);
                }}
                className={cn(
                  "flex-1 h-8 px-2 text-xs font-medium bg-white/50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-800/60 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-blue-900 hover:text-slate-900 flex items-center justify-center gap-1 rounded-lg transition-all shadow-none shrink-0",
                  pathname === `${base}/payments` &&
                    "bg-[#dbedff]! text-slate-900! font-bold border border-blue-300/60! shadow-xs! dark:bg-blue-900/80! dark:text-white!",
                )}
              >
                <IndianRupee className="w-3.5 h-3.5" />
                <span className="truncate">{t("case.sidebar.fees")}</span>
              </Button>
            </div>
          </div>
        )}

        <SidebarContent className="p-3 gap-1.5 bg-transparent">
          {visibleGroups.map((group) => (
            <SidebarGroup key={group.groupLabel} className="p-0">
              <SidebarGroupLabel className="px-3 mb-1 text-[11px] font-semibold capitalize tracking-wider text-blue-900/80 dark:text-blue-300">
                {group.groupLabel}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.steps.map((step) => {
                    const isActive = pathname === step.href;
                    const Icon = step.icon;

                    return (
                      <SidebarMenuItem key={step.href}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={(e) => {
                            router.push(step.href);
                            scrollMenuItemIntoView(e.currentTarget);
                          }}
                          tooltip={step.label}
                          className={cn(
                            "h-9 px-3 rounded-lg transition-all duration-150 group/item shadow-none ring-0 border border-transparent text-[13px] sm:text-sm text-slate-600 dark:text-slate-400 font-medium hover:bg-white/60 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white",
                            isActive &&
                              "bg-[#dbedff]! text-slate-900! font-bold border border-blue-300/60! shadow-xs! dark:bg-blue-900/60! dark:text-white! hover:bg-[#dbedff]! dark:hover:bg-blue-900/60!",
                          )}
                        >
                          <Icon
                            className={cn(
                              "shrink-0 w-4 h-4 text-slate-400 dark:text-slate-500 transition-colors group-hover/item:text-slate-900 dark:group-hover/item:text-white",
                              isActive && "text-slate-800! dark:text-white!",
                            )}
                          />
                          <span className="truncate flex-1">{step.label}</span>
                          {isActive && (
                            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-800! dark:text-white! ml-auto" />
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter
          className={cn(
            "px-3 flex border-t border-blue-200 dark:border-blue-900 bg-[#dbeafe] dark:bg-slate-900 shrink-0",
            state === "collapsed"
              ? "h-24 flex-col justify-center items-center gap-2"
              : "h-14 flex-row items-center gap-1.5",
          )}
        >
          <Button
            variant="ghost"
            type="button"
            className={cn(
              "rounded-lg flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-900 bg-white dark:bg-blue-950 hover:bg-red-50 hover:border-red-200 text-sm font-medium transition-all text-slate-700 dark:text-blue-200 hover:text-red-600",
              state === "collapsed" ? "w-9 h-9 px-0" : "flex-1 h-9",
            )}
            onClick={() => setShowExitConfirm(true)}
            title={
              state === "collapsed" ? t("case.details.exit_btn") : undefined
            }
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {state !== "collapsed" && <span>{t("case.details.exit_btn")}</span>}
          </Button>
          <PreferencesButton
            user={user}
            isCollapsed={state === "collapsed"}
            align={state === "collapsed" ? "center" : "end"}
            side="top"
          />
        </SidebarFooter>
      </Sidebar>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="max-w-md rounded-2xl border border-blue-200 dark:border-blue-900 bg-[#f0f7ff] dark:bg-slate-900 text-popover-foreground shadow-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="sr-only">Exit</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("case.details.exit_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 font-semibold rounded-xl">
              {t("case.details.exit_cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl"
              onClick={() => {
                if (typeof window !== "undefined") {
                  try {
                    if (window.opener && !window.opener.closed) {
                      window.opener.focus();
                      window.close();
                      return;
                    }
                  } catch (e) {
                    console.error("Failed to focus parent window/tab", e);
                  }


                  const defaultPath =
                    normalizedRole === "CT"
                      ? "/citizen"
                      : "/manage/settings/court";
                  router.push(defaultPath);
                }
              }}
            >
              {t("case.details.exit_confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {caseNumber && (
        <StatusUpdateModal
          open={statusModalOpen}
          onOpenChange={setStatusModalOpen}
          caseId={caseNumber}
        />
      )}
    </TooltipProvider>
  );
}
