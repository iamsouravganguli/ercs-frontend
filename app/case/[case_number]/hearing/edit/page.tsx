"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  useCaseHearingDetail,
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
  hearing_expected_duration: z.number().min(5),
  hearing_type: z.string().min(1, "Hearing type is required"),
  hearing_status: z.string().min(1, "Hearing status is required"),
  hearing_outcome: z.string().optional(),
  remarks: z.string().optional(),
  video_conference: z.boolean(),
  video_conference_link: z.string().optional(),
});

type HearingFormValues = z.infer<typeof hearingSchema>;

export default function EditHearingPopupPage() {
  const params = useParams();
  const case_number = params?.case_number as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const { lang } = useTranslation();

  const form = useForm<HearingFormValues>({
    resolver: zodResolver(hearingSchema),
    defaultValues: {
      hearing_date: "",
      hearing_expected_start_time: "10:30",
      hearing_expected_end_time: "11:30",
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
  const handleFindSlotsEdit = useCallback(async () => {
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

  const { data: detailRes, isLoading: isDetailLoading } = useCaseHearingDetail(
    case_number,
    id,
    { enabled: !!id },
  );

  const updateHearingMutation = useCaseHearingUpdate();
  const generateVcMutation = useGenerateVideoMeeting();
  const [copied, setCopied] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);


  useEffect(() => {
    if (detailRes?.result?.data) {
      const data = detailRes.result.data;
      form.reset({
        hearing_date: data.hearing_date || "",
        hearing_expected_start_time: data.hearing_expected_start_time
          ? String(data.hearing_expected_start_time).substring(0, 5)
          : "10:30",
        hearing_expected_end_time: data.hearing_expected_end_time
          ? String(data.hearing_expected_end_time).substring(0, 5)
          : "11:30",
        hearing_expected_duration: data.hearing_expected_duration || 60,
        hearing_type: data.hearing_type ? String(data.hearing_type) : "",
        hearing_status: data.hearing_status ? String(data.hearing_status) : "",
        hearing_outcome: data.hearing_outcome
          ? String(data.hearing_outcome)
          : "",
        remarks: data.remarks || "",
        video_conference: Boolean(data.video_conference),
        video_conference_link: data.video_conference_link || "",
      });
      setIsInitialized(true);
    }
  }, [detailRes, form]);

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

  const handleCopyLink = () => {
    if (watchVcLink) {
      navigator.clipboard.writeText(watchVcLink);
      setCopied(true);
      toast.success(
        lang === "hi" ? "लिंक कॉपी हो गया!" : "Copied to clipboard!",
      );
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onSubmit = async (values: HearingFormValues) => {
    try {
      toast.loading(
        lang === "hi"
          ? "सुनवाई अपडेट की जा रही है..."
          : "Updating hearing schedule...",
        { id: "edit-hearing" },
      );

      const payload = {
        hearing_date: values.hearing_date,
        hearing_expected_start_time: values.hearing_expected_start_time,
        hearing_expected_end_time: values.hearing_expected_end_time,
        hearing_expected_duration: values.hearing_expected_duration,
        hearing_type: values.hearing_type,
        hearing_status: values.hearing_status,
        hearing_outcome: values.hearing_outcome || null,
        remarks: values.remarks || "",
        video_conference: values.video_conference,
        video_conference_link: values.video_conference
          ? values.video_conference_link
          : "",
      };

      await updateHearingMutation.mutateAsync({
        caseNumber: case_number,
        pk: id,
        payload,
      });

      toast.success(
        lang === "hi"
          ? "सुनवाई अपडेट हो गई!"
          : "Hearing schedule updated successfully!",
        { id: "edit-hearing" },
      );
      router.back();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update hearing", {
        id: "edit-hearing",
      });
    }
  };

  if (isDetailLoading || !isInitialized) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
      <div className="bg-background border rounded-2xl w-full max-w-[850px] max-h-[85vh] flex flex-col shadow-2xl relative">
        {}
        <button
          onClick={() => router.back()}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-30 size-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <X className="size-5" />
        </button>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full overflow-hidden"
          >
            {}
            <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0 text-left">
              <h1 className="text-lg font-semibold tracking-tight">
                {lang === "hi"
                  ? "सुनवाई विवरण संशोधित करें"
                  : "Edit Hearing Details"}
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
                  currentHearingId={id}
                  onFindSlot={handleFindSlotsEdit}
                  isSearchingSlots={isSearchingSlots}
                  hasFetched={hasFetchedSlots}
                  required
                />

                {}
                <section className="bg-card border rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                    {lang === "hi"
                      ? "सुनवाई विवरण एवं मापदंड"
                      : "Hearing Parameters"}
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
                      <AutocompleteField
                        control={form.control}
                        name="hearing_outcome"
                        label={
                          lang === "hi" ? "सुनवाई परिणाम" : "Hearing Outcome"
                        }
                        placeholder="Select Outcome"
                        options={hearingOutcomes.map((ot: any) => ({
                          label: lang === "hi" ? ot.name : ot.name_en,
                          value: String(ot.id),
                        }))}
                      />
                    </div>

                    {}
                    <RichTextField
                      control={form.control}
                      name="remarks"
                      label={
                        lang === "hi"
                          ? "अधिवक्ता टिप्पणी / आदेश सारांश"
                          : "Advocate Remarks / Order Summary"
                      }
                      placeholder="Enter details..."
                    />
                  </div>
                </section>

                {}
                <section className="bg-card border rounded-xl overflow-hidden">
                  <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground flex items-center justify-between">
                    <span>
                      {lang === "hi"
                        ? "वीडियो कांफ्रेंसिंग (VC) समन"
                        : "Video Summons Settings"}
                    </span>
                    <FormField
                      control={form.control}
                      name="video_conference"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  {watchVc && (
                    <div className="p-6 space-y-4 border-t bg-muted/10">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                        <div className="flex-1">
                          <TextFieldV2
                            control={form.control}
                            name="video_conference_link"
                            label={
                              lang === "hi"
                                ? "वीडियो मीटिंग यूआरएल (Video SDK)"
                                : "Video SDKSummons Room URL"
                            }
                            placeholder="https://meet.jit.si/..."
                            readOnly
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleGenerateVcLink}
                            className="gap-2 h-9 text-xs font-semibold"
                          >
                            <RefreshCw className="size-3.5" />
                            <span>
                              {lang === "hi"
                                ? "नया लिंक बनाएं"
                                : "Regenerate Jitsi Summons Room"}
                            </span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCopyLink}
                            disabled={!watchVcLink}
                            className="gap-2 h-9 text-xs font-semibold"
                          >
                            {copied ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            <span>
                              {copied
                                ? lang === "hi"
                                  ? "कॉपी हो गया!"
                                  : "Copied!"
                                : lang === "hi"
                                  ? "कॉपी करें"
                                  : "Copy Link"}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {}
            <div className="sticky bottom-0 z-20 flex items-center justify-end gap-3 h-14 px-6 border-t bg-white dark:bg-neutral-950 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-9 text-xs font-semibold"
              >
                Cancel (रद्द करें)
              </Button>
              <Button type="submit" className="gap-2 h-9 text-xs font-bold">
                <Save className="size-3.5" />
                <span>Save Changes (सहेजें)</span>
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
