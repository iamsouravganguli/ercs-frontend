"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { FileText, Copy, Check, History, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import toast from "react-hot-toast";
import { CustomManageTabs } from "./components/custom-manage-tabs";
import { useCaseDetail, useProfileDetail, getLabel, resolveCaseRoute, isCitizenAdvocate as isCitizenAdvocateRole } from '@/lib/query';
import { StatusUpdateModal } from "@/workflows/e-file/common/status-update/status-update-modal";
import { TimelineSheet } from "@/workflows/e-file/common/timeline/timeline-sheet";
import { CustomSheet } from "@/workflows/e-file/common/timeline/custom-sheet";

export default function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const caseDetail = useCaseDetail(caseId as string);
  const { data: profileData } = useProfileDetail();
  const userRole =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    (profileData as any)?.data?.user?.role ||
    "";
  const isCitizenAdvocate = isCitizenAdvocateRole(userRole);
  const detail: any = caseDetail.data?.result?.data;
  const stageCode =
    detail?.current_stage_detail?.code ||
    detail?.current_stage?.code ||
    "";
  const statusCode =
    detail?.current_status_detail?.code ||
    detail?.current_status?.code ||
    "";
  const shouldGoToManageForCitizen =
    resolveCaseRoute(userRole, stageCode, statusCode) === "manage" &&
    isCitizenAdvocateRole(userRole);

  const stageLabel = detail?.current_stage_detail
    ? getLabel(detail.current_stage_detail, lang as any)
    : detail?.current_stage_detail?.name_en || detail?.current_stage || "—";
  const statusLabel = detail?.current_status_detail
    ? getLabel(detail.current_status_detail, lang as any)
    : detail?.current_status_detail?.name_en || detail?.current_status || "—";
  const statusLower = String(statusLabel).toLowerCase();
  const statusVariant: "warning" | "success" | "error" | "neutral" | "info" =
    statusLower.includes("pending")
      ? "warning"
      : statusLower.includes("approv") || statusLower.includes("success")
        ? "success"
        : statusLower.includes("reject")
          ? "error"
          : "neutral";

  useEffect(() => {
    if (
      !caseDetail.isLoading &&
      !shouldGoToManageForCitizen &&
      isCitizenAdvocate
    ) {
      router.replace(`/case/e-file/${caseId}`);
    }
  }, [
    caseDetail.isLoading,
    shouldGoToManageForCitizen,
    isCitizenAdvocate,
    caseId,
    router,
  ]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(caseId));
    setCopied(true);
    toast.success("Case number copied");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {}
      <header className="shrink-0 h-14 bg-primary border-b border-primary/20 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-base font-semibold text-primary-foreground">
              <FileText className="h-6 w-6" /> Manage e-File{" "}
              <span className="text-sm font-medium text-primary-foreground/80">
                ({String(caseId)})
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-0.5 h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/15 text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label="Copy case number"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </span>
            <span className="sm:hidden inline-flex items-center gap-1 text-base font-semibold text-primary-foreground">
              <FileText className="h-6 w-6" /> Manage e-File{" "}
              <span className="text-[11px] font-medium text-primary-foreground/80 break-all">
                ({String(caseId)})
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-white/15 text-primary-foreground/80"
                aria-label="Copy case number"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/manage/cases")}
              className="inline-flex h-8 px-3 text-xs sm:h-9 sm:px-4 bg-white text-primary border-white hover:bg-zinc-100 hover:text-primary dark:bg-white dark:text-primary dark:border-white dark:hover:bg-zinc-100"
            >
              {t("case.details.exit_btn")}
            </Button>
          </div>
        </div>
      </header>

      <div
        id="manage-scroll"
        className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950"
      >
        <div className="sticky top-0 z-20 bg-zinc-50 dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <CustomManageTabs />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          {children}
        </div>
      </div>

      {}
      <footer className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 z-20">
        {}
        <div className="hidden sm:flex max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {t("case.efile.subheader.stage" as any) ?? "Stage"}
              </span>
              <StatusBadge variant="info" className="max-w-[110px] sm:max-w-none truncate">
                {stageLabel}
              </StatusBadge>
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                {t("case.efile.subheader.status" as any) ?? "Status"}
              </span>
              <StatusBadge variant={statusVariant} className="max-w-[110px] sm:max-w-none truncate">
                {statusLabel}
              </StatusBadge>
            </div>
          </div>
          <div className="inline-flex items-center rounded-lg overflow-hidden border border-primary/20 dark:border-zinc-700 shrink-0 shadow-sm">
            <Button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className="h-9 px-5 sm:px-6 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-none font-medium"
            >
              {(t("case.sidebar.status" as any) as string) ===
              "case.sidebar.status"
                ? lang === "hi"
                  ? "अपडेट"
                  : "Update"
                : (t("case.sidebar.status" as any) as string)}
            </Button>
            <button
              type="button"
              onClick={() => setTimelineOpen(true)}
              className="h-9 w-9 inline-flex items-center justify-center bg-white dark:bg-zinc-900 text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 shrink-0"
              aria-label="Case Progress"
              title={t("case.timeline.title") ?? "Case Progress"}
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>
        {}
        <div className="flex sm:hidden px-3 py-2.5">
          <div className="flex w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm">
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="w-11 shrink-0 h-10 inline-flex items-center justify-center bg-white dark:bg-zinc-900 text-muted-foreground hover:text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700"
              aria-label="Case info"
              title={`${stageLabel} • ${statusLabel}`}
            >
              <Info className="h-4 w-4" />
            </button>
            <Button
              type="button"
              onClick={() => setStatusModalOpen(true)}
              className="flex-1 min-w-0 h-10 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-none font-semibold text-sm"
            >
              {(t("case.sidebar.status" as any) as string) ===
              "case.sidebar.status"
                ? lang === "hi"
                  ? "अपडेट"
                  : "Update"
                : (t("case.sidebar.status" as any) as string)}
            </Button>
            <button
              type="button"
              onClick={() => setTimelineOpen(true)}
              className="w-11 shrink-0 h-10 inline-flex items-center justify-center bg-white dark:bg-zinc-900 text-primary hover:bg-zinc-50 dark:hover:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700"
              aria-label="Case Progress"
              title={t("case.timeline.title") ?? "Case Progress"}
            >
              <History className="h-4 w-4" />
            </button>
          </div>
        </div>
      </footer>

      {}
      <CustomSheet open={infoOpen} onOpenChange={setInfoOpen}>
        <div className="sticky top-0 z-10 flex items-center h-14 px-6 border-b bg-card shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("case.sidebar.case_info") ?? "Case Info"}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <p className="text-xs font-medium text-muted-foreground">
                {t("case.sidebar.case_number") ?? "Case Number"}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-semibold break-all">{String(caseId)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("case.efile.subheader.stage" as any) ?? "Stage"}
              </p>
              <StatusBadge variant="info" className="max-w-full truncate">
                {stageLabel}
              </StatusBadge>
            </div>
            <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {t("case.efile.subheader.status" as any) ?? "Status"}
              </p>
              <StatusBadge variant={statusVariant} className="max-w-full truncate">
                {statusLabel}
              </StatusBadge>
            </div>
          </div>
          {(() => {
            const remark =
              (detail as any)?.remarks ||
              (detail?.current_status_detail as any)?.name ||
              "";
            if (!remark) return null;
            return (
              <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("case.timeline.remark") ?? t("case.efile.subheader.remark" as any) ?? "Remark"}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{String(remark)}</p>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="flex items-center justify-end border-t bg-card px-6 py-3 z-10 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setInfoOpen(false)}
            className="px-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {t("common_button.close.label") ?? "Close"}
          </Button>
        </div>
      </CustomSheet>

      <TimelineSheet open={timelineOpen} onOpenChange={setTimelineOpen} />
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        caseId={String(caseId)}
        onSuccess={() => caseDetail.refetch()}
      />
    </div>
  );
}
