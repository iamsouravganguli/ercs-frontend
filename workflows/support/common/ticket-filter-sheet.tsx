"use client";

import { useEffect, useMemo } from "react";
import { useTranslation } from "@/i18n";
import { useSupportMasterList } from "@/app/administrator/masters/support/query";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
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
  status: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
});

type FilterFormValues = z.infer<typeof FilterSchema>;

interface TicketFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: any;
  setQuery: (q: any) => void;
}

export function TicketFilterSheet({
  open,
  onOpenChange,
  query,
  setQuery,
}: TicketFilterSheetProps) {
  const { t } = useTranslation();

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(FilterSchema),
    defaultValues: {
      status: query.status === "ALL" ? "" : query.status || "",
      priority: query.priority === "ALL" ? "" : query.priority || "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        status: query.status === "ALL" ? "" : query.status || "",
        priority: query.priority === "ALL" ? "" : query.priority || "",
      });
    }
  }, [open, query, form]);

  const prioritiesQuery = useSupportMasterList("support-priorities", {
    limit: 100,
  });
  const statusOptions = useMemo(
    () => [
      { label: t("support.filters.all_statuses") || "All Statuses", value: "" },
      { label: t("support.filters.status_open") || "Open", value: "OPEN" },
      {
        label: t("support.filters.status_in_progress") || "In Progress",
        value: "IN_PROGRESS",
      },
      {
        label: t("support.filters.status_resolved") || "Resolved",
        value: "RESOLVED",
      },
      {
        label: t("support.filters.status_closed") || "Closed",
        value: "CLOSED",
      },
    ],
    [t],
  );

  const priorityOptions = useMemo(() => {
    const list = prioritiesQuery.data?.result?.data || [];
    if (Array.isArray(list) && list.length) {
      return [
        {
          label: t("support.filters.all_priorities") || "All Priorities",
          value: "",
        },
        ...[...list]
          .sort(
            (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0),
          )
          .map((item: any) => ({
            label: item.name || item.name_en || item.code,
            value: String(item.code),
          })),
      ];
    }
    return [
      {
        label: t("support.filters.all_priorities") || "All Priorities",
        value: "",
      },
      { label: t("support.filters.priority_high") || "High", value: "HIGH" },
      {
        label: t("support.filters.priority_medium") || "Medium",
        value: "MEDIUM",
      },
      { label: t("support.filters.priority_low") || "Low", value: "LOW" },
    ];
  }, [t, prioritiesQuery.data]);

  const onSubmit = (values: FilterFormValues) => {
    setQuery({
      ...query,
      status: values.status || "ALL",
      priority: values.priority || "ALL",
      page: 1,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    form.reset({ status: "", priority: "" });
    setQuery({ ...query, status: "ALL", priority: "ALL", page: 1 });
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
          <CustomSheetBody className="px-6 py-6 space-y-5">
            <CustomComboboxField
              control={form.control}
              name="status"
              label={t("support.table.status") || "Status"}
              options={statusOptions}
              placeholder={t("support.filters.all_statuses") || "Select Status"}
            />
            <CustomComboboxField
              control={form.control}
              name="priority"
              label={t("support.table.priority") || "Priority"}
              options={priorityOptions}
              placeholder={
                t("support.filters.all_priorities") || "Select Priority"
              }
              renderOption={(opt) => {
                const isAll = !opt.value;
                if (isAll) return <span className="truncate">{opt.label}</span>;
                const item = (prioritiesQuery.data?.result?.data || []).find(
                  (x: any) =>
                    String(x.code).toUpperCase() ===
                    String(opt.value).toUpperCase(),
                );
                const color =
                  (item as any)?.color_code ||
                  (String(opt.value).toUpperCase() === "HIGH"
                    ? "#DD6B20"
                    : String(opt.value).toUpperCase() === "MEDIUM"
                      ? "#3182CE"
                      : String(opt.value).toUpperCase() === "URGENT"
                        ? "#E53E3E"
                        : "#4A5568");
                return (
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="truncate">{opt.label}</span>
                  </div>
                );
              }}
            />
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
