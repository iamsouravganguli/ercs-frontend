"use client";

import { useParams } from "next/navigation";
import { useCaseDetail, useCaseTimeline } from "@/lib";
import { useTranslation } from "@/i18n";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

function formatDaysAgo(dateStr?: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const days = differenceInDays(new Date(), d);
  if (days === 0) {
    const hrs = differenceInHours(new Date(), d);
    if (hrs === 0) return "Just now";
    return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  }
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function PendencyAlert() {
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = caseId as string;
  const { t } = useTranslation();
  const detailQuery = useCaseDetail(caseNumber);
  const timelineQuery = useCaseTimeline(caseNumber);

  const caseDetail: any = detailQuery.data?.result?.data;
  const rawEvents: any[] = timelineQuery.data?.result?.data || [];

  const initiatedAt = caseDetail?.created_at || rawEvents[0]?.date || null;
  const lastEvent = [...rawEvents].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )[0];
  const lastActivityAt =
    lastEvent?.date || caseDetail?.updated_at || initiatedAt;

  const initiatedDays = initiatedAt
    ? differenceInDays(new Date(), new Date(initiatedAt))
    : null;
  const lastActivityDays = lastActivityAt
    ? differenceInDays(new Date(), new Date(lastActivityAt))
    : null;
  const isLoading = detailQuery.isLoading || timelineQuery.isLoading;

  const urgency: "normal" | "warning" | "critical" =
    initiatedDays !== null && initiatedDays > 30
      ? "critical"
      : initiatedDays !== null && initiatedDays > 14
        ? "warning"
        : lastActivityDays !== null && lastActivityDays > 14
          ? "warning"
          : "normal";
  const urgencyTone =
    urgency === "critical"
      ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300"
      : urgency === "warning"
        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
        : "bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300";

  if (isLoading) {
    return (
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse">
        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 h-10" />
        <div className="p-6 grid md:grid-cols-2 gap-4">
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
        {t("case.timeline.pendency_alert") ?? "Pendency Alert"}
      </div>

      <div className="p-5">
        {urgency !== "normal" &&
        initiatedDays !== null &&
        lastActivityDays !== null ? (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 flex gap-3",
              urgency === "critical"
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40",
            )}
          >
            <AlertTriangle
              className={cn(
                "w-4 h-4 shrink-0 mt-0.5",
                urgency === "critical"
                  ? "text-red-600 dark:text-red-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            />
            <div className="space-y-1.5">
              <p
                className={cn(
                  "text-sm font-medium leading-snug",
                  urgency === "critical"
                    ? "text-red-800 dark:text-red-300"
                    : "text-amber-800 dark:text-amber-300",
                )}
              >
                {urgency === "critical"
                  ? `माननीय न्यायालय के समक्ष प्रस्तुत वाद संख्या ${caseDetail?.case_number || ""} को ${initiatedDays} दिवस व्यतीत हो चुके हैं। अंतिम न्यायिक कार्यवाही ${lastActivityDays} दिवस पूर्व संपन्न हुई थी।`
                  : `वाद संख्या ${caseDetail?.case_number || ""} को प्रस्तुत हुए ${initiatedDays} दिवस व्यतीत, अंतिम कार्यवाही ${lastActivityDays} दिवस पूर्व।`}
              </p>
              <p
                className={cn(
                  "text-xs leading-relaxed font-normal",
                  urgency === "critical"
                    ? "text-red-700/80 dark:text-red-300/80"
                    : "text-amber-700/80 dark:text-amber-300/80",
                )}
              >
                {urgency === "critical"
                  ? "राजस्व परिषद के निर्देशानुसार लंबित वादों का शीघ्र निस्तारण अपेक्षित है। कृपया नियत तिथि पर सुनवाई/आदेश हेतु अग्रिम कार्यवाही सुनिश्चित करें।"
                  : "नियमानुसार शीघ्र निस्तारण हेतु अग्रिम तिथि पर आवश्यक कार्यवाही अपेक्षित है।"}
              </p>
              <p
                className={cn(
                  "text-xs",
                  urgency === "critical"
                    ? "text-red-600/60 dark:text-red-400/60"
                    : "text-amber-600/60 dark:text-amber-400/60",
                )}
              >
                {initiatedAt
                  ? `प्रस्तुति: ${format(new Date(initiatedAt), "dd MMM yyyy")}`
                  : ""}{" "}
                {lastActivityAt
                  ? `• अंतिम कार्यवाही: ${format(new Date(lastActivityAt), "dd MMM yyyy")}`
                  : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40 px-4 py-3 flex gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500 dark:text-zinc-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                वाद नियमानुसार प्रगति पर है
              </p>
              <p className="text-xs font-normal text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {initiatedAt
                  ? `प्रस्तुति ${format(new Date(initiatedAt), "dd MMM yyyy")} • `
                  : ""}
                {initiatedDays !== null
                  ? `${initiatedDays} दिवस व्यतीत • `
                  : ""}
                {lastActivityDays !== null
                  ? `अंतिम कार्यवाही ${formatDaysAgo(lastActivityAt)}`
                  : "क्रमिक प्रगति"}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PendencyAlert;
