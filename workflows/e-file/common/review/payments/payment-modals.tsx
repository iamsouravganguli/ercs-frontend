"use client";

import React, { useState, useEffect } from "react";
import { UploadCloud, FileText, Trash2, Loader2, QrCode, Upload, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomModal, CustomModalBody } from "@/components/ui/custom-modal";
import { CommonsApiServices, useDocQRSessionCreate, useDocQRSessionExpire, useDocQRSessionDetail, getFileUrl } from "@/lib";
import { useTranslation } from "@/i18n";
import { ReviewPaymentForm } from "./payment-form";


export type ReviewPaymentModalState = {
  open: boolean;
  paymentId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
};

export function ReviewPaymentModals({
  caseNumber,
  paymentModal,
  onOpenChange,
  onSuccess,
}: {
  caseNumber: string;
  paymentModal: ReviewPaymentModalState;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  return (
    <CustomModal open={paymentModal.open} onOpenChange={onOpenChange} className="w-full max-w-[900px] h-[90vh] max-sm:h-screen max-sm:max-w-full">
      <CustomModalBody className="p-0 h-full overflow-hidden">
        {paymentModal.open && (
          <ReviewPaymentForm
            caseNumber={caseNumber}
            paymentId={paymentModal.paymentId ?? null}
            isEditing={!!paymentModal.isEditing}
            isView={!!paymentModal.isView}
            onClose={() => onOpenChange(false)}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess?.();
            }}
          />
        )}
      </CustomModalBody>
    </CustomModal>
  );
}


