"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Receipt, Check } from "lucide-react";
import { useTranslation } from "@/i18n";

export type ReceiptDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  receiptData: any;
  caseNumber: string;
};

export function ReceiptDialog({
  open,
  onOpenChange,
  receiptData,
  caseNumber,
}: ReceiptDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0 overflow-hidden bg-white dark:bg-neutral-900 border rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <DialogTitle className="text-base font-bold text-white leading-tight">
              {t("case.review.receipt_title")}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-[10px] sm:text-xs mt-0.5 font-medium">
              {t("case.review.receipt_board_name")}
            </DialogDescription>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="text-center bg-muted/30 dark:bg-muted/10 rounded-xl py-5 px-4 border border-dashed border-muted-foreground/20">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Check className="w-3 h-3" /> {t("case.review.receipt_success")}
            </div>
            <div className="text-3xl font-extrabold tracking-tight mt-3 text-foreground">
              ₹2.00
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {t("case.review.receipt_stamp_fee")}
            </p>
          </div>
          <div className="space-y-4 text-xs">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t("case.review.receipt_case_number")}
              </p>
              <p className="font-medium text-foreground mt-1 break-all">
                {caseNumber || "-"}
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t("case.review.receipt_date")}
              </p>
              <p className="font-medium text-foreground mt-1">
                {receiptData?.paid_at
                  ? new Date(receiptData.paid_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : new Date().toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t("case.review.receipt_order_id")}
              </p>
              <p className="font-medium text-foreground mt-1 break-all selection:bg-teal-100">
                {receiptData?.razorpay_order_id || "-"}
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                {t("case.review.receipt_transaction_id")}
              </p>
              <p className="font-medium text-foreground mt-1 break-all selection:bg-teal-100">
                {receiptData?.razorpay_payment_id || "-"}
              </p>
            </div>
            {receiptData?.paid_by && (
              <div className="border-t pt-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  {t("case.review.receipt_paid_by")}
                </p>
                <p className="font-medium text-foreground mt-1 wrap-break-word">
                  {receiptData.paid_by}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
