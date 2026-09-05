"use client";

import { useProfileDetail } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataBoundary } from "@/components/ui/data-boundary";
import { hasRole, RoleGuard } from "@/components/ui/role-guard";
import { Copy, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

function CopyRow({
  label,
  value,
  naLabel,
}: {
  label: string;
  value?: string | null;
  naLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const display = value?.trim() ? String(value) : "";
  const isNA = !display;
  const onCopy = async () => {
    if (isNA) return;
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 py-3 border-b border-dashed border-border/60 dark:border-border/30 last:border-0">
      <span className="text-sm font-medium text-muted-foreground shrink-0 sm:pt-0.5">
        {label}
      </span>
      <span className="flex items-start gap-2 min-w-0 sm:justify-end sm:max-w-[65%]">
        <span className="font-medium text-[15px] sm:text-base wrap-break-word whitespace-pre-wrap text-left sm:text-right flex-1 min-w-0 leading-snug text-foreground">
          {isNA ? naLabel : display}
        </span>
        {!isNA && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 rounded-md mt-0.5 sm:mt-0"
            onClick={onCopy}
            title="Copy"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { data, isLoading, isError, error, refetch } = useProfileDetail();
  const user: any = (data as any)?.result?.data;
  const { t } = useTranslation();
  const na = t("common_status.not_available.label");

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 580,
    height = 680,
  ) => {
    if (popupRef.current && !popupRef.current.closed) {
      if (popupUrlRef.current === url) {
        popupRef.current.focus();
        return;
      }
    }
    let left = 100;
    const top = 100;
    if (typeof window !== "undefined") {
      const sX = window.screenX;
      const oW = window.outerWidth;
      const sY = window.screenY;
      const oH = window.outerHeight;
      if (
        typeof sX === "number" &&
        typeof oW === "number" &&
        !isNaN(sX) &&
        !isNaN(oW)
      )
        left = Math.max(0, sY + (oH - height) / 2);
    }
    const win = window.open(
      url,
      name.replace(/\s+/g, "_"),
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
    if (win) {
      popupRef.current = win;
      popupUrlRef.current = url;
      win.focus();
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_PROFILE") refetch();
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch]);

  const name = user?.name || user?.username || "—";

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Profile
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-6 bg-white dark:bg-background">
        <DataBoundary
          isError={isError}
          data={user}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
        >
          <div className="w-full space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-5 space-y-4 border border-border/40 dark:border-border/30 shadow-sm bg-white dark:bg-background">
                <div className="text-base font-semibold text-foreground">
                  Basic Details
                </div>
                <div className="grid">
                  <CopyRow
                    label={t("basicInfo.name")}
                    value={user?.name}
                    naLabel={na}
                  />
                  <CopyRow
                    label="Username"
                    value={user?.username}
                    naLabel={na}
                  />
                  <CopyRow label="Role" value={user?.role} naLabel={na} />
                  {hasRole(user?.role, ["lawyer"]) ||
                  String(user?.role || "").toLowerCase() === "ad" ? (
                    <CopyRow
                      label="Bar Council"
                      value={user?.bar_council_number}
                      naLabel={na}
                    />
                  ) : null}
                  <CopyRow label="Gender" value={user?.gender} naLabel={na} />
                </div>
              </Card>

              <Card className="p-5 space-y-4 border border-border/40 dark:border-border/30 shadow-sm bg-white dark:bg-background">
                <div className="text-base font-semibold text-foreground">
                  Contact
                </div>
                <div className="grid">
                  <CopyRow label="Email" value={user?.email} naLabel={na} />
                  <CopyRow label="Phone" value={user?.phone} naLabel={na} />
                </div>
              </Card>
            </div>

            <RoleGuard userRole={user?.role} roles={["PO", "CO", "RI", "RSI"]}>
              {(isLoading || user?.court) && (
                <Card className="p-5 border border-border/40 dark:border-border/30 shadow-sm bg-white dark:bg-background">
                  <div className="text-base font-semibold mb-4 text-foreground">
                    Court Details
                  </div>
                  <div className="grid">
                    <CopyRow
                      label="Employee ID"
                      value={user?.employee_id}
                      naLabel={na}
                    />
                    <CopyRow
                      label="Court"
                      value={user?.court_detail?.name || user?.court}
                      naLabel={na}
                    />
                  </div>
                </Card>
              )}
            </RoleGuard>

            {(() => {
              const _role = String(user?.role || "").toLowerCase();
              const _isCitAdv = ["ct", "ad", "ct", "ad", "lawyer"].includes(
                _role,
              );
              return (
                !_isCitAdv &&
                (isLoading || user?.state_name || user?.district_name) && (
                  <Card className="p-5 border border-border/40 dark:border-border/30 shadow-sm bg-white dark:bg-background">
                    <div className="text-base font-semibold mb-4 text-foreground">
                      Location Details
                    </div>
                    <div className="grid">
                      <CopyRow
                        label="State"
                        value={user?.state_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="District"
                        value={user?.district_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="Tehsil"
                        value={user?.tehsil_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="Pargana"
                        value={user?.pargana_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="RI Circle"
                        value={user?.ricircle_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="RSI Circle"
                        value={user?.rsicircle_name}
                        naLabel={na}
                      />
                      <CopyRow
                        label="Village"
                        value={user?.village_name}
                        naLabel={na}
                      />
                    </div>
                  </Card>
                )
              );
            })()}
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
