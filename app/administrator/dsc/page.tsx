"use client";
import * as React from "react";
import { useTranslation } from "@/i18n";
import {
  useAdminDSCList,
  useUpdateAdminDSC,
  useDeleteAdminDSC,
  useQueryParams,
  withDefault,
  NumberParam,
  StringParam,
  DSCertificateListData,
  formatDate,
  getExpiryStatus,
  getStatus,
  useConfirm,
} from "@/lib";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-Input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { Eye, Trash2, Power } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDSCPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, undefined),
  });

  const { data: dscRes, isLoading, refetch } = useAdminDSCList(query);
  const updateMutation = useUpdateAdminDSC();
  const deleteMutation = useDeleteAdminDSC();

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 580,
    height = 600,
  ) => {
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
    window.open(
      url,
      name,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

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
        await updateMutation.mutateAsync({
          id: item.id,
          data: { is_active: isActivating },
        });
        toast.success(
          isActivating
            ? "DSC activated successfully"
            : "DSC deactivated successfully",
        );
      } catch (error) {
        toast.error("Failed to update DSC status");
      }
    }
  };

  const handleDelete = async (id: number) => {
    const isConfirmed = await confirm({
      title:
        t("common.confirm_delete_title") ||
        "Are you sure you want to delete this?",
      description:
        t("common.confirm_delete_desc") || "This action cannot be undone.",
      confirmText: t("common.delete") || "Delete",
      cancelText: t("common.cancel") || "Cancel",
      confirmWord: "delete",
      variant: "destructive",
    });

    if (isConfirmed) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("DSC deleted successfully");
      } catch (error) {
        toast.error("Failed to delete DSC");
      }
    }
  };


  const columns: ColumnDef<DSCertificateListData>[] = [
    {
      accessorKey: "code",
      header: t("table.code") || "Code",
    },
    {
      accessorKey: "serial",
      header: t("table.serialNo") || "Serial Number",
    },
    {
      accessorKey: "username",
      header: t("table.boundProfile") || "Bound Profile",
      cell: ({ row }) => {
        const item = row.original;

        const handleUserClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          const role = item.user_role;
          let popupPath = "/action/users/court/view";
          if (role === "SA" || role === "AD") {
            popupPath = "/action/users/system/view";
          } else if (role === "CI" || role === "ADVC") {
            popupPath = "/action/users/citizen/view";
          }
          openCenteredPopup(
            `${popupPath}?username=${item.username}`,
            "Profile Detail",
            580,
            600,
          );
        };

        return (
          <span
            onClick={handleUserClick}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-text"
          >
            {item.username}
          </span>
        );
      },
    },
    {
      accessorKey: "valid_from",
      header: t("table.validFrom") || "Valid From",
      cell: ({ row }) => <span>{formatDate(row.original.valid_from)}</span>,
    },
    {
      accessorKey: "valid_to",
      header: t("table.validTo") || "Valid To",
      cell: ({ row }) => <span>{formatDate(row.original.valid_to)}</span>,
    },
    {
      id: "expired",
      header: t("table.expired") || "Expired",
      cell: ({ row }) => {
        const { label } = getExpiryStatus(row.original);
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
      header: t("table.status") || "Status",
      cell: ({ row }) => {
        const { label } = getStatus(row.original);
        return (
          <StatusBadge variant={row.original.is_active ? "success" : "neutral"}>
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
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {}
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 px-4 py-2.5 md:py-0 h-auto md:h-14">
        {}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center shrink-0 md:hidden">
            <SidebarTrigger />
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
            {t("page_tab.dsc_management") || "DSC Management"}
          </span>
        </div>

        {}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SearchInput
            onSearch={(value) =>
              setQuery({
                ...query,
                search: value || undefined,
                page: 1,
              })
            }
            value={query.search ?? ""}
            placeholder={t("form.search.placeholder") || "Search..."}
            className="w-full md:w-64"
          />
        </div>
      </div>

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(dscRes?.result?.data ?? []) as DSCertificateListData[]}
          columns={columns}
          defaultPageSize={query.limit}
          onPaginationChange={(page, limit) => {
            setQuery({
              page: page,
              limit: limit,
            });
          }}
          paginationMeta={
            dscRes?.result?.pagination as unknown as PaginationResponse
          }
          isError={!dscRes && !isLoading}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={t("common_status.something_wrong.description")}
          onRefetch={refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
        />
      </div>
    </div>
  );
}
