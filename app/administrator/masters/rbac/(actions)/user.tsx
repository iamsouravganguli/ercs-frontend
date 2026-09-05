"use client";
import { useMemo } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { useTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { UserCreateService, UserUpdateService } from "../services";
import {
  queryClient,
  applyBackendErrors,
  useGenderList,
  useCourtList,
  useMandal,
  useDistrict,
  useTehsil,
  usePargana,
  useRI,
  useRSI,
  useVillage,
  useCourtLevelList,
  getLabel,
  getCourtUIConfig,
  useStatusList,
} from "@/lib";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  UserCreateSchema,
  CitizenSchema,
  SystemUserSchema,
  CourtUserSchema,
  SystemUserAddSchema,
  CourtUserAddSchema,
} from "../validations";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { PasswordFieldAuth } from "@/components/ui/password-field-auth";
import { useRoleList, useUserDetail } from "../query";
import { Save } from "lucide-react";

export const SystemUserAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res: any) => void;
  onCancel?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const rolesData = useRoleList();
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

  const form = useForm<z.infer<typeof SystemUserAddSchema>>({
    resolver: zodResolver(SystemUserAddSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      employee_id: "",
      role: 1,
      court: null as any,
      is_active: "",
      status: "",
      password: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["USER_CREATE"],
    mutationFn: UserCreateService,
    onSuccess: (res) => {
      form.reset();

      const pwd = res?.result?.data?.password;
      const uname = res?.result?.data?.username;

      if (pwd) {
        toast.success(
          `Super Admin created!\nUsername: ${uname}\nPassword: ${pwd}`,
          { duration: 15000 },
        );
      } else {
        toast.success(res.message || "Super Admin created successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["USER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(
        form,
        err.errors,
        err.message || "Failed to create system user",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof SystemUserAddSchema>) => {
    const rolesList = (rolesData.data?.result?.data ?? []) as any[];
    const saRole = rolesList.find((r: any) => r.code === "SA");
    if (!saRole) {
      toast.error("Super Admin role not found. Please retry.");
      return;
    }
    const { is_active, status, employee_id, email, password, ...rest } =
      data as any;
    const isBooleanValue = is_active === "true" || is_active === "false";
    const payload = {
      ...rest,
      role: saRole.id,
      court: null,
      ...(employee_id ? { employee_id } : {}),
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
      ...(isBooleanValue ? { is_active: is_active === "true" } : {}),
      ...(!isBooleanValue && is_active ? { status: is_active } : {}),
    };
    console.log("SystemUserAddForm onSubmit payload:", payload);
    mutation.mutate(payload);
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("system_user.add.title") || "Add System User"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("system_user.add.description") ||
                    "Create a new system-wide administrative (Super Admin) account"}
                </p>
              </div>
            </div>

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextFieldV2
                  required
                  control={form.control}
                  name="name"
                  label={t("basicInfo.name") || "Full Name"}
                  placeholder={
                    t("form.enter_name_placeholder") || "Enter full name"
                  }
                />

                <TextFieldV2
                  required
                  control={form.control}
                  name="phone"
                  label={t("basicInfo.phone") || "Phone Number"}
                  placeholder={
                    t("form.enter_phone_placeholder") ||
                    "Enter 10-digit mobile number"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="email"
                  label={t("basicInfo.email") || "Email Address"}
                  placeholder={
                    t("form.enter_email_placeholder") || "Enter email address"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="employee_id"
                  label={t("basicInfo.employeeId") || "Employee ID"}
                  placeholder={
                    t("form.enter_employee_id_placeholder") ||
                    "Enter employee ID"
                  }
                />

                <PasswordFieldAuth
                  showStrength
                  defaultShow
                  control={form.control}
                  name="password"
                  label={t("basicInfo.password") || "Password"}
                  placeholder={
                    t("form.enter_password_placeholder") || "Enter password"
                  }
                />

                <div className="md:col-span-2">
                  <AutocompleteField
                    control={form.control as any}
                    name="is_active"
                    label={t("table.status") || "Status"}
                    placeholder={t("form.select_status") || "Select Status"}
                    options={statusOptions}
                    loading={statusListQuery.isLoading}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground pt-2 border-t">
                {t("system_user.add.role_notice") ||
                  "The role will be set to Super Admin automatically. Login credentials will be generated and displayed after creation."}
              </p>
            </section>
          </div>

          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {t("common_button.cancel.label") || "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.save.label") || "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const CourtUserAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res: any) => void;
  onCancel?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const rolesData = useRoleList();
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

  const form = useForm<z.infer<typeof CourtUserAddSchema>>({
    resolver: zodResolver(CourtUserAddSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      employee_id: "",
      role: undefined as any,
      court: undefined as any,
      court_level: undefined as any,
      state_code_census: "05",
      state_name: "उत्तराखण्ड",
      state_name_en: "Uttarakhand",
      mandal_code: "",
      mandal_name: "",
      mandal_name_en: "",
      district_code_census: "",
      district_name: "",
      district_name_en: "",
      tehsil_code_census: "",
      tehsil_name: "",
      tehsil_name_en: "",
      pargana_code_census: "",
      pargana_name: "",
      pargana_name_en: "",
      ricircle_code: "",
      ricircle_name: "",
      ricircle_name_en: "",
      rsicircle_code: "",
      rsicircle_name: "",
      rsicircle_name_en: "",
      village_code_census: "",
      village_name: "",
      village_name_en: "",
      villages: [],
      is_active: "",
      status: "",
      password: "",
    },
    mode: "onChange",
  });

  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchTehsil = form.watch("tehsil_code_census");
  const watchRI = form.watch("ricircle_code");
  const watchCourtLevel = form.watch("court_level");

  const courtLevelList = useCourtLevelList();
  const courtsData = useCourtList({
    limit: 100,
    "filters[level]": watchCourtLevel,
  });

  const mandalList = useMandal();
  const districtList = useDistrict(watchMandal as string);
  const tehsilList = useTehsil(watchDistrict as string);
  const parganaList = usePargana(watchTehsil as string);
  const villageList = useVillage(watchTehsil as string);
  const RIList = useRI(watchTehsil as string);
  const RSIList = useRSI(watchRI as unknown as string, watchTehsil as string);

  const watchRole = form.watch("role");

  const rolesListData = (rolesData.data?.result?.data ?? []) as any[];
  const selectedRole = useMemo(
    () => rolesListData.find((r: any) => r.id === watchRole),
    [rolesListData, watchRole],
  );
  const isRiOrRsi = selectedRole?.code === "RI" || selectedRole?.code === "RSI";
  const isRi = selectedRole?.code === "RI";
  const isRsi = selectedRole?.code === "RSI";

  const selectedCourtLevel = useMemo(() => {
    const list = courtLevelList.data?.result?.data;
    return list?.find((c: any) => c.id === watchCourtLevel);
  }, [courtLevelList.data?.result?.data, watchCourtLevel]);

  const uiConfig = useMemo(() => {
    if (isRiOrRsi) {
      return {
        showMandal: true,
        showDistrict: true,
        showTehsil: true,
        showPargana: true,
        showRICircle: true,
        showRSICircle: true,
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
  }, [selectedCourtLevel?.code, isRiOrRsi]);

  const mutation = useMutation({
    mutationKey: ["COURT_USER_CREATE"],
    mutationFn: UserCreateService,
    onSuccess: (res) => {
      form.reset();
      const pwd = res?.result?.data?.password;
      const uname = res?.result?.data?.username;

      if (pwd) {
        toast.success(
          `Court User created!\nUsername: ${uname}\nPassword: ${pwd}`,
          { duration: 15000 },
        );
      } else {
        toast.success(res.message || "Court User created successfully!");
      }

      queryClient.invalidateQueries({
        queryKey: ["USER_LIST"],
      });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(
        form,
        err.errors,
        err.message || "Failed to create court user",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof CourtUserAddSchema>) => {
    const {
      court_level,
      is_active,
      status,
      employee_id,
      email,
      password,
      villages: _villages,
      ...rest
    } = data as any;
    const isBooleanValue = is_active === "true" || is_active === "false";


    let villagesPayload: any[] = [];
    if (isRsi && Array.isArray(_villages) && _villages.length > 0) {
      villagesPayload = _villages.map((code: string) => {
        const village = villageList?.data?.find(
          (v: any) => v.village_code_census === code,
        );
        return {
          village_code_census: code,
          village_name: village?.vname ?? null,
          village_name_en: village?.vname ?? null,
        };
      });
    }

    const payload = {
      ...rest,
      ...(employee_id ? { employee_id } : {}),
      ...(email ? { email } : {}),
      ...(password ? { password } : {}),
      ...(isBooleanValue ? { is_active: is_active === "true" } : {}),
      ...(!isBooleanValue && is_active ? { status: is_active } : {}),
      ...(villagesPayload.length > 0 ? { villages: villagesPayload } : {}),
    };
    console.log("CourtUserAddForm onSubmit payload:", payload);
    mutation.mutate(payload as any);
  };

  const courtRoles = rolesListData.filter((r: any) =>
    ["PO", "CO", "CC", "RI", "RSI"].includes(r.code),
  );

  const roleOptions = courtRoles.map((r: any) => ({
    label: locale === "hi" ? r.name : r.name_en || r.name,
    value: r.id,
  }));

  const courtOptions =
    courtsData.data?.result?.data?.map((c: any) => ({
      label: locale === "hi" ? c.name : c.name_en || c.name,
      value: c.id,
    })) ?? [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            {}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("court_user.add.title") || "Add Court User"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("court_user.add.description") ||
                    "Create a new court-level administrative or judicial account"}
                </p>
              </div>
            </div>

            {}
            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextFieldV2
                  required
                  control={form.control}
                  name="name"
                  label={t("basicInfo.name") || "Full Name"}
                  placeholder={
                    t("form.enter_name_placeholder") || "Enter full name"
                  }
                />

                <TextFieldV2
                  required
                  control={form.control}
                  name="phone"
                  label={t("basicInfo.phone") || "Phone Number"}
                  placeholder={
                    t("form.enter_phone_placeholder") ||
                    "Enter 10-digit mobile number"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="email"
                  label={t("basicInfo.email") || "Email Address"}
                  placeholder={
                    t("form.enter_email_placeholder") || "Enter email address"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="employee_id"
                  label={t("basicInfo.employeeId") || "Employee ID"}
                  placeholder={
                    t("form.enter_employee_id_placeholder") ||
                    "Enter employee ID"
                  }
                />

                <AutocompleteField
                  required
                  control={form.control as any}
                  name="role"
                  label={t("basicInfo.role") || "Role"}
                  placeholder={t("form.select_role") || "Select Court Role"}
                  options={roleOptions}
                  loading={rolesData.isLoading}
                />

                <PasswordFieldAuth
                  showStrength
                  defaultShow
                  control={form.control}
                  name="password"
                  label={t("basicInfo.password") || "Password"}
                  placeholder={
                    t("form.enter_password_placeholder") || "Enter password"
                  }
                />

                {!isRiOrRsi && (
                  <>
                    <div className="md:col-span-2">
                      <AutocompleteField
                        required
                        control={form.control as any}
                        name="court_level"
                        label={t("form.court_level.label") || "Court Level"}
                        placeholder={
                          t("form.select_court_level_placeholder") ||
                          "Select Court Level"
                        }
                        options={courtLevelList.data?.result?.data?.map?.(
                          (item: any) => ({
                            value: item.id,
                            label: getLabel(item, locale),
                          }),
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <AutocompleteField
                        required
                        readonly={!watchCourtLevel}
                        control={form.control as any}
                        name="court"
                        label={t("table.court_name") || "Court Name"}
                        placeholder={
                          t("form.select_court_location_placeholder") ||
                          "Select Court Location"
                        }
                        options={courtOptions}
                        loading={courtsData.isLoading}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <AutocompleteField
                    control={form.control as any}
                    name="is_active"
                    label={t("table.status") || "Status"}
                    placeholder={t("form.select_status") || "Select Status"}
                    options={statusOptions}
                    loading={statusListQuery.isLoading}
                  />
                </div>
              </div>
            </section>

            {}
            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.geographic_location") || "Geographic Allocation"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <AutocompleteField
                  control={form.control as any}
                  name="state_code_census"
                  label={t("location.state_name.label") || "State"}
                  placeholder="Uttarakhand"
                  readonly
                  options={[{ label: "Uttarakhand", value: "05" }]}
                />

                {uiConfig.showMandal && (
                  <AutocompleteField
                    control={form.control as any}
                    name="mandal_code"
                    label={t("location.mandal_name.label") || "Mandal"}
                    placeholder={t("form.select_mandal") || "Select mandal"}
                    loading={mandalList.isLoading}
                    options={
                      mandalList?.data?.map((item) => ({
                        label: item.mandal_name,
                        value: item.mandal_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("mandal_name", data?.label ?? null);
                      form.setValue("mandal_name_en", data?.label ?? null);
                      form.setValue("district_code_census", "");
                      form.setValue("district_name", "");
                      form.setValue("tehsil_code_census", "");
                      form.setValue("tehsil_name", "");
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showDistrict && (
                  <AutocompleteField
                    control={form.control as any}
                    name="district_code_census"
                    label={t("location.district_name.label") || "District"}
                    disabled={!watchMandal}
                    placeholder={t("form.select_district") || "Select district"}
                    loading={districtList.isLoading}
                    options={
                      districtList?.data?.map((item) => ({
                        label: item.district_name,
                        value: item.district_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("district_name", data?.label ?? null);
                      form.setValue("district_name_en", data?.label ?? null);
                      form.setValue("tehsil_code_census", "");
                      form.setValue("tehsil_name", "");
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showTehsil && (
                  <AutocompleteField
                    control={form.control as any}
                    name="tehsil_code_census"
                    label={t("location.tehsil_name.label") || "Tehsil"}
                    disabled={!watchDistrict}
                    placeholder={t("form.select_tehsil") || "Select tehsil"}
                    loading={tehsilList.isLoading}
                    options={
                      tehsilList?.data?.map((item) => ({
                        label: item.tehsil_name,
                        value: item.tehsil_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("tehsil_name", data?.label ?? null);
                      form.setValue("tehsil_name_en", data?.label ?? null);
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showPargana && (
                  <AutocompleteField
                    control={form.control as any}
                    name="pargana_code_census"
                    label={t("location.pargana_name.label") || "Pargana"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_pargana") || "Select pargana"}
                    loading={parganaList.isLoading}
                    options={
                      parganaList?.data?.map((item) => ({
                        label: item.pargana_name,
                        value: item.pargana_code_new,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("pargana_name", data?.label ?? null);
                      form.setValue("pargana_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showRICircle && (
                  <AutocompleteField
                    control={form.control as any}
                    name="ricircle_code"
                    label={t("location.ricircle_name.label") || "RI Circle"}
                    disabled={!watchTehsil}
                    placeholder={
                      t("form.select_ri_circle") || "Select RI circle"
                    }
                    loading={RIList.isLoading}
                    options={
                      RIList?.data?.map((item) => ({
                        label: item.ricircle_name,
                        value: item.ricircle_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("ricircle_name", data?.label ?? null);
                      form.setValue("ricircle_name_en", data?.label ?? null);
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                    }}
                  />
                )}

                {uiConfig.showRSICircle && !isRi && (
                  <AutocompleteField
                    control={form.control as any}
                    name="rsicircle_code"
                    label={
                      t("location.rsicircle_name.label") ||
                      "RSI Circle (Lekhpal)"
                    }
                    disabled={!watchRI}
                    placeholder={
                      t("form.select_rsi_circle") || "Select RSI circle"
                    }
                    loading={RSIList.isLoading}
                    options={
                      RSIList?.data?.map((item) => ({
                        label: item.rsicircle_name,
                        value: item.rsicircle_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("rsicircle_name", data?.label ?? null);
                      form.setValue("rsicircle_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showVillage && !isRiOrRsi && (
                  <AutocompleteField
                    control={form.control as any}
                    name="village_code_census"
                    label={t("location.village_name.label") || "Village"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_village") || "Select village"}
                    loading={villageList.isLoading}
                    options={
                      villageList?.data?.map((item) => ({
                        label: item.vname,
                        value: item.village_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("village_name", data?.label ?? null);
                      form.setValue("village_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showVillage && isRsi && (
                  <MultiAutocompleteField
                    required
                    control={form.control as any}
                    name="villages"
                    label={t("location.village_name.label") || "Villages"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_village") || "Select villages"}
                    loading={villageList.isLoading}
                    maxDisplay={3}
                    options={
                      villageList?.data?.map((item) => ({
                        label: item.vname,
                        value: item.village_code_census,
                      })) ?? []
                    }
                  />
                )}
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {t("common_button.cancel.label") || "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.save.label") || "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const CourtUserEditForm = ({
  username,
  onSuccess,
  onCancel,
}: {
  username: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const rolesData = useRoleList();
  const gendersData = useGenderList();
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

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof CourtUserSchema>>({
    resolver: zodResolver(CourtUserSchema) as any,
    values: {
      name: detail?.name ?? "",
      phone: detail?.phone ?? "",
      email: detail?.email ?? "",
      employee_id: detail?.employee_id ?? "",
      role: detail?.role ?? (undefined as any),
      court: detail?.court ?? (undefined as any),
      court_level: detail?.court_detail?.level_detail?.id ?? (undefined as any),
      state_code_census: detail?.state_code_census ?? "05",
      state_name: detail?.state_name ?? "उत्तराखण्ड",
      state_name_en: detail?.state_name_en ?? "Uttarakhand",
      mandal_code: detail?.mandal_code ?? "",
      mandal_name: detail?.mandal_name ?? "",
      mandal_name_en: detail?.mandal_name_en ?? "",
      district_code_census: detail?.district_code_census ?? "",
      district_name: detail?.district_name ?? "",
      district_name_en: detail?.district_name_en ?? "",
      tehsil_code_census: detail?.tehsil_code_census ?? "",
      tehsil_name: detail?.tehsil_name ?? "",
      tehsil_name_en: detail?.tehsil_name_en ?? "",
      pargana_code_census: detail?.pargana_code_census ?? "",
      pargana_name: detail?.pargana_name ?? "",
      pargana_name_en: detail?.pargana_name_en ?? "",
      ricircle_code: detail?.ricircle_code ?? "",
      ricircle_name: detail?.ricircle_name ?? "",
      ricircle_name_en: detail?.ricircle_name_en ?? "",
      rsicircle_code: detail?.rsicircle_code ?? "",
      rsicircle_name: detail?.rsicircle_name ?? "",
      rsicircle_name_en: detail?.rsicircle_name_en ?? "",
      village_code_census: detail?.village_code_census ?? "",
      village_name: detail?.village_name ?? "",
      village_name_en: detail?.village_name_en ?? "",
      villages: (detail?.villages ?? []).map((v: any) => v.village_code_census),
      is_active:
        detail?.status !== undefined && detail?.status !== null
          ? String(detail.status)
          : detail?.is_active !== undefined
            ? detail.is_active
              ? "13"
              : "14"
            : "",
      status: "",
    },
    mode: "onChange",
  });

  const watchMandal = form.watch("mandal_code");
  const watchDistrict = form.watch("district_code_census");
  const watchTehsil = form.watch("tehsil_code_census");
  const watchRI = form.watch("ricircle_code");
  const watchCourtLevel = form.watch("court_level");

  const courtLevelList = useCourtLevelList();
  const courtsData = useCourtList({
    limit: 100,
    "filters[level]": watchCourtLevel,
  });

  const mandalList = useMandal();
  const districtList = useDistrict(watchMandal as string);
  const tehsilList = useTehsil(watchDistrict as string);
  const parganaList = usePargana(watchTehsil as string);
  const villageList = useVillage(watchTehsil as string);
  const RIList = useRI(watchTehsil as string);
  const RSIList = useRSI(watchRI as unknown as string, watchTehsil as string);
  const watchRole = form.watch("role");

  const rolesListData = (rolesData.data?.result?.data ?? []) as any[];
  const selectedRole = useMemo(
    () => rolesListData.find((r: any) => r.id === watchRole),
    [rolesListData, watchRole],
  );
  const isRiOrRsi = selectedRole?.code === "RI" || selectedRole?.code === "RSI";
  const isRi = selectedRole?.code === "RI";
  const isRsi = selectedRole?.code === "RSI";

  const selectedCourtLevel = useMemo(() => {
    const list = courtLevelList.data?.result?.data;
    return list?.find((c: any) => c.id === watchCourtLevel);
  }, [courtLevelList.data?.result?.data, watchCourtLevel]);

  const uiConfig = useMemo(() => {
    if (isRiOrRsi) {
      return {
        showMandal: true,
        showDistrict: true,
        showTehsil: true,
        showPargana: true,
        showRICircle: true,
        showRSICircle: true,
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
  }, [selectedCourtLevel?.code, isRiOrRsi]);

  const mutation = useMutation({
    mutationKey: ["COURT_USER_UPDATE"],
    mutationFn: ({ username, data }: { username: string; data: any }) =>
      UserUpdateService(username, data),
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Court User updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["USER_LIST"],
      });
      onSuccess?.();
    },
    onError: (err: any) => {
      applyBackendErrors(
        form,
        err.errors,
        err.message || "Failed to update court user",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof CourtUserSchema>) => {
    const {
      court_level,
      is_active,
      status,
      villages: _villages,
      ...rest
    } = data as any;
    const isBooleanValue = is_active === "true" || is_active === "false";

    const currentStatusVal =
      detail?.status !== undefined && detail?.status !== null
        ? String(detail.status)
        : detail?.is_active !== undefined
          ? detail.is_active
            ? "13"
            : "14"
          : "";

    const isStatusChanged = is_active !== currentStatusVal;


    let villagesPayload: any[] | undefined = undefined;
    if (isRsi && Array.isArray(_villages)) {
      villagesPayload = _villages.map((code: string) => {
        const village = villageList?.data?.find(
          (v: any) => v.village_code_census === code,
        );
        return {
          village_code_census: code,
          village_name: village?.vname ?? null,
          village_name_en: village?.vname ?? null,
        };
      });
    }

    const payload = {
      ...rest,
      ...(isStatusChanged
        ? isBooleanValue
          ? { is_active: is_active === "true" }
          : { status: is_active }
        : {}),
      ...(villagesPayload !== undefined ? { villages: villagesPayload } : {}),
    };
    console.log("CourtUserEditForm onSubmit payload:", payload);
    mutation.mutate({ username, data: payload as any });
  };

  const courtRoles = rolesListData.filter((r: any) =>
    ["PO", "CO", "CC", "RI", "RSI"].includes(r.code),
  );

  const roleOptions = courtRoles.map((r: any) => ({
    label: locale === "hi" ? r.name : r.name_en || r.name,
    value: r.id,
  }));

  const courtOptions =
    courtsData.data?.result?.data?.map((c: any) => ({
      label: locale === "hi" ? c.name : c.name_en || c.name,
      value: c.id,
    })) ?? [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            {}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("court_user.edit.title") || "Edit Court User"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("court_user.edit.description") ||
                    "Modify court user settings and geographic allocations"}
                </p>
              </div>
            </div>

            {}
            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextFieldV2
                  required
                  control={form.control}
                  name="name"
                  label={t("basicInfo.name") || "Full Name"}
                  placeholder={
                    t("form.enter_name_placeholder") || "Enter full name"
                  }
                />

                <TextFieldV2
                  required
                  control={form.control}
                  name="phone"
                  label={t("basicInfo.phone") || "Phone Number"}
                  placeholder={
                    t("form.enter_phone_placeholder") ||
                    "Enter 10-digit mobile number"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="email"
                  label={t("basicInfo.email") || "Email Address"}
                  placeholder={
                    t("form.enter_email_placeholder") || "Enter email address"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="employee_id"
                  label={t("basicInfo.employeeId") || "Employee ID"}
                  placeholder={
                    t("form.enter_employee_id_placeholder") ||
                    "Enter employee ID"
                  }
                />

                <AutocompleteField
                  required
                  control={form.control as any}
                  name="role"
                  label={t("basicInfo.role") || "Role"}
                  placeholder={t("form.select_role") || "Select Court Role"}
                  options={roleOptions}
                  loading={rolesData.isLoading}
                />

                {!isRiOrRsi && (
                  <>
                    <div className="md:col-span-2">
                      <AutocompleteField
                        control={form.control as any}
                        name="court_level"
                        label={t("form.court_level.label") || "Court Level"}
                        placeholder={
                          t("form.select_court_level_placeholder") ||
                          "Select Court Level"
                        }
                        options={courtLevelList.data?.result?.data?.map?.(
                          (item: any) => ({
                            value: item.id,
                            label: getLabel(item, locale),
                          }),
                        )}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <AutocompleteField
                        required
                        readonly={!watchCourtLevel}
                        control={form.control as any}
                        name="court"
                        label={t("table.court_name") || "Court Name"}
                        placeholder={
                          t("form.select_court_location_placeholder") ||
                          "Select Court Location"
                        }
                        options={courtOptions}
                        loading={courtsData.isLoading}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <AutocompleteField
                    control={form.control as any}
                    name="is_active"
                    label={t("table.status") || "Status"}
                    placeholder={t("form.select_status") || "Select Status"}
                    options={statusOptions}
                    loading={statusListQuery.isLoading}
                  />
                </div>
              </div>
            </section>

            {}
            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.geographic_location") || "Geographic Allocation"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <AutocompleteField
                  control={form.control as any}
                  name="state_code_census"
                  label={t("location.state_name.label") || "State"}
                  placeholder="Uttarakhand"
                  readonly
                  options={[{ label: "Uttarakhand", value: "05" }]}
                />

                {uiConfig.showMandal && (
                  <AutocompleteField
                    control={form.control as any}
                    name="mandal_code"
                    label={t("location.mandal_name.label") || "Mandal"}
                    placeholder={t("form.select_mandal") || "Select mandal"}
                    loading={mandalList.isLoading}
                    options={
                      mandalList?.data?.map((item) => ({
                        label: item.mandal_name,
                        value: item.mandal_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("mandal_name", data?.label ?? null);
                      form.setValue("mandal_name_en", data?.label ?? null);
                      form.setValue("district_code_census", "");
                      form.setValue("district_name", "");
                      form.setValue("tehsil_code_census", "");
                      form.setValue("tehsil_name", "");
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showDistrict && (
                  <AutocompleteField
                    control={form.control as any}
                    name="district_code_census"
                    label={t("location.district_name.label") || "District"}
                    disabled={!watchMandal}
                    placeholder={t("form.select_district") || "Select district"}
                    loading={districtList.isLoading}
                    options={
                      districtList?.data?.map((item) => ({
                        label: item.district_name,
                        value: item.district_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("district_name", data?.label ?? null);
                      form.setValue("district_name_en", data?.label ?? null);
                      form.setValue("tehsil_code_census", "");
                      form.setValue("tehsil_name", "");
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showTehsil && (
                  <AutocompleteField
                    control={form.control as any}
                    name="tehsil_code_census"
                    label={t("location.tehsil_name.label") || "Tehsil"}
                    disabled={!watchDistrict}
                    placeholder={t("form.select_tehsil") || "Select tehsil"}
                    loading={tehsilList.isLoading}
                    options={
                      tehsilList?.data?.map((item) => ({
                        label: item.tehsil_name,
                        value: item.tehsil_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("tehsil_name", data?.label ?? null);
                      form.setValue("tehsil_name_en", data?.label ?? null);
                      form.setValue("pargana_code_census", "");
                      form.setValue("pargana_name", "");
                      form.setValue("ricircle_code", "");
                      form.setValue("ricircle_name", "");
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                      form.setValue("village_code_census", "");
                      form.setValue("village_name", "");
                    }}
                  />
                )}

                {uiConfig.showPargana && (
                  <AutocompleteField
                    control={form.control as any}
                    name="pargana_code_census"
                    label={t("location.pargana_name.label") || "Pargana"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_pargana") || "Select pargana"}
                    loading={parganaList.isLoading}
                    options={
                      parganaList?.data?.map((item) => ({
                        label: item.pargana_name,
                        value: item.pargana_code_new,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("pargana_name", data?.label ?? null);
                      form.setValue("pargana_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showRICircle && (
                  <AutocompleteField
                    control={form.control as any}
                    name="ricircle_code"
                    label={t("location.ricircle_name.label") || "RI Circle"}
                    disabled={!watchTehsil}
                    placeholder={
                      t("form.select_ri_circle") || "Select RI circle"
                    }
                    loading={RIList.isLoading}
                    options={
                      RIList?.data?.map((item) => ({
                        label: item.ricircle_name,
                        value: item.ricircle_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("ricircle_name", data?.label ?? null);
                      form.setValue("ricircle_name_en", data?.label ?? null);
                      form.setValue("rsicircle_code", "");
                      form.setValue("rsicircle_name", "");
                    }}
                  />
                )}

                {uiConfig.showRSICircle && !isRi && (
                  <AutocompleteField
                    control={form.control as any}
                    name="rsicircle_code"
                    label={
                      t("location.rsicircle_name.label") ||
                      "RSI Circle (Lekhpal)"
                    }
                    disabled={!watchRI}
                    placeholder={
                      t("form.select_rsi_circle") || "Select RSI circle"
                    }
                    loading={RSIList.isLoading}
                    options={
                      RSIList?.data?.map((item) => ({
                        label: item.rsicircle_name,
                        value: item.rsicircle_code,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("rsicircle_name", data?.label ?? null);
                      form.setValue("rsicircle_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showVillage && !isRiOrRsi && (
                  <AutocompleteField
                    control={form.control as any}
                    name="village_code_census"
                    label={t("location.village_name.label") || "Village"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_village") || "Select village"}
                    loading={villageList.isLoading}
                    options={
                      villageList?.data?.map((item) => ({
                        label: item.vname,
                        value: item.village_code_census,
                      })) ?? []
                    }
                    onAutocomplete={(data: any) => {
                      form.setValue("village_name", data?.label ?? null);
                      form.setValue("village_name_en", data?.label ?? null);
                    }}
                  />
                )}

                {uiConfig.showVillage && isRsi && (
                  <MultiAutocompleteField
                    required
                    control={form.control as any}
                    name="villages"
                    label={t("location.village_name.label") || "Villages"}
                    disabled={!watchTehsil}
                    placeholder={t("form.select_village") || "Select villages"}
                    loading={villageList.isLoading}
                    maxDisplay={3}
                    options={
                      villageList?.data?.map((item) => ({
                        label: item.vname,
                        value: item.village_code_census,
                      })) ?? []
                    }
                  />
                )}
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {t("common_button.cancel.label") || "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.save.label") || "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const CourtUserViewForm = ({
  username,
  onClose,
}: {
  username: string;
  onClose?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("form.not_found") || "User details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
          {}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {t("court_user.view.title") || "View Court User"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {t("court_user.view.description") ||
                  "Detailed administrative, profile, and geographic allocations"}
              </p>
            </div>
          </div>

          {}
          <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-base font-semibold pb-2 border-b">
              {t("form.basic_information") || "Basic Information"}
            </div>
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.name") || "Full Name"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.phone") || "Phone Number"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.phone || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.email") || "Email Address"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.email || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.employeeId") || "Employee ID"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.employee_id || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.role") || "Role"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.role_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.status") || "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={
                      detail.status_detail?.code === "USER_ACTIVE"
                        ? "success"
                        : detail.status_detail?.code === "USER_PENDING"
                          ? "warning"
                          : detail.status_detail?.code === "USER_SUSPENDED" ||
                              detail.status_detail?.code === "USER_REJECTED"
                            ? "error"
                            : detail.is_active
                              ? "success"
                              : "neutral"
                    }
                  >
                    {detail.status_detail
                      ? locale === "hi"
                        ? detail.status_detail.name
                        : detail.status_detail.name_en ||
                          detail.status_detail.name
                      : detail.is_active
                        ? t("common.active") || "Active"
                        : t("common.inactive") || "Inactive"}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.court_name") || "Court Name"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.court_detail
                    ? locale === "hi"
                      ? detail.court_detail.name
                      : detail.court_detail.name_en || detail.court_detail.name
                    : "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.court_level") || "Court Level"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.court_detail?.level_detail
                    ? locale === "hi"
                      ? detail.court_detail.level_detail.name
                      : detail.court_detail.level_detail.name_en ||
                        detail.court_detail.level_detail.name
                    : "-"}
                </span>
              </div>
            </div>
          </section>

          {}
          <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-base font-semibold pb-2 border-b">
              {t("form.geographic_location") || "Geographic Allocation"}
            </div>
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.state_name.label") || "State"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.state_name_en || detail.state_name || "Uttarakhand"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.mandal_name.label") || "Mandal"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.mandal_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.district_name.label") || "District"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.district_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.tehsil_name.label") || "Tehsil"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.tehsil_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.pargana_name.label") || "Pargana"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.pargana_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.ricircle_name.label") || "RI Circle"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.ricircle_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.rsicircle_name.label") || "RSI Circle (Lekhpal)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.rsicircle_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("location.village_name.label") || "Village"}
                </span>
                {detail.villages && detail.villages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {detail.villages.map((v: any, i: number) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="text-xs font-medium"
                      >
                        {v.village_name ||
                          v.village_name_en ||
                          v.village_code_census}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-foreground font-medium mt-0.5">
                    {detail.village_name || "-"}
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>

        {}
        <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
          <Button
            variant="outline"
            type="button"
            className="px-6"
            onClick={onClose}
          >
            {t("common_button.close.label") || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};
export const SystemUserEditForm = ({
  username,
  onSuccess,
  onCancel,
}: {
  username: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const { t, locale } = useTranslation();

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

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof SystemUserSchema>>({
    resolver: zodResolver(SystemUserSchema) as any,
    values: {
      name: detail?.name ?? "",
      phone: detail?.phone ?? "",
      email: detail?.email ?? "",
      employee_id: detail?.employee_id ?? "",
      role: detail?.role ?? (undefined as any),
      court: null,
      is_active:
        detail?.status !== undefined && detail?.status !== null
          ? String(detail.status)
          : detail?.is_active !== undefined
            ? detail.is_active
              ? "13"
              : "14"
            : "",
      status: "",
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["SYSTEM_USER_UPDATE"],
    mutationFn: ({ username, data }: { username: string; data: any }) =>
      UserUpdateService(username, data),
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "System user updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["USER_LIST"] });
      onSuccess?.();
    },
    onError: (err: any) => {
      applyBackendErrors(
        form,
        err.errors,
        err.message || "Failed to update system user",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof SystemUserSchema>) => {
    const { is_active, status, ...rest } = data as any;
    const isBooleanValue = is_active === "true" || is_active === "false";

    const currentStatusVal =
      detail?.status !== undefined && detail?.status !== null
        ? String(detail.status)
        : detail?.is_active !== undefined
          ? detail.is_active
            ? "13"
            : "14"
          : "";

    const isStatusChanged = is_active !== currentStatusVal;

    const payload = {
      ...rest,
      ...(isStatusChanged
        ? isBooleanValue
          ? { is_active: is_active === "true" }
          : { status: is_active }
        : {}),
    };
    console.log("SystemUserEditForm onSubmit payload:", payload);
    mutation.mutate({
      username,
      data: payload,
    });
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("system_user.edit.title") || "Edit System User"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("system_user.edit.description") ||
                    "Modify system administrator account details"}
                </p>
              </div>
            </div>

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <TextFieldV2
                  required
                  control={form.control}
                  name="name"
                  label={t("basicInfo.name") || "Full Name"}
                  placeholder={
                    t("form.enter_name_placeholder") || "Enter full name"
                  }
                />

                <TextFieldV2
                  required
                  control={form.control}
                  name="phone"
                  label={t("basicInfo.phone") || "Phone Number"}
                  placeholder={
                    t("form.enter_phone_placeholder") ||
                    "Enter 10-digit mobile number"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="email"
                  label={t("basicInfo.email") || "Email Address"}
                  placeholder={
                    t("form.enter_email_placeholder") || "Enter email address"
                  }
                />

                <TextFieldV2
                  control={form.control}
                  name="employee_id"
                  label={t("basicInfo.employeeId") || "Employee ID"}
                  placeholder={
                    t("form.enter_employee_id_placeholder") ||
                    "Enter employee ID"
                  }
                />

                <div className="md:col-span-2">
                  <AutocompleteField
                    control={form.control as any}
                    name="is_active"
                    label={t("table.status") || "Status"}
                    placeholder={t("form.select_status") || "Select Status"}
                    options={statusOptions}
                    loading={statusListQuery.isLoading}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {t("common_button.cancel.label") || "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.save.label") || "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const SystemUserViewForm = ({
  username,
  onClose,
}: {
  username: string;
  onClose?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("form.not_found") || "User details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {t("system_user.view.title") || "View System User"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {t("system_user.view.description") ||
                  "System administrator profile and account details"}
              </p>
            </div>
          </div>

          <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-base font-semibold pb-2 border-b">
              {t("form.basic_information") || "Basic Information"}
            </div>
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.username") || "Username"}
                </span>
                <span className="text-foreground font-mono font-semibold mt-0.5">
                  {detail.username || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.name") || "Full Name"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.phone") || "Phone Number"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.phone || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.email") || "Email Address"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.email || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.employeeId") || "Employee ID"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.employee_id || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.status") || "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={
                      detail.status_detail?.code === "USER_ACTIVE"
                        ? "success"
                        : detail.status_detail?.code === "USER_PENDING"
                          ? "warning"
                          : detail.status_detail?.code === "USER_SUSPENDED" ||
                              detail.status_detail?.code === "USER_REJECTED"
                            ? "error"
                            : detail.is_active
                              ? "success"
                              : "neutral"
                    }
                  >
                    {detail.status_detail
                      ? locale === "hi"
                        ? detail.status_detail.name
                        : detail.status_detail.name_en ||
                          detail.status_detail.name
                      : detail.is_active
                        ? t("common.active") || "Active"
                        : t("common.inactive") || "Inactive"}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.regDate") || "Registration Date"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.created_at
                    ? new Date(detail.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
          <Button
            variant="outline"
            type="button"
            className="px-6"
            onClick={onClose}
          >
            {t("common_button.close.label") || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};
export const CitizenEditForm = ({
  username,
  onSuccess,
  onCancel,
}: {
  username: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const statusListQuery = useStatusList({ "filters[type]": "USER" });
  const rolesData = useRoleList();

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

  const roleOptions = useMemo(() => {
    const list = rolesData.data?.result?.data || rolesData.data;
    if (Array.isArray(list)) {
      return list
        .filter((item: any) => item.code === "CT" || item.code === "AD")
        .map((item: any) => ({
          label: locale === "hi" ? item.name : item.name_en || item.name,
          value: item.id,
        }));
    }
    return [];
  }, [rolesData.data, locale]);

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof CitizenSchema>>({
    resolver: zodResolver(CitizenSchema),
    values: {
      is_active:
        detail?.status !== undefined && detail?.status !== null
          ? String(detail.status)
          : detail?.is_active !== undefined
            ? detail.is_active
              ? "13"
              : "14"
            : "",
      status: "",
      role: detail?.role ?? (undefined as any),
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["CITIZEN_STATUS_UPDATE"],
    mutationFn: ({ username, data }: { username: string; data: any }) =>
      UserUpdateService(username, data),
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Citizen updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["USER_LIST"],
      });
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to update citizen details");
    },
  });

  const onSubmit = (data: z.infer<typeof CitizenSchema>) => {
    const { is_active, role } = data;
    const isBooleanValue = is_active === "true" || is_active === "false";

    const currentStatusVal =
      detail?.status !== undefined && detail?.status !== null
        ? String(detail.status)
        : detail?.is_active !== undefined
          ? detail.is_active
            ? "13"
            : "14"
          : "";

    const isStatusChanged = is_active !== currentStatusVal;
    const isRoleChanged = role !== detail?.role;

    if (isStatusChanged || isRoleChanged) {
      const payload = {
        ...(isStatusChanged
          ? isBooleanValue
            ? { is_active: is_active === "true" }
            : { status: is_active }
          : {}),
        ...(isRoleChanged ? { role } : {}),
      };

      mutation.mutate({
        username,
        data: payload,
      });
    } else {
      onSuccess?.();
    }
  };

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("form.not_found") || "Citizen details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  {t("citizen.edit.title") || "Edit Citizen"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("citizen.edit.description") ||
                    "Review citizen details and manage user account active status and role."}
                </p>
              </div>
            </div>

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("basicInfo.name") || "Name"}
                  </span>
                  <span className="text-foreground font-semibold mt-0.5">
                    {detail.name || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("basicInfo.username") || "Username"}
                  </span>
                  <span className="text-foreground font-mono font-semibold mt-0.5">
                    {detail.username || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("basicInfo.phone") || "Phone Number"}
                  </span>
                  <span className="text-foreground font-medium mt-0.5">
                    {detail.phone || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("basicInfo.email") || "Email"}
                  </span>
                  <span className="text-foreground font-medium mt-0.5">
                    {detail.email || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("basicInfo.gender") || "Gender"}
                  </span>
                  <span className="text-foreground font-medium mt-0.5 capitalize">
                    {detail.gender_name || detail.gender || "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("table.regDate") || "Reg Date"}
                  </span>
                  <span className="text-foreground font-medium mt-0.5">
                    {detail.created_at
                      ? new Date(detail.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("table.status") || "Current Status"}
                  </span>
                  <span className="mt-0.5">
                    <StatusBadge
                      variant={detail.is_active ? "success" : "neutral"}
                    >
                      {detail.is_active
                        ? t("common.active") || "Active"
                        : t("common.inactive") || "Inactive"}
                    </StatusBadge>
                  </span>
                </div>
              </div>
            </section>

            {(detail.district_name ||
              detail.tehsil_name ||
              detail.village_name) && (
              <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
                <div className="text-base font-semibold pb-2 border-b">
                  {t("form.geographic_location") || "Geographic Location"}
                </div>
                <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                  {detail.district_name && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("location.district_name.label") || "District"}
                      </span>
                      <span className="text-foreground font-medium mt-0.5">
                        {detail.district_name_en || detail.district_name || "-"}
                      </span>
                    </div>
                  )}

                  {detail.tehsil_name && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("location.tehsil_name.label") || "Tehsil"}
                      </span>
                      <span className="text-foreground font-medium mt-0.5">
                        {detail.tehsil_name_en || detail.tehsil_name || "-"}
                      </span>
                    </div>
                  )}

                  {detail.village_name && (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium">
                        {t("location.village_name.label") || "Village"}
                      </span>
                      <span className="text-foreground font-medium mt-0.5">
                        {detail.village_name_en || detail.village_name || "-"}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.account_management") || "Account Management"}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <AutocompleteField
                  control={form.control as any}
                  name="is_active"
                  label={t("table.status") || "Status"}
                  placeholder={t("form.select_status") || "Select Status"}
                  options={statusOptions}
                  loading={statusListQuery.isLoading}
                />

                <AutocompleteField
                  control={form.control as any}
                  name="role"
                  label={t("basicInfo.role") || "Role"}
                  placeholder={t("form.select_role") || "Select Role"}
                  options={roleOptions}
                  loading={rolesData.isLoading}
                />
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {t("common_button.cancel.label") || "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? t("common_button.saving.label") || "Saving..."
                  : t("common_button.save.label") || "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};
export const CitizenViewForm = ({
  username,
  onClose,
}: {
  username: string;
  onClose?: () => void;
}) => {
  const { t, locale } = useTranslation();

  const { data: detailData, isLoading: detailLoading } =
    useUserDetail(username);
  const detail = detailData?.result?.data;

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("form.not_found") || "Citizen details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {t("citizen.view.title") || "View Citizen User"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {t("citizen.view.description") ||
                  "Citizen profile and account details"}
              </p>
            </div>
          </div>

          <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-base font-semibold pb-2 border-b">
              {t("form.basic_information") || "Basic Information"}
            </div>
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.username") || "Username"}
                </span>
                <span className="text-foreground font-mono font-semibold mt-0.5">
                  {detail.username || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.name") || "Full Name"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.phone") || "Phone Number"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.phone || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.email") || "Email Address"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.email || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.gender") || "Gender"}
                </span>
                <span className="text-foreground font-medium mt-0.5 capitalize">
                  {detail.gender_name || detail.gender || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("basicInfo.role") || "Role"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.role_name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.status") || "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={
                      detail.status_detail?.code === "USER_ACTIVE"
                        ? "success"
                        : detail.status_detail?.code === "USER_PENDING"
                          ? "warning"
                          : detail.status_detail?.code === "USER_SUSPENDED" ||
                              detail.status_detail?.code === "USER_REJECTED"
                            ? "error"
                            : detail.is_active
                              ? "success"
                              : "neutral"
                    }
                  >
                    {detail.status_detail
                      ? locale === "hi"
                        ? detail.status_detail.name
                        : detail.status_detail.name_en ||
                          detail.status_detail.name
                      : detail.is_active
                        ? t("common.active") || "Active"
                        : t("common.inactive") || "Inactive"}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.regDate") || "Registration Date"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.created_at
                    ? new Date(detail.created_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            </div>
          </section>

          {(detail.district_name ||
            detail.tehsil_name ||
            detail.village_name) && (
            <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
              <div className="text-base font-semibold pb-2 border-b">
                {t("form.geographic_location") || "Geographic Location"}
              </div>
              <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                {detail.district_name && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("location.district_name.label") || "District"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5">
                      {detail.district_name_en || detail.district_name || "-"}
                    </span>
                  </div>
                )}

                {detail.tehsil_name && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("location.tehsil_name.label") || "Tehsil"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5">
                      {detail.tehsil_name_en || detail.tehsil_name || "-"}
                    </span>
                  </div>
                )}

                {detail.village_name && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("location.village_name.label") || "Village"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5">
                      {detail.village_name_en || detail.village_name || "-"}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="flex items-center justify-end border-t bg-background px-8 py-4 z-10 relative shrink-0">
          <Button
            variant="outline"
            type="button"
            className="px-6"
            onClick={onClose}
          >
            {t("common_button.close.label") || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
};
