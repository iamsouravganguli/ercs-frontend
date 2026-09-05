"use client";
import { formatDate, getExpired, getStatus, parseDevice, SessionListData, useSessionList, useConfirm } from '@/lib/query';
import { StatusBadge } from "@/components/ui/status-badge";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Monitor, Phone, Eye } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalBody,
  CustomModalFooter,
  CustomModalClose,
} from "@/components/ui/custom-modal";
import { SignOutAllService, SignOutOneService } from "./services";
import toast from "react-hot-toast";

export default function SessionPageList() {
  const confirm = useConfirm();
  const [viewSession, setViewSession] = useState<SessionListData | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleView = (item: SessionListData) => {
    setViewSession(item);
    setIsViewOpen(true);
  };
  const handleViewClose = (open: boolean) => {
    setIsViewOpen(open);
    if (!open) setViewSession(null);
  };

  const { t } = useTranslation();
  const data = useSessionList();
  const SignOutAll = useMutation({
    mutationKey: ["SignOutAll"],
    mutationFn: SignOutAllService,
    onSuccess: (res) => {
      toast.success(res.message);
      data.refetch();
    },
  });
  const SignOutOne = useMutation({
    mutationKey: ["SignOutOne"],
    mutationFn: SignOutOneService,
    onSuccess: (res) => {
      toast.success(res.message);
      data.refetch();
    },
  });
  const onSignOutOne = async (id: string) => {
    const confirmed = await confirm({
      title: t("session.signout_one.title"),
      description: t("session.signout_one.description"),
      confirmText: t("session.signout_one.confirm"),
      cancelText: t("common.cancel"),
    });

    if (!confirmed) return;

    SignOutOne.mutate({ session_id: id });
  };

  const onSignOutAll = async () => {
    const confirmed = await confirm({
      title: t("session.signout_all.title"),
      description: t("session.signout_all.description"),
      confirmText: t("session.signout_all.confirm"),
      cancelText: t("common.cancel"),
    });

    if (!confirmed) return;

    SignOutAll.mutate();
  };

  const list = (data?.data?.result?.data ?? []) as SessionListData[];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-background overflow-hidden">
      <div className="shrink-0 h-14 flex items-center justify-between gap-4 px-6 bg-white dark:bg-background sticky top-0 z-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Sessions
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={onSignOutAll}
          disabled={SignOutAll.isPending}
          className="h-8 px-3 shrink-0 border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {SignOutAll.isPending ? "..." : t("common.end_all") || "End All"}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-white dark:bg-background">
        <div className="w-full space-y-5">
          <Card className="p-4 sm:p-5 flex flex-col gap-5 border-0 shadow-sm bg-white dark:bg-card rounded-xl">
            <div className="space-y-1">
              <p className="text-base font-semibold leading-none text-foreground">
                Active Sessions
              </p>
              <p className="text-xs text-muted-foreground">
                {list.length} session(s)
              </p>
            </div>

            {data.isError ? (
              <div className="p-4 rounded-xl border border-destructive/15 bg-destructive/10 dark:bg-destructive/15 text-destructive dark:text-red-400 text-xs text-center">
                {(data.error as any)?.response?.data?.message ||
                  t("common_status.something_wrong.description")}
              </div>
            ) : list.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border dark:border-border rounded-xl bg-card/50 dark:bg-card/30">
                No active sessions.
              </p>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-card">
                {list.map((item) => {
                  const parsed = parseDevice(item.device);
                  const isUnknown =
                    !parsed?.browser && !parsed?.os && !parsed?.browserVersion;
                  const { label } = getStatus(item as any);
                  return (
                    <div
                      key={item.session_id}
                      className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {parsed?.deviceType === "desktop" ? (
                          <Monitor className="h-5 w-5 text-muted-foreground shrink-0" />
                        ) : (
                          <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-foreground">
                            {isUnknown ? (
                              t("common.unidentified")
                            ) : (
                              <>
                                {parsed?.browser || t("common.unknown")}{" "}
                                {parsed?.os ? `on ${parsed.os}` : ""}
                              </>
                            )}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {item.ip_address} • {formatDate(item.last_used_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <StatusBadge
                          variant={item.is_active ? "success" : "neutral"}
                        >
                          {label}
                        </StatusBadge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleView(item)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => onSignOutOne(item.session_id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      <CustomModal
        open={isViewOpen}
        onOpenChange={handleViewClose}
        className="max-w-[520px]"
      >
        <CustomModalClose onClose={() => handleViewClose(false)} />
        <CustomModalHeader>
          <CustomModalTitle>
            {t("session.view.title") || "View Session"}
          </CustomModalTitle>
          <CustomModalDescription>
            {t("session.view.description") ||
              "Active login session profiling and metadata details"}
          </CustomModalDescription>
        </CustomModalHeader>
        {viewSession ? (
          <>
            <CustomModalBody className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("table.sessionId") || "Session ID"}
                  </span>
                  <span className="text-foreground font-mono font-semibold mt-0.5 break-all text-xs">
                    {viewSession.session_id}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.device") || "Device / Browser"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5 flex items-center gap-2 text-sm">
                      {(() => {
                        const p = parseDevice(viewSession.device);
                        return p?.deviceType === "desktop" ? (
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        );
                      })()}
                      {(() => {
                        const p = parseDevice(viewSession.device);
                        const unk = !p?.browser && !p?.os;
                        return unk
                          ? t("common.unidentified")
                          : `${p?.browser || t("common.unknown")} ${p?.os ? `on ${p.os}` : ""}`;
                      })()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.ip") || "IP Address"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5 text-sm">
                      {viewSession.ip_address || "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.createdOn") || "Created On"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5 text-sm">
                      {viewSession.created_at
                        ? formatDate(viewSession.created_at)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.lastOnline") || "Last Online"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5 text-sm">
                      {viewSession.last_used_at
                        ? formatDate(viewSession.last_used_at)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.expireOn") || "Expires On"}
                    </span>
                    <span className="text-foreground font-medium mt-0.5 text-sm">
                      {viewSession.expires_at
                        ? formatDate(viewSession.expires_at)
                        : "-"}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t("table.status") || "Status"}
                    </span>
                    <span className="mt-1">
                      <StatusBadge
                        variant={viewSession.is_active ? "success" : "neutral"}
                      >
                        {getStatus(viewSession as any).label}
                      </StatusBadge>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-medium">
                    {t("table.userAgent") || "User Agent String"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1 break-all bg-muted/50 p-2.5 rounded-lg border border-border/30">
                    {viewSession.device || "-"}
                  </span>
                </div>
              </div>
            </CustomModalBody>
            <CustomModalFooter>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleViewClose(false)}
              >
                {t("common_button.close.label") || "Close"}
              </Button>
            </CustomModalFooter>
          </>
        ) : (
          <CustomModalBody>
            <p className="text-sm text-muted-foreground text-center py-4">
              No session selected.
            </p>
          </CustomModalBody>
        )}
      </CustomModal>
    </div>
  );
}
