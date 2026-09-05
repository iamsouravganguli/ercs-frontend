"use client";

import React, { useState, useRef, useMemo } from "react";
import { useTranslation } from "@/i18n";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { createTicket } from "@/app/manage/support/services";
import {
  useSessionCheck,
  getLabel,
  useCaseList,
  useUploadDocument,
} from "@/lib";
import { useSupportMasterList } from "@/app/administrator/masters/support/query";
import { getSupportMasterList } from "@/app/administrator/masters/support/services";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { RichTextField } from "@/components/ui/richtext-field";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const createNewTicketSchema = (t: any) =>
  z.object({
    support_type: z
      .string()
      .min(
        1,
        t("support.validation.support_type_required") ||
          "Support type is required",
      ),
    category: z
      .string()
      .min(
        1,
        t("support.validation.category_required") || "Category is required",
      ),
    sub_category: z
      .string()
      .min(
        1,
        t("support.validation.sub_category_required") ||
          "Sub-category is required",
      ),
    priority: z
      .string()
      .min(
        1,
        t("support.validation.priority_required") || "Priority is required",
      ),
    subject: z
      .string()
      .min(
        5,
        t("support.validation.subject_min") ||
          "Subject must be at least 5 characters",
      )
      .max(
        120,
        t("support.validation.subject_max") ||
          "Subject cannot exceed 120 characters",
      ),
    description: z
      .string()
      .min(
        10,
        t("support.validation.description_min") ||
          "Description must be at least 10 characters",
      ),
    case_number: z.string().optional().or(z.literal("")),
  });

type TicketCreateWorkflowProps = {
  onSuccess?: (ticketNumber?: string) => void;
  onClose?: () => void;
  hideHeader?: boolean;
};

