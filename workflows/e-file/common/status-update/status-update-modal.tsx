"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { Form } from "@/components/ui/form";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useTranslation } from "@/i18n";
import { useCaseDetail, useCaseStats, useCaseTransition } from "@/lib";

const StatusUpdateSchema = z.object({
  stage: z.string().min(1, "Stage is required"),
  status: z.string().min(1, "Status is required"),
  remarks: z.string().optional(),
});
type StatusUpdateFormValues = z.infer<typeof StatusUpdateSchema>;

export type StatusUpdateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  onSuccess?: () => void;
};

export function StatusUpdateModal({
  open,
  onOpenChange,
  caseId,
  onSuccess,
}: StatusUpdateModalProps) {
  const { t, lang } = useTranslation();
  const isHindi = lang === "hi";

  const caseDetailQuery = useCaseDetail(caseId);
  const caseDetail: any = caseDetailQuery.data?.result?.data;
  const stagesQuery = useCaseStats();
  const stages: any[] = stagesQuery.data?.result?.data?.stages || [];
  const transitionMutation = useCaseTransition(caseId);

  const [errorMsg, setErrorMsg] = useState("");

  const { allowedStages, defaultStage, defaultStatus } = useMemo(() => {
    if (!caseDetail || stages.length === 0) {
      return {
        allowedStages: ["FILING"] as string[],
        defaultStage: "FILING",
        defaultStatus: "DRAFT",
      };
    }
    const curStageCode =
      caseDetail.current_stage_detail?.code ||
      (caseDetail as any).current_stage ||
      "FILING";
    const curStatusCode =
      caseDetail.current_status_detail?.code ||
      (caseDetail as any).current_status ||
      "DRAFT";
    const dynamicStageOrder = stages.map((s: any) => s.code);
    const curIndex = dynamicStageOrder.indexOf(curStageCode);
    if (curIndex === -1) {
      return {
        allowedStages: [curStageCode],
        defaultStage: curStageCode,
        defaultStatus: curStatusCode,
      };
    }
    const currentStageObj = stages.find((s: any) => s.code === curStageCode);
    const advancingStatusObj = currentStageObj?.statuses?.find(
      (st: any) => st.is_advancing,
    );
    const advancingStatusCode = advancingStatusObj?.code || "";
    const isCompleted = curStatusCode === advancingStatusCode;
    if (isCompleted) {
      const nextIndex = curIndex + 1;
      const nextStageCode =
        nextIndex < dynamicStageOrder.length
          ? dynamicStageOrder[nextIndex]
          : curStageCode;
      const nextStageObj = stages.find((s: any) => s.code === nextStageCode);
      const defaultNextStatus = nextStageObj?.statuses?.[0]?.code || "";
      return {
        allowedStages: [nextStageCode],
        defaultStage: nextStageCode,
        defaultStatus: defaultNextStatus,
      };
    }
    return {
      allowedStages: [curStageCode],
      defaultStage: curStageCode,
      defaultStatus: curStatusCode,
    };
  }, [caseDetail, stages]);

  const form = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(StatusUpdateSchema),
    defaultValues: { stage: "", status: "", remarks: "" },
    mode: "onChange",
  });
  const watchStage = form.watch("stage");

  useEffect(() => {
    if (!open) return;
    if (caseDetail && stages.length > 0) {
      form.reset({
        stage: defaultStage,
        status: defaultStatus,
        remarks: "",
      });
      setErrorMsg("");
    }
  }, [open, caseDetail, defaultStage, defaultStatus, stages, form]);

  useEffect(() => {
    if (!open) return;
    if (watchStage && stages.length > 0) {
      const activeStage = stages.find((s: any) => s.code === watchStage);
      const activeStatuses: any[] = activeStage?.statuses || [];
      const currentStatus = form.getValues("status");
      const isValid = activeStatuses.some((st: any) => st.code === currentStatus);
      if (!isValid && activeStatuses.length > 0) {
        form.setValue("status", activeStatuses[0].code);
      }
    }
  }, [watchStage, stages, form, open]);

  const handleClose = () => {
    setErrorMsg("");
    onOpenChange(false);
  };

  const onSubmit = (data: StatusUpdateFormValues) => {
    setErrorMsg("");
    transitionMutation.mutate(
      { stage: data.stage, status: data.status, remarks: data.remarks || "" },
      {
        onSuccess: () => {
          toast.success(
            isHindi ? "स्थिति सफलतापूर्वक अपडेट हुई" : "Status updated successfully",
          );
          onOpenChange(false);
          setErrorMsg("");
          form.reset({ stage: "", status: "", remarks: "" });
          onSuccess?.();
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            (isHindi ? "ट्रांज़िशन विफल" : "Failed to transition case");
          setErrorMsg(String(msg));
          toast.error(String(msg));
        },
      },
    );
  };

  const isLoading = caseDetailQuery.isLoading || stagesQuery.isLoading;

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="w-full max-w-225 h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
    >
      <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden relative">
          <Form {...form}>
            <div
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  (e.target as HTMLElement)?.tagName !== "TEXTAREA"
                ) {
                  e.preventDefault();
                }
              }}
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
            >
              <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900/50 overflow-hidden">
                {}
                <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-white dark:bg-zinc-900 shrink-0">
                  <h1 className="text-lg font-semibold tracking-tight">
                    {isHindi ? "मामले की स्थिति बदलें" : "Update Case Status"}
                  </h1>
                </div>

                {}
                <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
                  {isLoading ? (
                    <div className="space-y-6">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden animate-pulse"
                        >
                          <div className="h-10 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800" />
                          <div className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                <div className="h-9 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {errorMsg && (
                        <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <section className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                        <div className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                          {isHindi ? "स्थिति विन्यास" : "Status Configuration"}
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="grid md:grid-cols-2 gap-4 items-start">
                            <CustomComboboxField
                              control={form.control as any}
                              name="stage"
                              label={isHindi ? "मामले का चरण" : "Case Stage"}
                              placeholder={isHindi ? "चरण चुनें" : "Select Stage"}
                              required
                              readOnly
                              options={stages
                                .filter((s: any) => allowedStages.includes(s.code))
                                .map((s: any) => ({
                                  label: isHindi
                                    ? s.name || s.name_en
                                    : s.name_en || s.name,
                                  value: s.code,
                                }))}
                            />
                            <CustomComboboxField
                              control={form.control as any}
                              name="status"
                              label={isHindi ? "मामले की स्थिति" : "Case Status"}
                              placeholder={isHindi ? "स्थिति चुनें" : "Select Status"}
                              required
                              options={(() => {
                                const activeStage = stages.find(
                                  (s: any) => s.code === watchStage,
                                );
                                return (activeStage?.statuses || []).map((st: any) => ({
                                  label: isHindi
                                    ? st.name || st.name_en
                                    : st.name_en || st.name,
                                  value: st.code,
                                }));
                              })()}
                            />
                          </div>

                          <TextareaField
                            control={form.control as any}
                            name="remarks"
                            label={isHindi ? "टिप्पणियां" : "Remarks / Comments"}
                            placeholder={
                              isHindi ? "टिप्पणियां दर्ज करें..." : "Enter transition remarks..."
                            }
                            rows={4}
                            containerClassName="w-full"
                            className="w-full"
                          />
                        </div>
                      </section>
                    </div>
                  )}
                </div>

                {}
                <div className="flex items-center justify-between border-t bg-white dark:bg-zinc-900 px-6 py-3 z-10 shrink-0">
                  <Button
                    variant="outline"
                    type="button"
                    className="px-5"
                    onClick={handleClose}
                    disabled={transitionMutation.isPending}
                  >
                    {isHindi ? "रद्द करें" : "Cancel"}
                  </Button>
                  <Button
                    type="button"
                    className="px-6"
                    disabled={transitionMutation.isPending || isLoading}
                    onClick={form.handleSubmit(onSubmit) as any}
                  >
                    {transitionMutation.isPending
                      ? isHindi
                        ? "अद्यतन किया जा रहा है..."
                        : "Updating..."
                      : isHindi
                        ? "सहेजें"
                        : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </div>
      </CustomModalBody>
    </CustomModal>
  );
}

export default StatusUpdateModal;
