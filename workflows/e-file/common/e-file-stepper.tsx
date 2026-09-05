"use client";

import { useRouter } from "next/navigation";
import { AlertCircle, Check, Circle, Clock, FileText, Users, MapPin, Files, Eye } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useCaseDetail, useCaseLandList, useCasePartyList, useCaseDocumentList, useProfileDetail, type CourtDetailReadResponseData } from "@/lib";
import { CustomSheet, CustomSheetHeader, CustomSheetBody, CustomSheetFooter } from "./timeline/custom-sheet";

type Step = { n: number; title: string; done: boolean; active: boolean; pending: boolean; Icon: React.ElementType };

export function EFileStepper({
  currentStep,
  isSubmitted,
  caseId,
  mobileOpen,
  onMobileOpenChange,
}: {
  currentStep: number;
  isSubmitted: boolean;
  caseId: string;
  mobileOpen: boolean;
  onMobileOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const detail = useCaseDetail(caseId);
  const d = detail.data?.result?.data as CourtDetailReadResponseData | undefined;
  const landQuery = useCaseLandList(caseId);
  const lands: unknown[] = (landQuery.data?.result?.data as unknown[]) ?? [];
  const docQuery = useCaseDocumentList(caseId);
  const docsRaw = (docQuery.data as unknown as { result?: { data?: unknown[] }; data?: unknown[] }) as unknown as { result?: { data?: unknown[] }; data?: unknown[]; results?: unknown[] } | undefined;
  const docs: unknown[] = (docsRaw?.result?.data ?? (docsRaw as unknown as { data?: { results?: unknown[] } })?.data?.results ?? (docsRaw as unknown as { results?: unknown[] })?.results ?? (Array.isArray(docsRaw) ? docsRaw : [])) as unknown[];
  const docCount = Array.isArray(docs) ? docs.length : 0;
  const partyQuery = useCasePartyList(caseId);
  const parties = (partyQuery.data?.result?.data as unknown as { party_type_detail?: { code?: string }; is_phone_verified?: boolean; party_type?: number }[]) ?? [];
  const profileData = useProfileDetail().data as unknown as { result?: { data?: { role?: string } } } | undefined;
  const roleCode = String(profileData?.result?.data?.role ?? "").toUpperCase();
  const isCourtSide = !["CT", "AD"].includes(roleCode) && !!roleCode;

  const isStep1Complete = !!d?.court_level && !!d?.court && !!d?.act && !!d?.section;
  const hasClaimant = parties.some((p) => String(p.party_type_detail?.code ?? "").toUpperCase().includes("CLAIMANT") || p.party_type === 1);
  const hasOpponent = parties.some((p) => String(p.party_type_detail?.code ?? "").toUpperCase().includes("OPPONENT") || p.party_type === 2);
  const claimantParties = parties.filter((p) => String(p.party_type_detail?.code ?? "").toUpperCase().includes("CLAIMANT") || p.party_type === 1);
  const hasClaimantVerified = claimantParties.length > 0 && claimantParties.every((p) => p.is_phone_verified);
  const isStep2Complete = hasClaimant && hasOpponent && (isCourtSide ? true : hasClaimantVerified);
  const isStep3Complete = lands.length >= 1;
  const isStep4Complete = docCount >= 1;
  const s2Done = isSubmitted ? true : isStep2Complete;
  const s3Done = isSubmitted ? true : isStep3Complete;
  const s4Done = isSubmitted ? true : isStep4Complete;

  const rawSteps: Omit<Step, "pending">[] = [
    { n: 1, title: t("case.efile.steps.case_details.title"), done: isSubmitted ? true : isStep1Complete, Icon: FileText, active: isSubmitted ? false : currentStep === 1 },
    { n: 2, title: t("case.efile.steps.parties.title"), done: s2Done, Icon: Users, active: isSubmitted ? false : currentStep === 2 },
    { n: 3, title: t("case.efile.steps.land.title"), done: s3Done, Icon: MapPin, active: isSubmitted ? false : currentStep === 3 },
    { n: 4, title: t("case.efile.steps.documents.title"), done: s4Done, Icon: Files, active: isSubmitted ? false : currentStep === 4 },
    { n: 5, title: t("case.efile.steps.review.title"), done: isSubmitted ? true : false, Icon: Eye, active: isSubmitted ? false : currentStep === 5 },
  ];
  const steps: Step[] = rawSteps.map((s) => ({
    ...s,
    pending: !s.done && !s.active && s.n < currentStep,
  }));

  const routes: Record<number, string> = { 1: "case-details", 2: "parties", 3: "lands", 4: "documents", 5: "review" };

  const handleClick = (n: number) => {
    router.push(`/case/e-file/${caseId}/${routes[n]}`);
    onMobileOpenChange(false);
  };

  const cardCls = (s: Step) =>
    `relative rounded-lg px-3 py-2 flex flex-col gap-1.5 text-left border cursor-pointer transition-colors duration-300 ease-in-out ${
      s.active ? "bg-[#EFF3FF] dark:bg-[#1e2a4a] border-[#C9D6FF] dark:border-[#2f3f6a]" : s.done ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50" : s.pending ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-90"
    }`;

  const mobileCardCls = (s: Step) =>
    `w-full text-left relative rounded-lg px-2.5 py-2 flex gap-2.5 items-center border cursor-pointer transition-colors duration-300 ease-in-out ${
      s.active ? "bg-[#EFF3FF] dark:bg-[#1e2a4a] border-[#C9D6FF] dark:border-[#2f3f6a]" : s.done ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50" : s.pending ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 opacity-90"
    }`;

  const Desktop = (
    <div className="hidden lg:block space-y-2 pb-2">
      <p className="text-sm font-medium text-muted-foreground px-1 pb-2">Step {currentStep} of 5</p>
      <div className="grid grid-cols-5 gap-4">
        {steps.map((s) => (
          <button key={s.n} type="button" onClick={() => handleClick(s.n)} className={cardCls(s)}>
            <div className="flex items-center justify-between w-full">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${s.active ? "bg-[#EFF3FF] dark:bg-[#1e2a4a] border-[#C9D6FF] dark:border-[#2f3f6a] text-[#2F4FA2] dark:text-[#8AA6E0]" : s.done ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400" : s.pending ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-400" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"}`}><s.Icon className="h-3.5 w-3.5" /></div>
                  {s.active ? <span className="h-5 w-5 rounded-full bg-[#2F4FA2] dark:bg-[#8AA6E0] text-white dark:text-[#1e2a4a] flex items-center justify-center shrink-0"><Clock className="h-3 w-3" /></span> : s.done ? <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></span> : s.pending ? <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0"><AlertCircle className="h-3 w-3" /></span> : <span className="h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center"><Circle className="h-3 w-3 text-zinc-400" /></span>}
            </div>
            <p className={`text-xs font-semibold leading-tight line-clamp-2 min-h-[24px] flex items-end ${s.active ? "text-[#2F4FA2] dark:text-[#8AA6E0]" : s.done ? "text-emerald-800 dark:text-emerald-300" : s.pending ? "text-amber-700 dark:text-amber-300" : "text-zinc-600 dark:text-zinc-400"}`}>{s.title}</p>
          </button>
        ))}
      </div>

    </div>
  );

  return (
    <>
      <CustomSheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <CustomSheetHeader className="px-6 py-4 border-b shrink-0">
          <p className="text-base font-semibold">Step {currentStep} of 5</p>
        </CustomSheetHeader>
        <CustomSheetBody className="px-6 py-4 space-y-2">
          {steps.map((s) => (
            <button key={s.n} type="button" onClick={() => handleClick(s.n)} className={mobileCardCls(s)}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${s.active ? "bg-[#EFF3FF] dark:bg-[#1e2a4a] border-[#C9D6FF] dark:border-[#2f3f6a] text-[#2F4FA2] dark:text-[#8AA6E0]" : s.done ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400" : s.pending ? "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-400" : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400"}`}><s.Icon className="h-3.5 w-3.5" /></div>
              <p className={`text-sm font-semibold leading-none truncate flex-1 text-left ${s.active ? "text-[#2F4FA2] dark:text-[#8AA6E0]" : s.done ? "text-emerald-800 dark:text-emerald-300" : s.pending ? "text-amber-700 dark:text-amber-300" : "text-zinc-600 dark:text-zinc-400"}`}>{s.title}</p>
              {s.active ? <span className="h-5 w-5 rounded-full bg-[#2F4FA2] dark:bg-[#8AA6E0] text-white dark:text-[#1e2a4a] flex items-center justify-center shrink-0"><Clock className="h-3 w-3" /></span> : s.done ? <span className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"><Check className="h-3 w-3" /></span> : s.pending ? <span className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0"><AlertCircle className="h-3 w-3" /></span> : <span className="h-5 w-5 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shrink-0 flex items-center justify-center"><Circle className="h-3 w-3 text-zinc-400" /></span>}
            </button>
          ))}
        </CustomSheetBody>
        <CustomSheetFooter className="px-6 py-3">
          <Button type="button" variant="outline" onClick={() => router.push("/manage/cases")} className="w-full">{t("case.details.exit_btn")}</Button>
        </CustomSheetFooter>
      </CustomSheet>
      {Desktop}
    </>
  );
}

export function EFileStepperDesktop(props: { currentStep: number; isSubmitted: boolean; caseId: string }) {
  return <EFileStepper currentStep={props.currentStep} isSubmitted={props.isSubmitted} caseId={props.caseId} mobileOpen={false} onMobileOpenChange={() => {}} />;
}
