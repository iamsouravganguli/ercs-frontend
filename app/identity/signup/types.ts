import { ApiResponse } from '@/lib/types';
import { signupSchema } from "./validation";
import { z } from "zod";

export type UUID = string;
export type ISODateString = string;

export type SignupResponseData = {
  username: string;
  role: string;
  access_expires_in: number;
  refresh_expires_at: ISODateString;
  session_id: UUID;
};

export type SignupApiResponse = ApiResponse<SignupResponseData>;

export type SignupRequest = z.infer<typeof signupSchema>;
