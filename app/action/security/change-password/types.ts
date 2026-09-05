import { ApiResponse } from "@/lib";
import { z } from "zod";
import { ChangePasswordSchema } from "@/app/action/security/change-password/validations";

export type UUID = string;
export type ISODateString = string;

export type ChangePasswordData = null | undefined;

export type ChangePasswordResponse = ApiResponse<ChangePasswordData>;

export type ChangePasswordPayload = z.infer<typeof ChangePasswordSchema>;
