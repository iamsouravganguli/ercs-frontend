"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/i18n";
import { CaseListData, getLabel, NumberParam, Pagination, StringParam, usePublicCaseList, useQueryParams, withDefault, useCourtLevelList, useCourtList, useCourtActMappingList, useCourtActWiseSectionMappingList, useDistrict, useTehsil, useVillage, useSessionCheck, useSignout } from '@/lib/query';
import { AutocompleteFieldWithoutRHF } from "@/components/ui/autocomplete-field-without-rhf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  StatusBadge,
  StatusVariant,
} from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SettingsDialogAuth } from "@/components/ui/settings-dialog-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PublicCaseDetailView } from "@/common/components/public-case-detail-view";
import { roleSwitch } from "@/utils/role";
import {
  Search,
  FileText,
  X,
  AlertCircle,
  Calendar,
  MapPin,
  Landmark,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  BookOpen,
  Scale,
  Sparkles,
  Building2,
  FolderOpen,
  SlidersHorizontal,
  ChevronDown,
  Settings,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  UserPlus,
  KeyRound,
  Loader2,
} from "lucide-react";


function SearchResultCard({
  caseItem,
  lang,
  t,
}: {
  caseItem: CaseListData;
  lang: string;
  t: any;
}) {
  const curStatus = caseItem.current_status_detail;
  const statusNameEn = curStatus
    ? curStatus.name_en || curStatus.name
    : caseItem.legacy_status_name_en || "";
  const statusName = getLabel(
    curStatus
      ? {
          name: curStatus.name,
          name_en: curStatus.name_en || curStatus.name,
        }
      : {
          name: caseItem.legacy_status_name || "-",
          name_en: caseItem.legacy_status_name_en || "-",
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


  const locationParts = [
    caseItem.district_name_en || caseItem.district_name,
    caseItem.tehsil_name_en || caseItem.tehsil_name,
    caseItem.village_name_en || caseItem.village_name,
  ].filter(Boolean);
  const locationBreadcrumb = locationParts.join(" › ");


  const actParts = [
    caseItem.legacy_act_name_en || caseItem.legacy_act_name,
    caseItem.legacy_section_name_en || caseItem.legacy_section_name
      ? `${t("case.details.section")} ${caseItem.legacy_section_name_en || caseItem.legacy_section_name}`
      : null,
  ].filter(Boolean);
  const actBreadcrumb = actParts.join(" › ");


  const regDate = new Date(caseItem.created_at).toLocaleDateString(
    lang === "hi" ? "hi-IN" : "en-IN",
    { year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <div className="group border-b border-border/50 pb-6 pt-4 hover:bg-muted/5 px-2 rounded-xl transition-all duration-200">
      <div className="flex flex-col space-y-2">
        {}
        <div className="flex items-center space-x-1.5 text-xs text-muted-foreground/80 truncate">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {t("publicSearch.card.rccmsCase")}
          </span>
          <span>›</span>
          {caseItem.legacy_court_name && (
            <>
              <span
                className="truncate max-w-[200px]"
                title={caseItem.legacy_court_name}
              >
                {caseItem.legacy_court_name}
              </span>
              <span>›</span>
            </>
          )}
          {locationParts.length > 0 && (
            <span className="truncate max-w-[200px]" title={locationBreadcrumb}>
              {locationBreadcrumb}
            </span>
          )}
        </div>

        {}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-lg sm:text-xl font-medium tracking-normal text-primary hover:underline hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">
            <a
              href={`/case/${caseItem.case_number}/public`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {caseItem.case_number}
            </a>
          </h2>
          {caseItem.offline_case_number && (
            <span className="text-[10px] font-mono font-medium text-muted-foreground/80 px-1.5 py-0.5 bg-muted rounded border border-border/40">
              {caseItem.offline_case_number}
            </span>
          )}
          <StatusBadge variant={statusVariant} className="ml-1">
            {statusName}
          </StatusBadge>
        </div>

        {}
        <p className="text-sm text-foreground/85 dark:text-foreground/75 leading-relaxed font-normal mt-1">
          <span className="text-muted-foreground/70 mr-1.5">{regDate} —</span>
          {getLabel(caseItem.case_nature_detail, lang) && (
            <>
              <strong>{t("case.details.case_nature")}:</strong>{" "}
              {getLabel(caseItem.case_nature_detail, lang)}.{" "}
            </>
          )}
          {actBreadcrumb && (
            <>
              <strong>{t("table.act")}:</strong> {actBreadcrumb}.{" "}
            </>
          )}
          {caseItem.village_name && (
            <>
              <strong>{t("location.village_name.label")}:</strong>{" "}
              {caseItem.village_name}.{" "}
            </>
          )}
          {caseItem.tehsil_name && (
            <>
              <strong>{t("location.tehsil_name.label")}:</strong>{" "}
              {caseItem.tehsil_name}.{" "}
            </>
          )}
          {(caseItem as any).description
            ? (caseItem as any).description
            : t("publicSearch.card.fallbackDescription", {
                court:
                  caseItem.legacy_court_name ||
                  t("publicSearch.card.fallbackCourt"),
                location:
                  locationBreadcrumb || t("publicSearch.card.fallbackLocation"),
              })}
        </p>

        {}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground/80 pt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
            {regDate}
          </span>
          {caseItem.legacy_court_name && (
            <span
              className="flex items-center gap-1 truncate max-w-[200px]"
              title={caseItem.legacy_court_name}
            >
              <Landmark className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              {caseItem.legacy_court_name}
            </span>
          )}
          {locationParts[0] && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
              {locationParts[0]}
            </span>
          )}
          <a
            href={`/case/${caseItem.case_number}/public`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-primary hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform"
          >
            {t("case.lands.view_details")}
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}


function SearchPagination({
  pagination,
  onPageChange,
}: {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  onPageChange: (page: number) => void;
}) {
  if (!pagination || pagination.total_pages <= 1) return null;

  const { page, total_pages, has_previous, has_next } = pagination;

  const pages = [];
  const maxButtons = 5;
  let start = Math.max(1, page - 2);
  const end = Math.min(total_pages, start + maxButtons - 1);
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center space-x-1.5 py-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={!has_previous}
        className="h-9 w-9 cursor-pointer"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {start > 1 && (
        <>
          <Button
            variant={page === 1 ? "default" : "outline"}
            className="h-9 w-9 px-0 cursor-pointer"
            onClick={() => onPageChange(1)}
          >
            1
          </Button>
          {start > 2 && (
            <span className="text-muted-foreground/60 px-1 font-medium select-none">
              ...
            </span>
          )}
        </>
      )}

      {pages.map((p) => (
        <Button
          key={p}
          variant={page === p ? "default" : "outline"}
          className="h-9 w-9 px-0 font-medium cursor-pointer"
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      {end < total_pages && (
        <>
          {end < total_pages - 1 && (
            <span className="text-muted-foreground/60 px-1 font-medium select-none">
              ...
            </span>
          )}
          <Button
            variant={page === total_pages ? "default" : "outline"}
            className="h-9 w-9 px-0 cursor-pointer"
            onClick={() => onPageChange(total_pages)}
          >
            {total_pages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={!has_next}
        className="h-9 w-9 cursor-pointer"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}


export default function SearchPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: sessionData } = useSessionCheck();
  const signoutMutation = useSignout();
  const logout = signoutMutation.mutate;
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (
      sessionData?.result?.data?.is_authenticated &&
      ["SUPER_ADMIN", "SA"].includes(
        sessionData.result.data.role?.toUpperCase() || "",
      )
    ) {
      router.replace("/administrator");
    }
  }, [sessionData, router]);

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, ""),
    searchType: withDefault(StringParam, "fulltext"),
    court_level: withDefault(StringParam, ""),
    court: withDefault(StringParam, ""),
    act: withDefault(StringParam, ""),
    section: withDefault(StringParam, ""),
    district_code_census: withDefault(StringParam, ""),
    tehsil_code_census: withDefault(StringParam, ""),
    village_code_census: withDefault(StringParam, ""),
    status: withDefault(StringParam, ""),
    created_at__gte: withDefault(StringParam, ""),
    created_at__lte: withDefault(StringParam, ""),
  });

  const [submittedQuery, setSubmittedQuery] = useState(() => ({ ...query }));
  const isDropdownChangeRef = useRef(false);


  const [searchInput, setSearchInput] = useState(query.search || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewState, setViewState] = useState<"landing" | "results">(
    query.search ||
      query.court_level ||
      query.court ||
      query.act ||
      query.section ||
      query.district_code_census ||
      query.tehsil_code_census ||
      query.village_code_census ||
      query.status ||
      query.created_at__gte ||
      query.created_at__lte
      ? "results"
      : "landing",
  );


  const [activeFilterTab, setActiveFilterTab] = useState<
    "court" | "location" | "acts" | "status"
  >("court");

  const hasQuery = !!(
    query.search ||
    query.court_level ||
    query.court ||
    query.act ||
    query.section ||
    query.district_code_census ||
    query.tehsil_code_census ||
    query.village_code_census ||
    query.status ||
    query.created_at__gte ||
    query.created_at__lte
  );

  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    if (hasQuery) {
      setViewState("results");
    }
  }, [hasQuery]);


  useEffect(() => {
    const focusInput = () => {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        try {
          inputRef.current.setSelectionRange(len, len);
        } catch (e) {

        }
      }
    };

    focusInput();
    const timer = setTimeout(focusInput, 50);
    return () => clearTimeout(timer);
  }, [viewState]);


  useEffect(() => {
    setSearchInput(query.search || "");
    if (isDropdownChangeRef.current) {
      isDropdownChangeRef.current = false;
    } else {
      setSubmittedQuery({ ...query });
    }
  }, [
    query.search,
    query.court_level,
    query.court,
    query.act,
    query.section,
    query.district_code_census,
    query.tehsil_code_census,
    query.village_code_census,
    query.status,
    query.created_at__gte,
    query.created_at__lte,
  ]);


  const courtLevelQuery = useCourtLevelList();
  const courtQuery = useCourtList(
    { "filters[level]": query.court_level || undefined },
    { enabled: !!query.court_level },
  );
  const courtActMappingQuery = useCourtActMappingList(
    { "filters[court]": query.court || undefined },
    { enabled: !!query.court },
  );
  const courtAndActWiseSectionQuery = useCourtActWiseSectionMappingList(
    {
      "filters[court]": query.court || undefined,
      "filters[act]": query.act || undefined,
    },
    { enabled: !!query.court && !!query.act },
  );

  const districtQuery = useDistrict();
  const tehsilQuery = useTehsil(query.district_code_census || undefined);
  const villageQuery = useVillage(query.tehsil_code_census || "");


  const getOptions = (
    queryObj: any,
    labelKey: string,
    valueKey: string,
    nestedField?: string,
  ) => {
    const list = Array.isArray(queryObj.data)
      ? queryObj.data
      : queryObj.data?.result?.data;
    if (!list || !Array.isArray(list)) return [];
    return list
      .map((item: any) => {
        const dataItem = nestedField ? item[nestedField] : item;
        if (!dataItem) return { label: "", value: "" };
        return {
          label:
            lang === "hi"
              ? dataItem.name || dataItem[labelKey]
              : dataItem[labelKey] || dataItem.name,
          value: String(dataItem[valueKey]),
        };
      })
      .filter((opt) => opt.value !== "");
  };

  const courtLevelOptions = getOptions(courtLevelQuery, "name_en", "id");
  const courtOptions = getOptions(courtQuery, "name_en", "id");
  const actOptions = getOptions(
    courtActMappingQuery,
    "name_en",
    "id",
    "act_detail",
  );
  const sectionOptions = getOptions(
    courtAndActWiseSectionQuery,
    "name_en",
    "id",
    "section_detail",
  );

  const districtOptions = (districtQuery.data ?? []).map((d: any) => ({
    label: d.district_name || d.district_name_en || "",
    value: String(d.district_code_census),
  }));

  const tehsilOptions = (tehsilQuery.data ?? []).map((t: any) => ({
    label: t.tehsil_name || t.tehsil_name_en || "",
    value: String(t.tehsil_code_census),
  }));

  const villageOptions = (villageQuery.data ?? []).map((v: any) => ({
    label: v.vname || v.village_name || "",
    value: String(v.village_code_census),
  }));

  const statusOptions = [
    { label: t("announcement.news.filter_all"), value: "" },
    { label: t("case.payments.pending"), value: "Pending" },
    { label: t("publicSearch.statusOptions.disposed"), value: "Disposed" },
  ];


  const caseListPayload: any = {
    page: query.page,
    limit: query.limit,
  };

  if (submittedQuery.search) {
    caseListPayload.search = submittedQuery.search;
  }
  if (submittedQuery.court_level)
    caseListPayload["filters[court_level]"] = submittedQuery.court_level;
  if (submittedQuery.court)
    caseListPayload["filters[court]"] = submittedQuery.court;
  if (submittedQuery.act) caseListPayload["filters[act]"] = submittedQuery.act;
  if (submittedQuery.section)
    caseListPayload["filters[section]"] = submittedQuery.section;
  if (submittedQuery.district_code_census)
    caseListPayload["filters[district_code_census]"] =
      submittedQuery.district_code_census;
  if (submittedQuery.tehsil_code_census)
    caseListPayload["filters[tehsil_code_census]"] =
      submittedQuery.tehsil_code_census;
  if (submittedQuery.village_code_census)
    caseListPayload["filters[village_code_census]"] =
      submittedQuery.village_code_census;
  if (submittedQuery.status) {
    if (submittedQuery.status === "Pending") {
      caseListPayload["filters[legacy_status_name_en__icontains]"] = "Process";
    } else if (submittedQuery.status === "Disposed") {
      caseListPayload["filters[legacy_status_name_en__in]"] =
        "Case Closed,Final Order,Mutation Final Order,Case Rejected,Appeal Rejected,Case Revocation Rejected,Revision Case Rejected,Migrate Case Rejected,Punarvilokan Case Rejected,Sthanantaran Case Rejected,Punarsthapana Case Rejected,Sandarbh Case Rejected,Appeal Accepted,Case Revocation Accepted,Revision Case Accepted,Punarvilokan Case Accepted,Sandarbh Case Accepted,Punarsthapana Case Accepted,Sthanantaran Case Accepted,Mutation Case Accepted,Migrate Case Accepted";
    }
  }
  if (submittedQuery.created_at__gte)
    caseListPayload["filters[created_at__gte]"] =
      `${submittedQuery.created_at__gte}T00:00:00`;
  if (submittedQuery.created_at__lte)
    caseListPayload["filters[created_at__lte]"] =
      `${submittedQuery.created_at__lte}T23:59:59`;

  const caseList = usePublicCaseList(caseListPayload);
  const casesData = (caseList.data?.result?.data ?? []) as CaseListData[];
  const paginationInfo = caseList.data?.result?.pagination;

  const hasCourtActive = !!(query.court_level || query.court);
  const hasLocationActive = !!(
    query.district_code_census ||
    query.tehsil_code_census ||
    query.village_code_census
  );
  const hasActsActive = !!(query.act || query.section);
  const hasStatusActive = !!(
    query.status ||
    query.created_at__gte ||
    query.created_at__lte
  );
  const anyActive =
    hasCourtActive || hasLocationActive || hasActsActive || hasStatusActive;
  const isSearchInputValid = searchInput.trim().length >= 3;
  const isSearchDisabled =
    viewState === "landing"
      ? !isSearchInputValid
      : !anyActive && !isSearchInputValid;

  const todayStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSearchDisabled) return;
    setSubmittedQuery({
      ...query,
      search: searchInput.trim(),
    });
    setQuery({
      ...query,
      searchType: "fulltext",
      search: searchInput.trim(),
      page: 1,
    });
  };

  const handleClear = () => {
    setSearchInput("");
    const cleared = {
      page: 1,
      limit: 10,
      search: "",
      searchType: "fulltext",
      court_level: "",
      court: "",
      act: "",
      section: "",
      district_code_census: "",
      tehsil_code_census: "",
      village_code_census: "",
      status: "",
      created_at__gte: "",
      created_at__lte: "",
    };
    setSubmittedQuery(cleared);
    setQuery(cleared);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      court_level: "",
      court: "",
      act: "",
      section: "",
      district_code_census: "",
      tehsil_code_census: "",
      village_code_census: "",
      status: "",
      created_at__gte: "",
      created_at__lte: "",
    };
    setQuery({
      ...query,
      ...clearedFilters,
      page: 1,
    });
    setSubmittedQuery((prev: any) => ({
      ...prev,
      ...clearedFilters,
      page: 1,
    }));
  };

  const handleBackToHome = () => {
    setSearchInput("");
    const cleared = {
      page: 1,
      limit: 10,
      search: "",
      searchType: "fulltext",
      court_level: "",
      court: "",
      act: "",
      section: "",
      district_code_census: "",
      tehsil_code_census: "",
      village_code_census: "",
      status: "",
      created_at__gte: "",
      created_at__lte: "",
    };
    setSubmittedQuery(cleared);
    setQuery(cleared);
    setShowFilters(false);
    setViewState("landing");
    router.push("/search");
  };

  const renderFilterTabsRow = () => {
    const tabs = [
      {
        id: "court",
        label: t("publicSearch.filterTabs.courtLevel"),
        active: hasCourtActive,
      },
      {
        id: "location",
        label: t("publicSearch.filterTabs.location"),
        active: hasLocationActive,
      },
      {
        id: "acts",
        label: t("publicSearch.filterTabs.acts"),
        active: hasActsActive,
      },
      {
        id: "status",
        label: t("publicSearch.filterTabs.status"),
        active: hasStatusActive,
      },
    ] as const;

    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1.5 no-scrollbar scroll-smooth flex-1 min-w-0">
        {tabs.map((tab) => {
          const isSelected = activeFilterTab === tab.id;
          const isActive = tab.active;

          let tabClasses = "";
          if (isSelected) {
            tabClasses =
              "bg-zinc-100 dark:bg-zinc-800 border-zinc-250 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-3xs";
          } else {
            tabClasses = isActive
              ? "bg-zinc-200/85 dark:bg-zinc-800/85 border-zinc-400 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-50"
              : "bg-white/90 dark:bg-zinc-900/90 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300";
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilterTab(tab.id)}
              className={`flex items-center justify-center h-7 px-2.5 rounded-full text-[10px] font-semibold transition-all shrink-0 border cursor-pointer select-none ${tabClasses}`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderFilterCard = () => {
    return (
      <div className="w-full bg-transparent border-none shadow-none p-0 mt-2 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
        {activeFilterTab === "court" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200 min-w-0">
            {}
            <div className="flex flex-col w-full min-w-0">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden">
                <select
                  value={query.court_level || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      court_level: e.target.value,
                      court: "",
                      act: "",
                      section: "",
                    });
                  }}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.levelAll")}
                  </option>
                  {courtLevelOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Level: {opt.label}
                    </option>
                  ))}
                </select>
                {query.court_level && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        court_level: "",
                        court: "",
                        act: "",
                        section: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {}
            <div className="flex flex-col w-full min-w-0">
              <div
                className={`relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden ${
                  !query.court_level ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <select
                  value={query.court || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      court: e.target.value,
                      act: "",
                      section: "",
                    });
                  }}
                  disabled={!query.court_level}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.courtAll")}
                  </option>
                  {courtOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Court: {opt.label}
                    </option>
                  ))}
                </select>
                {query.court && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        court: "",
                        act: "",
                        section: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {activeFilterTab === "location" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200 min-w-0">
            {}
            <div className="flex flex-col w-full min-w-0">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden">
                <select
                  value={query.district_code_census || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      district_code_census: e.target.value,
                      tehsil_code_census: "",
                      village_code_census: "",
                    });
                  }}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.districtAll")}
                  </option>
                  {districtOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      District: {opt.label}
                    </option>
                  ))}
                </select>
                {query.district_code_census && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        district_code_census: "",
                        tehsil_code_census: "",
                        village_code_census: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {}
            <div className="flex flex-col w-full min-w-0">
              <div
                className={`relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden ${
                  !query.district_code_census
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <select
                  value={query.tehsil_code_census || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      tehsil_code_census: e.target.value,
                      village_code_census: "",
                    });
                  }}
                  disabled={!query.district_code_census}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.tehsilAll")}
                  </option>
                  {tehsilOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Tehsil: {opt.label}
                    </option>
                  ))}
                </select>
                {query.tehsil_code_census && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        tehsil_code_census: "",
                        village_code_census: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {}
            <div className="flex flex-col w-full min-w-0">
              <div
                className={`relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden ${
                  !query.tehsil_code_census
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <select
                  value={query.village_code_census || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      village_code_census: e.target.value,
                    });
                  }}
                  disabled={!query.tehsil_code_census}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-955"
                  >
                    {t("publicSearch.filters.villageAll")}
                  </option>
                  {villageOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Village: {opt.label}
                    </option>
                  ))}
                </select>
                {query.village_code_census && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        village_code_census: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {activeFilterTab === "acts" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200 min-w-0">
            {}
            <div className="flex flex-col w-full min-w-0">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden">
                <select
                  value={query.act || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      act: e.target.value,
                      section: "",
                    });
                  }}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.actAll")}
                  </option>
                  {actOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Act: {opt.label}
                    </option>
                  ))}
                </select>
                {query.act && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        act: "",
                        section: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {}
            <div className="flex flex-col w-full min-w-0">
              <div
                className={`relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden ${
                  !query.act ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <select
                  value={query.section || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      section: e.target.value,
                    });
                  }}
                  disabled={!query.act}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option
                    value=""
                    className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                  >
                    {t("publicSearch.filters.sectionAll")}
                  </option>
                  {sectionOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Section: {opt.label}
                    </option>
                  ))}
                </select>
                {query.section && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        section: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {activeFilterTab === "status" && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200 min-w-0">
            {}
            <div className="flex flex-col w-full min-w-0">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full max-w-full min-w-0 h-8 shadow-3xs overflow-hidden">
                <select
                  value={query.status || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      status: e.target.value,
                    });
                  }}
                  className="w-full min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer appearance-none focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-10 truncate"
                >
                  {statusOptions.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900"
                    >
                      Status: {opt.label}
                    </option>
                  ))}
                </select>
                {query.status && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        status: "",
                      });
                    }}
                    className="absolute right-7 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronDown className="absolute right-3 h-4 w-4 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            {}
            <div className="flex flex-col w-full">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full h-8 shadow-3xs">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none mr-1.5 shrink-0">
                  {t("publicSearch.filters.from")}
                </span>
                <input
                  type="date"
                  value={query.created_at__gte || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      created_at__gte: e.target.value,
                    });
                  }}
                  max={query.created_at__lte || todayStr}
                  className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-14"
                />
                {query.created_at__gte && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        created_at__gte: "",
                      });
                    }}
                    className="absolute right-8 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="flex flex-col w-full">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-0.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-200 w-full h-8 shadow-3xs">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 select-none mr-1.5 shrink-0">
                  {t("publicSearch.filters.to")}
                </span>
                <input
                  type="date"
                  value={query.created_at__lte || ""}
                  onChange={(e) => {
                    isDropdownChangeRef.current = true;
                    setQuery({
                      ...query,
                      created_at__lte: e.target.value,
                    });
                  }}
                  min={query.created_at__gte || undefined}
                  max={todayStr}
                  className="flex-1 min-w-0 h-full bg-transparent border-none outline-none text-xs font-semibold cursor-pointer focus:ring-0 p-0 text-zinc-800 dark:text-zinc-200 pr-14"
                />
                {query.created_at__lte && (
                  <button
                    type="button"
                    onClick={() => {
                      isDropdownChangeRef.current = true;
                      setQuery({
                        ...query,
                        created_at__lte: "",
                      });
                    }}
                    className="absolute right-8 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {}
        <div className="flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/50 pt-4 mt-2">
          <div className="text-[11px] font-medium text-zinc-450 dark:text-zinc-500 flex items-center gap-1.5 select-none">
            {anyActive ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
                <span>{t("publicSearch.filters.activeHint")}</span>
              </>
            ) : (
              <span>{t("publicSearch.filters.noActive")}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {}
            {anyActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center justify-center gap-1 h-7 px-3 rounded-full border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 text-[10px] font-semibold transition-all shrink-0 cursor-pointer select-none animate-in fade-in duration-200 shadow-3xs hover:shadow-2xs"
                title="Clear all active filters"
              >
                <X className="h-3 w-3 shrink-0" />
                {t("publicSearch.filters.clear")}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


  if (viewState === "landing") {
    return (
      <div className="container mx-auto px-4 min-h-[80vh] flex flex-col items-center justify-center max-w-4xl -mt-6">
        <div className="w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-300">
          {}
          <div className="flex flex-col items-center space-y-4">
            <div
              className="h-16 w-16 relative flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => router.push("/")}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <div className="space-y-1">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {t("brand.title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                {t("brand.subtitle")}
              </p>
            </div>
          </div>

          {}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-5xl mx-auto space-y-4"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 w-full">
              {}
              <div className="flex-1 flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-md hover:shadow-lg focus-within:shadow-lg focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 pl-4 pr-0.5 sm:pl-5 sm:pr-1 py-1 h-10 sm:h-12">
                <input
                  ref={inputRef}
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("publicSearch.placeholder.landing")}
                  className="flex-1 bg-transparent border-none outline-none text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-base h-full min-w-0"
                />

                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 transition-colors"
                    >
                      <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSearchDisabled}
                    className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shadow-sm transition-all duration-200 shrink-0 ${
                      isSearchDisabled
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                    }`}
                    title={t("search.title")}
                  >
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              {}
              <button
                type="button"
                onClick={() => {
                  setShowFilters(true);
                  setViewState("results");
                }}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-550 dark:text-zinc-455 shadow-md hover:shadow-lg"
                title={t("publicSearch.filters.toggleFilters")}
              >
                <SlidersHorizontal className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  return (
    <div className="w-full min-h-screen">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          position: absolute;
          right: 8px;
          cursor: pointer;
        }
      `,
        }}
      />
      {}
      <div className="sticky top-0 z-40 w-full">
        {}
        <div
          className={`bg-white dark:bg-zinc-900 w-full px-4 transition-all duration-350 ease-in-out ${
            isScrolled ? "py-2.5 shadow-3xs" : "py-4"
          } ${
            showFilters
              ? "border-b border-border/30"
              : "border-b border-transparent"
          }`}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-4 w-full">
            {}
            <div
              className="cursor-pointer relative flex items-center justify-center h-7 w-7 sm:h-9 sm:w-9"
              onClick={handleBackToHome}
            >
              <Image
                src="/logo.png"
                alt="Logo"
                width={36}
                height={36}
                className="object-contain w-full h-full"
              />
            </div>

            {}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 animate-in fade-in duration-200 w-full"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 w-full">
                {}
                <div className="flex-1 flex items-center bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-2xs hover:shadow-xs focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300 pl-3.5 pr-0.5 py-0.5 sm:pl-4 sm:pr-1 sm:py-1 h-9 sm:h-10">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t("search.placeholder")}
                    className="flex-1 bg-transparent border-none outline-none text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm h-full min-w-0"
                  />

                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    {searchInput && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="p-0.5 sm:p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 transition-colors"
                      >
                        <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isSearchDisabled}
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shadow-xs transition-all duration-200 shrink-0 ${
                        isSearchDisabled
                          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed shadow-none"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
                      }`}
                      title={t("search.title")}
                    >
                      <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    </button>
                  </div>
                </div>

                {}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 border shadow-2xs hover:shadow-xs ${
                    showFilters
                      ? "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                  title={t("publicSearch.filters.toggleFilters")}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>

                {}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="shrink-0 h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center outline-none overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer">
                      <Avatar className="h-full w-full">
                        <AvatarFallback className="text-xs font-bold bg-white text-primary dark:bg-zinc-900 dark:text-white flex items-center justify-center h-full w-full">
                          {signoutMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary dark:text-white" />
                          ) : sessionData?.result?.data?.is_authenticated &&
                            sessionData?.result?.data?.username ? (
                            sessionData.result?.data?.username
                              ?.charAt(0)
                              .toUpperCase()
                          ) : (
                            <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56">
                    {sessionData?.result?.data?.is_authenticated && (
                      <>
                        <DropdownMenuLabel className="font-normal pb-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {sessionData.result?.data?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t("header.signed_in")}
                          </p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              roleSwitch(sessionData.result?.data?.role || ""),
                            )
                          }
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          {t("header.dashboard")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push("/identity/profile/details")
                          }
                        >
                          <User className="mr-2 h-4 w-4" />
                          {t("header.my_account")}
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Settings className="mr-2 h-4 w-4" />
                      {t("header.preferences")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {sessionData?.result?.data?.is_authenticated ? (
                      <DropdownMenuItem
                        onClick={() => logout()}
                        disabled={signoutMutation.isPending}
                        className="text-destructive focus:text-destructive disabled:opacity-50"
                      >
                        {signoutMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="mr-2 h-4 w-4" />
                        )}
                        {t("header.signout")}
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push("/identity/signin?next=/search")
                          }
                        >
                          <LogIn className="mr-2 h-4 w-4" />
                          {t("header.signin")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push("/identity/signup")}
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          {t("header.signup")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push("/identity/reset-password")
                          }
                        >
                          <KeyRound className="mr-2 h-4 w-4" />
                          {t("header.reset_password")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </form>
          </div>
        </div>

        {}
        <div
          className={`grid transition-all duration-300 ease-in-out ${
            showFilters
              ? "grid-rows-[1fr] opacity-100 border-b border-border/30"
              : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div
              className={`bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur-xl w-full py-4 px-4 transition-all duration-300 ease-in-out ${
                isScrolled ? "shadow-3xs" : ""
              }`}
            >
              <div className="max-w-5xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  {renderFilterTabsRow()}
                </div>
                {renderFilterCard()}
                {}
                <div className="sm:hidden text-[10px] text-muted-foreground/60 text-center select-none mt-1">
                  {t("publicSearch.filters.swipeHint")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {}
        <div className="text-xs text-muted-foreground/80 pl-1">
          {caseList.isLoading
            ? t("publicSearch.results.fetching")
            : paginationInfo
              ? t("publicSearch.results.aboutResults", {
                  count: String(paginationInfo.count),
                })
              : ""}
        </div>

        {}
        <div className="w-full space-y-6">
          {!hasQuery ? (

            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-full bg-primary/10 text-primary animate-pulse">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("publicSearch.results.pressEnterTitle")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchInput.trim()
                  ? t("publicSearch.results.pressEnterDesc", {
                      query: searchInput.trim(),
                    })
                  : t("publicSearch.results.pressEnterDescNoQuery")}
              </p>
            </div>
          ) : caseList.isLoading ? (

            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-3 pb-6 border-b border-border/50"
                >
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : caseList.isError ? (

            <Card className="border-destructive/30 bg-destructive/5 text-destructive p-5 flex items-start gap-3 rounded-xl">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">
                  {t("publicSearch.results.errorTitle")}
                </h3>
                <p className="text-xs text-destructive-foreground opacity-90 leading-relaxed">
                  {(caseList.error as any)?.response?.data?.message ||
                    t("publicSearch.results.errorDesc")}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 cursor-pointer border-destructive/20 text-destructive hover:bg-destructive/10"
                  onClick={() => caseList.refetch()}
                >
                  {t("publicSearch.results.retry")}
                </Button>
              </div>
            </Card>
          ) : casesData.length === 0 ? (

            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4 border border-dashed rounded-2xl bg-muted/10">
              <div className="p-4 rounded-full bg-primary/10 text-primary">
                <FolderOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {t("publicSearch.results.noResultsTitle")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {t("publicSearch.results.noResultsDesc")}
              </p>
              <Button
                onClick={handleClearFilters}
                size="sm"
                variant="outline"
                className="cursor-pointer"
              >
                {t("publicSearch.filters.clear")}
              </Button>
            </div>
          ) : (

            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                {casesData.map((caseItem) => (
                  <SearchResultCard
                    key={caseItem.case_number}
                    caseItem={caseItem}
                    lang={lang}
                    t={t}
                  />
                ))}
              </div>

              {}
              <SearchPagination
                pagination={paginationInfo as any}
                onPageChange={(page) => {
                  setQuery({
                    ...query,
                    page: page,
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>
      <SettingsDialogAuth open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
