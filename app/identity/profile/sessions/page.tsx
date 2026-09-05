"use client";
import { formatDate, getExpired, getStatus, NumberParam, parseDevice, SessionListData, useQueryParams, useSessionList, withDefault, useConfirm } from '@/lib/query';
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { LogOut, Monitor, Phone, Loader2, Eye } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRef } from "react";
import { SignOutAllService, SignOutOneService } from "./services";
import toast from "react-hot-toast";

export default function SessionPageList() {
  const confirm = useConfirm();
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
  });

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

  const { t } = useTranslation();
  const data = useSessionList(query);
  const SignOutAll = useMutation({
    mutationKey: ["SignOutAll"],
    mutationFn: SignOutAllService,
    onSuccess: (res) => {
      toast.success(res.message);
      data.refetch();
    },
  });
  const SignOutOne = useMutation({
    mutationKey: ["SignOutOne"],
    mutationFn: SignOutOneService,
    onSuccess: (res) => {
      toast.success(res.message);
      data.refetch();
    },
  });
  const onSignOutOne = async (id: string) => {
    const confirmed = await confirm({
      title: t("session.signout_one.title"),
      description: t("session.signout_one.description"),
      confirmText: t("session.signout_one.confirm"),
      cancelText: t("common.cancel"),
    });

    if (!confirmed) return;

    SignOutOne.mutate({ session_id: id });
  };

  const onSignOutAll = async () => {
    const confirmed = await confirm({
      title: t("session.signout_all.title"),
      description: t("session.signout_all.description"),
      confirmText: t("session.signout_all.confirm"),
      cancelText: t("common.cancel"),
    });

    if (!confirmed) return;

    SignOutAll.mutate();
  };
  const columns: ColumnDef<SessionListData>[] = [
    {
      accessorKey: "session_id",
      header: t("table.sessionId"),
      enablePinning: true,
    },
    {
      accessorKey: "device",
      header: t("table.device"),
      cell: ({ row }) => {
        const parsed = parseDevice(row.original.device);

        const isUnknown =
          !parsed?.browser && !parsed?.os && !parsed?.browserVersion;

        return (
          <span className="text-muted-foreground flex items-center gap-2 capitalize">
            {parsed?.deviceType === "desktop" ? (
              <Monitor className="h-4 w-4" />
            ) : (
              <Phone className="h-4 w-4" />
            )}

            {isUnknown ? (
              t("common.unidentified")
            ) : (
              <>
                {parsed?.browser || t("common.unknown")}
                {parsed?.os ? ` on ${parsed.os}` : ""}
              </>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "ip_address",
      header: t("table.ip"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.ip_address}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: t("table.createdOn"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      accessorKey: "last_used_at",
      header: t("table.lastOnline"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.last_used_at)}
        </span>
      ),
    },
    {
      accessorKey: "expires_at",
      header: t("table.expireOn"),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.original.expires_at)}
        </span>
      ),
    },
    {
      id: "exp",
      header: t("table.expired"),
      cell: ({ row }) => {
        const item = row.original as SessionListData;
        const { label } = getExpired(item);
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
        const item = row.original as SessionListData;
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
      header: t("table.actions"),
      maxSize: 100,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              title={t("common_button.view.label") || "View"}
              onClick={(e) => {
                e.stopPropagation();
                openCenteredPopup(
                  `/action/sessions/view?id=${item.session_id}` +
                    `&device=${encodeURIComponent(item.device || "")}` +
                    `&ip=${encodeURIComponent(item.ip_address || "")}` +
                    `&created=${encodeURIComponent(item.created_at || "")}` +
                    `&online=${encodeURIComponent(item.last_used_at || "")}` +
                    `&expires=${encodeURIComponent(item.expires_at || "")}` +
                    `&active=${item.is_active}`,
                  "View Session Details",
                );
              }}
              className="cursor-pointer"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onSignOutOne(item.session_id)}
              className="cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/15"
              title={t("common.signout")}
              variant="ghost"
              size="icon"
            >
              <LogOut className="h-4 w-4" />
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
            {t("page_tab.sessions") || "Active Sessions"}
          </span>
        </div>
        <Button
          variant={"destructive"}
          size="sm"
          onClick={onSignOutAll}
          disabled={SignOutAll.isPending}
          className="cursor-pointer flex items-center gap-1.5"
        >
          {SignOutAll.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LogOut className="h-3.5 w-3.5" />
          )}
          <span>{t("common.end_all") || "End All"}</span>
        </Button>
      </div>

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as SessionListData[]}
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
