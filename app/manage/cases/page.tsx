"use client";
import React from "react";
import { useTranslation } from "@/i18n";
import {
  Eye,
  Plus,
  Copy,
  Check,
  SlidersHorizontal,
  ArrowUpDown,
  Inbox,
  ServerCrash,
  RefreshCw,
  X,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { CaseFilterSheet } from "./case-filter-sheet";
import { CaseSortSheet } from "./case-sort-sheet";
import { CaseListData, getLabel, NumberParam, StringParam, useCaseList, useProfileDetail, resolveCaseRoute, caseRouteUrl, useQueryParams, withDefault } from '@/lib/query';

import { SearchInput } from "@/components/ui/search-Input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

import toast from "react-hot-toast";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
  SortingState,
  sortableHeader,
} from "@/components/ui/data-grid";

function CaseNumberCell({ caseNumber }: { caseNumber: string }) {
  const [copied, setCopied] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caseNumber);
      setCopied(true);
      toast.success("Case number copied to clipboard!");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy case number");
    }
  };

  return (
    <div className="flex items-center gap-2 pr-3 group/copy">
      <span className="font-medium text-foreground truncate">{caseNumber}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 transition-all duration-150 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-muted-foreground hover:text-foreground shrink-0"
        title="Copy case number"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}


function getOrderingField(columnId: string, lang: string): string {
  const isHi = lang === "hi";
  switch (columnId) {
    case "case_number":
      return "case_number";
    case "court_level":
      return isHi ? "court_level__name" : "court_level__name_en";
    case "court_name":
      return isHi ? "court__name" : "court__name_en";
    case "case_nature":
      return isHi ? "case_nature__name" : "case_nature__name_en";
    case "act":
      return isHi ? "act__name" : "act__name_en";
    case "case_stage":
      return "current_stage__display_order";
    case "status":
      return "current_status__display_order";
    case "pendency":
      return "created_at";
    case "created_at":
      return "created_at";
    case "updated_at":
      return "updated_at";
    default:
      return columnId;
  }
}