export function TicketCreateWorkflow({
  onSuccess,
  onClose,
  hideHeader,
}: TicketCreateWorkflowProps) {
  const { t, lang } = useTranslation();
  const queryClient = useQueryClient();
  const { data: Session } = useSessionCheck();
  const user = Session?.result?.data;

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isManualCaseEntry, setIsManualCaseEntry] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportTypesQuery = useSupportMasterList("support-types", {
    limit: 100,
  });
  const prioritiesQuery = useSupportMasterList("support-priorities", {
    limit: 100,
  });
  const myCasesQuery = useCaseList({
    limit: 100,
    "filters[is_submitted]": true,
  });

  const isStaffUser = useMemo(() => {
    if (!user?.role) return false;
    const staffRoles = ["SA", "RI", "RSI", "COURT_USER", "READER", "CO"];
    return staffRoles.includes(user.role.toUpperCase());
  }, [user]);

  const availableSupportTypes = useMemo(() => {
    const allTypes = supportTypesQuery.data?.result?.data || [];
    if (!allTypes.length) return [];
    if (isStaffUser) {
      const staffTypeCodes = [
        "TECHNICAL_SUPPORT",
        "KNOWLEDGE_SUPPORT",
        "HARDWARE_INFRA",
        "NON_CASE_RELATED",
      ];
      const filtered = allTypes.filter((t: any) =>
        staffTypeCodes.includes(t.code),
      );
      return filtered.length ? filtered : allTypes;
    } else {
      const citizenTypeCodes = ["CASE_RELATED", "NON_CASE_RELATED"];
      const filtered = allTypes.filter((t: any) =>
        citizenTypeCodes.includes(t.code),
      );
      return filtered.length ? filtered : allTypes;
    }
  }, [supportTypesQuery.data, isStaffUser]);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  const ticketSchema = useMemo(() => createNewTicketSchema(t), [t]);
  const form = useForm({
    resolver: zodResolver(ticketSchema) as any,
    defaultValues: {
      support_type: "",
      category: "",
      sub_category: "",
      priority: "",
      subject: "",
      description: "",
      case_number: "",
    },
  });

  const watchedSupportType = form.watch("support_type");
  const watchedCategory = form.watch("category");

  const selectedSupportTypeObj = supportTypesQuery.data?.result?.data?.find(
    (item: any) => String(item.id) === watchedSupportType,
  );
  const isCaseRelated = selectedSupportTypeObj?.code === "CASE_RELATED";

  const categoriesQuery = useQuery({
    queryKey: [
      "SUPPORT_MASTER_LIST",
      "support-categories",
      { "filters[support_type__id]": watchedSupportType },
    ],
    queryFn: () =>
      getSupportMasterList("support-categories", {
        limit: 100,
        "filters[support_type__id]": watchedSupportType,
      }),
    enabled: !!watchedSupportType,
  });

  const subCategoriesQuery = useQuery({
    queryKey: [
      "SUPPORT_MASTER_LIST",
      "support-sub-categories",
      { "filters[category__id]": watchedCategory },
    ],
    queryFn: () =>
      getSupportMasterList("support-sub-categories", {
        limit: 100,
        "filters[category__id]": watchedCategory,
      }),
    enabled: !!watchedCategory,
  });

  const uploadDocMutation = useUploadDocument();

  const createTicketMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (res: any) => {
      toast.success(
        res.message ||
          t("support.toasts.success_create") ||
          "Support ticket created successfully!",
      );
      queryClient.invalidateQueries({ queryKey: ["support_tickets"] });
      if (window.opener) {
        window.opener.postMessage("REFRESH_SUPPORT_TICKET_LIST", "*");
      }
      const ticketNumber = res?.result?.data?.ticket_number;
      if (ticketNumber && !onSuccess) {
        const width = 800;
        const height = 750;
        let left = 100;
        let top = 100;
        if (typeof window !== "undefined") {
          const sX =
            window.screenLeft !== undefined
              ? window.screenLeft
              : (window as any).screenX;
          const sY =
            window.screenTop !== undefined
              ? window.screenTop
              : (window as any).screenY;
          const oW = window.innerWidth
            ? window.innerWidth
            : document.documentElement.clientWidth;
          const oH = window.innerHeight
            ? window.innerHeight
            : document.documentElement.clientHeight;
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
          `/action/support/tickets/chat?ticket_number=${ticketNumber}`,
          `Chat_${ticketNumber}`,
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
        );
      }
      if (onSuccess) onSuccess(ticketNumber);
      else window.close();
      if (onClose) onClose();
    },
    onError: (err: any) => {
      toast.error(
        err?.message ||
          t("support.toasts.fail_create") ||
          "Failed to submit ticket.",
      );
    },
  });

  const steps = [
    {
      id: 1,
      label: t("support.section.support_type") || "Support Type",
      fields: ["support_type", "case_number"] as const,
    },
    {
      id: 2,
      label: t("support.section.classification") || "Classification",
      fields: ["category", "sub_category"] as const,
    },
    {
      id: 3,
      label: t("support.section.details") || "Details",
      fields: ["subject", "description"] as const,
    },
    {
      id: 4,
      label: t("support.section.attachments") || "Attachments",
      fields: [] as const,
    },
    {
      id: 5,
      label: t("support.section.priority") || "Priority",
      fields: ["priority"] as const,
    },
  ];

  const handleNext = async () => {
    const fields = steps[currentStep - 1]?.fields as any;
    if (fields?.length) {
      const ok = await form.trigger(fields);
      if (!ok) return;
    }
    if (currentStep === 1 && isCaseRelated) {
      const val = String(form.getValues("case_number") || "").trim();
      if (!val) {
        form.setError("case_number", {
          type: "manual",
          message:
            t("support.form.case_number_required") || "Case number is required",
        });
        return;
      }
      form.clearErrors("case_number");
    }
    setCurrentStep((s) => Math.min(totalSteps, s + 1));
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const onSubmitTicket = async (data: any) => {
    setUploading(true);
    const docIds: number[] = [];
    for (const file of pendingFiles) {
      try {
        const res = await uploadDocMutation.mutateAsync({
          file,
          extraData: { type_of_doc: "SUPPORT_TICKET_ATTACHMENT" },
        });
        if (res?.success && res?.result?.data) {
          const docId = res.result.data.id;
          if (docId) docIds.push(docId);
        } else {
          toast.error(
            `${t("support.toasts.file_upload_failed") || "Failed to upload"} ${file.name}`,
          );
          setUploading(false);
          return;
        }
      } catch (uploadErr) {
        toast.error(
          `${t("support.toasts.file_upload_failed") || "Failed to upload"} ${file.name}`,
        );
        setUploading(false);
        return;
      }
    }
    const payload: any = {
      support_type: data.support_type,
      category: data.category,
      priority: data.priority,
      subject: data.subject,
      description: data.description,
    };
    if (data.sub_category) payload.sub_category = data.sub_category;
    if (isCaseRelated && data.case_number)
      payload.case_number = data.case_number;
    if (docIds.length > 0) payload.doc_ids = docIds;
    createTicketMutation.mutate(payload);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      for (const file of filesArray) {
        const isPdf =
          file.name.toLowerCase().endsWith(".pdf") ||
          file.type === "application/pdf";
        if (!isPdf) {
          toast.error(
            `${file.name}: ${t("support.toasts.file_pdf_only") || "Only PDF documents are allowed!"}`,
          );
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(
            `${file.name}: ${t("support.toasts.file_large") || "File size cannot exceed 10MB"}`,
          );
          continue;
        }
        const isDuplicate = pendingFiles.some(
          (existing) =>
            existing.name === file.name && existing.size === file.size,
        );
        if (isDuplicate) {
          toast.error(
            `${file.name}: ${t("support.toasts.file_duplicate") || "This file has already been added!"}`,
          );
          continue;
        }
        validFiles.push(file);
      }
      if (validFiles.length > 0)
        setPendingFiles((prev) => [...prev, ...validFiles]);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitTicket)}
        className="flex flex-1 flex-col h-full overflow-hidden bg-card"
      >
        {!hideHeader && (
          <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-card shrink-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {t("support.modal.title") || "Raise Support Ticket"}
            </h1>
          </div>
        )}
        {}
        <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
          {}
          {currentStep === 1 && (
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                {t("support.section.support_type") ||
                  "Support Type & Association"}
              </div>
              <div className="p-6 space-y-4">
                <CustomComboboxField
                  control={form.control as any}
                  name="support_type"
                  label={t("support.form.support_type") || "Support Type"}
                  placeholder={
                    t("support.form.select_support_type") ||
                    "Select support type"
                  }
                  required
                  loading={supportTypesQuery.isLoading}
                  options={availableSupportTypes.map((item: any) => ({
                    value: String(item.id),
                    label:
                      lang === "hi"
                        ? item.name || item.name_en || ""
                        : item.name_en || item.name || "",
                  }))}
                />
                {isCaseRelated && (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <Switch
                        id="isManualCaseEntry"
                        checked={isManualCaseEntry}
                        onCheckedChange={(v) => {
                          setIsManualCaseEntry(v);
                          form.setValue("case_number", "");
                        }}
                        aria-label="Enter manually"
                        className="scale-110"
                      />
                      <label
                        htmlFor="isManualCaseEntry"
                        className="text-sm font-normal text-foreground cursor-pointer select-none"
                      >
                        {t("support.form.enter_manually") ||
                          "Enter case number manually"}
                      </label>
                    </div>
                    {isManualCaseEntry ? (
                      <TextFieldV2
                        control={form.control as any}
                        name="case_number"
                        label={t("support.form.case_number") || "Case Number"}
                        placeholder={
                          t("support.form.case_number_placeholder") ||
                          "e.g. 123/2024"
                        }
                        required
                      />
                    ) : (
                      <CustomComboboxField
                        control={form.control as any}
                        name="case_number"
                        label={t("support.form.case_number") || "Case Number"}
                        placeholder={
                          t("support.form.select_case_placeholder") ||
                          "Search and select from your cases"
                        }
                        required
                        loading={myCasesQuery.isLoading}
                        options={
                          (myCasesQuery.data?.result?.data || [])
                            .filter((item: any) => {
                              const isSubmitted = item.is_submitted !== false;
                              const statusCode = String(
                                item.current_status_detail?.code ||
                                  item.current_status?.code ||
                                  "",
                              ).toUpperCase();
                              const isDraftOrRejected =
                                statusCode === "DRAFT" ||
                                statusCode === "REJECTED";
                              return isSubmitted && !isDraftOrRejected;
                            })
                            .map((item: any) => {
                              const labelSuffix =
                                item.subject || item.title || "";
                              const label = labelSuffix
                                ? `${item.case_number} - ${labelSuffix}`
                                : item.case_number;
                              return { value: item.case_number, label };
                            }) || []
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {}
          {currentStep === 2 && (
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                {t("support.section.classification") || "Ticket Classification"}
              </div>
              <div className="p-6 space-y-4">
                <CustomComboboxField
                  control={form.control as any}
                  name="category"
                  label={t("support.form.category") || "Category"}
                  placeholder={
                    watchedSupportType
                      ? t("support.form.select_category") || "Select category"
                      : t("support.form.select_support_type_first") ||
                        "Select support type first..."
                  }
                  required
                  disabled={!watchedSupportType || categoriesQuery.isLoading}
                  loading={categoriesQuery.isLoading}
                  options={
                    categoriesQuery.data?.result?.data?.map?.((item: any) => ({
                      value: String(item.id),
                      label:
                        lang === "hi"
                          ? item.name || item.name_en || ""
                          : item.name_en || item.name || "",
                    })) || []
                  }
                />
                <CustomComboboxField
                  control={form.control as any}
                  name="sub_category"
                  label={t("support.form.sub_category") || "Sub-Category"}
                  placeholder={
                    watchedCategory
                      ? t("support.form.select_subcategory") ||
                        "Select sub-category"
                      : t("support.form.select_category_first") ||
                        "Select category first..."
                  }
                  required
                  disabled={!watchedCategory || subCategoriesQuery.isLoading}
                  loading={subCategoriesQuery.isLoading}
                  options={
                    subCategoriesQuery.data?.result?.data?.map?.(
                      (item: any) => ({
                        value: String(item.id),
                        label:
                          lang === "hi"
                            ? item.name || item.name_en || ""
                            : item.name_en || item.name || "",
                      }),
                    ) || []
                  }
                />
              </div>
            </section>
          )}

          {}
          {currentStep === 3 && (
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                {t("support.section.details") || "Problem Details"}
              </div>
              <div className="p-6 space-y-4">
                <TextFieldV2
                  control={form.control as any}
                  name="subject"
                  label={t("support.form.subject") || "Subject"}
                  placeholder={
                    t("support.form.subject_placeholder") ||
                    "Briefly state your issue (Max 120 chars)"
                  }
                  required
                  maxLength={120}
                />
                <RichTextField
                  control={form.control as any}
                  name="description"
                  label={t("support.form.description") || "Problem Description"}
                  required
                />
              </div>
            </section>
          )}

          {}
          {currentStep === 4 && (
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground flex items-center gap-1.5">
                <span>{t("support.section.attachments") || "Attachments"}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  ({t("support.form.optional") || "Optional"})
                </span>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          {t("support.form.uploading") || "Uploading..."}
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          {t("case.land_form.buttons.choose_documents") ||
                            "Choose Documents"}
                        </>
                      )}
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1.5 font-semibold">
                      {t("support.form.upload_types") ||
                        "Only PDF documents are supported (Max 10MB)"}
                    </p>
                  </div>
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {pendingFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg px-4 py-2.5"
                        >
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-xs font-medium text-foreground truncate flex-1">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0 focus:outline-none"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {}
          {currentStep === 5 && (
            <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                {t("support.section.priority") || "Ticket Priority"}
              </div>
              <div className="p-6 space-y-4">
                <CustomComboboxField
                  control={form.control as any}
                  name="priority"
                  label={t("support.form.priority") || "Priority"}
                  placeholder={
                    t("support.form.select_priority") || "Select priority"
                  }
                  required
                  loading={prioritiesQuery.isLoading}
                  options={
                    prioritiesQuery.data?.result?.data?.map?.((item: any) => ({
                      value: String(item.id),
                      label:
                        lang === "hi"
                          ? item.name || item.name_en || ""
                          : item.name_en || item.name || "",
                    })) || []
                  }
                  renderOption={(opt) => {
                    const item = prioritiesQuery.data?.result?.data?.find(
                      (x: any) => String(x.id) === String(opt.value),
                    );
                    const color =
                      (item as any)?.color_code ||
                      (String(item?.code || "").toUpperCase() === "HIGH"
                        ? "#DD6B20"
                        : String(item?.code || "").toUpperCase() === "MEDIUM"
                          ? "#3182CE"
                          : String(item?.code || "").toUpperCase() === "URGENT"
                            ? "#E53E3E"
                            : "#4A5568");
                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="truncate">{opt.label}</span>
                      </div>
                    );
                  }}
                />
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
          <Button
            variant="outline"
            type="button"
            className="px-5"
            onClick={() => (onClose ? onClose() : window.close())}
            disabled={uploading || createTicketMutation.isPending}
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
                disabled={uploading || createTicketMutation.isPending}
              >
                Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                type="button"
                className="px-6 bg-primary hover:bg-primary/90"
                onClick={handleNext}
                disabled={uploading || createTicketMutation.isPending}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="px-6"
                disabled={uploading || createTicketMutation.isPending}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("support.form.uploading") || "Uploading..."}
                  </>
                ) : createTicketMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("support.button.submitting") || "Submitting..."}
                  </>
                ) : (
                  t("support.button.submit") || "Submit"
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
