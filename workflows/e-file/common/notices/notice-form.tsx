"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { DSCSignerCard } from "@/components/ui/dsc-signer-card";
import {
  CommonsApiServices,
  useNoticeTypeList,
  useNoticeDeliveryModeList,
  useStatusList,
  useDSCSigner,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { apiClient } from "@/lib/api-client";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const noticeSchema = z.object({
  docType: z.string().min(1, "Notice type is required"),
  title: z.string().min(1, "Subject is required"),
  status: z.string().min(1, "Status is required"),
  deliveryMode: z.array(z.string()).min(1, "At least one delivery mode is required"),
  issueDate: z
    .string()
    .min(1, "Issue date is required")
    .refine(
      (val) => {
        if (!val) return false;

        return val <= todayStr();
      },
      { message: "Issue date cannot be in the future" },
    ),
  content: z.string().optional(),
});

type NoticeFormValues = z.infer<typeof noticeSchema>;

export function NoticeForm({
  onClose,
  onSuccess,
}: {
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation() as any;

  const noticeTypesQuery = useNoticeTypeList();
  const deliveryModesQuery = useNoticeDeliveryModeList();
  const { data: statusRes } = useStatusList({ "filters[type]": "NOTICE" } as any);
  const dscSigner = useDSCSigner();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNavigatingRef = useRef(false);

  const steps = [
    {
      id: 1,
      label: lang === "hi" ? "नोटिस विवरण" : "Notice Details",
      fields: ["docType", "status", "title", "content", "issueDate"] as const,
    },
    {
      id: 2,
      label: lang === "hi" ? "वितरण माध्यम" : "Delivery Mode",
      fields: ["deliveryMode"] as const,
    },
    {
      id: 3,
      label: lang === "hi" ? "दस्तावेज़ व हस्ताक्षर" : "Attachment & Signature",
      fields: [] as const,
    },
  ] as const;

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      docType: "CASE_NOTICE",
      title: "",
      status: "NOTICE_ISSUED",
      deliveryMode: [],
      issueDate: todayStr(),
      content: "",
    },
  });

  useEffect(() => {
    const statuses: any[] = (statusRes as any)?.result?.data || [];
    if (statuses.length && !form.getValues("status")) {
      const def = statuses.find((s: any) => s.code === "NOTICE_ISSUED") || statuses[0];
      if (def) form.setValue("status", def.code || String(def.id));
    }
  }, [statusRes, form]);

  const handleNext = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      const fields = (steps as any)[currentStep - 1]?.fields as readonly string[] | undefined;
      if (fields && fields.length) {
        const ok = await form.trigger(fields as any);
        if (!ok) return;
      }
      if (currentStep === 1) {
        const v = form.getValues();
        if (!String(v.docType || "").trim()) { form.setError("docType" as any, { type: "required", message: "Notice type is required" }); return; }
        if (!String(v.title || "").trim()) { form.setError("title" as any, { type: "required", message: "Subject is required" }); return; }
        if (!String(v.status || "").trim()) { form.setError("status" as any, { type: "required", message: "Status is required" }); return; }
        if (!String(v.issueDate || "").trim()) { form.setError("issueDate" as any, { type: "required", message: "Issue date is required" }); return; }
      }
      if (currentStep === 2) {
        const dm = form.getValues("deliveryMode");
        if (!dm || dm.length === 0) {
          form.setError("deliveryMode" as any, { type: "required", message: "At least one delivery mode is required" });
          return;
        }
      }
      setCurrentStep((s) => Math.min(steps.length, s + 1));
    } finally {
      setTimeout(() => { isNavigatingRef.current = false; }, 300);
    }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const onSubmit = form.handleSubmit(async (values) => {
    if (currentStep !== steps.length) return;
    if (!selectedFile) {
      toast.error(lang === "hi" ? "कृपया PDF फ़ाइल चुनें।" : "Please select a PDF file.");
      return;
    }
    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File too large — max 10MB.");
      return;
    }
    setSaving(true);
    let signingToastId: string | null = null;
    let signaturePayload: any = null;
    try {
      if (dscSigner.useDsc) {
        signingToastId = toast.loading(t("case.notices.signing_document") ?? "Signing document...") as unknown as string;
        try {
          signaturePayload = await dscSigner.signDocument(selectedFile);
          if (signingToastId) toast.dismiss(signingToastId);
        } catch (e: any) {
          if (signingToastId) toast.dismiss(signingToastId);
          const msg = e?.message || "";
          if (msg === "TOKEN_PIN_REQUIRED") toast.error(t("case.notices.enter_token_pin") ?? "Enter token PIN");
          else if (msg === "NO_MATCHING_TOKEN") toast.error(t("case.notices.no_matching_token") ?? "No matching DSC token");
          else toast.error(msg || (t("case.notices.failed_to_create") ?? "Failed to sign"));
          setSaving(false);
          return;
        }
      }
      const noticeStatuses: any[] = (statusRes as any)?.result?.data || [];
      const selectedStatusObj = noticeStatuses.find((s: any) => s.code === values.status || String(s.id) === values.status);
      const fd = new FormData();
      fd.append("file", selectedFile, selectedFile.name);
      fd.append("type_of_doc", values.docType);
      if (values.content?.trim()) fd.append("remarks", values.content.trim());
      if (selectedStatusObj) fd.append("status", String(selectedStatusObj.id));
      else {
        const def = noticeStatuses.find((s: any) => s.code === "NOTICE_ISSUED") || noticeStatuses[0];
        if (def) fd.append("status", String(def.id));
      }
      const metadata = {
        title: values.title.trim(),
        subject: values.title.trim(),
        issue_date: values.issueDate,
        notice_type: values.docType,
        delivery_mode: values.deliveryMode,
        content: values.content?.trim() || "",
        signature_hash: signaturePayload?.signature_hash || null,
        document_hash: signaturePayload?.document_hash || null,
        algorithm: signaturePayload?.algorithm || null,
        signed_at: signaturePayload?.signed_at || null,
        serial: signaturePayload?.serial || null,
      };
      fd.append("meta", JSON.stringify(metadata));

      const uploadRes = await apiClient.post(`/doc/linked/CaseModel/${case_number}/upload/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      } as any);
      const createdDoc = (uploadRes.data as any)?.result?.data;
      if (dscSigner.useDsc && createdDoc?.id && signaturePayload) {
        await CommonsApiServices.DscSignatureSign("DocModel", createdDoc.id, {
          signature_hash: signaturePayload.signature_hash,
          document_hash: signaturePayload.document_hash,
        });
        toast.success(t("case.notices.signed_saved_success") ?? "Notice signed and saved.");
      } else {
        toast.success(t("case.notices.saved_success") ?? "Notice created.");
      }
      if (typeof window !== "undefined" && window.opener) {
        try { window.opener.postMessage("refetch-notices", window.location.origin); } catch { window.opener.postMessage("refetch-notices", "*"); }
      }
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      if (signingToastId) toast.dismiss(signingToastId);
      toast.error(err?.message || err?.response?.data?.message || (t("case.notices.failed_to_create") ?? "Failed to create notice"));
    } finally {
      setSaving(false);
    }
  });

  const totalSteps = steps.length;

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      <Form {...form}>
        <div
          onKeyDown={(e) => {
            if (e.key === "Enter" && currentStep !== totalSteps) {
              const t = e.target as HTMLElement | null;
              if (t && t.tagName === "TEXTAREA") return;
              e.preventDefault();
            }
          }}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          {}
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            {}
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{lang === "hi" ? "नोटिस जोड़ें" : "Add Notice"}</h1>
            </div>

            {}
            <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>

            {}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{t("case.notices.document_classification") ?? (lang === "hi" ? "दस्तावेज़ वर्गीकरण" : "Document Classification")}</div>
                    <div className="p-6 grid md:grid-cols-2 gap-4">
                      <CustomComboboxField
                        control={form.control as any}
                        name="docType"
                        label={t("case.notices.document_type") ?? (lang === "hi" ? "दस्तावेज़ प्रकार" : "Document Type")}
                        placeholder={t("case.notices.select_doc_type") ?? "Select type"}
                        required
                        options={(noticeTypesQuery.data?.result?.data || []).map((x: any) => ({ label: lang === "hi" ? x.name || x.name_en : x.name_en || x.name, value: x.code }))}
                      />
                      <CustomComboboxField
                        control={form.control as any}
                        name="status"
                        label={t("case.notices.status") ?? (lang === "hi" ? "स्थिति" : "Status")}
                        placeholder={t("case.notices.select_status") ?? "Select status"}
                        required
                        options={((statusRes as any)?.result?.data || []).map((s: any) => ({ label: lang === "hi" ? s.name || s.name_en : s.name_en || s.name, value: s.code || String(s.id) }))}
                      />
                    </div>
                  </section>
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "विषय विवरण" : "Subject Details"}</div>
                    <div className="p-6 space-y-4">
                      <TextFieldV2 control={form.control as any} name="title" label={t("case.notices.subject_title") ?? (lang === "hi" ? "विषय / शीर्षक" : "Subject / Title")} placeholder={t("case.notices.enter_subject") ?? "Enter subject"} required />
                      <TextareaField control={form.control as any} name="content" label={lang === "hi" ? "विवरण" : "Description"} placeholder={lang === "hi" ? "विवरण दर्ज करें..." : "Enter description..."} rows={4} />
                      <TextFieldV2 control={form.control as any} name="issueDate" label={lang === "hi" ? "जारी दिनांक" : "Issue Date"} type="date" required max={todayStr()} />
                    </div>
                  </section>
                </div>
              )}

              {currentStep === 2 && (
                <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{steps[1].label}</div>
                  <div className="p-6">
                    <MultiAutocompleteField
                      control={form.control as any}
                      name="deliveryMode"
                      label={t("case.notices.delivery_mode") ?? (lang === "hi" ? "वितरण माध्यम" : "Delivery Mode")}
                      placeholder={t("case.notices.select_delivery_mode") ?? "Select delivery mode"}
                      required
                      options={(deliveryModesQuery.data?.result?.data || []).map((d: any) => ({ label: lang === "hi" ? d.name || d.name_en : d.name_en || d.name, value: d.code }))}
                    />
                  </div>
                </section>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "दस्तावेज़ संलग्नक" : "Document Attachment"}</div>
                    <div className="p-6 space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold">{t("case.notices.attachment_file") ?? (lang === "hi" ? "संलग्न फ़ाइल" : "Attachment File")} *</label>
                        {!selectedFile ? (
                          <label className="cursor-pointer border-2 border-dashed border-primary/20 rounded-xl p-10 flex flex-col items-center justify-center bg-muted/5 hover:bg-muted/10 transition-colors">
                            <Upload className="w-10 h-10 text-primary/50 mb-3" />
                            <span className="text-sm font-medium">{t("case.notices.click_to_select") ?? "Click to select a PDF file"}</span>
                            <span className="text-xs text-muted-foreground mt-1">{t("case.notices.max_size") ?? "Maximum size: 10MB"}</span>
                            <input hidden type="file" accept=".pdf,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.type !== "application/pdf") { toast.error(t("case.notices.only_pdf") ?? "Only PDF"); e.target.value = ""; return; } if (f.size > 10 * 1024 * 1024) { toast.error(t("case.notices.file_too_large") ?? "File too large"); e.target.value = ""; return; } setSelectedFile(f); e.target.value = ""; }} />
                          </label>
                        ) : (
                          <div className="border rounded-lg bg-muted/20 h-10 flex items-center px-3 gap-2">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-sm font-medium truncate flex-1 min-w-0">{selectedFile.name}</p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                            <button type="button" onClick={() => setSelectedFile(null)} className="ml-1 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                      <input ref={fileInputRef} hidden type="file" accept=".pdf,application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setSelectedFile(f); e.target.value = ""; }} />
                      {!selectedFile && (
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 px-3 text-xs"><Upload className="w-3.5 h-3.5 mr-1.5" />{lang === "hi" ? "फ़ाइल चुनें" : "Choose file"}</Button>
                      )}
                    </div>
                  </section>

                  <DSCSignerCard
                    useDsc={dscSigner.useDsc}
                    onUseDscChange={dscSigner.setUseDsc}
                    pin={dscSigner.pin}
                    onPinChange={dscSigner.setPin}
                    profileCerts={dscSigner.profileCerts}
                    loadingCerts={dscSigner.loadingProfileCerts}
                    title={t("case.notices.dsc_signature") ?? "Digital Signature (DSC)"}
                    checkboxLabel={t("case.notices.sign_with_dsc") ?? "Digitally sign with DSC Token"}
                    pinLabel={t("case.notices.token_pin") ?? "Token PIN"}
                    pinPlaceholder={t("case.notices.enter_pin") ?? "Enter token PIN"}
                    noCertsText={t("case.notices.no_dsc_found") ?? "No registered DSC certificate found in user profile."}
                    certsHeaderTitle={t("case.notices.profile_certs_details") ?? "Profile Certificate Details"}
                  />
                </div>
              )}
            </div>

            {}
            <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} className="px-5">{t("case.notices.cancel") ?? "Cancel"}</Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && (
                  <Button type="button" variant="outline" onClick={handleBack} className="px-5">Back</Button>
                )}
                {currentStep < totalSteps ? (
                  <Button type="button" onClick={handleNext} className="px-6 font-semibold">Next</Button>
                ) : (
                  <Button type="button" onClick={onSubmit as any} disabled={saving} className="px-6 font-semibold">{saving ? (lang === "hi" ? "सहेजा जा रहा है..." : "Saving...") : (t("case.notices.issue") ?? (lang === "hi" ? "जारी करें" : "Issue"))}</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
