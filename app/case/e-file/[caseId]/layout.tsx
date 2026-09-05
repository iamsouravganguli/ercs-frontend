"use client";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { FileText, Check, Copy, Menu, Info, Clock, AlertCircle, Circle } from "lucide-react";
import { EFileStepper } from "@/workflows/e-file/common/e-file-stepper";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCaseDetail, useProfileDetail, resolveCaseRoute, isCitizenAdvocate as isCitizenAdvocateRole } from '@/lib/query';
import { CurrentProgress } from "@/workflows/e-file/common/timeline/current-progress";

import { CustomSheet, CustomSheetHeader, CustomSheetBody } from "@/workflows/e-file/common/timeline/custom-sheet";

type EFileFooterContextType = {
  onBack?: () => void;
  onNext?: () => void;
  backDisabled?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  hideFooter?: boolean;
  setFooterConfig?: React.Dispatch<
    React.SetStateAction<EFileFooterContextType>
  >;
};
const EFileFooterContext = createContext<EFileFooterContextType>({});
export const useEFileFooter = () => useContext(EFileFooterContext);

export default function EFileDraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { caseId } = useParams<{ caseId: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [footerConfig, setFooterConfig] = useState<EFileFooterContextType>({});
  const caseDetail = useCaseDetail(caseId as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

  const stageCode =
    (caseDetail.data?.result?.data as any)?.current_stage_detail?.code ||
    (caseDetail.data?.result?.data as any)?.current_stage?.code ||
    "";
  const statusCode =
    (caseDetail.data?.result?.data as any)?.current_status_detail?.code ||
    (caseDetail.data?.result?.data as any)?.current_status?.code ||
    "";
  const { data: profileData } = useProfileDetail();
  const userRole =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    (profileData as any)?.data?.user?.role ||
    "";
  const isCitizenAdvocate = isCitizenAdvocateRole(userRole);
  const shouldGoToManageForCitizen =
    resolveCaseRoute(userRole, stageCode, statusCode) === "manage" &&
    isCitizenAdvocate;

  const isScrutinyPending =
    String(stageCode).toUpperCase() === "SCRUTINY" &&
    String(statusCode).toUpperCase() === "PENDING";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(caseId));
    setCopied(true);
    toast.success("Case number copied");
    setTimeout(() => setCopied(false), 1500);
  };


  const getCurrentStep = () => {
    if (pathname?.includes("/case-details")) return 1;
    if (pathname?.includes("/parties")) return 2;
    if (pathname?.includes("/lands")) return 3;
    if (pathname?.includes("/documents")) return 4;
    if (pathname?.includes("/review")) return 5;
    return 1;
  };
  const currentStep = getCurrentStep();


  useEffect(() => {
    if (
      !caseDetail.isLoading &&
      shouldGoToManageForCitizen &&
      isCitizenAdvocate
    ) {
      router.replace(`/case/e-file/manage/${caseId}/case-details`);
    }
  }, [
    caseDetail.isLoading,
    shouldGoToManageForCitizen,
    isCitizenAdvocate,
    caseId,
    router,
  ]);

  const stepRoutes: Record<number, string> = {
    1: "case-details",
    2: "parties",
    3: "lands",
    4: "documents",
    5: "review",
  };

  const handleBack = () => {
    if (currentStep > 1) {
      router.push(`/case/e-file/${caseId}/${stepRoutes[currentStep - 1]}`);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      router.push(`/case/e-file/${caseId}/${stepRoutes[currentStep + 1]}`);
    }
  };

  const footerBackDisabled = isSubmitted
    ? true
    : (footerConfig.backDisabled ?? currentStep === 1);
  const footerNextDisabled = isSubmitted
    ? true
    : (footerConfig.nextDisabled ?? false);
  const footerNextLabel = footerConfig.nextLabel ?? t("case.details.next_btn");
  const handleFooterBack = () => {
    if (isSubmitted) return;
    if (footerConfig.onBack) return footerConfig.onBack();
    handleBack();
  };
  const handleFooterNext = () => {
    if (isSubmitted) return;
    if (footerConfig.onNext) return footerConfig.onNext();
    handleNext();
  };

  const isDraftExited =
    isSubmitted ||
    (String(stageCode).toUpperCase() === "SCRUTINY" &&
      String(statusCode).toUpperCase() === "PENDING") ||
    resolveCaseRoute(userRole, stageCode, statusCode) === "manage";
  const headerTitle = isDraftExited ? "e-File" : "e-File Draft";

  return (
    <EFileFooterContext.Provider
      value={{ ...footerConfig, setFooterConfig: setFooterConfig as any }}
    >
      <div className="h-screen flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        {}
        <header className="shrink-0 h-14 bg-primary border-b border-primary/20 z-30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-base font-semibold text-primary-foreground">
                <FileText className="h-6 w-6" /> {headerTitle}{" "}
                <span className="text-sm font-medium text-primary-foreground/80">
                  ({caseId as string})
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
                <FileText className="h-6 w-6" /> {headerTitle}{" "}
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
                variant="ghost"
                size="icon"
                onClick={() => setLegendOpen(true)}
                className="h-8 w-8 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                aria-label="Stepper legend"
              >
                <Info className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push("/manage/cases")}
                className="hidden sm:inline-flex bg-white text-primary border-white hover:bg-zinc-100 hover:text-primary dark:bg-white dark:text-primary dark:border-white dark:hover:bg-zinc-100"
              >
                {t("case.details.exit_btn")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden h-8 w-8 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                aria-label="View Case Progress"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
              <EFileStepper currentStep={currentStep} isSubmitted={isSubmitted} caseId={String(caseId)} mobileOpen={mobileNavOpen} onMobileOpenChange={setMobileNavOpen} />
              {}
              {isScrutinyPending && (
                <div className="pb-2">
                  <CurrentProgress />
                </div>
              )}


              {}
              {children}
            </div>
          </div>
        </div>

        <CustomSheet open={legendOpen} onOpenChange={setLegendOpen}>
          <CustomSheetHeader className="px-6 py-4 border-b">
            <h3 className="text-base font-semibold">{t("case.efile.legend.title")}</h3>
          </CustomSheetHeader>
          <CustomSheetBody className="px-6 py-6 space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{t("case.efile.legend_note")}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border bg-white dark:bg-zinc-900 p-3">
                <span className="h-8 w-8 rounded-full bg-[#2F4FA2] dark:bg-[#8AA6E0] text-white dark:text-[#1e2a4a] flex items-center justify-center shrink-0"><Clock className="h-4 w-4" /></span>
                <div><p className="text-sm font-medium">{t("case.efile.legend.current")}</p><p className="text-xs text-muted-foreground">{t("case.efile.legend.current_desc")}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-white dark:bg-zinc-900 p-3">
                <span className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check className="h-4 w-4" /></span>
                <div><p className="text-sm font-medium">{t("case.efile.legend.completed")}</p><p className="text-xs text-muted-foreground">{t("case.efile.legend.completed_desc")}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-white dark:bg-zinc-900 p-3">
                <span className="h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0"><AlertCircle className="h-4 w-4" /></span>
                <div><p className="text-sm font-medium">{t("case.efile.legend.pending")}</p><p className="text-xs text-muted-foreground">{t("case.efile.legend.pending_desc")}</p></div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-white dark:bg-zinc-900 p-3">
                <span className="h-8 w-8 rounded-full border bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shrink-0"><Circle className="h-4 w-4 text-zinc-400" /></span>
                <div><p className="text-sm font-medium">{t("case.efile.legend.upcoming")}</p><p className="text-xs text-muted-foreground">{t("case.efile.legend.upcoming_desc")}</p></div>
              </div>
            </div>
          </CustomSheetBody>
        </CustomSheet>

        {}
        {!footerConfig.hideFooter && (
          <footer className="shrink-0 h-14 border-t border-zinc-100 dark:border-transparent bg-white dark:bg-background z-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-end gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleFooterBack}
                disabled={footerBackDisabled}
                className="px-5 sm:px-6 border-zinc-200 dark:border-zinc-700 disabled:opacity-40"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleFooterNext}
                disabled={footerNextDisabled}
                className="px-5 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-none disabled:opacity-40"
              >
                {footerNextLabel}
              </Button>
            </div>
          </footer>
        )}
      </div>
    </EFileFooterContext.Provider>
  );
}
