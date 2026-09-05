"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  PaginationState,
  HeaderContext,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ServerCrash,
  RefreshCw,
  Inbox,
  X,
} from "lucide-react";

import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Skeleton } from "./skeleton";
import { AppLoader } from "./app-loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export * from "@tanstack/react-table";
import { cn } from "@/lib/cn";
import { useTranslation } from "@/i18n";


export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  selectable?: boolean;
  onSelectionChange?: (rows: Row<TData>[]) => void;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  className?: string;
  paginationMeta?: PaginationResponse;
  onPaginationChange?: (page: number, limit: number) => void;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  onFilterChange?: (filters: ColumnFiltersState) => void;
  onGlobalFilterChange?: (filter: string) => void;
  isError?: boolean;
  isLoading?: boolean;
  isFetching?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  onRefetch?: () => void;
  refetchLabel?: string;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
}


export function selectionColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 36,
    maxSize: 36,
  };
}


export function sortableHeader<TData>(
  label: string,
): ColumnDef<TData>["header"] {
  function SortableHeaderCell({ column }: HeaderContext<TData, unknown>) {
    const sorted = column.getIsSorted();
    const isSorted = !!sorted;
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "-ml-3 h-8 gap-1 px-2 font-semibold text-[#2F4FA2] dark:text-[#8AA6E0] hover:bg-[#E2E8FF] dark:hover:bg-white/[0.08] hover:text-[#2F4FA2] dark:hover:text-[#8AA6E0] data-[state=open]:bg-accent",
          isSorted && "bg-[#E2E8FF] dark:bg-white/[0.08]",
        )}
        data-sorted={isSorted ? "true" : "false"}
        aria-sort={
          sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : "none"
        }
        onClick={() => column.toggleSorting(sorted === "asc")}
      >
        {label}
        {sorted === "asc" ? (
          <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" />
        ) : sorted === "desc" ? (
          <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" />
        ) : (
          <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 text-[#2F4FA2]/50 dark:text-[#8AA6E0]/50" />
        )}
      </Button>
    );
  }
  return SortableHeaderCell;
}


function normalizeColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
): ColumnDef<TData, TValue>[] {
  const colId = (c: ColumnDef<TData, TValue>) =>
    c.id ?? ("accessorKey" in c ? String(c.accessorKey) : undefined);
  const actionsCol = columns.find((c) => colId(c) === "actions");
  const rest = columns.filter((c) => colId(c) !== "actions");

  if (!actionsCol) return rest;

  const pinned: ColumnDef<TData, TValue> = {
    ...actionsCol,
    id: "actions",
    enableHiding: false,
    size: actionsCol.size && actionsCol.size > 100 ? actionsCol.size : 100,
    minSize:
      actionsCol.minSize && actionsCol.minSize > 100 ? actionsCol.minSize : 100,
    maxSize:
      actionsCol.maxSize && actionsCol.maxSize > 100 ? actionsCol.maxSize : 100,
    header: actionsCol.header
      ? (ctx) => flexRender(actionsCol.header!, ctx)
      : undefined,
    cell: (ctx) => flexRender(actionsCol.cell, ctx),
  };

  return [...rest, pinned];
}


const getSelectedBackgroundColor = (): string =>
  "color-mix(in srgb, hsl(var(--primary)) 6%, hsl(var(--background)))";


interface RowBackground {
  className: string;
  style: React.CSSProperties | undefined;
}

function getRowBg(isSelected: boolean): RowBackground {
  if (isSelected) {
    return {
      className: "",
      style: {
        backgroundColor: getSelectedBackgroundColor(),
      },
    };
  }

  return {
    className: "bg-background",
    style: undefined,
  };
}

function getCellBg(isSelected: boolean): React.CSSProperties {
  return {
    backgroundColor: isSelected ? getSelectedBackgroundColor() : undefined,
  };
}


interface TableBoundaryStateProps {
  type: "error" | "empty";
  title?: string;
  message?: string;
  onRefetch?: () => void;
  refetchLabel?: string;
  onClearFilters?: () => void;
  clearFiltersLabel?: string;
}

