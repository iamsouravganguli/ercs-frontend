"use client";
import React, { useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { CourtSchema } from "../validations";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { useTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { CourtCreateService, CourtUpdateService } from "../services";
import { useCourtDetail } from "../query";
import {
  applyBackendErrors,
  getLabel,
  queryClient,
  useCourtLevelList,
} from "@/lib";
import { CourtDetailResponse } from "../types";
import toast from "react-hot-toast";
import { Save } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export const CourtAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof CourtSchema>>({
    resolver: zodResolver(CourtSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      level: NaN,
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["COURT_ADD_MASTER"],
    mutationFn: CourtCreateService,
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message);
      queryClient.invalidateQueries({
        queryKey: ["COURT_LIST_MASTER"],
      });
      onSuccess?.(res);
    },
    onError: (res: CourtDetailResponse) => {
      applyBackendErrors(form, res.errors, res.message);
    },
  });

  const onSubmit = (data: z.infer<typeof CourtSchema>) => {
    mutation.mutate(data);
  };

  const courtLevelList = useCourtLevelList({
    search: search,
    ordering: "display_order",
  });

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("court.create.title") || "Add Court"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <AutocompleteField
                    required
                    control={form.control}
                    name="level"
                    label={t("form.court_level.label")}
                    placeholder={t("form.court_level.placeholder")}
                    options={courtLevelList.data?.result?.data?.map?.(
                      (item) => ({
                        value: item.id,
                        label: getLabel(item, lang),
                      }),
                    )}
                  />

                  <TextFieldV2
                    required
                    type="number"
                    control={form.control}
                    name="display_order"
                    label={t("form.display_order.label")}
                    placeholder={t("form.display_order.placeholder")}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={t("form.code.label")}
                    placeholder={t("form.code.placeholder")}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={t("form.name.label")}
                    placeholder={t("form.name.placeholder")}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={t("form.name_en.label")}
                    placeholder={t("form.name_en.placeholder")}
                  />

                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={t("form.is_active.label")}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={t("form.is_display.label")}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
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

export const CourtEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const [search, setSearch] = useState("");

  const { data: detailData, isLoading: detailLoading } = useCourtDetail(id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof CourtSchema>>({
    resolver: zodResolver(CourtSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      level: detail?.level ?? NaN,
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["COURT_EDIT_MASTER"],
    mutationFn: ({ variable, id }: { variable?: any; id?: string }) => {
      return CourtUpdateService(variable, id);
    },
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message);
      queryClient.invalidateQueries({
        queryKey: ["COURT_LIST_MASTER"],
      });
      onSuccess?.();
    },
    onError: (res: CourtDetailResponse) => {
      applyBackendErrors(form, res.errors, res.message);
    },
  });

  const onSubmit = (data: z.infer<typeof CourtSchema>) => {
    if (id) {
      mutation.mutate({
        variable: data,
        id,
      });
    }
  };

  const courtLevelList = useCourtLevelList({
    search: search,
    ordering: "display_order",
  });

  if (detailLoading) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("court.edit.title") || "Edit Court"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("form.basic_information") || "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <AutocompleteField
                    required
                    control={form.control}
                    name="level"
                    label={t("form.court_level.label")}
                    placeholder={t("form.court_level.placeholder")}
                    options={courtLevelList.data?.result?.data?.map?.(
                      (item) => ({
                        value: item.id,
                        label: getLabel(item, lang),
                      }),
                    )}
                  />

                  <TextFieldV2
                    required
                    type="number"
                    control={form.control}
                    name="display_order"
                    label={t("form.display_order.label")}
                    placeholder={t("form.display_order.placeholder")}
                  />

                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={t("form.code.label")}
                    placeholder={t("form.code.placeholder")}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={t("form.name.label")}
                    placeholder={t("form.name.placeholder")}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={t("form.name_en.label")}
                    placeholder={t("form.name_en.placeholder")}
                  />

                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={t("form.is_active.label")}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={t("form.is_display.label")}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
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

export const CourtViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { t, lang } = useTranslation();

  const { data: detailData, isLoading: detailLoading } = useCourtDetail(id);
  const detail = detailData?.result?.data;

  const courtLevelList = useCourtLevelList({
    ordering: "display_order",
  });

  const courtLevel = courtLevelList.data?.result?.data?.find(
    (item) => item.id === detail?.level,
  );
  const courtLevelLabel = courtLevel ? getLabel(courtLevel, lang) : "-";

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("common_status.not_available.label") || "Court details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("court.view.title") || "View Court"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {t("court.section.details") || "Court Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.code") || "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("form.court_level.label") || "Court Level"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {courtLevelLabel}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("form.name.label") || "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("form.name_en.label") || "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("form.display_order.label") || "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order ?? "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.status") || "Status"}
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

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.visibility") || "Visibility"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.is_display ? "info" : "neutral"}>
                    {detail.is_display
                      ? t("common.visible") || "Visible"
                      : t("common.hidden") || "Hidden"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
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
  );
};
