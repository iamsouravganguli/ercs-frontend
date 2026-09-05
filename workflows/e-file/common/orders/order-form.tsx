"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import { Upload, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TextFieldV2 } from "@/components/ui/text-field-v2";
import { TextareaField } from "@/components/ui/textarea-field";
import { CustomComboboxField } from "@/components/ui/custom-combobox-field";
import { RichTextField } from "@/components/ui/richtext-field";
import {
  useCaseOrderCreate,
  useCaseOrderUpdate,
  useOrderTypeList,
  CommonsApiServices,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { OrderFormatField } from "./order-format-field";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const orderSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    order_no: z.string().optional(),
    order_date: z
      .string()
      .min(1, "Order date is required")
      .refine((val) => val >= todayStr(), {
        message: "Order date cannot be in the past",
      }),
    order_type: z.string().min(1, "Order type is required"),
    order_format: z.enum(["DIGITAL", "MANUAL"]),
    summary: z.string().optional(),
    remarks: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.order_format === "DIGITAL" &&
        (!data.summary || !data.summary.trim())
      )
        return false;
      return true;
    },
    {
      message: "Order content is required for digital format",
      path: ["summary"],
    },
  );

type OrderFormValues = z.infer<typeof orderSchema>;

export function OrderForm({
  order,
  onClose,
  onSuccess,
}: {
  order?: any;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const params = useParams() as any;
  const case_number = params.case_number || params.caseId;
  const { t, lang } = useTranslation();
  const isEditing = !!order;

  const { data: orderTypesRes } = useOrderTypeList();
  const orderTypes = orderTypesRes?.result?.data || [];
  const createMutation = useCaseOrderCreate();
  const updateMutation = useCaseOrderUpdate();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      title: order?.title || "",
      order_no: order?.order_no || "",
      order_date:
        order?.order_date || new Date().toISOString().substring(0, 10),
      order_type: order?.order_type || "INTERIM",
      order_format: order?.order_format || "DIGITAL",
      summary: order?.summary || "",
      remarks: order?.remarks || "",
    },
  });

  const watchFormat = form.watch("order_format");

  useEffect(() => {
    if (order) {
      form.reset({
        title: order.title || "",
        order_no: order.order_no || "",
        order_date: order.order_date || "",
        order_type: order.order_type || "INTERIM",
        order_format: order.order_format || "DIGITAL",
        summary: order.summary || "",
        remarks: order.remarks || "",
      });
    }
  }, [order, form]);

  const onSubmit = async (values: OrderFormValues) => {
    if (values.order_format === "MANUAL" && !selectedFile && !isEditing) {
      toast.error(
        lang === "hi"
          ? "कृपया मैनुअल आदेश की हस्ताक्षरित कॉपी अपलोड करें।"
          : "Please upload the scanned copy of manual order.",
      );
      return;
    }
    try {
      toast.loading(
        isEditing
          ? lang === "hi"
            ? "आदेश अद्यतन हो रहा है..."
            : "Updating order..."
          : lang === "hi"
            ? "आदेश सहेजा जा रहा है..."
            : "Saving order...",
        { id: "order-save" },
      );
      let docIds: number[] = [];
      if (values.order_format === "MANUAL" && selectedFile) {
        const uploadRes = await CommonsApiServices.uploadDocument(
          selectedFile,
          { type_of_doc: "CASE_ORDER" },
        );
        const docId = uploadRes.result?.data?.id;
        if (docId) docIds.push(docId);
      } else if (isEditing && values.order_format === "MANUAL") {
        docIds = order.documents || [];
      }
      const payload = {
        title: values.title.trim(),
        order_no: values.order_no?.trim() || undefined,
        order_date: values.order_date,
        order_type: values.order_type,
        order_format: values.order_format,
        summary:
          values.order_format === "DIGITAL"
            ? values.summary?.trim()
            : "Scanned manual order uploaded.",
        remarks: values.remarks?.trim(),
        documents: docIds,
      };
      if (isEditing) {
        await updateMutation.mutateAsync({
          caseNumber: case_number,
          pk: order.id,
          payload,
        });
        toast.dismiss("order-save");
        toast.success(
          lang === "hi"
            ? "आदेश सफलतापूर्वक अद्यतन हुआ।"
            : "Order updated successfully.",
        );
      } else {
        await createMutation.mutateAsync({ caseNumber: case_number, payload });
        toast.dismiss("order-save");
        toast.success(
          lang === "hi"
            ? "आदेश सफलतापूर्वक सहेजा गया।"
            : "Order saved successfully.",
        );
      }
      onSuccess?.();
      onClose?.();
    } catch (err: any) {
      toast.dismiss("order-save");
      toast.error(err?.message || "Failed to save order.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="sticky top-0 z-20 flex items-center h-14 px-6 border-b bg-card shrink-0">
        <h1 className="text-lg font-semibold tracking-tight">
          {lang === "hi" ? "प्रारूप आदेश" : "Draft Order"}
        </h1>
      </div>
      <Form {...form}>
        <form
          id="order-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-hidden h-full min-h-0"
        >
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <TextFieldV2
              control={form.control}
              name="title"
              label={lang === "hi" ? "आदेश शीर्षक" : "Order Title"}
              placeholder="e.g. Interim Stay Order"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextFieldV2
                control={form.control}
                name="order_no"
                label={
                  lang === "hi" ? "आदेश संदर्भ संख्या" : "Order Reference No"
                }
                placeholder={
                  lang === "hi"
                    ? "स्वचालित उत्पन्न (खाली छोड़ें)"
                    : "Auto-generated if blank"
                }
              />
              <TextFieldV2
                control={form.control}
                name="order_date"
                label={lang === "hi" ? "आदेश दिनांक" : "Order Date"}
                placeholder="YYYY-MM-DD"
                required
                type="date"
                min={todayStr()}
              />
              <CustomComboboxField
                control={form.control}
                name="order_type"
                label={lang === "hi" ? "आदेश प्रकार" : "Order Type"}
                placeholder="Select type"
                required
                options={orderTypes.map((type: any) => ({
                  label: lang === "hi" ? type.name : type.name_en,
                  value: type.code,
                }))}
              />
            </div>
            <OrderFormatField
              control={form.control}
              name="order_format"
              required
            />
            {watchFormat === "DIGITAL" ? (
              <RichTextField
                control={form.control}
                name="summary"
                label={
                  lang === "hi"
                    ? "आदेश सामग्री / निर्णय विवरण"
                    : "Order Content"
                }
                placeholder="Start drafting the judicial order content here..."
                description="Use the mic icon for voice dictation in Hindi or English."
                fieldSize="lg"
                required
              />
            ) : (
              <div className="space-y-2 p-4 border border-dashed rounded-lg bg-card">
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-9 px-4 gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-foreground font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{lang === "hi" ? "अपलोड" : "Upload"}</span>
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.type !== "application/pdf") {
                        toast.error(
                          lang === "hi"
                            ? "केवल PDF फ़ाइल की अनुमति है।"
                            : "Only PDF files are allowed.",
                        );
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                        return;
                      }
                      setSelectedFile(f);
                    }}
                    className="hidden"
                    accept="application/pdf"
                  />
                  {selectedFile ? (
                    <p className="text-xs font-medium text-foreground break-all">
                      {selectedFile.name}
                    </p>
                  ) : order?.documents_detail?.length ? (
                    <p className="text-xs text-muted-foreground break-all">
                      {order.documents_detail[0].file_name ||
                        "Existing document"}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      {lang === "hi"
                        ? "कोई फ़ाइल चयनित नहीं है।"
                        : "No file selected."}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {lang === "hi"
                    ? "केवल PDF प्रारूप (अधिकतम 10MB) की अनुमति है।"
                    : "Only PDF format is allowed (Max 10MB)."}
                </p>
              </div>
            )}
            <TextareaField
              control={form.control}
              name="remarks"
              label={
                lang === "hi" ? "रिमार्क्स (वैकल्पिक)" : "Remarks (Optional)"
              }
              placeholder="Any internal notes or remarks..."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between border-t bg-card px-6 py-3 z-10 shrink-0">
            <Button
              variant="outline"
              type="button"
              className="px-5"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="order-form"
              className="px-6 font-semibold"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isEditing
                ? lang === "hi"
                  ? "अद्यतन करें"
                  : "Update"
                : (t("case.details.save_btn") ??
                  (lang === "hi" ? "सहेजें" : "Save"))}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