export function PaymentDocumentPreviewModal({
  previewDoc,
  previewUrl,
  onClose,
}: {
  previewDoc: any;
  previewUrl: string;
  onClose: () => void;
}) {
  return (
    <CustomModal
      open={!!previewDoc}
      onOpenChange={(open) => { if (!open) onClose(); }}
      className="max-w-none w-screen h-screen p-0 m-0 overflow-hidden bg-white dark:bg-zinc-900 rounded-none border-0 [&>button]:hidden"
    >
      <CustomModalBody className="p-0 m-0 h-full flex flex-col overflow-hidden gap-0">
        <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
          <p className="text-sm font-semibold truncate">{previewDoc?.type_of_doc || previewDoc?.file_name || "Document"}</p>
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-medium shrink-0">Close</Button>
        </div>
        <div className="flex-1 min-h-0 bg-zinc-50 dark:bg-zinc-950">
          {previewUrl ? (
            previewUrl.toLowerCase().endsWith(".pdf") || (previewDoc?.mime_type || "").includes("pdf") || previewUrl.includes(".pdf") ? (
              <iframe src={previewUrl} title={previewDoc?.file_name || "Document Preview"} className="w-full h-full border-0" />
            ) : previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <div className="w-full h-full flex items-center justify-center p-0 m-0 overflow-auto">
                {}
                <img src={previewUrl} alt={previewDoc?.file_name || "Document"} className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <iframe src={previewUrl} title={previewDoc?.file_name || "Document Preview"} className="w-full h-full border-0" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No preview available</div>
          )}
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}


const MAX_BYTES = 10 * 1024 * 1024;
const proofSchema = z.object({ remarks: z.string().optional() });

export function ReviewPaymentProofModal({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment: any | null;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const isMobile = typeof navigator !== "undefined" ? /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) : false;
  const [uploadMode, setUploadMode] = useState<"manual" | "qr">("manual");
  const qr = useDocQRSessionCreate();
  const qrExpire = useDocQRSessionExpire();
  const [secLeft, setSecLeft] = useState(300);
  const qrToken: string | null = (() => {
    const d: any = (qr as any).data?.result?.data ?? (qr as any).data?.result ?? (qr as any).data;
    return (d?.token as string) || null;
  })();

  const qrDetail = useDocQRSessionDetail(qrToken || "", !!qrToken && open && uploadMode === "qr" && !isMobile);
  const lastSeenDocIdRef = React.useRef<number | null>(null);


  useEffect(() => {
    if (!open || !payment?.id) return;
    lastSeenDocIdRef.current = null;
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api-client");
        const r: any = await apiClient.get(`/doc/linked/PaymentOrderModel/${payment.id}/`);
        const raw = r?.data?.result?.data || r?.data?.data || r?.data?.results || r?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        lastSeenDocIdRef.current = list.length ? Math.max(...list.map((d: any) => Number(d.id) || 0)) : 0;
      } catch {}
    })();
  }, [open, payment?.id]);

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
      fetch(full, { method: "POST", keepalive: true, credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => {});
    } catch {}
  };
  const qrTokenRef = React.useRef<string | null>(null);
  const qrExpiredRef = React.useRef(false);
  React.useEffect(() => { qrTokenRef.current = qrToken; }, [qrToken]);
  React.useEffect(() => {
    return () => {
      if (qrExpiredRef.current) return;
      const tok = qrTokenRef.current;
      if (tok) { qrExpiredRef.current = true; sendExpireBeacon(tok as string); }
    };
  }, []);

  React.useEffect(() => {
    if (uploadMode !== "qr" || !qr.data) return;
    const d: any = (qr as any).data?.result?.data ?? (qr as any).data?.result ?? (qr as any).data;
    const expiresAt = d?.expires_at ? new Date(d.expires_at).getTime() : null;
    const serverTime = d?.server_time ? new Date(d.server_time).getTime() : null;
    const baseNow = serverTime ? serverTime : Date.now();
    const clockOffset = Date.now() - baseNow;
    const compute = () => {
      if (!expiresAt) return 300;
      return Math.max(0, Math.floor((expiresAt - (Date.now() - clockOffset)) / 1000));
    };
    setSecLeft(compute());
    const id = setInterval(() => setSecLeft(compute()), 1000);
    return () => clearInterval(id);
  }, [uploadMode, qr.data]);
  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const form = useForm<z.infer<typeof proofSchema>>({
    resolver: zodResolver(proofSchema),
    defaultValues: { remarks: "" },
  });


  useEffect(() => {
    if (!open) {
      setPendingFile(null);
      setUploadMode("manual");
      form.reset({ remarks: "" });
      qr.reset();
      setSecLeft(300);
      qrExpiredRef.current = false;
      qrTokenRef.current = null;
      autoVerifyingRef.current = false;
    }
  }, [open, form]);


  const qrExpired410 = ((qrDetail.error as any)?.response?.status === 410) || ((qrDetail.error as any)?.status === 410);
  useEffect(() => {
    if (!open || uploadMode !== "qr" || isMobile || !qrToken) return;
    if (!qrExpired410) return;
    try { onSuccess?.(); } catch {}
    setSecLeft(0);
  }, [open, uploadMode, isMobile, qrToken, qrExpired410, onSuccess]);


  const autoVerifyingRef = React.useRef(false);
  useEffect(() => {
    if (!open || !payment?.id || uploadMode !== "qr" || isMobile) return;
    if (!qrToken) return;
    if (qrExpired410) return;

    const check = async () => {
      if (autoVerifyingRef.current) return;
      try {
        const { apiClient } = await import("@/lib/api-client");
        const r: any = await apiClient.get(`/doc/linked/PaymentOrderModel/${payment.id}/`);
        const raw = r?.data?.result?.data || r?.data?.data || r?.data?.results || r?.data || [];
        const list = Array.isArray(raw) ? raw : [];
        if (!list.length) return;
        const maxId = Math.max(...list.map((d: any) => Number(d.id) || 0));
        const lastSeen = lastSeenDocIdRef.current;
        if (lastSeen !== null && maxId > lastSeen) {
          autoVerifyingRef.current = true;
          try {
            const md = payment.metadata || {};
            const txn = md.transaction_id || "";
            await CommonsApiServices.VerifyPayment({ payment_id: payment.id, action: "approve", transaction_id: txn } as any);
            toast.success(t("case.review.payments_proof_done") || "Proof uploaded and payment marked PAID");
          } catch (e: any) {

            const msg = e?.message || e?.errors?.proof || "";
            if (msg) toast.error(String(msg));
          }
          lastSeenDocIdRef.current = maxId;
          onSuccess?.();

          try { window.dispatchEvent(new Event("focus")); } catch {}
        } else if (lastSeen === null) {
          lastSeenDocIdRef.current = maxId;
        }
      } catch {}
    };

    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [open, payment?.id, payment, qrToken, uploadMode, isMobile, qrDetail.data, qrExpired410, onSuccess, t]);

  const handlePick = (list: FileList | null) => {
    if (!list || !list[0]) return;
    const f = list[0];
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error(t("case.document_form.toasts.invalid_type") || "Only PDF allowed");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error(t("case.document_form.toasts.file_too_large") || "Max 10MB");
      return;
    }
    setPendingFile(f);
  };


  const isProofUploadingRef = React.useRef(false);
  const handleUpload = async () => {
    if (isProofUploadingRef.current) return;
    if (!pendingFile || !payment) return;
    if (loading) return;
    isProofUploadingRef.current = true;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", pendingFile, pendingFile.name);
      formData.append("type_of_doc", "PAYMENT_PROOF");
      const remarks = form.getValues("remarks")?.trim();
      if (remarks) formData.append("remarks", remarks);
      const { apiClient } = await import("@/lib/api-client");
      await apiClient.post(`/doc/linked/PaymentOrderModel/${payment.id}/upload/`, formData);
      const md = payment.metadata || {};
      const txn = md.transaction_id || "";
      await CommonsApiServices.VerifyPayment({ payment_id: payment.id, action: "approve", transaction_id: txn } as any);
      toast.success(t("case.review.payments_proof_done") || "Proof uploaded and payment marked PAID");
      if (qrToken && !qrExpiredRef.current) { qrExpiredRef.current = true; sendExpireBeacon(qrToken as string); qrExpire.mutate(qrToken as string, { onError: () => {} } as any); }
      if (typeof window !== "undefined" && window.opener) {
        try { window.opener.postMessage("refetch-payments", window.location.origin); } catch {}
      }
      onOpenChange(false);
      setPendingFile(null);
      form.reset({ remarks: "" });
      onSuccess?.();
    } catch (e: any) {
      const msg = e?.message || e?.errors?.proof || e?.errors?.transaction_id || "Upload failed";
      toast.error(String(msg));
    } finally {
      setLoading(false);
      isProofUploadingRef.current = false;
    }
  };

  const handleCancel = () => {
    if (uploadMode === "qr" && qrToken && !qrExpiredRef.current) {
      qrExpiredRef.current = true;
      sendExpireBeacon(qrToken as string);
      qrExpire.mutate(qrToken as string, { onError: () => {} } as any);
    }
    setPendingFile(null);
    form.reset({ remarks: "" });
    onOpenChange(false);
  };

  const closeModal = (v: boolean) => {
    if (!v) handleCancel();
  };

  return (
    <CustomModal open={open} onOpenChange={closeModal} className="w-full max-w-[850px] h-[90vh] max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden">
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
          <div className="h-14 flex items-center justify-between px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">{t("case.review.payments_proof_title_simple") || "Proof Document"}</h1>
          </div>
          {}
          {!isMobile && (
            <div className="px-6 pt-4 flex gap-2 shrink-0 bg-zinc-50 dark:bg-zinc-900/50">
              <button type="button" onClick={() => { if (qrToken && !qrExpiredRef.current) { qrExpiredRef.current = true; sendExpireBeacon(qrToken as string); qrExpire.mutate(qrToken as string, { onError: () => {} } as any); } setUploadMode("manual"); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium ${uploadMode === "manual" ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-zinc-900"}`}>
                <Upload className="w-4 h-4" /> {t("case.documents.manual_upload") || "Manual Upload"}
              </button>
              <button type="button" onClick={() => { if (qr.data && secLeft > 0) { setUploadMode("qr"); return; } setUploadMode("qr"); const host = typeof window !== "undefined" ? window.location.origin : ""; qr.mutate({ linked_model: "PaymentOrderModel", linked_object_id: String(payment?.id || ""), type_of_doc: "PAYMENT_PROOF", host: host ? `${host}/upload` : undefined }); }} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium ${uploadMode === "qr" ? "bg-primary text-primary-foreground border-primary" : "bg-white dark:bg-zinc-900"}`}>
                <QrCode className="w-4 h-4" /> {t("case.documents.qr_generate") || "QR Generate"}
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
            {}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_overview_title") || "Payment Overview"}</div>
              <div className="p-6">
                {(() => {
                  const md = (payment as any)?.metadata || {};
                  const typeLabel = payment?.payment_type_detail?.name_en || payment?.payment_type_detail?.name || md.description || payment?.description || "—";
                  const modeLabel = payment?.payment_mode_detail?.name_en || payment?.payment_mode_detail?.name || payment?.payment_mode || md.payment_mode || "OFFLINE";
                  const txn = md.transaction_id || payment?.transaction_id || "—";
                  const statusLabel = payment?.status_detail?.name_en || payment?.status_detail?.name || payment?.status || "—";
                  const amountVal = payment ? Number(payment.amount_in_inr ?? payment.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";
                  const remarks = md.remarks || (payment as any)?.remarks || "—";
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_type") || "Payment Type"}</p>
                        <p className="font-medium wrap-break-word">{typeLabel}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_mode") || "Payment Mode"}</p>
                        <p className="font-medium">{modeLabel}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_amount") || "Amount"}</p>
                        <p className="text-sm font-bold tracking-tight">{amountVal ? <><span className="text-[15px] mr-0.5">₹</span>{amountVal}</> : "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_txn") || "Transaction / Challan No"}</p>
                        <p className="font-medium wrap-break-word">{txn}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Status</p>
                        <p className="font-medium">{statusLabel}</p>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_remarks") || "Description / Remarks"}</p>
                        <p className="font-medium whitespace-pre-wrap wrap-break-word">{remarks || "—"}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </section>

            {}
            {uploadMode === "qr" && !isMobile ? (
              <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_proof_title_simple") || "Proof Document"}</div>
                <div className="p-6">
              {qr.isPending ? <p className="text-sm text-muted-foreground text-center py-8">{t("case.documents.qr_generating") || "Generating QR…"}</p> :
              qrExpired410 || secLeft === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm font-medium text-destructive">QR expired</p>
                  <Button type="button" variant="outline" onClick={() => { qrExpiredRef.current = false; qrTokenRef.current = null; qr.reset(); setSecLeft(300); const host = typeof window !== "undefined" ? window.location.origin : ""; qr.mutate({ linked_model: "PaymentOrderModel", linked_object_id: String(payment?.id || ""), type_of_doc: "PAYMENT_PROOF", host: host ? `${host}/upload` : undefined }); }}>Refresh</Button>
                </div>
              ) : (() => {
                const d: any = (qr as any).data?.result?.data ?? (qr as any).data?.result ?? (qr as any).data;
                return d?.qr_image ? (
                  <div className="flex flex-col items-center gap-3 py-2">
                    <div className="flex items-center gap-2 text-sm font-semibold"><Clock className={`w-4 h-4 ${secLeft < 60 ? "text-destructive animate-pulse" : "text-amber-600"}`} /><span className={secLeft < 60 ? "text-destructive" : "text-amber-600"}>{t("case.documents.qr_timer") || "Time left"} {fmt(secLeft)}</span></div>
                    {}
                    <img src={d.qr_image} alt="QR" className="w-56 h-56 border rounded-xl bg-white p-2 shadow-sm" />
                    <p className="text-xs text-center text-muted-foreground max-w-sm leading-relaxed">{t("case.documents.qr_scan_hint") || "Scan with phone to upload"}</p>
                    <p className="text-[11px] text-center text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/20 rounded-lg px-3 py-2">{t("case.documents.qr_timer_note") || "QR expires in 5 minutes"}</p>
                  </div>
                ) : <p className="text-xs text-muted-foreground text-center py-8">{t("case.documents.qr_failed") || "QR failed"}</p>;
              })()}
                </div>
              </section>
            ) : (
                <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_proof_title_simple") || "Proof Document"}</div>
                  <div className="p-6 space-y-4">
                    <p className="text-xs text-muted-foreground">{t("case.review.payments_proof_desc") || "Upload PDF proof (max 10MB). On success the entry will be marked PAID."}</p>
                    {!pendingFile ? (
                      <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10">
                        <UploadCloud className="w-12 h-12 text-primary/50 mb-4" />
                        <span className="text-sm font-medium text-foreground">{t("case.document_form.labels.click_to_select") || "Click to select PDF"}</span>
                        <span className="text-xs text-muted-foreground mt-1">PDF, max 10MB</span>
                        <input hidden type="file" accept=".pdf,application/pdf" onChange={(e) => { handlePick(e.target.files); e.target.value = ""; }} />
                      </label>
                    ) : (
                      <div className="border rounded-lg bg-muted/20 h-9 flex items-center px-3 gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium truncate flex-1">{pendingFile.name}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">({(pendingFile.size / 1024).toFixed(0)} KB)</span>
                        <button type="button" onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                    <Form {...form}>
                      <TextareaField control={form.control as any} name="remarks" label={t("case.document_form.fields.remarks.label") || "Remarks"} placeholder={t("case.document_form.fields.remarks.placeholder") || "Optional remarks"} />
                    </Form>
                  </div>
                </section>
            )}
          </div>

          <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
            <Button type="button" variant="outline" onClick={handleCancel} className="px-5">{t("case.document_form.buttons.cancel") || "Cancel"}</Button>
            <Button type="button" onClick={handleUpload} disabled={!pendingFile || loading} className="px-6 gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />{t("case.document_form.buttons.uploading") || "Uploading…"}</> : <>{t("case.document_form.buttons.upload") || "Upload"}</>}
            </Button>
          </div>
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}
