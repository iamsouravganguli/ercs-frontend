"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Copy, Check, RefreshCw, Video, Save } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { TextareaField } from "@/components/ui/textarea-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { DateTimePickerField } from "@/components/ui/date-time-picker-field";

import {
  useCaseHearingCreate,
  useCaseHearingUpdate,
  useCourtHearingsList,
  useHearingTypeList,
  useHearingStatusList,
  useHearingOutcomeList,
  useGenerateVideoMeeting,
} from "@/lib";
import { useTranslation } from "@/i18n";

const hearingSchema = z.object({
  hearing_date: z.string().min(1, "Hearing date is required"),
  hearing_expected_start_time: z.string().min(1, "Hearing time is required"),
  hearing_expected_end_time: z.string().min(1, "End time is required"),
  hearing_expected_duration: z.number().min(5, "Duration must be at least 5 minutes").max(390, "Duration cannot exceed 390 minutes"),
  hearing_type: z.string().min(1, "Hearing type is required"),
  hearing_status: z.string().min(1, "Hearing status is required"),
  hearing_outcome: z.string().optional(),
  remarks: z.string().optional(),
  video_conference: z.boolean(),
  video_conference_link: z.string().optional(),
});

type HearingFormValues = z.infer<typeof hearingSchema>;

export function HearingForm({
  hearing,
  onClose,
  onSuccess,
}: {
  hearing?: any;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation() as any;
  const isEditing = !!hearing;

  const [currentStep, setCurrentStep] = useState(1);
  const isNavigatingRef = useRef(false);
  const totalSteps = 2;

  const [copied, setCopied] = useState(false);

  const form = useForm<HearingFormValues>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      hearing_date: hearing?.hearing_date || "",
      hearing_expected_start_time: hearing?.hearing_expected_start_time ? String(hearing.hearing_expected_start_time).substring(0, 5) : "",
      hearing_expected_end_time: hearing?.hearing_expected_end_time ? String(hearing.hearing_expected_end_time).substring(0, 5) : "",
      hearing_expected_duration: hearing?.hearing_expected_duration || 60,
      hearing_type: hearing?.hearing_type ? String(hearing.hearing_type) : "",
      hearing_status: hearing?.hearing_status ? String(hearing.hearing_status) : "",
      hearing_outcome: hearing?.hearing_outcome ? String(hearing.hearing_outcome) : "",
      remarks: hearing?.remarks || "",
      video_conference: Boolean(hearing?.video_conference),
      video_conference_link: hearing?.video_conference_link || "",
    },
  });

  const hearingDateWatch = form.watch("hearing_date");
  const { data: hearingsRes, refetch: refetchHearings, isFetching: isSearchingSlots, isFetched: hasFetchedSlots } = useCourtHearingsList(
    hearingDateWatch ? { date: hearingDateWatch } : undefined,
    { enabled: false },
  );
  const existingHearings = hasFetchedSlots ? (hearingsRes?.result?.data || []) : [];
  const handleFindSlots = useCallback(async () => {
    if (!String(hearingDateWatch || "").trim()) {
      toast.error(lang === "hi" ? "पहले तारीख चुनें।" : "Select a date first.");
      return;
    }
    await refetchHearings();
  }, [hearingDateWatch, refetchHearings, lang]);

  const { data: typesRes } = useHearingTypeList({ limit: 100 } as any);
  const hearingTypes = (typesRes as any)?.result?.data || [];
  const { data: statusesRes } = useHearingStatusList({ limit: 100 } as any);
  const hearingStatuses = (statusesRes as any)?.result?.data || [];
  const { data: outcomesRes } = useHearingOutcomeList({ limit: 100 } as any);
  const hearingOutcomes = (outcomesRes as any)?.result?.data || [];

  const createMut = useCaseHearingCreate();
  const updateMut = useCaseHearingUpdate();
  const generateVcMut = useGenerateVideoMeeting();

  useEffect(() => {
    if (hearing) {
      form.reset({
        hearing_date: hearing.hearing_date || "",
        hearing_expected_start_time: hearing.hearing_expected_start_time ? String(hearing.hearing_expected_start_time).substring(0, 5) : "",
        hearing_expected_end_time: hearing?.hearing_expected_end_time ? String(hearing.hearing_expected_end_time).substring(0, 5) : "",
        hearing_expected_duration: hearing.hearing_expected_duration || 60,
        hearing_type: hearing.hearing_type ? String(hearing.hearing_type) : "",
        hearing_status: hearing.hearing_status ? String(hearing.hearing_status) : "",
        hearing_outcome: hearing.hearing_outcome ? String(hearing.hearing_outcome) : "",
        remarks: hearing.remarks || "",
        video_conference: Boolean(hearing.video_conference),
        video_conference_link: hearing.video_conference_link || "",
      });
    }
  }, [hearing, form]);

  const watchVc = form.watch("video_conference");
  const watchVcLink = form.watch("video_conference_link");
  const selectedStatusId = form.watch("hearing_status");
  const selectedStatusObj = hearingStatuses.find((s: any) => String(s.id) === String(selectedStatusId));
  const selectedStatusCode = selectedStatusObj?.code || "";
  const isOutcomeAllowed = selectedStatusCode !== "" && !["SCHEDULED", "IN_PROGRESS"].includes(selectedStatusCode);
  const filteredOutcomes = hearingOutcomes.filter((out: any) =>
    (out.allowed_statuses || "").split(",").map((s: string) => s.trim()).includes(selectedStatusCode)
  );

  useEffect(() => {
    form.setValue("hearing_outcome", "");
  }, [selectedStatusCode, form]);

  const handleGenerateVcLink = async () => {
    try {
      toast.loading(lang === "hi" ? "वीडियो मीटिंग लिंक जनरेट किया जा रहा है..." : "Generating VideoSDK meeting link...", { id: "vc-gen" });
      const res: any = await generateVcMut.mutateAsync();
      toast.dismiss("vc-gen");
      const meetingLink = res?.result?.data?.meeting_link || res?.data?.meeting_link || res?.meeting_link;
      if (meetingLink) {
        form.setValue("video_conference_link", meetingLink);
        toast.success(lang === "hi" ? "वीडियो मीटिंग लिंक जनरेट हो गया!" : "VideoSDK meeting link generated!");
      } else toast.error("Could not retrieve meeting link from response");
    } catch (e: any) {
      toast.dismiss("vc-gen");
      toast.error(e?.message || "Failed to generate meeting link");
    }
  };

  useEffect(() => {
    if (watchVc && !watchVcLink && !generateVcMut.isPending) handleGenerateVcLink();

  }, [watchVc]);

  const getMappedStatus = (code: string) => {
    if (["COMPLETED", "CLOSED"].includes(code)) return "COMPLETED";
    if (["ADJOURNED", "STAYED", "RESERVED_FOR_ORDER"].includes(code)) return "ADJOURNED";
    if (["CANCELLED"].includes(code)) return "CANCELLED";
    return "SCHEDULED";
  };

  const handleNext = async () => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      if (currentStep === 1) {
        const ok = await form.trigger(["hearing_date", "hearing_expected_start_time", "hearing_expected_end_time"] as any);
        if (!ok) return;
        if (!String(form.getValues("hearing_date") || "").trim()) { form.setError("hearing_date" as any, { message: "Hearing date is required" }); return; }
        if (!String(form.getValues("hearing_expected_start_time") || "").trim()) { form.setError("hearing_expected_start_time" as any, { message: "Start time is required" }); return; }
        if (!String(form.getValues("hearing_expected_end_time") || "").trim()) { form.setError("hearing_expected_end_time" as any, { message: "End time is required" }); return; }

        const dateV = String(form.getValues("hearing_date") || "").trim();
        const fromV = String(form.getValues("hearing_expected_start_time") || "").trim();
        const toV = String(form.getValues("hearing_expected_end_time") || "").trim();
        if (!dateV || !fromV || !toV) return;

        const toMins = (t: string) => { const [h,m] = t.split(":").map(Number); return (h||0)*60 + (m||0); };
        const sM = toMins(fromV), eM = toMins(toV);
        if (sM < 630 || eM > 1020 || eM <= sM) { toast.error(lang === "hi" ? "कोर्ट समय 10:30 AM – 05:00 PM के बाहर है।" : "Outside court hours (10:30 AM – 05:00 PM)."); return; }

        const dur = Number(form.getValues("hearing_expected_duration") || 0);
        if (dur && Math.abs((eM - sM) - dur) > 1) { toast.error(lang === "hi" ? "अवधि और समय विंडो मेल नहीं खा रहे।" : "Duration does not match time window."); return; }


      }
      setCurrentStep((s) => Math.min(totalSteps, s + 1));
    } finally { setTimeout(() => { isNavigatingRef.current = false; }, 300); }
  };
  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const onSubmit = async (values: HearingFormValues) => {
    if (currentStep !== totalSteps) return;
    const payload: Record<string, any> = {
      hearing_date: values.hearing_date,
      hearing_expected_start_time: values.hearing_expected_start_time.length === 5 ? `${values.hearing_expected_start_time}:00` : values.hearing_expected_start_time,
      hearing_expected_end_time: values.hearing_expected_end_time.length === 5 ? `${values.hearing_expected_end_time}:00` : values.hearing_expected_end_time,
      hearing_expected_duration: values.hearing_expected_duration,
      hearing_type: Number(values.hearing_type),
      hearing_status: Number(values.hearing_status),
      status: getMappedStatus(selectedStatusCode),
      hearing_outcome: isOutcomeAllowed && values.hearing_outcome ? Number(values.hearing_outcome) : null,
      remarks: values.remarks?.trim() || "",
      video_conference: values.video_conference,
      video_conference_link: values.video_conference ? values.video_conference_link?.trim() || "" : "",
    };
    try {
      toast.loading(isEditing ? (lang === "hi" ? "सुनवाई अपडेट की जा रही है..." : "Updating hearing...") : (lang === "hi" ? "सुनवाई निर्धारित की जा रही है..." : "Scheduling hearing..."), { id: "save-h" });
      if (isEditing) await updateMut.mutateAsync({ caseNumber: case_number, pk: hearing.id, payload });
      else await createMut.mutateAsync({ caseNumber: case_number, payload });
      toast.dismiss("save-h");
      toast.success(isEditing ? (lang === "hi" ? "सुनवाई अपडेट हो गई!" : "Hearing updated.") : (lang === "hi" ? "सुनवाई सफलतापूर्वक निर्धारित की गई।" : "Hearing scheduled successfully."));
      onSuccess?.();
      onClose?.();
    } catch (e: any) {
      toast.dismiss("save-h");
      toast.error(e?.message || "Failed to save hearing.");
    }
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
      <Form {...form}>
        <div
          onKeyDown={(e) => { if (e.key === "Enter" && currentStep !== totalSteps) { const tt = e.target as HTMLElement | null; if (tt && tt.tagName === "TEXTAREA") return; e.preventDefault(); } }}
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">{isEditing ? (lang === "hi" ? "सुनवाई विवरण संशोधित करें" : "Edit Hearing Details") : (lang === "hi" ? "नई सुनवाई निर्धारित करें" : "Schedule New Hearing")}</h1>
            </div>
            <div className="shrink-0 h-1 bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-emerald-500 transition-all duration-300 ease-out" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              {currentStep === 1 && (
                <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "शेड्यूल" : "Schedule"}</div>
                  <div className="p-6">
                    <DateTimePickerField
                      control={form.control as any}
                      dateName="hearing_date"
                      timeFromName="hearing_expected_start_time"
                      timeToName="hearing_expected_end_time"
                      durationName="hearing_expected_duration"
                      existingHearings={existingHearings}
                      currentHearingId={hearing?.id}
                      onFindSlot={handleFindSlots}
                      isSearchingSlots={isSearchingSlots}
                      hasFetched={hasFetchedSlots}
                      required
                    />
                  </div>
                </section>
              )}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "सुनवाई का विवरण" : "Hearing Details"}</div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                        <CustomComboboxField control={form.control as any} name="hearing_type" label={lang === "hi" ? "सुनवाई का प्रकार" : "Hearing Type"} placeholder={lang === "hi" ? "प्रकार चुनें" : "Select Type"} required options={hearingTypes.map((x: any) => ({ label: lang === "hi" ? x.name : x.name_en, value: String(x.id) }))} />
                        <CustomComboboxField control={form.control as any} name="hearing_status" label={lang === "hi" ? "सुनवाई स्थिति" : "Hearing Status"} placeholder={lang === "hi" ? "स्थिति चुनें" : "Select Status"} required options={hearingStatuses.map((x: any) => ({ label: lang === "hi" ? x.name : x.name_en, value: String(x.id) }))} />
                        <FormField
                          control={form.control as any}
                          name="video_conference"
                          render={({ field }: any) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20 mt-6 h-[42px]">
                              <FormLabel className="text-xs font-bold">{lang === "hi" ? "वीडियो कांफ्रेंसिंग (VC)" : "Video Conference (VC)"}</FormLabel>
                              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {watchVc && (
                        <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2"><Video className="size-4 text-primary" /><span className="text-xs font-bold">{lang === "hi" ? "VideoSDK वीसी मीटिंग लिंक" : "VideoSDK VC Meeting Link"}</span></div>
                            <Button type="button" variant="outline" size="sm" onClick={handleGenerateVcLink} disabled={generateVcMut.isPending} className="h-8 gap-1.5 text-xs font-semibold"><RefreshCw className={`size-3.5 ${generateVcMut.isPending ? "animate-spin" : ""}`} />{lang === "hi" ? "पुनः जनरेट करें" : "Generate Link"}</Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1"><TextFieldV2 control={form.control as any} name="video_conference_link" placeholder="Generating VideoSDK Link..." containerClassName="w-full" /></div>
                            {watchVcLink && (
                              <Button type="button" variant="secondary" size="sm" onClick={() => { navigator.clipboard.writeText(watchVcLink); setCopied(true); toast.success(lang === "hi" ? "लिंक कॉपी हो गया!" : "Link copied!"); setTimeout(() => setCopied(false), 2000); }} className="h-9 px-3 gap-1 text-xs shrink-0">
                                {copied ? <Check className="size-3.5 text-green-600" /> : <Copy className="size-3.5" />}{copied ? (lang === "hi" ? "कॉपी हुआ" : "Copied") : (lang === "hi" ? "कॉपी" : "Copy")}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                      <TextareaField control={form.control as any} name="remarks" label={lang === "hi" ? "सुनवाई का उद्देश्य / सामान्य रिमार्क्स" : "Hearing Purpose / Remarks"} placeholder={lang === "hi" ? "सुनवाई का उद्देश्य दर्ज करें..." : "Enter hearing purpose notes..."} />
                    </div>
                  </section>

                  {isOutcomeAllowed && (
                    <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                      <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">{lang === "hi" ? "सुनवाई का परिणाम / नतीजा" : "Hearing Outcome"}</div>
                      <div className="p-6">
                        <CustomComboboxField control={form.control as any} name="hearing_outcome" label={lang === "hi" ? "सुनवाई परिणाम चुनें" : "Select Hearing Outcome"} placeholder={lang === "hi" ? "परिणाम चुनें" : "Select Outcome"} options={filteredOutcomes.map((out: any) => ({ label: lang === "hi" ? out.name : out.name_en, value: String(out.id) }))} />
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
              <Button type="button" variant="outline" onClick={onClose} className="px-5">{t("case.notices.cancel") ?? "Cancel"}</Button>
              <div className="flex items-center gap-2">
                {currentStep > 1 && (<Button type="button" variant="outline" onClick={handleBack} className="px-5">Back</Button>)}
                {currentStep < totalSteps ? (<Button type="button" onClick={handleNext} className="px-6 font-semibold">Next</Button>) : (<Button type="button" onClick={handleSubmit as any} disabled={createMut.isPending || updateMut.isPending} className="px-6 font-semibold gap-2">{createMut.isPending || updateMut.isPending ? (lang === "hi" ? "सहेजा जा रहा है..." : "Saving...") : (<><Save className="w-4 h-4" />{isEditing ? (lang === "hi" ? "अपडेट करें" : "Update") : (lang === "hi" ? "सहेजें" : "Save")}</>)}</Button>)}
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}
