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
import { useSupportMasterList } from "../query";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { Plus, Pencil, Eye } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-Input";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface EscalationData {
  id: string;
  code: string;
  name: string;
  name_en: string;
  level_number: number;
  display_order: number;
  is_active: boolean;
  is_display: boolean;
}

export default function SupportEscalationLevelsPage() {
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

  const data = useSupportMasterList("support-escalation-levels", {
    ...query,
  });

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 650,
    height = 750,
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
      if (event.data === "REFRESH_SUPPORT_MASTER_LIST") {
        data.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [data]);

  const handleOpenAdd = () => {
    openCenteredPopup(
      "/action/support/escalation-levels/add",
      "Add Escalation Level",
    );
  };

  const handleOpenEdit = (id: string) => {
    openCenteredPopup(
      `/action/support/escalation-levels/edit?id=${id}`,
      "Edit Escalation Level",
    );
  };

  const handleOpenView = (id: string) => {
    openCenteredPopup(
      `/action/support/escalation-levels/view?id=${id}`,
      "View Escalation Level",
    );
  };

  const columns: ColumnDef<EscalationData>[] = [
    {
      accessorKey: "code",
      header: t("table.code") || "Code",
    },
    {
      accessorKey: "name_en",
      header: t("table.name") || "Level Name",
      cell: ({ row }) => {
        return (
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {getLabel(row.original, lang)}
          </span>
        );
      },
    },
    {
      accessorKey: "level_number",
      header: "Level Depth",
      cell: ({ row }) => {
        return (
          <span className="font-bold text-purple-700 dark:text-purple-300">
            L{row.original.level_number} Tier
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: t("table.status") || "Status",
      cell: ({ row }) => {
        const value = row.original.is_active;
        return (
          <StatusBadge variant={value ? "success" : "neutral"}>
            {value
              ? t("common.active") || "Active"
              : t("common.inactive") || "Inactive"}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "is_display",
      header: t("table.visibility") || "Visibility",
      cell: ({ row }) => {
        const value = row.original.is_display;
        return (
          <StatusBadge variant={value ? "info" : "neutral"}>
            {value
              ? t("common.visible") || "Visible"
              : t("common.hidden") || "Hidden"}
          </StatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: t("table.actions") || "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenView(row.original.id);
              }}
              title="View Details"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row.original.id);
              }}
              title="Edit"
            >
              <Pencil className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 px-4 py-2.5 md:py-0 h-auto md:h-14">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("page_tab.support_escalation_levels") ||
              "Support Escalation Levels"}
          </span>
        </div>

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
              placeholder="Search escalation level..."
              className="w-full md:w-64"
            />
          </div>
          <Button
            onClick={handleOpenAdd}
            variant="default"
            size="icon"
            className="h-8 w-8 shrink-0"
            title="Add Escalation Level"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as EscalationData[]}
          columns={columns}
          defaultPageSize={query.limit}
          onPaginationChange={(page, limit) => {
            setQuery({
              page: page,
              limit: limit,
            });
          }}
          paginationMeta={
            data.data?.result?.pagination as unknown as PaginationResponse
          }
          isError={data.isError}
          onRefetch={data.refetch}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
        />
      </div>
    </div>
  );
}
