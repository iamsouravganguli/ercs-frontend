"use client";

import { useMemo } from "react";
import { useTranslation } from "@/i18n";
import {
  useQueryParams,
  withDefault,
  StringParam,
  useStatusList,
} from "@/lib";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const FilterSchema = z.object({
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  created_at__gte: z.string().optional().nullable(),
  created_at__lte: z.string().optional().nullable(),
  is_active: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

export default function CitizenUserFilterPage() {
  const { t, locale } = useTranslation();

  const [query] = useQueryParams({
    phone: withDefault(StringParam, ""),
    email: withDefault(StringParam, ""),
    created_at__gte: withDefault(StringParam, ""),
    created_at__lte: withDefault(StringParam, ""),
    is_active: withDefault(StringParam, ""),
    status: withDefault(StringParam, ""),
  });

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: {
      phone: query.phone || "",
      email: query.email || "",
      created_at__gte: query.created_at__gte || "",
      created_at__lte: query.created_at__lte || "",
      is_active: query.is_active || query.status || "",
      status: query.status || query.is_active || "",
    },
  });

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
          type: "APPLY_CITIZEN_FILTERS",
          filters: {
            phone: values.phone || undefined,
            email: values.email || undefined,
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
      window.opener.postMessage({ type: "RESET_CITIZEN_FILTERS" }, "*");
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
              {t("table.status") || "Status"}
            </h2>
            <div className="space-y-4">
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
