"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  Layers,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  CommonsApiServices,
  useStatusList,
  useSessionCheck,
  useCaseDetail,
  getFileUrl,
} from "@/lib";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";

const getDocStatusVariant = (
  code: string,
): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "DOCUMENT_VERIFIED":
      return "success";
    case "DOCUMENT_REJECTED":
    case "DOCUMENT_FAILED":
      return "error";
    case "DOCUMENT_IN_REVIEW":
      return "warning";
    case "DOCUMENT_UPLOADED":
      return "info";
    default:
      return "neutral";
  }
};

export default function CaseDocumentsPage() {
  const { case_number } = useParams<{
    case_number: string;
  }>();
  const router = useRouter();
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(case_number as string);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

  const sessionCheck = useSessionCheck();
  const role = sessionCheck.data?.result?.data?.role?.toUpperCase();
  const isCourtUser = ["PO", "CO", "CC", "SA", "RI", "RSI"].includes(
    role || "",
  );

  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: statusRes } = useStatusList({ "filters[type]": "DOCUMENT" });
  const statuses = statusRes?.result?.data || [];


  const fetchDocuments = async () => {
    if (!case_number) return;
    setLoading(true);
    try {
      const response =
        await CommonsApiServices.CaseDocumentListService(case_number);
      const docs =
        response?.result?.data ||
        response?.data?.results ||
        response?.results ||
        [];


      const mappedDocs = docs.map((d: any) => ({
        id: String(d.id),
        name: d.file_name || "Unknown",
        type_of_doc: d.type_of_doc || "Other",
        remarks: d.remarks || "",
        status: d.status,
        status_detail: d.status_detail,
        file_url: d.file_url,
        size: d.file_size_mb ? d.file_size_mb * 1024 * 1024 : 0,
        type: d.mime_type || "application/pdf",
        uploaded_at: d.created_at || new Date().toISOString(),
      }));
      setFiles(mappedDocs);
    } catch (err) {
      console.error("Failed to fetch documents from server", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [case_number]);


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-documents") {
        fetchDocuments();
      }
    };

    const handleFocus = () => {
      fetchDocuments();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [case_number]);

  const openAddPopup = () => {
    if (!case_number) return;
    const width = 850;
    const height = 900;

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

    window.open(
      `/case/${case_number}/documents/add`,
      "DocumentFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  async function updateFileStatus(id: string, statusId: number) {
    if (isNaN(Number(id))) {
      toast.error("Can only update status of documents saved to the server.");
      return;
    }
    try {
      await CommonsApiServices.CaseDocumentUpdateStatusService(id, statusId);
      toast.success(t("case.documents.status_updated_toast"));
      await fetchDocuments();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error(
        err?.message || t("case.documents.status_update_failed_toast"),
      );
    }
  }

  async function deleteFile(id: string) {
    if (!confirm(t("case.documents.confirm_delete"))) return;
    try {
      if (!isNaN(Number(id))) {
        await CommonsApiServices.CaseDocumentDeleteService(id);
      }
      toast.success(t("case.documents.deleted_toast"));
      await fetchDocuments();
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      toast.error(t("case.documents.delete_failed_toast"));
    }
  }

  function previewFile(doc: any) {
    const url = doc.file
      ? URL.createObjectURL(doc.file)
      : getFileUrl(doc.file_url);
    if (!url) {
      toast.error("File URL is missing or file is corrupted.");
      return;
    }

    const width = 850;
    const height = 900;

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

    window.open(
      url,
      "DocumentPreviewPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  }

  function formatSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="flex flex-col h-full bg-background dark:bg-neutral-950 overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.documents.total_documents")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {files.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.documents.total_size")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {files.length > 0
                  ? formatSize(
                      files.reduce((acc: number, f: any) => acc + f.size, 0),
                    )
                  : "0 B"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.documents.document_types")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {new Set(files.map((f: any) => f.type_of_doc)).size}
              </p>
            </div>
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <CardTitle className="text-sm font-semibold">
                  {t("case.documents.uploaded_files")}
                </CardTitle>
              </div>
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={openAddPopup}
                disabled={isSubmitted}
              >
                <UploadCloud className="w-4 h-4 mr-2" />
                {t("case.documents.upload_btn")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground italic">
                {t("case.documents.loading_repo")}
              </div>
            ) : files.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("case.documents.no_documents")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-left">
                    <tbody className="bg-background divide-y divide-border">
                      {files.map((item: any) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/10 transition-colors"
                        >
                          <td
                            className="px-6 py-4 whitespace-nowrap text-xs text-foreground font-medium max-w-64 truncate"
                            title={item.original_name}
                          >
                            {item.original_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md select-none bg-primary/10 text-primary border-transparent"
                            >
                              {item.type_of_doc ||
                                t("case.documents.unknown_type")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground">
                            {formatSize(item.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground">
                            {item.status_detail?.name_en || item.status_detail?.name ? (
                              <StatusBadge
                                variant={getDocStatusVariant(
                                  item.status_detail.code,
                                )}
                              >
                                {lang === "hi"
                                  ? item.status_detail.name ||
                                    item.status_detail.name_en
                                  : item.status_detail.name_en ||
                                    item.status_detail.name}
                              </StatusBadge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-muted"
                                onClick={() => previewFile(item)}
                                title={t("case.documents.view_document")}
                              >
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              {!isSubmitted && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteFile(item.id)}
                                  title={t("case.documents.delete_document")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {}
                <div className="md:hidden divide-y divide-border">
                  {files.map((item: any) => (
                    <div
                      key={item.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 text-left">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 font-medium">
                          <p className="text-xs font-semibold truncate">
                            {item.original_name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider rounded-md select-none bg-primary/10 text-primary border-transparent"
                            >
                              {item.type_of_doc ||
                                t("case.documents.unknown_type")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {formatSize(item.size)}
                            </span>
                            <span className="text-muted-foreground/30 text-[10px]">
                              •
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(item.uploaded_at).toLocaleDateString(
                                lang === "hi" ? "hi-IN" : "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status_detail?.name_en || item.status_detail?.name ? (
                          <StatusBadge
                            variant={getDocStatusVariant(
                              item.status_detail.code,
                            )}
                          >
                            {lang === "hi"
                              ? item.status_detail.name ||
                                item.status_detail.name_en
                              : item.status_detail.name_en ||
                                item.status_detail.name}
                          </StatusBadge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        )}

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => previewFile(item)}
                            title={t("case.documents.view_document")}
                          >
                            <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                          {!isSubmitted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteFile(item.id)}
                              title={t("case.documents.delete_document")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <div className="h-14 flex items-center justify-end border-t border-border bg-white dark:bg-neutral-950 px-8 z-10 relative shrink-0">
        <Button
          type="button"
          disabled={isSubmitted || files.length === 0}
          className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-sm transition-all duration-150 disabled:bg-emerald-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-emerald-800/35 dark:disabled:text-white/60"
          onClick={() => {
            router.push(`/case/${case_number}/review`);
          }}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <span>{t("case.documents.next_btn")}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
