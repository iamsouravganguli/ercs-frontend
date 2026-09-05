"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalBody,
} from "@/components/ui/custom-modal";
import { useTranslation } from "@/i18n";
import {
  useCaseDetail,
  CommonsApiServices,
  CourtDetailWriteRequest,
  getLabel,
  useCourtLevelList,
  useCourtNatureByCourtLevelList,
  useAppealTypeList,
  useStates,
  useMandal,
  useDistrict,
  useTehsil,
  useCourtList,
  getCourtUIConfig,
  useCourtActMappingList,
  useCourtActWiseSectionMappingList,
  useProfileDetail,
} from "@/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { RichTextField } from "@/components/ui/richtext-field";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CourtDetailSchema } from "./validations";

export function OverviewEditButton() {
  const { caseId } = useParams<{ caseId: string }>();
  const { t, lang } = useTranslation();
  const detail = useCaseDetail(caseId as string);
  const apiData = detail.data?.result?.data;
  const [open, setOpen] = useState(false);


  const { data: profileData } = useProfileDetail();
  const role =
    (profileData as any)?.role ||
    (profileData as any)?.user?.role ||
    (profileData as any)?.data?.role ||
    "";
  const roleUpper = String(role || "").toUpperCase();
  const isCitizenAdvocate = [
    "CT",
    "CT",
    "CIT",
    "AD",
    "AD",
    "ADV",
    "LAWYER",
  ].includes(roleUpper);
  const isViewOnly = ["SA", "RI", "RSI"].includes(roleUpper);
  if (isCitizenAdvocate || isViewOnly) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-7 px-3 text-xs font-medium bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800 shrink-0"
      >
        <Pencil className="w-3.5 h-3.5 mr-1.5" />
        {t("case.details.edit_btn") ?? "Edit"}
      </Button>
      <CustomModal
        open={open}
        onOpenChange={setOpen}
        className="w-full max-w-[900px] h-[90vh] max-sm:max-w-none max-sm:w-screen max-sm:h-screen max-sm:max-h-none max-sm:rounded-none max-sm:border-0 p-0 overflow-hidden"
      >
        <CustomModalBody className="p-0 h-full overflow-hidden max-sm:rounded-none">
          <OverviewEditForm
            caseId={caseId as string}
            onClose={() => setOpen(false)}
            onSuccess={() => {
              detail.refetch();
              setOpen(false);
            }}
          />
        </CustomModalBody>
      </CustomModal>
    </>
  );
}

