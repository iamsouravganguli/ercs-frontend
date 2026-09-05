"use client";
import React from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { MultiAutocompleteField } from "@/components/ui/multi-autocomplete-field";
import { useTranslation } from "@/i18n";
import { useMutation } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Save } from "lucide-react";
import toast from "react-hot-toast";
import { applyBackendErrors, getLabel, queryClient } from "@/lib";

import {
  SupportTypeSchema,
  CategorySchema,
  SubCategorySchema,
  PrioritySchema,
  StatusSchema,
  EscalationLevelSchema,
  ResolutionTypeSchema,
} from "../validations";
import { createSupportMasterItem, updateSupportMasterItem } from "../services";
import { useSupportMasterDetail, useSupportMasterList } from "../query";
import { useRoleList } from "../../rbac/query";


export const CategoryAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const form = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-categories", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "कैटेगरी सफलतापूर्वक बनाई गई"
          : "Category created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट कैटेगरी जोड़ें" : "Add Support Category"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड (अद्वितीय)" : "Code (Unique)"}
                    placeholder="e.g., SOFTWARE_BUG"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "कैटेगरी नाम (अंग्रेज़ी)"
                        : "Category Name (English)"
                    }
                    placeholder="e.g., Software Issues"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "कैटेगरी नाम (हिंदी)" : "Category Name (Hindi)"
                    }
                    placeholder="e.g., सॉफ्टवेयर समस्याएं"
                  />
                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const CategoryEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const { data: detailData } = useSupportMasterDetail("support-categories", id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof CategorySchema>>({
    resolver: zodResolver(CategorySchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-categories", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "कैटेगरी सफलतापूर्वक अपडेट की गई"
          : "Category updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट कैटेगरी संपादित करें"
                : "Edit Support Category"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "कैटेगरी नाम (अंग्रेज़ी)"
                        : "Category Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "कैटेगरी नाम (हिंदी)" : "Category Name (Hindi)"
                    }
                  />
                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const CategoryViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-categories",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "कैटेगरी विवरण लोड किया जा रहा है..."
          : "Loading category details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi ? "सपोर्ट कैटेगरी देखें" : "View Support Category"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "कैटेगरी विवरण" : "Category Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "दृश्यता" : "Visibility"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.is_display ? "info" : "neutral"}>
                    {detail.is_display
                      ? isHindi
                        ? "दृश्यमान"
                        : "Visible"
                      : isHindi
                        ? "छिपा हुआ"
                        : "Hidden"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const SubCategoryAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const categoryList = useSupportMasterList("support-categories", {
    limit: 100,
  });

  const form = useForm<z.infer<typeof SubCategorySchema>>({
    resolver: zodResolver(SubCategorySchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      category: NaN,
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-sub-categories", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "सब-कैटेगरी सफलतापूर्वक बनाई गई"
          : "Sub-Category created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट सब-कैटेगरी जोड़ें"
                : "Add Support Sub-Category"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <AutocompleteField
                    required
                    control={form.control}
                    name="category"
                    label={isHindi ? "मूल कैटेगरी" : "Parent Category"}
                    placeholder={isHindi ? "कैटेगरी चुनें" : "Select Category"}
                    options={
                      categoryList.data?.result?.data?.map?.((item: any) => ({
                        value: item.id,
                        label: getLabel(item, lang),
                      })) || []
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={
                      isHindi
                        ? "सब-कैटेगरी कोड (अद्वितीय)"
                        : "Sub-Category Code (Unique)"
                    }
                    placeholder="e.g., RESET_PASSWORD"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "सब-कैटेगरी नाम (अंग्रेज़ी)"
                        : "Sub-Category Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "सब-कैटेगरी नाम (हिंदी)"
                        : "Sub-Category Name (Hindi)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const SubCategoryEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const categoryList = useSupportMasterList("support-categories", {
    limit: 100,
  });
  const { data: detailData } = useSupportMasterDetail(
    "support-sub-categories",
    id,
  );
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof SubCategorySchema>>({
    resolver: zodResolver(SubCategorySchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      category: detail?.category ?? NaN,
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-sub-categories", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "सब-कैटेगरी सफलतापूर्वक अपडेट की गई"
          : "Sub-Category updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट सब-कैटेगरी संपादित करें"
                : "Edit Support Sub-Category"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <AutocompleteField
                    required
                    control={form.control}
                    name="category"
                    label={isHindi ? "मूल कैटेगरी" : "Parent Category"}
                    placeholder={isHindi ? "कैटेगरी चुनें" : "Select Category"}
                    options={
                      categoryList.data?.result?.data?.map?.((item: any) => ({
                        value: item.id,
                        label: getLabel(item, lang),
                      })) || []
                    }
                  />
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "सब-कैटेगरी नाम (अंग्रेज़ी)"
                        : "Sub-Category Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "सब-कैटेगरी नाम (हिंदी)"
                        : "Sub-Category Name (Hindi)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <div className="flex items-center gap-6 pt-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const SubCategoryViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-sub-categories",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "सब-कैटेगरी विवरण लोड किया जा रहा है..."
          : "Loading sub-category details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi ? "सपोर्ट सब-कैटेगरी देखें" : "View Support Sub-Category"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "सब-कैटेगरी विवरण" : "Sub-Category Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 gap-y-4 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "मूल कैटेगरी" : "Parent Category"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.category_detail
                    ? getLabel(detail.category_detail, lang)
                    : isHindi
                      ? "सामान्य"
                      : "General"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "दृश्यता" : "Visibility"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.is_display ? "info" : "neutral"}>
                    {detail.is_display
                      ? isHindi
                        ? "दृश्यमान"
                        : "Visible"
                      : isHindi
                        ? "छिपा हुआ"
                        : "Hidden"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-end justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const PriorityAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const form = useForm<z.infer<typeof PrioritySchema>>({
    resolver: zodResolver(PrioritySchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      color_code: "#E53E3E",
      response_time_hours: 2,
      response_time_unit: "hours",
      resolution_time_hours: 24,
      resolution_time_unit: "hours",
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-priorities", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "प्राथमिकता सफलतापूर्वक बनाई गई"
          : "Priority created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट प्राथमिकता जोड़ें" : "Add Support Priority"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={
                      isHindi
                        ? "प्राथमिकता कोड (अद्वितीय)"
                        : "Priority Code (Unique)"
                    }
                    placeholder="e.g., CRITICAL"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "प्राथमिकता नाम (अंग्रेज़ी)"
                        : "Priority Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "प्राथमिकता नाम (हिंदी)"
                        : "Priority Name (Hindi)"
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <TextFieldV2
                      required
                      control={form.control}
                      name="response_time_hours"
                      type="number"
                      label={isHindi ? "प्रतिक्रिया SLA" : "Response SLA Value"}
                    />
                    <AutocompleteField
                      required
                      control={form.control}
                      name="response_time_unit"
                      label={
                        isHindi ? "प्रतिक्रिया SLA इकाई" : "Response SLA Unit"
                      }
                      placeholder={isHindi ? "इकाई चुनें" : "Select Unit"}
                      options={[
                        {
                          value: "minutes",
                          label: isHindi ? "मिनट (Minutes)" : "Minutes",
                        },
                        {
                          value: "hours",
                          label: isHindi ? "घंटे (Hours)" : "Hours",
                        },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <TextFieldV2
                      required
                      control={form.control}
                      name="resolution_time_hours"
                      type="number"
                      label={isHindi ? "समाधान SLA" : "Resolution SLA Value"}
                    />
                    <AutocompleteField
                      required
                      control={form.control}
                      name="resolution_time_unit"
                      label={
                        isHindi ? "समाधान SLA इकाई" : "Resolution SLA Unit"
                      }
                      placeholder={isHindi ? "इकाई चुनें" : "Select Unit"}
                      options={[
                        {
                          value: "minutes",
                          label: isHindi ? "मिनट (Minutes)" : "Minutes",
                        },
                        {
                          value: "hours",
                          label: isHindi ? "घंटे (Hours)" : "Hours",
                        },
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {isHindi ? "हेक्स रंग कोड" : "Hex Color Code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-9 p-1 rounded-md shrink-0 border cursor-pointer bg-background"
                        value={form.watch("color_code") || "#E53E3E"}
                        onChange={(e) =>
                          form.setValue(
                            "color_code",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                      <TextFieldV2
                        required
                        control={form.control}
                        name="color_code"
                        placeholder="#E53E3E"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const PriorityEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const { data: detailData } = useSupportMasterDetail("support-priorities", id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof PrioritySchema>>({
    resolver: zodResolver(PrioritySchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      color_code: detail?.color_code ?? "#E53E3E",
      response_time_hours: detail?.response_time_hours ?? 2,
      response_time_unit: detail?.response_time_unit ?? "hours",
      resolution_time_hours: detail?.resolution_time_hours ?? 24,
      resolution_time_unit: detail?.resolution_time_unit ?? "hours",
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-priorities", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "प्राथमिकता सफलतापूर्वक अपडेट की गई"
          : "Priority updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट प्राथमिकता संपादित करें"
                : "Edit Support Priority"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "प्राथमिकता नाम (अंग्रेज़ी)"
                        : "Priority Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "प्राथमिकता नाम (हिंदी)"
                        : "Priority Name (Hindi)"
                    }
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <TextFieldV2
                      required
                      control={form.control}
                      name="response_time_hours"
                      type="number"
                      label={isHindi ? "प्रतिक्रिया SLA" : "Response SLA Value"}
                    />
                    <AutocompleteField
                      required
                      control={form.control}
                      name="response_time_unit"
                      label={
                        isHindi ? "प्रतिक्रिया SLA इकाई" : "Response SLA Unit"
                      }
                      placeholder={isHindi ? "इकाई चुनें" : "Select Unit"}
                      options={[
                        {
                          value: "minutes",
                          label: isHindi ? "मिनट (Minutes)" : "Minutes",
                        },
                        {
                          value: "hours",
                          label: isHindi ? "घंटे (Hours)" : "Hours",
                        },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <TextFieldV2
                      required
                      control={form.control}
                      name="resolution_time_hours"
                      type="number"
                      label={isHindi ? "समाधान SLA" : "Resolution SLA Value"}
                    />
                    <AutocompleteField
                      required
                      control={form.control}
                      name="resolution_time_unit"
                      label={
                        isHindi ? "समाधान SLA इकाई" : "Resolution SLA Unit"
                      }
                      placeholder={isHindi ? "इकाई चुनें" : "Select Unit"}
                      options={[
                        {
                          value: "minutes",
                          label: isHindi ? "मिनट (Minutes)" : "Minutes",
                        },
                        {
                          value: "hours",
                          label: isHindi ? "घंटे (Hours)" : "Hours",
                        },
                      ]}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {isHindi ? "हेक्स रंग कोड" : "Hex Color Code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-9 p-1 rounded-md shrink-0 border cursor-pointer bg-background"
                        value={form.watch("color_code") || "#E53E3E"}
                        onChange={(e) =>
                          form.setValue(
                            "color_code",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                      <TextFieldV2
                        required
                        control={form.control}
                        name="color_code"
                        placeholder="#E53E3E"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const PriorityViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-priorities",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "प्राथमिकता विवरण लोड किया जा रहा है..."
          : "Loading priority details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi ? "सपोर्ट प्राथमिकता देखें" : "View Support Priority"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "प्राथमिकता विवरण" : "Priority Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रतिक्रिया SLA" : "Response SLA"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.response_time_hours}{" "}
                  {detail.response_time_unit === "minutes"
                    ? isHindi
                      ? "मिनट"
                      : "Minutes"
                    : isHindi
                      ? "घंटे"
                      : "Hours"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "समाधान SLA" : "Resolution SLA"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.resolution_time_hours}{" "}
                  {detail.resolution_time_unit === "minutes"
                    ? isHindi
                      ? "मिनट"
                      : "Minutes"
                    : isHindi
                      ? "घंटे"
                      : "Hours"}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "रंग नमूना" : "Color Swatch"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-300"
                    style={{ backgroundColor: detail.color_code }}
                  />
                  <code className="text-xs font-mono uppercase">
                    {detail.color_code}
                  </code>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const StatusAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const form = useForm<z.infer<typeof StatusSchema>>({
    resolver: zodResolver(StatusSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      color_code: "#4A5568",
      is_initial: false,
      is_terminal: false,
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-statuses", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "स्थिति सफलतापूर्वक बनाई गई"
          : "Status created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट स्थिति जोड़ें" : "Add Support Status"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={
                      isHindi ? "स्थिति कोड (अद्वितीय)" : "Status Code (Unique)"
                    }
                    placeholder="e.g., IN_PROGRESS"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "स्थिति नाम (अंग्रेज़ी)"
                        : "Status Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "स्थिति नाम (हिंदी)" : "Status Name (Hindi)"
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {isHindi ? "हेक्स रंग कोड" : "Hex Color Code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-9 p-1 rounded-md shrink-0 border cursor-pointer bg-background"
                        value={form.watch("color_code") || "#4A5568"}
                        onChange={(e) =>
                          form.setValue(
                            "color_code",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                      <TextFieldV2
                        required
                        control={form.control}
                        name="color_code"
                        placeholder="#4A5568"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <CheckboxField
                      control={form.control}
                      name="is_initial"
                      label={
                        isHindi
                          ? "क्या यह प्रारंभिक स्थिति है?"
                          : "Is Initial State"
                      }
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_terminal"
                      label={
                        isHindi
                          ? "क्या यह अंतिम स्थिति है?"
                          : "Is Terminal State"
                      }
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-2 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const StatusEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const { data: detailData } = useSupportMasterDetail("support-statuses", id);
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof StatusSchema>>({
    resolver: zodResolver(StatusSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      color_code: detail?.color_code ?? "#4A5568",
      is_initial: detail?.is_initial ?? false,
      is_terminal: detail?.is_terminal ?? false,
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-statuses", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "स्थिति सफलतापूर्वक अपडेट की गई"
          : "Status updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट स्थिति संपादित करें" : "Edit Support Status"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "स्थिति नाम (अंग्रेज़ी)"
                        : "Status Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "स्थिति नाम (हिंदी)" : "Status Name (Hindi)"
                    }
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      {isHindi ? "हेक्स रंग कोड" : "Hex Color Code"}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="w-12 h-9 p-1 rounded-md shrink-0 border cursor-pointer bg-background"
                        value={form.watch("color_code") || "#4A5568"}
                        onChange={(e) =>
                          form.setValue(
                            "color_code",
                            e.target.value.toUpperCase(),
                          )
                        }
                      />
                      <TextFieldV2
                        required
                        control={form.control}
                        name="color_code"
                        placeholder="#4A5568"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <CheckboxField
                      control={form.control}
                      name="is_initial"
                      label={
                        isHindi
                          ? "क्या यह प्रारंभिक स्थिति है?"
                          : "Is Initial State"
                      }
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_terminal"
                      label={
                        isHindi
                          ? "क्या यह अंतिम स्थिति है?"
                          : "Is Terminal State"
                      }
                    />
                  </div>
                  <div className="flex items-center gap-6 pt-2 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const StatusViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-statuses",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "स्थिति विवरण लोड किया जा रहा है..."
          : "Loading status details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi ? "सपोर्ट स्थिति देखें" : "View Support Status"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "स्थिति विवरण" : "Status Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रारंभिक स्थिति" : "Is Initial State"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.is_initial ? "info" : "neutral"}>
                    {detail.is_initial
                      ? isHindi
                        ? "प्रारंभिक स्थिति"
                        : "Initial State"
                      : isHindi
                        ? "नहीं"
                        : "No"}
                  </StatusBadge>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "अंतिम स्थिति" : "Is Terminal State"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_terminal ? "success" : "neutral"}
                  >
                    {detail.is_terminal
                      ? isHindi
                        ? "अंतिम (SLA बंद)"
                        : "Terminal (SLA Off)"
                      : isHindi
                        ? "नहीं"
                        : "No"}
                  </StatusBadge>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "बैज रंग" : "Badge Color"}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: detail.color_code }}
                  />
                  <code className="text-xs font-mono uppercase">
                    {detail.color_code}
                  </code>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const EscalationLevelAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const form = useForm<z.infer<typeof EscalationLevelSchema>>({
    resolver: zodResolver(EscalationLevelSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      level_number: 1,
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-escalation-levels", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "एस्केलेशन स्तर सफलतापूर्वक बनाया गया"
          : "Escalation Level created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट एस्केलेशन स्तर जोड़ें"
                : "Add Support Escalation Level"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={
                      isHindi
                        ? "एस्केलेशन कोड (अद्वितीय)"
                        : "Escalation Code (Unique)"
                    }
                    placeholder="e.g., L1_SUPERVISOR"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "स्तर का नाम (अंग्रेज़ी)"
                        : "Level Name (English)"
                    }
                    placeholder="e.g., L1 - Supervisor"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "स्तर का नाम (हिंदी)" : "Level Name (Hindi)"
                    }
                    placeholder="e.g., एल1 - पर्यवेक्षक"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="level_number"
                    type="number"
                    label={
                      isHindi ? "स्तर संख्या (1 - 4)" : "Level Number (1 - 4)"
                    }
                  />
                  <div className="flex items-center gap-6 pt-6 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const EscalationLevelEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const { data: detailData } = useSupportMasterDetail(
    "support-escalation-levels",
    id,
  );
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof EscalationLevelSchema>>({
    resolver: zodResolver(EscalationLevelSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      level_number: detail?.level_number ?? 1,
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-escalation-levels", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "एस्केलेशन स्तर सफलतापूर्वक अपडेट किया गया"
          : "Escalation Level updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट एस्केलेशन स्तर संपादित करें"
                : "Edit Support Escalation Level"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "स्तर का नाम (अंग्रेज़ी)"
                        : "Level Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi ? "स्तर का नाम (हिंदी)" : "Level Name (Hindi)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="level_number"
                    type="number"
                    label={
                      isHindi ? "स्तर संख्या (1 - 4)" : "Level Number (1 - 4)"
                    }
                  />
                  <div className="flex items-center gap-6 pt-6 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const EscalationLevelViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-escalation-levels",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "एस्केलेशन स्तर विवरण लोड किया जा रहा है..."
          : "Loading escalation level details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi
            ? "सपोर्ट एस्केलेशन स्तर देखें"
            : "View Support Escalation Level"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "एस्केलेशन स्तर विवरण" : "Escalation Level Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्तर संख्या (गहराई)" : "Level Number (Depth)"}
                </span>
                <span className="text-foreground font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                  L{detail.level_number}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const ResolutionTypeAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const form = useForm<z.infer<typeof ResolutionTypeSchema>>({
    resolver: zodResolver(ResolutionTypeSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      description: "",
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      createSupportMasterItem("support-resolution-types", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "समाधान प्रकार सफलतापूर्वक बनाया गया"
          : "Resolution Type created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट समाधान प्रकार जोड़ें"
                : "Add Support Resolution Type"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={
                      isHindi
                        ? "समाधान कोड (अद्वितीय)"
                        : "Resolution Code (Unique)"
                    }
                    placeholder="e.g., DATA_CORRECTED"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "समाधान का नाम (अंग्रेज़ी)"
                        : "Resolution Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "समाधान का नाम (हिंदी)"
                        : "Resolution Name (Hindi)"
                    }
                  />
                  <TextFieldV2
                    control={form.control}
                    name="description"
                    label={isHindi ? "विवरण" : "Description"}
                    placeholder={
                      isHindi
                        ? "अतिरिक्त विवरण प्रदान करें..."
                        : "Provide extra metadata..."
                    }
                    className="col-span-2"
                  />
                  <div className="flex items-center gap-6 pt-6 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const ResolutionTypeEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const { data: detailData } = useSupportMasterDetail(
    "support-resolution-types",
    id,
  );
  const detail = detailData?.result?.data;

  const form = useForm<z.infer<typeof ResolutionTypeSchema>>({
    resolver: zodResolver(ResolutionTypeSchema) as any,
    values: {
      code: detail?.code ?? "",
      name: detail?.name ?? "",
      name_en: detail?.name_en ?? "",
      description: detail?.description ?? "",
      display_order: detail?.display_order ?? 1,
      is_active: detail?.is_active ?? true,
      is_display: detail?.is_display ?? true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-resolution-types", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "समाधान प्रकार सफलतापूर्वक अपडेट किया गया"
          : "Resolution Type updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi
                ? "सपोर्ट समाधान प्रकार संपादित करें"
                : "Edit Support Resolution Type"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi ? "मूल जानकारी" : "Basic Information"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    readonly
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड" : "Code"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi
                        ? "समाधान का नाम (अंग्रेज़ी)"
                        : "Resolution Name (English)"
                    }
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={
                      isHindi
                        ? "समाधान का नाम (हिंदी)"
                        : "Resolution Name (Hindi)"
                    }
                  />
                  <TextFieldV2
                    control={form.control}
                    name="description"
                    label={isHindi ? "विवरण" : "Description"}
                    className="col-span-2"
                  />
                  <div className="flex items-center gap-6 pt-6 col-span-2">
                    <CheckboxField
                      control={form.control}
                      name="is_active"
                      label={isHindi ? "सक्रिय" : "Active"}
                    />
                    <CheckboxField
                      control={form.control}
                      name="is_display"
                      label={isHindi ? "दृश्यमान" : "Visible"}
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
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const ResolutionTypeViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-resolution-types",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="p-6 text-center text-sm">
        {isHindi
          ? "समाधान प्रकार विवरण लोड किया जा रहा है..."
          : "Loading resolution type details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi
            ? "सपोर्ट समाधान प्रकार देखें"
            : "View Support Resolution Type"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "समाधान विवरण" : "Resolution Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "विवरण" : "Description"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.description || "-"}
                </span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};


export const SupportTypeAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const rolesQuery = useRoleList({ limit: 100 });
  const rawRoles =
    rolesQuery.data?.result?.data || rolesQuery.data?.result || [];
  const rolesList = Array.isArray(rawRoles) ? rawRoles : [];

  const form = useForm<z.infer<typeof SupportTypeSchema>>({
    resolver: zodResolver(SupportTypeSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      roles: [],
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: (data: any) => createSupportMasterItem("support-types", data),
    onSuccess: (res) => {
      form.reset();
      toast.success(
        lang === "hi"
          ? "सपोर्ट टाइप सफलतापूर्वक बनाया गया"
          : "Support Type created successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      if (window.opener) {
        window.opener.postMessage("REFRESH_SUPPORT_MASTER_LIST", "*");
      }
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col font-sans">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट टाइप जोड़ें" : "Add Support Type"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi
                  ? "मूल जानकारी और लक्षित भूमिकाएँ"
                  : "Basic Information & Target Roles"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड (अद्वितीय)" : "Code (Unique)"}
                    placeholder="e.g., TECHNICAL_SUPPORT"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi ? "टाइप नाम (अंग्रेज़ी)" : "Type Name (English)"
                    }
                    placeholder="e.g., Technical Support"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={isHindi ? "टाइप नाम (हिंदी)" : "Type Name (Hindi)"}
                    placeholder="e.g., तकनीकी सहायता"
                  />
                </div>

                {}
                <div className="pt-2">
                  <MultiAutocompleteField
                    control={form.control}
                    name="roles"
                    label={
                      isHindi
                        ? "लक्षित उपयोगकर्ता भूमिकाएँ"
                        : "Target User Roles"
                    }
                    description={
                      isHindi
                        ? "चयनित भूमिकाओं वाले उपयोगकर्ताओं को टिकट दर्ज करते समय यह सपोर्ट टाइप दिखाई देगा। (सभी भूमिकाओं के लिए अचयनित छोड़ें)।"
                        : "Users with the selected roles will see this Support Type when filing tickets. (Leave unselected for All Roles)."
                    }
                    placeholder={
                      isHindi ? "भूमिकाएँ चुनें..." : "Select roles..."
                    }
                    loading={rolesQuery.isLoading}
                    options={rolesList.map((r: any) => ({
                      label: getLabel(r, lang),
                      value: Number(r.id),
                    }))}
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <CheckboxField
                    control={form.control}
                    name="is_active"
                    label={isHindi ? "सक्रिय" : "Active"}
                  />
                  <CheckboxField
                    control={form.control}
                    name="is_display"
                    label={isHindi ? "दृश्यमान" : "Visible"}
                  />
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0 font-sans">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const SupportTypeEditForm = ({
  id,
  onSuccess,
  onCancel,
}: {
  id: string;
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t, lang } = useTranslation();
  const detailQuery = useSupportMasterDetail("support-types", id);
  const detail = detailQuery.data?.result?.data;

  const rolesQuery = useRoleList({ limit: 100 });
  const rawRoles =
    rolesQuery.data?.result?.data || rolesQuery.data?.result || [];
  const rolesList = Array.isArray(rawRoles) ? rawRoles : [];

  const form = useForm<z.infer<typeof SupportTypeSchema>>({
    resolver: zodResolver(SupportTypeSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      name_en: "",
      roles: [],
      display_order: 1,
      is_active: true,
      is_display: true,
    },
    mode: "onChange",
  });

  React.useEffect(() => {
    if (detail) {
      const initialRoleIds = (detail.roles || detail.role_details || []).map(
        (r: any) => (typeof r === "object" ? Number(r.id) : Number(r)),
      );

      form.reset({
        code: detail.code || "",
        name: detail.name || "",
        name_en: detail.name_en || "",
        roles: initialRoleIds,
        display_order: detail.display_order ?? 1,
        is_active: detail.is_active ?? true,
        is_display: detail.is_display ?? true,
      });
    }
  }, [detail, form]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      updateSupportMasterItem("support-types", id, data),
    onSuccess: (res) => {
      toast.success(
        lang === "hi"
          ? "सपोर्ट टाइप सफलतापूर्वक अपडेट किया गया"
          : "Support Type updated successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["SUPPORT_MASTER_LIST"] });
      if (window.opener) {
        window.opener.postMessage("REFRESH_SUPPORT_MASTER_LIST", "*");
      }
      onSuccess?.(res);
    },
    onError: (err: any) => {
      applyBackendErrors(form, err?.errors, err?.message);
    },
  });

  const isHindi = lang === "hi";

  if (detailQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-xs text-muted-foreground italic animate-pulse">
        {isHindi
          ? "सपोर्ट टाइप विवरण लोड किया जा रहा है..."
          : "Loading support type details..."}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col font-sans">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {isHindi ? "सपोर्ट टाइप संपादित करें" : "Edit Support Type"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {isHindi
                  ? "मूल जानकारी और लक्षित भूमिकाएँ"
                  : "Basic Information & Target Roles"}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="code"
                    label={isHindi ? "कोड (अद्वितीय)" : "Code (Unique)"}
                    placeholder="e.g., TECHNICAL_SUPPORT"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="display_order"
                    type="number"
                    label={isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name_en"
                    label={
                      isHindi ? "टाइप नाम (अंग्रेज़ी)" : "Type Name (English)"
                    }
                    placeholder="e.g., Technical Support"
                  />
                  <TextFieldV2
                    required
                    control={form.control}
                    name="name"
                    label={isHindi ? "टाइप नाम (हिंदी)" : "Type Name (Hindi)"}
                    placeholder="e.g., तकनीकी सहायता"
                  />
                </div>

                {}
                <div className="pt-2">
                  <MultiAutocompleteField
                    control={form.control}
                    name="roles"
                    label={
                      isHindi
                        ? "लक्षित उपयोगकर्ता भूमिकाएँ"
                        : "Target User Roles"
                    }
                    description={
                      isHindi
                        ? "चयनित भूमिकाओं वाले उपयोगकर्ताओं को टिकट दर्ज करते समय यह सपोर्ट टाइप दिखाई देगा। (सभी भूमिकाओं के लिए अचयनित छोड़ें)।"
                        : "Users with the selected roles will see this Support Type when filing tickets. (Leave unselected for All Roles)."
                    }
                    placeholder={
                      isHindi ? "भूमिकाएँ चुनें..." : "Select roles..."
                    }
                    loading={rolesQuery.isLoading}
                    options={rolesList.map((r: any) => ({
                      label: getLabel(r, lang),
                      value: Number(r.id),
                    }))}
                  />
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <CheckboxField
                    control={form.control}
                    name="is_active"
                    label={isHindi ? "सक्रिय" : "Active"}
                  />
                  <CheckboxField
                    control={form.control}
                    name="is_display"
                    label={isHindi ? "दृश्यमान" : "Visible"}
                  />
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0 font-sans">
            <div className="flex gap-3">
              {onCancel && (
                <Button
                  variant="outline"
                  type="button"
                  className="px-6"
                  onClick={onCancel}
                >
                  {isHindi ? "रद्द करें" : "Cancel"}
                </Button>
              )}
              <Button
                type="submit"
                className="px-6"
                disabled={mutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {mutation.isPending
                  ? isHindi
                    ? "सहेजा जा रहा है..."
                    : "Saving..."
                  : isHindi
                    ? "सहेजें"
                    : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export const SupportTypeViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { lang } = useTranslation();
  const { data: detailData, isLoading } = useSupportMasterDetail(
    "support-types",
    id,
  );
  const detail = detailData?.result?.data;

  const isHindi = lang === "hi";

  if (isLoading || !detail) {
    return (
      <div className="flex h-screen items-center justify-center text-xs text-muted-foreground italic animate-pulse">
        {isHindi
          ? "सपोर्ट टाइप विवरण लोड किया जा रहा है..."
          : "Loading support type details..."}
      </div>
    );
  }

  const rolesList = detail.role_details || detail.roles || [];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative flex-col font-sans">
      {}
      <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {isHindi ? "सपोर्ट टाइप देखें" : "View Support Type"}
        </h1>
      </div>

      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/20">
        <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
          <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
            {isHindi ? "सपोर्ट टाइप विवरण" : "Support Type Details"}
          </div>
          <div className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "कोड" : "Code"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {detail.code}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "प्रदर्शन क्रम" : "Display Order"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.display_order}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (अंग्रेज़ी)" : "Name (English)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name_en}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "नाम (हिंदी)" : "Name (Hindi)"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.name}
                </span>
              </div>
              <div className="flex flex-col md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium mb-1.5">
                  {isHindi ? "लक्षित भूमिकाएँ" : "Target Roles"}
                </span>
                {rolesList.length === 0 ? (
                  <span className="text-foreground text-sm italic">
                    {isHindi
                      ? "सभी भूमिकाएँ (नागरिक, अधिवक्ता, न्यायालय कर्मचारी, बोर्ड व्यवस्थापक)"
                      : "All Roles (Citizen, Advocate, Court Staff, Board Admin)"}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {rolesList.map((r: any, idx: number) => {
                      const roleName =
                        typeof r === "object" ? getLabel(r, lang) : String(r);
                      return (
                        <span
                          key={idx}
                          className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-bold px-2.5 py-1 rounded-lg"
                        >
                          {roleName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "स्थिति" : "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={detail.is_active ? "success" : "neutral"}
                  >
                    {detail.is_active
                      ? isHindi
                        ? "सक्रिय"
                        : "Active"
                      : isHindi
                        ? "निष्क्रिय"
                        : "Inactive"}
                  </StatusBadge>
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {isHindi ? "दृश्यता" : "Visibility"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.is_display ? "info" : "neutral"}>
                    {detail.is_display
                      ? isHindi
                        ? "दृश्यमान"
                        : "Visible"
                      : isHindi
                        ? "छिपा हुआ"
                        : "Hidden"}
                  </StatusBadge>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {}
      <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3.5 z-10 relative shrink-0">
        {onClose && (
          <Button onClick={onClose} className="px-6">
            {isHindi ? "बंद करें" : "Close"}
          </Button>
        )}
      </div>
    </div>
  );
};
