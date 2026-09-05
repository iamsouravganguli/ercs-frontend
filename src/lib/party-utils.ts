export const CLAIMANT_CODES = ["CIT_PLAINTIFF", "CIT_APPELLANT", "CIT_REVISIONIST", "CIT_PETITIONER"] as const;
export const GOVT_CODES = ["CIT_STATE", "CIT_GAON_SABHA"] as const;

export const PARTY_TYPE_COLORS: Record<string, string> = {
  CIT_PLAINTIFF: "bg-indigo-600",
  CIT_DEFENDANT: "bg-orange-500",
  CIT_STATE: "bg-emerald-500",
};

export const PARTY_NATURE_COLORS: Record<string, string> = {
  INDIVIDUAL: "bg-blue-500",
  ORGANIZATION: "bg-violet-500",
};

export function getPartyTypeColor(code: string): string {
  if ((CLAIMANT_CODES as readonly string[]).includes(code) || code === "ADV_PLAINTIFF" || code === "ADV_APPELLANT") return "bg-indigo-600";
  if ((GOVT_CODES as readonly string[]).includes(code)) return "bg-emerald-500";
  if (code?.startsWith("ADV_")) return "bg-violet-500";
  return "bg-orange-500";
}

export function getPartyTypeGroup(code: string): "claimant" | "govt" | "advocate" | "opponent" {
  if ((CLAIMANT_CODES as readonly string[]).includes(code) || code === "ADV_PLAINTIFF" || code === "ADV_APPELLANT") return "claimant";
  if ((GOVT_CODES as readonly string[]).includes(code)) return "govt";
  if (code?.startsWith("ADV_")) return "advocate";
  return "opponent";
}
