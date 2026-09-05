import type { RoleCode } from "./types";

const CITIZEN_ROLES: RoleCode[] = ["CT", "AD"];
const ADMINISTRATIVE_ROLES: RoleCode[] = ["SA", "PO", "CO", "CC", "RI", "RSI"];

function normalizeRole(role: string | null | undefined): string {
  return String(role ?? "").toUpperCase();
}

export function isCitizen(role: string | null | undefined): boolean {
  return CITIZEN_ROLES.includes(normalizeRole(role) as RoleCode);
}

export function isAdministrative(role: string | null | undefined): boolean {
  return ADMINISTRATIVE_ROLES.includes(normalizeRole(role) as RoleCode);
}

export function isAllowed(role: string | null | undefined, allowed: (RoleCode | string)[]): boolean {
  const r = normalizeRole(role);
  return allowed.map(normalizeRole).includes(r);
}

export function isAllowedAdd(role: string | null | undefined, allowed: (RoleCode | string)[]): boolean {
  return isAllowed(role, allowed);
}

export function isAllowedEdit(role: string | null | undefined, allowed: (RoleCode | string)[]): boolean {
  return isAllowed(role, allowed);
}

export function isAllowedDelete(role: string | null | undefined, allowed: (RoleCode | string)[]): boolean {
  return isAllowed(role, allowed);
}

export const FIELD_OFFICER_ROLES: RoleCode[] = ["RI", "RSI"];

export function isFieldOfficer(role: string | null | undefined): boolean {
  return FIELD_OFFICER_ROLES.includes(normalizeRole(role) as RoleCode);
}

export const CASE_VIEW_ONLY_ROLES: RoleCode[] = ["SA", "RI", "RSI"];
export const CASE_EDITOR_ROLES: RoleCode[] = ["PO", "CO", "CC"];

export function isCaseViewOnly(role: string | null | undefined): boolean {
  return CASE_VIEW_ONLY_ROLES.includes(normalizeRole(role) as RoleCode);
}
export function isCaseEditor(role: string | null | undefined): boolean {
  return CASE_EDITOR_ROLES.includes(normalizeRole(role) as RoleCode);
}

export const RoleGroups = {
  CITIZEN: CITIZEN_ROLES,
  ADMINISTRATIVE: ADMINISTRATIVE_ROLES,
  FIELD_OFFICER: FIELD_OFFICER_ROLES,
  CASE_VIEW_ONLY: CASE_VIEW_ONLY_ROLES,
  CASE_EDITOR: CASE_EDITOR_ROLES,
} as const;
