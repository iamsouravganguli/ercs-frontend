import { isAllowed } from "./role-utils";

export type CaseRoute = "manage" | "draft";

export const CITIZEN_ADVOCATE_ROLES = ["CT", "CIT", "AD", "ADV", "LAWYER"] as const;
export const COURT_EDITOR_ROLES = ["PO", "CO", "CC"] as const;
export const MANAGE_VIEW_ONLY_ROLES = ["SA", "RI", "RSI"] as const;

const AFTER_SCRUTINY_STAGES = [
  "REGISTRATION",
  "NOTICE",
  "REPLY",
  "EVIDENCE",
  "HEARING",
  "ORDER",
  "EXECUTION",
  "APPEAL",
  "CLOSED",
] as const;

const DRAFT_STATUSES = ["DRAFT", "PENDING_PAYMENT"] as const;

export function normalizeCaseCode(v: unknown): string {
  return String(v ?? "").toUpperCase();
}

export function isCitizenAdvocate(role: unknown): boolean {
  return isAllowed(String(role ?? ""), [...CITIZEN_ADVOCATE_ROLES]);
}

export function isManageEligible(stage: unknown, status: unknown): boolean {
  const stageNorm = normalizeCaseCode(stage);
  const statusNorm = normalizeCaseCode(status);
  if (statusNorm === "REJECTED") return false;
  if (stageNorm === "SCRUTINY" && statusNorm === "APPROVED") return true;
  return (AFTER_SCRUTINY_STAGES as readonly string[]).includes(stageNorm);
}

export function isDraftStatus(status: unknown): boolean {
  return (DRAFT_STATUSES as readonly string[]).includes(
    normalizeCaseCode(status),
  );
}

export function resolveCaseRoute(
  role: unknown,
  stage: unknown,
  status: unknown,
): CaseRoute {
  const statusNorm = normalizeCaseCode(status);
  if (statusNorm === "REJECTED") return "draft";
  if (isCitizenAdvocate(role) || !normalizeCaseCode(role)) {
    return isManageEligible(stage, status) ? "manage" : "draft";
  }
  return isDraftStatus(status) ? "draft" : "manage";
}

export function canModifyManageTab(role: unknown): boolean {
  const r = String(role ?? "");
  if (isAllowed(r, [...MANAGE_VIEW_ONLY_ROLES])) return false;
  if (isCitizenAdvocate(r)) return false;
  return isAllowed(r, [...COURT_EDITOR_ROLES]);
}

export function caseRouteUrl(
  route: CaseRoute,
  caseNumber: string,
  subPath = "",
): string {
  const base =
    route === "manage"
      ? `/case/e-file/manage/${caseNumber}`
      : `/case/e-file/${caseNumber}`;
  return subPath ? `${base}/${subPath}` : base;
}
