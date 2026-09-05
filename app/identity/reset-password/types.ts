import { ApiResponse } from '@/lib/types';
import { z } from "zod";
import { ResetPasswordSchema } from "./validations";

export type UUID = string;
export type ISODateString = string;

export type ResetPasswordData = null | undefined;

export type ResetPasswordResponse = ApiResponse<ResetPasswordData>;

export type ResetPasswordPayload = z.infer<typeof ResetPasswordSchema>;
