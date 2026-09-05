import { apiClient } from "@/lib/api-client";
import {
  ChangePhoneResponse,
  ChangePhonePayload,
} from "@/app/action/security/change-phone/types";

export const ChangePhoneService = async (
  payload: ChangePhonePayload,
): Promise<ChangePhoneResponse> => {
  try {
    const res = await apiClient.post("/profile/change-phone/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
