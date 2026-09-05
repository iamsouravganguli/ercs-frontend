"use client";
import { useTranslation } from "@/i18n";
import type { PartyDetail } from "@/lib";
import { EntityStats } from "../entity-stats";

const CLAIMANT_CODES = [
  "CIT_PLAINTIFF",
  "CIT_APPELLANT",
  "CIT_REVISIONIST",
  "CIT_PETITIONER",
] as const;
const isClaimant = (code?: string | null) =>
  !!code && (CLAIMANT_CODES as readonly string[]).includes(code);

export type PartyStatsProps = {
  parties: PartyDetail[];
  className?: string;
};

export function PartyStats({ parties, className }: PartyStatsProps) {
  const { t } = useTranslation();
  const claimantParties = parties.filter((p) =>
    isClaimant(p.party_type_detail?.code),
  );
  const opponentParties = parties.filter(
    (p) =>
      !!p.party_type_detail?.code && !isClaimant(p.party_type_detail?.code),
  );

  return (
    <EntityStats
      className={className}
      stats={[
        { label: t("case.parties.total_parties"), value: parties.length },
        { label: t("case.parties.claimants"), value: claimantParties.length },
        { label: t("case.parties.opponents"), value: opponentParties.length },
      ]}
    />
  );
}
