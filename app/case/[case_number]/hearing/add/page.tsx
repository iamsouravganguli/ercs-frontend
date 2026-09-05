"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Video,
  RefreshCw,
  Copy,
  Check,
  Save,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RichTextField } from "@/components/ui/richtext-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { DateTimePickerField } from "@/components/ui/date-time-picker-field";
import { cn } from "@/lib/cn";

import {
  useCaseHearingCreate,
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
  hearing_expected_duration: z.number().min(5),
  hearing_type: z.string().min(1, "Hearing type is required"),
  hearing_status: z.string().min(1, "Hearing status is required"),
  hearing_outcome: z.string().optional(),
  remarks: z.string().optional(),
  video_conference: z.boolean(),
  video_conference_link: z.string().optional(),
});

type HearingFormValues = z.infer<typeof hearingSchema>;

export default function AddHearingPopupPage() {
  const params = useParams();
  const case_number = params?.case_number as string;
  const router = useRouter();
  const { lang } = useTranslation();

  const form = useForm<HearingFormValues>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      hearing_date: "",
      hearing_expected_start_time: "",
      hearing_expected_end_time: "",
      hearing_expected_duration: 60,
      hearing_type: "",
      hearing_status: "",
      hearing_outcome: "",
      remarks: "",
      video_conference: false,
      video_conference_link: "",
    },
  });


  const watchDateForSlots = form.watch("hearing_date");
  const {
    data: hearingsRes,
    refetch: refetchHearings,
    isFetching: isSearchingSlots,
    isFetched: hasFetchedSlots,
  } = useCourtHearingsList(
    watchDateForSlots ? { date: watchDateForSlots } : undefined,
    { enabled: false },
  );
  const existingHearings = hasFetchedSlots ? (hearingsRes?.result?.data || []) : [];
  const handleFindSlotsAdd = useCallback(async () => {
    if (!String(watchDateForSlots || "").trim()) {
      toast.error(lang === "hi" ? "पहले तारीख चुनें।" : "Select a date first.");
      return;
    }
    await refetchHearings();
  }, [watchDateForSlots, refetchHearings, lang]);

  const { data: typesRes } = useHearingTypeList({ limit: 100 });
  const hearingTypes = typesRes?.result?.data || [];

  const { data: statusesRes } = useHearingStatusList({ limit: 100 });
  const hearingStatuses = statusesRes?.result?.data || [];

  const { data: outcomesRes } = useHearingOutcomeList({ limit: 100 });
  const hearingOutcomes = outcomesRes?.result?.data || [];

  const createHearingMutation = useCaseHearingCreate();
  const generateVcMutation = useGenerateVideoMeeting();
  const [copied, setCopied] = useState(false);

  const watchVc = form.watch("video_conference");
  const watchVcLink = form.watch("video_conference_link");
  const watchDate = form.watch("hearing_date");
  const watchTime = form.watch("hearing_expected_start_time");
  const watchEndTime = form.watch("hearing_expected_end_time");

  const handleGenerateVcLink = async () => {
    try {
      toast.loading(
        lang === "hi"
          ? "वीडियो मीटिंग लिंक जनरेट किया जा रहा है..."
          : "Generating VideoSDK meeting link...",
        { id: "vc-gen" },
      );
      const res = await generateVcMutation.mutateAsync();
      toast.dismiss("vc-gen");
      const meetingLink =
        res?.result?.data?.meeting_link ||
        (res as any)?.data?.meeting_link ||
        (res as any)?.meeting_link;
      if (meetingLink) {
        form.setValue("video_conference_link", meetingLink);
        toast.success(
          lang === "hi"
            ? "वीडियो मीटिंग लिंक जनरेट हो गया!"
            : "VideoSDK meeting link generated!",
        );
      } else {
        toast.error("Could not retrieve meeting link from response");
      }
    } catch (err: any) {
      toast.dismiss("vc-gen");
      toast.error(err?.message || "Failed to generate meeting link");
    }
  };

  useEffect(() => {
    if (watchVc && !watchVcLink && !generateVcMutation.isPending) {
      handleGenerateVcLink();
    }
  }, [watchVc]);
  const selectedStatusId = form.watch("hearing_status");
  const selectedStatusObj = hearingStatuses.find(
    (s: any) => String(s.id) === String(selectedStatusId),
  );
  const selectedStatusCode = selectedStatusObj?.code || "";

  const isOutcomeAllowed =
    selectedStatusCode !== "" &&
    !["SCHEDULED", "IN_PROGRESS"].includes(selectedStatusCode);

  const filteredOutcomes = hearingOutcomes.filter((out: any) =>
    (out.allowed_statuses || "")
      .split(",")
      .map((s: string) => s.trim())
      .includes(selectedStatusCode),
  );

  useEffect(() => {
    form.setValue("hearing_outcome", "");
  }, [selectedStatusCode, form]);

  const getMappedStatus = (statusCode: string): string => {
    if (["COMPLETED", "CLOSED"].includes(statusCode)) return "COMPLETED";
    if (["ADJOURNED", "STAYED", "RESERVED_FOR_ORDER"].includes(statusCode))
      return "ADJOURNED";
    if (["CANCELLED"].includes(statusCode)) return "CANCELLED";
    return "SCHEDULED";
  };

  const onSubmit = async (values: HearingFormValues) => {
    try {
      toast.loading(
        lang === "hi"
          ? "सुनवाई निर्धारित की जा रही है..."
          : "Scheduling hearing...",
        { id: "save-h" },
      );

      const payload = {
        hearing_date: values.hearing_date,
        hearing_expected_start_time:
          values.hearing_expected_start_time.length === 5
            ? `${values.hearing_expected_start_time}:00`
            : values.hearing_expected_start_time,
        hearing_expected_end_time:
          values.hearing_expected_end_time.length === 5
            ? `${values.hearing_expected_end_time}:00`
            : values.hearing_expected_end_time,
        hearing_expected_duration: values.hearing_expected_duration,
        hearing_type: Number(values.hearing_type),
        hearing_status: Number(values.hearing_status),
        status: getMappedStatus(selectedStatusCode),
        hearing_outcome:
          isOutcomeAllowed && values.hearing_outcome
            ? Number(values.hearing_outcome)
            : null,
        remarks: values.remarks?.trim() || "",
        video_conference: values.video_conference,
        video_conference_link: values.video_conference
          ? values.video_conference_link?.trim() || ""
          : "",
      };

      await createHearingMutation.mutateAsync({
        caseNumber: case_number,
        payload,
      });

      toast.dismiss("save-h");
      toast.success(
        lang === "hi"
          ? "सुनवाई सफलतापूर्वक निर्धारित की गई।"
          : "Hearing scheduled successfully.",
      );


      if (window.opener) {
        window.opener.postMessage("refetch-hearings", window.location.origin);
        window.opener.postMessage("refetch-hearings", "*");
      }

      window.close();
    } catch (err: any) {
      toast.dismiss("save-h");
      toast.error(err?.message || "Failed to schedule hearing.");
    }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          id="add-hearing-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 overflow-hidden h-full"
        >
          {}
          <div className="flex flex-1 flex-col bg-background dark:bg-neutral-950 border-r overflow-hidden">
            {}
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0 text-left">
              <h1 className="text-lg font-semibold tracking-tight">
                {lang === "hi"
                  ? "नई सुनवाई निर्धारित करें"
                  : "Schedule New Hearing"}
              </h1>
            </div>

            {}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar text-left">
              <div className="space-y-6">
                {}
                <DateTimePickerField
                  control={form.control}
                  dateName="hearing_date"
                  timeFromName="hearing_expected_start_time"
                  timeToName="hearing_expected_end_time"
                  durationName="hearing_expected_duration"
                  existingHearings={existingHearings}
                  onFindSlot={handleFindSlotsAdd}
                  isSearchingSlots={isSearchingSlots}
                  hasFetched={hasFetchedSlots}
                  required
                />

                {}
                <section className="bg-card border rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                    {lang === "hi" ? "सुनवाई का विवरण" : "Hearing Details"}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                      {}
                      <AutocompleteField
                        control={form.control}
                        name="hearing_type"
                        label={
                          lang === "hi" ? "सुनवाई का प्रकार" : "Hearing Type"
                        }
                        placeholder="Select Type"
                        required
                        options={hearingTypes.map((type: any) => ({
                          label: lang === "hi" ? type.name : type.name_en,
                          value: String(type.id),
                        }))}
                      />

                      {}
                      <AutocompleteField
                        control={form.control}
                        name="hearing_status"
                        label={
                          lang === "hi" ? "सुनवाई स्थिति" : "Hearing Status"
                        }
                        placeholder="Select Status"
                        required
                        options={hearingStatuses.map((st: any) => ({
                          label: lang === "hi" ? st.name : st.name_en,
                          value: String(st.id),
                        }))}
                      />

                      {}
                      <FormField
                        control={form.control}
                        name="video_conference"
                        render={({ field }: { field: any }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20 mt-6 h-[42px]">
                            <div className="space-y-0.5">
                              <FormLabel className="text-xs font-bold">
                                {lang === "hi"
                                  ? "वीडियो कांफ्रेंसिंग (VC)"
                                  : "Video Conference (VC)"}
                              </FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    {}
                    {watchVc && (
                      <div className="p-4 rounded-xl border bg-muted/30 dark:bg-muted/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="size-4 text-primary" />
                            <span className="text-xs font-bold text-foreground">
                              {lang === "hi"
                                ? "VideoSDK वीसी मीटिंग लिंक"
                                : "VideoSDK VC Meeting Link"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateVcLink}
                            disabled={generateVcMutation.isPending}
                            className="h-8 gap-1.5 text-xs font-semibold"
                          >
                            <RefreshCw
                              className={`size-3.5 ${generateVcMutation.isPending ? "animate-spin" : ""}`}
                            />
                            {lang === "hi"
                              ? "पुनः जनरेट करें"
                              : "Generate Link"}
                          </Button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <TextFieldV2
                              control={form.control}
                              name="video_conference_link"
                              placeholder="Generating VideoSDK Link..."
                              containerClassName="w-full"
                            />
                          </div>
                          {watchVcLink && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(watchVcLink);
                                setCopied(true);
                                toast.success(
                                  lang === "hi"
                                    ? "लिंक कॉपी हो गया!"
                                    : "Link copied!",
                                );
                                setTimeout(() => setCopied(false), 2000);
                              }}
                              className="h-9 px-3 gap-1 text-xs shrink-0"
                            >
                              {copied ? (
                                <Check className="size-3.5 text-green-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                              {copied
                                ? lang === "hi"
                                  ? "कॉपी हुआ"
                                  : "Copied"
                                : lang === "hi"
                                  ? "कॉपी"
                                  : "Copy"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {}
                    <TextareaField
                      control={form.control}
                      name="remarks"
                      label={
                        lang === "hi"
                          ? "सुनवाई का उद्देश्य / सामान्य रिमार्क्स"
                          : "Hearing Purpose / Remarks"
                      }
                      placeholder="Enter hearing purpose notes..."
                      containerClassName="w-full"
                    />
                  </div>
                </section>

                {}
                {isOutcomeAllowed && (
                  <section className="bg-card border rounded-xl overflow-hidden">
                    <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                      {lang === "hi"
                        ? "सुनवाई का परिणाम / नतीजा"
                        : "Hearing Outcome"}
                    </div>
                    <div className="p-6">
                      <AutocompleteField
                        control={form.control}
                        name="hearing_outcome"
                        label={
                          lang === "hi"
                            ? "सुनवाई परिणाम चुनें"
                            : "Select Hearing Outcome"
                        }
                        placeholder="Select Outcome"
                        required
                        options={filteredOutcomes.map((out: any) => ({
                          label: lang === "hi" ? out.name : out.name_en,
                          value: String(out.id),
                        }))}
                      />
                    </div>
                  </section>
                )}
              </div>
            </div>

            {}
            <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={handleClose}
                >
                  {lang === "hi" ? "निरस्त" : "Cancel"}
                </Button>
                <Button type="submit" className="px-6">
                  <Save className="w-4 h-4 mr-2" />{" "}
                  {lang === "hi" ? "सुनवाई सहेजें" : "Save Hearing"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
