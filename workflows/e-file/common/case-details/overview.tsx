"use client";

import { useParams } from "next/navigation";
import { useCaseDetail, getLabel } from "@/lib";
import { useTranslation } from "@/i18n";
import CaseDetailsTabs from "./case-details-tabs";
import { OverviewEditButton } from "./overview-edit";

export type OverviewProps = {
  data?: any;
  isLoading?: boolean;
  title?: string;
  overviewTitle?: string;
  hideTabs?: boolean;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground wrap-break-word">
        {value && String(value).trim() ? String(value) : "—"}
      </p>
    </div>
  );
}

export function Overview({
  data: propData,
  isLoading: propLoading,
  title,
  overviewTitle,
  hideTabs,
  tabsActiveTab,
  onTabsChange,
}: OverviewProps & {
  tabsActiveTab?: import("./case-details-tabs").TabKey;
  onTabsChange?: (k: import("./case-details-tabs").TabKey) => void;
}) {
  const { caseId } = useParams<{ caseId: string }>();
  const { t, lang } = useTranslation();
  const detail = useCaseDetail(caseId as string);
  const apiData = propData ?? detail.data?.result?.data;
  const isLoading = propLoading ?? detail.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" />
        <div className="h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700" />
      </div>
    );
  }

  if (!apiData) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("case.details.no_data") ?? "No case details found."}
      </p>
    );
  }

  const courtLevelLabel = apiData.court_level
    ? getLabel(apiData.court_level, lang)
    : "—";
  const caseNatureLabel = apiData.case_nature
    ? getLabel(apiData.case_nature, lang)
    : "—";
  const appealTypeLabel = apiData.appeal_type
    ? getLabel(apiData.appeal_type, lang)
    : "—";
  const courtLabel = apiData.court ? getLabel(apiData.court, lang) : "—";
  const actLabel = apiData.act ? getLabel(apiData.act, lang) : "—";
  const sectionLabel = apiData.section ? getLabel(apiData.section, lang) : "—";

  return (
    <div className="space-y-6">
      {}
      <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-3 bg-white dark:bg-zinc-900 text-sm font-semibold text-foreground border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
          <span>
            {overviewTitle ??
              t("case.details.case_overview") ??
              t("case.details.overview") ??
              "Overview"}
          </span>
          <OverviewEditButton />
        </div>
        <div className="p-6 grid md:grid-cols-2 gap-4">
          <Field
            label={t("case.details.case_number") ?? "Case Number"}
            value={apiData.case_number}
          />
          <Field
            label={
              t("case.details.offline_case_number") ?? "Offline Case Number"
            }
            value={apiData.offline_case_number}
          />
          <Field
            label={t("case.details.court_level")}
            value={courtLevelLabel}
          />
          <Field
            label={t("case.details.case_nature")}
            value={caseNatureLabel}
          />
          <Field
            label={t("case.details.appeal_type")}
            value={appealTypeLabel}
          />
          <Field
            label={t("case.details.state")}
            value={apiData.state_name || apiData.state_name_en || "उत्तराखण्ड"}
          />
          <Field label={t("case.details.mandal")} value={apiData.mandal_name} />
          <Field
            label={t("case.details.district")}
            value={apiData.district_name}
          />
          <Field
            label={t("case.details.tehsil")}
            value={apiData.tehsil_name || apiData.tehsil_name_en}
          />
          <Field label={t("case.details.court")} value={courtLabel} />
          <Field label={t("case.details.act")} value={actLabel} />
          <Field label={t("case.details.section")} value={sectionLabel} />
          <div className="md:col-span-2 pt-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {t("case.details.case_description")}
            </p>
            {apiData.description && String(apiData.description).trim() ? (
              <div
                className="text-sm text-foreground whitespace-pre-wrap wrap-break-word leading-relaxed rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-4"
                dangerouslySetInnerHTML={{ __html: apiData.description }}
              />
            ) : (
              <p className="text-sm font-medium text-foreground">—</p>
            )}
          </div>
        </div>
      </section>

      {}
      {!hideTabs && (
        <CaseDetailsTabs activeTab={tabsActiveTab} onTabChange={onTabsChange} />
      )}
    </div>
  );
}

export default Overview;
