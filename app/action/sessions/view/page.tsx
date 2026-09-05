"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import { formatDate, parseDevice, getExpired, getStatus } from "@/lib";
import { Monitor, Phone } from "lucide-react";

export default function SessionViewPage() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const id = searchParams.get("id") || "";
  const device = searchParams.get("device") || "";
  const ipAddress = searchParams.get("ip") || "";
  const createdAt = searchParams.get("created") || "";
  const lastUsedAt = searchParams.get("online") || "";
  const expiresAt = searchParams.get("expires") || "";
  const isActive = searchParams.get("active") === "true";

  const handleClose = () => {
    window.close();
  };

  if (!id) {
    return (
      <div className="p-6 text-sm text-destructive font-medium h-screen w-full bg-background flex items-center justify-center">
        Error: Session ID parameter is required.
      </div>
    );
  }


  const parsed = parseDevice(device);
  const isUnknown = !parsed?.browser && !parsed?.os && !parsed?.browserVersion;
  const browserLabel =
    parsed?.browser || t("common.unknown") || "Unknown Browser";
  const osLabel = parsed?.os ? ` on ${parsed.os}` : "";
  const deviceString = isUnknown
    ? t("common.unidentified") || "Unidentified Device"
    : `${browserLabel}${osLabel}`;


  const expLabel = getExpired({ expires_at: expiresAt } as any);
  const isExpired = expLabel.label === "Expired";


  const statusLabel = getStatus({ is_active: isActive } as any);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="flex flex-1 flex-col overflow-hidden h-full">
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar bg-muted/40">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {t("session.view.title") || "View Session"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {t("session.view.description") ||
                  "Active login session profiling and metadata details"}
              </p>
            </div>
          </div>

          <section className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
            <div className="text-base font-semibold pb-2 border-b">
              {t("session.section.details") || "Session Details"}
            </div>
            <div className="grid md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex flex-col md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.sessionId") || "Session ID"}
                </span>
                <span className="text-foreground font-mono font-semibold mt-0.5 break-all">
                  {id}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.device") || "Device / Browser"}
                </span>
                <span className="text-foreground font-semibold mt-0.5 flex items-center gap-2">
                  {parsed?.deviceType === "desktop" ? (
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  )}
                  {deviceString}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.ip") || "IP Address"}
                </span>
                <span className="text-foreground font-semibold mt-0.5">
                  {ipAddress || "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.createdOn") || "Created On"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {createdAt ? formatDate(createdAt) : "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.lastOnline") || "Last Online"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {lastUsedAt ? formatDate(lastUsedAt) : "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.expireOn") || "Expires On"}
                </span>
                <span className="text-foreground font-medium mt-0.5">
                  {expiresAt ? formatDate(expiresAt) : "-"}
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.expired") || "Expired"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={isExpired ? "error" : "success"}>
                    {isExpired
                      ? t("common.yes") || "Yes"
                      : t("common.no") || "No"}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.status") || "Status"}
                </span>
                <span className="mt-0.5">
                  <StatusBadge variant={isActive ? "success" : "neutral"}>
                    {statusLabel.label}
                  </StatusBadge>
                </span>
              </div>

              <div className="flex flex-col md:col-span-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("table.userAgent") || "User Agent String"}
                </span>
                <span className="text-xs text-muted-foreground mt-1 break-all bg-muted/50 p-2.5 rounded-lg border border-border/30">
                  {device || "-"}
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
            onClick={handleClose}
          >
            {t("common_button.close.label") || "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
