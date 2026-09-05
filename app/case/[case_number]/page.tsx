"use client";

import { useCaseDetail, CourtDetailWriteRequest } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppealTypeList, useCourtLevelList, useStates, useMandal, useDistrict, useTehsil, useCourtList, getCourtUIConfig, getLabel, useCourtNatureByCourtLevelList, useCourtActMappingList, useCourtActWiseSectionMappingList } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RichTextField } from "@/components/ui/richtext-field";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowRight } from "lucide-react";
import React, { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";

import { CourtDetailSchema } from "./validations";
import toast from "react-hot-toast";

export default function CaseCourtDetailsPage() {
  const { case_number } = useParams();
  const router = useRouter();

  const detail = useCaseDetail(case_number as string);

  const { t, lang } = useTranslation();

  type LocalForm = CourtDetailWriteRequest & { description?: string };

  const apiData = detail.data?.result?.data;
  const isSubmitted = apiData?.is_submitted === true;

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
  const watchState = form.watch("state_code_census");
  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchTehsil = form.watch("tehsil_code_census");
  const watchCourt = form.watch("court");
  const watchAct = form.watch("act");
  const watchSection = form.watch("section");
  const watchAllFields = form.watch();


  const courtLevel = useCourtLevelList();

  const courtNatureByCourtLevelList = useCourtNatureByCourtLevelList(
    {
      "filters[court_level]": watchCourtLevel,
    },
    { enabled: !!watchCourtLevel },
  );
  const appealTypeList = useAppealTypeList();
  const stateList = useStates();
  const mandalList = useMandal();
  console.log("Mandal List Data:", mandalList.data);
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

  const selectedCourtLevel = useMemo(() => {
    const list = courtLevel.data?.result?.data;
    const selected = list?.find((c) => c.id === watchCourtLevel);
    console.log("Selected Court Level Debug:", {
      watchCourtLevel,
      listLength: list?.length,
      found: !!selected,
      code: selected?.code,
    });
    return selected;
  }, [courtLevel.data?.result?.data, watchCourtLevel]);

  useEffect(() => {
    if (watchCaseNature !== 3) {
      form.setValue("appeal_type", null);
    }
  }, [watchCaseNature]);

  useEffect(() => {
    if (watchCaseNature !== 3) {
      form.resetField("appeal_type");
    }
  }, [watchCaseNature, form.resetField]);

  const refetchCourtList = courtList.refetch;
  const refetchActSectionList = courtAndActWiseSectionList.refetch;


  useEffect(() => {
    if (watchCourtLevel) {
      refetchCourtList();
      refetchActSectionList();
    }
  }, [watchCourtLevel, refetchCourtList, refetchActSectionList]);

  const uiConfig = useMemo(() => {
    const config = getCourtUIConfig({ courtLevel: selectedCourtLevel?.code });
    console.log("Court UI Config:", {
      selectedLevel: selectedCourtLevel?.code,
      config,
    });
    return config;
  }, [selectedCourtLevel?.code]);

  const isFormValid = useMemo(() => {
    const hasCourtLevel =
      watchCourtLevel !== null &&
      watchCourtLevel !== undefined &&
      Number(watchCourtLevel) > 0;
    const hasCourt =
      watchCourt !== null && watchCourt !== undefined && Number(watchCourt) > 0;
    const hasAct =
      watchAct !== null && watchAct !== undefined && Number(watchAct) > 0;
    const hasSection =
      watchSection !== null &&
      watchSection !== undefined &&
      Number(watchSection) > 0;

    let hasCaseNature = true;
    if (uiConfig?.showCaseNature) {
      hasCaseNature =
        watchCaseNature !== null &&
        watchCaseNature !== undefined &&
        Number(watchCaseNature) > 0;
    }

    return hasCourtLevel && hasCourt && hasAct && hasSection && hasCaseNature;
  }, [
    watchCourtLevel,
    watchCourt,
    watchAct,
    watchSection,
    watchCaseNature,
    uiConfig?.showCaseNature,
  ]);

  const isSaveEnabled = useMemo(() => {
    if (!apiData) return false;
    return (
      (watchAllFields.court_level ?? null) !==
        (formValues.court_level ?? null) ||
      (watchAllFields.case_nature ?? null) !==
        (formValues.case_nature ?? null) ||
      (watchAllFields.appeal_type ?? null) !==
        (formValues.appeal_type ?? null) ||
      (watchAllFields.court ?? null) !== (formValues.court ?? null) ||
      (watchAllFields.act ?? null) !== (formValues.act ?? null) ||
      (watchAllFields.section ?? null) !== (formValues.section ?? null) ||
      (watchAllFields.mandal_code ?? null) !==
        (formValues.mandal_code ?? null) ||
      (watchAllFields.district_code_census ?? null) !==
        (formValues.district_code_census ?? null) ||
      (watchAllFields.tehsil_code_census ?? null) !==
        (formValues.tehsil_code_census ?? null) ||
      (watchAllFields.description ?? "") !== (formValues.description ?? "")
    );
  }, [watchAllFields, formValues, apiData]);

  const CaseCourtMutation = useMutation({
    mutationKey: ["CASE_DETAIL", case_number],
    mutationFn: async ({
      data,
      case_number,
    }: {
      data: CourtDetailWriteRequest;
      case_number: string;
      isSaveOnly?: boolean;
    }) => {
      console.log("Calling CaseDetailWriteService with:", {
        data,
        case_number,
      });
      return CommonsApiServices.CaseDetailWriteService(data, case_number);
    },
    onSuccess: (res, variables) => {
      toast.success("Case details saved successfully!");
      detail.refetch();
      if (!variables.isSaveOnly) {
        router.push(`/case/${case_number}/parties`);
      }
    },
    onError: (error) => {
      console.error("Mutation Error:", error);
    },
  });

  const onSubmit = async (data: LocalForm) => {
    if (!case_number) {
      console.error("TCN missing");
      return;
    }

    console.log("Submitting Case Detail:", data);
    CaseCourtMutation.mutate({
      data: data as CourtDetailWriteRequest,
      case_number: case_number as string,
      isSaveOnly: false,
    });
  };

  const onError = (errors: any) => {
    console.error("Form Validation Errors:", errors);
  };
  useEffect(() => {
    form.resetField("act");
    form.resetField("section");
  }, [watchCourt]);
  return (
    <div className="flex h-full ">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="flex flex-1 overflow-hidden h-full"
        >
          {}
          <div className="flex flex-1 flex-col bg-background dark:bg-neutral-950 border-r overflow-hidden">
            {}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
              {}

              <section className="bg-card border border-blue-100/80 dark:border-blue-900/30 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30 text-sm font-semibold text-foreground">
                  {t("case.details.jurisdiction")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <CustomComboboxField
                      required
                      control={form.control}
                      name="court_level"
                      label={t("case.details.court_level")}
                      placeholder={t("case.details.select_court_level")}
                      disabled={isSubmitted}
                      options={
                        courtLevel.data?.result?.data
                          ?.sort((a, b) => a.display_order - b.display_order)
                          .map((item: any) => ({
                            label: `${getLabel(item, lang)}`,
                            value: item.id,
                          })) ?? []
                      }
                      onSelect={(val) => {
                        if (val) {
                          form.setValue("mandal_code", null);
                          form.setValue("mandal_name", null);
                          form.setValue("district_code_census", null);
                          form.setValue("district_name", null);
                          form.setValue("tehsil_code_census", null);
                          form.setValue("tehsil_name", null);
                        }
                      }}
                    />
                    {uiConfig.showCaseNature && (
                      <CustomComboboxField
                        required
                        control={form.control}
                        name="case_nature"
                        label={t("case.details.case_nature")}
                        placeholder={t("case.details.select_case_nature")}
                        loading={courtNatureByCourtLevelList.isLoading}
                        options={
                          courtNatureByCourtLevelList?.data?.result?.data?.map(
                            (item: any) => ({
                              label: getLabel(item.case_nature, lang),
                              value: item.case_nature.id,
                            }),
                          ) ?? []
                        }
                        disabled={isSubmitted || !watchCourtLevel}
                      />
                    )}
                  </div>
                  {watchCaseNature === 3 && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <CustomComboboxField
                        control={form.control}
                        name="appeal_type"
                        label={t("case.details.appeal_type")}
                        placeholder={t("case.details.select_appeal_type")}
                        loading={appealTypeList.isLoading}
                        disabled={isSubmitted}
                        options={
                          appealTypeList.data?.result?.data?.map(
                            (item: any) => ({
                              label: getLabel(item, lang),
                              value: item.id,
                            }),
                          ) ?? []
                        }
                      />
                    </div>
                  )}
                </div>
              </section>

              {}
              <section className="bg-card border border-blue-100/80 dark:border-blue-900/30 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30 text-sm font-semibold text-foreground">
                  {t("case.details.admin_area")}
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AutocompleteField
                      control={form.control}
                      name="state_code_census"
                      label={t("case.details.state")}
                      placeholder={t("case.details.select_state")}
                      readonly={true}
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
                      <AutocompleteField
                        control={form.control}
                        name="mandal_code"
                        label={t("case.details.mandal")}
                        placeholder={t("case.details.select_mandal")}
                        loading={mandalList.isLoading}
                        readonly={isSubmitted}
                        options={
                          mandalList?.data?.map((item: any) => ({
                            label: item.mandal_name,
                            value: item.mandal_code,
                          })) ?? []
                        }
                        onAutocomplete={(data) => {
                          form.setValue("mandal_name", data?.label || null);
                        }}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uiConfig.showDistrict && (
                      <AutocompleteField
                        control={form.control}
                        name="district_code_census"
                        label={t("case.details.district")}
                        placeholder={t("case.details.select_district")}
                        loading={districtList.isLoading}
                        readonly={isSubmitted || !watchMandal}
                        options={
                          districtList?.data?.map((item: any) => ({
                            label: item.district_name,
                            value: item.district_code_census,
                          })) ?? []
                        }
                        onAutocomplete={(data) => {
                          form.setValue("district_name", data?.label || null);
                        }}
                      />
                    )}

                    {uiConfig.showTehsil && (
                      <AutocompleteField
                        control={form.control}
                        name="tehsil_code_census"
                        label={t("case.details.tehsil")}
                        placeholder={t("case.details.select_tehsil")}
                        readonly={isSubmitted || !watchDistrict}
                        loading={tehsilList.isLoading}
                        options={
                          tehsilList?.data?.map((item: any) => ({
                            label: getLabel(item, "hi"),
                            value: item.tehsil_code_census,
                            ...item,
                          })) ?? []
                        }
                        onAutocomplete={(data: any) => {
                          form.setValue(
                            "tehsil_name",
                            data?.tehsil_name || null,
                          );
                          form.setValue(
                            "tehsil_name_en",
                            data?.tehsil_name_en || null,
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </section>

              {}
              <section className="bg-card border border-blue-100/80 dark:border-blue-900/30 rounded-xl overflow-hidden">
                <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30 text-sm font-semibold text-foreground">
                  {t("case.details.court_legal_details")}
                </div>
                <div className="p-6 space-y-4">
                  <AutocompleteField
                    required
                    control={form.control}
                    name="court"
                    label={t("case.details.court")}
                    placeholder={t("case.details.select_court")}
                    readonly={isSubmitted || !watchCourtLevel}
                    options={
                      courtList?.data?.result?.data?.map((item: any) => ({
                        label: getLabel(item, lang),
                        value: item.id,
                      })) ?? []
                    }
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <AutocompleteField
                      required
                      control={form.control}
                      name="act"
                      label={t("case.details.act")}
                      placeholder={t("case.details.select_act")}
                      readonly={isSubmitted || !watchCourt}
                      options={courtActMappingList.data?.result?.data.map(
                        (item: any) => ({
                          label: getLabel(item.act_detail, lang),
                          value: item.act_detail.id,
                        }),
                      )}
                    />
                    <AutocompleteField
                      required
                      control={form.control}
                      name="section"
                      label={t("case.details.section")}
                      placeholder={t("case.details.select_section")}
                      loading={courtAndActWiseSectionList.isLoading}
                      readonly={isSubmitted || !watchAct}
                      options={
                        [
                          ...(courtAndActWiseSectionList?.data?.result?.data ??
                            []),
                        ]
                          .sort((a: any, b: any) => {
                            const aIsOther =
                              a.section_detail?.code === "SEC_OTHER" ||
                              a.section_detail?.name_en?.toLowerCase() ===
                                "other" ||
                              a.section_detail?.name === "अन्य";
                            const bIsOther =
                              b.section_detail?.code === "SEC_OTHER" ||
                              b.section_detail?.name_en?.toLowerCase() ===
                                "other" ||
                              b.section_detail?.name === "अन्य";
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

                  <div className="space-y-1 pt-2">
                    <RichTextField
                      control={form.control as any}
                      name="description"
                      label={t("case.details.case_description")}
                      placeholder={t("case.details.description_placeholder")}
                      fieldSize="lg"
                      maxWords={1000}
                      readonly={isSubmitted}
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="h-14 flex items-center justify-end border-t border-border bg-white dark:bg-neutral-950 px-8 z-10 relative shrink-0">
              <div className="flex gap-3">
                <Button
                  type="button"
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs hover:shadow-sm transition-all duration-150 disabled:bg-blue-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:disabled:bg-blue-800/35 dark:disabled:text-white/60"
                  onClick={async () => {
                    const data = form.getValues();
                    CaseCourtMutation.mutate({
                      data: data as CourtDetailWriteRequest,
                      case_number: case_number as string,
                      isSaveOnly: true,
                    });
                  }}
                  disabled={
                    isSubmitted || !isSaveEnabled || CaseCourtMutation.isPending
                  }
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    {CaseCourtMutation.isPending ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{t("case.details.saving_btn")}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{t("case.details.save_btn")}</span>
                      </>
                    )}
                  </span>
                </Button>
                <Button
                  type="submit"
                  className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-sm transition-all duration-150 disabled:bg-emerald-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-emerald-800/35 dark:disabled:text-white/60"
                  disabled={
                    isSubmitted || !isFormValid || CaseCourtMutation.isPending
                  }
                >
                  <span className="inline-flex items-center justify-center gap-1.5">
                    <span>{t("case.details.next_btn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
