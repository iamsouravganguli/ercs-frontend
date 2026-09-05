"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { useTranslation } from "@/i18n";

import { applyBackendErrors } from '@/lib/form-error';
import { useCaseDetail, useCreatePaymentOrder, usePaymentModeList, usePaymentOrderDetail, useUpdatePaymentOrder } from '@/lib/query';

const PaymentFormSchema = z.object({
  description: z.string().min(1, "Particulars required"),
  amount: z
    .string()
    .min(1, "Amount required")
    .refine(
      (v) => !isNaN(Number(v)) && Number(v) > 0,
      "Amount must be greater than 0",
    ),
  payment_mode: z.string().optional(),
  challan_no: z.string().optional(),
  bank_name: z.string().optional(),
  notes: z.string().optional(),
});

export type PaymentFormData = z.infer<typeof PaymentFormSchema>;

interface PaymentFormProps {
  paymentId?: string | null;
  isEditing?: boolean;
  isView?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function PaymentForm({
  paymentId,
  isEditing = false,
  isView = false,
  onClose,
  onSuccess,
}: PaymentFormProps) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t } = useTranslation();

  const detail = useCaseDetail(case_number as string);
  const { data: paymentModesRes } = usePaymentModeList();
  const paymentModes = (paymentModesRes as any)?.result?.data || [];

  const createMutation = useCreatePaymentOrder();
  const updateMutation = useUpdatePaymentOrder();

  const paymentDetailQuery = usePaymentOrderDetail(paymentId as string);
  const apiPaymentDetail =
    (paymentDetailQuery.data as any)?.result?.data ||
    (paymentDetailQuery.data as any)?.data;

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(PaymentFormSchema) as any,
    defaultValues: {
      description: "",
      amount: "",
      payment_mode: "ONLINE",
      challan_no: "",
      bank_name: "",
      notes: "",
    },
  });

  const watchPaymentMode = form.watch("payment_mode");
  const isOffline =
    (watchPaymentMode || "").toUpperCase() === "OFFLINE" ||
    ["OFFLINE_CHALLAN", "OFFLINE_CASH"].includes(
      (watchPaymentMode || "").toUpperCase(),
    );

  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    {
      id: 1,
      label: t("payments.form.steps.details") || "Payment Details",
      fields: ["description"] as const,
    },
    {
      id: 2,
      label: t("payments.form.steps.amount_mode") || "Amount & Mode",
      fields: ["amount", "payment_mode"] as const,
    },
    {
      id: 3,
      label: t("payments.form.steps.remarks") || "Remarks",
      fields: ["notes"] as const,
    },
  ];

  const handleNext = async () => {
    const fields = steps[currentStep - 1]?.fields as any;
    if (fields) {
      const ok = await form.trigger(fields);
      if (!ok) return;
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));


  useEffect(() => {
    if (apiPaymentDetail && (isEditing || isView) && paymentId) {
      const md: any = apiPaymentDetail.metadata || {};
      const amountInr =
        apiPaymentDetail.amount_in_inr ??
        (apiPaymentDetail.amount ? apiPaymentDetail.amount / 100 : "");
      form.reset({
        description: apiPaymentDetail.description || md.fee_type || "",
        amount: String(amountInr || ""),
        payment_mode:
          md.payment_mode ||
          apiPaymentDetail.payment_mode_detail?.code ||
          "ONLINE",
        challan_no: md.challan_no || "",
        bank_name: md.bank_name || "",
        notes: md.notes || md.remarks || "",
      });
    }
  }, [apiPaymentDetail, isEditing, isView, paymentId, form]);

  const saveTriggeredRef = useRef(false);

  const onSubmit = form.handleSubmit(async (data) => {
    if (!case_number) return;
    if (!isView && currentStep !== 3 && !saveTriggeredRef.current) {

      return;
    }
    if (!isView && currentStep !== 3) {
      const fields = steps[currentStep - 1]?.fields as any;
      if (fields) {
        const ok = await form.trigger(fields);
        if (ok) setCurrentStep((s) => Math.min(3, s + 1));
      }
      return;
    }

    const amountPaise = Math.round(Number(data.amount) * 100);


    try {
      if (isEditing && paymentId) {
        const payload: any = {
          amount: amountPaise,
          description: data.description.trim(),
          metadata: {
            fee_type: data.description.trim(),
            notes: data.notes?.trim() || "",
            payment_mode: data.payment_mode,
            challan_no: data.challan_no?.trim() || undefined,
            bank_name: data.bank_name?.trim() || undefined,
          },
        };
        if (data.payment_mode) payload.payment_mode = data.payment_mode;
        await updateMutation.mutateAsync({ pk: paymentId, payload });
        toast.success("Payment updated successfully");
      } else {
        const payload: any = {
          model: "casemodel",
          object_id: case_number,
          amount: amountPaise,
          description: data.description.trim(),
          metadata: {
            case_number,
            fee_type: data.description.trim(),
            notes: data.notes?.trim() || "",
            payment_mode: data.payment_mode || "ONLINE",
            challan_no: data.challan_no?.trim() || undefined,
            bank_name: data.bank_name?.trim() || undefined,
          },
        };
        if (data.payment_mode) payload.payment_mode = data.payment_mode;
        await createMutation.mutateAsync(payload);
        toast.success("Payment demand added successfully");
      }

      if (onSuccess) onSuccess();
      if (onClose) onClose();
      else if (typeof window !== "undefined" && window.opener) {
        try {
          window.opener.postMessage("refetch-payments", window.location.origin);
        } catch {}
      }
    } catch (apiErr: any) {
      applyBackendErrors(
        form as any,
        apiErr.errors,
        apiErr.message || "Failed to save payment",
      );
      const hasFieldErrors =
        apiErr.errors && Object.keys(apiErr.errors).length > 0;
      if (!hasFieldErrors)
        toast.error(apiErr.message || "Failed to save payment");
    } finally {
      saveTriggeredRef.current = false;
    }
  });

  const handleCancel = () => {
    if (onClose) onClose();
    else if (typeof window !== "undefined") window.close();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;


  if (isView) {
    if (paymentDetailQuery.isLoading) {
      return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("payments.view_details") || "View Payment"}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800" />
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
                      <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    const p: any = apiPaymentDetail;
    if (!p) {
      return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("payments.view_details") || "View Payment"}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-10 text-center text-sm text-muted-foreground">
            Payment not found
          </div>
          <div className="flex items-center justify-end border-t bg-card px-6 py-3">
            <Button
              variant="default"
              type="button"
              className="px-6"
              onClick={handleCancel}
            >
              {t("case.land_form.buttons.close") || "Close"}
            </Button>
          </div>
        </div>
      );
    }
    const md = p.metadata || {};
    return (
      <div className="flex flex-col h-full bg-card overflow-hidden">
        <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("payments.view_details") || "View Payment"}
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
              Payment Details
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-1 md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Particulars
                </p>
                <p className="text-sm font-medium text-foreground wrap-break-word">
                  {p.description || "—"}
                </p>
              </div>
            </div>
          </section>
          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
              Amount & Mode
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Amount
                </p>
                <p className="text-sm font-medium text-foreground">
                  ₹
                  {Number(p.amount_in_inr ?? p.amount / 100).toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 },
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Payment Mode
                </p>
                <p className="text-sm font-medium text-foreground">
                  {p.payment_mode_detail?.name_en ||
                    p.payment_mode_detail?.name ||
                    md.payment_mode ||
                    "—"}
                </p>
              </div>
              {md.challan_no && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Challan No
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {md.challan_no}
                  </p>
                </div>
              )}
              {md.bank_name && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Bank
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {md.bank_name}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Status
                </p>
                <p className="text-sm font-medium text-foreground">
                  {p.status_detail?.name_en ||
                    p.status_detail?.name ||
                    p.status ||
                    "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Created
                </p>
                <p className="text-sm font-medium text-foreground">
                  {p.created_at
                    ? new Date(p.created_at).toLocaleString("en-IN")
                    : "—"}
                </p>
              </div>
            </div>
          </section>
          <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
              Remarks
            </div>
            <div className="p-6">
              <p className="text-sm text-foreground whitespace-pre-wrap wrap-break-word">
                {md.notes || md.remarks || p.metadata?.notes || "—"}
              </p>
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end border-t bg-card px-6 py-3 shrink-0">
          <Button
            variant="default"
            type="button"
            className="px-6"
            onClick={handleCancel}
          >
            {t("case.land_form.buttons.close") || "Close"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== 3) e.preventDefault();
          }}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          <div className="flex flex-1 flex-col bg-card overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">
                {isEditing
                  ? t("payments.edit_title") || "Edit Payment"
                  : t("payments.add_title") || "Add Payment"}
              </h1>
            </div>

            <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / 3) * 100}%` }}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
              <div className="space-y-6">
                {currentStep === 1 && (
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                      {t("payments.form.sections.details") || "Payment Details"}
                    </div>
                    <div className="p-6 space-y-4">
                      <TextFieldV2
                        control={form.control as any}
                        name="description"
                        label="Particulars"
                        placeholder="e.g. Process Fee, Court Fee"
                        required
                      />
                    </div>
                  </section>
                )}

                {currentStep === 2 && (
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                      {t("payments.form.sections.amount_mode") ||
                        "Amount & Mode"}
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <TextFieldV2
                          control={form.control as any}
                          name="amount"
                          label="Amount (₹)"
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          required
                        />
                        <CustomComboboxField
                          control={form.control as any}
                          name="payment_mode"
                          label="Payment Mode"
                          placeholder="Select mode"
                          options={
                            paymentModes.length > 0
                              ? paymentModes.map((pm: any) => ({
                                  label: pm.name_en || pm.name,
                                  value: pm.code,
                                }))
                              : [
                                  { label: "Online Gateway", value: "ONLINE" },
                                  { label: "Offline", value: "OFFLINE" },
                                ]
                          }
                        />
                        {isOffline && (
                          <>
                            <TextFieldV2
                              control={form.control as any}
                              name="challan_no"
                              label="Challan No"
                              placeholder="e.g. TC-99201-B"
                            />
                            <TextFieldV2
                              control={form.control as any}
                              name="bank_name"
                              label="Bank Name"
                              placeholder="e.g. State Bank of India"
                            />
                          </>
                        )}
                      </div>
                      {isOffline && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-2">
                          Offline payment — no Razorpay order will be created.
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {currentStep === 3 && (
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                      {t("payments.form.sections.remarks") || "Remarks"}
                    </div>
                    <div className="p-6 space-y-4">
                      <TextareaField
                        control={form.control as any}
                        name="notes"
                        label="Notes / Reference"
                        placeholder="Order reference or notes"
                      />
                      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 p-3">
                        <p className="text-xs text-muted-foreground">
                          Review:{" "}
                          <span className="font-medium text-foreground">
                            {form.watch("description") || "—"}
                          </span>{" "}
                          — ₹{form.watch("amount") || "0"} —{" "}
                          {form.watch("payment_mode") || "ONLINE"}
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
              <Button
                variant="outline"
                type="button"
                className="px-5"
                onClick={handleCancel}
              >
                {t("case.land_form.buttons.cancel") || "Cancel"}
              </Button>
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    type="button"
                    className="px-5"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    className="px-6 bg-primary hover:bg-primary/90"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="px-6"
                    disabled={isSaving}
                    onClick={() => {
                      saveTriggeredRef.current = true;
                      setTimeout(
                        () => (saveTriggeredRef.current = false),
                        1000,
                      );
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />{" "}
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
