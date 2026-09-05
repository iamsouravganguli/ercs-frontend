import { apiClient } from "@/lib/api-client";
import { SigninApiResponse, SigninRequest } from "./types";

export const SigninService = async (
  payload: SigninRequest,
): Promise<SigninApiResponse> => {
  try {
    const res = await apiClient.post("/auth/signin/", payload);
    return res.data;
  } catch (err: any) {
    throw err?.response?.data || err;
  }
};
