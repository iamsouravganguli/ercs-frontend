"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Plus,
  MapPin,
  Layers,
  FileText,
  Trash2,
  ArrowRight,
  Pencil,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import toast from "react-hot-toast";

import { useCaseLandList, useCaseLandDelete, useCaseDetail } from '@/lib/query';
import { useTranslation } from "@/i18n";

export default function CaseLandsPage() {
  const router = useRouter();
  const params = useParams();
  const caseNumber = params?.case_number as string;
  const { t, lang } = useTranslation();

  const caseDetail = useCaseDetail(caseNumber);
  const isSubmitted = caseDetail.data?.result?.data?.is_submitted === true;

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
    land_type: apiLand.land_type,
    land_type_description: apiLand.land_type_desc,
    fasli_year: apiLand.fasli_year,
    plots: apiLand.khasra_no ? apiLand.khasra_no.split(", ") : [],
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

  const openAdd = () => {
    if (!caseNumber) return;
    const width = 850;
    const height = 900;

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

    window.open(
      `/case/${caseNumber}/lands/add`,
      "LandFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  const openEdit = (l: any, isView = false) => {
    if (!caseNumber) return;
    const width = 850;
    const height = 900;

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

    window.open(
      `/case/${caseNumber}/lands/edit?id=${l.id}${isView ? "&view=true" : ""}`,
      "LandFormPopup",
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`,
    );
  };

  const removeLand = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        await deleteMutation.mutateAsync({
          case_no: caseNumber,
          pk: numericId,
        });
        toast.success(t("case.lands.deleted_toast"));
        landListQuery.refetch();
      }
    } catch (err) {
      console.error("Failed to delete land record:", err);
      toast.error(t("case.lands.delete_failed_toast"));
    }
  };

  const handleSave = (redirect = false) => {
    if (!caseNumber) return;
    toast.success(t("case.lands.saved_toast"));
    if (redirect) {
      router.push(`/case/${caseNumber}/documents`);
    }
  };


  const totalArea = lands.reduce((sum, l) => {
    const area =
      typeof l.calculated_area === "string"
        ? parseFloat(l.calculated_area)
        : l.calculated_area || 0;
    return sum + (isNaN(area) ? 0 : area);
  }, 0);
  const totalDisputedArea = lands.reduce((sum, l) => {
    const area =
      typeof l.disputed_land === "string"
        ? parseFloat(l.disputed_land)
        : l.disputed_land || 0;
    return sum + (isNaN(area) ? 0 : area);
  }, 0);
  const khataCount = new Set(lands.map((l) => l.khata_number).filter(Boolean))
    .size;

  const formatArea = (val: any, decimals = 4) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return typeof num === "number" && !isNaN(num)
      ? num.toFixed(decimals)
      : (0).toFixed(decimals);
  };


  const GOVT_TYPES = [
    "GOVT",
    "GOVERNMENT",
    "GAON_SABHA",
    "SARKARI",
    "PANCHAYAT",
    "FOREST",
  ];
  const PRIVATE_TYPES = ["KHATEDARI", "PRIVATE", "BHUMISWAMI", "BHOOMISWAMI"];
  const ABADI_TYPES = ["ABADI", "RESIDENTIAL", "NAZUL"];

  const getLandTypeGroup = (landType: string | null | undefined) => {
    const upper = (landType || "").toUpperCase();
    if (GOVT_TYPES.some((g) => upper.includes(g))) return "govt";
    if (PRIVATE_TYPES.some((p) => upper.includes(p))) return "private";
    if (ABADI_TYPES.some((a) => upper.includes(a))) return "abadi";
    return "other";
  };

  const getLandTypeBadgeClass = (landType: string | null | undefined) => {
    const group = getLandTypeGroup(landType);
    if (group === "govt")
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10";
    if (group === "private")
      return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/10";
    if (group === "abadi")
      return "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/10";
    return "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/10";
  };

  const getLandTypeAvatarClass = (landType: string | null | undefined) => {
    const group = getLandTypeGroup(landType);
    if (group === "govt") return "bg-emerald-500/10 text-emerald-600";
    if (group === "private") return "bg-indigo-500/10 text-indigo-600";
    if (group === "abadi") return "bg-orange-500/10 text-orange-600";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-neutral-950 overflow-hidden relative border-r">
      {}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar">
        {}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.lands.total_parcels")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {lands.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.lands.total_area")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {formatArea(totalArea, 2)}{" "}
                <span className="text-sm font-medium text-muted-foreground/85">
                  {t("case.lands.hec")}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.lands.disputed_area")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {formatArea(totalDisputedArea, 2)}{" "}
                <span className="text-sm font-medium text-muted-foreground/85">
                  {t("case.lands.hec")}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-blue-100/80 dark:border-blue-900/30 bg-blue-50/70 dark:bg-blue-950/30 p-4 flex items-center gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted-foreground tracking-wider">
                {t("case.lands.khata_count")}
              </p>
              <p className="text-2xl font-bold mt-0.5 text-foreground">
                {khataCount}
              </p>
            </div>
          </div>
        </div>

        {}
        <Card className="py-0! gap-0! overflow-hidden">
          <CardHeader className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-100/80 dark:border-blue-900/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-left">
                <CardTitle className="text-sm font-semibold">
                  {t("case.lands.land_parcels")}
                </CardTitle>
              </div>
              <Button
                size="sm"
                onClick={openAdd}
                className="w-full sm:w-auto"
                disabled={isSubmitted}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("case.lands.add_btn")}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            {lands.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-background border border-dashed rounded-2xl m-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("case.lands.no_parcels")}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {}
                <div className="hidden md:block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border text-left">
                    <tbody className="divide-y divide-border bg-card">
                      {lands.map((land) => {
                        return (
                          <tr
                            key={land.id}
                            className="hover:bg-muted/5 transition-colors duration-150"
                          >
                            {}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getLandTypeAvatarClass(land.land_type)}`}
                                >
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">
                                    {land.village_name ||
                                      t("case.lands.unknown_village")}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {t("case.lands.khata_label")}:{" "}
                                    {land.khata_number || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md select-none ${getLandTypeBadgeClass(land.land_type)}`}
                              >
                                {land.land_type || t("case.lands.unknown_type")}
                              </Badge>
                            </td>

                            {}
                            <td
                              className="px-6 py-4 whitespace-nowrap text-xs text-foreground max-w-48 truncate"
                              title={(Array.isArray(land.plots)
                                ? land.plots
                                : []
                              ).join(", ")}
                            >
                              {(Array.isArray(land.plots)
                                ? land.plots
                                : []
                              ).join(", ")}
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground">
                              <div className="font-medium">
                                {formatArea(land.calculated_area, 4)}{" "}
                                {t("case.lands.hec")}
                              </div>
                              <div
                                className={`text-[10px] mt-0.5 ${land.disputed_land > 0 ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"}`}
                              >
                                {t("case.lands.disputed_area")}:{" "}
                                {formatArea(land.disputed_land, 4)}{" "}
                                {t("case.lands.hec")}
                              </div>
                            </td>

                            {}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  onClick={() => openEdit(land, true)}
                                  title={t("case.lands.view_details")}
                                >
                                  <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                </Button>
                                {!isSubmitted && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    onClick={() => openEdit(land)}
                                    title={t("case.lands.edit_details")}
                                  >
                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                )}
                                {!isSubmitted && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeLand(land.id)}
                                    title={t("case.lands.delete")}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {}
                <div className="md:hidden divide-y divide-border">
                  {lands.map((land) => (
                    <div
                      key={land.id}
                      className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-4 min-w-0 text-left">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getLandTypeAvatarClass(land.land_type)}`}
                        >
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 font-medium">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold truncate">
                              {land.village_name ||
                                t("case.lands.unknown_village")}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider rounded-md select-none ${getLandTypeBadgeClass(land.land_type)}`}
                            >
                              {land.land_type || t("case.lands.unknown_type")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {t("case.lands.khata_label")}:{" "}
                              {land.khata_number || "—"}
                            </span>
                            <span className="text-muted-foreground/30 text-[10px]">
                              •
                            </span>
                            <span
                              className="text-[10px] text-muted-foreground max-w-32 truncate"
                              title={(Array.isArray(land.plots)
                                ? land.plots
                                : []
                              ).join(", ")}
                            >
                              {t("case.lands.khasra_label")}:{" "}
                              {(Array.isArray(land.plots)
                                ? land.plots
                                : []
                              ).join(", ")}
                            </span>
                            <span className="text-muted-foreground/30 text-[10px]">
                              •
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {t("case.lands.total_area")}:{" "}
                              {formatArea(land.calculated_area, 4)}{" "}
                              {t("case.lands.hec")}
                            </span>
                            <span className="text-muted-foreground/30 text-[10px]">
                              •
                            </span>
                            <span
                              className={`text-[10px] ${land.disputed_land > 0 ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground"}`}
                            >
                              {t("case.lands.disputed_area")}:{" "}
                              {formatArea(land.disputed_land, 4)}{" "}
                              {t("case.lands.hec")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => openEdit(land, true)}
                          title={t("case.lands.view_details")}
                        >
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </Button>
                        {!isSubmitted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-muted"
                            onClick={() => openEdit(land)}
                            title={t("case.lands.edit_details")}
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                        {!isSubmitted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLand(land.id)}
                            title={t("case.lands.delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <div className="h-14 flex items-center justify-end border-t border-border bg-white dark:bg-neutral-950 px-8 z-10 relative shrink-0">
        <Button
          type="button"
          disabled={isSubmitted || lands.length === 0}
          className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs hover:shadow-sm transition-all duration-150 disabled:bg-emerald-600/35 disabled:text-white/60 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-auto dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:disabled:bg-emerald-800/35 dark:disabled:text-white/60"
          onClick={() => handleSave(true)}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <span>{t("case.lands.next_btn")}</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </Button>
      </div>
    </div>
  );
}
