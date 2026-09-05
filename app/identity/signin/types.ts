import { ApiResponse } from '@/lib/types';
import { loginSchema } from "./validations";
import { z } from "zod";

export type SigninResponseData = {
  username?: string;
  role?: string;
  access_expires_in?: number;
  refresh_expires_at?: string;
  session_id?: string;
  mfa_required?: boolean;
  challenge?: string;
  allowCredentials?: Array<{ type: string; id: string }>;
};

export type SigninApiResponse = ApiResponse<SigninResponseData>;
export type SigninRequest = z.infer<typeof loginSchema>;
