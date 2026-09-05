"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, FileDown, ExternalLink } from "lucide-react";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { CheckboxField } from "@/components/ui/checkbox-field";
import { AutocompleteField } from "@/components/ui/autocomplete-field";
import { FileUploadField } from "@/components/ui/file-upload-field";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useAnnouncementDetail,
  useUploadDocument,
  getFileUrl,
} from "@/lib";
import toast from "react-hot-toast";

export const AnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["news", "update", "publication"]),
  pinned: z.boolean().default(false),
  doc_url: z.string().optional().nullable(),
  file_name: z.string().optional().nullable(),
  external_url: z.string().optional().nullable(),
});

type AnnouncementFormData = z.infer<typeof AnnouncementSchema>;


export const AnnouncementAddForm = ({
  onSuccess,
  onCancel,
}: {
  onSuccess?: (res?: any) => void;
  onCancel?: () => void;
}) => {
  const { t } = useTranslation();
  const createMutation = useCreateAnnouncement();
  const uploadMutation = useUploadDocument();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(AnnouncementSchema) as any,
    defaultValues: {
      title: "",
      category: "news",
      pinned: false,
      doc_url: "",
      file_name: "",
      external_url: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      setUploadProgress(true);
      let docUrl = "";
      let fileName = "";

      if (selectedFile) {
        const uploadRes = await uploadMutation.mutateAsync({
          file: selectedFile,
          extraData: { type_of_doc: "ANNOUNCEMENT" },
        });
        if (uploadRes?.success && uploadRes?.result?.data) {
          docUrl = uploadRes.result.data.file_url;
          fileName = uploadRes.result.data.file_name;
        }
      }

      const res = await createMutation.mutateAsync({
        ...data,
        doc_url: docUrl || null,
        file_name: fileName || null,
        external_url: data.external_url || null,
        date: new Date().toISOString().split("T")[0]!,
      });

      toast.success("Announcement published successfully");
      onSuccess?.(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish announcement");
    } finally {
      setUploadProgress(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full"
        >
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("announcement.modal.title") || "Publish New Announcement"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground select-none">
                {t("form.basic_information") || "Basic Information"}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="title"
                    label={
                      t("announcement.modal.label_title") ||
                      "Announcement Title"
                    }
                    placeholder="Enter title..."
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <AutocompleteField
                      control={form.control}
                      name="category"
                      label={
                        t("announcement.modal.label_category") || "Category"
                      }
                      placeholder="Select category"
                      required
                      options={[
                        { label: "News & Notices", value: "news" },
                        { label: "Latest Updates", value: "update" },
                        { label: "Publications", value: "publication" },
                      ]}
                    />

                    <div className="flex items-end pb-1">
                      <CheckboxField
                        control={form.control}
                        name="pinned"
                        label={
                          t("announcement.modal.label_pin") || "Pin to top"
                        }
                      />
                    </div>
                  </div>

                  <FileUploadField
                    control={form.control}
                    name="file_name"
                    label={
                      t("announcement.modal.label_file") ||
                      "Attach File / Document"
                    }
                    placeholder="Click to select or drop file"
                    onFileSelect={(file) => setSelectedFile(file)}
                  />

                  <TextFieldV2
                    control={form.control}
                    name="external_url"
                    label={
                      t("announcement.modal.label_external_url") ||
                      "External URL"
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-background px-8 py-4 gap-3 z-10 relative shrink-0">
            <Button
              variant="outline"
              type="button"
              className="px-6"
              onClick={onCancel}
              disabled={uploadProgress}
            >
              {t("common_button.cancel.label") || "Cancel"}
            </Button>
            <Button type="submit" className="px-6" disabled={uploadProgress}>
              {uploadProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};


export const AnnouncementEditForm = ({
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
    useAnnouncementDetail(id);
  const detail = detailData?.result?.data;

  const updateMutation = useUpdateAnnouncement();
  const uploadMutation = useUploadDocument();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(AnnouncementSchema) as any,
    mode: "onChange",
  });

  useEffect(() => {
    if (detail) {
      form.reset({
        title: detail.title,
        category: detail.category,
        pinned: !!detail.pinned,
        doc_url: detail.doc_url || "",
        file_name: detail.file_name || "",
        external_url: detail.external_url || "",
      });
    }
  }, [detail, form]);

  const onSubmit = async (data: AnnouncementFormData) => {
    try {
      setUploadProgress(true);
      let docUrl = form.getValues("doc_url") || "";
      let fileName = form.getValues("file_name") || "";

      if (selectedFile) {
        const uploadRes = await uploadMutation.mutateAsync({
          file: selectedFile,
          extraData: { type_of_doc: "ANNOUNCEMENT" },
        });
        if (uploadRes?.success && uploadRes?.result?.data) {
          docUrl = uploadRes.result.data.file_url;
          fileName = uploadRes.result.data.file_name;
        }
      }

      const res = await updateMutation.mutateAsync({
        pk: id,
        payload: {
          ...data,
          doc_url: docUrl || null,
          file_name: fileName || null,
          external_url: data.external_url || null,
        },
      });

      toast.success("Announcement updated successfully");
      onSuccess?.(res);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update announcement");
    } finally {
      setUploadProgress(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-destructive text-sm font-semibold">
        Announcement details not found.
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
          {}
          <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
            <h1 className="text-lg font-semibold tracking-tight">
              {t("announcement.modal.title_edit") || "Edit Announcement"}
            </h1>
          </div>

          {}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground select-none">
                {t("form.basic_information") || "Basic Information"}
              </div>

              <div className="p-6 space-y-4">
                <div className="grid gap-4">
                  <TextFieldV2
                    required
                    control={form.control}
                    name="title"
                    label={
                      t("announcement.modal.label_title") ||
                      "Announcement Title"
                    }
                    placeholder="Enter title..."
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <AutocompleteField
                      control={form.control}
                      name="category"
                      label={
                        t("announcement.modal.label_category") || "Category"
                      }
                      placeholder="Select category"
                      required
                      options={[
                        { label: "News & Notices", value: "news" },
                        { label: "Latest Updates", value: "update" },
                        { label: "Publications", value: "publication" },
                      ]}
                    />

                    <div className="flex items-end pb-1">
                      <CheckboxField
                        control={form.control}
                        name="pinned"
                        label={
                          t("announcement.modal.label_pin") || "Pin to top"
                        }
                      />
                    </div>
                  </div>

                  <FileUploadField
                    control={form.control}
                    name="file_name"
                    label={
                      t("announcement.modal.label_file") ||
                      "Attach File / Document"
                    }
                    placeholder="Click to select or drop file"
                    existingFileName={form.watch("file_name") || undefined}
                    onFileSelect={(file) => setSelectedFile(file)}
                  />

                  <TextFieldV2
                    control={form.control}
                    name="external_url"
                    label={
                      t("announcement.modal.label_external_url") ||
                      "External URL"
                    }
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </section>
          </div>

          {}
          <div className="flex items-center justify-end border-t bg-background px-8 py-4 gap-3 z-10 relative shrink-0">
            <Button
              variant="outline"
              type="button"
              className="px-6"
              onClick={onCancel}
              disabled={uploadProgress}
            >
              {t("common_button.cancel.label") || "Cancel"}
            </Button>
            <Button type="submit" className="px-6" disabled={uploadProgress}>
              {uploadProgress ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};


export const AnnouncementViewForm = ({
  id,
  onClose,
}: {
  id: string;
  onClose?: () => void;
}) => {
  const { t } = useTranslation();
  const { data: detailData, isLoading: detailLoading } =
    useAnnouncementDetail(id);
  const detail = detailData?.result?.data;

  if (detailLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-destructive text-sm font-semibold">
        Announcement details not found.
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        {}
        <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("announcement.modal.title_view") || "View Announcement"}
          </h1>
        </div>

        {}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
          <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground select-none">
              {t("announcement.title_section") || "Announcement Details"}
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.title") || "Title"}
                </span>
                <span className="text-foreground font-semibold mt-0.5 leading-snug">
                  {detail.title}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.category") || "Category"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge
                    variant={
                      detail.category === "news"
                        ? "info"
                        : detail.category === "update"
                          ? "warning"
                          : "success"
                    }
                  >
                    {detail.category}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.date") || "Date"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {detail.date}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.pin") || "Pin Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={detail.pinned ? "success" : "neutral"}>
                    {detail.pinned ? "Pinned" : "Not Pinned"}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.file") || "Attached Document"}
                </span>
                <span className="mt-0.5">
                  {detail.doc_url ? (
                    <a
                      href={getFileUrl(detail.doc_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      {detail.file_name || "Download Attachment"}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("announcement.table.external_url") || "External URL"}
                </span>
                <span className="mt-0.5">
                  {detail.external_url ? (
                    <a
                      href={detail.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      {detail.external_url}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground/60">—</span>
                  )}
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
