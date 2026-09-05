"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { useTranslation } from "@/i18n";
import {
  CommonsApiServices,
  useCasePartyList,
  useStatusList,
} from "@/lib";
import { useParams } from "next/navigation";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SERVICE_MODES = ["By Hand", "Post", "Email", "WhatsApp", "Court Notice Board"] as const;

const reportSchema = z.object({
  service_mode_text: z.string().min(1, "Service mode is required"),
  service_date: z.string().min(1, "Service date is required").refine((v) => !v || v <= todayStr(), { message: "Service date cannot be in the future" }),
  status: z.string().min(1, "Status is required"),
  receiver_name: z.string().min(1, "Receiver name is required"),
  receiver_relation_text: z.string().optional(),
  remarks: z.string().optional(),
});

const witnessSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  remarks: z.string().optional(),
});

type ReportValues = z.infer<typeof reportSchema>;

export function ServiceReportModal({
  openCommunication,
  onClose,
  onSuccess,
}: {
  openCommunication: any;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation() as any;

  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState<number | null>(null);
  const [witnesses, setWitnesses] = useState<any[]>([]);
  const [wSaving, setWSaving] = useState(false);

  const partyListQ = useCasePartyList(case_number);
  const parties: any[] = (partyListQ.data as any)?.result?.data || [];
  const statusQ = useStatusList({ "filters[type]": "SERVICE_REPORT" } as any);
  const statuses: any[] = (statusQ.data as any)?.result?.data || [];

  const form = useForm<ReportValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: { service_mode_text: "By Hand", service_date: todayStr(), status: "SR_SERVED", receiver_name: "", receiver_relation_text: "", remarks: "" },
  });

  const witnessForm = useForm<z.infer<typeof witnessSchema>>({
    resolver: zodResolver(witnessSchema),
    defaultValues: { full_name: "", phone: "", address: "", remarks: "" },
  });

  const addRecipients = async () => {
    if (!openCommunication || selectedParties.length === 0) { toast.error("Select at least one party"); return; }
    setSavingRecipient(true);
    try {
      const payload = selectedParties.map((p) => ({ party: Number(p) }));
      await CommonsApiServices.CaseCommunicationRecipientCreate(case_number, openCommunication.id, payload.length === 1 ? payload[0] as any : payload as any);
      toast.success("Recipients added");
      setSelectedParties([]);

      const res: any = await CommonsApiServices.CaseCommunicationRecipientList(case_number, openCommunication.id);
      setRecipients(res?.result?.data || res?.data || []);
    } catch (e: any) { toast.error(e?.message || "Failed to add recipients"); }
    finally { setSavingRecipient(false); }
  };

  React.useEffect(() => {
    if (!openCommunication) return;
    CommonsApiServices.CaseCommunicationRecipientList(case_number, openCommunication.id).then((res: any) => setRecipients(res?.result?.data || res?.data || [])).catch(()=>{});
  }, [openCommunication, case_number]);

  const createReport = form.handleSubmit(async (values) => {
    if (!selectedRecipientId) { toast.error("Select a recipient first"); return; }
    const sd = statuses.find((s: any) => s.code === values.status || String(s.id) === values.status);
    setSavingReport(true);
    try {
      const payload: any = {
        status: sd ? sd.id : values.status,
        service_mode_text: values.service_mode_text,
        service_date: values.service_date,
        receiver_name: values.receiver_name,
        receiver_relation_text: values.receiver_relation_text || null,
        remarks: values.remarks || null,
      };
      const res: any = await CommonsApiServices.CaseCommunicationServiceReportCreate(case_number, selectedRecipientId, payload);
      toast.success(t("case.communication_service_report.saved_success") ?? "Service report saved");
      setWitnesses([]);
      witnessForm.reset({ full_name: "", phone: "", address: "", remarks: "" });
      onSuccess?.();

      const created = res?.result?.data || res?.data;
      if (created?.id) {

      }
    } catch (e: any) { toast.error(e?.message || "Failed to save report"); }
    finally { setSavingReport(false); }
  });

  const addWitness = witnessForm.handleSubmit(async (vals) => {

    if (!selectedRecipientId) { toast.error("Select recipient / create report first"); return; }

    let reportId: number | null = null;
    try {
      const listRes: any = await CommonsApiServices.CaseCommunicationServiceReportList(case_number, selectedRecipientId);
      const list: any[] = listRes?.result?.data || listRes?.data || [];
      reportId = list[0]?.id || null;
    } catch {}
    if (!reportId) { toast.error("Create a service report first"); return; }
    setWSaving(true);
    try {
      const res: any = await CommonsApiServices.CaseCommunicationServiceWitnessCreate(case_number, reportId, { full_name: vals.full_name, phone: vals.phone || null, address: vals.address || null, remarks: vals.remarks || null });
      const wit = res?.result?.data || res?.data;
      setWitnesses((prev) => [...prev, wit]);
      witnessForm.reset({ full_name: "", phone: "", address: "", remarks: "" });
      toast.success("Witness added");
    } catch (e: any) { toast.error(e?.message || "Failed to add witness"); }
    finally { setWSaving(false); }
  });

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
      <Form {...form}>
        <div onSubmit={(e)=>e.preventDefault()} className="flex flex-1 flex-col overflow-hidden h-full min-h-0">
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{t("case.communication_service_report.title") ?? (lang==="hi"?"तामील रिपोर्ट":"Service Report")}</h1>
              {openCommunication?.communication_id && (<span className="text-xs font-medium bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{openCommunication.communication_id}</span>)}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" /> {t("case.communication_service_report.recipient_title") ?? (lang==="hi"?"प्राप्तकर्ता":"Recipients")}</div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900">
                    {parties.length === 0 ? (<p className="text-xs text-muted-foreground">No parties</p>) : parties.map((p: any) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedParties.includes(String(p.id))} onChange={(e)=> setSelectedParties((prev)=> e.target.checked ? [...prev, String(p.id)] : prev.filter((x)=>x!==String(p.id)))} />
                        <span>{p.full_name}</span>
                        <span className="text-xs text-muted-foreground">#{p.id}</span>
                      </label>
                    ))}
                  </div>
                  <Button type="button" size="sm" onClick={addRecipients} disabled={savingRecipient || selectedParties.length===0} className="h-8"><Plus className="w-3.5 h-3.5 mr-1" /> {savingRecipient ? "Adding..." : (t("case.communication_service_report.add_recipient") ?? "Add Recipients")}</Button>
                  {recipients.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Existing Recipients</p>
                      <div className="flex flex-wrap gap-2">
                        {recipients.map((r: any) => (
                          <button key={r.id} type="button" onClick={()=>setSelectedRecipientId(r.id)} className={`text-xs px-3 py-1.5 rounded-full border ${selectedRecipientId===r.id?"bg-primary text-primary-foreground border-primary":"bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"}`}>
                            {r.party_detail?.full_name || `Recipient #${r.id}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold">{t("case.communication_service_report.title") ?? "Service Report"}</div>
                <div className="p-6 space-y-4">
                  {!selectedRecipientId ? (<p className="text-xs text-muted-foreground">Select a recipient above to create a report.</p>) : (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <CustomComboboxField control={form.control as any} name="service_mode_text" label={t("case.communication_service_report.service_mode_label") ?? "Service Mode"} required placeholder={t("case.communication_service_report.service_mode_placeholder") ?? "Select"} options={SERVICE_MODES.map((m)=>({ label: m, value: m }))} />
                        <TextFieldV2 control={form.control as any} name="service_date" label={lang==="hi"?"तामील तिथि":"Service Date"} type="date" required max={todayStr()} />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <CustomComboboxField control={form.control as any} name="status" label={t("case.notices.status") ?? "Status"} required placeholder="Select status" options={(statuses as any[]).map((s: any)=>({ label: lang==="hi"? s.name || s.name_en : s.name_en || s.name, value: s.code || String(s.id) }))} />
                        <TextFieldV2 control={form.control as any} name="receiver_name" label={t("case.notices.recipient_name") ?? "Receiver Name"} required />
                      </div>
                      <TextFieldV2 control={form.control as any} name="receiver_relation_text" label={t("case.communication_service_report.receiver_relation_label") ?? "Relation"} placeholder={lang==="hi"?"जैसे Self, Brother":"e.g. Self, Brother"} />
                      <TextareaField control={form.control as any} name="remarks" label={lang==="hi"?"टिप्पणी":"Remarks"} placeholder={lang==="hi"?"विवरण दर्ज करें...":"Enter remarks..."} rows={3} />
                      <div className="flex justify-end">
                        <Button type="button" onClick={createReport as any} disabled={savingReport} className="px-6">{savingReport ? "Saving..." : (t("case.communication_service_report.save_report") ?? "Save Report")}</Button>
                      </div>
                    </>
                  )}
                </div>
              </section>

              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold flex items-center justify-between">
                  <span>{t("case.communication_service_report.witness_title") ?? (lang==="hi"?"गवाह":"Witnesses")}</span>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-muted-foreground">Add witnesses for the latest report of the selected recipient. Proof documents can be uploaded via the global Doc upload linked to the witness id.</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <TextFieldV2 control={witnessForm.control as any} name="full_name" label={t("case.communication_service_report.witness_name") ?? "Full Name"} required />
                    <TextFieldV2 control={witnessForm.control as any} name="phone" label={t("case.communication_service_report.witness_phone") ?? "Phone"} />
                  </div>
                  <TextFieldV2 control={witnessForm.control as any} name="address" label={t("case.communication_service_report.witness_address") ?? "Address"} />
                  <TextareaField control={witnessForm.control as any} name="remarks" label={lang==="hi"?"टिप्पणी":"Remarks"} rows={2} />
                  <div className="flex items-center justify-between">
                    <Button type="button" variant="outline" size="sm" onClick={addWitness as any} disabled={wSaving} className="h-8"><Plus className="w-3.5 h-3.5 mr-1" /> {wSaving ? "Adding..." : (t("case.communication_service_report.add_witness") ?? "Add Witness")}</Button>
                    {witnesses.length > 0 && (<span className="text-xs text-muted-foreground">{witnesses.length} witness(es) added</span>)}
                  </div>
                  {witnesses.length > 0 && (
                    <div className="space-y-2">
                      {witnesses.map((w: any) => (
                        <div key={w.id || w.full_name} className="flex items-center justify-between border rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 text-sm">
                          <span className="font-medium">{w.full_name}</span>
                          <span className="text-xs text-muted-foreground">{w.phone || "—"}</span>
                          <button type="button" onClick={()=> setWitnesses((prev)=> prev.filter((x)=> x.id !== w.id))} className="p-1 hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
            <div className="flex items-center justify-end border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0 gap-2">
              <Button type="button" variant="outline" onClick={onClose} className="px-5">Close</Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
