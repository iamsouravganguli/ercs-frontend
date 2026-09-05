"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { useCaseDetail, useCasePartyList, useCaseLandList, useCaseHearingList, useCaseOrderList, useCaseTimeline, getLabel, getFileUrl } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  StatusBadge,
  StatusVariant,
} from "@/components/ui/status-badge";
import {
  Printer,
  Calendar,
  Landmark,
  MapPin,
  FileText,
  Scale,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
  Clock,
  UserCheck,
  CheckCircle2,
  FileCheck,
} from "lucide-react";

interface PublicCaseDetailViewProps {
  caseNumber: string;
  onClose?: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

export function PublicCaseDetailView({
  caseNumber,
  onClose,
  onBack,
  showBack = false,
}: PublicCaseDetailViewProps) {
  const { t, lang } = useTranslation();
  const printRef = useRef<HTMLDivElement>(null);


  const caseDetailQuery = useCaseDetail(caseNumber);
  const partyListQuery = useCasePartyList(caseNumber);
  const landListQuery = useCaseLandList(caseNumber);
  const hearingListQuery = useCaseHearingList(caseNumber);
  const orderListQuery = useCaseOrderList(caseNumber);
  const timelineQuery = useCaseTimeline(caseNumber);

  const caseData = caseDetailQuery.data?.result?.data as any;
  const partyData = Array.isArray(partyListQuery.data)
    ? partyListQuery.data
    : partyListQuery.data?.result?.data || [];
  const landData = Array.isArray(landListQuery.data)
    ? landListQuery.data
    : landListQuery.data?.result?.data || [];
  const hearingData = Array.isArray(hearingListQuery.data)
    ? hearingListQuery.data
    : hearingListQuery.data?.result?.data || [];
  const orderData = Array.isArray(orderListQuery.data)
    ? orderListQuery.data
    : orderListQuery.data?.result?.data || [];
  const timelineData = Array.isArray(timelineQuery.data)
    ? timelineQuery.data
    : timelineQuery.data?.result?.data || [];

  const isLoading = caseDetailQuery.isLoading;
  const isError = caseDetailQuery.isError || !caseData;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };


