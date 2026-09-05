import { apiClient } from "@/lib/api-client";
import { DSCApiResponse, DSCRequest } from "./types";

export const DSCService = async (
  payload: DSCRequest,
): Promise<DSCApiResponse> => {
  try {
    const res = await apiClient.post("/dsc/create/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
