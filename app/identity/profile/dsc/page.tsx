"use client";
import { DSCertificateListData, formatDate, getExpiryStatus, getStatus, maskSerial, NumberParam, useProfileDSCList, useQueryParams, withDefault, useProfileDSCActivate, useProfileDSCDeactivate, useConfirm } from '@/lib/query';
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Eye, Power } from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function DCSPageList() {
  const router = useRouter();
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
  });

  const { t } = useTranslation();
  const data = useProfileDSCList(query);
  const confirm = useConfirm();
  const activateMutation = useProfileDSCActivate();
  const deactivateMutation = useProfileDSCDeactivate();

  const handleToggleStatus = async (item: DSCertificateListData) => {
    const isActivating = !item.is_active;
    const titleKey = isActivating
      ? "common.confirm_activate_title"
      : "common.confirm_deactivate_title";
    const descKey = isActivating
      ? "common.confirm_activate_desc"
      : "common.confirm_deactivate_desc";
    const actionKey = isActivating ? "common.activate" : "common.deactivate";

    const isConfirmed = await confirm({
      title:
        t(titleKey) ||
        (isActivating
          ? "Activate DSC Certificate?"
          : "Deactivate DSC Certificate?"),
      description:
        t(descKey) ||
        (isActivating
          ? "This will activate the certificate and deactivate other certificates for this user."
          : "This will temporarily disable this digital signature certificate."),
      confirmText: t(actionKey) || (isActivating ? "Activate" : "Deactivate"),
      cancelText: t("common.cancel") || "Cancel",
    });

    if (isConfirmed) {
      try {
        if (isActivating) {
          await activateMutation.mutateAsync(item.id);
          toast.success("DSC activated successfully");
        } else {
          await deactivateMutation.mutateAsync(item.id);
          toast.success("DSC deactivated successfully");
        }
      } catch (error) {
        toast.error("Failed to update DSC status");
      }
    }
  };

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 580,
    height = 680,
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
      if (event.data === "REFRESH_DSC") {
        data.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data]);

  const columns: ColumnDef<DSCertificateListData>[] = [
    {
      accessorKey: "code",
      header: t("table.code"),
    },
    {
      accessorKey: "serial",
      header: t("table.serialNo"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {maskSerial(row.original.serial)}
        </span>
      ),
    },

    {
      accessorKey: "valid_from",
      header: t("table.validFrom"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.valid_from)}
        </span>
      ),
    },
    {
      accessorKey: "valid_to",
      header: t("table.validTo"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.valid_to)}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("table.createdOn"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.valid_to)}
        </span>
      ),
    },
    {
      id: "exp",
      header: t("table.expired"),
      cell: ({ row }) => {
        const item = row.original as DSCertificateListData;
        const { label } = getExpiryStatus(item);
        const isExpired = label === "Expired";
        return (
          <StatusBadge variant={isExpired ? "error" : "success"}>
            {isExpired ? t("common.yes") || "Yes" : t("common.no") || "No"}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: t("table.status"),
      cell: ({ row }) => {
        const item = row.original as DSCertificateListData;
        const { label } = getStatus(item);
        const isActive = item.is_active;
        return (
          <StatusBadge variant={isActive ? "success" : "neutral"}>
            {label}
          </StatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: t("table.actions") || "Actions",
      maxSize: 130,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title="View"
              onClick={(e) => {
                e.stopPropagation();
                openCenteredPopup(
                  `/identity/profile/dsc/view?id=${item.id}`,
                  "DSC Detail",
                  580,
                  520,
                );
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title={item.is_active ? "Deactivate" : "Activate"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleStatus(item);
              }}
            >
              <Power className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {}
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-row items-center justify-between gap-3 px-4 h-14 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("page_tab.dsc") || "DSC Configuration"}
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() =>
            openCenteredPopup("/identity/profile/dsc/device", "Add DSC Token")
          }
          className="cursor-pointer"
        >
          {t("common.add_new") || "Add New"}
        </Button>
      </div>

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as DSCertificateListData[]}
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
        />
      </div>
    </div>
  );
}
