"use client";

import {
  useCaseDetail,
  useProfileDetail,
  CommonsApiServices,
  CourtDetailWriteRequest,
  type ProfileData,
  type CourtMeta,
} from "@/lib";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useAppealTypeList,
  useCourtLevelList,
  useStates,
  useMandal,
  useDistrict,
  useTehsil,
  useCourtList,
  getCourtUIConfig,
  getLabel,
  useCourtNatureByCourtLevelList,
  useCourtActMappingList,
  useCourtActWiseSectionMappingList,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { Form } from "@/components/ui/form";
import { RichTextField } from "@/components/ui/richtext-field";
import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { CourtDetailSchema } from "./validations";
import toast from "react-hot-toast";
import { useEFileFooter } from "../../../../app/case/e-file/[caseId]/layout";

export default function EFileDraftCaseDetailsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const detail = useCaseDetail(caseId as string);
  const { t, lang } = useTranslation();
  const { data: profileData } = useProfileDetail();
  const profile = (profileData?.result?.data ?? null) as ProfileData | null;
  const roleCode = String(profile?.role ?? "").toUpperCase();
  type LocalForm = CourtDetailWriteRequest & { description?: string };
  const apiData = detail.data?.result?.data;
  const isSubmitted = apiData?.is_submitted === true;
  const isViewOnlyRole = ["SA", "RI", "RSI"].includes(roleCode);
  const isCourtUser = !["CT", "AD", "CIT", "ADV"].includes(roleCode) && !!roleCode;
  const isReadOnly = isSubmitted || isViewOnlyRole;

  const formValues = useMemo(() => {
    const courtDetail = profile?.court_detail as (CourtMeta & { mandal_code?: string | null }) | null;
    const pCourtLevel = courtDetail?.level ?? null;
    const pCourt = courtDetail?.id ?? (profile?.court ? Number(profile.court) : null);
    const pMandal = profile?.mandal_code ?? courtDetail?.mandal_code ?? null;
    const pDistrict = profile?.district_code_census ?? null;
    const pTehsil = profile?.tehsil_code_census ?? null;
    const pMandalName = profile?.mandal_name ?? null;
    const pDistrictName = profile?.district_name ?? null;
    const pTehsilName = profile?.tehsil_name ?? null;

    if (apiData) {

      return {
        court_level: apiData.court_level?.id ?? (isCourtUser ? pCourtLevel : null),
        case_nature: apiData.case_nature?.id ?? null,
        appeal_type: apiData.appeal_type?.id ?? null,
        court: apiData.court?.id ?? (isCourtUser ? pCourt : null),
        act: apiData.act?.id ?? null,
        section: apiData.section?.id ?? null,
        state_code_census: "05",
        state_name: "उत्तराखण्ड",
        mandal_code: apiData.mandal_code ?? (isCourtUser ? pMandal : null),
        mandal_name: apiData.mandal_name ?? (isCourtUser ? pMandalName : null),
        district_code_census: apiData.district_code_census ?? (isCourtUser ? pDistrict : null),
        district_name: apiData.district_name ?? (isCourtUser ? pDistrictName : null),
        tehsil_code_census: apiData.tehsil_code_census ?? (isCourtUser ? pTehsil : null),
        tehsil_name: apiData.tehsil_name ?? (isCourtUser ? pTehsilName : null),
        tehsil_name_en: apiData.tehsil_name_en ?? null,
        description: apiData.description ?? "",
      };
    }

    if (isCourtUser) {
      return {
        court_level: pCourtLevel,
        case_nature: null,
        appeal_type: null,
        court: pCourt,
        act: null,
        section: null,
        state_code_census: "05",
        state_name: "उत्तराखण्ड",
        mandal_code: pMandal,
        mandal_name: pMandalName,
        district_code_census: pDistrict,
        district_name: pDistrictName,
        tehsil_code_census: pTehsil,
        tehsil_name: pTehsilName,
        tehsil_name_en: null,
        description: "",
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
  }, [apiData, profile, isCourtUser]);

  const form = useForm<LocalForm>({
    resolver: zodResolver(CourtDetailSchema) as any,
    values: formValues,
    mode: "onChange",
  });

  const watchCourtLevel = form.watch("court_level");
  const watchCaseNature = form.watch("case_nature");
  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchTehsil = form.watch("tehsil_code_census");
  const watchCourt = form.watch("court");
  const watchAct = form.watch("act");
  const watchSection = form.watch("section");
  const watchAllFields = form.watch();

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

  const selectedCourtLevel = useMemo(() => {
    const list = courtLevel.data?.result?.data;
    return list?.find((c) => c.id === watchCourtLevel);
  }, [courtLevel.data?.result?.data, watchCourtLevel]);

  useEffect(() => {
    if (watchCaseNature !== 3) form.setValue("appeal_type", null);
  }, [watchCaseNature, form]);
  useEffect(() => {
    if (watchCaseNature !== 3) form.resetField("appeal_type");
  }, [watchCaseNature, form]);
  useEffect(() => {
    if (watchCourtLevel) {
      courtList.refetch();
      courtAndActWiseSectionList.refetch();
    }
  }, [watchCourtLevel, courtList, courtAndActWiseSectionList]);
  useEffect(() => {
    form.resetField("act");
    form.resetField("section");
  }, [watchCourt, form]);

  const uiConfig = useMemo(
    () => getCourtUIConfig({ courtLevel: selectedCourtLevel?.code }),
    [selectedCourtLevel?.code],
  );

  const isFormValid = useMemo(() => {
    const hasCourtLevel =
      watchCourtLevel !== null && Number(watchCourtLevel) > 0;
    const hasCourt = watchCourt !== null && Number(watchCourt) > 0;
    const hasAct = watchAct !== null && Number(watchAct) > 0;
    const hasSection = watchSection !== null && Number(watchSection) > 0;
    let hasCaseNature = true;
    if (uiConfig?.showCaseNature)
      hasCaseNature = watchCaseNature !== null && Number(watchCaseNature) > 0;

    let hasMandal = true;
    let hasDistrict = true;
    let hasTehsil = true;
    if (uiConfig?.showMandal) hasMandal = !!watchMandal;
    if (uiConfig?.showDistrict) hasDistrict = !!watchDistrict;
    if (uiConfig?.showTehsil) hasTehsil = !!watchTehsil;
    return (
      hasCourtLevel &&
      hasCourt &&
      hasAct &&
      hasSection &&
      hasCaseNature &&
      hasMandal &&
      hasDistrict &&
      hasTehsil
    );
  }, [
    watchCourtLevel,
    watchCourt,
    watchAct,
    watchSection,
    watchCaseNature,
    uiConfig?.showCaseNature,
    uiConfig?.showMandal,
    uiConfig?.showDistrict,
    uiConfig?.showTehsil,
    watchMandal,
    watchDistrict,
    watchTehsil,
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
    mutationKey: ["CASE_DETAIL", caseId],
    mutationFn: async ({
      data,
      case_number,
    }: {
      data: CourtDetailWriteRequest;
      case_number: string;
    }) => {
      return CommonsApiServices.CaseDetailWriteService(data, case_number);
    },
    onSuccess: () => {
      toast.success("Case details saved successfully!");
      detail.refetch();
      router.push(`/case/e-file/${caseId}/parties`);
    },
  });

  const onSubmit = useCallback(
    async (data: LocalForm) => {
      if (!caseId) return;
      const current = form.getValues() as LocalForm;
      const hasChanges =
        (current.court_level ?? null) !== (formValues.court_level ?? null) ||
        (current.case_nature ?? null) !== (formValues.case_nature ?? null) ||
        (current.appeal_type ?? null) !== (formValues.appeal_type ?? null) ||
        (current.court ?? null) !== (formValues.court ?? null) ||
        (current.act ?? null) !== (formValues.act ?? null) ||
        (current.section ?? null) !== (formValues.section ?? null) ||
        (current.mandal_code ?? null) !== (formValues.mandal_code ?? null) ||
        (current.district_code_census ?? null) !== (formValues.district_code_census ?? null) ||
        (current.tehsil_code_census ?? null) !== (formValues.tehsil_code_census ?? null) ||
        (current.description ?? "") !== (formValues.description ?? "");
      if (!hasChanges) {
        router.push(`/case/e-file/${caseId}/parties`);
        return;
      }
      CaseCourtMutation.mutate({
        data: data as CourtDetailWriteRequest,
        case_number: caseId as string,
      });
    },

    [caseId, form, formValues, router],
  );
  const onError = useCallback((errors: unknown) => console.error("Form Validation Errors:", errors), []);

  const { setFooterConfig } = useEFileFooter();
  useEffect(() => {
    if (!setFooterConfig) return;
    setFooterConfig({
      backDisabled: true,
      nextDisabled: isReadOnly || !isFormValid || CaseCourtMutation.isPending,
      nextLabel: t("case.details.next_btn"),
      onNext: () => { if (isViewOnlyRole) return; form.handleSubmit(onSubmit, onError)(); },
    });
  }, [setFooterConfig, onSubmit, onError, isFormValid, isReadOnly, isViewOnlyRole, CaseCourtMutation.isPending, t]);


  if (detail.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, onError)}
        className="space-y-6 pb-6"
      >
        {}
        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-white dark:bg-zinc-900 text-sm font-semibold text-foreground border-b border-zinc-100 dark:border-zinc-800">
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
                disabled={isSubmitted || isCourtUser}
                readOnly={isCourtUser}
                options={
                  courtLevel.data?.result?.data
                    ?.sort((a, b) => a.display_order - b.display_order)
                    .map((item: any) => ({
                      label: `${getLabel(item, lang)}`,
                      value: item.id,
                    })) ?? []
                }
                onSelect={() => {
                  form.setValue("mandal_code", null);
                  form.setValue("mandal_name", null);
                  form.setValue("district_code_census", null);
                  form.setValue("district_name", null);
                  form.setValue("tehsil_code_census", null);
                  form.setValue("tehsil_name", null);
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
                    appealTypeList.data?.result?.data?.map((item: any) => ({
                      label: getLabel(item, lang),
                      value: item.id,
                    })) ?? []
                  }
                />
              </div>
            )}
          </div>
        </section>

        {}
        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-white dark:bg-zinc-900 text-sm font-semibold text-foreground border-b border-zinc-100 dark:border-zinc-800">
            {t("case.details.admin_area")}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomComboboxField
                control={form.control}
                name="state_code_census"
                label={t("case.details.state")}
                placeholder={t("case.details.select_state")}
                readOnly={true}
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
                  required
                  control={form.control}
                  name="mandal_code"
                  label={t("case.details.mandal")}
                  placeholder={t("case.details.select_mandal")}
                  loading={mandalList.isLoading}
                  disabled={isSubmitted || isCourtUser}
                  readOnly={isCourtUser}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uiConfig.showDistrict && (
                <CustomComboboxField
                  required
                  control={form.control}
                  name="district_code_census"
                  label={t("case.details.district")}
                  placeholder={t("case.details.select_district")}
                  loading={districtList.isLoading}
                  disabled={isSubmitted || isCourtUser || !watchMandal}
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
                  required
                  control={form.control}
                  name="tehsil_code_census"
                  label={t("case.details.tehsil")}
                  placeholder={t("case.details.select_tehsil")}
                  disabled={isSubmitted || isCourtUser || !watchDistrict}
                  loading={tehsilList.isLoading}
                  options={
                    tehsilList?.data?.map((item: any) => ({
                      label: getLabel(item, "hi"),
                      value: item.tehsil_code_census,
                    })) ?? []
                  }
                  onSelect={(val) => {
                    const opt = tehsilList?.data?.find(
                      (x: any) => String(x.tehsil_code_census) === String(val),
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

        {}
        <section className="bg-card border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-3 bg-white dark:bg-zinc-900 text-sm font-semibold text-foreground border-b border-zinc-100 dark:border-zinc-800">
            {t("case.details.court_legal_details")}
          </div>
          <div className="p-6 space-y-4">
            <CustomComboboxField
              required
              control={form.control}
              name="court"
              label={t("case.details.court")}
              placeholder={t("case.details.select_court")}
              disabled={isSubmitted || isCourtUser || !watchCourtLevel}
              readOnly={isCourtUser}
              options={
                courtList?.data?.result?.data?.map((item: any) => ({
                  label: getLabel(item, lang),
                  value: item.id,
                })) ?? []
              }
            />
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <CustomComboboxField
                required
                control={form.control}
                name="act"
                label={t("case.details.act")}
                placeholder={t("case.details.select_act")}
                disabled={isReadOnly || !watchCourt}
                options={
                  courtActMappingList.data?.result?.data.map((item: any) => ({
                    label: getLabel(item.act_detail, lang),
                    value: item.act_detail.id,
                  })) ?? []
                }
              />
              <CustomComboboxField
                required
                control={form.control}
                name="section"
                label={t("case.details.section")}
                placeholder={t("case.details.select_section")}
                loading={courtAndActWiseSectionList.isLoading}
                disabled={isReadOnly || !watchAct}
                options={
                  [...(courtAndActWiseSectionList?.data?.result?.data ?? [])]
                    .sort((a: any, b: any) => {
                      const aIsOther =
                        a.section_detail?.code === "SEC_OTHER" ||
                        a.section_detail?.name_en?.toLowerCase() === "other" ||
                        a.section_detail?.name === "अन्य";
                      const bIsOther =
                        b.section_detail?.code === "SEC_OTHER" ||
                        b.section_detail?.name_en?.toLowerCase() === "other" ||
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
                readonly={isReadOnly}
              />
            </div>
          </div>
        </section>
      </form>
    </Form>
  );
}
