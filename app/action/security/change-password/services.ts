import { apiClient } from "@/lib/api-client";
import {
  ChangePasswordResponse,
  ChangePasswordPayload,
} from "@/app/action/security/change-password/types";

export const ChangePasswordService = async (
  payload: ChangePasswordPayload,
): Promise<ChangePasswordResponse> => {
  try {
    const res = await apiClient.post("/auth/change-password/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
