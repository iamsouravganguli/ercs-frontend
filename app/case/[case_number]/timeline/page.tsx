"use client";

import { useParams, useRouter } from "next/navigation";
import { useCaseTimeline, useCaseDetail, useSessionCheck, useCasePartyList, useCaseLandList } from '@/lib/query';
import { useEffect, useState } from "react";
import { StatusUpdateModal } from "@/workflows/e-file/common/status-update/status-update-modal";
import {
  Calendar,
  Gavel,
  FilePlus,
  Clock,
  Video,
  Info,
  ExternalLink,
  History,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/i18n";
import { format } from "date-fns";
import { cn } from "@/lib/cn";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EVENT_CONFIG = {
  REGISTRATION: {
    icon: FilePlus,
    color: "bg-blue-500",
    textColor: "text-blue-500",
    bgLight: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  STAGE_CHANGE: {
    icon: Clock,
    color: "bg-amber-500",
    textColor: "text-amber-500",
    bgLight: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  HEARING: {
    icon: Calendar,
    color: "bg-purple-500",
    textColor: "text-purple-500",
    bgLight: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  ORDER: {
    icon: Gavel,
    color: "bg-emerald-500",
    textColor: "text-emerald-500",
    bgLight: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  VC: {
    icon: Video,
    color: "bg-rose-500",
    textColor: "text-rose-500",
    bgLight: "bg-rose-50",
    borderColor: "border-rose-200",
  },
};

function getGroupedEvents(rawEvents: any[]): any[] {
  if (!rawEvents || rawEvents.length === 0) return [];

  const groups: { [key: string]: any[] } = {};

  const sortedRaw = [...rawEvents].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    return timeA - timeB;
  });

  sortedRaw.forEach((event) => {
    try {
      const dateStr = format(new Date(event.date), "yyyy-MM-dd");
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(event);
    } catch (e) {
      const dateStr = "unknown";
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(event);
    }
  });

  const groupedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "unknown") return 1;
    if (b === "unknown") return -1;
    return a.localeCompare(b);
  });

  return groupedKeys.map((dateStr) => {
    const subEvents = groups[dateStr];

    subEvents.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeA - timeB;
    });

    const baseEvent = subEvents[0];
    const lastEvent = subEvents[subEvents.length - 1];

    const stageFlow = subEvents
      .map((e) => {
        const titleText = e.title || "";
        if (titleText.startsWith("Stage transitioned to ")) {
          return titleText.replace("Stage transitioned to ", "");
        }
        return titleText;
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);

    const combinedTitle = stageFlow.join(" → ");

    const combinedDescription = subEvents
      .map((e) => {
        const desc = e.description || "";
        if (
          desc.startsWith("Case stage changed from") ||
          desc.startsWith("Case draft initiated")
        ) {
          return "";
        }
        return desc;
      })
      .filter(Boolean)
      .join("\n\n");

    let eventType = lastEvent.type || baseEvent.type || "STAGE_CHANGE";
    const priority = ["ORDER", "VC", "HEARING", "STAGE_CHANGE", "REGISTRATION"];
    for (const pType of priority) {
      if (subEvents.some((e) => e.type === pType)) {
        eventType = pType;
        break;
      }
    }

    const mergedMeta = { ...baseEvent.meta, ...lastEvent.meta };

    const linkEvent = subEvents.find((e) => e.meta?.link);
    if (linkEvent?.meta?.link) {
      mergedMeta.link = linkEvent.meta.link;
    }

    const authorizers = Array.from(
      new Set(subEvents.map((e) => e.meta?.created_by).filter(Boolean)),
    );
    if (authorizers.length > 0) {
      mergedMeta.created_by = authorizers.join(", ");
    }

    const stageEvent = [...subEvents].reverse().find((e) => e.meta?.stage);
    if (stageEvent?.meta?.stage) {
      mergedMeta.stage = stageEvent.meta.stage;
    }

    return {
      ...baseEvent,
      date: lastEvent.date || baseEvent.date,
      type: eventType,
      title: combinedTitle,
      description: combinedDescription,
      meta: mergedMeta,
    };
  });
}

