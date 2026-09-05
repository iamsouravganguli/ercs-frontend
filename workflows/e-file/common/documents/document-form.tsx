"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { UploadCloud, FileText, Trash2, Loader2, QrCode, Upload, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CommonsApiServices, useDocQRSessionCreate, useDocQRSessionExpire } from "@/lib";
import { useTranslation } from "@/i18n";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const documentSchema = z.object({
  docType: z.string().min(1, "Document Category is required"),
  remarks: z.string().optional(),
});

export function DocumentForm({
  onClose,
  onSuccess,
}: { onClose?: () => void; onSuccess?: () => void } = {}) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t } = useTranslation();

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = typeof navigator !== "undefined" ? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) : false;
  const [uploadMode, setUploadMode] = useState<"manual" | "qr">("manual");
  const qr = useDocQRSessionCreate();
  const qrExpire = useDocQRSessionExpire();
  const [secLeft, setSecLeft] = useState(300);
  const qrToken: string | null = (() => {
    const d: any = (qr as any).data?.result?.data ?? (qr as any).data?.result ?? (qr as any).data;
    return (d?.token as string) || null;
  })();


  const resolveApiBase = () => {
    const envUrl = (process.env.NEXT_PUBLIC_API_URL as string) || "";
    if (typeof window === "undefined" || (window.location.protocol as string) !== "http:") return envUrl;
    const hostname = window.location.hostname;
    const isLanIp = /^(192\.168|10|172\.(1[6-9]|2\d|3[01])|100\.)/.test(hostname);
    if (!isLanIp) return envUrl;
    return `http:
  };
  const sendExpireBeacon = (tok: string) => {
    try {
      const url = `/doc/qr/session/${tok}/expire/`;
      const base = resolveApiBase();
      const full = base ? `${String(base).replace(/\/$/, "")}${url}` : url;
      fetch(full, {
        method: "POST",
        keepalive: true,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).catch(() => {});
    } catch {}
  };
  const qrTokenRef = React.useRef<string | null>(null);
  const qrExpiredRef = React.useRef(false);
  React.useEffect(() => { qrTokenRef.current = qrToken; }, [qrToken]);
  React.useEffect(() => {
    return () => {
      if (qrExpiredRef.current) return;
      const tok = qrTokenRef.current;
      if (tok) {
        qrExpiredRef.current = true;
        sendExpireBeacon(tok as string);
      }
    };
  }, []);
  useEffect(() => {
    if (uploadMode !== "qr" || !qr.data) return;
    const d: any = qr.data?.result?.data ?? qr.data?.result ?? qr.data;
    if (d?.expires_at) {
      const exp = new Date(d.expires_at).getTime() - Date.now();
      setSecLeft(Math.max(0, Math.floor(exp / 1000)));
    } else setSecLeft(300);
    const id = setInterval(() => setSecLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [uploadMode, qr.data]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleNext = async () => {
    if (currentStep === 1 && !pendingFile) {
      toast.error(
        t("case.document_form.toasts.select_file_first") ||
          "Please select a file first",
      );
      return;
    }
    if (currentStep === 1) {
      setCurrentStep(2);
      return;
    }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const form = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      docType: "",
      remarks: "",
    },
  });

  function formatSize(size: number) {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / 1024 / 1024).toFixed(2)} MB`;
  }

  function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    if (file.type !== "application/pdf") {
      toast.error(t("case.document_form.toasts.invalid_type"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("case.document_form.toasts.file_too_large"));
      return;
    }

    setPendingFile(file);
  }


  const isManualUploadingRef = React.useRef(false);
  const handleUploadSubmit = async () => {
    if (currentStep !== 2) return;
    if (isManualUploadingRef.current) return;
    if (!pendingFile || !case_number) return;
    const ok = await form.trigger(["docType"]);
    if (!ok) return;
    const data = form.getValues();
    if (!data.docType?.trim()) {
      form.setError("docType", { message: "Document Category is required" } as any);
      return;
    }
    isManualUploadingRef.current = true;
    setLoading(true);
    try {
      const type_of_doc = data.docType.trim();

      await CommonsApiServices.CaseDocumentUploadService(
        case_number as string,
        pendingFile,
        type_of_doc,
        data.remarks,
      );

      toast.success(t("case.document_form.toasts.success"));
      if (qrToken && !qrExpiredRef.current) { qrExpiredRef.current = true; sendExpireBeacon(qrToken as string); qrExpire.mutate(qrToken as string, { onError: () => {} } as any); }

      if (window.opener) {
        try {
          window.opener.postMessage(
            "refetch-documents",
            window.location.origin,
          );
        } catch (e) {
          window.opener.postMessage("refetch-documents", "*");
        }
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
      else window.close();
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(t("case.document_form.toasts.failed"));
    } finally {
      setLoading(false);
      isManualUploadingRef.current = false;
    }
  };

  const handleCancel = () => {
    if (uploadMode === "qr" && qrToken && !qrExpiredRef.current) {
      qrExpiredRef.current = true;
      sendExpireBeacon(qrToken as string);
      qrExpire.mutate(qrToken as string, { onError: () => {} } as any);
    }
    if (onClose) onClose();
    else window.close();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      {}
      <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("case.document_form.title")}
        </h1>
      </div>

      {}
      <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / 2) * 100}%` }}
        />
      </div>

      <Form {...form}>
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== 2) {
              const target = e.target as HTMLElement | null;
              if (target && target.tagName === "TEXTAREA") return;
              e.preventDefault();
            }
          }}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
          onSubmit={(e) => e.preventDefault()}
        >
          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
            {currentStep === 1 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                  {t("case.document_form.steps.file")}
                </div>
                {!isMobile && (
                  <div className="px-6 pt-4 flex gap-2">
                    <button type="button" onClick={() => { if (qrToken && !qrExpiredRef.current) { qrExpiredRef.current = true; sendExpireBeacon(qrToken as string); qrExpire.mutate(qrToken as string, { onError: () => {} } as any); } setUploadMode("manual"); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium ${uploadMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-zinc-900"}`}>
                      <Upload className="w-4 h-4" /> {t("case.documents.manual_upload")}
                    </button>
                    <button type="button" onClick={() => { if (qr.data && secLeft > 0) { setUploadMode("qr"); return; } setUploadMode("qr"); const host = typeof window !== "undefined" ? window.location.origin : ""; qr.mutate({ linked_model: "CaseModel", linked_object_id: String(case_number || ""), host: host ? `${host}/upload` : undefined }); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium ${uploadMode === "qr" ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-zinc-900"}`}>
                      <QrCode className="w-4 h-4" /> {t("case.documents.qr_generate")}
                    </button>
                  </div>
                )}
                <div className="p-6">
                  {uploadMode === "qr" && !isMobile ? (
                    qr.isPending ? <p className="text-sm text-muted-foreground text-center py-8">{t("case.documents.qr_generating")}</p> :
                    secLeft === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-8">
                        <p className="text-sm font-medium text-destructive">QR expired</p>
                        <Button type="button" variant="outline" onClick={() => { const host = typeof window !== "undefined" ? window.location.origin : ""; qr.mutate({ linked_model: "CaseModel", linked_object_id: String(case_number || ""), host: host ? `${host}/upload` : undefined }); }}>Refresh</Button>
                      </div>
                    ) :
                    (() => {
                      const d: any = qr.data?.result?.data ?? qr.data?.result ?? qr.data;
                      return d?.qr_image ? (
                        <div className="flex flex-col items-center gap-3 py-2">
                          <div className="flex items-center gap-2 text-sm font-semibold"><Clock className={`w-4 h-4 ${secLeft < 60 ? "text-destructive animate-pulse" : "text-amber-600"}`} /><span className={secLeft < 60 ? "text-destructive" : "text-amber-600"}>{t("case.documents.qr_timer")} {fmt(secLeft)}</span></div>
                          {}
                          <img src={d.qr_image} alt="QR" className="w-56 h-56 border rounded-xl bg-white p-2 shadow-sm" />
                          <p className="text-xs text-center text-muted-foreground max-w-sm leading-relaxed">{t("case.documents.qr_scan_hint")}</p>
                          <p className="text-[11px] text-center text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/20 rounded-lg px-3 py-2">{t("case.documents.qr_timer_note")}</p>
                        </div>
                      ) : <p className="text-xs text-muted-foreground text-center py-8">{t("case.documents.qr_failed")}</p>;
                    })()
                  ) : (
                    <>
                  {!pendingFile ? (
                    <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                      <UploadCloud className="w-12 h-12 text-primary/50 mb-4" />
                      <span className="text-sm font-medium text-foreground">
                        {t("case.document_form.labels.click_to_select")}
                      </span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {t("case.document_form.labels.max_size")}
                      </span>
                      <input
                        hidden
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={(e) => {
                          handleUpload(e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <div className="border rounded-lg bg-muted/20 h-9 flex items-center px-3 gap-2 group transition-colors hover:border-destructive/30">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1 flex items-center gap-2">
                        <p className="text-sm font-medium truncate">
                          {pendingFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          ({formatSize(pendingFile.size)})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingFile(null)}
                        className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded-sm p-1 -mr-1"
                        title={t("case.document_form.labels.remove_file")}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                  {t("case.document_form.steps.details")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="border rounded-lg bg-muted/20 h-9 flex items-center px-3 gap-2">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {pendingFile?.name}
                      </p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        ({pendingFile ? formatSize(pendingFile.size) : ""})
                      </p>
                    </div>
                  </div>

                  <TextFieldV2
                    control={form.control}
                    name="docType"
                    label={t("case.document_form.fields.category.label")}
                    placeholder={t(
                      "case.document_form.fields.category.placeholder",
                    )}
                    required
                  />

                  <TextareaField
                    control={form.control as any}
                    name="remarks"
                    label={t("case.document_form.fields.remarks.label")}
                    placeholder={t(
                      "case.document_form.fields.remarks.placeholder",
                    )}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          {}
          <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="px-5"
            >
              {t("case.document_form.buttons.cancel")}
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="px-5"
                >
                  Back
                </Button>
              )}
              {currentStep === 1 ? (
                <Button
                  type="button"
                  className="px-6 bg-primary hover:bg-primary/90"
                  onClick={handleNext}
                  disabled={!pendingFile}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={
                    !form.watch("docType")?.trim() || !pendingFile || loading
                  }
                  className="px-6 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      {t("case.document_form.buttons.uploading")}
                    </>
                  ) : (
                    <>{t("case.document_form.buttons.upload")}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