function TableBoundaryState({
  type,
  title,
  message,
  onRefetch,
  refetchLabel = "Try again",
  onClearFilters,
  clearFiltersLabel = "Clear filters",
}: TableBoundaryStateProps) {
  const isError = type === "error";

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center w-full max-w-sm mx-auto min-h-[50vh]">
      {}
      <div className="mb-4">
        {isError ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 dark:bg-destructive/15 text-destructive">
            <ServerCrash className="h-5 w-5" />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
            <Inbox className="h-5 w-5" />
          </div>
        )}
      </div>

      {}
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          {isError ? title || "Something went wrong" : title || "No data found"}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {message ||
            (isError
              ? "Please check your connection and try again."
              : "There's nothing here yet.")}
        </p>
      </div>

      {}
      {(onRefetch || (onClearFilters && !isError)) && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {isError && onRefetch && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRefetch();
              }}
              className="h-8 gap-1.5 px-4 text-xs font-medium rounded-md"
            >
              <RefreshCw className="h-3 w-3" />
              {refetchLabel}
            </Button>
          )}

          {!isError && onClearFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
              className="h-7 gap-1 px-2.5 text-[11px] font-medium rounded-md"
            >
              <X className="h-3 w-3" />
              {clearFiltersLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


export function DataTable<TData, TValue>({
  columns,
  data,
  selectable = false,
  onSelectionChange,
  pageSizeOptions = [10, 20, 30, 50],
  defaultPageSize = 10,
  className = "",
  paginationMeta,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  onFilterChange,
  onGlobalFilterChange,
  isError = false,
  isLoading = false,
  isFetching = false,
  errorTitle,
  errorMessage,
  emptyTitle,
  emptyMessage,
  onRefetch,
  refetchLabel = "Try again",
  onClearFilters,
  clearFiltersLabel,
}: DataTableProps<TData, TValue>) {
  const { lang } = useTranslation();
  const isControlledSorting = controlledSorting !== undefined;
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    controlledSorting ?? [],
  );
  const sorting = isControlledSorting ? controlledSorting! : internalSorting;
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });


  React.useEffect(() => {
    if (isControlledSorting) setInternalSorting(controlledSorting!);
  }, [controlledSorting, isControlledSorting]);


  const didMountPagination = React.useRef(false);
  const didMountSorting = React.useRef(false);
  const didMountFilter = React.useRef(false);
  const didMountGlobal = React.useRef(false);


  const prevMetaRef = React.useRef<PaginationResponse | undefined>(undefined);
  React.useEffect(() => {
    if (!paginationMeta) return;
    const prev = prevMetaRef.current;
    if (
      prev &&
      prev.page === paginationMeta.page &&
      prev.limit === paginationMeta.limit
    )
      return;
    prevMetaRef.current = paginationMeta;
    setPagination({
      pageIndex: paginationMeta.page - 1,
      pageSize: paginationMeta.limit,
    });
  }, [paginationMeta]);


  React.useEffect(() => {
    if (!onPaginationChange) return;
    if (!didMountPagination.current) {
      didMountPagination.current = true;
      return;
    }
    onPaginationChange(pagination.pageIndex + 1, pagination.pageSize);

  }, [pagination.pageIndex, pagination.pageSize]);


  React.useEffect(() => {
    if (isControlledSorting) return;
    if (!onSortingChange) return;
    if (!didMountSorting.current) {
      didMountSorting.current = true;
      return;
    }
    onSortingChange(sorting);

  }, [sorting]);


  React.useEffect(() => {
    if (!onFilterChange) return;
    if (!didMountFilter.current) {
      didMountFilter.current = true;
      return;
    }
    onFilterChange(columnFilters);

  }, [columnFilters]);


  React.useEffect(() => {
    if (!onGlobalFilterChange) return;
    if (!didMountGlobal.current) {
      didMountGlobal.current = true;
      return;
    }
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    onGlobalFilterChange(globalFilter);

  }, [globalFilter]);


  const allColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const withSelection = selectable
      ? [selectionColumn<TData>() as ColumnDef<TData, TValue>, ...columns]
      : columns;
    return normalizeColumns(withSelection);
  }, [columns, selectable]);


  const totalRows = paginationMeta ? paginationMeta.total : data.length;
  const pageCount = paginationMeta
    ? paginationMeta.total_pages
    : Math.ceil(totalRows / pagination.pageSize);
  const canGoPrev = paginationMeta
    ? paginationMeta.has_previous
    : pagination.pageIndex > 0;
  const canGoNext = paginationMeta
    ? paginationMeta.has_next
    : pagination.pageIndex < pageCount - 1;


  const showPagination = totalRows > 0 && !isError;


  const handleSortingChange: OnChangeFn<SortingState> = React.useCallback(
    (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (isControlledSorting) {
        onSortingChange?.(next);
      } else {
        setInternalSorting(next);
      }
    },
    [sorting, isControlledSorting, onSortingChange],
  );


  const table = useReactTable({
    data,
    columns: allColumns,
    pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    globalFilterFn: "includesString",
  });


  React.useEffect(() => {
    onSelectionChange?.(table.getSelectedRowModel().rows);
  }, [rowSelection, onSelectionChange, table]);

  const goToPage = React.useCallback(
    (pageIndex: number) => table.setPageIndex(pageIndex),
    [table],
  );
  const changePageSize = React.useCallback(
    (size: number) => {
      table.setPageSize(size);
      table.setPageIndex(0);
    },
    [table],
  );


  const displayCount = totalRows;
  const isEmpty = table.getRowModel().rows.length === 0;


  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState(0);
  const [containerHeight, setContainerHeight] = React.useState(400);
  const ROW_HEIGHT = 45;
  const OVERSCAN = 8;

  React.useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setContainerHeight(e.contentRect.height);
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, [isEmpty, isError]);

  const allRows = table.getRowModel().rows;
  const virtualRowCount = allRows.length;

  const shouldVirtualize = virtualRowCount > 20;
  const startIndex = shouldVirtualize
    ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    : 0;
  const endIndex = shouldVirtualize
    ? Math.min(
        virtualRowCount,
        Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN,
      )
    : virtualRowCount;
  const visibleRows = shouldVirtualize
    ? allRows.slice(startIndex, endIndex)
    : allRows;
  const paddingTop = shouldVirtualize ? startIndex * ROW_HEIGHT : 0;
  const paddingBottom = shouldVirtualize
    ? (virtualRowCount - endIndex) * ROW_HEIGHT
    : 0;


  const mobileContainerRef = React.useRef<HTMLDivElement>(null);
  const [mobileScrollTop, setMobileScrollTop] = React.useState(0);
  const [mobileHeight, setMobileHeight] = React.useState(400);
  const CARD_HEIGHT = 132;
  const MOBILE_OVERSCAN = 4;
  React.useEffect(() => {
    const el = mobileContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setMobileHeight(e.contentRect.height);
    });
    ro.observe(el);
    setMobileHeight(el.clientHeight);
    return () => ro.disconnect();
  }, [isEmpty, isError]);
  const mobileStart =
    virtualRowCount > 20
      ? Math.max(0, Math.floor(mobileScrollTop / CARD_HEIGHT) - MOBILE_OVERSCAN)
      : 0;
  const mobileEnd =
    virtualRowCount > 20
      ? Math.min(
          virtualRowCount,
          Math.ceil((mobileScrollTop + mobileHeight) / CARD_HEIGHT) +
            MOBILE_OVERSCAN,
        )
      : virtualRowCount;
  const mobileVisibleRows =
    virtualRowCount > 20 ? allRows.slice(mobileStart, mobileEnd) : allRows;
  const mobilePaddingTop = virtualRowCount > 20 ? mobileStart * CARD_HEIGHT : 0;
  const mobilePaddingBottom =
    virtualRowCount > 20 ? (virtualRowCount - mobileEnd) * CARD_HEIGHT : 0;


  const showInitialSkeleton = isLoading && !isError;
  const showFetchingBar = isFetching && !isLoading && !isError;
  const isBusy = (isLoading || isFetching) && !isError;

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${className}`}>
      {showFetchingBar && <AppLoader variant="bar" className="shrink-0" />}
      {}
      <div
        className={`flex flex-col flex-1 min-h-0 overflow-hidden bg-white dark:bg-background border-0 shadow-none max-h-full ${isBusy ? "pointer-events-none select-none" : ""}`}
      >
        {}
        <div
          ref={tableContainerRef}
          className="hidden sm:block flex-1 min-h-0 overflow-x-auto overflow-y-auto relative"
          onScroll={(e) => {
            setScrollTop(e.currentTarget.scrollTop);
          }}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent border-0">
                  {hg.headers.map((header, index, arr) => {
                    const isFirst = index === 0;
                    const isLast = index === arr.length - 1;
                    const isActions = header.column.id === "actions";
                    const isSelect = header.column.id === "select";
                    const isPinnedLeft =
                      header.column.id === "case_number" ||
                      header.column.id === "ticket_number" ||
                      Boolean(header.column.columnDef.enablePinning);
                    const borderStyle = "border-0";

                    return (
                      <TableHead
                        key={header.id}
                        className={
                          isSelect
                            ? `${isFirst ? "pl-4" : "pl-3.5"} pr-3.5 py-2 w-9 bg-[#EFF3FF] dark:bg-[#1e2a4a] text-[#2F4FA2] dark:text-[#8AA6E0] font-semibold ${borderStyle} sticky top-0 z-30`
                            : isActions
                              ? `bg-[#EFF3FF] dark:bg-[#1e2a4a] text-[#2F4FA2] dark:text-[#8AA6E0] font-semibold pl-4 ${isLast ? "pr-4" : "pr-4"} py-2 text-[13px] ${borderStyle} sticky right-0 top-0 z-30 text-right`
                              : isPinnedLeft
                                ? `bg-[#EFF3FF] dark:bg-[#1e2a4a] text-[#2F4FA2] dark:text-[#8AA6E0] font-semibold pl-4 py-2 text-[13px] ${borderStyle} sticky left-0 top-0 z-40`
                                : `bg-[#EFF3FF] dark:bg-[#1e2a4a] text-[#2F4FA2] dark:text-[#8AA6E0] font-semibold ${isFirst ? "pl-4" : "pl-4"} ${isLast ? "pr-4" : "pr-4"} py-2 text-[13px] ${borderStyle} sticky top-0 z-30`
                        }
                        style={{
                          width: header.column.columnDef.size,
                          minWidth: header.column.columnDef.minSize,
                          maxWidth: header.column.columnDef.maxSize,
                          boxShadow: "none",
                        }}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody
              className={`[&_tr:last-child]:border-0 ${showFetchingBar ? "opacity-60 transition-opacity" : ""}`}
            >
              {showInitialSkeleton ? (

                Array.from({ length: 8 }).map((_, ri) => (
                  <TableRow
                    key={`sk-${ri}`}
                    className="border-b border-zinc-100 dark:border-zinc-800/50"
                  >
                    {allColumns.map((col, ci) => {
                      const isActions = col.id === "actions";
                      const isSelect = col.id === "select";
                      if (isSelect) {
                        return (
                          <TableCell key={ci} className="pl-4 pr-3.5 py-3 w-9">
                            <Skeleton className="h-4 w-4 rounded" />
                          </TableCell>
                        );
                      }
                      if (isActions) {
                        return (
                          <TableCell
                            key={ci}
                            className="pr-4 pl-4 py-3 text-right"
                          >
                            <Skeleton className="h-8 w-10 ml-auto rounded-md" />
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={ci} className="pl-4 pr-4 py-3">
                          <Skeleton
                            className={`h-4 ${ci % 3 === 0 ? "w-3/4" : ci % 3 === 1 ? "w-1/2" : "w-2/3"} rounded`}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={999} className="border-0 py-0">
                    <TableBoundaryState
                      type="error"
                      title={errorTitle}
                      message={errorMessage}
                      onRefetch={onRefetch}
                      refetchLabel={refetchLabel}
                    />
                  </TableCell>
                </TableRow>
              ) : isEmpty ? (
                <TableRow className="hover:bg-transparent border-0">
                  <TableCell colSpan={999} className="border-0 py-0">
                    <TableBoundaryState
                      type="empty"
                      title={emptyTitle}
                      message={emptyMessage}
                      onRefetch={onRefetch}
                      refetchLabel={refetchLabel}
                      onClearFilters={onClearFilters}
                      clearFiltersLabel={clearFiltersLabel}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {shouldVirtualize && paddingTop > 0 && (
                    <TableRow
                      className="hover:bg-transparent border-0"
                      style={{ height: paddingTop }}
                    >
                      <TableCell
                        colSpan={999}
                        className="p-0 border-0"
                        style={{ height: paddingTop }}
                      />
                    </TableRow>
                  )}
                  {visibleRows.map((row) => {
                    const isSelected = row.getIsSelected();
                    const { className: rowBgClass, style: rowBgStyle } =
                      getRowBg(isSelected);
                    const cellBg = getCellBg(isSelected);
                    const stripeBg = "bg-white dark:bg-background";
                    const stripeHover =
                      "hover:bg-zinc-50 dark:hover:bg-zinc-800";

                    return (
                      <TableRow
                        key={row.id}
                        data-state={isSelected ? "selected" : undefined}
                        className={`group border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 ${!isSelected ? `${stripeBg} ${stripeHover}` : ""} transition-colors duration-150 ${rowBgClass}`}
                        style={rowBgStyle}
                      >
                        {row.getVisibleCells().map((cell, index, arr) => {
                          const isFirst = index === 0;
                          const isLast = index === arr.length - 1;
                          const isActions = cell.column.id === "actions";
                          const isSelect = cell.column.id === "select";
                          const isPinnedLeft =
                            cell.column.id === "case_number" ||
                            cell.column.id === "ticket_number" ||
                            Boolean(cell.column.columnDef.enablePinning);

                          if (isActions) {
                            const actionBg = !isSelected
                              ? "bg-white dark:bg-background group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800"
                              : "";
                            return (
                              <TableCell
                                key={cell.id}
                                className={`p-0 shrink-0 sticky right-0 z-10 ${!isSelected ? actionBg : ""} transition-colors border-0`}
                                style={{
                                  width: cell.column.columnDef.size,
                                  minWidth: cell.column.columnDef.minSize,
                                  maxWidth: cell.column.columnDef.maxSize,
                                }}
                              >
                                <div
                                  className={`pl-4 ${isLast ? "pr-4" : "pr-4"} py-2.5 flex items-center justify-end min-h-[44px]`}
                                  style={{
                                    ...cellBg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              </TableCell>
                            );
                          }

                          if (isPinnedLeft) {
                            const pinBg = !isSelected
                              ? "bg-white dark:bg-background group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800"
                              : "";
                            return (
                              <TableCell
                                key={cell.id}
                                className={`p-0 shrink-0 sticky left-0 z-10 ${!isSelected ? pinBg : ""} transition-colors border-0`}
                                style={{
                                  width: cell.column.columnDef.size,
                                  minWidth: cell.column.columnDef.minSize,
                                  maxWidth: cell.column.columnDef.maxSize,
                                }}
                              >
                                <div
                                  className={`pl-4 py-2.5 flex items-center min-h-[44px] text-sm text-zinc-700 dark:text-zinc-300 font-medium`}
                                  style={{
                                    ...cellBg,
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </div>
                              </TableCell>
                            );
                          }

                          const cellStrip = !isSelected
                            ? "bg-white dark:bg-background group-hover:bg-zinc-50 dark:group-hover:bg-zinc-800/50"
                            : "";
                          return (
                            <TableCell
                              key={cell.id}
                              className={
                                isSelect
                                  ? `${isFirst ? "pl-4" : "pl-3.5"} pr-3.5 py-2 ${cellStrip}`
                                  : `${isFirst ? "pl-4" : "pl-4"} ${isLast ? "pr-4" : "pr-4"} py-2.5 text-sm text-zinc-600 dark:text-zinc-400 ${cellStrip}`
                              }
                              style={{
                                width: cell.column.columnDef.size,
                                minWidth: cell.column.columnDef.minSize,
                                maxWidth: cell.column.columnDef.maxSize,
                              }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                  {shouldVirtualize && paddingBottom > 0 && (
                    <TableRow
                      className="hover:bg-transparent border-0"
                      style={{ height: paddingBottom }}
                    >
                      <TableCell
                        colSpan={999}
                        className="p-0 border-0"
                        style={{ height: paddingBottom }}
                      />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>

        {}
        <div
          ref={mobileContainerRef}
          className={`sm:hidden overflow-y-auto flex-1 min-h-0 space-y-3 bg-zinc-50/30 dark:bg-zinc-900/10 ${showFetchingBar ? "opacity-60" : ""}`}
          onScroll={(e) => setMobileScrollTop(e.currentTarget.scrollTop)}
        >
          {showInitialSkeleton ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`ms-${i}`}
                  className="p-4 border border-zinc-100 dark:border-zinc-800 rounded-xl bg-white dark:bg-background space-y-3"
                >
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-3/4" />
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <TableBoundaryState
                type="error"
                title={errorTitle}
                message={errorMessage}
                onRefetch={onRefetch}
                refetchLabel={refetchLabel}
              />
            </div>
          ) : isEmpty ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <TableBoundaryState
                type="empty"
                title={emptyTitle}
                message={emptyMessage}
                onRefetch={onRefetch}
                refetchLabel={refetchLabel}
                onClearFilters={onClearFilters}
                clearFiltersLabel={clearFiltersLabel}
              />
            </div>
          ) : (
            <>
              {virtualRowCount > 20 && mobilePaddingTop > 0 && (
                <div style={{ height: mobilePaddingTop }} aria-hidden />
              )}
              {mobileVisibleRows.map((row) => {
                const dataCells = row
                  .getVisibleCells()
                  .filter(
                    (cell) =>
                      cell.column.id !== "select" &&
                      cell.column.id !== "actions",
                  );
                const selectCell = row
                  .getVisibleCells()
                  .find((c) => c.column.id === "select");
                const actionsCell = row
                  .getVisibleCells()
                  .find((c) => c.column.id === "actions");
                const [primaryCell, ...secondaryCells] = dataCells;

                const getLabel = (cell: (typeof dataCells)[number]) => {
                  const h = cell.column.columnDef.header;
                  return typeof h === "string"
                    ? h
                    : cell.column.id
                        .replace(/_/g, " ")
                        .replace(/([A-Z])/g, " $1")
                        .trim();
                };

                const isSelected = row.getIsSelected();
                const cellBg = getCellBg(isSelected);

                return (
                  <div
                    key={row.id}
                    className={[
                      "relative p-4 border border-zinc-100 dark:border-zinc-800/50 bg-white dark:bg-background shadow-none transition-all duration-200",
                      row.getIsSelected()
                        ? "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        : "bg-white dark:bg-background",
                    ].join(" ")}
                    style={cellBg}
                  >
                    {row.getIsSelected() && (
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary rounded-l-xl" />
                    )}

                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        {selectCell && (
                          <div className="shrink-0 mt-0.5">
                            {flexRender(
                              selectCell.column.columnDef.cell,
                              selectCell.getContext(),
                            )}
                          </div>
                        )}
                        {primaryCell && (
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-[10px] font-semibold text-muted-foreground/80 capitalize tracking-wide truncate">
                              {getLabel(primaryCell)}
                            </p>
                            <div className="text-sm font-semibold text-foreground leading-snug truncate">
                              {flexRender(
                                primaryCell.column.columnDef.cell,
                                primaryCell.getContext(),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      {actionsCell && (
                        <div className="shrink-0 mt-0.5">
                          {flexRender(
                            actionsCell.column.columnDef.cell,
                            actionsCell.getContext(),
                          )}
                        </div>
                      )}
                    </div>

                    {secondaryCells.length > 0 && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 pt-2 border-t border-border/40">
                        {secondaryCells.map((cell) => (
                          <div key={cell.id} className="space-y-0.5 min-w-0">
                            <p className="text-[10px] font-semibold text-muted-foreground/80 capitalize tracking-wide truncate">
                              {getLabel(cell)}
                            </p>
                            <div className="text-xs text-foreground leading-normal truncate">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {virtualRowCount > 20 && mobilePaddingBottom > 0 && (
                <div style={{ height: mobilePaddingBottom }} aria-hidden />
              )}
            </>
          )}
        </div>
      </div>
      {}
      {showPagination && (
        <div
          className={`sticky bottom-0 z-20 bg-white dark:bg-background h-14 px-4 flex items-center justify-between text-[13px] text-zinc-500 dark:text-zinc-400 border-0 ${isBusy ? "pointer-events-none opacity-60" : ""}`}
        >
          {}
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(v) => !isBusy && changePageSize(Number(v))}
              disabled={isBusy}
            >
              <SelectTrigger className="!h-8 w-[60px] sm:w-[70px] text-[13px] px-2 rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((size) => (
                  <SelectItem
                    key={size}
                    value={String(size)}
                    className="text-[13px]"
                  >
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {}
          <div className="flex items-center gap-3 shrink-0">
            <span className="tabular-nums whitespace-nowrap font-medium">
              <span className="hidden sm:inline">
                {lang === "hi"
                  ? `पृष्ठ ${pagination.pageIndex + 1} का ${pageCount || 1}`
                  : `Page ${pagination.pageIndex + 1} of ${pageCount || 1}`}
                {" · "}
              </span>
              <span className="sm:hidden">
                {pagination.pageIndex + 1}/{pageCount || 1}
                {" · "}
              </span>
              {lang === "hi"
                ? `${displayCount.toLocaleString()} पंक्तियाँ`
                : `${displayCount.toLocaleString()} row${displayCount !== 1 ? "s" : ""}`}
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md hidden sm:inline-flex"
                onClick={() => goToPage(0)}
                disabled={!canGoPrev || isBusy}
                aria-label="First page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => goToPage(pagination.pageIndex - 1)}
                disabled={!canGoPrev || isBusy}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() => goToPage(pagination.pageIndex + 1)}
                disabled={!canGoNext || isBusy}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md hidden sm:inline-flex"
                onClick={() => goToPage(pageCount - 1)}
                disabled={!canGoNext || isBusy}
                aria-label="Last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
