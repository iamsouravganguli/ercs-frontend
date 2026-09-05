"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomModal, CustomModalBody } from "@/components/ui/custom-modal";
import { useTranslation } from "@/i18n";
import {
  useCreatePaymentOrder,
  usePaymentModeList,
  usePaymentTypeList,
  usePaymentOrderDetail,
  useUpdatePaymentOrder,
  applyBackendErrors,
  getFileUrl,
} from "@/lib";
import { Eye, FileText, Trash2 } from "lucide-react";
import { PaymentDocumentPreviewModal } from "./payment-modals";

const Schema = z.object({
  payment_mode: z.string().min(1, "Payment mode required"),
  payment_type: z.string().min(1, "Payment type required"),
  amount: z
    .string()
    .min(1, "Amount required")
    .regex(/^\d+(\.\d{1,2})?$/, "Only numbers with up to 2 decimals allowed")
    .refine((v) => Number(v) > 0, "Amount must be > 0"),
  transaction_id: z.string().min(1, "Transaction / Challan number required"),
  remarks: z.string().optional(),
});

export type ReviewPaymentFormData = z.infer<typeof Schema>;

interface Props {
  caseNumber: string;
  paymentId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function ReviewPaymentForm({ caseNumber, paymentId, isEditing = false, isView = false, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const createMutation = useCreatePaymentOrder();
  const updateMutation = useUpdatePaymentOrder();
  const { data: paymentModesRes } = usePaymentModeList();
  const { data: paymentTypesRes } = usePaymentTypeList();
  const detailQuery = usePaymentOrderDetail(paymentId as string);
  const apiDetail = (detailQuery.data as any)?.result?.data || (detailQuery.data as any)?.data;

  const paymentModeOptions = React.useMemo(() => {
    const list: any[] = (paymentModesRes as any)?.result?.data || [];
    return list.map((m: any) => ({
      label: m.name_en || m.name || m.code,
      value: m.code,
    }));
  }, [paymentModesRes]);

  const paymentTypeOptions = React.useMemo(() => {
    const list: any[] = (paymentTypesRes as any)?.result?.data || [];
    return list.map((pt: any) => ({
      label: pt.name_en || pt.name || pt.code,
      value: pt.code,
    }));
  }, [paymentTypesRes]);

  const getPaymentTypeLabel = (code: string) => {
    const list: any[] = (paymentTypesRes as any)?.result?.data || [];
    const found = list.find((x: any) => x.code === code);
    return found ? found.name_en || found.name || code : code;
  };

  const form = useForm<ReviewPaymentFormData>({
    resolver: zodResolver(Schema) as any,
    defaultValues: { payment_mode: "OFFLINE", payment_type: "", amount: "", transaction_id: "", remarks: "" },
  });


  useEffect(() => {
    if (!form.getValues("payment_mode")) {
      form.setValue("payment_mode", "OFFLINE");
    }
  }, [form, paymentModeOptions]);

  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { id: 1, label: t("case.review.payments_step1") || "Type & Mode", fields: ["payment_type", "payment_mode"] as const },
    { id: 2, label: t("case.review.payments_step2") || "Amount & Reference", fields: ["amount", "transaction_id", "remarks"] as const },
    { id: 3, label: t("case.review.payments_step3") || "Review", fields: [] as const },
  ];

  const isNavigatingRef = React.useRef(false);
  const handleNext = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      const fields = steps[currentStep - 1]?.fields as any;
      if (fields?.length) {
        const ok = await form.trigger(fields);
        if (!ok) return;
      }
      setCurrentStep((s) => Math.min(3, s + 1));
    } finally {
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 300);
    }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  useEffect(() => {
    if (apiDetail && (isEditing || isView) && paymentId) {
      const md: any = apiDetail.metadata || {};
      const amountInr = apiDetail.amount_in_inr ?? (apiDetail.amount ? apiDetail.amount / 100 : "");
      form.reset({
        payment_mode: apiDetail.payment_mode_detail?.code || md.payment_mode || "OFFLINE",
        payment_type: apiDetail.payment_type_detail?.code || "",
        amount: String(amountInr || ""),
        transaction_id: md.transaction_id || "",
        remarks: md.remarks || md.notes || "",
      });
    }
  }, [apiDetail, isEditing, isView, paymentId, form]);


  const handleSave = form.handleSubmit(async (data) => {
    if (isView) return;
    const amountPaise = Math.round(Number(data.amount) * 100);
    const typeLabel = getPaymentTypeLabel(data.payment_type.trim());
    try {
      if (isEditing && paymentId) {
        const payload: any = {
          amount: amountPaise,
          description: typeLabel,
          payment_type: data.payment_type.trim(),
          payment_mode: data.payment_mode.trim(),
          metadata: {
            transaction_id: data.transaction_id.trim(),
            description: typeLabel,
            remarks: data.remarks?.trim() || "",
          },
        };
        await updateMutation.mutateAsync({ pk: paymentId, payload });
        toast.success(t("case.payments.update_success") || "Payment updated");
      } else {
        const payload: any = {
          model: "casemodel",
          object_id: caseNumber,
          amount: amountPaise,
          description: typeLabel,
          payment_mode: data.payment_mode.trim(),
          payment_type: data.payment_type.trim(),
          metadata: {
            transaction_id: data.transaction_id.trim(),
            description: typeLabel,
            remarks: data.remarks?.trim() || "",
          },
        };
        await createMutation.mutateAsync(payload);
        toast.success(t("case.payments.create_success") || "Payment entry created");
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (apiErr: any) {
      applyBackendErrors(form as any, apiErr.errors, apiErr.message || "Failed to save");
      const hasFieldErrors = apiErr.errors && Object.keys(apiErr.errors).length > 0;
      if (!hasFieldErrors) toast.error(apiErr.message || "Failed to save");
    }
  });

  const handleCancel = () => {
    if (onClose) onClose();
    else if (typeof window !== "undefined") window.close();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;


  const [viewDocs, setViewDocs] = useState<any[]>([]);
  const [viewDocsLoading, setViewDocsLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [confirmDocId, setConfirmDocId] = useState<number | null>(null);

  const fetchViewDocs = React.useCallback(async () => {
    if (!isView || !paymentId) return;
    setViewDocsLoading(true);
    try {
      const { apiClient } = await import("@/lib/api-client");
      const r: any = await apiClient.get(`/doc/linked/PaymentOrderModel/${paymentId}/`);
      const raw = r?.data?.result?.data || r?.data?.data || r?.data?.results || r?.data || [];
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
      setViewDocs(list);
    } catch {
      setViewDocs([]);
    } finally {
      setViewDocsLoading(false);
    }
  }, [isView, paymentId]);

  useEffect(() => {
    fetchViewDocs();
  }, [fetchViewDocs]);


  useEffect(() => {
    if (!isView) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-documents" || e.data === "refetch-payments") fetchViewDocs();
    };
    const onFocus = () => fetchViewDocs();
    window.addEventListener("message", onMsg);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("message", onMsg);
      window.removeEventListener("focus", onFocus);
    };
  }, [isView, fetchViewDocs]);

  const openPreview = (doc: any) => {
    const url = getFileUrl(doc.file_url || doc.file || "");
    if (!url) {
      toast.error("File URL missing");
      return;
    }
    setPreviewDoc(doc);
    setPreviewUrl(url);
  };
  const closePreview = () => {
    if (previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewDoc(null);
    setPreviewUrl("");
  };
  const handleViewDocDelete = async () => {
    if (!confirmDocId) return;
    try {
      const { apiClient } = await import("@/lib/api-client");
      await apiClient.delete(`/doc/${confirmDocId}/delete/`);
      toast.success(t("case.documents.deleted_toast") || "Document deleted");
      setConfirmDocId(null);
      fetchViewDocs();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  if (isView) {
    if (detailQuery.isLoading)
      return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">{t("case.review.payments_view") || "View Payment"}</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-zinc-100 rounded-xl overflow-hidden animate-pulse">
                <div className="h-10 bg-white border-b" />
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-zinc-100 rounded" />
                      <div className="h-4 w-32 bg-zinc-100 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-zinc-100 rounded" />
                      <div className="h-4 w-28 bg-zinc-100 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    const p: any = apiDetail;
    if (!p)
      return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">{t("case.review.payments_view") || "View Payment"}</h1>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-10 text-center text-sm text-muted-foreground">{t("case.review.payments_not_found") || "Payment not found"}</div>
          <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3">
            <Button onClick={handleCancel} variant="default" className="px-6">
              {t("common_button.close.label") || "Close"}
            </Button>
          </div>
        </div>
      );
    const md = p.metadata || {};
    const code = p.status_detail?.code || (p.status ? `PAYMENT_${String(p.status).toUpperCase()}` : "");
    const isPaid = code === "PAYMENT_PAID";
    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
        <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">{t("case.review.payments_view") || "View Payment"}</h1>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-zinc-50 dark:bg-zinc-900/50">
          <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white border-b text-sm font-semibold">{t("case.review.payments_step1") || "Type & Mode"}</div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_mode") || "Payment Mode"}</p>
                <p className="text-sm font-medium">{p.payment_mode_detail?.name_en || p.payment_mode_detail?.name || md.payment_mode || "OFFLINE"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_type") || "Payment Type"}</p>
                <p className="text-sm font-medium">{p.payment_type_detail?.name_en || p.payment_type_detail?.name || "—"}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_txn") || "Transaction / Challan"}</p>
                <p className="text-sm font-medium">{md.transaction_id || "—"}</p>
              </div>
            </div>
          </section>
          <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_view_amount_status") || "Amount & Status"}</div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_amount") || "Amount"}</p>
                <p className="text-sm font-bold tracking-tight"><span className="text-[15px] mr-0.5">₹</span>{Number(p.amount_in_inr ?? p.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_status") || "Status"}</p>
                <p className="text-sm font-medium">{p.status_detail?.name_en || p.status_detail?.name || p.status || "—"}</p>
              </div>
            </div>
          </section>
          <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.review.payments_view_remarks") || "Remarks"}</div>
            <div className="p-6">
              <p className="text-sm whitespace-pre-wrap wrap-break-word">{md.remarks || md.notes || "—"}</p>
            </div>
          </section>

          {}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <p className="text-sm font-semibold">{t("case.review.payments_docs_title") || "Proof Documents"}</p>
              <span className="text-xs text-muted-foreground">{viewDocsLoading ? "…" : `${viewDocs.length} file${viewDocs.length === 1 ? "" : "s"}`}</span>
            </div>
            <div className="p-6">
              {viewDocsLoading ? (
                <p className="text-sm text-muted-foreground italic py-4 text-center">{t("case.documents.loading_repo") || "Loading…"}</p>
              ) : viewDocs.length === 0 ? (
                <div className="py-10 text-center space-y-3 bg-background border border-dashed rounded-xl">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                    <FileText className="w-6 h-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t("case.review.payments_docs_empty") || "No proof document yet."}</p>
                  <p className="text-xs text-muted-foreground">{t("case.review.payments_proof_hint") || "Upload proof via the table Upload action — documents will appear here."}</p>
                </div>
              ) : (
                <div className="divide-y divide-border border rounded-lg overflow-hidden">
                  {viewDocs.map((d: any) => (
                    <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate" title={d.file_name || d.original_name}>{d.file_name || d.original_name || "Document"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{d.type_of_doc || "PAYMENT_PROOF"} • {d.file_size_mb ? `${Number(d.file_size_mb).toFixed(2)} MB` : d.file_size ? `${(Number(d.file_size) / 1024 / 1024).toFixed(2)} MB` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openPreview(d)} title={t("case.documents.view_document") || "View"}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!isPaid && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => setConfirmDocId(d.id)} title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3 shrink-0">
          <Button variant="default" onClick={handleCancel} className="px-6">
            {t("common_button.close.label") || "Close"}
          </Button>
        </div>

        <PaymentDocumentPreviewModal previewDoc={previewDoc} previewUrl={previewUrl} onClose={closePreview} />

        {}
        <CustomModal open={!!confirmDocId} onOpenChange={(o) => { if (!o) setConfirmDocId(null); }} className="max-w-md p-0 overflow-hidden">
          <CustomModalBody className="p-6 space-y-4">
            <h3 className="text-sm font-semibold">{t("case.review.payments_delete_doc_title") || "Delete Document?"}</h3>
            <p className="text-xs text-muted-foreground">{t("case.review.payments_delete_doc_desc") || "This proof document will be permanently deleted. This action cannot be undone."}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setConfirmDocId(null)} className="h-8 px-4 text-xs font-medium border rounded-md hover:bg-muted">{t("common_button.cancel.label") || "Cancel"}</button>
              <button onClick={handleViewDocDelete} className="h-8 px-4 text-xs font-semibold bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">{t("common_button.delete.label") || "Delete"}</button>
            </div>
          </CustomModalBody>
        </CustomModal>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden relative">
      <Form {...form}>
        <div className="flex flex-1 flex-col overflow-hidden h-full min-h-0">
          {}
          <div className="flex flex-1 flex-col bg-card overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{isEditing ? t("case.review.payments_edit") || "Edit Payment" : t("case.review.payments_add") || "Add Payment"}</h1>
            </div>
            <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / 3) * 100}%` }} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <section className="bg-card border border-zinc-100 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white border-b text-sm font-semibold">Type & Mode</div>
                    <div className="p-6 space-y-4">
                      <CustomComboboxField
                        control={form.control as any}
                        name="payment_type"
                        label={t("case.review.payments_type") || "Payment Type"}
                        placeholder={t("case.review.payments_type_placeholder") || "Select payment type"}
                        options={paymentTypeOptions}
                        required
                      />
                      <CustomComboboxField
                        control={form.control as any}
                        name="payment_mode"
                        label={t("case.review.payments_mode") || "Payment Mode"}
                        placeholder={t("case.review.payments_mode_placeholder") || "Select mode"}
                        options={paymentModeOptions}
                        required
                        disabled
                      />
                    </div>
                  </section>
                )}
                {currentStep === 2 && (
                  <section className="bg-card border border-zinc-100 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white border-b text-sm font-semibold">Amount & Reference</div>
                    <div className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <TextFieldV2
                          control={form.control as any}
                          name="amount"
                          label={t("case.review.payments_amount") || "Amount (₹)"}
                          placeholder="0.00"
                          inputMode="decimal"
                          required
                          onKeyDown={(e) => {
                            if (e.ctrlKey || e.metaKey) return;
                            const allow = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
                            if (allow.includes(e.key)) return;
                            if (/^\d$/.test(e.key)) return;
                            if (e.key === "." && !(e.currentTarget as HTMLInputElement).value.includes(".")) return;
                            e.preventDefault();
                          }}
                          onPaste={(e) => {
                            const text = e.clipboardData.getData("text");
                            if (!/^\d+(\.\d{0,2})?$/.test(text.trim())) e.preventDefault();
                          }}
                        />
                        <TextFieldV2 control={form.control as any} name="transaction_id" label={t("case.review.payments_txn") || "Transaction / Challan No"} placeholder={t("case.review.payments_txn_placeholder") || "e.g. TXN123 / CH-99201"} required />
                      </div>
                      <TextareaField control={form.control as any} name="remarks" label={t("case.review.payments_remarks") || "Description / Remarks"} placeholder={t("case.review.payments_remarks_placeholder") || "Description, remarks or reference notes"} />
                    </div>
                  </section>
                )}
                {currentStep === 3 && (
                  <section className="bg-card border border-zinc-100 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white border-b text-sm font-semibold">{t("case.review.payments_review_title") || "Review"}</div>
                    <div className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_type") || "Payment Type"}</p>
                          <p className="font-medium">{form.watch("payment_type") ? getPaymentTypeLabel(form.watch("payment_type") as string) : "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_mode") || "Payment Mode"}</p>
                          <p className="font-medium">{form.watch("payment_mode") || "OFFLINE"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_amount") || "Amount"}</p>
                          <p className="text-sm font-bold tracking-tight"><span className="text-[15px] mr-0.5">₹</span>{form.watch("amount") ? Number(form.watch("amount")).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_txn") || "Transaction / Challan No"}</p>
                          <p className="font-medium wrap-break-word">{form.watch("transaction_id") || "—"}</p>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground">{t("case.review.payments_remarks") || "Description / Remarks"}</p>
                          <p className="font-medium whitespace-pre-wrap wrap-break-word">{form.watch("remarks") || "—"}</p>
                        </div>
                      </div>
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 px-4 py-3">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t("case.review.payments_review_note")}</p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
              <Button variant="outline" type="button" className="px-5" onClick={handleCancel}>
                {t("common_button.cancel.label") || "Cancel"}
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button variant="outline" type="button" className="px-5" onClick={handleBack}>
                    Back
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button type="button" className="px-6 bg-primary hover:bg-primary/90" onClick={handleNext}>
                    Next
                  </Button>
                ) : (
                  <Button type="button" className="px-6" disabled={isSaving} onClick={handleSave}>
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
