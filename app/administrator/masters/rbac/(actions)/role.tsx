"use client";
import React, { useEffect, useState } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { useForm } from "react-hook-form";
import { RoleSchema } from "../validations";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { useTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { RoleUpdateService } from "../services";
import { applyBackendErrors, getLabel, queryClient } from "@/lib";
import { RoleDetailResponse } from "../types";
import toast from "react-hot-toast";
import { usePermissionList, useRoleDetail } from "../query";
import { Save } from "lucide-react";

export const RoleEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [ids, setIds] = useState<number[]>([]);

  const { data: detailData, isLoading: detailLoading } = useRoleDetail(id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof RoleSchema>>({
    resolver: zodResolver(RoleSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      permissions:
        detail?.permissions_detail?.map((item: any) => item.id) ?? [],
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationKey: ["ROLE_UPDATE"],
    mutationFn: ({ variable, id }: { variable?: any; id?: string }) => {
      return RoleUpdateService(variable, id);
    },
    onSuccess: (res) => {
      form.reset();
      toast.success(res.message || "Role updated successfully!");
      queryClient.invalidateQueries({
        queryKey: ["ROLE_LIST"],
      });
      onSuccess?.();
    },
    onError: (res: RoleDetailResponse) => {
      applyBackendErrors(
        form,
        res.errors,
        res.message || "Failed to update role",
      );
    },
  });

  const onSubmit = (data: z.infer<typeof RoleSchema>) => {
    if (id) {
      mutation.mutate({
        variable: data,
        id,
      });
    }
  };

  useEffect(() => {
    if (detail?.permissions_detail) {
      setIds(detail.permissions_detail.map((item: any) => item.id));
    }
  }, [detail]);

  const permissionList = usePermissionList({
    search: search,
    "filters[id__in]": search
      ? undefined
      : ids.length > 0
        ? ids.join(",")
        : undefined,
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
              {t("role.edit.title") || "Edit Role"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("role.section.information") || "Role Information"}
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

                  <div className="md:col-span-2">
                    <MultiAutocompleteField
                      required
                      control={form.control}
                      name="permissions"
                      label={t("form.permissions.label") || "Permissions"}
                      loading={permissionList.isLoading}
                      placeholder={
                        t("form.permissions.placeholder") ||
                        "Select permissions"
                      }
                      options={permissionList.data?.result?.data?.map?.(
                        (item: any) => ({
                          value: item.id,
                          label: getLabel(item),
                        }),
                      )}
                      onSearch={(value) => setSearch(value)}
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

export const RoleViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { t } = useTranslation();

  const { data: detailData, isLoading: detailLoading } = useRoleDetail(id);
  const detail = detailData?.result?.data;

  if (!detail) {
    if (detailLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-destructive">
        {t("common_status.not_available.label") || "Role details not found."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("role.view.title") || "View Role"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {t("role.section.details") || "Role Details"}
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
                  {t("form.permissions.label") || "Permissions"}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {detail.permissions_detail &&
                  detail.permissions_detail.length > 0 ? (
                    detail.permissions_detail.map((perm: any) => (
                      <Badge
                        key={perm.id}
                        variant="outline"
                        className="px-2 py-0.5 font-normal text-xs bg-muted/30"
                      >
                        {getLabel(perm)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {t("common.no_permissions") || "No permissions assigned"}
                    </span>
                  )}
                </div>
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
