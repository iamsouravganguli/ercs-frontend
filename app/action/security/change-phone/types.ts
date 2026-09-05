import { ApiResponse } from "@/lib";
import { z } from "zod";
import { ChangePhoneSchema } from "@/app/action/security/change-phone/validations";

export type UUID = string;
export type ISODateString = string;

export type ChangePhoneData = null | undefined;

export type ChangePhoneResponse = ApiResponse<ChangePhoneData>;

export type ChangePhonePayload = z.infer<typeof ChangePhoneSchema>;