  const getTranslation = (key: string, fallback: string) => {
    const val = t(key);
    return val === key ? fallback : val;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-background rounded-2xl border border-border/50">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-base font-medium text-muted-foreground">
          {getTranslation("common.loading_case", "Loading Case Details...")}
        </p>
      </div>
    );
  }

  if (isError || !caseData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] p-8 text-center bg-background rounded-2xl border border-border/50">
        <AlertCircle className="h-12 w-12 text-destructive mb-3" />
        <h3 className="text-lg font-bold text-foreground">
          {getTranslation("common.case_not_found", "Case Details Not Found")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">
          {getTranslation(
            "common.case_not_found_desc",
            "The requested case number could not be retrieved or is not publicly accessible.",
          )}
        </p>
        {onBack ? (
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {getTranslation("common.back", "Go Back")}
          </Button>
        ) : onClose ? (
          <Button variant="outline" onClick={onClose}>
            {getTranslation("common.close", "Close")}
          </Button>
        ) : null}
      </div>
    );
  }


  const curStatus =
    caseData.current_status_detail ||
    (typeof caseData.current_status === "object"
      ? caseData.current_status
      : null);
  const statusNameEn = curStatus
    ? curStatus.name_en || curStatus.name
    : caseData.legacy_status_name_en || "";
  const statusName = getLabel(
    curStatus
      ? { name: curStatus.name, name_en: curStatus.name_en || curStatus.name }
      : {
          name: caseData.legacy_status_name || "-",
          name_en: caseData.legacy_status_name_en || "-",
        },
    lang,
  );

  let statusVariant: StatusVariant = "neutral";
  const normalizedStatus = statusNameEn.toLowerCase();
  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("process") ||
    normalizedStatus.includes("hearing")
  ) {
    statusVariant = "warning";
  } else if (
    normalizedStatus.includes("disposed") ||
    normalizedStatus.includes("closed") ||
    normalizedStatus.includes("accepted") ||
    normalizedStatus.includes("final")
  ) {
    statusVariant = "success";
  } else if (
    normalizedStatus.includes("rejected") ||
    normalizedStatus.includes("dismissed")
  ) {
    statusVariant = "error";
  }


  const regDate = caseData.created_at
    ? new Date(caseData.created_at).toLocaleDateString(
        lang === "hi" ? "hi-IN" : "en-IN",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      )
    : "-";

  const printedDate = new Date().toLocaleString(
    lang === "hi" ? "hi-IN" : "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 printable-document">
      {}
      <style jsx global>{`
        @media print {

          .no-print,
          header,
          footer,
          nav,
          button,
          [role="dialog"],
          .no-print-area {
            display: none !important;
          }


          html,
          body,
          #__next,
          main,
          div {
            background: #ffffff !important;
            color: #000000 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
            box-shadow: none !important;
            border-color: #e2e8f0 !important;
          }

          .printable-document {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 12px !important;
          }

          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          thead {
            display: table-header-group !important;
          }

          th,
          td {
            border: 1px solid #475569 !important;
            padding: 6px 8px !important;
            color: #000000 !important;
            background: #ffffff !important;
          }

          .print-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 16px !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 12mm 12mm 12mm;
          }
        }
        @media (max-width: 840px) {
          .zoom-container {
            zoom: calc((100vw - 24px) / 800) !important;
          }
        }
      `}</style>

      {}
      <div className="no-print print:hidden flex flex-wrap items-center justify-between gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          {showBack && onBack && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {getTranslation("common.back", "Back")}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            onClick={handlePrint}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4"
          >
            <Printer className="h-4 w-4" />
            {getTranslation("common.print", "Print")}
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {}
      <div
        ref={printRef}
        className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-slate-100 p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-lg space-y-8 font-sans print:p-0 print:border-none print:shadow-none print:bg-white print:text-black w-[800px] md:w-full mx-auto print:w-full shrink-0 zoom-container"
      >
        {}
        <div className="pb-6 mb-6 text-left space-y-3">
          <div className="flex items-center justify-start gap-3">
            <Image
              src="/logo.png"
              alt="Uttarakhand Logo"
              width={64}
              height={64}
              className="h-14 w-14 object-contain print:h-12 print:w-12"
            />
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white print:text-black">
                {lang === "hi"
                  ? "उत्तराखंड ई-राजस्व न्यायालय"
                  : "Uttarakhand E-Revenue Courts"}
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium print:text-slate-700">
                {lang === "hi"
                  ? "राजस्व परिषद, उत्तराखंड"
                  : "Board of Revenue Uttarakhand"}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-4 print-section mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white print:text-black pb-1.5 border-b border-slate-200 dark:border-neutral-800">
            {lang === "hi"
              ? "मामले की सामान्य जानकारी (Case General Details)"
              : "Case General Details"}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800 print:border-slate-400">
            <table className="w-full text-left text-xs border-collapse">
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 print:divide-slate-300">
                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 w-1/3 sm:w-1/4 print:bg-slate-100 print:text-black">
                    {lang === "hi"
                      ? "कंप्यूटरकृत वाद सं. (Case No.)"
                      : "Case Number"}
                  </td>
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 w-2/3 sm:w-3/4 print:text-black">
                    {caseData.case_number}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi"
                      ? "पुराना / ऑफलाईन वाद सं."
                      : "Offline Case No."}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {caseData.offline_case_number ||
                      caseData.offline_case_no ||
                      caseData.legacy_case_number ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "पंजीकरण / संस्थित तिथि" : "Filing Date"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {regDate}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "वर्तमान स्थिति" : "Current Status"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    <StatusBadge variant={statusVariant}>
                      {statusName}
                    </StatusBadge>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "न्यायालय का स्तर" : "Court Level"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(caseData.court_level, lang) ||
                      getLabel(caseData.court_level_detail, lang) ||
                      caseData.legacy_court_level_name ||
                      caseData.court_level_name ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "न्यायालय का नाम" : "Court Name"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(caseData.court, lang) ||
                      getLabel(caseData.court_detail, lang) ||
                      caseData.legacy_court_name ||
                      caseData.court_name ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "अधिनियम (Act)" : "Act"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(caseData.act, lang) ||
                      getLabel(caseData.act_detail, lang) ||
                      caseData.legacy_act_name ||
                      caseData.act_name ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "धारा (Section)" : "Section"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(caseData.section, lang) ||
                      getLabel(caseData.section_detail, lang) ||
                      caseData.legacy_section_name ||
                      caseData.section_name ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "मामले की प्रकृति" : "Case Nature"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(caseData.case_nature, lang) ||
                      getLabel(caseData.case_nature_detail, lang) ||
                      caseData.case_nature_name ||
                      "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "राज्य (State)" : "State"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(
                      {
                        name: caseData.state_name || "उत्तराखण्ड",
                        name_en: caseData.state_name_en || "Uttarakhand",
                      },
                      lang,
                    )}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "मण्डल (Division)" : "Division"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(
                      {
                        name: caseData.mandal_name,
                        name_en:
                          caseData.mandal_name_en || caseData.mandal_name,
                      },
                      lang,
                    ) || "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "जनपद (District)" : "District"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(
                      {
                        name: caseData.district_name,
                        name_en:
                          caseData.district_name_en || caseData.district_name,
                      },
                      lang,
                    ) || "-"}
                  </td>
                </tr>

                <tr className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30">
                  <td className="p-2.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-neutral-800/60 print:bg-slate-100 print:text-black">
                    {lang === "hi" ? "तहसील (Tehsil)" : "Tehsil"}
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                    {getLabel(
                      {
                        name: caseData.tehsil_name,
                        name_en:
                          caseData.tehsil_name_en || caseData.tehsil_name,
                      },
                      lang,
                    ) || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="space-y-4 print-section mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white print:text-black pb-1.5 border-b border-slate-200 dark:border-neutral-800">
            {lang === "hi"
              ? "पक्षकारों का विवरण (Parties Information)"
              : "Parties Information"}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800 print:border-slate-400">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-semibold print:bg-slate-200 print:text-black">
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-12 text-center">
                    #
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi"
                      ? "पक्षकार का नाम (Party Name)"
                      : "Party Name"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-44">
                    {lang === "hi"
                      ? "पक्ष / श्रेणी (Category)"
                      : "Party Type / Role"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 print:divide-slate-300">
                {partyData.length > 0 ? (
                  partyData.map((party: any, idx: number) => {
                    const fullName =
                      party.full_name ||
                      [party.first_name, party.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      party.name ||
                      party.party_name ||
                      "-";

                    const relType =
                      getLabel(party.relation_type_detail, lang) ||
                      party.relation_type?.name ||
                      "";
                    const relName = party.relation_name || "";
                    const relationStr = relName
                      ? relType
                        ? ` (${relType}: ${relName})`
                        : ` (${relName})`
                      : "";

                    const pType =
                      getLabel(party.party_type_detail, lang) ||
                      (typeof party.party_type === "object"
                        ? getLabel(party.party_type, lang)
                        : null) ||
                      party.party_type_name ||
                      party.party_nature ||
                      "-";

                    return (
                      <tr
                        key={party.id || idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
                      >
                        <td className="p-2.5 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 print:text-black">
                          {fullName}
                          {relationStr && (
                            <span className="font-normal text-slate-600 dark:text-slate-400 print:text-slate-700 ml-1">
                              {relationStr}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300 print:text-black">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-neutral-800 rounded border border-slate-200 dark:border-neutral-700 text-[11px] print:border-slate-400 print:bg-white print:text-black">
                            {pType}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {lang === "hi"
                        ? "कोई पक्षकार विवरण दर्ज नहीं है"
                        : "No party details cataloged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="space-y-4 print-section mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white print:text-black pb-1.5 border-b border-slate-200 dark:border-neutral-800">
            {lang === "hi" ? "भू-अभिलेख विवरण (Land Details)" : "Land Details"}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800 print:border-slate-400">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-semibold print:bg-slate-200 print:text-black">
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-12 text-center">
                    #
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "ग्राम" : "Village"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "तहसील" : "Tehsil"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "खाता सं." : "Khata No."}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "खसरा सं." : "Khasra No."}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "क्षेत्रफल (हे.)" : "Area (Ha)"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 print:divide-slate-300">
                {landData.length > 0 ? (
                  landData.map((land: any, idx: number) => (
                    <tr
                      key={land.id || idx}
                      className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
                    >
                      <td className="p-2.5 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200 print:text-black">
                        {land.village_name || "-"}
                      </td>
                      <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300 print:text-black">
                        {land.tehsil_name || "-"}
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200 print:text-black">
                        {land.khata_no || "-"}
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200 print:text-black">
                        {land.khasra_no || "-"}
                      </td>
                      <td className="p-2.5 font-mono text-slate-800 dark:text-slate-200 print:text-black">
                        {land.area || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {lang === "hi"
                        ? "कोई भू-अभिलेख विवरण दर्ज नहीं है"
                        : "No land record entries cataloged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="space-y-4 print-section mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white print:text-black pb-1.5 border-b border-slate-200 dark:border-neutral-800">
            {lang === "hi"
              ? "सुनवाई का इतिहास एवं कॉज लिस्ट (Hearing History & Cause List)"
              : "Hearing History & Cause List"}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800 print:border-slate-400">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-semibold print:bg-slate-200 print:text-black">
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-12 text-center">
                    #
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-32">
                    {lang === "hi" ? "सुनवाई तिथि" : "Hearing Date"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi"
                      ? "सुनवाई कारण / प्रयोजन"
                      : "Purpose / Cause"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi"
                      ? "परिणाम / आगामी तिथि"
                      : "Outcome / Next Date"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 print:divide-slate-300">
                {hearingData.length > 0 ? (
                  hearingData.map((h: any, idx: number) => {
                    const hDate = h.hearing_date
                      ? new Date(h.hearing_date).toLocaleDateString(
                          lang === "hi" ? "hi-IN" : "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "-";
                    const cause =
                      getLabel(h.hearing_type_detail, lang) ||
                      h.hearing_cause ||
                      "-";
                    const outcome =
                      getLabel(h.hearing_outcome_detail, lang) ||
                      h.hearing_notes ||
                      h.outcome_text ||
                      "-";
                    return (
                      <tr
                        key={h.id || idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
                      >
                        <td className="p-2.5 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 print:text-black">
                          {hDate}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                          {cause}
                        </td>
                        <td className="p-2.5 font-normal text-slate-700 dark:text-slate-300 print:text-black">
                          {outcome}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {lang === "hi"
                        ? "कोई सुनवाई इतिहास दर्ज नहीं है"
                        : "No hearing entries cataloged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="space-y-4 print-section mb-8">
          <h2 className="text-base font-bold text-slate-900 dark:text-white print:text-black pb-1.5 border-b border-slate-200 dark:border-neutral-800">
            {lang === "hi"
              ? "आदेश एवं निर्णय (Orders & Judgments)"
              : "Orders & Judgments"}
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800 print:border-slate-400">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 font-semibold print:bg-slate-200 print:text-black">
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-12 text-center">
                    #
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-32">
                    {lang === "hi" ? "आदेश तिथि" : "Order Date"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi" ? "आदेश प्रकार" : "Order Type"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700">
                    {lang === "hi"
                      ? "विवरण / आदेशकर्ता"
                      : "Order Passed By / Subject"}
                  </th>
                  <th className="p-2.5 border-b border-slate-200 dark:border-neutral-700 w-28 text-center no-print">
                    {lang === "hi" ? "आदेश डाउनलोड" : "Document"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 print:divide-slate-300">
                {orderData.length > 0 ? (
                  orderData.map((ord: any, idx: number) => {
                    const oDate = ord.order_date
                      ? new Date(ord.order_date).toLocaleDateString(
                          lang === "hi" ? "hi-IN" : "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "-";
                    const oType =
                      getLabel(ord.order_type_detail, lang) ||
                      ord.order_no ||
                      "Order";
                    const passedBy = ord.passed_by_name || ord.summary || "-";
                    const docUrl = ord.order_file
                      ? getFileUrl(ord.order_file)
                      : null;
                    return (
                      <tr
                        key={ord.id || idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
                      >
                        <td className="p-2.5 text-center font-medium text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 print:text-black">
                          {oDate}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 print:text-black">
                          {oType}
                        </td>
                        <td className="p-2.5 font-normal text-slate-700 dark:text-slate-300 print:text-black">
                          {passedBy}
                        </td>
                        <td className="p-2.5 text-center no-print">
                          {docUrl ? (
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-center text-slate-500 italic"
                    >
                      {lang === "hi"
                        ? "कोई आदेश प्रति दर्ज नहीं है"
                        : "No published order entries cataloged."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 text-center text-[10px] text-slate-500 dark:text-slate-400 print:text-slate-600 print:border-slate-400">
          <p>
            {lang === "hi"
              ? "यह रिपोर्ट राजस्व परिषद उत्तराखंड द्वारा स्वचालित रूप से जनरेट की गई है।"
              : "This report is generated automatically by Board of Revenue Uttarakhand."}
          </p>
          <p className="mt-0.5 font-mono">
            <a
              href="https://erccms.uk.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline print:text-black print:no-underline"
            >
              https:
            </a>{" "}
            | Report Timestamp: {printedDate}
          </p>
        </div>
      </div>
    </div>
  );
}
