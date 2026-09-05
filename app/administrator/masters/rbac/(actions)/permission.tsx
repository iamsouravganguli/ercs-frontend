"use client";
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useForm } from "react-hook-form";
import { PermissionSchema } from "../validations";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { useTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import {
  PermissionCreateService,
  PermissionRoleUpdateService,
} from "../services";
import { applyBackendErrors, queryClient } from "@/lib";
import { PermissionDetailResponse } from "../types";
import toast from "react-hot-toast";
import { usePermissionDetail } from "../query";
import { Save } from "lucide-react";

export const PermissionAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  const form = useForm<z.infer<typeof PermissionSchema>>({
    resolver: zodResolver(PermissionSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      value: "",
      description: "",
      ui_path: "",
      match_type: "NONE",
      is_active: false,
      is_display: false,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["PERMISSION_ADD"],
    mutationFn: PermissionCreateService,
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Permission added successfully!");
      queryClient.invalidateQueries({
        queryKey: ["PERMISSION_LIST"],
      });
      onSuccess?.(res);
    },
    onError: (res: PermissionDetailResponse) => {
      applyBackendErrors(
        form,
        res.errors,
        res.message || "Failed to add permission",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof PermissionSchema>) => {
    mutation.mutate(data);
  };

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
              {t("permission.create.title") || "Add Permission"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("permission.section.information") ||
                  "Permission Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={t("form.code.label") || "Code"}
                    placeholder={t("form.code.placeholder") || "Enter code"}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={t("form.name.label") || "Name (Hindi)"}
                    placeholder={
                      t("form.name.placeholder") || "Enter name in Hindi"
                    }
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={t("form.name_en.label") || "Name (English)"}
                    placeholder={
                      t("form.name_en.placeholder") || "Enter name in English"
                    }
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="value"
                    label={t("form.value.label") || "Value"}
                    placeholder={t("form.value.placeholder") || "Enter value"}
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      required
                      control={form.control}
                      name="description"
                      label={t("form.description.label") || "Description"}
                      placeholder={
                        t("form.description.placeholder") || "Enter description"
                      }
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={t("form.is_active.label") || "Active"}
                    />

                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={t("form.is_display.label") || "Visible"}
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

export const PermissionEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();

  const { data: detailData, isLoading: detailLoading } =
    usePermissionDetail(id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof PermissionSchema>>({
    resolver: zodResolver(PermissionSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      value: detail?.value ?? "",
      description: detail?.description ?? "",
      ui_path: detail?.ui_path ?? "",
      match_type: (detail?.match_type as any) ?? "NONE",
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["PERMISSION_UPDATE"],
    mutationFn: ({ variable, id }: { variable?: any; id?: string }) => {
      return PermissionRoleUpdateService(variable, id);
    },
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Permission updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["PERMISSION_LIST"],
      });
      onSuccess?.(res);
    },
    onError: (res: PermissionDetailResponse) => {
      applyBackendErrors(
        form,
        res.errors,
        res.message || "Failed to update permission",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof PermissionSchema>) => {
    mutation.mutate({
      variable: data,
      id,
    });
  };

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        Permission details not found.
      </div>
    );
  }

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
              {t("permission.edit.title") || "Edit Permission"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("permission.section.information") ||
                  "Permission Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={t("form.code.label") || "Code"}
                    placeholder={t("form.code.placeholder") || "Enter code"}
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={t("form.name.label") || "Name (Hindi)"}
                    placeholder={
                      t("form.name.placeholder") || "Enter name in Hindi"
                    }
                  />

                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={t("form.name_en.label") || "Name (English)"}
                    placeholder={
                      t("form.name_en.placeholder") || "Enter name in English"
                    }
                  />

                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="value"
                    label={t("form.value.label") || "Value"}
                    placeholder={t("form.value.placeholder") || "Enter value"}
                  />

                  <div className="md:col-span-2">
                    <TextareaField
                      required
                      control={form.control}
                      name="description"
                      label={t("form.description.label") || "Description"}
                      placeholder={
                        t("form.description.placeholder") || "Enter description"
                      }
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={t("form.is_active.label") || "Active"}
                    />

                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={t("form.is_display.label") || "Visible"}
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

export const PermissionViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { t } = useTranslation();

  const { data: detailData, isLoading: detailLoading } =
    usePermissionDetail(id);
  const detail = detailData?.result?.data;

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("common_status.not_available.label") ||
          "Permission details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("permission.view.title") || "View Permission"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {t("permission.section.details") || "Permission Details"}
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
                  {t("table.value") || "Value"}
                </span>
                <span className="text-foreground font-mono font-semibold mt-0.5">
                  {detail.value || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.name") || "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.name_en") || "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en || "-"}
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

              <div className="flex flex-col md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.description") || "Description"}
                </span>
                <span className="text-foreground mt-0.5 bg-muted/50 p-3 rounded-lg border text-xs leading-relaxed max-w-full wrap-break-word">
                  {detail.description || "-"}
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
