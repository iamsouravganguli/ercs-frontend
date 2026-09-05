"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/cn";
import { PartyTable } from "../parties/party-table";
import { PartyStats } from "../parties/party-stats";
import PartiesWorkflow from "../parties/parties-workflow";
import { LandTable } from "../lands/land-table";
import { LandStats } from "../lands/land-stats";
import LandsWorkflow from "../lands/lands-workflow";
import { DocumentTable } from "../documents/document-table";
import { DocumentStats } from "../documents/document-stats";
import DocumentsWorkflow from "../documents/documents-workflow";
import {
  useCasePartyList,
  useCaseLandList,
  CommonsApiServices,
  useSessionCheck,
  useStatusList,
  useCaseDetail,
  useProfileDetail,
} from "@/lib";
import { useQuery } from "@tanstack/react-query";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { PartyForm } from "../parties/party-form";
import { LandForm } from "../lands/land-form";

export type TabKey = "parties" | "lands" | "documents";

export function CaseDetailsTabs({
  activeTab,
  onTabChange,
}: {
  activeTab?: TabKey;
  onTabChange?: (k: TabKey) => void;
}) {
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = caseId as string;
  const { t } = useTranslation();
  const [internalActive, setInternalActive] = useState<TabKey>("parties");
  const active = activeTab ?? internalActive;
  const setActive = onTabChange ?? setInternalActive;

  const partyQuery = useCasePartyList(caseNumber);
  const parties = partyQuery.data?.result?.data || [];

  const landQuery = useCaseLandList(caseNumber);
  const apiLands = landQuery.data?.result?.data || [];
  const lands = apiLands.map((apiLand: any) => ({
    id: String(apiLand.id),
    khata_number: apiLand.khata_number,
    land_type: apiLand.land_type,
    plots: apiLand.khasra_no
      ? apiLand.khasra_no
          .split(", ")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    khasra_no: apiLand.khasra_no || "",
    calculated_area: apiLand.total_land ? Number(apiLand.total_land) : 0,
    disputed_land: apiLand.disputed_land ? Number(apiLand.disputed_land) : 0,
  }));

  const sessionCheck = useSessionCheck();
  const role = (sessionCheck.data as any)?.role?.toUpperCase();
  const isCourtUser = ["PO", "CO", "CC"].includes(role || "");
  const { data: statusRes } = useStatusList({ "filters[type]": "DOCUMENT" });
  const statuses = (statusRes as any)?.result?.data || [];


  const { data: profileData } = useProfileDetail();
  const profileRole =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    (profileData as any)?.data?.user?.role ||
    role ||
    "";
  const roleUpper = String(profileRole || "").toUpperCase();
  const isCitizenAdvocate = [
    "CT",
    "CT",
    "CIT",
    "AD",
    "AD",
    "ADV",
    "LAWYER",
  ].includes(roleUpper);
  const isViewOnly = ["SA", "RI", "RSI"].includes(roleUpper);
  const caseDetail = useCaseDetail(caseNumber);
  const stageCode =
    (caseDetail.data?.result?.data as any)?.current_stage_detail?.code ||
    (caseDetail.data?.result?.data as any)?.current_stage?.code ||
    "";
  const statusCode =
    (caseDetail.data?.result?.data as any)?.current_status_detail?.code ||
    (caseDetail.data?.result?.data as any)?.current_status?.code ||
    "";
  const isRegistered =
    String(stageCode).toUpperCase() === "REGISTRATION" ||
    String(statusCode).toUpperCase() === "REGISTERED" ||
    String(stageCode).toUpperCase() !== "FILING";

  const canEdit = !isCitizenAdvocate && !isViewOnly;


  const [viewParty, setViewParty] = useState<any | null>(null);
  const [viewLand, setViewLand] = useState<any | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const { data: docsRes, isLoading: docsLoading } = useQuery({
    queryKey: ["case", caseNumber, "documents"],
    queryFn: () =>
      CommonsApiServices.CaseDocumentListService(caseNumber as string),
    enabled: !!caseNumber,
  });
  const docsRaw =
    (docsRes as any)?.result?.data || (docsRes as any)?.data?.results || [];
  const files = docsRaw.map((d: any) => ({
    id: String(d.id),
    original_name: d.file_name || "Unknown",
    type_of_doc: d.type_of_doc || "Other",
    size: d.file_size_mb ? d.file_size_mb * 1024 * 1024 : 0,
    status_detail: d.status_detail,
    status: d.status,
    file_url: d.file_url,
    uploaded_at: d.created_at,
  }));

  const tabs: { key: TabKey; label: string }[] = [
    { key: "parties", label: t("case.parties.title") ?? "Parties" },
    { key: "lands", label: t("case.lands.title") ?? "Lands" },
    { key: "documents", label: t("case.documents.title") ?? "Documents" },
  ];

  const handlePreviewDoc = (doc: any) => {
    const url = doc.file_url
      ? doc.file_url.startsWith("http")
        ? doc.file_url
        : `${process.env.NEXT_PUBLIC_API_URL || ""}${doc.file_url}`
      : "";
    if (!url) return;
    setPreviewDoc(doc);
    setPreviewUrl(url);
  };

  return (
    <section id="case-details-tabs" className="w-full scroll-mt-32">
      <div className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-none whitespace-nowrap overscroll-x-contain touch-pan-x flex-nowrap pt-1.5 px-1">
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          const count =
            tab.key === "parties"
              ? parties.length
              : tab.key === "lands"
                ? lands.length
                : files.length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "h-10 px-4 text-sm font-medium whitespace-nowrap border-b-[3px] -mb-px transition-colors shrink-0",
                isActive
                  ? "border-primary text-primary dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600",
              )}
            >
              {tab.label}{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({count})
              </span>
            </button>
          );
        })}
      </div>
      <div className="pt-4 space-y-4">
        {active === "parties" &&
          (canEdit ? (
            <PartiesWorkflow />
          ) : (
            <>
              <PartyStats parties={parties} />
              <PartyTable
                parties={parties}
                isSubmitted={true}
                onView={(p) => setViewParty(p)}
              />
            </>
          ))}
        {active === "lands" &&
          (canEdit ? (
            <LandsWorkflow />
          ) : (
            <>
              <LandStats lands={lands as any} />
              <LandTable
                lands={lands as any}
                isSubmitted={true}
                onView={(l) => setViewLand(l)}
              />
            </>
          ))}
        {active === "documents" &&
          (canEdit ? (
            <DocumentsWorkflow />
          ) : (
            <>
              <DocumentStats files={files} />
              <DocumentTable
                files={files}
                loading={docsLoading}
                isSubmitted={true}
                isCourtUser={isCourtUser}
                statuses={statuses}
                onView={handlePreviewDoc}
              />
            </>
          ))}
      </div>

      {}
      {!canEdit && viewParty && (
        <CustomModal
          open={!!viewParty}
          onOpenChange={(o) => {
            if (!o) setViewParty(null);
          }}
          className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
        >
          <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
            <PartyForm
              partyId={String(viewParty.id)}
              isView={true}
              onClose={() => setViewParty(null)}
              onSuccess={() => partyQuery.refetch()}
            />
          </CustomModalBody>
        </CustomModal>
      )}
      {!canEdit && viewLand && (
        <CustomModal
          open={!!viewLand}
          onOpenChange={(o) => {
            if (!o) setViewLand(null);
          }}
          className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
        >
          <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
            <LandForm
              landId={String(viewLand.id)}
              isView={true}
              onClose={() => setViewLand(null)}
              onSuccess={() => landQuery.refetch()}
            />
          </CustomModalBody>
        </CustomModal>
      )}
      <CustomModal
        open={!!previewDoc}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewDoc(null);
            setPreviewUrl("");
          }
        }}
        className="max-w-none w-screen h-screen p-0 m-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-none border-0 [&>button]:hidden"
      >
        <CustomModalBody className="p-0 m-0 h-full flex flex-col overflow-hidden gap-0">
          <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
            <p className="text-sm font-semibold truncate">
              {previewDoc?.type_of_doc || "Document"}
            </p>
            <button
              onClick={() => {
                setPreviewDoc(null);
                setPreviewUrl("");
              }}
              className="h-8 px-4 text-xs font-medium border rounded-md hover:bg-muted"
            >
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-950">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                title={previewDoc?.original_name || "Document"}
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No preview available
              </div>
            )}
          </div>
        </CustomModalBody>
      </CustomModal>
    </section>
  );
}

export default CaseDetailsTabs;
