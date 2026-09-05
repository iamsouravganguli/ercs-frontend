"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { publicClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CustomModal, CustomModalBody } from "@/components/ui/custom-modal";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Clock, Loader2, Trash2, FileText, UploadCloud } from "lucide-react";
import { useDocQRSessionDetail } from "@/lib";
import { useTranslation } from "@/i18n";
import { getFileUrl } from "@/lib";
import { DocumentTable } from "@/workflows/e-file/common/documents/document-table";
import { DocumentPreviewModal, DocumentDeleteConfirmDialog } from "@/workflows/e-file/common/documents/document-modals";


function formatCountdown(sec: number) {
  if (sec <= 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function formatSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED_MIME = "application/pdf";

const docFormSchema = z.object({
  file: z.instanceof(File, { message: "Please select a PDF file first" }),
  docType: z.string().trim().min(1, "Document category is required"),
  remarks: z.string().optional(),
});
type DocFormValues = z.infer<typeof docFormSchema>;


type PendingRow = {
  localId: string;
  file: File;
  docType: string;
  remarks: string;
  objectUrl: string;
};


function QrDocumentUploadModal({
  open,
  onOpenChange,
  tokenType,
  onAddPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tokenType?: string;
  onAddPending: (row: PendingRow) => void;
}) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const form = useForm<DocFormValues>({
    resolver: zodResolver(docFormSchema),
    defaultValues: { docType: tokenType || "", remarks: "" },
  });

  useEffect(() => {
    if (open && tokenType) form.setValue("docType", tokenType);
    if (!open) {
      setPendingFile(null);
      setCurrentStep(1);
      form.reset({ docType: tokenType || "", remarks: "" });
    }
  }, [open, tokenType]);

  const handlePick = (f: FileList | null) => {
    if (!f || f.length === 0) return;
    const file = f[0];
    if (file.type !== ALLOWED_MIME) {
      toast.error(t("case.document_form.toasts.invalid_type"));
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(t("case.document_form.toasts.file_too_large"));
      return;
    }
    setPendingFile(file);
    form.setValue("file" as any, file as any);
  };

  const handleNext = () => {
    if (!pendingFile) {
      toast.error(t("case.document_form.toasts.select_file_first"));
      return;
    }
    setCurrentStep(2);
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1) as 1 | 2);

  const onSubmit = form.handleSubmit((data) => {
    if (currentStep === 1) {
      if (!pendingFile) {
        toast.error(t("case.document_form.toasts.select_file_first"));
        return;
      }
      setCurrentStep(2);
      return;
    }
    if (!pendingFile) return;

    const row: PendingRow = {
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file: pendingFile,
      docType: data.docType.trim(),
      remarks: (data.remarks || "").trim(),
      objectUrl: URL.createObjectURL(pendingFile),
    };
    onAddPending(row);
    toast.success(t("case.qr_upload.added_to_queue") || "Added to this session");
    onOpenChange(false);
  });

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-full max-w-[850px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        <div className="flex flex-col h-full bg-card overflow-hidden relative">
          <div className="h-14 flex items-center justify-between px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">{t("case.document_form.title")}</h1>
          </div>
          <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
            <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / 2) * 100}%` }} />
          </div>
          <Form {...form}>
            <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden h-full min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
                {currentStep === 1 && (
                  <div className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                      {t("case.document_form.steps.file")}
                    </div>
                    <div className="p-6">
                      {!pendingFile ? (
                        <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                          <UploadCloud className="w-12 h-12 text-primary/50 mb-4" />
                          <span className="text-sm font-medium text-foreground">{t("case.document_form.labels.click_to_select")}</span>
                          <span className="text-xs text-muted-foreground mt-1">{t("case.document_form.labels.max_size")}</span>
                          <input hidden type="file" accept=".pdf,application/pdf" onChange={(e) => { handlePick(e.target.files); e.target.value = ""; }} />
                        </label>
                      ) : (
                        <div className="border rounded-lg bg-muted/20 h-9 flex items-center px-3 gap-2 group transition-colors hover:border-destructive/30">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                            <p className="text-xs text-muted-foreground whitespace-nowrap">({formatSize(pendingFile.size)})</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPendingFile(null);
                              form.setValue("file" as any, undefined as any);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded-sm p-1 -mr-1"
                            title={t("case.document_form.labels.remove_file")}
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                      {t("case.document_form.steps.details")}
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="border rounded-lg bg-muted/20 h-9 flex items-center px-3 gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{pendingFile?.name}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">({pendingFile ? formatSize(pendingFile.size) : ""})</p>
                        </div>
                      </div>
                      <TextFieldV2 control={form.control} name="docType" label={t("case.document_form.fields.category.label")} placeholder={t("case.document_form.fields.category.placeholder")} required />
                      <TextFieldV2 control={form.control} name="remarks" label={t("case.document_form.fields.remarks.label")} placeholder={t("case.document_form.fields.remarks.placeholder")} />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-5">
                  {t("case.document_form.buttons.cancel")}
                </Button>
                <div className="flex gap-2">
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack} className="px-5">
                      {t("case.qr_upload.actions.back")}
                    </Button>
                  )}
                  {currentStep === 1 ? (
                    <Button type="button" className="px-6 bg-primary hover:bg-primary/90" onClick={handleNext} disabled={!pendingFile}>
                      {t("case.qr_upload.actions.next")}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={!form.watch("docType")?.trim() || !pendingFile} className="px-6">
                      {t("case.qr_upload.actions.add") || "Add"}
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </Form>
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}


export function UploadClient({ token: initialToken }: { token?: string | null }) {
  const router = useRouter();
  const { t } = useTranslation();
  const token = initialToken || "";
  const { data, isLoading, isError, error } = useDocQRSessionDetail(token, !!token);
  const raw = (data as any)?.result?.data ?? (data as any)?.data ?? (data as any) ?? null;
  const tokenInfo: any = raw
    ? { model: raw.linked_model, object_id: raw.linked_object_id, type_of_doc: raw.type_of_doc, expires_at: raw.expires_at, payment: raw.payment, case_number: raw.case_number }
    : null;

  const [expiresIn, setExpiresIn] = useState<number | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingRows, setPendingRows] = useState<PendingRow[]>([]);
  const [isDoneUploading, setIsDoneUploading] = useState(false);
  const [doneError, setDoneError] = useState<string | null>(null);
  const [deleteTargetLocalId, setDeleteTargetLocalId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [previewIsLocal, setPreviewIsLocal] = useState(false);

  const isExpired410 = (error as any)?.response?.status === 410 || (error as any)?.status === 410;


  useEffect(() => {
    return () => {
      for (const r of pendingRows) {
        try { URL.revokeObjectURL(r.objectUrl); } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!token) router.replace("/");
  }, [token, router]);
  useEffect(() => {
    if (!isExpired410) return;
    const tt = setTimeout(() => router.replace("/"), 2000);
    return () => clearTimeout(tt);
  }, [isExpired410, router]);


  useEffect(() => {
    if (!raw?.expires_at) {
      if (raw) setExpiresIn(300);
      return;
    }
    const expiresAt = new Date(raw.expires_at).getTime();
    const serverTime = raw.server_time ? new Date(raw.server_time).getTime() : null;
    const baseNow = serverTime ? serverTime : Date.now();
    const clockOffset = Date.now() - baseNow;
    const compute = () => Math.max(0, Math.floor((expiresAt - (Date.now() - clockOffset)) / 1000));
    setExpiresIn(compute());
    const id = setInterval(() => setExpiresIn(compute()), 1000);
    return () => clearInterval(id);
  }, [raw]);


  useEffect(() => {
    if (expiresIn !== 0) return;
    const tt = setTimeout(() => router.replace("/"), 1200);
    return () => clearTimeout(tt);
  }, [expiresIn, router]);


  const tableFiles = useMemo(() => {
    return pendingRows.map((r) => ({
      id: r.localId,
      name: r.file.name,
      file_name: r.file.name,
      original_name: r.file.name,
      type_of_doc: r.docType,
      remarks: r.remarks,
      file_url: r.objectUrl,
      objectUrl: r.objectUrl,
      size: r.file.size,
      status: null,
      status_detail: null,
      uploaded_at: new Date().toISOString(),
    }));
  }, [pendingRows]);

  const handleAddPending = (row: PendingRow) => {
    setPendingRows((prev) => [row, ...prev]);
    setDoneError(null);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetLocalId(id);
  };
  const confirmDelete = () => {
    if (!deleteTargetLocalId) return;
    const row = pendingRows.find((r) => r.localId === deleteTargetLocalId);
    if (row) {
      try { URL.revokeObjectURL(row.objectUrl); } catch {}
    }
    setPendingRows((prev) => prev.filter((r) => r.localId !== deleteTargetLocalId));
    setDeleteTargetLocalId(null);
    toast.success(t("case.documents.deleted_toast"));
  };

  const handleView = (doc: any) => {

    if (doc.objectUrl || doc.file_url?.startsWith("blob:")) {
      const url = doc.objectUrl || doc.file_url;
      setPreviewIsLocal(true);
      setPreviewDoc(doc);
      setPreviewUrl(url);
      return;
    }
    const url = getFileUrl(doc.file_url);
    if (!url) {
      toast.error(t("case.qr_upload.file_url_missing"));
      return;
    }
    setPreviewIsLocal(false);
    setPreviewDoc(doc);
    setPreviewUrl(url);
  };

  const handleDone = async () => {
    if (isExpired410) {
      toast.error(t("case.qr_upload.expired_title"));
      router.replace("/");
      return;
    }
    if (pendingRows.length === 0) {
      router.push("/");
      return;
    }
    if (!token) return;
    setIsDoneUploading(true);
    setDoneError(null);
    let failed = 0;
    const succeededIds: string[] = [];

    for (const row of [...pendingRows].reverse()) {

      try {
        const fd = new FormData();
        fd.append("file", row.file);
        fd.append("type_of_doc", row.docType);
        if (row.remarks) fd.append("remarks", row.remarks);
        await publicClient.post(`/doc/qr/session/${token}/upload/`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        succeededIds.push(row.localId);
      } catch (e: any) {
        failed += 1;
        const msg = e?.response?.data?.message || e?.message || t("case.document_form.toasts.failed");
        toast.error(`${row.file.name}: ${msg}`);

      }
    }

    if (succeededIds.length > 0) {
      for (const id of succeededIds) {
        const row = pendingRows.find((r) => r.localId === id);
        if (row) { try { URL.revokeObjectURL(row.objectUrl); } catch {} }
      }
      setPendingRows((prev) => prev.filter((r) => !succeededIds.includes(r.localId)));
    }

    try { await publicClient.post(`/doc/qr/session/${token}/expire/`); } catch {}
    setIsDoneUploading(false);
    if (failed === 0) {
      const n = succeededIds.length;
      toast.success(n === 1 ? t("case.document_form.toasts.success") : `${n} ${t("case.documents.uploaded_files") || "documents"} — ${t("case.document_form.toasts.success")}`);
      router.push("/");
    } else {
      setDoneError(
        `${succeededIds.length} uploaded, ${failed} failed. ${t("case.qr_upload.retry_failed") || "Please fix or remove failed items and try Done again."}`
      );
    }
  };

  const handleCancel = async () => {

    try { await publicClient.post(`/doc/qr/session/${token}/expire/`); } catch {}
    for (const r of pendingRows) {
      try { URL.revokeObjectURL(r.objectUrl); } catch {}
    }
    setPendingRows([]);
    router.push("/");
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("case.qr_upload.validating")}</p>
            <p className="text-xs text-muted-foreground">{t("case.qr_upload.validating_sub")}</p>
          </div>
        </div>
      </div>
    );
  }
  if (isError || expiresIn === 0) {
    const msg = (error as any)?.response?.data?.message || t("case.qr_upload.expired_fallback");
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-6">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-10 text-center space-y-3">
            <p className="text-sm font-medium">{t("case.qr_upload.expired_title")}</p>
            <p className="text-sm text-muted-foreground">{msg}</p>
            <p className="text-xs text-muted-foreground">{t("case.qr_upload.expired_hint")}</p>
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => router.push("/")}>{t("case.qr_upload.actions.cancel")}</Button>
              <Button onClick={() => router.push("/")}>{t("case.qr_upload.actions.done")}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const deleteTarget = pendingRows.find((r) => r.localId === deleteTargetLocalId) as any;
  const previewNeedsRevoke = previewIsLocal && previewUrl.startsWith("blob:");


  const phoneDetail = (() => {
    const p: any = tokenInfo?.payment;
    if (!p) return null;
    const md = p.metadata || {};
    const payNo = p.payment_number || p.reference_no || (p.id != null ? `#${p.id}` : null);
    return {
      caseNumber: tokenInfo?.case_number || p.object_id || tokenInfo?.object_id || null,
      paymentId: payNo,
      typeLabel: p.payment_type_detail?.name_en || p.payment_type_detail?.name || md.description || p.description || null,
      typeCode: p.payment_type_detail?.code || p.payment_type || null,
      modeLabel: p.payment_mode_detail?.name_en || p.payment_mode_detail?.name || p.payment_mode || null,
      amountInr: typeof p.amount_in_inr === "number" ? p.amount_in_inr : (typeof p.amount === "number" ? p.amount / 100 : null),
      amountStr: (() => { try { const v = typeof p.amount_in_inr === "number" ? p.amount_in_inr : p.amount / 100; return `${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; } catch { return null; } })(),
      amountStrNode: (() => { try { const v = typeof p.amount_in_inr === "number" ? p.amount_in_inr : p.amount / 100; const s = Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return s; } catch { return null; } })(),
      txn: md.transaction_id || p.transaction_id || null,
      remarks: md.remarks || md.notes || null,
      statusCode: (p.status_detail?.code || p.status || "").toUpperCase(),
      statusLabel: p.status_detail?.name_en || p.status_detail?.name || p.status || null,
    };
  })();
  const isPaidPhone = !!phoneDetail && (phoneDetail.statusCode === "PAYMENT_PAID" || phoneDetail.statusCode === "PAID");

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 space-y-6">
      {}
      <div className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {tokenInfo && (
              <>
                {phoneDetail?.caseNumber ? (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium max-w-[52vw] truncate" title={String(phoneDetail.caseNumber)}>
                    {t("case.review.receipt_case_number") || "Case Number"}: {phoneDetail.caseNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium">
                    {tokenInfo.model} #{tokenInfo.object_id}
                  </span>
                )}
                {phoneDetail?.paymentId ? (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium">{t("case.review.receipt_order_id") || "Payment ID"} {phoneDetail.paymentId}</span>
                ) : null}
                {tokenInfo.type_of_doc && !phoneDetail ? <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-medium">{tokenInfo.type_of_doc}</span> : null}
              </>
            )}
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm px-3.5 py-1.5 text-xs font-semibold tracking-tight text-zinc-700 dark:text-zinc-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            <Clock className="h-3.5 w-3.5 opacity-70" />
            {t("case.qr_upload.timer_label")} <span className="tabular-nums font-bold">{formatCountdown(expiresIn ?? 0)}</span>
          </span>
        </div>
        {phoneDetail ? (
          <div className="py-2 space-y-4">
            {}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.receipt_case_number") || "Case Number"} &amp; {t("case.review.receipt_order_id") || "Payment Order"}</div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.receipt_case_number") || "Case Number"}</p>
                  <p className="text-sm font-medium wrap-break-word">{phoneDetail.caseNumber || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.receipt_order_id") || "Payment Order ID"}</p>
                  <p className="text-sm font-medium wrap-break-word">{phoneDetail.paymentId || "—"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_step1") || "Type & Mode"}</div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.payments_mode") || "Payment Mode"}</p>
                  <p className="text-sm font-medium">{phoneDetail.modeLabel || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.payments_type") || "Payment Type"}</p>
                  <p className="text-sm font-medium">{phoneDetail.typeLabel || "—"}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.payments_txn") || "Transaction / Challan No"}</p>
                  <p className="text-sm font-medium wrap-break-word">{phoneDetail.txn || "—"}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_view_amount_status") || "Amount & Status"}</div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.payments_amount") || "Amount"}</p>
                  <p className="text-sm font-bold tracking-tight">{phoneDetail.amountStr ? <><span className="text-[15px] mr-0.5">₹</span>{phoneDetail.amountStr}</> : "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground capitalize">{t("case.review.payments_status") || "Status"}</p>
                  <p className="text-sm font-medium">{phoneDetail.statusLabel || "—"}</p>
                </div>
              </div>
            </div>
            {phoneDetail.remarks ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_view_remarks") || "Remarks"}</div>
                <div className="p-6">
                  <p className="text-sm whitespace-pre-wrap wrap-break-word">{phoneDetail.remarks}</p>
                </div>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">{t("case.qr_upload.context_hint")}</p>
          </div>
        ) : (
          <div className="py-2 text-xs text-muted-foreground">
            <span>{t("case.qr_upload.context_hint")}</span>
          </div>
        )}
      </div>

      <DocumentTable files={tableFiles as any} loading={false} onAdd={() => setUploadOpen(true)} onView={handleView} onDelete={handleDelete} />

      {doneError && (
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{doneError}</p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleCancel} disabled={isDoneUploading} className="flex-1 h-10">
          {t("case.qr_upload.actions.cancel")}
        </Button>
        <Button variant="default" onClick={handleDone} disabled={isDoneUploading} className="flex-1 h-10 gap-2">
          {isDoneUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isDoneUploading ? t("case.document_form.buttons.uploading") : pendingRows.length === 0 ? t("case.qr_upload.actions.done") : `${t("case.qr_upload.actions.done")} · ${pendingRows.length}`}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        {pendingRows.length === 0
          ? t("case.documents.qr_timer_note")
          : t("case.qr_upload.pending_hint") || "Files are queued in this session. Tap Done to upload them together."}
      </p>

      <QrDocumentUploadModal open={uploadOpen} onOpenChange={setUploadOpen} tokenType={tokenInfo?.type_of_doc} onAddPending={handleAddPending} />

      <DocumentPreviewModal
        previewDoc={previewDoc}
        previewUrl={previewUrl}
        onClose={() => {
          if (previewNeedsRevoke) {


          }
          setPreviewDoc(null);
          setPreviewUrl("");
          setPreviewIsLocal(false);
        }}
      />
      <DocumentDeleteConfirmDialog
        open={!!deleteTargetLocalId}
        onOpenChange={(o) => { if (!o) setDeleteTargetLocalId(null); }}
        onConfirm={confirmDelete}
        docName={deleteTarget?.file?.name || (deleteTarget as any)?.original_name}
      />
      </div>
    </div>
  );
}
export const QRUpload = UploadClient;
