"use client";
import { useEffect, useRef } from "react";
import {
  useQueryParams,
  withDefault,
  NumberParam,
  getLabel,
  StringParam,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { useCourtList } from "./query";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { CourtData } from "./types";
import { Plus, Pencil, Eye, Scale, PanelLeft } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-Input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function CourtPage() {
  const { t, lang } = useTranslation();
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, ""),
  });
  const hasActiveFilters = !!query.search;
  const handleClearFilters = () => {
    setQuery({
      ...query,
      search: "",
      page: 1,
    });
  };

  const data = useCourtList({
    ...query,
    ordering: "display_order",
  });

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 600,
    height = 800,
  ) => {
    if (popupRef.current && !popupRef.current.closed) {
      if (popupUrlRef.current === url) {
        popupRef.current.focus();
        return;
      }
    }

    let left = 100;
    let top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }
    const name = title.replace(/\s+/g, "_");
    const win = window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (win) {
      popupRef.current = win;
      popupUrlRef.current = url;
      win.focus();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_COURT_LIST") {
        data.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [data]);

  const columns: ColumnDef<CourtData>[] = [
    {
      accessorKey: "code",
      header: t("table.code"),
    },
    {
      accessorKey: "name_of_court",
      header: t("table.court_name"),
      cell: ({ row }) => {
        return getLabel(row.original as CourtData, lang);
      },
    },
    {
      accessorKey: "display_order",
      header: t("table.display_order"),
    },
    {
      accessorKey: "is_active",
      header: t("table.status"),
      maxSize: 68,
      cell: ({ row }) => {
        const value = row.getValue("is_active") as boolean;
        return (
          <StatusBadge variant={value ? "success" : "neutral"}>
            {value ? t("common.active") : t("common.inactive")}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "is_display",
      header: t("table.visibility"),
      maxSize: 68,
      cell: ({ row }) => {
        const value = row.getValue("is_display") as boolean;
        return (
          <StatusBadge variant={value ? "info" : "neutral"}>
            {value ? t("common.visible") : t("common.hidden")}
          </StatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: t("table.actions"),
      maxSize: 100,
      cell: ({ row }) => {
        const item = row.original;

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="View"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                openCenteredPopup(
                  `/action/courts/view?id=${item.id}`,
                  "View Court",
                );
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                openCenteredPopup(
                  `/action/courts/edit?id=${item.id}`,
                  "Edit Court",
                );
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 px-4 py-2.5 md:py-0 h-auto md:h-14">
        {}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("page_tab.courts") || "Courts"}
          </span>
        </div>

        {}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex-1 md:flex-initial">
            <SearchInput
              onSearch={(value) =>
                setQuery({
                  ...query,
                  search: value,
                })
              }
              value={query.search ?? ""}
              placeholder={t("form.search_court.placeholder")}
              className="w-full md:w-64"
            />
          </div>
          <Button
            onClick={() => openCenteredPopup("/action/courts/add", "Add Court")}
            variant="default"
            size="icon"
            className="h-8 w-8 shrink-0"
            title={t("common_button.add.label") || "Add"}
            aria-label={t("common_button.add.label") || "Add"}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as CourtData[]}
          columns={columns}
          defaultPageSize={query.limit}
          onPaginationChange={(page, limit) => {
            setQuery({
              page: page,
              limit: limit,
            });
          }}
          onFilterChange={(filters) => console.log("filters", filters)}
          paginationMeta={
            data.data?.result?.pagination as unknown as PaginationResponse
          }
          isError={data.isError}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (data.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={data.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          clearFiltersLabel={
            t("common_button.clear_filter.label") || "Clear Filters"
          }
        />
      </div>
    </div>
  );
}
