"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n";
import { useProfileDSCDetail, useQueryParams, NumberParam, withDefault, formatDate, getExpiryStatus, getStatus } from '@/lib/query';
import { StatusBadge } from "@/components/ui/status-badge";

export default function DSCViewPage() {
  const { t } = useTranslation();
  const [query] = useQueryParams({
    id: withDefault(NumberParam, 0),
  });

  const {
    data: dscRes,
    isLoading,
    isError,
    refetch,
  } = useProfileDSCDetail(query.id);
  const item = dscRes?.result?.data;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          {t("common.loading") || "Loading..."}
        </p>
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6 text-center space-y-4">
        <p className="text-sm text-destructive font-medium">
          {t("common.failed_to_load") ||
            "Failed to load DSC certificate details"}
        </p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          {t("common_button.retry.label") || "Retry"}
        </Button>
      </div>
    );
  }

  const { label: expiryLabel } = getExpiryStatus(item);
  const isExpired = expiryLabel === "Expired";
  const { label: statusLabel } = getStatus(item);

  function DetailRow({
    label,
    value,
  }: {
    label: string;
    value: string | React.ReactNode;
  }) {
    return (
      <div className="grid grid-cols-3 gap-4 border-b border-border/50 py-3.5 last:border-0 items-center">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider col-span-1 select-none">
          {label}
        </span>
        <span className="text-sm text-foreground col-span-2 break-all font-medium select-text">
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <div className="flex flex-1 overflow-hidden h-full flex-col">
        {}
        <div className="sticky top-0 z-20 flex items-center justify-between h-14 px-6 border-b bg-white dark:bg-neutral-950 shrink-0 w-full">
          <h1 className="text-lg font-semibold tracking-tight">
            {t("common.dsc_detail_title") || "DSC Detail"}
          </h1>
        </div>

        {}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
          <div className="space-y-6 max-w-xl mx-auto w-full">
            {}
            <section className="bg-card border rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3 bg-gradient-to-r from-[#f9f9f9] to-[#e4e4e7] dark:from-neutral-900 dark:to-neutral-950 border-b text-sm font-semibold text-foreground">
                {t("common.dsc_parameters") || "Certificate Parameters"}
              </div>
              <div className="p-6 space-y-1">
                <DetailRow
                  label={t("table.code") || "Certificate Code"}
                  value={item.code}
                />
                <DetailRow
                  label={t("table.serialNo") || "Serial Number"}
                  value={item.serial}
                />
                <DetailRow
                  label={t("table.validFrom") || "Valid From"}
                  value={formatDate(item.valid_from)}
                />
                <DetailRow
                  label={t("table.validTo") || "Valid To"}
                  value={formatDate(item.valid_to)}
                />
                <DetailRow
                  label={t("table.expired") || "Expired"}
                  value={
                    <StatusBadge variant={isExpired ? "error" : "success"}>
                      {isExpired
                        ? t("common.yes") || "Yes"
                        : t("common.no") || "No"}
                    </StatusBadge>
                  }
                />
                <DetailRow
                  label={t("table.status") || "Status"}
                  value={
                    <StatusBadge
                      variant={item.is_active ? "success" : "neutral"}
                    >
                      {statusLabel}
                    </StatusBadge>
                  }
                />
                <DetailRow
                  label={t("table.createdOn") || "Created On"}
                  value={formatDate(item.created_at)}
                />
              </div>
            </section>
          </div>
        </div>

        {}
        <div className="flex items-center justify-end border-t bg-white dark:bg-neutral-950 px-8 py-3 z-10 relative">
          <div className="flex gap-3">
            <Button
              type="button"
              className="px-6"
              onClick={() => {
                window.close();
              }}
              variant="outline"
            >
              {t("common_button.close.label") || "Close"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
