"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useCaseHearingDetail, useCaseDetail } from "@/lib";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Printer,
  ExternalLink,
  Building2,
  AlignLeft,
} from "lucide-react";

export default function HearingViewPage() {
  const params = useParams<{ case_number: string }>();
  const searchParams = useSearchParams();
  const { t, lang } = useTranslation();
  const caseNumber = params?.case_number;
  const hearingId = searchParams.get("id");

  const hearingQuery = useCaseHearingDetail(caseNumber || "", hearingId || "");
  const hearing = hearingQuery.data?.result?.data;
  const { data: caseRes } = useCaseDetail(caseNumber || "");
  const caseData = caseRes?.result?.data;

  const handlePrint = () => {
    window.print();
  };

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "SCHEDULED":
        return "info";
      case "ADJOURNED":
        return "warning";
      case "CANCELLED":
        return "error";
      default:
        return "neutral";
    }
  };

  if (hearingQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-xs text-muted-foreground">
        {lang === "hi"
          ? "सुनवाई विवरण लोड हो रहा है..."
          : "Loading hearing record..."}
      </div>
    );
  }

  if (!hearing) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-foreground">
          {lang === "hi"
            ? "सुनवाई विवरण प्राप्त नहीं हुआ।"
            : "Hearing Record Not Found"}
        </p>
        <p className="text-xs text-muted-foreground">
          {lang === "hi"
            ? "कृपया मान्य आईडी के साथ पुनः प्रयास करें।"
            : "Please check the hearing ID and try again."}
        </p>
      </div>
    );
  }

  const statusDetail = hearing.hearing_status_detail;
  const statusName = statusDetail
    ? lang === "hi"
      ? statusDetail.name
      : statusDetail.name_en
    : hearing.status;

  const typeName = hearing.hearing_type_detail
    ? lang === "hi"
      ? hearing.hearing_type_detail.name
      : hearing.hearing_type_detail.name_en
    : "-";

  const outcomeName = hearing.hearing_outcome_detail
    ? lang === "hi"
      ? hearing.hearing_outcome_detail.name
      : hearing.hearing_outcome_detail.name_en
    : null;

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>
            {lang === "hi"
              ? "सुनवाई विवरण एवं कार्यवाही"
              : "Hearing Details & Record"}
          </span>
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-8 gap-1.5 text-xs font-semibold"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "प्रिंट करें" : "Print Record"}</span>
        </Button>
      </div>

      {}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        <div className="max-w-2xl mx-auto space-y-6">
          {}
          <div
            id="hearing-record-card"
            className="bg-card border border-border/60 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 relative text-left"
          >
            {}
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  {lang === "hi"
                    ? "उत्तराखंड राजस्व न्यायालय"
                    : "Uttarakhand Revenue Court"}
                </span>
                <p className="text-base font-bold text-foreground font-mono mt-0.5">
                  {caseNumber}
                </p>
              </div>

              <StatusBadge variant={getStatusVariant(hearing.status)}>
                {statusName}
              </StatusBadge>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {lang === "hi" ? "सुनवाई तिथि" : "Hearing Date"}
                </span>
                <p className="text-sm font-bold text-foreground font-mono">
                  {hearing.hearing_date}
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-600" />
                  {lang === "hi" ? "सुनवाई समय" : "Hearing Time"}
                </span>
                <p className="text-sm font-bold text-foreground font-mono">
                  {hearing.hearing_expected_start_time
                    ? String(hearing.hearing_expected_start_time).substring(
                        0,
                        5,
                      )
                    : "10:30"}{" "}
                  AM
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3 text-emerald-600" />
                  {lang === "hi" ? "सुनवाई प्रकार" : "Hearing Type"}
                </span>
                <p className="text-sm font-bold text-foreground">{typeName}</p>
              </div>
            </div>

            {}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                {lang === "hi" ? "सुनवाई का माध्यम" : "Hearing Mode"}
              </span>
              <div>
                {hearing.video_conference ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                      <Video className="w-3.5 h-3.5" />
                      Video Conference (VC Online)
                    </span>
                    {hearing.video_conference_link && (
                      <p className="text-xs">
                        <a
                          href={hearing.video_conference_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          {hearing.video_conference_link}{" "}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    Physical Court Hearing (न्यायालय में भौतिक उपस्थिति)
                  </span>
                )}
              </div>
            </div>

            {}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5 text-muted-foreground" />
                {lang === "hi"
                  ? "सुनवाई का उद्देश्य / रिमार्क्स"
                  : "Hearing Purpose / Remarks"}
              </span>
              <p className="text-xs leading-relaxed text-foreground bg-muted/10 p-3 rounded-lg border border-border/40 font-medium">
                {hearing.remarks ||
                  (lang === "hi" ? "सामान्य सुनवाई" : "Regular Hearing")}
              </p>
            </div>

            {}
            <div className="space-y-2 border-b border-border/60 pb-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                {lang === "hi"
                  ? "सुनवाई परिणाम / नतीजा (Outcome)"
                  : "Hearing Outcome Result"}
              </span>
              {outcomeName ? (
                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    {outcomeName}
                  </span>
                </div>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground italic bg-muted/10 p-3 rounded-lg border border-border/40 font-medium">
                  {lang === "hi"
                    ? "कोई सुनवाई परिणाम दर्ज नहीं है।"
                    : "No hearing outcome has been recorded."}
                </p>
              )}
            </div>

            {}
            <div className="grid grid-cols-2 gap-4 text-[11px] text-muted-foreground pt-2">
              <div>
                <span className="font-semibold">
                  {lang === "hi" ? "दर्जकर्ता: " : "Created By: "}
                </span>
                <span>
                  {hearing.created_by_detail?.full_name ||
                    hearing.created_by_detail?.username ||
                    "Court Staff"}
                </span>
              </div>
              <div className="text-right">
                <span className="font-semibold">
                  {lang === "hi" ? "दर्ज दिनांक: " : "Created At: "}
                </span>
                <span>
                  {hearing.created_at
                    ? new Date(hearing.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
