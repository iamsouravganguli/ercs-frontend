import { apiClient } from "@/lib/api-client";
import {
  ChangeEmailResponse,
  ChangeEmailPayload,
} from "@/app/action/security/change-email/types";

export const ChangeEmailService = async (
  payload: ChangeEmailPayload,
): Promise<ChangeEmailResponse> => {
  try {
    const res = await apiClient.post("/profile/change-email/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
