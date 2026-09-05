"use client";
import { useTranslation } from "@/i18n";
import { EntityStats } from "../entity-stats";

export type LandStatItem = {
  id: string;
  khata_number?: string | null;
  calculated_area?: number | string | null;
  disputed_land?: number | string | null;
  total_land?: number | string | null;
};

export type LandStatsProps = {
  lands: LandStatItem[];
  className?: string;
};

export function LandStats({ lands, className }: LandStatsProps) {
  const { t } = useTranslation();
  const totalArea = lands.reduce((sum, l) => {
    const v = (l as any).calculated_area ?? (l as any).total_land ?? 0;
    const area = typeof v === "string" ? parseFloat(v) : v || 0;
    return sum + (isNaN(area) ? 0 : area);
  }, 0);
  const totalDisputedArea = lands.reduce((sum, l) => {
    const v = (l as any).disputed_land ?? 0;
    const area = typeof v === "string" ? parseFloat(v) : v || 0;
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
  return (
    <EntityStats
      className={className}
      stats={[
        { label: t("case.lands.total_parcels"), value: lands.length },
        { label: t("case.lands.total_area"), value: `${formatArea(totalArea, 2)} ${t("case.lands.hec")}` },
        { label: t("case.lands.disputed_area"), value: `${formatArea(totalDisputedArea, 2)} ${t("case.lands.hec")}` },
        { label: t("case.lands.khata_count"), value: khataCount },
      ]}
    />
  );
}
