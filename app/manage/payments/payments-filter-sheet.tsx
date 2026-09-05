"use client";

import { useEffect, useMemo } from "react";
import { useTranslation } from "@/i18n";
import { usePaymentModeList, useStatusList } from '@/lib/query';
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
  case_number: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  payment_mode: z.string().optional().nullable(),
  created_from: z.string().optional().nullable(),
  created_to: z.string().optional().nullable(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

interface PaymentsFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: any;
  setQuery: (q: any) => void;
}

export function PaymentsFilterSheet({
  open,
  onOpenChange,
  query,
  setQuery,
}: PaymentsFilterSheetProps) {
  const { t, lang } = useTranslation();
  const locale = (lang as string) || "en";

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: {
      case_number: query.case_number || "",
      status: query.status || "",
      payment_mode: query.payment_mode || "",
      created_from: query.created_from || "",
      created_to: query.created_to || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        case_number: query.case_number || "",
        status: query.status || "",
        payment_mode: query.payment_mode || "",
        created_from: query.created_from || "",
        created_to: query.created_to || "",
      });
    }
  }, [open, query, form]);

  const statusQuery = useStatusList({ "filters[type]": "PAYMENT" });
  const paymentModeQuery = usePaymentModeList();

  const statusOptions = useMemo(() => {
    const list = (statusQuery.data as any)?.result?.data || statusQuery.data;
    if (Array.isArray(list) && list.length > 0) {
      return [...list]
        .sort(
          (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
        )
        .map((item: any) => ({
          label: locale === "hi" ? item.name : item.name_en || item.name,
          value: String(item.code.replace("PAYMENT_", "").toLowerCase()),
        }));
    }

    return [
      { label: locale === "hi" ? "भुगतान किया गया" : "Paid", value: "paid" },
      {
        label: locale === "hi" ? "लंबित / निर्मित" : "Pending",
        value: "created",
      },
      { label: locale === "hi" ? "विफल" : "Failed", value: "failed" },
    ];
  }, [statusQuery.data, locale]);

  const paymentModeOptions = useMemo(() => {
    const list =
      (paymentModeQuery.data as any)?.result?.data || paymentModeQuery.data;
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => ({
        label: locale === "hi" ? item.name : item.name_en || item.name,
        value: String(item.code),
      }));
    }
    return [
      { label: "Online Gateway", value: "ONLINE" },
      { label: "Treasury Challan", value: "OFFLINE_CHALLAN" },
      { label: "Cash / Court Stamp", value: "CASH" },
    ];
  }, [paymentModeQuery.data, locale]);

  const onSubmit = (values: FilterFormValues) => {
    setQuery({
      ...query,
      case_number: values.case_number || undefined,
      status: values.status || undefined,
      payment_mode: values.payment_mode || undefined,
      created_from: values.created_from || undefined,
      created_to: values.created_to || undefined,
      page: 1,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    form.reset({
      case_number: "",
      status: "",
      payment_mode: "",
      created_from: "",
      created_to: "",
    });
    setQuery({
      ...query,
      case_number: undefined,
      status: undefined,
      payment_mode: undefined,
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
          <CustomSheetHeader className="px-6 py-3 border-b shrink-0 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center h-[56px]">
            <h2 className="text-lg font-semibold text-foreground">
              {t("common_button.filter.label") || "Filters"}
            </h2>
          </CustomSheetHeader>

          <CustomSheetBody className="px-6 py-6 space-y-6">
            <div className="space-y-4">
              <TextFieldV2
                control={form.control}
                name="case_number"
                label={t("table.case_number") || "Case Number"}
                placeholder={t("header.search_case") || "Enter case number"}
              />
              <CustomComboboxField
                control={form.control}
                name="status"
                label={t("payments.status") || "Payment Status"}
                options={statusOptions}
                placeholder={t("form.select_status") || "Select Status"}
                loading={(statusQuery as any).isLoading}
              />
              <CustomComboboxField
                control={form.control}
                name="payment_mode"
                label={t("payments.mode") || "Payment Mode"}
                options={paymentModeOptions}
                placeholder={t("payments.mode_placeholder") || "Select Mode"}
                loading={(paymentModeQuery as any).isLoading}
              />
            </div>

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
          </CustomSheetBody>

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
