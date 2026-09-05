"use client";

import { useEffect, useRef } from "react";
import {
  useQueryParams,
  withDefault,
  NumberParam,
  StringParam,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { useUserList } from "../../query";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { Pencil, Filter, X, Eye, PanelLeft, Phone, User } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-Input";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface CitizenData {
  id: string | number;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  gender: string | null;
  gender_name: string | null;
  created_at: string;
  status?: string | number | null;
  status_name?: string | null;
  status_code?: string | null;
  status_detail?: {
    id: number;
    code: string;
    name: string;
    name_en: string | null;
  } | null;
  role_name?: string | null;
  role_code?: string | null;
}

export default function CitizenPage() {
  const { t, locale } = useTranslation();

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 520,
    height = 700,
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

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, ""),
    phone: withDefault(StringParam, undefined),
    email: withDefault(StringParam, undefined),
    created_at__gte: withDefault(StringParam, undefined),
    created_at__lte: withDefault(StringParam, undefined),
    is_active: withDefault(StringParam, undefined),
    status: withDefault(StringParam, undefined),
  });

  const { is_active, status, ...restQuery } = query;

  const data = useUserList({
    ...restQuery,
    search: query.search || undefined,
    "filters[role__code]": "CT",
    "filters[phone__icontains]": query.phone || undefined,
    "filters[email__icontains]": query.email || undefined,
    "filters[created_at__gte]": query.created_at__gte
      ? `${query.created_at__gte}T00:00:00`
      : undefined,
    "filters[created_at__lte]": query.created_at__lte
      ? `${query.created_at__lte}T23:59:59`
      : undefined,
    "filters[is_active]":
      query.is_active === "true" || query.is_active === "false"
        ? query.is_active
        : undefined,
    "filters[status]":
      query.status && query.status !== "true" && query.status !== "false"
        ? query.status
        : query.is_active &&
            query.is_active !== "true" &&
            query.is_active !== "false"
          ? query.is_active
          : undefined,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_USER_LIST") {
        data.refetch();
      } else if (event.data?.type === "APPLY_CITIZEN_FILTERS") {
        setQuery({
          ...query,
          ...event.data.filters,
          page: 1,
        });
      } else if (event.data?.type === "RESET_CITIZEN_FILTERS") {
        setQuery({
          ...query,
          phone: undefined,
          email: undefined,
          created_at__gte: undefined,
          created_at__lte: undefined,
          is_active: undefined,
          status: undefined,
          page: 1,
        });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data, query, setQuery]);

  const columns: ColumnDef<CitizenData>[] = [
    {
      accessorKey: "username",
      header: t("basicInfo.username") || "Username",
      cell: ({ row }) => {
        const val = row.getValue("username") as string;
        if (!val) return "-";
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-foreground transition-colors">
            <User className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
            <span>{val}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "name",
      header: t("basicInfo.name") || "Name",
    },

    {
      accessorKey: "phone",
      header: t("basicInfo.phone") || "Phone Number",
      cell: ({ row }) => {
        const val = row.getValue("phone") as string;
        if (!val) return "-";
        return (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-foreground transition-colors">
            <Phone className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
            <span>{val}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "gender",
      header: t("basicInfo.gender") || "Gender",
      cell: ({ row }) => {
        const val = row.original.gender_name || row.original.gender || "-";
        return <span className="capitalize">{val}</span>;
      },
    },
    {
      accessorKey: "role_name",
      header: t("basicInfo.role") || "Role",
    },
    {
      accessorKey: "is_active",
      header: t("table.status") || "Status",
      maxSize: 68,
      cell: ({ row }) => {
        const item = row.original;
        const variant =
          item.status_detail?.code === "USER_ACTIVE"
            ? "success"
            : item.status_detail?.code === "USER_PENDING"
              ? "warning"
              : item.status_detail?.code === "USER_SUSPENDED" ||
                  item.status_detail?.code === "USER_REJECTED"
                ? "error"
                : item.is_active
                  ? "success"
                  : "neutral";
        return (
          <StatusBadge variant={variant}>
            {item.status_detail
              ? locale === "hi"
                ? item.status_detail.name
                : item.status_detail.name_en || item.status_detail.name
              : item.is_active
                ? t("common.active") || "Active"
                : t("common.inactive") || "Inactive"}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: t("table.regDate") || "Reg Date",
      cell: ({ row }) => {
        const dateStr = row.getValue("created_at") as string;
        return dateStr ? new Date(dateStr).toLocaleDateString() : "-";
      },
    },
    {
      id: "actions",
      header: t("table.actions") || "Actions",
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
                  `/action/users/citizen/view?username=${item.username}`,
                  "View Citizen User",
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
                  `/action/users/citizen/edit?username=${item.username}`,
                  "Edit Citizen User",
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

  const hasFilters = !!(
    query.phone ||
    query.email ||
    query.created_at__gte ||
    query.created_at__lte ||
    query.is_active ||
    query.status
  );

  const hasActiveFilters = !!(query.search || hasFilters);
  const handleClearFilters = () => {
    setQuery({
      ...query,
      search: "",
      phone: undefined,
      email: undefined,
      created_at__gte: undefined,
      created_at__lte: undefined,
      is_active: undefined,
      status: undefined,
      page: 1,
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 px-4 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 py-2.5 md:py-0 h-auto md:h-14">
        {}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("page_tab.citizen_user") || "Citizen Users"}
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
                  page: 1,
                })
              }
              value={query.search ?? ""}
              placeholder={t("form.search.placeholder") || "Search..."}
              className="w-full md:w-64"
            />
          </div>
          <Button
            variant={hasFilters ? "secondary" : "outline"}
            size="icon"
            className="h-8 w-8 shrink-0 relative"
            title={t("common_button.filter.label") || "Filter"}
            aria-label={t("common_button.filter.label") || "Filter"}
            onClick={() => {
              const params = new URLSearchParams();
              if (query.phone) params.set("phone", query.phone);
              if (query.email) params.set("email", query.email);
              if (query.created_at__gte)
                params.set("created_at__gte", query.created_at__gte);
              if (query.created_at__lte)
                params.set("created_at__lte", query.created_at__lte);
              if (query.is_active) params.set("is_active", query.is_active);
              if (query.status) params.set("status", query.status);
              openCenteredPopup(
                `/action/users/citizen/filter?${params.toString()}`,
                "Filter Citizen Users",
                520,
                700,
              );
            }}
          >
            <Filter className="h-4 w-4" />
            {hasFilters && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as CitizenData[]}
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
