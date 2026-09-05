"use client";

import React, { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useCaseDetail } from "@/lib";
import { useTranslation } from "@/i18n";
import { StatusUpdateModal } from "@/workflows/e-file/common/status-update/status-update-modal";
import {
  Archive,
  CheckCircle2,
  Lock,
  RefreshCw,
  FileCheck,
  Building2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function CaseClosurePage() {
  const { case_number } = useParams();
  const caseNumberStr = (case_number as string) || "";
  const { t, lang } = useTranslation();
  const isHindi = lang === "hi";

  const {
    data: caseDetailRes,
    isLoading,
    refetch,
  } = useCaseDetail(caseNumberStr);
  const caseData = caseDetailRes?.result?.data;

  const stageCode =
    caseData?.current_stage_detail?.code ||
    (caseData as any)?.current_stage ||
    "";
  const statusCode =
    caseData?.current_status_detail?.code ||
    (caseData as any)?.current_status ||
    "";

  const stageName = caseData?.current_stage_detail
    ? isHindi
      ? caseData.current_stage_detail.name ||
        caseData.current_stage_detail.name_en
      : caseData.current_stage_detail.name_en ||
        caseData.current_stage_detail.name
    : stageCode || "-";

  const statusName = caseData?.current_status_detail
    ? isHindi
      ? caseData.current_status_detail.name ||
        caseData.current_status_detail.name_en
      : caseData.current_status_detail.name_en ||
        caseData.current_status_detail.name
    : statusCode || "-";


  const isClosed = useMemo(() => {
    const sCode = (statusCode || "").toUpperCase();
    const stCode = (stageCode || "").toUpperCase();
    return (
      sCode === "CLOSED" ||
      sCode === "DISPOSED" ||
      stCode === "CLOSED" ||
      (caseData?.current_status_detail?.name_en || "")
        .toLowerCase()
        .includes("closed") ||
      (caseData?.current_status_detail?.name_en || "")
        .toLowerCase()
        .includes("disposed")
    );
  }, [statusCode, stageCode, caseData]);

  const [statusModalOpen, setStatusModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background p-6 space-y-6">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r text-left">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <Card className="border shadow-2xs overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                  <Archive className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold tracking-tight text-foreground">
                    {isHindi
                      ? "केस क्लोजर एवं अंतिम निस्तारण"
                      : "Case Closure & Final Disposal"}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                    {isHindi
                      ? "न्यायालय द्वारा निर्णय/आदेश पारित होने के पश्चात केस समाप्ति की प्रक्रिया"
                      : "Process for case closure and final disposal following court order"}
                  </CardDescription>
                </div>
              </div>

              <StatusBadge variant={isClosed ? "success" : "warning"}>
                {isClosed
                  ? isHindi
                    ? "केस बंद (CLOSED)"
                    : "CLOSED"
                  : isHindi
                    ? "कार्यवाही जारी (IN PROGRESS)"
                    : "IN PROGRESS"}
              </StatusBadge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground text-sm flex items-center gap-2">
                <FileCheck className="size-4 text-emerald-600 shrink-0" />
                <span>
                  {isHindi ? "केस समाप्ति निर्देश" : "Case Closure Guidelines"}
                </span>
              </p>
              <p>
                {isHindi
                  ? "जब न्यायालय द्वारा वाद में अंतिम आदेश पारित कर दिया जाता है और सभी आवश्यक कार्यवाहियों (जैसे अनुपालन, अर्थदंड या रिपोर्ट) की पूर्ति हो जाती है, तब वाद की स्थिति को औपचारिक रूप से 'CLOSED' (बंद) पर अपडेट किया जाता है।"
                  : "When a final order is passed by the court and all post-order compliance activities are completed, the case status is formally updated to 'CLOSED'."}
              </p>
            </div>

            {}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isHindi ? "वाद संख्या" : "Case Number"}
                </span>
                <p className="text-sm font-bold text-foreground font-mono truncate">
                  {caseNumberStr}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isHindi ? "वर्तमान चरण" : "Current Stage"}
                </span>
                <p className="text-sm font-bold text-foreground truncate">
                  {stageName}
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {isHindi ? "वर्तमान स्थिति" : "Current Status"}
                </span>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  {statusName}
                </p>
              </div>
            </div>

            {}
            {isClosed ? (

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold">
                    {isHindi
                      ? "यह केस सफलतापूर्वक बंद कर दिया गया है।"
                      : "This case has been successfully closed."}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {isHindi
                      ? "केस बंद स्थिति में है। इसमें अब अतिरिक्त स्टेटस अपडेट की आवश्यकता नहीं है।"
                      : "Case is in CLOSED state. Further status updates are not required."}
                  </p>
                </div>
              </div>
            ) : (

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {isHindi
                      ? "स्थिति अपडेट करने के लिए:"
                      : "To change case status:"}
                  </span>{" "}
                  {isHindi
                    ? "'Case Close' बटन पर क्लिक करके क्लोजर स्थिति चुनें।"
                    : "Click 'Case Close' button below to update stage/status to Closed."}
                </div>

                <Button
                  type="button"
                  size="default"
                  onClick={() => setStatusModalOpen(true)}
                  className="gap-2 h-10 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
                >
                  <RefreshCw className="size-4" />
                  <span>
                    {isHindi ? "केस बंद करें (Case Close)" : "Case Close"}
                  </span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <StatusUpdateModal
        open={statusModalOpen}
        onOpenChange={setStatusModalOpen}
        caseId={caseNumberStr}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
