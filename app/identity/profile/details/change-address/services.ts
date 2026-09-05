import { apiClient } from "@/lib/api-client";
import { ChangeAddressPayload, ChangeAddressResponse } from "./types";

export const ChangeAddressService = async (
  payload: ChangeAddressPayload,
): Promise<ChangeAddressResponse> => {
  try {
    const res = await apiClient.put("/profile/update/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