function getColumnIdForField(field: string): string | null {

  const map: Record<string, string> = {
    case_number: "case_number",
    court_level__name: "court_level",
    court_level__name_en: "court_level",
    court__name: "court_name",
    court__name_en: "court_name",
    case_nature__name: "case_nature",
    case_nature__name_en: "case_nature",
    legacy_act_name: "act",
    act__name: "act",
    act__name_en: "act",
    current_stage__display_order: "case_stage",
    current_stage: "case_stage",
    current_status__display_order: "status",
    current_status: "status",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  return map[field] ?? null;
}

function sortingToOrdering(
  sorting: SortingState,
  lang: string,
): string | undefined {
  if (!sorting.length) return undefined;
  return (
    sorting
      .map((s) => {
        if (s.id === "pendency") {

          return `pendency:${s.desc ? "desc" : "asc"}`;
        }
        const field = getOrderingField(s.id, lang);
        return s.desc ? `-${field}` : field;
      })
      .filter((v) => !v.startsWith("pendency:"))
      .join(",") || undefined
  );
}

function orderingToSorting(ordering: string | undefined): SortingState {
  if (!ordering) return [];

  if (ordering.includes("pendency:")) {
    const m = ordering.match(/pendency:(asc|desc)/);
    if (m) return [{ id: "pendency", desc: m[1] === "desc" }];
  }
  return ordering
    .split(",")
    .map((part) => {
      const raw = part.trim();
      if (!raw) return null;
      if (raw.startsWith("pendency:")) return null;
      const desc = raw.startsWith("-");
      const field = desc ? raw.slice(1) : raw;
      const colId = getColumnIdForField(field);
      if (!colId) return null;
      return { id: colId, desc };
    })
    .filter(Boolean) as SortingState;
}

function CourtCasesList() {
  const canFileCase = true;
  const { t, lang } = useTranslation();
  const { data: profileData } = useProfileDetail();
  const userRole =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    (profileData as any)?.data?.user?.role ||
    "";

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 50),
    search: withDefault(StringParam, ""),
    ordering: withDefault(StringParam, "-created_at"),
    court_level: withDefault(StringParam, ""),
    case_nature: withDefault(StringParam, ""),
    mandal_code: withDefault(StringParam, ""),
    district_code_census: withDefault(StringParam, ""),
    tehsil_code_census: withDefault(StringParam, ""),
    court: withDefault(StringParam, ""),
    act: withDefault(StringParam, ""),
    section: withDefault(StringParam, ""),
    stage: withDefault(StringParam, ""),
    status: withDefault(StringParam, ""),
    created_from: withDefault(StringParam, ""),
    created_to: withDefault(StringParam, ""),
  });

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);

  const activeFilterCount = React.useMemo(() => {
    let c = 0;
    if (query.court_level) c++;
    if (query.case_nature) c++;
    if (query.mandal_code) c++;
    if (query.district_code_census) c++;
    if (query.tehsil_code_census) c++;
    if (query.court) c++;
    if (query.act) c++;
    if (query.section) c++;
    if (query.stage) c++;
    if (query.status) c++;
    if (query.created_from) c++;
    if (query.created_to) c++;
    return c;
  }, [
    query.court_level,
    query.case_nature,
    query.mandal_code,
    query.district_code_census,
    query.tehsil_code_census,
    query.court,
    query.act,
    query.section,
    query.stage,
    query.status,
    query.created_from,
    query.created_to,
  ]);

  const hasActiveFilters = !!query.search || activeFilterCount > 0;

  const handleClearFilters = () => {
    setQuery({
      ...query,
      search: "",
      court_level: undefined,
      case_nature: undefined,
      mandal_code: undefined,
      district_code_census: undefined,
      tehsil_code_census: undefined,
      court: undefined,
      act: undefined,
      section: undefined,
      stage: undefined,
      status: undefined,
      created_from: undefined,
      created_to: undefined,
      page: 1,
    });
  };

  const sorting: SortingState = React.useMemo(
    () => orderingToSorting(query.ordering),
    [query.ordering],
  );

  const handleSortingChange = React.useCallback(
    (next: SortingState) => {
      const isPendency = next[0]?.id === "pendency";
      if (isPendency) {
        const pendencyOrdering = `pendency:${next[0].desc ? "desc" : "asc"}`;
        setQuery({ ...query, ordering: pendencyOrdering, page: 1 });
        return;
      }
      const ordering = sortingToOrdering(next, lang);
      setQuery({
        ...query,
        ordering: ordering || "-created_at",
        page: 1,
      });
    },
    [query, lang, setQuery],
  );

  const backendOrdering = React.useMemo(() => {
    if (sorting[0]?.id === "pendency") {
      return sorting[0].desc ? "created_at" : "-created_at";
    }
    return sortingToOrdering(sorting, lang);
  }, [sorting, lang]);
  const caseListPayload: Record<string, any> = React.useMemo(() => {
    const p: Record<string, any> = {
      page: query.page,
      limit: query.limit,
      search: query.search || undefined,
      ordering: backendOrdering || "-created_at",
    };
    if (query.court_level) p["filters[court_level]"] = query.court_level;
    if (query.case_nature) p["filters[case_nature]"] = query.case_nature;
    if (query.mandal_code) p["filters[mandal_code]"] = query.mandal_code;
    if (query.district_code_census)
      p["filters[district_code_census]"] = query.district_code_census;
    if (query.tehsil_code_census)
      p["filters[tehsil_code_census]"] = query.tehsil_code_census;
    if (query.court) p["filters[court]"] = query.court;
    if (query.act) p["filters[act]"] = query.act;
    if (query.section) p["filters[section]"] = query.section;
    if (query.stage) p["filters[current_stage]"] = query.stage;
    if (query.status) p["filters[current_status]"] = query.status;
    if (query.created_from)
      p["filters[created_at__gte]"] = `${query.created_from}T00:00:00`;
    if (query.created_to)
      p["filters[created_at__lte]"] = `${query.created_to}T23:59:59`;
    return p;
  }, [
    query.page,
    query.limit,
    query.search,
    backendOrdering,
    query.court_level,
    query.case_nature,
    query.mandal_code,
    query.district_code_census,
    query.tehsil_code_census,
    query.court,
    query.act,
    query.section,
    query.stage,
    query.status,
    query.created_from,
    query.created_to,
  ]);

  const caseList = useCaseList(caseListPayload);

  const sortedData = (caseList.data?.result?.data ?? []) as CaseListData[];

  const onCaseInit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    window.open("/case/e-file", "_blank");
  };

  const isTrueEmpty =
    !caseList.isLoading &&
    !caseList.isError &&
    sortedData.length === 0 &&
    !hasActiveFilters &&
    !query.search;
  const isEmptyState =
    !caseList.isLoading && !caseList.isError && sortedData.length === 0;
  const isErrorState = !!caseList.isError;

  const columns: ColumnDef<CaseListData>[] = [
    {
      accessorKey: "case_number",
      header: sortableHeader<CaseListData>(t("table.case_number")),
      enableSorting: true,
      enablePinning: true,
      size: 250,
      minSize: 230,
      cell: ({ row }) => (
        <CaseNumberCell caseNumber={row.original.case_number} />
      ),
    },
    {
      id: "case_stage",
      header: sortableHeader<CaseListData>(t("table.case_stage")),
      enableSorting: true,
      cell: ({ row }) => {
        const curStage = row.original.current_stage_detail;
        if (curStage) {
          const variant =
            curStage.code === "FILING"
              ? "info"
              : curStage.code === "CLOSED"
                ? "success"
                : "warning";
          return (
            <StatusBadge variant={variant}>
              {getLabel(curStage, lang)}
            </StatusBadge>
          );
        }
        return "-";
      },
    },
    {
      id: "status",
      header: sortableHeader<CaseListData>(t("table.case_status")),
      enableSorting: true,
      cell: ({ row }) => {
        const curStatus = row.original.current_status_detail;
        const statusObj = curStatus
          ? {
              name: curStatus.name,
              name_en: curStatus.name_en || curStatus.name,
              code: curStatus.code,
            }
          : {
              name: row.original.legacy_status_name || "-",
              name_en: row.original.legacy_status_name_en || "-",
              code: row.original.legacy_status_id || "",
            };

        const statusNameEn = statusObj.name_en || statusObj.name;
        const norm = statusNameEn.toLowerCase();

        let variant: "success" | "error" | "warning" | "info" | "neutral" =
          "neutral";
        if (
          norm.includes("draft") ||
          norm.includes("pending") ||
          norm.includes("process") ||
          norm.includes("hearing") ||
          norm.includes("scheduled") ||
          norm.includes("adjourned") ||
          norm.includes("issued")
        ) {
          variant = "warning";
        } else if (
          norm.includes("filed") ||
          norm.includes("register") ||
          norm.includes("completed") ||
          norm.includes("passed") ||
          norm.includes("approved") ||
          norm.includes("paid") ||
          norm.includes("disposed") ||
          norm.includes("close") ||
          norm.includes("serve") ||
          norm.includes("final")
        ) {
          variant = "success";
        } else if (
          norm.includes("reject") ||
          norm.includes("fail") ||
          norm.includes("dismiss") ||
          norm.includes("objection") ||
          norm.includes("defect")
        ) {
          variant = "error";
        }

        return (
          <StatusBadge variant={variant}>
            {getLabel(statusObj, lang)}
          </StatusBadge>
        );
      },
    },
    {
      id: "pendency",
      header: sortableHeader<CaseListData>(
        t("case.timeline.days_since_initiated") ||
          t("case.timeline.pendency_alert") ||
          "Pendency",
      ),
      enableSorting: true,
      size: 120,
      minSize: 110,
      cell: ({ row }) => {
        const created = row.original.created_at;
        if (!created) return "-";
        const d = new Date(created);
        if (isNaN(d.getTime())) return "-";
        const days = differenceInDays(new Date(), d);
        const urgency =
          days > 30 ? "critical" : days > 14 ? "warning" : "normal";
        const label =
          days === 0
            ? t("case.timeline.today") || "Today"
            : days === 1
              ? `1 ${t("case.timeline.day") || "day"}`
              : `${days} ${t("case.timeline.days") || "days"}`;

        if (urgency === "critical") {
          return (
            <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 text-xs font-semibold dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/40">
              {label}
            </span>
          );
        }
        if (urgency === "warning") {
          return (
            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 text-xs font-semibold dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/40">
              {label}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 px-2.5 py-1 text-xs font-medium dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
            {label}
          </span>
        );
      },
    },
    {
      id: "court_level",
      header: sortableHeader<CaseListData>(t("table.court_level")),
      enableSorting: true,
      cell: ({ row }) => {
        const courtLevelDetail = row.original.court_level_detail;
        return courtLevelDetail ? getLabel(courtLevelDetail, lang) : "-";
      },
    },
    {
      id: "court_name",
      header: sortableHeader<CaseListData>(t("table.court_name")),
      enableSorting: true,
      cell: ({ row }) => {
        const courtDetail = row.original.court_detail;
        return courtDetail ? getLabel(courtDetail, lang) : "-";
      },
    },
    {
      id: "case_nature",
      header: sortableHeader<CaseListData>(t("table.case_nature")),
      enableSorting: true,
      cell: ({ row }) => getLabel(row.original.case_nature_detail, lang),
    },
    {
      id: "act",
      header: sortableHeader<CaseListData>(t("table.act")),
      enableSorting: true,
      cell: ({ row }) => {
        const actDetail = row.original.act_detail;
        if (actDetail) {
          return getLabel(actDetail, lang);
        }
        return row.original.legacy_act_name || "-";
      },
    },
    {
      accessorKey: "created_at",
      header: sortableHeader<CaseListData>(t("table.regDate")),
      enableSorting: true,
      cell: ({ row }) =>
        new Date(row.original.created_at).toLocaleDateString(
          lang === "hi" ? "hi-IN" : "en-IN",
        ),
    },
    {
      accessorKey: "updated_at",
      header: sortableHeader<CaseListData>(t("table.updated_at")),
      enableSorting: true,
      cell: ({ row }) => {
        const date = new Date(row.original.updated_at);
        return isNaN(date.getTime())
          ? "-"
          : date.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });
      },
    },
    {
      id: "actions",
      header: t("table.actions"),
      enableSorting: false,
      size: 90,
      minSize: 90,
      maxSize: 90,
      cell: ({ row }) => {
        return (
          <span
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 inline-flex items-center justify-center"
            onClick={() => {
              const stageCode =
                (row.original as any)?.current_stage_detail?.code ||
                (row.original as any)?.current_stage?.code ||
                (row.original as any)?.current_stage_detail?.name_en ||
                "";
              const statusCode =
                (row.original as any)?.current_status_detail?.code ||
                (row.original as any)?.current_status?.code ||
                (row.original as any)?.current_status_detail?.name_en ||
                "";
              const route = resolveCaseRoute(
                userRole,
                stageCode,
                statusCode,
              );
              const targetUrl = caseRouteUrl(
                route,
                row.original.case_number,
              );
              window.open(targetUrl, "_blank");
            }}
            title="View Details"
          >
            <Eye className="h-5 w-5" />
          </span>
        );
      },
    },
  ];

  if (isTrueEmpty) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <span className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            {t("court_menu.quick.cases.title") || "Cases"}
          </span>
          <Button
            onClick={onCaseInit}
            disabled={!canFileCase}
            variant="default"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            e-File
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full max-w-sm mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 mb-4">
              <Inbox className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {t("common_status.no_data.label") || "No data found"}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground mt-1.5">
              {t("common_status.no_data.description") ||
                "There's nothing to show right now."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isErrorState) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <span className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            {t("court_menu.quick.cases.title") || "Cases"}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full max-w-sm mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 dark:bg-destructive/15 text-destructive mb-4">
              <ServerCrash className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">
              {t("common_status.something_wrong.label") ||
                "Something went wrong"}
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground mt-1.5">
              {(caseList.error as any)?.response?.data?.message ||
                t("common_status.something_wrong.description") ||
                "We couldn't complete your request. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => caseList.refetch()}
              className="mt-5 h-8 gap-1.5 px-4 text-xs font-medium rounded-md"
            >
              <RefreshCw className="h-3 w-3" />
              {t("common_button.retry.label") || "Try Again"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      {}
      <div className="shrink-0 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-0 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
        {}
        <div className="flex items-center shrink-0">
          <span className="font-bold text-lg sm:text-xl lg:text-2xl text-foreground tracking-tight truncate">
            {t("court_menu.quick.cases.title") || "Cases"}
          </span>
        </div>

        {}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial min-w-0">
            <SearchInput
              onSearch={(value) =>
                setQuery({
                  ...query,
                  search: value,
                  page: 1,
                })
              }
              value={query.search ?? ""}
              placeholder={t("header.search_case") || "Search case number..."}
              className="w-full sm:w-64"
            />
          </div>
          {}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1.5 shrink-0 relative sm:hidden"
            onClick={() => setSortOpen(true)}
            title={t("sort.title") || "Sort"}
          >
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">
              {t("sort.title") || "Sort"}
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1.5 shrink-0 relative"
            onClick={() => setFilterOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">
              {t("common_button.filter.label") || "Filter"}
            </span>
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            onClick={onCaseInit}
            disabled={!canFileCase}
            variant="default"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            e-File
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={sortedData}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          defaultPageSize={query.limit}
          onPaginationChange={(page, limit) => {
            setQuery({
              ...query,
              page: page,
              limit: limit,
            });
          }}
          onFilterChange={(filters) => console.log("filters", filters)}
          paginationMeta={
            caseList.data?.result?.pagination as unknown as PaginationResponse
          }
          isLoading={caseList.isLoading}
          isFetching={caseList.isFetching}
          isError={caseList.isError}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (caseList.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={caseList.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          clearFiltersLabel={
            t("common_button.clear_filter.label") || "Clear Filters"
          }
        />
      </div>

      <CaseFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        query={query}
        setQuery={setQuery}
      />
      <CaseSortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
}

export default CourtCasesList;
