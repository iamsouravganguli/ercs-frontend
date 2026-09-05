"use client";

import { useEffect, useRef, useMemo } from "react";
import { useTranslation } from "@/i18n";
import {
  useCourtList,
  useCourtLevelList,
  useStates,
  useMandal,
  useDistrict,
  useTehsil,
  usePargana,
  useRI,
  useRSI,
  useVillage,
  useQueryParams,
  withDefault,
  NumberParam,
  StringParam,
  getCourtUIConfig,
  useStatusList,
} from "@/lib";
import { useRoleList } from "@/app/administrator/masters/rbac/query";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const FilterSchema = z.object({
  court_level: z.any().optional().nullable(),
  court_id: z.any().optional(),
  state_code_census: z.string().optional().nullable(),
  mandal_code: z.string().optional().nullable(),
  district_code_census: z.string().optional().nullable(),
  tehsil_code_census: z.string().optional().nullable(),
  pargana_code_census: z.string().optional().nullable(),
  ricircle_code: z.string().optional().nullable(),
  rsicircle_code: z.string().optional().nullable(),
  village_code_census: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  role_code: z.string().optional().nullable(),
  created_at__gte: z.string().optional().nullable(),
  created_at__lte: z.string().optional().nullable(),
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

export default function CourtUserFilterPage() {
  const { t, locale } = useTranslation();

  const [query] = useQueryParams({
    court_level: withDefault(StringParam, ""),
    court_id: withDefault(NumberParam, undefined),
    state_code_census: withDefault(StringParam, ""),
    mandal_code: withDefault(StringParam, ""),
    district_code_census: withDefault(StringParam, ""),
    tehsil_code_census: withDefault(StringParam, ""),
    pargana_code_census: withDefault(StringParam, ""),
    ricircle_code: withDefault(StringParam, ""),
    rsicircle_code: withDefault(StringParam, ""),
    village_code_census: withDefault(StringParam, ""),
    phone: withDefault(StringParam, ""),
    email: withDefault(StringParam, ""),
    role_code: withDefault(StringParam, ""),
    created_at__gte: withDefault(StringParam, ""),
    created_at__lte: withDefault(StringParam, ""),
    is_active: withDefault(StringParam, ""),
    status: withDefault(StringParam, ""),
  });

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: {
      court_level: query.court_level || "",
      court_id: query.court_id ?? "",
      state_code_census: query.state_code_census || "05",
      mandal_code: query.mandal_code || "",
      district_code_census: query.district_code_census || "",
      tehsil_code_census: query.tehsil_code_census || "",
      pargana_code_census: query.pargana_code_census || "",
      ricircle_code: query.ricircle_code || "",
      rsicircle_code: query.rsicircle_code || "",
      village_code_census: query.village_code_census || "",
      phone: query.phone || "",
      email: query.email || "",
      role_code: query.role_code || "",
      created_at__gte: query.created_at__gte || "",
      created_at__lte: query.created_at__lte || "",
      is_active: query.is_active || query.status || "",
      status: query.status || query.is_active || "",
    },
  });

  const watchedMandal = form.watch("mandal_code");
  const watchedDistrict = form.watch("district_code_census");
  const watchedTehsil = form.watch("tehsil_code_census");
  const watchedRI = form.watch("ricircle_code");
  const watchedCourtLevel = form.watch("court_level");
  const watchedRole = form.watch("role_code");


  const rolesQuery = useRoleList();
  const courtLevelQuery = useCourtLevelList();
  const courtsQuery = useCourtList({
    limit: 100,
    "filters[level]": watchedCourtLevel || undefined,
  });
  const stateQuery = useStates();
  const mandalQuery = useMandal();
  const districtQuery = useDistrict(watchedMandal || undefined);
  const tehsilQuery = useTehsil(watchedDistrict || undefined);
  const parganaQuery = usePargana(watchedTehsil || "");
  const riQuery = useRI(watchedTehsil || "");
  const rsiQuery = useRSI(watchedRI || "", watchedTehsil || "");
  const villageQuery = useVillage(watchedTehsil || "");

  const isRi = watchedRole === "RI";
  const isRsi = watchedRole === "RSI";
  const isRiOrRsi = isRi || isRsi;

  const selectedCourtLevel = useMemo(() => {
    const list = courtLevelQuery.data?.result?.data || courtLevelQuery.data;
    if (!Array.isArray(list)) return undefined;
    return list.find((c: any) => String(c.id) === String(watchedCourtLevel));
  }, [courtLevelQuery.data, watchedCourtLevel]);

  const uiConfig = useMemo(() => {
    if (isRiOrRsi) {
      return {
        showMandal: true,
        showDistrict: true,
        showTehsil: true,
        showPargana: true,
        showRICircle: true,
        showRSICircle: !isRi,
        showVillage: true,
      };
    }
    const config = getCourtUIConfig({ courtLevel: selectedCourtLevel?.code });
    return {
      ...config,
      showPargana: false,
      showRICircle: false,
      showRSICircle: false,
      showVillage: false,
    };
  }, [selectedCourtLevel?.code, isRiOrRsi, isRi]);

  useEffect(() => {
    if (!uiConfig.showMandal) form.setValue("mandal_code", "");
    if (!uiConfig.showDistrict) form.setValue("district_code_census", "");
    if (!uiConfig.showTehsil) form.setValue("tehsil_code_census", "");
    if (!uiConfig.showPargana) form.setValue("pargana_code_census", "");
    if (!uiConfig.showRICircle) form.setValue("ricircle_code", "");
    if (!uiConfig.showRSICircle) form.setValue("rsicircle_code", "");
    if (!uiConfig.showVillage) form.setValue("village_code_census", "");
  }, [uiConfig, form]);


  const prevMandalRef = useRef(watchedMandal);
  useEffect(() => {
    if (prevMandalRef.current !== watchedMandal) {
      form.setValue("district_code_census", "");
      form.setValue("tehsil_code_census", "");
      form.setValue("pargana_code_census", "");
      form.setValue("ricircle_code", "");
      form.setValue("rsicircle_code", "");
      form.setValue("village_code_census", "");
      prevMandalRef.current = watchedMandal;
    }
  }, [watchedMandal, form]);

  const prevDistrictRef = useRef(watchedDistrict);
  useEffect(() => {
    if (prevDistrictRef.current !== watchedDistrict) {
      form.setValue("tehsil_code_census", "");
      form.setValue("pargana_code_census", "");
      form.setValue("ricircle_code", "");
      form.setValue("rsicircle_code", "");
      form.setValue("village_code_census", "");
      prevDistrictRef.current = watchedDistrict;
    }
  }, [watchedDistrict, form]);

  const prevTehsilRef = useRef(watchedTehsil);
  useEffect(() => {
    if (prevTehsilRef.current !== watchedTehsil) {
      form.setValue("pargana_code_census", "");
      form.setValue("ricircle_code", "");
      form.setValue("rsicircle_code", "");
      form.setValue("village_code_census", "");
      prevTehsilRef.current = watchedTehsil;
    }
  }, [watchedTehsil, form]);

  const prevRIRef = useRef(watchedRI);
  useEffect(() => {
    if (prevRIRef.current !== watchedRI) {
      form.setValue("rsicircle_code", "");
      prevRIRef.current = watchedRI;
    }
  }, [watchedRI, form]);

  const prevCourtLevelRef = useRef(watchedCourtLevel);
  useEffect(() => {
    if (prevCourtLevelRef.current !== watchedCourtLevel) {
      form.setValue("court_id", "");
      prevCourtLevelRef.current = watchedCourtLevel;
    }
  }, [watchedCourtLevel, form]);

  const getOptions = (queryObj: any, labelKey: string, valueKey: string) => {
    const list = Array.isArray(queryObj.data)
      ? queryObj.data
      : queryObj.data?.result?.data;
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      label:
        locale === "hi"
          ? item[labelKey.replace("_en", "")]
          : item[labelKey] || item[labelKey.replace("_en", "")],
      value: item[valueKey],
    }));
  };

  const getLocationOptions = (
    queryObj: any,
    labelKey: string,
    valueKey: string,
  ) => {
    const list = Array.isArray(queryObj.data)
      ? queryObj.data
      : queryObj.data?.result?.data;
    if (!Array.isArray(list)) return [];
    return list.map((item: any) => ({
      label: item[labelKey] || "",
      value: item[valueKey],
    }));
  };

  const rolesListData = (rolesQuery.data?.result?.data ?? []) as any[];
  const courtRoles = rolesListData.filter((r: any) =>
    ["PO", "CO", "CC", "RI", "RSI"].includes(r.code),
  );
  const roleOptions = courtRoles.map((r: any) => ({
    label: locale === "hi" ? r.name : r.name_en || r.name,
    value: r.code,
  }));

  const courtOptions = getOptions(courtsQuery, "name_en", "id");
  const courtLevelOptions = getOptions(courtLevelQuery, "name_en", "id");
  const stateOptions = getLocationOptions(
    stateQuery,
    "state_name",
    "state_code_census",
  );
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
  const parganaOptions = getLocationOptions(
    parganaQuery,
    "pargana_name",
    "pargana_code_new",
  );
  const riOptions = getLocationOptions(
    riQuery,
    "ricircle_name",
    "ricircle_code",
  );
  const rsiOptions = getLocationOptions(
    rsiQuery,
    "rsicircle_name",
    "rsicircle_code",
  );
  const villageOptions = getLocationOptions(
    villageQuery,
    "vname",
    "village_code_census",
  );

  const statusListQuery = useStatusList({ "filters[type]": "USER" });

  const statusOptions = useMemo(() => {
    const list = statusListQuery.data?.result?.data || statusListQuery.data;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => ({
        label: locale === "hi" ? item.name : item.name_en || item.name,
        value: String(item.id || item.code || item.value),
      }));
    }
    return [
      { label: t("common.active") || "Active", value: "true" },
      { label: t("common.inactive") || "Inactive", value: "false" },
    ];
  }, [statusListQuery.data, t, locale]);

  const onSubmit = (values: FilterFormValues) => {
    const isBooleanValue =
      values.is_active === "true" || values.is_active === "false";

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "APPLY_COURT_USER_FILTERS",
          filters: {
            court_level: values.court_level || undefined,
            court_id: values.court_id ? Number(values.court_id) : undefined,
            state_code_census:
              values.state_code_census && values.state_code_census !== "05"
                ? values.state_code_census
                : undefined,
            mandal_code: values.mandal_code || undefined,
            district_code_census: values.district_code_census || undefined,
            tehsil_code_census: values.tehsil_code_census || undefined,
            pargana_code_census: values.pargana_code_census || undefined,
            ricircle_code: values.ricircle_code || undefined,
            rsicircle_code: values.rsicircle_code || undefined,
            village_code_census: Array.isArray(values.village_code_census)
              ? values.village_code_census.join(",") || undefined
              : values.village_code_census || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            role_code: values.role_code || undefined,
            created_at__gte: values.created_at__gte || undefined,
            created_at__lte: values.created_at__lte || undefined,
            is_active: isBooleanValue ? values.is_active : undefined,
            status: !isBooleanValue ? values.is_active || undefined : undefined,
          },
        },
        "*",
      );
    }
    window.close();
  };

  const handleReset = () => {
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "RESET_COURT_USER_FILTERS",
        },
        "*",
      );
    }
    window.close();
  };

  const handleCancel = () => {
    window.close();
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col h-screen w-full bg-background overflow-hidden"
      >
        {}
        <div className="px-6 py-4 border-b shrink-0">
          <h1 className="text-xl font-semibold text-foreground">
            {t("common_button.filter.label") || "Filter"}
          </h1>
        </div>

        {}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {}
          <div className="space-y-4 p-4 border rounded-xl bg-card/40 shadow-sm">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
              {t("filter.section.court_role") || "Court & Role"}
            </h2>
            <div className="space-y-4">
              <AutocompleteField
                control={form.control}
                name="role_code"
                label={t("basicInfo.role") || "Role"}
                options={roleOptions}
                placeholder="Select Role"
                loading={rolesQuery.isLoading}
              />

              {!isRiOrRsi && (
                <AutocompleteField
                  control={form.control}
                  name="court_level"
                  label={t("form.court_level.label") || "Court Level"}
                  options={courtLevelOptions}
                  placeholder="Select Court Level"
                  loading={courtLevelQuery.isLoading}
                />
              )}

              {!isRiOrRsi && (
                <AutocompleteField
                  control={form.control}
                  name="court_id"
                  label={t("table.court_name") || "Court"}
                  disabled={!watchedCourtLevel}
                  options={courtOptions}
                  placeholder={
                    t("form.search_court.placeholder") || "Select Court"
                  }
                  loading={courtsQuery.isLoading}
                />
              )}

              <AutocompleteField
                control={form.control}
                name="is_active"
                label={t("table.status") || "Status"}
                options={statusOptions}
                placeholder="Select Status"
                loading={statusListQuery.isLoading}
              />
            </div>
          </div>

          {}
          <div className="space-y-4 p-4 border rounded-xl bg-card/40 shadow-sm">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
              {t("filter.section.contact_details") || "Contact Details"}
            </h2>
            <div className="space-y-4">
              <TextFieldV2
                control={form.control}
                name="phone"
                label={t("basicInfo.phone") || "Mobile Number"}
                placeholder="Enter mobile number"
              />

              <TextFieldV2
                control={form.control}
                name="email"
                label={t("basicInfo.email") || "Email Address"}
                placeholder="Enter email address"
              />
            </div>
          </div>

          {}
          <div className="space-y-4 p-4 border rounded-xl bg-card/40 shadow-sm">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
              {t("filter.section.registration_date") ||
                "Registration Date Range"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <TextFieldV2
                control={form.control}
                name="created_at__gte"
                type="date"
                label={t("filter.date_from") || "From Date"}
              />

              <TextFieldV2
                control={form.control}
                name="created_at__lte"
                type="date"
                label={t("filter.date_to") || "To Date"}
              />
            </div>
          </div>

          {}
          {(uiConfig.showMandal ||
            uiConfig.showDistrict ||
            uiConfig.showTehsil ||
            uiConfig.showPargana ||
            uiConfig.showRICircle ||
            uiConfig.showRSICircle ||
            uiConfig.showVillage) && (
            <div className="space-y-4 p-4 border rounded-xl bg-card/40 shadow-sm">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                {t("filter.section.location_details") || "Location Details"}
              </h2>
              <div className="space-y-4">
                <AutocompleteField
                  control={form.control}
                  name="state_code_census"
                  label={t("location.state_name.label") || "State"}
                  options={stateOptions}
                  placeholder="Select State"
                  readonly
                />

                {uiConfig.showMandal && (
                  <AutocompleteField
                    control={form.control}
                    name="mandal_code"
                    label={t("location.mandal_name.label") || "Mandal"}
                    options={mandalOptions}
                    placeholder="Select Mandal"
                    loading={mandalQuery.isLoading}
                  />
                )}

                {uiConfig.showDistrict && (
                  <AutocompleteField
                    control={form.control}
                    name="district_code_census"
                    label={t("location.district_name.label") || "District"}
                    disabled={!watchedMandal}
                    options={districtOptions}
                    placeholder="Select District"
                    loading={districtQuery.isLoading}
                  />
                )}

                {uiConfig.showTehsil && (
                  <AutocompleteField
                    control={form.control}
                    name="tehsil_code_census"
                    label={t("location.tehsil_name.label") || "Tehsil"}
                    disabled={!watchedDistrict}
                    options={tehsilOptions}
                    placeholder="Select Tehsil"
                    loading={tehsilQuery.isLoading}
                  />
                )}

                {uiConfig.showPargana && (
                  <AutocompleteField
                    control={form.control}
                    name="pargana_code_census"
                    label={t("location.pargana_name.label") || "Pargana"}
                    disabled={!watchedTehsil}
                    options={parganaOptions}
                    placeholder="Select Pargana"
                    loading={parganaQuery.isLoading}
                  />
                )}

                {uiConfig.showRICircle && (
                  <AutocompleteField
                    control={form.control}
                    name="ricircle_code"
                    label={t("location.ricircle_name.label") || "RI Circle"}
                    disabled={!watchedTehsil}
                    options={riOptions}
                    placeholder="Select RI Circle"
                    loading={riQuery.isLoading}
                  />
                )}

                {uiConfig.showRSICircle && (
                  <AutocompleteField
                    control={form.control}
                    name="rsicircle_code"
                    label={t("location.rsicircle_name.label") || "RSI Circle"}
                    disabled={!watchedRI}
                    options={rsiOptions}
                    placeholder="Select RSI Circle"
                    loading={rsiQuery.isLoading}
                  />
                )}

                {uiConfig.showVillage && isRsi && (
                  <MultiAutocompleteField
                    control={form.control as any}
                    name="village_code_census"
                    label={t("location.village_name.label") || "Villages"}
                    disabled={!watchedTehsil}
                    options={villageOptions}
                    placeholder="Select Villages"
                    loading={villageQuery.isLoading}
                    maxDisplay={3}
                  />
                )}

                {uiConfig.showVillage && !isRsi && (
                  <AutocompleteField
                    control={form.control}
                    name="village_code_census"
                    label={t("location.village_name.label") || "Village"}
                    disabled={!watchedTehsil}
                    options={villageOptions}
                    placeholder="Select Village"
                    loading={villageQuery.isLoading}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between bg-muted/20">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleReset}
            className="hover:bg-muted text-muted-foreground hover:text-foreground"
            title={t("common_button.reset.label") || "Reset"}
            aria-label={t("common_button.reset.label") || "Reset"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={handleCancel}>
              {t("common_button.cancel.label") || "Cancel"}
            </Button>
            <Button type="submit" variant="default" className="px-6">
              {t("common_button.apply.label") || "Apply"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
