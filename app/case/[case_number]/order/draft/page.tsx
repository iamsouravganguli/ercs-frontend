"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Download,
  Printer,
  Calendar,
  Building2,
  FileCheck,
  ClipboardList,
  Upload,
  AlertCircle,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextField } from "@/components/ui/richtext-field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";

import { useCaseOrderList, useCaseOrderCreate, useCaseOrderUpdate, useCaseOrderDelete, useOrderTypeList, useCaseDetail, useUserRole } from '@/lib/query';
import { CommonsApiServices } from '@/lib/services';
import { useTranslation } from "@/i18n";


const orderSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    order_no: z.string().optional(),
    order_date: z.string().min(1, "Order date is required"),
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
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Order content is required for digital format",
      path: ["summary"],
    },
  );

type OrderFormValues = z.infer<typeof orderSchema>;

export default function DraftOrdersPage() {
  const params = useParams();
  const case_number = params?.case_number as string;
  const router = useRouter();
  const { t, lang } = useTranslation();
  const { isCitizenOrAdvocate } = useUserRole();


  const {
    data: ordersRes,
    refetch: refetchOrders,
    isLoading,
  } = useCaseOrderList(case_number);

  const { data: orderTypesRes } = useOrderTypeList();

  const orderList = ordersRes?.result?.data || [];
  const orderTypes = orderTypesRes?.result?.data || [];

  const createOrderMutation = useCaseOrderCreate();
  const updateOrderMutation = useCaseOrderUpdate();
  const deleteOrderMutation = useCaseOrderDelete();


  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      title: "",
      order_no: "",
      order_date: new Date().toISOString().substring(0, 10),
      order_type: "INTERIM",
      order_format: "DIGITAL",
      summary: "",
      remarks: "",
    },
  });

  const watchFormat = form.watch("order_format");


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-orders") {
        refetchOrders();
      }
    };
    const handleFocus = () => refetchOrders();
    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refetchOrders]);


  const resetForm = () => {
    setEditingOrder(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    form.reset({
      title: "",
      order_no: "",
      order_date: new Date().toISOString().substring(0, 10),
      order_type: "INTERIM",
      order_format: "DIGITAL",
      summary: "",
      remarks: "",
    });
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) resetForm();
  };

  const openAddModal = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingOrder(item);
    setSelectedFile(null);
    form.reset({
      title: item.title || "",
      order_no: item.order_no || "",
      order_date: item.order_date || "",
      order_type: item.order_type || "INTERIM",
      order_format: item.order_format || "DIGITAL",
      summary: item.summary || "",
      remarks: item.remarks || "",
    });
    setIsDialogOpen(true);
  };


  const onSubmit = async (values: OrderFormValues) => {

    if (values.order_format === "MANUAL" && !selectedFile && !editingOrder) {
      toast.error(
        lang === "hi"
          ? "कृपया मैनुअल आदेश की हस्ताक्षरित कॉपी अपलोड करें।"
          : "Please upload the scanned copy of manual order.",
      );
      return;
    }

    try {
      toast.loading(
        editingOrder
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
          {
            type_of_doc: "CASE_ORDER",
          },
        );
        const docId = uploadRes.result?.data?.id;
        if (docId) {
          docIds.push(docId);
        }
      } else if (editingOrder && values.order_format === "MANUAL") {

        docIds = editingOrder.documents || [];
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

      if (editingOrder) {
        await updateOrderMutation.mutateAsync({
          caseNumber: case_number,
          pk: editingOrder.id,
          payload,
        });
        toast.dismiss("order-save");
        toast.success(
          lang === "hi"
            ? "आदेश सफलतापूर्वक अद्यतन हुआ।"
            : "Order updated successfully.",
        );
      } else {
        await createOrderMutation.mutateAsync({
          caseNumber: case_number,
          payload,
        });
        toast.dismiss("order-save");
        toast.success(
          lang === "hi"
            ? "आदेश सफलतापूर्वक सहेजा गया।"
            : "Order saved successfully.",
        );
      }

      handleDialogClose(false);
      refetchOrders();
    } catch (err: any) {
      toast.dismiss("order-save");
      toast.error(err?.message || "Failed to save order.");
    }
  };


  const handleDeleteOrder = async (id: number | string) => {
    if (
      !confirm(
        lang === "hi"
          ? "क्या आप निश्चित रूप से इस आदेश को हटाना चाहते हैं?"
          : "Are you sure you want to delete this order?",
      )
    ) {
      return;
    }

    try {
      toast.loading(lang === "hi" ? "हटाया जा रहा है..." : "Deleting...", {
        id: "delete-o",
      });
      await deleteOrderMutation.mutateAsync({
        caseNumber: case_number,
        pk: id,
      });
      toast.dismiss("delete-o");
      toast.success(
        lang === "hi"
          ? "आदेश सफलतापूर्वक हटाया गया।"
          : "Order deleted successfully.",
      );
      refetchOrders();
    } catch (err: any) {
      toast.dismiss("delete-o");
      toast.error(err?.message || "Failed to delete order.");
    }
  };


  const handlePrint = (item: any) => {

    if (item.order_format === "MANUAL" && item.documents_detail?.length > 0) {
      const fileUrl = item.documents_detail[0].file_url;
      if (fileUrl) {
        window.open(fileUrl, "_blank");
        return;
      }
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${item.title || "Case Order"}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; }
            .details { margin-bottom: 30px; }
            .content { font-size: 14px; margin-top: 20px; }
            .footer { margin-top: 50px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>UTTARAKHAND REVENUE COURT</h2>
            <h4>OFFICIAL CASE ORDER / JUDGMENT</h4>
          </div>
          <div class="details">
            <p><strong>Case Number:</strong> ${case_number}</p>
            <p><strong>Order Ref No:</strong> ${item.order_no}</p>
            <p><strong>Order Date:</strong> ${item.order_date}</p>
            <p><strong>Order Type:</strong> ${item.order_type}</p>
            <p><strong>Title:</strong> ${item.title}</p>
            <p><strong>Issued By:</strong> ${item.passed_by_detail?.full_name || item.passed_by_detail?.username || "Court"}</p>
          </div>
          <hr />
          <h3>Order Content</h3>
          <div class="content">${item.summary}</div>
          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} from RCCMS Portal.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };


  const totalCount = orderList.length;
  const interimCount = orderList.filter(
    (o: any) => o.order_type === "INTERIM",
  ).length;
  const finalCount = orderList.filter(
    (o: any) => o.order_type === "FINAL",
  ).length;
  const directionCount = orderList.filter(
    (o: any) => o.order_type === "DIRECTION",
  ).length;

  const filteredOrders = orderList.filter((item: any) => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        String(item.title || "")
          .toLowerCase()
          .includes(query) ||
        String(item.order_no || "")
          .toLowerCase()
          .includes(query) ||
        String(item.order_type || "")
          .toLowerCase()
          .includes(query)
      );
    }
    return true;
  });

  const getOrderTypeLabel = (code: string) => {
    const tObj = orderTypes.find((x: any) => x.code === code);
    if (tObj) {
      return lang === "hi" ? tObj.name : tObj.name_en;
    }
    switch (code) {
      case "FINAL":
        return "Final Order";
      case "INTERIM":
        return "Interim Order";
      case "JUDGMENT":
        return "Judgment";
      case "DIRECTION":
        return "Direction";
      default:
        return code;
    }
  };

  const getOrderTypeBadge = (type: string) => {
    const label = getOrderTypeLabel(type);
    switch (type) {
      case "FINAL":
        return (
          <Badge
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
          >
            {label}
          </Badge>
        );
      case "INTERIM":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px]"
          >
            {label}
          </Badge>
        );
      case "JUDGMENT":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-600 hover:bg-purple-700 text-white text-[10px]"
          >
            {label}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {label}
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "कुल आदेश" : "Total Orders"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {totalCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "अंतरिम आदेश" : "Interim Orders"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {interimCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "अंतिम आदेश" : "Final Orders"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {finalCount}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-[#f1f1f1] dark:bg-neutral-950 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {lang === "hi" ? "निर्देश" : "Directions"}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {directionCount}
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                lang === "hi"
                  ? "शीर्षक या संदर्भ संख्या से खोजें..."
                  : "Search orders..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isCitizenOrAdvocate && (
              <Button
                size="sm"
                onClick={openAddModal}
                className="h-8 text-xs font-semibold shrink-0 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === "hi" ? "नया आदेश दर्ज करें" : "New Order"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 border-b bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                {lang === "hi"
                  ? "पारित आदेश सूची"
                  : "Issued Orders & Judgments"}
              </CardTitle>
              <Badge variant="outline" className="text-[11px]">
                {filteredOrders.length} {lang === "hi" ? "आदेश" : "orders"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-muted/40 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">
                    {lang === "hi"
                      ? "दिनांक एवं संदर्भ संख्या"
                      : "Date & Ref No"}
                  </th>
                  <th className="px-6 py-3">
                    {lang === "hi" ? "आदेश प्रकार" : "Order Type"}
                  </th>
                  <th className="px-6 py-3">
                    {lang === "hi" ? "शीर्षक एवं विवरण" : "Title & Details"}
                  </th>
                  <th className="px-6 py-3 text-right">
                    {lang === "hi" ? "कार्य" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-xs text-muted-foreground"
                    >
                      {lang === "hi"
                        ? "लोड हो रहा है..."
                        : "Loading order records..."}
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-xs text-muted-foreground"
                    >
                      {lang === "hi"
                        ? "कोई आदेश विवरण उपलब्ध नहीं है।"
                        : "No order records found."}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((item: any) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/5 transition-colors"
                    >
                      {}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-foreground font-mono">
                              {item.order_date}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              Ref: {item.order_no}
                            </p>
                          </div>
                        </div>
                      </td>

                      {}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOrderTypeBadge(item.order_type)}
                      </td>

                      {}
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-foreground font-bold line-clamp-1">
                            {item.title}
                          </p>
                          {item.order_format === "MANUAL" && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-purple-500/10 text-purple-700 hover:bg-purple-500/10 gap-0.5 border-purple-200"
                            >
                              <Upload className="w-2.5 h-2.5" />
                              Manual Copy
                            </Badge>
                          )}
                        </div>
                        {item.order_format === "DIGITAL" ? (
                          <div
                            className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5"
                            dangerouslySetInnerHTML={{ __html: item.summary }}
                          />
                        ) : (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 italic text-purple-600 font-medium">
                            {lang === "hi"
                              ? "हस्ताक्षरित मैनुअल आदेश दस्तावेज़ अपलोड किया गया।"
                              : "Signed manual order document uploaded."}
                          </p>
                        )}
                        {item.passed_by_detail && (
                          <p className="text-[9px] text-muted-foreground/80 mt-1 uppercase font-bold tracking-tight">
                            {lang === "hi" ? "द्वारा पारित: " : "Passed by: "}
                            {item.passed_by_detail.full_name ||
                              item.passed_by_detail.username}
                          </p>
                        )}
                      </td>

                      {}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.order_format === "MANUAL" &&
                          item.documents_detail?.length > 0 ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => handlePrint(item)}
                              title={
                                lang === "hi"
                                  ? "दस्तावेज़ डाउनलोड करें"
                                  : "Download Document"
                              }
                            >
                              <FileDown className="w-4 h-4 text-purple-600 hover:text-purple-700" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => handlePrint(item)}
                              title={
                                lang === "hi" ? "प्रिंट करें" : "Print Order"
                              }
                            >
                              <Printer className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}

                          {!isCitizenOrAdvocate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => openEditModal(item)}
                              title={
                                lang === "hi" ? "संपादित करें" : "Edit Order"
                              }
                            >
                              <Pencil className="w-4 h-4 text-blue-600" />
                            </Button>
                          )}

                          {!isCitizenOrAdvocate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteOrder(item.id)}
                              title={lang === "hi" ? "हटाएं" : "Delete Order"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:w-[85vw] sm:max-w-[85vw] lg:w-[60vw] lg:max-w-[60vw] max-h-[92vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/20 text-left">
            <DialogTitle>
              {editingOrder
                ? lang === "hi"
                  ? "आदेश विवरण संशोधित करें"
                  : "Edit Order Details"
                : lang === "hi"
                  ? "नया आदेश दर्ज करें"
                  : "Record New Order"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {lang === "hi"
                ? "वाद के लिए पारित किए गए नए आदेश या निर्णय का विवरण दर्ज करें।"
                : "Enter title, date, type, format and the judicial order summary."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Form {...form}>
              <form
                id="save-order-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5 text-left"
              >
                {}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {}
                  <FormField
                    control={form.control}
                    name="order_no"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold">
                          {lang === "hi"
                            ? "आदेश संदर्भ संख्या"
                            : "Order Reference No"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={
                              lang === "hi"
                                ? "स्वचालित उत्पन्न (खाली छोड़ें)"
                                : "Auto-generated if blank"
                            }
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {}
                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold">
                          {lang === "hi" ? "आदेश दिनांक" : "Order Date"} *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {}
                  <FormField
                    control={form.control}
                    name="order_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold">
                          {lang === "hi" ? "आदेश प्रकार" : "Order Type"} *
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orderTypes.map((type: any) => (
                              <SelectItem key={type.code} value={type.code}>
                                {lang === "hi" ? type.name : type.name_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        {lang === "hi" ? "आदेश शीर्षक" : "Order Title"} *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Interim Stay Order"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {}
                <FormField
                  control={form.control}
                  name="order_format"
                  render={({ field }) => (
                    <FormItem className="space-y-2 p-3 rounded-lg border bg-muted/20">
                      <FormLabel className="text-xs font-bold">
                        {lang === "hi"
                          ? "आदेश प्रारूप (तैयार करने का माध्यम)"
                          : "Order Format"}{" "}
                        *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          className="flex items-center gap-6"
                        >
                          <div className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem
                              value="DIGITAL"
                              id="format-digital"
                            />
                            <Label
                              htmlFor="format-digital"
                              className="text-xs font-medium cursor-pointer"
                            >
                              {lang === "hi"
                                ? "डिजिटल (ऑनलाइन टाइप करें)"
                                : "Digital Order (Type online)"}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2 cursor-pointer">
                            <RadioGroupItem value="MANUAL" id="format-manual" />
                            <Label
                              htmlFor="format-manual"
                              className="text-xs font-medium cursor-pointer"
                            >
                              {lang === "hi"
                                ? "मैन्युअल (हस्ताक्षरित प्रति अपलोड करें)"
                                : "Manual Order (Upload Scanned File)"}
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {}
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
                    <Label className="text-xs font-bold block mb-1">
                      {lang === "hi"
                        ? "हस्ताक्षरित मैनुअल आदेश फ़ाइल अपलोड करें"
                        : "Upload Signed Manual Order Document"}{" "}
                      *
                    </Label>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5"
                      >
                        <Upload className="w-4 h-4 text-purple-600" />
                        <span>
                          {lang === "hi"
                            ? "दस्तावेज़ चुनें"
                            : "Select Document (PDF/JPG)"}
                        </span>
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setSelectedFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                        accept="application/pdf,image/*"
                      />
                      {selectedFile ? (
                        <span className="text-xs text-foreground font-semibold flex items-center gap-1">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          {selectedFile.name}
                        </span>
                      ) : editingOrder?.documents_detail?.length > 0 ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          {editingOrder.documents_detail[0].file_name ||
                            "Existing document"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          {lang === "hi"
                            ? "कोई फ़ाइल चयनित नहीं है।"
                            : "No file selected."}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {lang === "hi"
                        ? "समर्थित प्रारूप: PDF, JPEG, PNG (अधिकतम 10MB)। हस्ताक्षरित आदेश को स्कैन करके यहाँ संलग्न करें।"
                        : "Supported formats: PDF, JPEG, PNG (Max 10MB). Attach scanned copy of signed physical order."}
                    </p>
                  </div>
                )}

                {}
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold">
                        {lang === "hi"
                          ? "रिमार्क्स (वैकल्पिक)"
                          : "Remarks (Optional)"}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any internal notes or remarks..."
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0 bg-muted/20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDialogClose(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="save-order-form"
              size="sm"
              className="font-semibold"
            >
              {editingOrder
                ? lang === "hi"
                  ? "अद्यतन करें"
                  : "Update"
                : lang === "hi"
                  ? "सहेजें"
                  : "Save Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