export default function CaseTimelinePage() {
  const router = useRouter();
  const { case_number } = useParams();
  const caseNumberStr = case_number as string;


  const timelineQuery = useCaseTimeline(caseNumberStr);
  const rawEvents = timelineQuery.data?.result?.data || [];
  const events = getGroupedEvents(rawEvents);


  const caseDetailQuery = useCaseDetail(caseNumberStr);
  const caseDetail = caseDetailQuery.data?.result?.data;


  const partyListQuery = useCasePartyList(caseNumberStr);
  const landListQuery = useCaseLandList(caseNumberStr);

  const { t, lang } = useTranslation();

  const handlePrintOrderSheet = () => {
    const tehsilName = caseDetail?.tehsil_name || "—";
    const districtName = caseDetail?.district_name || "—";


    const villages =
      Array.from(
        new Set(
          (landListQuery.data?.result?.data || [])
            .map((l: any) => l.village_name)
            .filter(Boolean),
        ),
      ).join(", ") || "—";


    const allParties = partyListQuery.data?.result?.data || [];
    const plaintiffsList =
      allParties
        .filter(
          (p: any) =>
            p.party_type_detail?.code?.includes("PLAINTIFF") ||
            p.party_type_detail?.code?.includes("APPELLANT") ||
            p.party_type_detail?.code?.includes("PETITIONER"),
        )
        .map((p: any) => p.full_name)
        .join(", ") || "—";

    const defendantsList =
      allParties
        .filter(
          (p: any) =>
            p.party_type_detail?.code?.includes("DEFENDANT") ||
            p.party_type_detail?.code?.includes("RESPONDENT") ||
            p.party_type_detail?.code?.includes("OPPOSITE"),
        )
        .map((p: any) => p.full_name)
        .join(", ") || "—";

    const actName = caseDetail?.act?.name_en || caseDetail?.act?.name || "—";
    const sectionName =
      caseDetail?.section?.name_en || caseDetail?.section?.name || "—";
    const caseNum = caseDetail?.case_number || "—";
    const caseYear = caseDetail?.created_at
      ? new Date(caseDetail.created_at).getFullYear()
      : "2026";

    const allowedPrintStages = [
      "REGISTRATION",
      "NOTICE",
      "REPLY",
      "EVIDENCE",
      "HEARING",
      "ORDER",
      "EXECUTION",
      "APPEAL",
      "CLOSED",
    ];


    const printableRawEvents = rawEvents.filter((event: any) => {
      const stageCode = event.meta?.stage;
      const desc = event.description || "";
      if (
        desc.startsWith("Case stage changed from") ||
        desc.startsWith("Case draft initiated") ||
        !desc.trim()
      ) {
        return false;
      }
      return stageCode && allowedPrintStages.includes(stageCode);
    });


    const printableEvents = getGroupedEvents(printableRawEvents);


    const sortedEvents = [...printableEvents].sort(
      (a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const tableRowsHtml = sortedEvents
      .map((event: any, idx: number) => {
        const eventDate = format(new Date(event.date), "dd.MM.yyyy");
        const desc = (event.description || "").replace(/\n/g, "<br>");
        const createdBy = event.meta?.created_by
          ? `<div style="text-align: right; margin-top: 15px; font-style: italic;">ह० ${event.meta.created_by}</div>`
          : "";

        return `
        <tr>
          <td style="text-align: center; font-weight: bold; width: 80px; padding: 10px; border: 1px solid black;">
            ${idx + 1}
          </td>
          <td style="text-align: center; width: 120px; padding: 10px; border: 1px solid black; font-family: monospace;">
            ${eventDate}
          </td>
          <td style="padding: 10px; border: 1px solid black; line-height: 1.5;">
            ${desc}
            ${createdBy}
          </td>
        </tr>
      `;
      })
      .join("");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>आदेश-प्रपत्र (फर्द अहकाम) - ${caseNum}</title>
        <style>
          body {
            font-family: 'Nirmala UI', 'Mangal', 'Arial', sans-serif;
            margin: 40px;
            color: black;
            background-color: white;
            text-align: left;
          }
          .header-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-decoration: underline;
          }
          .meta-info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .meta-info-table td {
            padding: 8px;
            border: 1px solid black;
            font-size: 14px;
          }
          .order-table {
            width: 100%;
            border-collapse: collapse;
          }
          .order-table th {
            border: 1px solid black;
            padding: 10px;
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 14px;
          }
          .order-table td {
            font-size: 14px;
          }
          @media print {
            body {
              margin: 20px;
            }
            th {
              background-color: #f2f2f2 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header-title">आदेश-प्रपत्र (फर्द अहकाम)</div>

        <table class="meta-info-table">
          <tr>
            <td colspan="3">
              <strong>वाद संख्या:</strong> ${caseNum} &nbsp;|&nbsp;
              <strong>वर्ष:</strong> ${caseYear} &nbsp;|&nbsp;
              <strong>ग्राम:</strong> ${villages} &nbsp;|&nbsp;
              <strong>तहसील:</strong> ${tehsilName} &nbsp;|&nbsp;
              <strong>जिला:</strong> ${districtName}
            </td>
          </tr>
          <tr>
            <td colspan="3">
              <strong>वादी:</strong> ${plaintiffsList} &nbsp;<strong>बनाम</strong>&nbsp; <strong>प्रतिवादी:</strong> ${defendantsList}
            </td>
          </tr>
          <tr>
            <td colspan="3">
              <strong>अधिनियम:</strong> ${actName} &nbsp;|&nbsp;
              <strong>धारा:</strong> ${sectionName}
            </td>
          </tr>
        </table>

        <table class="order-table">
          <thead>
            <tr>
              <th style="width: 80px;">आदेश संख्या</th>
              <th style="width: 120px;">आदेश का दिनांक</th>
              <th>आदेश (विवरण)</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || `<tr><td colspan="3" style="text-align: center; padding: 20px; border: 1px solid black;">कोई आदेश उपलब्ध नहीं है।</td></tr>`}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      alert(
        "Popup blocker is active. Please enable popups to print the order sheet.",
      );
    }
  };


  const sessionCheck = useSessionCheck();
  const role = sessionCheck.data?.result?.data?.role?.toUpperCase();
  const isCourtUser = ["PO", "CO", "CC", "SA", "RI", "RSI"].includes(
    role || "",
  );

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  if (timelineQuery.isLoading || caseDetailQuery.isLoading) {
    return (
      <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0 animate-pulse" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 animate-pulse" />
              <Skeleton className="h-4 w-64 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl animate-pulse" />
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
              <Skeleton className="h-5 w-48 animate-pulse" />
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0 animate-pulse" />
                  <div className="flex-1 space-y-2 pt-2">
                    <Skeleton className="h-4 w-1/4 animate-pulse" />
                    <Skeleton className="h-16 w-full animate-pulse" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStageName =
    caseDetail?.current_stage_detail?.name_en ||
    caseDetail?.current_stage_detail?.name ||
    "Registration";

  const currentStatusName =
    caseDetail?.current_status_detail?.name_en ||
    caseDetail?.current_status_detail?.name ||
    "Pending";

  const handleNext = () => {
    router.push("/manage/settings/court");
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="flex items-center justify-between">
          <div className="text-left">
            <h1 className="text-lg font-bold tracking-tight">Case Progress</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Track the chronological progression and backend-audited history of
              Case #{caseNumberStr}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrintOrderSheet}
              type="button"
              variant="outline"
              className="px-4 py-2 font-bold text-xs rounded-xl"
              disabled={partyListQuery.isLoading || landListQuery.isLoading}
            >
              {partyListQuery.isLoading || landListQuery.isLoading
                ? "Loading..."
                : "Print Order Sheet (फर्द अहकाम)"}
            </Button>
            {isCourtUser && (
              <Button
                onClick={() => setStatusModalOpen(true)}
                type="button"
                className="px-4 py-2 font-bold text-xs rounded-xl"
              >
                Update Case Stage / Status
              </Button>
            )}
          </div>
        </div>

        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Audited Actions
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground leading-none">
                {rawEvents.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Current Case Stage
              </p>
              <p className="text-lg font-bold mt-1 text-foreground leading-none truncate">
                {currentStageName}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Filing Status
              </p>
              <p className="text-lg font-bold mt-1 text-foreground leading-none truncate">
                {currentStatusName}
              </p>
            </div>
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden shadow-sm">
          <CardHeader className="px-6 py-4 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <div className="flex items-center gap-2 text-left">
              <History className="w-4 h-4 text-primary shrink-0" />
              <CardTitle className="text-sm font-semibold">
                Filing & Proceedings Event Ledger
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6 text-left bg-background relative">
            {events.length === 0 ? (
              <div className="py-20 text-center space-y-4 border border-dashed rounded-2xl m-2">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Info className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    No case progress events have been logged yet.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Events will appear here chronologically as your case moves
                    through court stages.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-12 pr-2 py-2">
                {}
                <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-muted" />

                <div className="space-y-8">
                  {events.map((event: any, index: number) => {
                    const config =
                      EVENT_CONFIG[event.type as keyof typeof EVENT_CONFIG] ||
                      EVENT_CONFIG.STAGE_CHANGE;
                    const Icon = config.icon;
                    const eventDate = new Date(event.date);

                    return (
                      <div
                        key={index}
                        className="relative flex flex-col md:flex-row md:items-start gap-4 group"
                      >
                        {}
                        <div
                          className={cn(
                            "absolute -left-[32px] top-0.5 z-10 w-6 h-6 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-110",
                            config.color,
                            "ring-4 ring-background",
                          )}
                        >
                          <Icon className="w-3.5 h-3.5 text-white" />
                        </div>

                        {}
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border",
                                  config.bgLight,
                                  config.textColor,
                                  config.borderColor,
                                )}
                              >
                                {event.type.replace("_", " ")}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {format(eventDate, "hh:mm a")}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted/40 border px-2 py-0.5 rounded-md self-start sm:self-auto shrink-0">
                              {format(eventDate, "MMMM dd, yyyy")}
                            </span>
                          </div>

                          <div
                            className={cn(
                              "p-4 rounded-xl border bg-card shadow-none transition-all duration-200 hover:shadow-sm",
                              config.borderColor,
                            )}
                          >
                            <h3 className="text-xs font-bold text-foreground mb-1 leading-tight flex items-center gap-2">
                              {event.title}
                            </h3>
                            {event.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                {event.description}
                              </p>
                            )}

                            {}
                            {event.meta && (
                              <div className="mt-3 pt-3 border-t border-muted flex flex-wrap items-center gap-3">
                                {event.type === "VC" && event.meta.link && (
                                  <a
                                    href={event.meta.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline shrink-0"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join
                                    Virtual Meeting{" "}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                                {event.meta.created_by && (
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                                    <span className="font-semibold text-foreground/80">
                                      Authorized By:
                                    </span>
                                    <span>{event.meta.created_by}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
        <Button type="button" className="px-6 font-bold" onClick={handleNext}>
          Return to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        caseId={caseNumberStr}
        onSuccess={() => {
          timelineQuery.refetch();
          caseDetailQuery.refetch();
        }}
      />
    </div>
  );
}
