"use client";
import { useProfileDetail } from '@/lib/query';
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n";
import {
  SectionCard,
  InfoGrid,
  InfoItem,
} from "@/components/ui/section-card";
import { hasRole, RoleGuard } from "@/components/ui/role-guard";
import { DataBoundary } from "@/components/ui/data-boundary";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useEffect, useRef } from "react";

export default function Profile() {
  const { data, isLoading, isError, error, refetch } = useProfileDetail();
  const user = data?.result?.data;
  const router = useRouter();
  const { t } = useTranslation();
  const na = t("common_status.not_available.label");
  const edit = t("common_button.edit.label");

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
        refetch();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [refetch]);

  return (
    <div className="w-full h-full flex flex-col bg-background overflow-hidden">
      {}
      <div className="sticky top-0 z-20 bg-[#dbeafe] dark:bg-slate-900 border-b border-blue-200 dark:border-blue-900 w-full flex flex-row items-center gap-3 px-4 h-14 shrink-0">
        <div className="flex items-center shrink-0 md:hidden">
          <SidebarTrigger />
        </div>
        <span className="font-bold text-base sm:text-lg text-foreground tracking-tight shrink-0">
          {t("page_tab.profile") || "My Profile"}
        </span>
      </div>

      {}
      <div className="flex-1 overflow-y-auto min-h-0">
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
          <div className="p-4 sm:p-6 space-y-5">
            <SectionCard
              title={t("sections.basic_details")}
              editLabel={edit}
              isLoading={isLoading}
              skeletonRows={8}
              onEdit={() =>
                openCenteredPopup(
                  "/profile/edit?section=basic",
                  "Edit Basic Details",
                )
              }
              isEditDisabled={hasRole(user?.role, ["SA"])}
            >
              <InfoGrid>
                <InfoItem
                  label={t("basicInfo.name")}
                  value={user?.name}
                  naLabel={na}
                />
                <InfoItem
                  label={t("basicInfo.username")}
                  value={user?.username}
                  naLabel={na}
                />
                <InfoItem
                  label={t("basicInfo.email")}
                  value={user?.email}
                  naLabel={na}
                />
                <InfoItem
                  label={t("basicInfo.phone")}
                  value={user?.phone}
                  naLabel={na}
                />
                <InfoItem
                  label={t("basicInfo.role")}
                  value={user?.role}
                  naLabel={na}
                />

                <RoleGuard userRole={user?.role} roles="lawyer">
                  <InfoItem
                    label={t("basicInfo.barCouncilNo")}
                    value={user?.bar_council_number}
                    naLabel={na}
                  />
                </RoleGuard>
                <InfoItem
                  label={t("basicInfo.gender")}
                  value={user?.gender}
                  naLabel={na}
                />
              </InfoGrid>
            </SectionCard>

            <RoleGuard userRole={user?.role} roles={["PO", "CO", "RI", "RSI"]}>
              {(isLoading || user?.court) && (
                <SectionCard
                  title={t("sections.court_details")}
                  editLabel={edit}
                  isLoading={isLoading}
                  skeletonRows={2}
                  onEdit={() =>
                    openCenteredPopup(
                      "/profile/edit?section=court",
                      "Edit Court Details",
                    )
                  }
                >
                  <InfoGrid>
                    <InfoItem
                      label={t("basicInfo.employeeId")}
                      value={user?.employee_id}
                      naLabel={na}
                    />
                    <InfoItem
                      label={t("courtDetails.court")}
                      value={user?.court_detail?.name || user?.court}
                      naLabel={na}
                    />
                  </InfoGrid>
                </SectionCard>
              )}
            </RoleGuard>
            {(() => {
              const _isCitAdv2 = ["ct", "ad", "ct", "ad", "lawyer"].includes(
                String(user?.role || "").toLowerCase(),
              );
              return (
                !_isCitAdv2 &&
                (isLoading || user?.state_name || user?.district_name)
              );
            })() && (
              <SectionCard
                title={t("sections.location_details")}
                editLabel={edit}
                isLoading={isLoading}
                skeletonRows={4}
                onEdit={() =>
                  openCenteredPopup(
                    "/identity/profile/details/change-address",
                    "Change Address",
                  )
                }
                isEditDisabled={hasRole(user?.role, ["SA"])}
              >
                <InfoGrid>
                  <InfoItem
                    label={t("location.state_name.label")}
                    value={user?.state_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.district_name.label")}
                    value={user?.district_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.tehsil_name.label")}
                    value={user?.tehsil_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.pargana_name.label")}
                    value={user?.pargana_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.ricircle_name.label")}
                    value={user?.ricircle_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.rsicircle_name.label")}
                    value={user?.rsicircle_name}
                    naLabel={na}
                  />
                  <InfoItem
                    label={t("location.village_name.label")}
                    value={user?.village_name}
                    naLabel={na}
                  />
                </InfoGrid>
              </SectionCard>
            )}
          </div>
        </DataBoundary>
      </div>
    </div>
  );
}
