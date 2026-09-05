"use client";

import { useEffect } from "react";
import { useTranslation } from "@/i18n";
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
import { SortingState } from "@/components/ui/data-grid";

const SortSchema = z.object({
  field: z.string().min(1, "Select field"),
  direction: z.enum(["asc", "desc"]),
});

type SortFormValues = z.infer<typeof SortSchema>;

interface PaymentsSortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
}

export function PaymentsSortSheet({
  open,
  onOpenChange,
  sorting,
  onSortingChange,
}: PaymentsSortSheetProps) {
  const { t } = useTranslation();

  const current = sorting[0];
  const form = useForm<SortFormValues>({
    resolver: zodResolver(SortSchema),
    defaultValues: {
      field: current?.id || "created_at",
      direction: current?.desc ? "desc" : "asc",
    },
  });

  useEffect(() => {
    if (open) {
      const cur = sorting[0];
      form.reset({
        field: cur?.id || "created_at",
        direction: cur?.desc ? "desc" : "asc",
      });
    }
  }, [open, sorting, form]);

  const fieldOptions = [
    { label: t("table.case_number") || "Case Number", value: "object_id" },
    { label: t("payments.description") || "Description", value: "description" },
    { label: t("payments.amount") || "Amount", value: "amount" },
    { label: t("table.case_status") || "Status", value: "status" },
    { label: t("table.createdOn") || "Created At", value: "created_at" },
  ];

  const directionOptions = [
    { label: t("sort.asc") || "Ascending (A → Z, Old → New)", value: "asc" },
    { label: t("sort.desc") || "Descending (Z → A, New → Old)", value: "desc" },
  ];

  const onSubmit = (v: SortFormValues) => {
    onSortingChange([{ id: v.field, desc: v.direction === "desc" }]);
    onOpenChange(false);
  };

  const handleReset = () => {
    form.reset({ field: "created_at", direction: "desc" });
    onSortingChange([{ id: "created_at", desc: true }]);
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
              {t("payments.sort_title") || "Sort Payments"}
            </h2>
          </CustomSheetHeader>

          <CustomSheetBody className="px-6 py-6 space-y-5">
            <CustomComboboxField
              control={form.control}
              name="field"
              label={t("sort.field") || "Sort by"}
              placeholder={t("sort.field_placeholder") || "Select field"}
              options={fieldOptions}
            />
            <CustomComboboxField
              control={form.control}
              name="direction"
              label={t("sort.direction") || "Order"}
              placeholder={t("sort.direction_placeholder") || "Select order"}
              options={directionOptions}
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