function OverviewEditForm({
  caseId,
  onClose,
  onSuccess,
}: {
  caseId: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { t, lang } = useTranslation();
  const detail = useCaseDetail(caseId);
  const apiData = detail.data?.result?.data;

  type LocalForm = CourtDetailWriteRequest & { description?: string };
  const formValues = useMemo(() => {
    if (apiData) {
      return {
        court_level: apiData.court_level?.id ?? null,
        case_nature: apiData.case_nature?.id ?? null,
        appeal_type: apiData.appeal_type?.id ?? null,
        court: apiData.court?.id ?? null,
        act: apiData.act?.id ?? null,
        section: apiData.section?.id ?? null,
        state_code_census: "05",
        state_name: "उत्तराखण्ड",
        mandal_code: apiData.mandal_code ?? null,
        mandal_name: apiData.mandal_name ?? null,
        district_code_census: apiData.district_code_census ?? null,
        district_name: apiData.district_name ?? null,
        tehsil_code_census: apiData.tehsil_code_census ?? null,
        tehsil_name: apiData.tehsil_name ?? null,
        tehsil_name_en: apiData.tehsil_name_en ?? null,
        description: apiData.description ?? "",
      };
    }
    return {
      court_level: null,
      case_nature: null,
      appeal_type: null,
      court: null,
      act: null,
      section: null,
      state_code_census: "05",
      state_name: "उत्तराखण्ड",
      mandal_code: null,
      mandal_name: null,
      district_code_census: null,
      district_name: null,
      tehsil_code_census: null,
      tehsil_name: null,
      tehsil_name_en: null,
      description: "",
    };
  }, [apiData]);

  const form = useForm<LocalForm>({
    resolver: zodResolver(CourtDetailSchema) as any,
    values: formValues,
    mode: "onChange",
  });

  const watchCourtLevel = form.watch("court_level");
  const watchCaseNature = form.watch("case_nature");
  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchCourt = form.watch("court");
  const watchAct = form.watch("act");

  const courtLevel = useCourtLevelList();
  const courtNatureByCourtLevelList = useCourtNatureByCourtLevelList(
    { "filters[court_level]": watchCourtLevel },
    { enabled: !!watchCourtLevel },
  );
  const appealTypeList = useAppealTypeList();
  const stateList = useStates();
  const mandalList = useMandal();
  const districtList = useDistrict(watchMandal as string);
  const tehsilList = useTehsil(watchDistrict as string);
  const courtList = useCourtList(
    { "filters[level]": watchCourtLevel },
    { enabled: !!watchCourtLevel },
  );
  const courtActMappingList = useCourtActMappingList(
    { "filters[court]": watchCourt },
    { enabled: !!watchCourt },
  );
  const courtAndActWiseSectionList = useCourtActWiseSectionMappingList(
    { "filters[court]": watchCourt, "filters[act]": watchAct },
    { enabled: !!watchCourt && !!watchAct },
  );

  const selectedCourtLevel = useMemo(
    () => courtLevel.data?.result?.data?.find((c) => c.id === watchCourtLevel),
    [courtLevel.data?.result?.data, watchCourtLevel],
  );
  const uiConfig = useMemo(
    () => getCourtUIConfig({ courtLevel: selectedCourtLevel?.code }),
    [selectedCourtLevel?.code],
  );

  useEffect(() => {
    if (watchCaseNature !== 3) form.setValue("appeal_type", null);
  }, [watchCaseNature]);
  useEffect(() => {
    if (watchCourtLevel) {
      courtList.refetch();
      courtAndActWiseSectionList.refetch();
    }
  }, [watchCourtLevel]);
  useEffect(() => {
    form.resetField("act");
    form.resetField("section");
  }, [watchCourt]);

  const mutation = useMutation({
    mutationFn: async (data: CourtDetailWriteRequest) =>
      CommonsApiServices.CaseDetailWriteService(data, caseId),
    onSuccess: () => {
      toast.success(t("case.details.save_btn") + " ✓");
      detail.refetch();
      onSuccess?.();
    },
    onError: (err: any) => toast.error(err?.message || "Failed"),
  });

  const onSubmit = (data: LocalForm) =>
    mutation.mutate(data as CourtDetailWriteRequest);

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as any)}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          <div className="flex flex-1 flex-col bg-card overflow-hidden">
            <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-card shrink-0">
              <h1 className="text-lg font-semibold tracking-tight">
                {t("case.details.title") ?? "Case Details"}
              </h1>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar space-y-6">
              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                  {t("case.details.jurisdiction")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomComboboxField
                      control={form.control}
                      name="court_level"
                      label={t("case.details.court_level")}
                      placeholder={t("case.details.select_court_level")}
                      required
                      options={
                        courtLevel.data?.result?.data
                          ?.sort((a, b) => a.display_order - b.display_order)
                          .map((item: any) => ({
                            label: `${getLabel(item, lang)}`,
                            value: item.id,
                          })) ?? []
                      }
                    />
                    {uiConfig.showCaseNature && (
                      <CustomComboboxField
                        control={form.control}
                        name="case_nature"
                        label={t("case.details.case_nature")}
                        placeholder={t("case.details.select_case_nature")}
                        required
                        loading={courtNatureByCourtLevelList.isLoading}
                        options={
                          courtNatureByCourtLevelList?.data?.result?.data?.map(
                            (item: any) => ({
                              label: getLabel(item.case_nature, lang),
                              value: item.case_nature.id,
                            }),
                          ) ?? []
                        }
                      />
                    )}
                  </div>
                  {watchCaseNature === 3 && (
                    <CustomComboboxField
                      control={form.control}
                      name="appeal_type"
                      label={t("case.details.appeal_type")}
                      placeholder={t("case.details.select_appeal_type")}
                      loading={appealTypeList.isLoading}
                      options={
                        appealTypeList.data?.result?.data?.map((item: any) => ({
                          label: getLabel(item, lang),
                          value: item.id,
                        })) ?? []
                      }
                    />
                  )}
                </div>
              </section>

              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                  {t("case.details.admin_area")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomComboboxField
                      control={form.control}
                      name="state_code_census"
                      label={t("case.details.state")}
                      placeholder={t("case.details.select_state")}
                      readOnly
                      required
                      loading={stateList.isLoading}
                      options={
                        stateList?.data?.map((item: any) => ({
                          label: item.state_name,
                          value: item.state_code_census,
                        })) ?? []
                      }
                    />
                    {uiConfig.showMandal && (
                      <CustomComboboxField
                        control={form.control}
                        name="mandal_code"
                        label={t("case.details.mandal")}
                        placeholder={t("case.details.select_mandal")}
                        loading={mandalList.isLoading}
                        options={
                          mandalList?.data?.map((item: any) => ({
                            label: item.mandal_name,
                            value: item.mandal_code,
                          })) ?? []
                        }
                        onSelect={(val) => {
                          const opt = mandalList?.data?.find(
                            (x: any) => String(x.mandal_code) === String(val),
                          );
                          form.setValue(
                            "mandal_name",
                            (opt as any)?.mandal_name || null,
                          );
                        }}
                      />
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {uiConfig.showDistrict && (
                      <CustomComboboxField
                        control={form.control}
                        name="district_code_census"
                        label={t("case.details.district")}
                        placeholder={t("case.details.select_district")}
                        loading={districtList.isLoading}
                        disabled={!watchMandal}
                        options={
                          districtList?.data?.map((item: any) => ({
                            label: item.district_name,
                            value: item.district_code_census,
                          })) ?? []
                        }
                        onSelect={(val) => {
                          const opt = districtList?.data?.find(
                            (x: any) =>
                              String(x.district_code_census) === String(val),
                          );
                          form.setValue(
                            "district_name",
                            (opt as any)?.district_name || null,
                          );
                        }}
                      />
                    )}
                    {uiConfig.showTehsil && (
                      <CustomComboboxField
                        control={form.control}
                        name="tehsil_code_census"
                        label={t("case.details.tehsil")}
                        placeholder={t("case.details.select_tehsil")}
                        disabled={!watchDistrict}
                        loading={tehsilList.isLoading}
                        options={
                          tehsilList?.data?.map((item: any) => ({
                            label: getLabel(item, "hi"),
                            value: item.tehsil_code_census,
                          })) ?? []
                        }
                        onSelect={(val) => {
                          const opt = tehsilList?.data?.find(
                            (x: any) =>
                              String(x.tehsil_code_census) === String(val),
                          );
                          form.setValue(
                            "tehsil_name",
                            (opt as any)?.tehsil_name || null,
                          );
                          form.setValue(
                            "tehsil_name_en",
                            (opt as any)?.tehsil_name_en || null,
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-sm font-semibold text-foreground">
                  {t("case.details.court_legal_details")}
                </div>
                <div className="p-6 space-y-4">
                  <CustomComboboxField
                    control={form.control}
                    name="court"
                    label={t("case.details.court")}
                    placeholder={t("case.details.select_court")}
                    required
                    disabled={!watchCourtLevel}
                    options={
                      courtList?.data?.result?.data?.map((item: any) => ({
                        label: getLabel(item, lang),
                        value: item.id,
                      })) ?? []
                    }
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomComboboxField
                      control={form.control}
                      name="act"
                      label={t("case.details.act")}
                      placeholder={t("case.details.select_act")}
                      required
                      disabled={!watchCourt}
                      options={
                        courtActMappingList.data?.result?.data.map(
                          (item: any) => ({
                            label: getLabel(item.act_detail, lang),
                            value: item.act_detail.id,
                          }),
                        ) ?? []
                      }
                    />
                    <CustomComboboxField
                      control={form.control}
                      name="section"
                      label={t("case.details.section")}
                      placeholder={t("case.details.select_section")}
                      required
                      loading={courtAndActWiseSectionList.isLoading}
                      disabled={!watchAct}
                      options={
                        [
                          ...(courtAndActWiseSectionList?.data?.result?.data ??
                            []),
                        ]
                          .sort((a: any, b: any) => {
                            const aIsOther =
                              a.section_detail?.code === "SEC_OTHER";
                            const bIsOther =
                              b.section_detail?.code === "SEC_OTHER";
                            if (aIsOther && !bIsOther) return 1;
                            if (!aIsOther && bIsOther) return -1;
                            return 0;
                          })
                          .map((item: any) => ({
                            label: getLabel(item.section_detail, lang),
                            value: item.section_detail.id,
                          })) ?? []
                      }
                    />
                  </div>
                  <RichTextField
                    control={form.control as any}
                    name="description"
                    label={t("case.details.case_description")}
                    placeholder={t("case.details.description_placeholder")}
                    fieldSize="lg"
                    maxWords={1000}
                  />
                </div>
              </section>
            </div>
            <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
              <Button
                variant="outline"
                type="button"
                className="px-5"
                onClick={onClose}
              >
                {t("case.parties.form.cancel_btn") ?? "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="px-6"
              >
                {mutation.isPending
                  ? (t("case.details.saving_btn") ?? "Saving...")
                  : t("case.details.save_btn")}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default OverviewEditButton;
