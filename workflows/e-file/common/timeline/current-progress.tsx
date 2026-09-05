"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useCaseDetail, useCaseTimeline, getLabel } from "@/lib";
import { useTranslation } from "@/i18n";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import TimelineSheet from "./timeline-sheet";

export function CurrentProgress() {
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = caseId as string;
  const { t, lang } = useTranslation();
  const detailQuery = useCaseDetail(caseNumber);
  const timelineQuery = useCaseTimeline(caseNumber);
  const caseDetail = detailQuery.data?.result?.data;
  const rawEvents: any[] = timelineQuery.data?.result?.data || [];

  const currentStage = caseDetail?.current_stage_detail
    ? getLabel(caseDetail.current_stage_detail, lang)
    : caseDetail?.current_stage_detail?.name_en || "—";
  const currentStatus = caseDetail?.current_status_detail
    ? getLabel(caseDetail.current_status_detail, lang)
    : caseDetail?.current_status_detail?.name_en || "—";
  const latestRemark =
    (rawEvents[0] as any)?.description ||
    (rawEvents[0] as any)?.title ||
    (caseDetail as any)?.remarks ||
    "—";

  const [timelineOpen, setTimelineOpen] = useState(false);

  const isLoading = detailQuery.isLoading || timelineQuery.isLoading;
  if (isLoading) {
    return (
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
          {t("case.timeline.current_progress") ?? "Current Progress"}
        </div>
        <div className="p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-16 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
          </div>
          <div className="h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
          {t("case.timeline.current_progress") ?? "Current Progress"}
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Stage</p>
              <StatusBadge variant="info">{currentStage}</StatusBadge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Status
              </p>
              <StatusBadge
                variant={
                  String(currentStatus).toLowerCase().includes("pending")
                    ? "warning"
                    : String(currentStatus).toLowerCase().includes("approv") ||
                        String(currentStatus).toLowerCase().includes("success")
                      ? "success"
                      : String(currentStatus).toLowerCase().includes("reject")
                        ? "error"
                        : "neutral"
                }
              >
                {currentStatus}
              </StatusBadge>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("case.timeline.remark") ??
                t("case.efile.subheader.remark") ??
                "Remark"}
            </p>
            <p className="text-sm font-medium text-foreground wrap-break-word whitespace-pre-wrap">
              {latestRemark && String(latestRemark).trim()
                ? String(latestRemark)
                : "—"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTimelineOpen(true)}
            className="h-8 px-3 text-xs font-medium gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            {t("case.timeline.title") ?? "Case Progress"}
          </Button>
        </div>
      </section>
      <TimelineSheet open={timelineOpen} onOpenChange={setTimelineOpen} />
    </>
  );
}

export default CurrentProgress;
