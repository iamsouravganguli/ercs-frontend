"use client";

import React from "react";
import { Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { Form } from "@/components/ui/form";
import { EntityStatusPanel } from "../entity-status-panel";
import { useTranslation } from "@/i18n";
import { useForm } from "react-hook-form";

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
  if (size == null || isNaN(Number(size))) return "—";
  const n = Number(size);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(2)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentViewModal({
  open,
  doc,
  onOpenChange,
  onPreview,
  statusList,
  isUpdating,
  onStatusUpdate,
  isCourtUser,
}: {
  open: boolean;
  doc: any | null;
  onOpenChange: (o: boolean) => void;
  onPreview?: (doc: any) => void;
  statusList?: any;
  isUpdating?: boolean;
  onStatusUpdate?: (code: string) => Promise<void> | void;
  isCourtUser?: boolean;
}) {
  const { t, lang } = useTranslation();
  const d = doc || {};
  const labelStatus = d.status_detail
    ? lang === "hi"
      ? d.status_detail.name || d.status_detail.name_en
      : d.status_detail.name_en || d.status_detail.name
    : d.status || "—";
  const codeStatus = d.status_detail?.code || "";

  const form = useForm<{ status_code: string }>({
    defaultValues: { status_code: codeStatus || "" },
  });
  React.useEffect(() => {
    if (d.status_detail?.code) form.setValue("status_code", d.status_detail.code);
  }, [d.status_detail?.code]);

  const uploadedAt = d.uploaded_at || d.created_at || "";
  const uploadedLabel = uploadedAt
    ? new Date(uploadedAt).toLocaleDateString(
        lang === "hi" ? "hi-IN" : "en-IN",
        { day: "2-digit", month: "short", year: "numeric" },
      )
    : "—";

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
          <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {t("case.documents.view_document") || "View Document"}
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
            {}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">
                {t("case.documents.title") || "Documents"}
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">File Name</p>
                  <p className="text-sm font-medium wrap-break-word">
                    {d.name || d.original_name || d.file_name || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Document Type</p>
                  <p className="text-sm font-medium">{d.type_of_doc || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Size</p>
                  <p className="text-sm font-medium">{formatSize(d.size)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Status</p>
                  <p className="text-sm font-medium">
                    {codeStatus ? (
                      <StatusBadge variant={getDocStatusVariant(codeStatus)}>
                        {labelStatus}
                      </StatusBadge>
                    ) : (
                      "—"
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Uploaded At</p>
                  <p className="text-sm font-medium">{uploadedLabel}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Remarks</p>
                  <p className="text-sm whitespace-pre-wrap wrap-break-word">
                    {d.remarks ? String(d.remarks) : "—"}
                  </p>
                </div>
              </div>
            </section>

            {}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <p className="text-sm font-semibold">Document File</p>
                <span className="text-xs text-muted-foreground">1 file</span>
              </div>
              <div className="p-6">
                <div className="border rounded-lg overflow-hidden divide-y divide-border">
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" title={d.name || d.original_name || d.file_name}>
                        {d.name || d.original_name || d.file_name || "Document"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {d.type_of_doc || "—"} • {formatSize(d.size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPreview?.(d)}
                        title={t("case.documents.view_document") || "View"}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {}
            {isCourtUser && statusList && onStatusUpdate && (
              <Form {...form}>
                <EntityStatusPanel
                  control={form.control as any}
                  name={"status_code" as any}
                  title={t("case.documents.title") ? `${t("case.documents.title")} Status` : "Document Status"}
                  statusList={statusList}
                  isUpdating={!!isUpdating}
                  onUpdate={async () => {
                    const code = form.getValues("status_code");
                    if (code) await onStatusUpdate(code);
                  }}
                  existingCode={d.status_detail?.code || d.status || ""}
                  watchCode={form.watch("status_code") as string}
                />
              </Form>
            )}
          </div>

          <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
            <Button variant="default" onClick={() => onOpenChange(false)} className="px-6">
              {t("common_button.close.label") || "Close"}
            </Button>
          </div>
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}
