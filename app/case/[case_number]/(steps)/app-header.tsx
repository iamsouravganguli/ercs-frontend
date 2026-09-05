"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useParams } from "next/navigation";
import { useTranslation } from "@/i18n";
import { useCaseDetail } from "@/lib";

type Props = {
  role: string;
};

const subpathTitles: Record<string, string> = {
  "": "Case details",
  parties: "Party details",
  lands: "Land details",
  documents: "Documents",
  payments: "Fees payment",
  review: "Review & submit",
  timeline: "Case Progress",
  notices: "Issue notice",
  serve: "Serve notice",
  hearing: "Hearings",
  "hearing/adjourn": "Next date / Adjournment",
  "order/draft": "Orders",
  "order/final": "Finalize order",
  execution: "Execution / Compliance",
  close: "Case closure",
};

const subpathKeys: Record<string, string> = {
  "": "case.details.title",
  parties: "case.parties.title",
  lands: "case.lands.title",
  documents: "case.documents.title",
  payments: "case.payments.title",
  review: "case.review.title",
  timeline: "case.timeline.title",
  notices: "case.notices.title",
  serve: "case.serve.title",
  hearing: "case.hearing.title",
  "hearing/adjourn": "case.adjourn.title",
  "order/draft": "case.draft_order.title",
  "order/final": "case.finalize_order.title",
  execution: "case.execution.title",
  close: "case.closure.title",
};

export function AppHeader({ role }: Props) {
  const pathname = usePathname();
  const params = useParams();
  const { t } = useTranslation();

  const caseNumber = params?.case_number as string | undefined;
  const { data: caseDetailRes } = useCaseDetail(caseNumber as string);
  const caseData = caseDetailRes?.result?.data;
  const isSubmitted = caseData?.is_submitted === true;

  const segments = pathname ? pathname.split("/") : [];
  const subPath = segments.slice(3).join("/");
  const key = subpathKeys[subPath];

  let activeTitle = key ? t(key) : subpathTitles[subPath] || "Case details";
  if (subPath === "review" && isSubmitted) {
    activeTitle = t("case.review.title_submitted");
  } else if (subPath === "payments") {
    activeTitle =
      t("case.payments.case_transactions_title") ||
      t("case.payments.title") ||
      "Transactions";
  }

  return (
    <header className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-row items-center gap-3 px-4 h-14 shrink-0">
      <div className="flex items-center shrink-0 md:hidden">
        <SidebarTrigger />
      </div>

      <span className="font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight shrink-0">
        {activeTitle}
      </span>
    </header>
  );
}
