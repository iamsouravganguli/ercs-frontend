import { ApiResponse } from "@/lib";
import { z } from "zod";
import { ChangeEmailSchema } from "@/app/action/security/change-email/validations";

export type UUID = string;
export type ISODateString = string;

export type ChangeEmailData = null | undefined;

export type ChangeEmailResponse = ApiResponse<ChangeEmailData>;

export type ChangeEmailPayload = z.infer<typeof ChangeEmailSchema>;
