import { ApiResponse, BaseMaster } from "@/lib";
import { PermissionSchema, RoleSchema } from "./validations";
import z from "zod";

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
}

export interface RolesData extends BaseMaster {
  permissions_detail: PermissionItem[];
}

export interface PermissionsData extends BaseMaster {
  value: string;
  description: string | null;
  ui_path?: string | null;
  match_type?: string;
}

export type RoleListResponse = ApiResponse<RolesData>;
export type PermissionListResponse = ApiResponse<PermissionsData[]>;

export type RoleDetailResponse = ApiResponse<RolesData>;
export type PermissionDetailResponse = ApiResponse<PermissionsData>;

export type RoleWritePayload = z.infer<typeof RoleSchema>;
export type PermissionWritePayload = z.infer<typeof PermissionSchema>;
