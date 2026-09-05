"use client";

import * as React from "react";
import { useTranslation } from "@/i18n";
import {
  useAnnouncements,
  useDeleteAnnouncement,
  useProfileDetail,
  useQueryParams,
  withDefault,
  NumberParam,
  StringParam,
  Announcement,
  getFileUrl,
  useConfirm,
} from "@/lib";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-Input";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import {
  Plus,
  Trash2,
  FileDown,
  Pin,
  Pencil,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";

export default function AnnouncementsAdminPage() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const router = useRouter();
  const { data: profileRes, isLoading: isLoadingProfile } = useProfileDetail();
  const user = profileRes?.result?.data;


  React.useEffect(() => {
    if (!isLoadingProfile && profileRes) {
      const userRole = user?.role;
      const isAdmin =
        userRole === "SUPER_ADMIN" ||
        userRole === "ADMIN" ||
        userRole === "SA" ||
        userRole === "AD";
      if (!isAdmin) {
        router.replace("/");
      }
    }
  }, [profileRes, isLoadingProfile, user, router]);


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

  const { data: listResponse, refetch } = useAnnouncements({
    page: query.page,
    limit: query.limit,
    search: query.search,
  });

  const deleteMutation = useDeleteAnnouncement();

  const popupRef = React.useRef<Window | null>(null);
  const popupUrlRef = React.useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 600,
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

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_ANNOUNCEMENT_LIST") {
        refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [refetch]);

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
        refetch();
      } catch (error) {
        console.error("Failed to delete announcement:", error);
      }
    }
  };


  const columns: ColumnDef<Announcement>[] = [
    {
      accessorKey: "pinned",
      header: t("announcement.table.pin") || "Pin",
      maxSize: 60,
      cell: ({ row }) => {
        const val = row.getValue("pinned") as boolean;
        return val ? (
          <div className="flex justify-center">
            <Pin className="h-4 w-4 text-blue-600 dark:text-blue-400 fill-current" />
          </div>
        ) : null;
      },
    },
    {
      accessorKey: "title",
      header: t("announcement.table.title") || "Title",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground leading-snug">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: t("announcement.table.category") || "Category",
      maxSize: 130,
      cell: ({ row }) => {
        const categoryVal = row.getValue("category") as string;
        const capitalized = categoryVal
          ? categoryVal.charAt(0).toUpperCase() + categoryVal.slice(1)
          : "";
        return (
          <span className="text-sm font-medium text-foreground">
            {capitalized}
          </span>
        );
      },
    },
    {
      accessorKey: "date",
      header: t("announcement.table.date") || "Date & Time",
      maxSize: 180,
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        const dateVal = row.original.date;
        if (createdAt) {
          const d = new Date(createdAt);
          const pad = (n: number) => n.toString().padStart(2, "0");
          const yyyy = d.getFullYear();
          const mm = pad(d.getMonth() + 1);
          const dd = pad(d.getDate());
          const hours = d.getHours();
          const minutes = pad(d.getMinutes());
          const ampm = hours >= 12 ? "PM" : "AM";
          const hour12 = pad(hours % 12 || 12);
          return (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {`${yyyy}-${mm}-${dd} ${hour12}:${minutes} ${ampm}`}
            </span>
          );
        }
        return (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {dateVal}
          </span>
        );
      },
    },
    {
      accessorKey: "doc_url",
      header: t("announcement.table.file") || "Attachment",
      maxSize: 130,
      cell: ({ row }) => {
        const docUrl = row.original.doc_url;
        const externalUrl = row.original.external_url;
        if (docUrl) {
          return (
            <a
              href={getFileUrl(docUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <FileDown className="w-3.5 h-3.5" />
              {t("announcement.table.view_doc") || "View Document"}
            </a>
          );
        } else if (externalUrl) {
          return (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {t("announcement.table.view_link") || "View Link"}
            </a>
          );
        }
        return <span className="text-xs text-muted-foreground/60">—</span>;
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
                if (item.id) {
                  openCenteredPopup(
                    `/action/announcements/view?id=${item.id}`,
                    "View Announcement",
                  );
                }
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                if (item.id) {
                  openCenteredPopup(
                    `/action/announcements/edit?id=${item.id}`,
                    "Edit Announcement",
                  );
                }
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              title="Delete"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={(e) => {
                e.stopPropagation();
                if (item.id) handleDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoadingProfile) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userRole = user?.role;
  const isAdmin =
    userRole === "SUPER_ADMIN" ||
    userRole === "ADMIN" ||
    userRole === "SA" ||
    userRole === "AD";

  if (!isAdmin) {
    return null;
  }

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
            {t("page_tab.announcements") || "Announcements"}
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
              placeholder={
                t("announcement.search_placeholder") ||
                "Search announcements..."
              }
              className="w-full md:w-64"
            />
          </div>
          <Button
            onClick={() =>
              openCenteredPopup("/action/announcements/add", "Add Announcement")
            }
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

      {}
      <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(listResponse?.result?.data ?? []) as Announcement[]}
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
            listResponse?.result?.pagination as unknown as PaginationResponse
          }
          isError={
            listResponse?.errors !== null && listResponse?.success === false
          }
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            listResponse?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={refetch}
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
