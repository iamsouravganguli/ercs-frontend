"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTicketsList } from "./queries";
import { useSessionCheck, getLabel, useQueryParams, withDefault, NumberParam, StringParam } from '@/lib/query';
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-Input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
  SortingState,
  sortableHeader,
} from "@/components/ui/data-grid";
import {
  Plus,
  Copy,
  Check,
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Inbox,
  ServerCrash,
  RefreshCw,
  X,
} from "lucide-react";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { TicketCreateWorkflow } from "@/workflows/support/common/ticket-create-workflow";
import { TicketFilterSheet } from "@/workflows/support/common/ticket-filter-sheet";
import { TicketSortSheet } from "@/workflows/support/common/ticket-sort-sheet";


function TicketNumberCell({ ticketNumber }: { ticketNumber: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(ticketNumber);
      setCopied(true);
      toast.success("Ticket number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex items-center gap-2 group/copy">
      <span className="font-semibold text-foreground capitalize">
        {ticketNumber}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 transition-all duration-150 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-muted-foreground hover:text-foreground animate-none"
        title="Copy ticket number"
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

function getOrderingField(columnId: string): string {
  switch (columnId) {
    case "ticket_number":
      return "ticket_number";
    case "subject":
      return "subject";
    case "category":
      return "category";
    case "priority":
      return "priority";
    case "status":
      return "status";
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
    ticket_number: "ticket_number",
    subject: "subject",
    category: "category",
    priority: "priority",
    status: "status",
    created_at: "created_at",
    updated_at: "updated_at",
  };
  return map[field] ?? null;
}
function sortingToOrdering(sorting: SortingState): string | undefined {
  if (!sorting.length) return undefined;
  return sorting
    .map((s) =>
      s.desc ? `-${getOrderingField(s.id)}` : getOrderingField(s.id),
    )
    .join(",");
}
function orderingToSorting(ordering?: string): SortingState {
  if (!ordering) return [];
  return ordering
    .split(",")
    .map((part) => {
      const raw = part.trim();
      if (!raw) return null;
      const desc = raw.startsWith("-");
      const field = desc ? raw.slice(1) : raw;
      const colId = getColumnIdForField(field);
      if (!colId) return null;
      return { id: colId, desc };
    })
    .filter(Boolean) as SortingState;
}

export default function SupportHelpdeskPage() {
  const { t, lang } = useTranslation();
  const popupRef = useRef<Window | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const { data: Session } = useSessionCheck();
  const user = Session?.result?.data;


  const isCourtStaff = useMemo(() => {
    if (!user?.role) return false;
    const staffRoles = [
      "SUPER_ADMIN",
      "ADMIN",
      "RI",
      "RSI",
      "COURT_USER",
      "READER",
      "PESHKAR",
    ];
    return staffRoles.includes(user.role.toUpperCase());
  }, [user]);


  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, ""),
    ordering: withDefault(StringParam, "-created_at"),
    status: withDefault(StringParam, "ALL"),
    priority: withDefault(StringParam, "ALL"),
  });

  const sorting: SortingState = useMemo(
    () => orderingToSorting(query.ordering),
    [query.ordering],
  );
  const handleSortingChange = React.useCallback(
    (next: SortingState) => {
      const ordering = sortingToOrdering(next);
      setQuery({ ...query, ordering: ordering || "-created_at", page: 1 });
    },
    [query, setQuery],
  );


  const ticketsQuery = useTicketsList({
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    ordering: query.ordering || "-created_at",
    ...(query.status !== "ALL"
      ? { "filters[status__code]": query.status }
      : {}),
    ...(query.priority !== "ALL"
      ? { "filters[priority__code]": query.priority }
      : {}),
  });

  const rawTicketsData = (ticketsQuery.data?.result?.data ?? []) as any[];
  const isSupportEmpty =
    !ticketsQuery.isLoading &&
    !ticketsQuery.isError &&
    rawTicketsData.length === 0;
  const isSupportError = !!ticketsQuery.isError;


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_SUPPORT_TICKET_LIST") {
        ticketsQuery.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [ticketsQuery]);


  const handleOpenChat = (ticketNumber: string) => {
    const width = 800;
    const height = 750;
    let left = 100;
    let top = 100;

    if (typeof window !== "undefined") {
      const sX =
        window.screenLeft !== undefined ? window.screenLeft : window.screenX;
      const sY =
        window.screenTop !== undefined ? window.screenTop : window.screenY;
      const oW = window.innerWidth
        ? window.innerWidth
        : document.documentElement.clientWidth;
      const oH = window.innerHeight
        ? window.innerHeight
        : document.documentElement.clientHeight;

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

    const url = `/action/support/tickets/chat?ticket_number=${ticketNumber}`;
    const win = window.open(
      url,
      `Chat_${ticketNumber}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (win) {
      popupRef.current = win;
      win.focus();
    }
  };


  const handleOpenCreateTicket = () => setCreateOpen(true);
  const handleCreateSuccess = () => {
    setCreateOpen(false);
    ticketsQuery.refetch();
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: "ticket_number",
        accessorKey: "ticket_number",
        header: sortableHeader<any>(
          t("support.table.ticket_number") || "Ticket No.",
        ),
        enableSorting: true,
        enablePinning: true,
        size: 180,
        cell: ({ row }) => (
          <TicketNumberCell ticketNumber={row.original.ticket_number} />
        ),
      },
      {
        accessorKey: "subject",
        header: sortableHeader<any>(t("support.table.subject") || "Subject"),
        enableSorting: true,
        cell: ({ row }) => (
          <span
            className="font-semibold text-foreground truncate max-w-[280px] block capitalize"
            title={row.original.subject}
          >
            {row.original.subject}
          </span>
        ),
      },
      {
        id: "category",
        header: sortableHeader<any>(t("support.table.category") || "Category"),
        enableSorting: true,
        cell: ({ row }) => {
          const cat = row.original.category_detail;
          return cat ? (
            <span className="capitalize">{getLabel(cat, lang)}</span>
          ) : (
            "-"
          );
        },
      },
      {
        id: "priority",
        header: sortableHeader<any>(t("support.table.priority") || "Priority"),
        enableSorting: true,
        cell: ({ row }) => {
          const p = row.original.priority_detail;
          if (!p) return "-";
          const bg =
            (p as any).color_code ||
            (String(p.code).toUpperCase() === "HIGH"
              ? "#DD6B20"
              : String(p.code).toUpperCase() === "MEDIUM"
                ? "#3182CE"
                : String(p.code).toUpperCase() === "URGENT"
                  ? "#E53E3E"
                  : "#4A5568");
          return (
            <span
              className="text-[11px] font-semibold capitalize px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1"
              style={{
                backgroundColor: `${bg}15`,
                color: bg,
                borderColor: `${bg}30`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: bg }}
              />
              {getLabel(p, lang)}
            </span>
          );
        },
      },
      {
        id: "status",
        header: sortableHeader<any>(t("support.table.status") || "Status"),
        enableSorting: true,
        cell: ({ row }) => {
          const s = row.original.status_detail;
          if (!s) return "-";
          const color = (s as any).color_code;
          if (color) {
            return (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none capitalize"
                style={{
                  backgroundColor: `${color}14`,
                  color: color,
                  borderColor: `${color}30`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {getLabel(s, lang)}
              </span>
            );
          }
          const code = String(s.code || "").toUpperCase();
          const variant =
            code === "RESOLVED"
              ? "success"
              : code === "IN_PROGRESS"
                ? "info"
                : code === "CLOSED"
                  ? "neutral"
                  : "warning";
          return (
            <StatusBadge variant={variant} className="capitalize">
              {getLabel(s, lang)}
            </StatusBadge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: sortableHeader<any>(
          t("support.table.created_at") || "Created At",
        ),
        enableSorting: true,
        cell: ({ row }) =>
          new Date(row.original.created_at).toLocaleDateString(
            lang === "hi" ? "hi-IN" : "en-IN",
            { dateStyle: "medium" },
          ),
      },
      {
        accessorKey: "updated_at",
        header: sortableHeader<any>(
          t("support.table.updated_at") ||
            t("table.updated_at") ||
            "Updated At",
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const d = new Date(row.original.updated_at);
          return isNaN(d.getTime())
            ? "-"
            : d.toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              });
        },
      },
      {
        id: "actions",
        header: t("support.table.actions") || "Actions",
        size: 90,
        minSize: 90,
        maxSize: 90,
        cell: ({ row }) => (
          <span
            className="cursor-pointer text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 inline-flex items-center justify-center bg-muted/30 hover:bg-muted rounded-lg"
            onClick={() => handleOpenChat(row.original.ticket_number)}
            title="Open Chat Timeline"
          >
            <Eye className="h-5 w-5" />
          </span>
        ),
      },
    ],
    [lang, t],
  );

  const hasActiveFilters =
    !!query.search || query.status !== "ALL" || query.priority !== "ALL";

  const handleClearFilters = () => {
    setQuery({
      ...query,
      search: "",
      status: "ALL",
      priority: "ALL",
      page: 1,
    });
  };

  const activeFilterCount =
    (query.status !== "ALL" ? 1 : 0) + (query.priority !== "ALL" ? 1 : 0);
  const isTrueSupportEmpty = isSupportEmpty && !hasActiveFilters;

  if (isTrueSupportEmpty) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            {isCourtStaff
              ? t("court_menu.support_staff") || "Support & Help Management"
              : t("court_menu.support_citizen") || "Support & Help"}
          </h2>
          {!isCourtStaff && (
            <Button
              onClick={handleOpenCreateTicket}
              variant="default"
              size="sm"
              className="h-8 px-3 gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4 shrink-0" /> Create
            </Button>
          )}
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

        <TicketFilterSheet
          open={filterOpen}
          onOpenChange={setFilterOpen}
          query={query}
          setQuery={setQuery}
        />
        <TicketSortSheet
          open={sortOpen}
          onOpenChange={setSortOpen}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
        <CustomModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
        >
          <CustomModalBody className="p-0 h-full overflow-y-auto max-sm:rounded-none">
            <TicketCreateWorkflow
              onSuccess={handleCreateSuccess}
              onClose={() => setCreateOpen(false)}
              hideHeader={false}
            />
          </CustomModalBody>
        </CustomModal>
      </div>
    );
  }

  if (isSupportError) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            {isCourtStaff
              ? t("court_menu.support_staff") || "Support & Help Management"
              : t("court_menu.support_citizen") || "Support & Help"}
          </h2>
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
              {(ticketsQuery.error as any)?.response?.data?.message ||
                t("common_status.something_wrong.description") ||
                "We couldn't complete your request. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => ticketsQuery.refetch()}
              className="mt-5 h-8 gap-1.5 px-4 text-xs font-medium rounded-md"
            >
              <RefreshCw className="h-3 w-3" />{" "}
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
        <div className="flex items-center shrink-0">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            {isCourtStaff
              ? t("court_menu.support_staff") || "Support & Help Management"
              : t("court_menu.support_citizen") || "Support & Help"}
          </h2>
        </div>

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
              placeholder={t("header.search_ticket") || "Search Ticket..."}
              className="w-full sm:w-64"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 sm:px-3 gap-1.5 shrink-0 relative sm:hidden"
            onClick={() => setSortOpen(true)}
            title={t("sort.title") || "Sort"}
          >
            <ArrowUpDown className="h-4 w-4 shrink-0" />
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

          {!isCourtStaff && (
            <Button
              onClick={handleOpenCreateTicket}
              variant="default"
              size="sm"
              className="h-8 px-3 gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create
            </Button>
          )}
        </div>
      </div>

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={ticketsQuery.data?.result?.data ?? []}
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
            ticketsQuery.data?.result
              ?.pagination as unknown as PaginationResponse
          }
          isError={ticketsQuery.isError}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (ticketsQuery.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={ticketsQuery.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          clearFiltersLabel={
            t("common_button.clear_filter.label") || "Clear Filters"
          }
        />
      </div>

      <TicketFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        query={query}
        setQuery={setQuery}
      />
      <TicketSortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      <CustomModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
      >
        <CustomModalBody className="p-0 h-full overflow-y-auto max-sm:rounded-none">
          <TicketCreateWorkflow
            onSuccess={handleCreateSuccess}
            onClose={() => setCreateOpen(false)}
            hideHeader={false}
          />
        </CustomModalBody>
      </CustomModal>
    </div>
  );
}
