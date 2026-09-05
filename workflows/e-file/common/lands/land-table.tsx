"use client";
import { Eye, Hash, MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EntityStatusBadge } from "../entity-status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTranslation } from "@/i18n";

export type LandTableItem = {
  id: string;
  khata_number?: string | null;
  land_type?: string | null;
  land_type_description?: string | null;
  plots?: string[];
  khasra_no?: string;
  calculated_area?: number | string | null;
  total_land?: number | string | null;
  disputed_land?: number | string | null;
  status_detail?: { code: string; name: string; name_en: string } | null;
};

export type LandTableProps = {
  lands: LandTableItem[];
  isSubmitted?: boolean;
  onAdd?: () => void;
  onView?: (land: LandTableItem) => void;
  onEdit?: (land: LandTableItem) => void;
  onDelete?: (id: string) => void;
  title?: string;
  addLabel?: string;
  emptyText?: string;
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
const getLandTypeAvatarClass = () =>
  "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700";


export function LandTable({
  lands,
  isSubmitted,
  onAdd,
  onView,
  onEdit,
  onDelete,
  title,
  addLabel,
  emptyText,
}: LandTableProps) {
  const { t, lang } = useTranslation();
  const formatArea = (val: any, decimals = 4) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    return typeof num === "number" && !isNaN(num)
      ? num.toFixed(decimals)
      : (0).toFixed(decimals);
  };
  const getArea = (l: LandTableItem) =>
    (l.calculated_area ?? l.total_land ?? 0) as any;
  return (
    <Card className="py-0! gap-0! overflow-hidden border border-zinc-100 dark:border-zinc-800 rounded-xl bg-card">
      <CardHeader className="px-4 sm:px-6 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold">
            {title ?? t("case.lands.land_parcels")}
          </CardTitle>
          {onAdd && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAdd}
              className="shrink-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800"
              disabled={isSubmitted}
            >
              <span className="w-4 h-4 mr-2 flex items-center justify-center text-sm leading-none">
                +
              </span>
              {addLabel ?? t("case.lands.add_btn")}
            </Button>
          )}
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
                {emptyText ?? t("case.lands.no_parcels")}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden md:block min-w-full align-middle">
              <table className="min-w-full divide-y divide-border text-left">
                <tbody className="divide-y divide-border bg-card">
                  {lands.map((land) => (
                    <tr
                      key={land.id}
                      className="hover:bg-muted/5 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white dark:bg-indigo-500"><MapPin className="w-4 h-4" /></div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium text-muted-foreground leading-none">
                              {t("case.lands.khata_label")}
                            </p>
                            <p className="text-xs font-semibold text-foreground mt-1">
                              {land.khata_number || "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md select-none ${getLandTypeBadgeClass(land.land_type)}`}
                        >
                          {land.land_type || t("case.lands.unknown_type")}
                        </Badge>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-xs text-foreground max-w-[280px]"
                        title={(Array.isArray(land.plots)
                          ? land.plots
                          : []
                        ).join(", ")}
                      >
                        {(() => {
                          const plots = Array.isArray(land.plots)
                            ? land.plots
                            : [];
                          if (plots.length === 0)
                            return (
                              <span className="text-muted-foreground">—</span>
                            );
                          const shown = plots.slice(0, 3);
                          const rest = plots.length - shown.length;
                          return (
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">
                                {shown.join(", ")}
                              </span>
                              {rest > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                  +{rest} more
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-foreground">
                        <div className="font-medium">
                          {formatArea(getArea(land), 4)} {t("case.lands.hec")}
                        </div>
                        <div className="text-[10px] mt-0.5 text-muted-foreground">
                          {t("case.lands.disputed_area")}:{" "}
                          {formatArea(land.disputed_land, 4)}{" "}
                          {t("case.lands.hec")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <EntityStatusBadge detail={land.status_detail as any} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        <div className="flex justify-end gap-1">
                          {onView && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => onView(land)}
                              title={t("case.lands.view_details")}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          {!isSubmitted && onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-muted"
                              onClick={() => onEdit(land)}
                              title={t("case.lands.edit_details")}
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          )}
                          {!isSubmitted && onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              onClick={() => onDelete(land.id)}
                              title={t("case.lands.delete")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="block md:hidden bg-white dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800 border-y border-zinc-100 dark:border-zinc-800">
              {lands.map((land) => (
                <div
                  key={land.id}
                  className="flex items-center gap-3 px-3 py-3 bg-white dark:bg-zinc-900"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-indigo-600 text-white dark:bg-indigo-500"><MapPin className="w-3.5 h-3.5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground leading-none truncate">
                      {t("case.lands.khata_label")}: {land.khata_number || "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate mt-1">
                      {(() => {
                        const plots = Array.isArray(land.plots) ? land.plots : [];
                        const full = plots.length ? plots.join(", ") : "—";
                        return `${t("case.lands.khasra_label")}: ${full}`;
                      })()}
                    </p>
                  </div>
                  <EntityStatusBadge detail={land.status_detail as any} className="shrink-0 scale-90 origin-right" />
                  <div className="flex items-center gap-0.5 shrink-0 -mr-1">
                    {onView && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(land)}>
                        <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    {!isSubmitted && onEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(land)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    {!isSubmitted && onDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => onDelete(land.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
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
  );
}
