"use client";
import { useEffect, useState, useRef } from "react";
import {
  useQueryParams,
  withDefault,
  NumberParam,
  StringParam,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { useUserList } from "../../query";
import { UserListService } from "../../services";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  DataTable,
  PaginationResponse,
} from "@/components/ui/data-grid";
import {
  Pencil,
  Plus,
  Eye,
  Filter,
  X,
  PanelLeft,
  Phone,
  User,
  Copy,
  Check,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchInput } from "@/components/ui/search-Input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CourtUserFilterSheet } from "./filter-sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface UserData {
  id: string | number;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  gender: string | null;
  gender_name: string | null;
  created_at: string;
  role_name: string;
  role_code: string;
  court_detail: {
    id: number;
    name: string;
    name_en: string;
    level_detail?: {
      id: number;
      code: string;
      name: string;
      name_en: string | null;
    } | null;
  } | null;
  status?: string | number | null;
  status_name?: string | null;
  status_code?: string | null;
  status_detail?: {
    id: number;
    code: string;
    name: string;
    name_en: string | null;
  } | null;
}

function UsernameCell({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(username);
      setCopied(true);
      toast.success("Username copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy username");
    }
  };

  return (
    <div className="flex items-center gap-2 group/copy">
      <span className="inline-flex items-center gap-1.5 text-[13px] text-neutral-700 dark:text-neutral-300 hover:text-foreground transition-colors truncate">
        <User className="w-3.5 h-3.5 shrink-0 text-neutral-400 dark:text-neutral-500" />
        <span className="truncate">{username}</span>
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 transition-all duration-150 p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md text-muted-foreground hover:text-foreground shrink-0"
        title="Copy username"
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

export default function CourtUserPage() {
  const { t, locale } = useTranslation();

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

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    limit: withDefault(NumberParam, 10),
    search: withDefault(StringParam, ""),
    court_level: withDefault(StringParam, undefined),
    court_id: withDefault(NumberParam, undefined),
    state_code_census: withDefault(StringParam, undefined),
    mandal_code: withDefault(StringParam, undefined),
    district_code_census: withDefault(StringParam, undefined),
    tehsil_code_census: withDefault(StringParam, undefined),
    pargana_code_census: withDefault(StringParam, undefined),
    ricircle_code: withDefault(StringParam, undefined),
    rsicircle_code: withDefault(StringParam, undefined),
    village_code_census: withDefault(StringParam, undefined),
    phone: withDefault(StringParam, undefined),
    email: withDefault(StringParam, undefined),
    role_code: withDefault(StringParam, undefined),
    created_at__gte: withDefault(StringParam, undefined),
    created_at__lte: withDefault(StringParam, undefined),
    is_active: withDefault(StringParam, undefined),
    status: withDefault(StringParam, undefined),
  });

  const { is_active, status, ...restQuery } = query;

  const hasFilters = !!(
    query.court_level ||
    query.court_id ||
    query.state_code_census ||
    query.mandal_code ||
    query.district_code_census ||
    query.tehsil_code_census ||
    query.pargana_code_census ||
    query.ricircle_code ||
    query.rsicircle_code ||
    query.village_code_census ||
    query.phone ||
    query.email ||
    query.role_code ||
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
      court_level: undefined,
      court_id: undefined,
      state_code_census: undefined,
      mandal_code: undefined,
      district_code_census: undefined,
      tehsil_code_census: undefined,
      pargana_code_census: undefined,
      ricircle_code: undefined,
      rsicircle_code: undefined,
      village_code_census: undefined,
      phone: undefined,
      email: undefined,
      role_code: undefined,
      created_at__gte: undefined,
      created_at__lte: undefined,
      is_active: undefined,
      status: undefined,
      page: 1,
    });
  };

  const fetchAllFilteredUsers = async (
    toastId: string,
  ): Promise<any[] | null> => {
    try {
      const basePayload: any = {
        search: query.search || undefined,
        "filters[role__code__in]": query.role_code || "PO,CO,CC,RI,RSI",
        "filters[court_level]": query.court_level || undefined,
        "filters[court_id]": query.court_id || undefined,
        "filters[state_code_census]": query.state_code_census || undefined,
        "filters[mandal_code]": query.mandal_code || undefined,
        "filters[district_code_census]":
          query.district_code_census || undefined,
        "filters[tehsil_code_census]": query.tehsil_code_census || undefined,
        "filters[pargana_code_census]": query.pargana_code_census || undefined,
        "filters[ricircle_code]": query.ricircle_code || undefined,
        "filters[rsicircle_code]": query.rsicircle_code || undefined,
        "filters[village_code_census]":
          query.village_code_census && !query.village_code_census.includes(",")
            ? query.village_code_census
            : undefined,
        "filters[village_code_census__in]":
          query.village_code_census && query.village_code_census.includes(",")
            ? query.village_code_census
            : undefined,
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
      };

      let allUsers: any[] = [];
      const batchLimit = 100;

      const firstResponse = await UserListService({
        ...basePayload,
        page: 1,
        limit: batchLimit,
      });

      const totalCount = firstResponse?.result?.pagination?.total || 0;
      allUsers = [...(firstResponse?.result?.data || [])];

      if (totalCount > batchLimit) {
        const totalPages = Math.ceil(totalCount / batchLimit);
        for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
          toast.loading(`Fetching batch ${currentPage} of ${totalPages}...`, {
            id: toastId,
          });
          const response = await UserListService({
            ...basePayload,
            page: currentPage,
            limit: batchLimit,
          });
          if (response?.result?.data) {
            allUsers = [...allUsers, ...response.result.data];
          }
        }
      }

      if (allUsers.length === 0) {
        toast.error("No data available", { id: toastId });
        return null;
      }

      return allUsers;
    } catch (error) {
      console.error("Error fetching all users for download:", error);
      toast.error("Failed to fetch download data", { id: toastId });
      return null;
    }
  };

  const handleDownloadExcel = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const toastId = toast.loading("Preparing Excel download...");

    const allUsers = await fetchAllFilteredUsers(toastId);
    if (!allUsers) {
      setIsDownloading(false);
      return;
    }

    try {
      toast.loading("Generating CSV file...", { id: toastId });

      const headers = [
        locale === "hi" ? "यूज़रनेम" : "Username",
        locale === "hi" ? "नाम" : "Name",
        locale === "hi" ? "भूमिका" : "Role",
        locale === "hi" ? "न्यायालय का नाम" : "Court Name",
        locale === "hi" ? "न्यायालय स्तर" : "Court Level",
        locale === "hi" ? "ईमेल" : "Email",
        locale === "hi" ? "फ़ोन नंबर" : "Phone Number",
        locale === "hi" ? "स्थिति" : "Status",
        locale === "hi" ? "पंजीकरण तिथि" : "Reg Date",
      ];

      const csvRows = [headers.join(",")];

      for (const user of allUsers) {
        const username = user.username || "-";
        const name = user.name || "-";
        const role_name = user.role_name || "-";

        const court = user.court_detail;
        const courtName = court
          ? locale === "hi"
            ? court.name
            : court.name_en || court.name
          : "-";
        const courtLevel = court?.level_detail
          ? locale === "hi"
            ? court.level_detail.name
            : court.level_detail.name_en || court.level_detail.name
          : "-";

        const email = user.email || "-";
        const phone = user.phone || "-";

        let status = "-";
        if (user.status_detail) {
          status =
            locale === "hi"
              ? user.status_detail.name
              : user.status_detail.name_en || user.status_detail.name;
        } else {
          status = user.is_active
            ? locale === "hi"
              ? "सक्रिय"
              : "Active"
            : locale === "hi"
              ? "निष्क्रिय"
              : "Inactive";
        }

        const regDate = user.created_at
          ? new Date(user.created_at).toLocaleDateString()
          : "-";

        const row = [
          `"${username.replace(/"/g, '""')}"`,
          `"${name.replace(/"/g, '""')}"`,
          `"${role_name.replace(/"/g, '""')}"`,
          `"${courtName.replace(/"/g, '""')}"`,
          `"${courtLevel.replace(/"/g, '""')}"`,
          `"${email.replace(/"/g, '""')}"`,
          `"${phone.replace(/"/g, '""')}"`,
          `"${status.replace(/"/g, '""')}"`,
          `"${regDate.replace(/"/g, '""')}"`,
        ];

        csvRows.push(row.join(","));
      }

      const csvString = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `court_users_${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download complete!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate CSV file", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    const toastId = toast.loading("Preparing PDF report...");

    const allUsers = await fetchAllFilteredUsers(toastId);
    if (!allUsers) {
      setIsDownloading(false);
      return;
    }

    try {
      toast.loading("Generating PDF window...", { id: toastId });

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Popup blocked! Please allow popups to download PDF.", {
          id: toastId,
        });
        setIsDownloading(false);
        return;
      }

      const titleText =
        locale === "hi"
          ? "राजस्व न्यायालय उपयोगकर्ता निर्देशिका"
          : "Revenue Court User Directory";

      const footerText =
        locale === "hi"
          ? `रिपोर्ट तैयार करने का समय और दिनांक: ${new Date().toLocaleString("hi-IN")}`
          : `Report Generated Date & Time: ${new Date().toLocaleString("en-US")}`;

      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${titleText}</title>
          <meta charset="utf-8" />
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

            body {
              font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
              color: #1f2937;
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }

            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px 10px;
              text-align: left;
              vertical-align: middle;
            }

            th {
              background-color: #f3f4f6;
              color: #111827;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.05em;
            }

            tr:nth-child(even) {
              background-color: #fafafa;
            }

            .badge {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 8px;
              font-weight: 600;
              text-transform: uppercase;
            }

            .badge-active {
              background-color: #d1fae5;
              color: #065f46;
              border: 1px solid #a7f3d0;
            }

            .badge-inactive {
              background-color: #fee2e2;
              color: #991b1b;
              border: 1px solid #fca5a5;
            }

            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              font-size: 8px;
              color: #6b7280;
              text-align: right;
              border-top: 1px solid #e5e7eb;
              padding-top: 6px;
              background-color: #fff;
              font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
            }

            @page {
              size: A4 landscape;
              margin: 10mm 10mm 15mm 10mm;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-footer">
            ${footerText}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">${locale === "hi" ? "क्र.सं." : "S.No."}</th>
                <th>${locale === "hi" ? "यूज़रनेम" : "Username"}</th>
                <th>${locale === "hi" ? "नाम" : "Name"}</th>
                <th>${locale === "hi" ? "भूमिका" : "Role"}</th>
                <th>${locale === "hi" ? "न्यायालय का नाम" : "Court Name"}</th>
                <th>${locale === "hi" ? "न्यायालय स्तर" : "Court Level"}</th>
                <th>${locale === "hi" ? "ईमेल / फ़ोन" : "Email / Phone"}</th>
                <th style="width: 10%; text-align: center;">${locale === "hi" ? "स्थिति" : "Status"}</th>
              </tr>
            </thead>
            <tbody>
      `;

      allUsers.forEach((user, idx) => {
        const username = user.username || "-";
        const name = user.name || "-";
        const role_name = user.role_name || "-";

        const court = user.court_detail;
        const courtName = court
          ? locale === "hi"
            ? court.name
            : court.name_en || court.name
          : "-";
        const courtLevel = court?.level_detail
          ? locale === "hi"
            ? court.level_detail.name
            : court.level_detail.name_en || court.level_detail.name
          : "-";

        const email = user.email || "";
        const phone = user.phone || "";
        let contact = "-";
        if (phone || email) {
          contact = `${phone}${phone && email ? " / " : ""}${email}`;
        }

        const is_active = user.is_active;
        let statusStr = "";
        let badgeClass = "badge-active";

        if (user.status_detail) {
          statusStr =
            locale === "hi"
              ? user.status_detail.name
              : user.status_detail.name_en || user.status_detail.name;
          if (user.status_detail.code !== "ACTIVE") {
            badgeClass = "badge-inactive";
          }
        } else {
          statusStr = is_active
            ? locale === "hi"
              ? "सक्रिय"
              : "Active"
            : locale === "hi"
              ? "निष्क्रिय"
              : "Inactive";
          if (!is_active) {
            badgeClass = "badge-inactive";
          }
        }

        html += `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-weight: 600; color: #1e3a8a;">${username}</td>
            <td>${name}</td>
            <td>${role_name}</td>
            <td>${courtName}</td>
            <td>${courtLevel}</td>
            <td style="font-family: monospace; font-size: 9px;">${contact}</td>
            <td style="text-align: center;">
              <span class="badge ${badgeClass}">${statusStr}</span>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 300);
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.write(html);
      printWindow.document.close();

      toast.success("PDF report generated successfully!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const data = useUserList({
    ...restQuery,
    search: query.search || undefined,
    "filters[role__code__in]": query.role_code || "PO,CO,CC,RI,RSI",
    "filters[court_level]": query.court_level || undefined,
    "filters[court_id]": query.court_id || undefined,
    "filters[state_code_census]": query.state_code_census || undefined,
    "filters[mandal_code]": query.mandal_code || undefined,
    "filters[district_code_census]": query.district_code_census || undefined,
    "filters[tehsil_code_census]": query.tehsil_code_census || undefined,
    "filters[pargana_code_census]": query.pargana_code_census || undefined,
    "filters[ricircle_code]": query.ricircle_code || undefined,
    "filters[rsicircle_code]": query.rsicircle_code || undefined,
    "filters[village_code_census]":
      query.village_code_census && !query.village_code_census.includes(",")
        ? query.village_code_census
        : undefined,
    "filters[village_code_census__in]":
      query.village_code_census && query.village_code_census.includes(",")
        ? query.village_code_census
        : undefined,
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
      } else if (event.data?.type === "APPLY_COURT_USER_FILTERS") {
        setQuery({
          ...query,
          ...event.data.filters,
          page: 1,
        });
      } else if (event.data?.type === "RESET_COURT_USER_FILTERS") {
        setQuery({
          ...query,
          court_level: undefined,
          court_id: undefined,
          state_code_census: undefined,
          mandal_code: undefined,
          district_code_census: undefined,
          tehsil_code_census: undefined,
          pargana_code_census: undefined,
          ricircle_code: undefined,
          rsicircle_code: undefined,
          village_code_census: undefined,
          phone: undefined,
          email: undefined,
          role_code: undefined,
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

  const columns: ColumnDef<UserData>[] = [
    {
      accessorKey: "username",
      header: t("basicInfo.username") || "Username",
      enablePinning: true,
      size: 150,
      minSize: 120,
      maxSize: 185,
      cell: ({ row }) => {
        const val = row.getValue("username") as string;
        if (!val) return "-";
        return <UsernameCell username={val} />;
      },
    },
    {
      accessorKey: "name",
      header: t("basicInfo.name") || "Name",
    },
    {
      accessorKey: "role_name",
      header: t("basicInfo.role") || "Role",
    },
    {
      id: "court_name",
      header: t("table.court_name") || "Court Name",
      cell: ({ row }) => {
        const court = row.original.court_detail;
        if (!court) return "-";
        return locale === "hi" ? court.name : court.name_en || court.name;
      },
    },
    {
      id: "court_level",
      header: t("table.court_level") || "Court Level",
      cell: ({ row }) => {
        const lvl = row.original.court_detail?.level_detail;
        if (!lvl) return "-";
        return locale === "hi" ? lvl.name : lvl.name_en || lvl.name;
      },
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
                  `/action/users/court/view?username=${item.username}`,
                  "View Court User",
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
                  `/action/users/court/edit?username=${item.username}`,
                  "Edit Court User",
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
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 px-4 w-full flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-3 py-3 md:py-0 h-auto md:h-14">

        <div className="flex items-center justify-between w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center shrink-0 md:hidden">
              <SidebarTrigger className="-ml-2" />
            </div>
            <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
              {t("page_tab.court_user") || "Court Users"}
            </span>
          </div>


          <div className="flex items-center gap-2 md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 bg-background/80 hover:bg-background border-neutral-200 dark:border-neutral-800"
                  title={locale === "hi" ? "डाउनलोड" : "Download"}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-1.5"
              >
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDownloadExcel}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <span>
                    {locale === "hi" ? "एक्सेल शीट (CSV)" : "Excel Sheet (CSV)"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDownloadPDF}
                >
                  <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-500 shrink-0" />
                  <span>
                    {locale === "hi"
                      ? "पीडीएफ दस्तावेज (PDF)"
                      : "PDF Document (PDF)"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              onClick={() => {
                openCenteredPopup("/action/users/court/add", "Add Court User");
              }}
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
            className="h-8 w-8 shrink-0 relative bg-background/80 hover:bg-background border-neutral-200 dark:border-neutral-800"
            title={t("common_button.filter.label") || "Filter"}
            aria-label={t("common_button.filter.label") || "Filter"}
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="h-4 w-4" />
            {hasFilters && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </Button>


          <div className="hidden md:flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-2.5 flex items-center gap-1.5 shrink-0 select-none text-xs font-semibold border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all rounded-lg"
                  title={
                    locale === "hi"
                      ? "डाउनलोड फ़ॉर्मेट चुनें"
                      : "Select Download Format"
                  }
                  disabled={isDownloading}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{locale === "hi" ? "डाउनलोड" : "Download"}</span>
                  <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-1.5"
              >
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDownloadExcel}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
                  <span>
                    {locale === "hi" ? "एक्सेल शीट (CSV)" : "Excel Sheet (CSV)"}
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={handleDownloadPDF}
                >
                  <FileText className="h-3.5 w-3.5 text-rose-600 dark:text-rose-500 shrink-0" />
                  <span>
                    {locale === "hi"
                      ? "पीडीएफ दस्तावेज (PDF)"
                      : "PDF Document (PDF)"}
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => {
                openCenteredPopup("/action/users/court/add", "Add Court User");
              }}
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
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          data={(data?.data?.result?.data ?? []) as UserData[]}
          columns={columns}
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
            data?.data?.result?.pagination as unknown as PaginationResponse
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

      <CourtUserFilterSheet
        isOpen={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        query={query}
        setQuery={setQuery}
      />
    </div>
  );
}
