import { atom } from "jotai";
import { PermissionsData, RolesData } from "./types";
import { atomWithReset } from "jotai/utils";

export const PermissionAddModalAtom = atom(false);
export const PermissionEditModalAtom = atom(false);
export const RoleAddModalAtom = atom(false);
export const RoleEditModalAtom = atom(false);

export const PermissionDetailAtom = atomWithReset<PermissionsData | null>(null);
export const RoleDetailAtom = atomWithReset<RolesData | null>(null);

export const CitizenEditModalAtom = atom(false);
export const CitizenDetailAtom = atomWithReset<any | null>(null);

export const SystemUserAddModalAtom = atom(false);
export const CourtUserAddModalAtom = atom(false);
export const CourtUserEditModalAtom = atom(false);
