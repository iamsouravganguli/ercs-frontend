import { apiClient } from "@/lib/api-client";
import { ResetPasswordResponse, ResetPasswordPayload } from "./types";

export const ResetPasswordService = async (
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> => {
  try {
    const res = await apiClient.post("/auth/reset-password/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
