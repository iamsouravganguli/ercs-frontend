"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LandStats } from "./land-stats";
import { LandModals, LandDeleteConfirmDialog } from "./land-modals";
import { LandTable } from "./land-table";
import toast from "react-hot-toast";

import {
  useCaseLandList,
  useCaseLandDelete,
  useCaseDetail,
  useSessionCheck,
} from "@/lib";
import { useTranslation } from "@/i18n";
import { useEFileFooter } from "../../../../app/case/e-file/[caseId]/layout";

export default function EFileLandsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const caseNumber = caseId as string;
  const { t } = useTranslation();

  const caseDetail = useCaseDetail(caseNumber);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;
  const session = useSessionCheck();
  const role = String((session.data as any)?.result?.data?.role ?? "").toUpperCase();
  const isViewOnly = ["SA", "RI", "RSI"].includes(role);
  const canModify = !isSubmitted && !isViewOnly;

  const landListQuery = useCaseLandList(caseNumber);
  const apiLands = landListQuery.data?.result?.data || [];
  const deleteMutation = useCaseLandDelete();


  const lands = apiLands.map((apiLand: any) => ({
    id: String(apiLand.id),
    state_code_census: apiLand.state_code_census,
    state_name: apiLand.state_name,
    mandal_code: apiLand.mandal_code,
    mandal_name: apiLand.mandal_name,
    district_code_census: apiLand.district_code_census,
    district_name: apiLand.district_name,
    tehsil_code_census: apiLand.tehsil_code_census,
    tehsil_name: apiLand.tehsil_name,
    pargana_code: apiLand.pargana_code,
    pargana_name: apiLand.pargana_name,
    ricircle_code: apiLand.ricircle_code,
    ricircle_name: apiLand.ricircle_name,
    rsicircle_code: apiLand.rsicircle_code,
    rsicircle_name: apiLand.rsicircle_name,
    village_code_census: apiLand.village_code_census,
    village_name: apiLand.village_name,
    khata_number: apiLand.khata_number,
    status_detail: apiLand.status_detail || apiLand.status || null,
    land_type: apiLand.land_type,
    land_type_description: apiLand.land_type_desc,
    fasli_year: apiLand.fasli_year,
    plots: apiLand.khasra_no
      ? apiLand.khasra_no
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean)
      : [],
    khasra_no: apiLand.khasra_no || "",
    calculated_area: apiLand.total_land ? Number(apiLand.total_land) : 0,
    disputed_land: apiLand.disputed_land ? Number(apiLand.disputed_land) : 0,
    owners: apiLand.actual_owners || [],
    orders: apiLand.orders || [],
  }));


  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data === "refetch-lands") {
        landListQuery.refetch();
      }
    };

    const handleFocus = () => {
      landListQuery.refetch();
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [landListQuery]);

  const [landModal, setLandModal] = useState<{
    open: boolean;
    landId?: string | null;
    isEditing?: boolean;
    isView?: boolean;
  }>({ open: false });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const openAdd = () =>
    setLandModal({ open: true, landId: null, isEditing: false, isView: false });
  const openEdit = (l: any, isView = false) =>
    setLandModal({
      open: true,
      landId: String(l.id),
      isEditing: !isView,
      isView,
    });


  const hasMinLands = lands.length >= 1;
  const footerCtx = useEFileFooter();
  useEffect(() => {
    footerCtx.setFooterConfig?.({
      nextDisabled: !hasMinLands,
    });
    return () => footerCtx.setFooterConfig?.({});

  }, [hasMinLands]);

  return (
    <div className="space-y-6">
      <LandStats lands={lands as any} />

      <LandTable
        lands={lands as any}
        isSubmitted={isSubmitted || isViewOnly}
        onAdd={canModify ? openAdd : undefined}
        onView={(l) => openEdit(l, true)}
        onEdit={canModify ? (l) => openEdit(l) : undefined}
        onDelete={canModify ? (id) => {
          const l = lands.find((x) => x.id === id);
          if (l) setDeleteTarget(l);
        } : undefined}
      />

      <LandModals
        landModal={landModal}
        onOpenChange={(o) => setLandModal((p) => ({ ...p, open: o }))}
        onSuccess={() => landListQuery.refetch()}
      />

      <LandDeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            const numericId = parseInt(deleteTarget.id, 10);
            if (!isNaN(numericId)) {
              await deleteMutation.mutateAsync({
                case_no: caseNumber,
                pk: numericId,
              });
              toast.success(t("case.lands.deleted_toast"));
              landListQuery.refetch();
            }
          } catch (err) {
            toast.error(t("case.lands.delete_failed_toast"));
          }
          setDeleteTarget(null);
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
