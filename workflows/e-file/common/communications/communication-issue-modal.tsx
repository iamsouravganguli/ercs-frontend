"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { CommonsApiServices, useStatusList } from "@/lib";
import { useTranslation } from "@/i18n";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const schema = z.object({
  status: z.string().min(1, "Status is required"),
  issue_date: z.string().min(1, "Issue date is required").refine((v) => !v || v <= todayStr(), { message: "Issue date cannot be in the future" }),
  remarks: z.string().optional(),
});

export function CommunicationIssueModal({
  communication,
  caseNumber,
  onClose,
  onSuccess,
}: {
  communication: any;
  caseNumber: string;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const { t, lang } = useTranslation() as any;
  const { data: statusRes } = useStatusList({ "filters[type]": "CASE_COMMUNICATION" } as any);
  const statuses: any[] = (statusRes as any)?.result?.data || [];

  const defaultStatus = React.useMemo(() => {
    if (!statuses.length) return null;
    return statuses.find((s: any) => s.code === "COMM_ISSUED") || statuses.find((s: any) => !String(s.code).toUpperCase().includes("DRAFT")) || statuses[0];
  }, [statuses]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { status: "", issue_date: communication?.issue_date || todayStr(), remarks: communication?.remarks || "" },
  });

  React.useEffect(() => {
    if (defaultStatus && !form.getValues("status")) {
      form.setValue("status", defaultStatus.code || String(defaultStatus.id));
    }
  }, [defaultStatus, form]);


  React.useEffect(() => {
    if (communication) {
      form.setValue("issue_date", communication.issue_date || todayStr());
      form.setValue("remarks", communication.remarks || "");
    }
  }, [communication, form]);

  const [saving, setSaving] = React.useState(false);
  const onSubmit = form.handleSubmit(async (values) => {
    if (String(values.issue_date) > todayStr()) { form.setError("issue_date" as any, { message: "Issue date cannot be in the future" }); return; }
    const sd = statuses.find((s: any) => s.code === values.status || String(s.id) === values.status);
    setSaving(true);
    try {
      const payload: any = {
        status: sd ? sd.id : values.status,
        issue_date: values.issue_date,
        remarks: values.remarks?.trim() || null,
      };
      await CommonsApiServices.CaseCommunicationUpdate(caseNumber, communication.id, payload);
      toast.success(lang === "hi" ? "संचार जारी किया गया" : "Communication issued");
      onSuccess?.();
      onClose?.();
    } catch (e: any) {
      toast.error(e?.message || "Failed to issue");
    } finally { setSaving(false); }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      <Form {...form}>
        <div onSubmit={(e) => e.preventDefault()} className="flex flex-1 flex-col overflow-hidden h-full min-h-0">
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{lang === "hi" ? "संचार जारी करें" : "Issue Communication"}</h1>
              {communication?.communication_id && (<span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{communication.communication_id}</span>)}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{communication?.subject || "—"}</div>
                <div className="p-6 space-y-4">
                  <CustomComboboxField
                    control={form.control as any}
                    name="status"
                    label={t("case.notices.status") ?? (lang === "hi" ? "स्थिति" : "Communication Status")}
                    placeholder={t("case.notices.select_status") ?? "Select status"}
                    required
                    options={statuses.map((s: any) => ({ label: lang === "hi" ? s.name || s.name_en : s.name_en || s.name, value: s.code || String(s.id) }))}
                  />
                  <TextFieldV2 control={form.control as any} name="issue_date" label={t("case.communication.issue_date") ?? (lang === "hi" ? "जारी दिनांक" : "Issue Date")} type="date" required max={todayStr()} />
                  <TextareaField control={form.control as any} name="remarks" label={lang === "hi" ? "टिप्पणी / रिमार्क" : "Remarks"} placeholder={lang === "hi" ? "रिमार्क दर्ज करें..." : "Enter remarks..."} rows={4} />
                </div>
              </section>
            </div>
            <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} className="px-5">{t("case.notices.cancel") ?? "Cancel"}</Button>
              <Button type="button" onClick={onSubmit as any} disabled={saving} className="px-6 font-semibold">{saving ? (lang === "hi" ? "जारी किया जा रहा है..." : "Issuing...") : (lang === "hi" ? "जारी करें" : "Issue")}</Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
