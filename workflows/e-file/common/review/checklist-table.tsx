"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import { Loader2 } from "lucide-react";

export type ChecklistItem = {
  id: string;
  label: string;
  isComplete: boolean;
  icon: React.ElementType;
  href?: string;
};

export type ChecklistTableProps = {
  items: ChecklistItem[];
  isCourtUser?: boolean;
  isPaid?: boolean;
  isPaymentProcessing?: boolean;
  isLoadingReceipt?: boolean;
  onNavigate?: (href: string) => void;
  onPay?: () => void;
  onAddPayment?: () => void;
  onViewReceipt?: () => void;
};

export function ChecklistTable({
  items,
  isCourtUser,
  isPaid,
  isPaymentProcessing,
  isLoadingReceipt,
  onNavigate,
  onPay,
  onAddPayment,
  onViewReceipt,
}: ChecklistTableProps) {
  const { t } = useTranslation();
  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <CardTitle className="text-sm font-semibold">
          {t("case.review.checklist_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div className="hidden md:block min-w-full align-middle">
          <table className="min-w-full divide-y divide-border text-left">
            <tbody className="divide-y divide-border bg-card">
              {items.map((section) => {
                const Icon = section.icon;
                const isComplete = section.isComplete;
                return (
                  <tr
                    key={section.id}
                    className="hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">
                            {section.label}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge variant={isComplete ? "success" : "warning"}>
                        {isComplete
                          ? t("case.review.status_completed")
                          : t("case.review.status_incomplete")}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {section.id === "stamp_fee" ? (
                        isCourtUser ? (

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                            onClick={onAddPayment}
                          >
                            <span className="w-4 h-4 mr-1.5 flex items-center justify-center text-sm leading-none">+</span>
                            {t("case.review.payments_add_btn") || "Add"}
                          </Button>
                        ) : !isComplete ? (
                          <Button
                            size="sm"
                            className="h-7 px-3.5 text-xs font-semibold"
                            onClick={onPay}
                            disabled={isPaymentProcessing}
                          >
                            {isPaymentProcessing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              t("case.review.pay_btn")
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3.5 text-xs font-semibold"
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
                      ) : (
                        <Button
                          size="sm"
                          variant={isComplete ? "outline" : "default"}
                          className="h-7 px-3.5 text-xs font-semibold"
                          onClick={() =>
                            section.href && onNavigate?.(section.href)
                          }
                        >
                          {isComplete
                            ? t("case.review.view_btn")
                            : t("case.review.fill_btn")}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="block md:hidden divide-y divide-border bg-card">
          {items.map((section) => {
            const Icon = section.icon;
            const isComplete = section.isComplete;
            return (
              <div
                key={section.id}
                className="p-4 space-y-3 hover:bg-muted/5 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{section.label}</p>
                  </div>
                  <StatusBadge variant={isComplete ? "success" : "warning"}>
                    {isComplete
                      ? t("case.review.status_completed")
                      : t("case.review.status_incomplete")}
                  </StatusBadge>
                </div>
                <div className="flex justify-end">
                  {section.id === "stamp_fee" ? (
                    isCourtUser ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3.5 text-xs font-semibold bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                        onClick={onAddPayment}
                      >
                        <span className="w-4 h-4 mr-1.5 flex items-center justify-center text-sm leading-none">+</span>
                        {t("case.review.payments_add_btn") || "Add"}
                      </Button>
                    ) : !isComplete ? (
                      <Button
                        size="sm"
                        className="h-7 px-3.5 text-xs font-semibold"
                        onClick={onPay}
                        disabled={isPaymentProcessing}
                      >
                        {isPaymentProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          t("case.review.pay_btn")
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-3.5 text-xs font-semibold"
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
                  ) : (
                    <Button
                      size="sm"
                      variant={isComplete ? "outline" : "default"}
                      className="h-7 px-3.5 text-xs font-semibold"
                      onClick={() => section.href && onNavigate?.(section.href)}
                    >
                      {isComplete
                        ? t("case.review.view_btn")
                        : t("case.review.fill_btn")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
