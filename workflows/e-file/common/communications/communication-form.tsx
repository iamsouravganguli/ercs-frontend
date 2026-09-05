"use client";

import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { CommonsApiServices, useCommunicationTypeList, useStatusList } from "@/lib";
import { useTranslation } from "@/i18n";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickDraftStatus(statuses: any[]): any | null {
  if (!statuses?.length) return null;

  return statuses.find((s: any) => s.code === "COMM_DRAFT") || statuses.find((s: any) => String(s.code || "").toUpperCase().includes("DRAFT")) || statuses[0];
}

const communicationSchema = z.object({
  communication_type: z.string().min(1, "Communication type is required"),
  status: z.string().min(1, "Status is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().optional(),
  issueDate: z.string().min(1, "Issue date is required").refine((val) => !val || val <= todayStr(), { message: "Issue date cannot be in the future" }),
  remarks: z.string().optional(),
});

type CommunicationFormValues = z.infer<typeof communicationSchema>;

export function CommunicationForm({ onClose, onSuccess }: { onClose?: () => void; onSuccess?: (created: any) => void }) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation() as any;
  const commTypesQuery = useCommunicationTypeList();
  const { data: statusRes } = useStatusList({ "filters[type]": "CASE_COMMUNICATION" } as any);

  const [currentStep, setCurrentStep] = React.useState(1);
  const isNavigatingRef = useRef(false);
  const totalSteps = 2;
  const statuses: any[] = (statusRes as any)?.result?.data || [];

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationSchema),
    defaultValues: { communication_type: "", status: "", subject: "", content: "", issueDate: todayStr(), remarks: "" },
  });


  useEffect(() => {
    if (!statuses.length) return;
    if (form.getValues("status")) return;
    const draft = pickDraftStatus(statuses);
    if (draft) form.setValue("status", draft.code || String(draft.id), { shouldValidate: false });
  }, [statusRes, form, statuses]);

  const handleNext = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      if (currentStep === 1) {
        const ok = await form.trigger(["communication_type", "status", "subject", "issueDate"] as any);
        if (!ok) return;
        if (!String(form.getValues("communication_type") || "").trim()) { form.setError("communication_type" as any, { message: "Communication type is required" }); return; }
        if (!String(form.getValues("status") || "").trim()) { form.setError("status" as any, { message: "Status is required" }); return; }
        if (!String(form.getValues("subject") || "").trim()) { form.setError("subject" as any, { message: "Subject is required" }); return; }
        if (String(form.getValues("issueDate") || "") > todayStr()) { form.setError("issueDate" as any, { message: "Issue date cannot be in the future" }); return; }
      }
      setCurrentStep((s) => Math.min(totalSteps, s + 1));
    } finally { setTimeout(() => { isNavigatingRef.current = false; }, 300); }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const [saving, setSaving] = React.useState(false);
  const onSubmit = form.handleSubmit(async (values) => {
    if (currentStep !== totalSteps) return;
    setSaving(true);
    try {
      const commTypes: any[] = (commTypesQuery.data as any)?.result?.data || [];
      const typeObj = commTypes.find((x: any) => x.code === values.communication_type || String(x.id) === values.communication_type);

      const draft = pickDraftStatus(statuses);
      const statusId = draft ? draft.id : (statuses.find((s: any) => s.code === values.status || String(s.id) === values.status)?.id || values.status);
      const payload: any = {
        communication_type: typeObj ? typeObj.id : values.communication_type,
        status: statusId,
        subject: values.subject.trim(),
        content: values.content?.trim() || null,
        issue_date: values.issueDate || null,
        remarks: values.remarks?.trim() || null,
      };
      const createdRes: any = await CommonsApiServices.CaseCommunicationCreate(case_number, payload);
      const created = createdRes?.result?.data || createdRes?.data || createdRes;
      toast.success(t("case.communication.created_success") ?? "Communication created");
      onSuccess?.(created);
      onClose?.();
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.message || "Failed to create communication");
    } finally { setSaving(false); }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      <Form {...form}>
        <div
          onKeyDown={(e) => { if (e.key === "Enter" && currentStep !== totalSteps) { const tt = e.target as HTMLElement | null; if (tt && tt.tagName === "TEXTAREA") return; e.preventDefault(); } }}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{t("case.communication.add_title") ?? (lang === "hi" ? "संचार जोड़ें" : "Add Communication")}</h1>
            </div>
            <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{t("case.communication.document_classification") ?? (lang === "hi" ? "दस्तावेज़ वर्गीकरण" : "Document Classification")}</div>
                    <div className="p-6 grid md:grid-cols-2 gap-4">
                      <CustomComboboxField control={form.control as any} name="communication_type" label={lang === "hi" ? "संचार प्रकार" : "Communication Type"} placeholder={lang === "hi" ? "प्रकार चुनें" : "Select type"} required options={(commTypesQuery.data?.result?.data || []).map((x: any) => ({ label: lang === "hi" ? x.name || x.name_en : x.name_en || x.name, value: x.code }))} />
                      <CustomComboboxField
                        control={form.control as any}
                        name="status"
                        label={t("case.notices.status") ?? (lang === "hi" ? "स्थिति" : "Status")}
                        placeholder={t("case.notices.select_status") ?? "Select status"}
                        required
                        disabled
                        readOnly
                        options={statuses.map((s: any) => ({ label: lang === "hi" ? s.name || s.name_en : s.name_en || s.name, value: s.code || String(s.id) }))}
                      />
                    </div>
                  </section>
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{t("case.communication.subject_details") ?? (lang === "hi" ? "विषय विवरण" : "Subject Details")}</div>
                    <div className="p-6 space-y-4">
                      <TextFieldV2 control={form.control as any} name="subject" label={t("case.communication.subject_title") ?? (lang === "hi" ? "विषय / शीर्षक" : "Subject / Title")} placeholder={t("case.communication.enter_subject") ?? "Enter subject"} required />
                      <TextareaField control={form.control as any} name="content" label={t("case.communication.description") ?? (lang === "hi" ? "विवरण" : "Description")} placeholder={t("case.communication.enter_description") ?? "Enter description..."} rows={4} />
                      <TextFieldV2 control={form.control as any} name="issueDate" label={t("case.communication.issue_date") ?? (lang === "hi" ? "जारी दिनांक" : "Issue Date")} type="date" required max={todayStr()} />
                    </div>
                  </section>
                </div>
              )}
              {currentStep === 2 && (
                <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "टिप्पणी" : "Remarks"}</div>
                  <div className="p-6">
                    <TextareaField control={form.control as any} name="remarks" label={lang === "hi" ? "टिप्पणी" : "Remarks"} placeholder={lang === "hi" ? "टिप्पणी दर्ज करें..." : "Enter remarks..."} rows={4} />
                    <p className="text-xs text-muted-foreground mt-3">{lang === "hi" ? "दस्तावेज़ अलग से Actions → Upload Document से जोड़ें।" : "Add documents later via Actions → Upload Document."}</p>
                  </div>
                </section>
              )}
            </div>
            <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} className="px-5">{t("case.notices.cancel") ?? "Cancel"}</Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && (<Button type="button" variant="outline" onClick={handleBack} className="px-5">Back</Button>)}
                {currentStep < totalSteps ? (<Button type="button" onClick={handleNext} className="px-6 font-semibold">Next</Button>) : (<Button type="button" onClick={onSubmit as any} disabled={saving} className="px-6 font-semibold">{saving ? (lang==="hi"?"सहेजा जा रहा है...":"Saving...") : (t("case.communication.issue") ?? (lang==="hi"?"बनाएँ":"Create"))}</Button>)}
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
