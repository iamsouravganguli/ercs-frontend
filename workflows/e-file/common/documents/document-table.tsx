"use client";
import { Eye, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

export type DocumentTableProps = {
  files: any[];
  loading?: boolean;
  isSubmitted?: boolean;
  isCourtUser?: boolean;
  statuses?: any[];
  onAdd?: () => void;
  onView?: (doc: any) => void;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, statusId: number) => void;
  title?: string;
  addLabel?: string;
  emptyText?: string;
};

export function DocumentTable({
  files,
  loading,
  isSubmitted,
  isCourtUser,
  statuses = [],
  onAdd,
  onView,
  onDelete,
  onUpdateStatus,
  title,
  addLabel,
  emptyText,
}: DocumentTableProps) {
  const { t, lang } = useTranslation();
  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-4 sm:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            {title ?? t("case.documents.uploaded_files")}
          </CardTitle>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAdd}
              className="shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
              disabled={isSubmitted}
            >
              <span className="w-4 h-4 mr-2 flex items-center justify-center text-sm leading-none">+</span>
              {addLabel ?? t("case.documents.upload_btn")}
            </Button>
          )}
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
                {emptyText ?? t("case.documents.no_documents")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {}
            <div className="hidden md:block min-w-full align-middle">
              <table className="min-w-full divide-y divide-border text-left">
                <tbody className="divide-y divide-border bg-card">
                  {files.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/5 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white dark:bg-indigo-500">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate max-w-72" title={item.type_of_doc || item.original_name || item.name}>
                              {item.type_of_doc || t("case.documents.unknown_type")}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-72 mt-0.5">
                              {formatSize(item.size)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {item.status_detail?.name_en || item.status_detail?.name ? (
                          <StatusBadge variant={getDocStatusVariant(item.status_detail.code)}>
                            {lang === "hi" ? item.status_detail.name || item.status_detail.name_en : item.status_detail.name_en || item.status_detail.name}
                          </StatusBadge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-0.5">
                          {onView && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => onView(item)} title={t("case.documents.view_document")}>
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          {!isSubmitted && onDelete && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => onDelete(item.id)} title={t("case.documents.delete_document")}>
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
            <div className="block md:hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800">
              {files.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-zinc-900">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white dark:bg-indigo-500">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-none truncate">{item.type_of_doc || t("case.documents.unknown_type")}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {formatSize(item.size)}
                    </p>
                  </div>
                  {item.status_detail?.name_en || item.status_detail?.name ? (
                    <StatusBadge variant={getDocStatusVariant(item.status_detail.code)} className="shrink-0 scale-90 origin-right">
                      {lang === "hi" ? item.status_detail.name || item.status_detail.name_en : item.status_detail.name_en || item.status_detail.name}
                    </StatusBadge>
                  ) : (
                    <span className="text-[11px] text-muted-foreground shrink-0">—</span>
                  )}
                  <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                    {onView && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(item)} title={t("case.documents.view_document")}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    {!isSubmitted && onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(item.id)} title={t("case.documents.delete_document")}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
