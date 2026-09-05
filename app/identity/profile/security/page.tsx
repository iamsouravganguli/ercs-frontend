"use client";

import { useProfileDetail } from '@/lib/query';
import { useTranslation } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataBoundary } from "@/components/ui/data-boundary";
import { Mail, Phone, Lock, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";

export default function SecurityPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const data = useProfileDetail();

  const popupRef = useRef<Window | null>(null);
  const popupUrlRef = useRef<string>("");

  const openCenteredPopup = (
    url: string,
    title: string,
    width = 580,
    height = 685,
  ) => {
    if (popupRef.current && !popupRef.current.closed) {
      if (popupUrlRef.current === url) {
        popupRef.current.focus();
        return;
      }
    }

    let left = 100;
    let top = 100;
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
      ) {
        left = Math.max(0, sX + (oW - width) / 2);
      }
      if (
        typeof sY === "number" &&
        typeof oH === "number" &&
        !isNaN(sY) &&
        !isNaN(oH)
      ) {
        top = Math.max(0, sY + (oH - height) / 2);
      }
    }
    const name = title.replace(/\s+/g, "_");
    const win = window.open(
      url,
      name,
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
      if (event.data === "REFRESH_PROFILE") {
        data.refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [data]);

  const profileData: any = data.data?.result?.data;

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-row items-center gap-3 px-4 h-14 shrink-0">
        <div className="flex items-center shrink-0 md:hidden">
          <SidebarTrigger />
        </div>
        <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
          {t("page_tab.security") || "Security"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <DataBoundary
          isError={data.isError}
          data={profileData}
          errorTitle={t("common_status.something_wrong.label")}
          errorMessage={
            (data.error as any)?.response?.data?.message ||
            t("common_status.something_wrong.description")
          }
          onRefetch={data.refetch}
          emptyTitle={t("common_status.no_data.label")}
          emptyMessage={t("common_status.no_data.description")}
          refetchLabel={t("common_button.retry.label")}
        >
          <div className="p-4 sm:p-6 space-y-6">
            <Card className="p-5 space-y-4">
              <h3 className="font-semibold text-sm text-foreground/80 tracking-wide uppercase">
                Account Information
              </h3>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("security.mobile.label")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profileData?.phone ||
                        t("common_status.not_available.label")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() =>
                    openCenteredPopup(
                      "/action/security/change-phone",
                      "Change Mobile Number",
                    )
                  }
                >
                  <Pencil className="h-4 w-4" />
                  {t("common_button.change.label")}
                </Button>
              </div>

              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("security.email.label")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {profileData?.email ||
                        t("common_status.not_available.label")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() =>
                    openCenteredPopup(
                      "/action/security/change-email",
                      "Change Email Address",
                    )
                  }
                >
                  <Pencil className="h-4 w-4" />
                  {t("common_button.change.label")}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-0">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {t("security.password.label")}
                    </p>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() =>
                    openCenteredPopup(
                      "/action/security/change-password",
                      "Change Password",
                    )
                  }
                >
                  <Pencil className="h-4 w-4" />
                  {t("common_button.change.label")}
                </Button>
              </div>
            </Card>
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
