"use client";

import React from "react";
import { useTranslation } from "@/i18n";
import {
  Eye,
  SlidersHorizontal,
  ArrowUpDown,
  Copy,
  Check,
  Download,
  Inbox,
  ServerCrash,
  RefreshCw,
  X,
} from "lucide-react";
import {
  CustomModal,
  CustomModalBody,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalFooter,
} from "@/components/ui/custom-modal";
import { NumberParam, StringParam, usePaymentOrderList, useQueryParams, withDefault, getLabel, PaymentOrderData } from '@/lib/query';
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
import { PaymentsFilterSheet } from "./payments-filter-sheet";
import { PaymentsSortSheet } from "./payments-sort-sheet";

function CaseNumberCell({ caseNumber }: { caseNumber: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(caseNumber);
      setCopied(true);
      toast.success("Case number copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };
  if (!caseNumber || caseNumber === "-")
    return <span className="text-muted-foreground">-</span>;
  return (
    <div className="flex items-center gap-1.5 group/copy">
      <span className="font-medium text-foreground truncate max-w-[160px]">
        {caseNumber}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 transition-all p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-muted-foreground hover:text-foreground shrink-0"
        title="Copy case number"
      >
        {copied ? (
          <Check className="w-3 h-3 text-emerald-600" />
        ) : (
          <Copy className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}


function getOrderingField(columnId: string): string {
  switch (columnId) {
    case "object_id":
      return "object_id";
    case "description":
      return "description";
    case "amount":
      return "amount";
    case "status":
      return "status";
    case "created_at":
      return "created_at";
    default:
      return columnId;
  }
}
function getColumnIdForField(field: string): string | null {
  const map: Record<string, string> = {
    object_id: "object_id",
    description: "description",
    amount: "amount",
    amount_in_inr: "amount",
    status: "status",
    created_at: "created_at",
    paid_at: "created_at",
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

export default function PaymentsPage() {
  const { t, lang } = useTranslation();

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 50),
    search: withDefault(StringParam, ""),
    ordering: withDefault(StringParam, "-created_at"),
    status: withDefault(StringParam, ""),
    payment_mode: withDefault(StringParam, ""),
    case_number: withDefault(StringParam, ""),
    created_from: withDefault(StringParam, ""),
    created_to: withDefault(StringParam, ""),
  });

  const [filterOpen, setFilterOpen] = React.useState(false);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [receiptOpen, setReceiptOpen] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<PaymentOrderData | null>(
    null,
  );
  const receiptRef = React.useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);


  React.useEffect(() => {
    if (!receiptOpen || !receiptData?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const { CommonsApiServices } = await import("@/lib");
        const res: any = await CommonsApiServices.PaymentOrderDetail(
          receiptData.id,
        );
        const full = res?.result?.data || res?.data || null;
        if (full && !cancelled) setReceiptData(full as PaymentOrderData);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [receiptOpen, receiptData?.id]);

  const formatINR = React.useCallback((amt: number) => {
    const n = Number(amt || 0);

    return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const handleDownloadReceipt = React.useCallback(async () => {
    if (!receiptData) return;
    setIsDownloading(true);
    try {
      const loadJsPDF = () =>
        new Promise<any>((resolve, reject) => {
          if ((window as any).jspdf?.jsPDF)
            return resolve((window as any).jspdf.jsPDF);
          const s = document.createElement("script");
          s.src =
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
          s.onload = () =>
            resolve((window as any).jspdf?.jsPDF || (window as any).jsPDF);
          s.onerror = reject;
          document.head.appendChild(s);
        });

      const jsPDF = await loadJsPDF();
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const W = 210;
      const PAD = 14;
      const amt = Number(
        (receiptData as any).amount_in_inr ?? receiptData.amount / 100,
      );
      const amtStr = formatINR(amt);
      const desc =
        receiptData.description ||
        (t("case.review.receipt_stamp_fee") as string) ||
        "Court Fee";
      const detail = (receiptData as any).status_detail;
      const statusLabel = detail
        ? getLabel(detail as any, lang)
        : receiptData.status || "-";


      const green = [5, 150, 105] as const;
      const teal = [13, 148, 136] as const;
      const gray50 = [244, 244, 245] as const;
      const grayBorder = [228, 228, 231] as const;
      const slate500 = [113, 113, 122] as const;
      const slate900 = [24, 24, 27] as const;


      doc.setFillColor(green[0], green[1], green[2]);
      doc.rect(0, 0, W, 28, "F");
      doc.setFillColor(teal[0], teal[1], teal[2]);
      doc.rect(W / 2, 0, W / 2, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        (t("case.review.receipt_title") as string) || "Payment Receipt",
        PAD,
        12,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(
        (t("case.review.receipt_board_name") as string) ||
          "Board Of Revenue, Uttarakhand",
        PAD,
        19,
      );


      let y = 36;
      doc.setFillColor(gray50[0], gray50[1], gray50[2]);
      doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
      doc.roundedRect(PAD, y, W - PAD * 2, 22, 3, 3, "FD");
      doc.setTextColor(slate900[0], slate900[1], slate900[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      const amtW = doc.getTextWidth(amtStr);
      doc.text(amtStr, (W - amtW) / 2, y + 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(slate500[0], slate500[1], slate500[2]);
      const descW = doc.getTextWidth(String(desc).slice(0, 80));
      doc.text(String(desc).slice(0, 80), (W - descW) / 2, y + 16);


      y = y + 30;
      const colLabelW = 48;
      const colValueW = W - PAD * 2 - colLabelW;
      const rowHBase = 10;

      const rows: Array<[string, string]> = [
        [
          (t("payments.status") as string) || "Payment Status",
          String(statusLabel),
        ],
        [
          (t("case.review.receipt_case_number") as string) || "Case Number",
          String(receiptData.object_id || "-"),
        ],
        [
          (t("case.review.receipt_date") as string) || "Payment Date",
          (() => {
            const d = (receiptData as any)?.paid_at || receiptData.created_at;
            return d
              ? new Date(d as string).toLocaleString(
                  lang === "hi" ? "hi-IN" : "en-IN",
                  { dateStyle: "medium", timeStyle: "short" },
                )
              : "-";
          })(),
        ],
        [
          (t("case.review.receipt_order_id") as string) || "Order Id",
          String(receiptData.razorpay_order_id || "-"),
        ],
        [
          (t("case.review.receipt_transaction_id") as string) ||
            "Transaction Id",
          String((receiptData as any).razorpay_payment_id || "-"),
        ],
        [
          (t("payments.mode") as string) || "Payment Mode",
          (() => {
            const d = (receiptData as any).payment_mode_detail;
            return d
              ? getLabel(d as any, lang)
              : (receiptData as any).metadata?.payment_mode || "-";
          })(),
        ],
        ...(receiptData.paid_by
          ? [
              [
                (t("case.review.receipt_paid_by") as string) || "Paid By",
                String(receiptData.paid_by),
              ] as [string, string],
            ]
          : []),
      ];


      doc.setFillColor(244, 244, 245);
      doc.rect(PAD, y, W - PAD * 2, 8, "F");
      doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
      doc.rect(PAD, y, W - PAD * 2, 8, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(slate500[0], slate500[1], slate500[2]);

      const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
      doc.text(cap("Field"), PAD + 2, y + 5);
      doc.text(cap("Value"), PAD + colLabelW + 2, y + 5);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      rows.forEach(([label, value], idx) => {
        const lines: string[] = doc.splitTextToSize(
          String(value),
          colValueW - 4,
        );
        const h = Math.max(rowHBase, 6 + lines.length * 4);

        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(PAD, y, W - PAD * 2, h, "F");
        }
        doc.setDrawColor(grayBorder[0], grayBorder[1], grayBorder[2]);
        doc.rect(PAD, y, colLabelW, h, "S");
        doc.rect(PAD + colLabelW, y, colValueW, h, "S");

        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(cap(label), PAD + 2, y + 5);

        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        let vy = y + 5;
        lines.forEach((ln) => {
          doc.text(ln, PAD + colLabelW + 2, vy);
          vy += 4;
        });
        y += h;
        if (y > 275) {
          doc.addPage();
          y = 14;
        }
      });


      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(slate500[0], slate500[1], slate500[2]);
      const note =
        (t("case.payments.view.computer_generated_note") as string) ||
        "This is a computer generated receipt. No signature required.";
      const noteW = doc.getTextWidth(note);
      doc.text(note, (W - noteW) / 2, 285);

      const safeCase = (receiptData.object_id || "receipt").replace(
        /[^a-zA-Z0-9-_]/g,
        "_",
      );
      doc.save(`Payment_Receipt_${safeCase}_${receiptData.id}.pdf`);
      toast.success(
        t("case.payments.view.receipt_saved") || "Receipt pdf downloaded",
      );
    } catch (e: any) {
      toast.error(
        t("case.payments.view.save_failed") || "Failed to download pdf",
      );
    } finally {
      setIsDownloading(false);
    }
  }, [receiptData, t, lang, formatINR]);

  const activeFilterCount = React.useMemo(() => {
    let c = 0;
    if (query.status) c++;
    if (query.payment_mode) c++;
    if (query.case_number) c++;
    if (query.created_from) c++;
    if (query.created_to) c++;
    return c;
  }, [
    query.status,
    query.payment_mode,
    query.case_number,
    query.created_from,
    query.created_to,
  ]);

  const hasActiveFilters = !!query.search || activeFilterCount > 0;

  const handleClearFilters = () => {
    setQuery({
      ...query,
      search: "",
      status: undefined,
      payment_mode: undefined,
      case_number: undefined,
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
      const ordering = sortingToOrdering(next);
      setQuery({ ...query, ordering: ordering || "-created_at", page: 1 });
    },
    [query, setQuery],
  );

  const listParams: Record<string, any> = React.useMemo(() => {
    const p: Record<string, any> = {
      page: query.page,
      limit: query.limit,
      search: query.search || undefined,
      ordering: query.ordering || "-created_at",
      mine: "true",
    };
    if (query.status) p["filters[status]"] = query.status;
    if (query.payment_mode) p["filters[payment_mode]"] = query.payment_mode;
    if (query.case_number) p["filters[object_id]"] = query.case_number;
    if (query.created_from)
      p["filters[created_at__gte]"] = `${query.created_from}T00:00:00`;
    if (query.created_to)
      p["filters[created_at__lte]"] = `${query.created_to}T23:59:59`;
    return p;
  }, [
    query.page,
    query.limit,
    query.search,
    query.ordering,
    query.status,
    query.payment_mode,
    query.case_number,
    query.created_from,
    query.created_to,
  ]);

  const paymentsQuery = usePaymentOrderList(listParams);
  const rawPaymentsData = (paymentsQuery.data?.result?.data ??
    []) as PaymentOrderData[];
  const isTruePaymentsEmpty =
    !paymentsQuery.isLoading &&
    !paymentsQuery.isError &&
    rawPaymentsData.length === 0 &&
    !hasActiveFilters &&
    !query.search;
  const isPaymentsEmpty =
    !paymentsQuery.isLoading &&
    !paymentsQuery.isError &&
    rawPaymentsData.length === 0;
  const isPaymentsError = !!paymentsQuery.isError;

  const columns: ColumnDef<PaymentOrderData>[] = [
    {
      id: "object_id",
      header: sortableHeader<PaymentOrderData>(
        t("table.case_number") || "Case Number",
      ),
      enableSorting: true,
      size: 180,
      minSize: 160,
      cell: ({ row }) => (
        <CaseNumberCell caseNumber={row.original.object_id || "-"} />
      ),
    },
    {
      accessorKey: "description",
      header: sortableHeader<PaymentOrderData>(
        t("payments.description") || "Description",
      ),
      enableSorting: true,
      size: 260,
      minSize: 200,
      cell: ({ row }) => (
        <span
          className="text-sm text-foreground line-clamp-1"
          title={row.original.description}
        >
          {row.original.description || "-"}
        </span>
      ),
    },
    {
      id: "amount",
      accessorKey: "amount_in_inr",
      header: sortableHeader<PaymentOrderData>(
        t("payments.amount") || "Amount",
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => {
        const amt =
          (row.original as any).amount_in_inr ??
          (row.original.amount ? row.original.amount / 100 : 0);
        return (
          <span className="text-sm font-semibold text-foreground">
            {Number(amt)
              .toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
              .replace(/^/, "₹")}
          </span>
        );
      },
    },
    {
      id: "payment_mode",
      header: t("payments.mode") || "Payment Mode",
      enableSorting: false,
      size: 150,
      cell: ({ row }) => {
        const d = (row.original as any).payment_mode_detail;
        const label = d
          ? getLabel(d as any, lang)
          : (row.original as any).metadata?.payment_mode || "-";
        return (
          <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
            {label}
          </span>
        );
      },
    },
    {
      id: "status",
      accessorKey: "status",
      header: sortableHeader<PaymentOrderData>(
        t("payments.status") || "Payment Status",
      ),
      enableSorting: true,
      size: 140,
      cell: ({ row }) => {
        const detail = (row.original as any).status_detail;
        const label = detail
          ? getLabel(detail as any, lang)
          : row.original.status;
        const code =
          detail?.code ||
          `PAYMENT_${String(row.original.status || "").toUpperCase()}`;
        let variant: "success" | "error" | "warning" | "info" | "neutral" =
          "neutral";
        if (code === "PAYMENT_PAID") variant = "success";
        else if (code === "PAYMENT_FAILED" || code === "PAYMENT_CANCELLED")
          variant = "error";
        else if (
          code === "PAYMENT_CREATED" ||
          code === "PAYMENT_PENDING_VERIFICATION"
        )
          variant = "warning";
        return <StatusBadge variant={variant}>{label}</StatusBadge>;
      },
    },
    {
      accessorKey: "created_at",
      header: sortableHeader<PaymentOrderData>(t("table.createdOn") || "Date"),
      enableSorting: true,
      size: 160,
      cell: ({ row }) => {
        const d = new Date(row.original.created_at);
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
      header: t("table.actions") || "Actions",
      enableSorting: false,
      size: 80,
      minSize: 80,
      maxSize: 80,
      cell: ({ row }) => (
        <span
          className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors p-1 inline-flex"
          onClick={() => {
            setReceiptData(row.original);
            setReceiptOpen(true);
          }}
          title={t("payments.view_receipt") || "View Receipt"}
        >
          <Eye className="h-4 w-4" />
        </span>
      ),
    },
  ];

  if (isTruePaymentsEmpty) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            Payments
          </h2>
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
              {t("payments.empty") || "No payments found for your profile."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isPaymentsError) {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
        <div className="shrink-0 flex items-center px-4 py-3 sm:px-6 sm:h-14 bg-white dark:bg-background sticky top-0 z-10">
          <h2 className="font-bold text-lg sm:text-xl lg:text-2xl tracking-tight truncate">
            Payments
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
              {(paymentsQuery.error as any)?.response?.data?.message ||
                t("common_status.something_wrong.description") ||
                "We couldn't complete your request. Please try again."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => paymentsQuery.refetch()}
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
            Payments
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial min-w-0">
            <SearchInput
              onSearch={(value) =>
                setQuery({ ...query, search: value, page: 1 })
              }
              value={query.search ?? ""}
              placeholder={
                t("header.search_case") || "Search case / description..."
              }
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
        </div>
      </div>

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(paymentsQuery.data?.result?.data ?? []) as PaymentOrderData[]}
          columns={columns}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          defaultPageSize={query.limit}
          onPaginationChange={(page, limit) =>
            setQuery({ ...query, page, limit })
          }
          paginationMeta={
            paymentsQuery.data?.result
              ?.pagination as unknown as PaginationResponse
          }
          isError={paymentsQuery.isError}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (paymentsQuery.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={paymentsQuery.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={
            t("payments.empty") ||
            "No payments found for your profile. Payments will appear here after you pay case fees."
          }
          refetchLabel={t("common_button.retry.label")}
          onClearFilters={hasActiveFilters ? handleClearFilters : undefined}
          clearFiltersLabel={
            t("common_button.clear_filter.label") || "Clear Filters"
          }
        />
      </div>

      <PaymentsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        query={query}
        setQuery={setQuery}
      />
      <PaymentsSortSheet
        open={sortOpen}
        onOpenChange={setSortOpen}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      {}
      <CustomModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        className="max-w-md"
      >
        <div
          ref={receiptRef}
          className="flex flex-col bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden"
        >
          <CustomModalHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
            <div>
              <CustomModalTitle className="text-white text-base font-bold capitalize">
                {t("case.review.receipt_title") || "Payment Receipt"}
              </CustomModalTitle>
              <p className="text-white/90 text-xs mt-0.5 font-medium capitalize">
                {t("case.review.receipt_board_name") ||
                  "Board Of Revenue, Uttarakhand"}
              </p>
            </div>
          </CustomModalHeader>
          <CustomModalBody className="p-6 space-y-5 bg-white dark:bg-neutral-900">
            {}
            <div className="text-center bg-zinc-50 dark:bg-zinc-800 rounded-xl py-5 px-4 border border-dashed">
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {receiptData
                  ? formatINR(
                      Number(
                        (receiptData as any).amount_in_inr ??
                          receiptData.amount / 100,
                      ),
                    )
                  : "-"}
              </div>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {receiptData?.description ||
                  t("case.review.receipt_stamp_fee") ||
                  "Court Fee"}
              </p>
            </div>

            {}
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("payments.status") || "Payment Status"}
                </p>
                <div className="mt-1">
                  {(() => {
                    const detail = (receiptData as any)?.status_detail;
                    const label = detail
                      ? getLabel(detail as any, lang)
                      : receiptData?.status || "-";
                    const code =
                      detail?.code ||
                      `PAYMENT_${String(receiptData?.status || "").toUpperCase()}`;
                    let variant: "success" | "error" | "warning" | "neutral" =
                      "neutral";
                    if (code === "PAYMENT_PAID") variant = "success";
                    else if (
                      code === "PAYMENT_FAILED" ||
                      code === "PAYMENT_CANCELLED"
                    )
                      variant = "error";
                    else if (
                      code === "PAYMENT_CREATED" ||
                      code === "PAYMENT_PENDING_VERIFICATION"
                    )
                      variant = "warning";
                    return <StatusBadge variant={variant}>{label}</StatusBadge>;
                  })()}
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("case.review.receipt_case_number") || "Case Number"}
                </p>
                <p className="font-medium text-foreground mt-1 break-all">
                  {receiptData?.object_id || "-"}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("case.review.receipt_date") || "Payment Date"}
                </p>
                <p className="font-medium text-foreground mt-1">
                  {(receiptData as any)?.paid_at || receiptData?.created_at
                    ? new Date(
                        ((receiptData as any)?.paid_at ||
                          receiptData?.created_at) as string,
                      ).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "-"}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("case.review.receipt_order_id") || "Order Id"}
                </p>
                <p className="font-medium text-foreground mt-1 font-mono break-all">
                  {receiptData?.razorpay_order_id || "-"}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("case.review.receipt_transaction_id") || "Transaction Id"}
                </p>
                <p className="font-medium text-foreground mt-1 font-mono break-all">
                  {(receiptData as any)?.razorpay_payment_id || "-"}
                </p>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground font-medium capitalize">
                  {t("payments.mode") || "Payment Mode"}
                </p>
                <p className="font-medium text-foreground mt-1 capitalize">
                  {receiptData
                    ? getLabel(
                        ((receiptData as any).payment_mode_detail || {
                          name:
                            (receiptData as any).metadata?.payment_mode || "-",
                          name_en:
                            (receiptData as any).metadata?.payment_mode || "-",
                        }) as any,
                        lang,
                      )
                    : "-"}
                </p>
              </div>
              {receiptData?.paid_by && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground font-medium capitalize">
                    {t("case.review.receipt_paid_by") || "Paid By"}
                  </p>
                  <p className="font-medium text-foreground mt-1 wrap-break-word capitalize">
                    {String(receiptData.paid_by)}
                  </p>
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed pt-2 border-t capitalize">
              {t("case.payments.view.computer_generated_note") ||
                "This is a computer generated receipt. No signature required."}
            </p>
          </CustomModalBody>
        </div>
        <CustomModalFooter className="px-6 py-3 bg-white dark:bg-neutral-900 flex items-center justify-end gap-3 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => setReceiptOpen(false)}
          >
            {t("common_button.close.label") || "Close"}
          </Button>
          <Button
            type="button"
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            {isDownloading
              ? t("common_button.loading.label") || "Downloading..."
              : t("case.payments.view.save_receipt") || "Download"}
          </Button>
        </CustomModalFooter>
      </CustomModal>
    </div>
  );
}
