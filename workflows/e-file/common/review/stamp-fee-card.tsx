"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/i18n";
import { Loader2 } from "lucide-react";

export type StampFeeCardProps = {
  isPaid?: boolean;
  isCourtUser?: boolean;
  isPaymentProcessing?: boolean;
  isLoadingReceipt?: boolean;
  onPay?: () => void;
  onViewReceipt?: () => void;
};

export function StampFeeCard({
  isPaid,
  isCourtUser,
  isPaymentProcessing,
  isLoadingReceipt,
  onPay,
  onViewReceipt,
}: StampFeeCardProps) {
  const { t } = useTranslation();
  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <CardTitle className="text-sm font-semibold">
          {t("case.review.stamp_fee_label")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p
              className={`text-sm font-medium leading-tight ${isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {isPaid
                ? isCourtUser
                  ? t("case.review.stamp_fee_court_skip")
                  : t("case.review.stamp_fee_paid")
                : t("case.review.stamp_fee_pending")}
            </p>
            <p className="text-lg font-bold mt-2">
              ₹2.00{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {t("case.review.receipt_stamp_fee")}
              </span>
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
            {!isPaid ? (
              <Button
                size="sm"
                className="h-8 px-4 text-xs font-semibold"
                onClick={onPay}
                disabled={isPaymentProcessing}
              >
                {isPaymentProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    {t("case.review.pay_btn")}
                  </>
                ) : (
                  t("case.review.pay_btn")
                )}
              </Button>
            ) : (
              !isCourtUser && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-4 text-xs font-semibold"
                  onClick={onViewReceipt}
                  disabled={isLoadingReceipt}
                >
                  {isLoadingReceipt ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    t("case.review.view_btn")
                  )}
                </Button>
              )
            )}
            {isPaid && isCourtUser && (
              <p className="text-xs text-muted-foreground">
                {t("case.review.stamp_fee_court_skip")}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
