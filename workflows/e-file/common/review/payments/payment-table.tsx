"use client";

import { Eye, Trash2, FileCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";

const getPaymentStatusVariant = (code: string): "success" | "error" | "warning" | "info" | "neutral" => {
  switch (code) {
    case "PAYMENT_PAID":
      return "success";
    case "PAYMENT_FAILED":
    case "PAYMENT_CANCELLED":
      return "error";
    case "PAYMENT_PENDING_VERIFICATION":
      return "warning";
    case "PAYMENT_CREATED":
      return "info";
    default:
      return "neutral";
  }
};

export type ReviewPaymentTableProps = {
  payments: any[];
  loading?: boolean;
  isSubmitted?: boolean;
  onAdd?: () => void;
  onView?: (p: any) => void;
  onEdit?: (p: any) => void;
  onDelete?: (id: string) => void;
  onUploadProof?: (p: any) => void;
  title?: string;
  addLabel?: string;
  emptyText?: string;
  hasProof?: (id: string | number) => boolean;
};

export function ReviewPaymentTable({
  payments,
  loading,
  isSubmitted,
  onAdd,
  onView,
  onEdit,
  onDelete,
  onUploadProof,
  title,
  addLabel,
  emptyText,
  hasProof,
}: ReviewPaymentTableProps) {
  const { t, lang } = useTranslation();
  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-left">
            <CardTitle className="text-sm font-semibold">{title ?? t("case.review.payments_table_title") ?? "Payments"}</CardTitle>
          </div>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={onAdd}
              disabled={isSubmitted}
            >
              <span className="w-4 h-4 mr-2 flex items-center justify-center text-sm leading-none">+</span>
              {addLabel ?? t("case.review.payments_add_btn") ?? "Add"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground italic">{t("case.review.payments_loading") || "Loading payments..."}</div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{emptyText ?? t("case.review.payments_empty") ?? "No payments yet. Add an offline entry and upload proof."}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left table-fixed">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[22%]" />
                  <col className="w-[18%]" />
                  <col className="w-[20%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <tbody className="bg-background divide-y divide-border">
                  {payments.map((p: any) => {
                    const code = p.status_detail?.code || (p.status ? `PAYMENT_${String(p.status).toUpperCase()}` : "PAYMENT_CREATED");
                    const label = p.status_detail ? (lang === "hi" ? p.status_detail.name || p.status_detail.name_en : p.status_detail.name_en || p.status_detail.name) : p.status;
                    const amountInr = p.amount_in_inr ?? (p.amount ? p.amount / 100 : 0);
                    const md = p.metadata || {};
                    const proof = hasProof ? hasProof(p.id) : false;
                    const canUpload = !proof && !isSubmitted && code !== "PAYMENT_PAID" && code !== "PAYMENT_CANCELLED" && code !== "PAYMENT_FAILED";
                    const payNo: string = p.payment_number || p.reference_no || "";
                    return (
                      <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium">{payNo || `#${p.id}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold tracking-tight"><span className="text-[15px]">₹</span>{Number(amountInr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">{p.payment_mode_detail?.name_en || p.payment_mode_detail?.name || "OFFLINE"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-left">
                          <span className="inline-flex items-center gap-1.5">
                            <StatusBadge variant={getPaymentStatusVariant(code)}>{label}</StatusBadge>
                            {proof && <span className="inline-flex h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 items-center justify-center" title="Proof uploaded"><FileCheck className="w-3.5 h-3.5" /></span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex justify-end gap-1">
                            {canUpload && onUploadProof && (
                              <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onUploadProof(p)} title="Upload proof document">
                                <Upload className="w-3.5 h-3.5 mr-1" /> {t("case.review.payments_upload") || "Upload"}
                              </Button>
                            )}
                            {onView && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" onClick={() => onView(p)} title={t("case.documents.view_document") || "View"}>
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                            )}
                            {!isSubmitted && onDelete && code !== "PAYMENT_PAID" && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive" onClick={() => onDelete(String(p.id))} title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="md:hidden divide-y divide-border">
              {payments.map((p: any) => {
                const code = p.status_detail?.code || (p.status ? `PAYMENT_${String(p.status).toUpperCase()}` : "PAYMENT_CREATED");
                const label = p.status_detail ? (lang === "hi" ? p.status_detail.name || p.status_detail.name_en : p.status_detail.name_en || p.status_detail.name) : p.status;
                const amountInr = p.amount_in_inr ?? (p.amount ? p.amount / 100 : 0);
                const md = p.metadata || {};
                const proof = hasProof ? hasProof(p.id) : false;
                const canUpload = !proof && !isSubmitted && code !== "PAYMENT_PAID";
                const payNo: string = p.payment_number || p.reference_no || "";
                return (
                  <div key={p.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-muted/10">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-xs font-medium">{payNo || `#${p.id}`}</p>
                      <p className="text-sm font-bold tracking-tight"><span className="text-[15px]">₹</span>{Number(amountInr).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                      <div className="flex items-center gap-2">
                        <StatusBadge variant={getPaymentStatusVariant(code)}>{label}</StatusBadge>
                        {proof && <span className="inline-flex h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 items-center justify-center"><FileCheck className="w-3.5 h-3.5" /></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canUpload && onUploadProof && <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" onClick={() => onUploadProof(p)}><Upload className="w-3.5 h-3.5 mr-1" /> {t("case.review.payments_upload") || "Upload"}</Button>}
                      {onView && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(p)}><Eye className="w-4 h-4" /></Button>}
                      {!isSubmitted && onDelete && code !== "PAYMENT_PAID" && <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(String(p.id))}><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
