"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "@/i18n";
import { useCourtLevelList, useCourtList, useCourtNatureByCourtLevelList, useCourtActMappingList, useCourtActWiseSectionMappingList, useCaseStageList, useCaseStatusList, useMandal, useDistrict, useTehsil, getCourtUIConfig } from '@/lib/query';
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CustomSheet,
  CustomSheetHeader,
  CustomSheetBody,
  CustomSheetFooter,
} from "@/workflows/e-file/common/timeline/custom-sheet";

const FilterSchema = z.object({
  court_level: z.string().optional().nullable(),
  case_nature: z.string().optional().nullable(),
  mandal_code: z.string().optional().nullable(),
  district_code_census: z.string().optional().nullable(),
  tehsil_code_census: z.string().optional().nullable(),
  court: z.string().optional().nullable(),
  act: z.string().optional().nullable(),
  section: z.string().optional().nullable(),
  stage: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  created_from: z.string().optional().nullable(),
  created_to: z.string().optional().nullable(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

interface CaseFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: any;
  setQuery: (q: any) => void;
}

export function CaseFilterSheet({
  open,
  onOpenChange,
  query,
  setQuery,
}: CaseFilterSheetProps) {
  const { t, lang } = useTranslation();
  const locale = (lang as string) || "en";

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: {
      court_level: query.court_level || "",
      case_nature: query.case_nature || "",
      mandal_code: query.mandal_code || "",
      district_code_census: query.district_code_census || "",
      tehsil_code_census: query.tehsil_code_census || "",
      court: query.court || "",
      act: query.act || "",
      section: query.section || "",
      stage: query.stage || "",
      status: query.status || "",
      created_from: query.created_from || "",
      created_to: query.created_to || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        court_level: query.court_level || "",
        case_nature: query.case_nature || "",
        mandal_code: query.mandal_code || "",
        district_code_census: query.district_code_census || "",
        tehsil_code_census: query.tehsil_code_census || "",
        court: query.court || "",
        act: query.act || "",
        section: query.section || "",
        stage: query.stage || "",
        status: query.status || "",
        created_from: query.created_from || "",
        created_to: query.created_to || "",
      });
    }
  }, [open, query, form]);

  const watchCourtLevel = form.watch("court_level");
  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchCourt = form.watch("court");
  const watchAct = form.watch("act");
  const watchStage = form.watch("stage");


  const courtLevelQuery = useCourtLevelList();
  const natureQuery = useCourtNatureByCourtLevelList(
    { "filters[court_level]": watchCourtLevel || undefined },
    { enabled: !!watchCourtLevel },
  );
  const mandalQuery = useMandal();
  const districtQuery = useDistrict(watchMandal || undefined);
  const tehsilQuery = useTehsil(watchDistrict || undefined);
  const courtQuery = useCourtList(
    { limit: 100, "filters[level]": watchCourtLevel || undefined },
    { enabled: true },
  );
  const actMappingQuery = useCourtActMappingList(
    { "filters[court]": watchCourt || undefined },
    { enabled: !!watchCourt },
  );
  const sectionQuery = useCourtActWiseSectionMappingList(
    {
      "filters[court]": watchCourt || undefined,
      "filters[act]": watchAct || undefined,
    },
    { enabled: !!watchCourt && !!watchAct },
  );
  const stageQuery = useCaseStageList();
  const statusQuery = useCaseStatusList(
    watchStage ? { "filters[stage]": watchStage } : undefined,
  );


  const selectedCourtLevel = useMemo(() => {
    const list =
      (courtLevelQuery.data as any)?.result?.data || courtLevelQuery.data;
    if (!Array.isArray(list)) return undefined;
    return list.find((c: any) => String(c.id) === String(watchCourtLevel));
  }, [courtLevelQuery.data, watchCourtLevel]);

  const uiConfig = useMemo(
    () => getCourtUIConfig({ courtLevel: selectedCourtLevel?.code }),
    [selectedCourtLevel?.code],
  );


  const prevCourtLevelRef = useRef(watchCourtLevel);
  useEffect(() => {
    if (prevCourtLevelRef.current !== watchCourtLevel) {
      form.setValue("case_nature", "");
      form.setValue("mandal_code", "");
      form.setValue("district_code_census", "");
      form.setValue("tehsil_code_census", "");
      form.setValue("court", "");
      form.setValue("act", "");
      form.setValue("section", "");
      prevCourtLevelRef.current = watchCourtLevel;
    }
  }, [watchCourtLevel, form]);

  const prevMandalRef = useRef(watchMandal);
  useEffect(() => {
    if (prevMandalRef.current !== watchMandal) {
      form.setValue("district_code_census", "");
      form.setValue("tehsil_code_census", "");
      prevMandalRef.current = watchMandal;
    }
  }, [watchMandal, form]);

  const prevDistrictRef = useRef(watchDistrict);
  useEffect(() => {
    if (prevDistrictRef.current !== watchDistrict) {
      form.setValue("tehsil_code_census", "");
      prevDistrictRef.current = watchDistrict;
    }
  }, [watchDistrict, form]);

  const prevCourtRef = useRef(watchCourt);
  useEffect(() => {
    if (prevCourtRef.current !== watchCourt) {
      form.setValue("act", "");
      form.setValue("section", "");
      prevCourtRef.current = watchCourt;
    }
  }, [watchCourt, form]);

  const prevActRef = useRef(watchAct);
  useEffect(() => {
    if (prevActRef.current !== watchAct) {
      form.setValue("section", "");
      prevActRef.current = watchAct;
    }
  }, [watchAct, form]);

  const prevStageRef = useRef(watchStage);
  useEffect(() => {
    if (prevStageRef.current !== watchStage) {
      form.setValue("status", "");
      prevStageRef.current = watchStage;
    }
  }, [watchStage, form]);


  useEffect(() => {
    if (!uiConfig.showMandal) form.setValue("mandal_code", "");
    if (!uiConfig.showDistrict) form.setValue("district_code_census", "");
    if (!uiConfig.showTehsil) form.setValue("tehsil_code_census", "");
  }, [uiConfig.showMandal, uiConfig.showDistrict, uiConfig.showTehsil, form]);


  const getOptions = (q: any, labelEn: string, valueKey: string) => {
    const list = Array.isArray(q.data) ? q.data : q.data?.result?.data;
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      label:
        locale === "hi"
          ? item.name || item[labelEn.replace("_en", "")]
          : item[labelEn] || item.name || item.name_en,
      value: String(item[valueKey]),
    }));
  };

  const getLocationOptions = (q: any, labelKey: string, valueKey: string) => {
    const list = Array.isArray(q.data) ? q.data : q.data?.result?.data;
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      label: item[labelKey] || "",
      value: String(item[valueKey]),
    }));
  };

  const getNatureOptions = () => {
    const list =
      (natureQuery.data as any)?.result?.data || (natureQuery.data as any);
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => {
      const d = item.case_nature || item;
      return {
        label: locale === "hi" ? d.name : d.name_en || d.name,
        value: String(d.id),
      };
    });
  };

  const getActOptions = () => {
    const list =
      (actMappingQuery.data as any)?.result?.data ||
      (actMappingQuery.data as any);
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => {
      const d = item.act_detail || item;
      return {
        label: locale === "hi" ? d.name : d.name_en || d.name,
        value: String(d.id || item.act),
      };
    });
  };

  const getSectionOptions = () => {
    const list =
      (sectionQuery.data as any)?.result?.data || (sectionQuery.data as any);
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => {
      const d = item.section_detail || item;
      return {
        label: locale === "hi" ? d.name : d.name_en || d.name,
        value: String(d.id || item.section),
      };
    });
  };

  const courtLevelOptions = getOptions(courtLevelQuery, "name_en", "id");
  const courtOptions = getOptions(courtQuery, "name_en", "id");
  const mandalOptions = getLocationOptions(
    mandalQuery,
    "mandal_name",
    "mandal_code",
  );
  const districtOptions = getLocationOptions(
    districtQuery,
    "district_name",
    "district_code_census",
  );
  const tehsilOptions = getLocationOptions(
    tehsilQuery,
    "tehsil_name",
    "tehsil_code_census",
  );
  const stageOptions = useMemo(() => {
    const list = (stageQuery.data as any)?.result?.data || stageQuery.data;
    if (!Array.isArray(list)) return [];
    return [...list]
      .sort(
        (a: any, b: any) =>
          (a.display_order ?? a.order ?? 0) - (b.display_order ?? b.order ?? 0),
      )
      .map((item: any) => ({
        label: locale === "hi" ? item.name : item.name_en || item.name,
        value: String(item.id),
      }));
  }, [stageQuery.data, locale]);
  const statusOptions = useMemo(() => {
    const list = (statusQuery.data as any)?.result?.data || statusQuery.data;
    if (Array.isArray(list) && list.length > 0) {
      return [...list]
        .sort(
          (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
        )
        .map((item: any) => ({
          label: locale === "hi" ? item.name : item.name_en || item.name,
          value: String(item.id),
        }));
    }
    return [];
  }, [statusQuery.data, locale]);

  const onSubmit = (values: FilterFormValues) => {
    setQuery({
      ...query,
      court_level: values.court_level || undefined,
      case_nature: values.case_nature || undefined,
      mandal_code: values.mandal_code || undefined,
      district_code_census: values.district_code_census || undefined,
      tehsil_code_census: values.tehsil_code_census || undefined,
      court: values.court || undefined,
      act: values.act || undefined,
      section: values.section || undefined,
      stage: values.stage || undefined,
      status: values.status || undefined,
      created_from: values.created_from || undefined,
      created_to: values.created_to || undefined,
      page: 1,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    form.reset({
      court_level: "",
      case_nature: "",
      mandal_code: "",
      district_code_census: "",
      tehsil_code_census: "",
      court: "",
      act: "",
      section: "",
      stage: "",
      status: "",
      created_from: "",
      created_to: "",
    });
    setQuery({
      ...query,
      court_level: undefined,
      case_nature: undefined,
      mandal_code: undefined,
      district_code_census: undefined,
      tehsil_code_census: undefined,
      court: undefined,
      act: undefined,
      section: undefined,
      stage: undefined,
      status: undefined,
      created_from: undefined,
      created_to: undefined,
      page: 1,
    });
    onOpenChange(false);
  };

  return (
    <CustomSheet open={open} onOpenChange={onOpenChange}>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col h-full w-full overflow-hidden"
        >
          {}
          <CustomSheetHeader className="px-6 py-3 border-b shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center h-[56px]">
            <h2 className="text-lg font-semibold text-foreground">
              {t("common_button.filter.label") || "Filters"}
            </h2>
          </CustomSheetHeader>

          {}
          <CustomSheetBody className="px-6 py-6 space-y-6">
            {}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b pb-2">
                {t("filter.section.court_case") || "Court & Case Details"}
              </h3>
              <div className="space-y-4">
                <CustomComboboxField
                  control={form.control}
                  name="court_level"
                  label={t("form.court_level.label") || "Court Level"}
                  options={courtLevelOptions}
                  placeholder={
                    t("form.court_level.placeholder") || "Select Court Level"
                  }
                  loading={courtLevelQuery.isLoading}
                />
                <CustomComboboxField
                  control={form.control}
                  name="case_nature"
                  label={t("table.case_nature") || "Case Nature"}
                  options={getNatureOptions()}
                  placeholder={
                    t("form.case_nature.placeholder") || "Select Case Nature"
                  }
                  loading={(natureQuery as any).isLoading}
                  disabled={!watchCourtLevel}
                />
              </div>
            </div>

            {}
            {(uiConfig.showMandal ||
              uiConfig.showDistrict ||
              uiConfig.showTehsil) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b pb-2">
                  {t("filter.section.location_details") || "Location Details"}
                </h3>
                <div className="space-y-4">
                  {uiConfig.showMandal && (
                    <CustomComboboxField
                      control={form.control}
                      name="mandal_code"
                      label={t("location.mandal_name.label") || "Mandal"}
                      options={mandalOptions}
                      placeholder={t("form.select_mandal") || "Select Mandal"}
                      loading={(mandalQuery as any).isLoading}
                    />
                  )}
                  {uiConfig.showDistrict && (
                    <CustomComboboxField
                      control={form.control}
                      name="district_code_census"
                      label={t("location.district_name.label") || "District"}
                      options={districtOptions}
                      placeholder={
                        t("form.select_district") || "Select District"
                      }
                      loading={(districtQuery as any).isLoading}
                      disabled={!watchMandal}
                    />
                  )}
                  {uiConfig.showTehsil && (
                    <CustomComboboxField
                      control={form.control}
                      name="tehsil_code_census"
                      label={t("location.tehsil_name.label") || "Tehsil"}
                      options={tehsilOptions}
                      placeholder={t("form.select_tehsil") || "Select Tehsil"}
                      loading={(tehsilQuery as any).isLoading}
                      disabled={!watchDistrict}
                    />
                  )}
                </div>
              </div>
            )}

            {}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b pb-2">
                {t("case.details.court_legal_details") ||
                  "Court & Legal Details"}
              </h3>
              <div className="space-y-4">
                <CustomComboboxField
                  control={form.control}
                  name="court"
                  label={t("table.court_name") || "Court"}
                  options={courtOptions}
                  placeholder={
                    t("form.search_court.placeholder") || "Select Court"
                  }
                  loading={courtQuery.isLoading}
                  disabled={!watchCourtLevel}
                />
                <CustomComboboxField
                  control={form.control}
                  name="act"
                  label={t("table.act") || "Act"}
                  options={getActOptions()}
                  placeholder={t("form.act.placeholder") || "Select Act"}
                  loading={(actMappingQuery as any).isLoading}
                  disabled={!watchCourt}
                />
                <CustomComboboxField
                  control={form.control}
                  name="section"
                  label={t("form.section.label") || "Section"}
                  options={getSectionOptions()}
                  placeholder={
                    t("form.section.placeholder") || "Select Section"
                  }
                  loading={(sectionQuery as any).isLoading}
                  disabled={!watchCourt || !watchAct}
                />
                <CustomComboboxField
                  control={form.control}
                  name="stage"
                  label={t("table.case_stage") || "Case Stage"}
                  options={stageOptions}
                  placeholder={t("form.stage.placeholder") || "Select Stage"}
                  loading={(stageQuery as any).isLoading}
                />
                <CustomComboboxField
                  control={form.control}
                  name="status"
                  label={t("table.case_status") || "Case Status"}
                  options={statusOptions}
                  placeholder={t("form.status.placeholder") || "Select Status"}
                  loading={(statusQuery as any).isLoading}
                  disabled={!watchStage}
                />
              </div>
            </div>

            {}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 border-b pb-2">
                {t("filter.section.registration_date") || "Registration Date"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <TextFieldV2
                  control={form.control}
                  name="created_from"
                  type="date"
                  label={t("filter.date_from") || "From Date"}
                />
                <TextFieldV2
                  control={form.control}
                  name="created_to"
                  type="date"
                  label={t("filter.date_to") || "To Date"}
                />
              </div>
            </div>
          </CustomSheetBody>

          {}
          <CustomSheetFooter className="px-6 py-3 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleReset}
              className="h-9 w-9"
              title={t("common_button.reset.label") || "Reset"}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("common_button.cancel.label") || "Cancel"}
              </Button>
              <Button type="submit" variant="default" className="px-6">
                {t("common_button.apply.label") || "Apply"}
              </Button>
            </div>
          </CustomSheetFooter>
        </form>
      </Form>
    </CustomSheet>
  );
}
